import { useState, useMemo, useCallback, useEffect } from 'react';
import { quizQuestions, CATEGORIES, type QuizQuestion } from './quizData';
import { getCaseRef, caseRegistry } from './caseRegistry';
import {
  calcXpEarned,
  getLevelForXp,
  checkNewBadges,
  loadProgress,
  saveProgress,
  LEVELS,
  type UserProgress,
  type Badge,
} from './progression';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizPhase = 'setup' | 'question' | 'results';
type AnswerState = 'unanswered' | 'correct' | 'incorrect';

interface SessionAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const difficultyColors: Record<QuizQuestion['difficulty'], string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

const categoryColors: Record<QuizQuestion['category'], string> = {
  'case-identification': 'bg-blue-100 text-blue-700',
  holding: 'bg-slate-100 text-slate-700',
  procedural: 'bg-teal-100 text-teal-700',
  jurisdiction: 'bg-orange-100 text-orange-700',
  scenario: 'bg-rose-100 text-rose-700',
};

// ─── Level-Up Toast ───────────────────────────────────────────────────────────

function LevelUpToast({ level, onDone }: { level: number; onDone: () => void }) {
  const lvl = LEVELS[level - 1];
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-slate-900 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce-once max-w-xs mx-4">
        <div className="text-4xl mb-2">🎉</div>
        <div className="text-lg font-bold mb-1">Level Up!</div>
        <div className={`text-2xl font-extrabold mb-1 ${lvl.color}`}>{lvl.title}</div>
        <div className="text-slate-400 text-sm">{lvl.description}</div>
      </div>
    </div>
  );
}

// ─── Badge Toast ──────────────────────────────────────────────────────────────

function BadgeToast({ badges, onDone }: { badges: Badge[]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {badges.map((b) => (
        <div
          key={b.id}
          className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg"
        >
          <span className="text-2xl">{b.icon}</span>
          <div>
            <div className="text-sm font-bold text-amber-800">Badge Earned!</div>
            <div className="text-xs text-amber-700">{b.title}: {b.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({
  progress,
  onStart,
}: {
  progress: UserProgress;
  onStart: (questions: QuizQuestion[]) => void;
}) {
  const currentLevel = getLevelForXp(progress.totalXp);

  const [selectedCategories, setSelectedCategories] = useState<Set<QuizQuestion['category']>>(
    new Set(currentLevel.unlockedCategories)
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<QuizQuestion['difficulty']>>(
    new Set(currentLevel.unlockedDifficulties)
  );
  const [count, setCount] = useState(10);

  const toggleCategory = (id: QuizQuestion['category']) => {
    if (!currentLevel.unlockedCategories.includes(id)) return;
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleDifficulty = (d: QuizQuestion['difficulty']) => {
    if (!currentLevel.unlockedDifficulties.includes(d)) return;
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        if (next.size === 1) return prev;
        next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  };

  const available = useMemo(
    () =>
      quizQuestions.filter(
        (q) => selectedCategories.has(q.category) && selectedDifficulties.has(q.difficulty)
      ),
    [selectedCategories, selectedDifficulties]
  );

  const handleStart = () => {
    const pool = shuffle(available).slice(0, Math.min(count, available.length));
    onStart(pool);
  };

  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Quiz Mode</h1>
        <p className="text-slate-500">
          Test your knowledge of landmark cases, procedural history, and federal jurisdiction.
        </p>
      </div>

      {/* Current level callout */}
      <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${currentLevel.ringColor} bg-white mb-6`}>
        <div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg flex-shrink-0 ${currentLevel.ringColor} ${currentLevel.color}`}
        >
          {currentLevel.level}
        </div>
        <div>
          <div className={`font-bold ${currentLevel.color}`}>{currentLevel.title}</div>
          <div className="text-xs text-slate-500">{progress.totalXp.toLocaleString()} XP total</div>
        </div>
        {nextLevel && (
          <div className="ml-auto text-right">
            <div className="text-xs text-slate-400">Next: {nextLevel.title}</div>
            <div className="text-xs font-semibold text-slate-600">
              {(nextLevel.xpRequired - progress.totalXp).toLocaleString()} XP away
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
          Question Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const unlocked = currentLevel.unlockedCategories.includes(cat.id);
            const active = selectedCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                disabled={!unlocked}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  !unlocked
                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                    : active
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    !unlocked
                      ? 'border-slate-200'
                      : active
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`}
                >
                  {active && unlocked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {!unlocked && <span className="text-slate-300 text-xs">🔒</span>}
                </div>
                <div>
                  <div className={`text-sm font-medium ${unlocked && active ? 'text-slate-900' : 'text-slate-500'}`}>
                    {cat.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{cat.description}</div>
                  {!unlocked && (
                    <div className="text-xs text-slate-400 mt-1">
                      Unlocks at {LEVELS.find((l) => l.unlockedCategories.includes(cat.id))?.title}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Difficulty</h2>
        <div className="flex gap-3">
          {(['easy', 'medium', 'hard'] as const).map((d) => {
            const unlocked = currentLevel.unlockedDifficulties.includes(d);
            const active = selectedDifficulties.has(d);
            const unlockLevel = LEVELS.find((l) => l.unlockedDifficulties.includes(d));
            return (
              <button
                key={d}
                onClick={() => toggleDifficulty(d)}
                disabled={!unlocked}
                title={!unlocked ? `Unlocks at ${unlockLevel?.title}` : undefined}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                  !unlocked
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : active
                    ? d === 'easy'
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : d === 'medium'
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-red-400 bg-red-50 text-red-800'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                {d}
                {!unlocked && <div className="text-xs font-normal">🔒 {unlockLevel?.title}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
          Number of Questions
        </h2>
        <div className="flex gap-3">
          {[5, 10, 15].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                count === n
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setCount(available.length)}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
              count === available.length && available.length > 15
                ? 'border-blue-400 bg-blue-50 text-blue-800'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{available.length}</span> questions available
        </p>
        <button
          onClick={handleStart}
          disabled={available.length === 0}
          className="px-8 py-3 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Start Quiz →
        </button>
      </div>
    </div>
  );
}

// ─── Question Screen ──────────────────────────────────────────────────────────

function QuestionScreen({
  questions,
  currentIndex,
  answers,
  onAnswer,
  onNext,
  onFinish,
}: {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: SessionAnswer[];
  onAnswer: (selectedIndex: number) => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const q = questions[currentIndex];
  const thisAnswer = answers.find((a) => a.questionId === q.id);
  const answered = !!thisAnswer;
  const isLast = currentIndex === questions.length - 1;
  const correctCount = answers.filter((a) => a.correct).length;
  const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

  const optionState = useCallback(
    (i: number): AnswerState => {
      if (!answered) return 'unanswered';
      if (i === q.correctIndex) return 'correct';
      if (i === thisAnswer.selectedIndex) return 'incorrect';
      return 'unanswered';
    },
    [answered, thisAnswer, q.correctIndex]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-slate-500">{correctCount} correct so far</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyColors[q.difficulty]}`}>
            {q.difficulty}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[q.category]}`}>
            {CATEGORIES.find((c) => c.id === q.category)?.label}
          </span>
        </div>
        <p className="text-lg font-medium text-slate-900 leading-relaxed">{q.question}</p>
      </div>

      <div className="space-y-3 mb-6">
        {q.options.map((option, i) => {
          const state = optionState(i);
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(i)}
              disabled={answered}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                state === 'correct'
                  ? 'border-green-400 bg-green-50'
                  : state === 'incorrect'
                  ? 'border-red-400 bg-red-50'
                  : answered
                  ? 'border-slate-200 bg-white opacity-60 cursor-default'
                  : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                  state === 'correct'
                    ? 'border-green-500 bg-green-500 text-white'
                    : state === 'incorrect'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-slate-300 text-slate-500'
                }`}
              >
                {state === 'correct' ? '✓' : state === 'incorrect' ? '✗' : String.fromCharCode(65 + i)}
              </span>
              <span
                className={`text-sm leading-relaxed pt-0.5 ${
                  state === 'correct'
                    ? 'text-green-800 font-medium'
                    : state === 'incorrect'
                    ? 'text-red-800'
                    : 'text-slate-700'
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`p-5 rounded-2xl mb-6 border ${
            thisAnswer.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${thisAnswer.correct ? 'text-green-800' : 'text-red-800'}`}>
            {thisAnswer.correct ? 'Correct!' : 'Not quite.'}
          </div>
          <p className={`text-sm leading-relaxed ${thisAnswer.correct ? 'text-green-700' : 'text-red-700'}`}>
            {q.explanation}
          </p>
        </div>
      )}

      {answered && (
        <div className="flex justify-end">
          {isLast ? (
            <button
              onClick={onFinish}
              className="px-8 py-3 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors shadow-sm"
            >
              See Results →
            </button>
          ) : (
            <button
              onClick={onNext}
              className="px-8 py-3 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors shadow-sm"
            >
              Next Question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  questions,
  answers,
  xpResult,
  prevLevel,
  newLevel,
  newBadges,
  onRestart,
  onViewCase,
}: {
  questions: QuizQuestion[];
  answers: SessionAnswer[];
  xpResult: ReturnType<typeof calcXpEarned>;
  prevLevel: number;
  newLevel: number;
  newBadges: Badge[];
  onRestart: () => void;
  onViewCase: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(newLevel > prevLevel);
  const [showBadges, setShowBadges] = useState(newBadges.length > 0);

  const correctCount = answers.filter((a) => a.correct).length;
  const scorePct = Math.round((correctCount / questions.length) * 100);

  const grade =
    scorePct >= 90
      ? { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-50 border-green-200' }
      : scorePct >= 70
      ? { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' }
      : scorePct >= 50
      ? { label: 'Needs Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
      : { label: 'Keep Studying', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };

  const missed = questions.filter((q) => {
    const a = answers.find((ans) => ans.questionId === q.id);
    return a && !a.correct;
  });

  // Group missed questions by their related case (null = no case link)
  const missedByCaseId = useMemo(() => {
    const map = new Map<string | null, QuizQuestion[]>();
    for (const q of missed) {
      const key = q.relatedCaseId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    // Sort: entries with a case first
    return [...map.entries()].sort((a, b) => {
      if (a[0] && !b[0]) return -1;
      if (!a[0] && b[0]) return 1;
      return 0;
    });
  }, [missed]);

  // Cases to study = unique related case ids from missed questions
  const casesToStudy = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ id: string; caseName: string; year: number; areaOfLaw: string; missCount: number }> = [];
    for (const q of missed) {
      if (q.relatedCaseId && !seen.has(q.relatedCaseId)) {
        seen.add(q.relatedCaseId);
        const ref = getCaseRef(q.relatedCaseId);
        if (ref) {
          result.push({
            ...ref,
            missCount: missed.filter((m) => m.relatedCaseId === q.relatedCaseId).length,
          });
        }
      }
    }
    return result;
  }, [missed]);

  return (
    <>
      {showLevelUp && (
        <LevelUpToast level={newLevel} onDone={() => setShowLevelUp(false)} />
      )}
      {showBadges && !showLevelUp && (
        <BadgeToast badges={newBadges} onDone={() => setShowBadges(false)} />
      )}

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Score */}
        <div className={`rounded-2xl border p-8 text-center mb-6 ${grade.bg}`}>
          <div className={`text-6xl font-bold mb-1 ${grade.color}`}>{scorePct}%</div>
          <div className={`text-xl font-semibold mb-2 ${grade.color}`}>{grade.label}</div>
          <p className="text-slate-600 text-sm">{correctCount} of {questions.length} correct</p>
        </div>

        {/* XP earned */}
        <div className="bg-slate-800 text-white rounded-2xl p-5 mb-6 flex items-center gap-5">
          <div className="text-center flex-shrink-0">
            <div className="text-3xl font-bold text-green-400">+{xpResult.totalXp}</div>
            <div className="text-xs text-slate-400">XP earned</div>
          </div>
          <div className="flex-1 text-sm text-slate-300 space-y-1">
            <div>{xpResult.baseXp} base XP × {xpResult.multiplier}× accuracy bonus</div>
            <div className="text-slate-400">{xpResult.multiplierLabel}</div>
          </div>
          {newLevel > prevLevel && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-slate-400 mb-1">Leveled up!</div>
              <div className={`font-bold ${LEVELS[newLevel - 1]?.color ?? 'text-white'}`}>
                {LEVELS[newLevel - 1]?.title}
              </div>
            </div>
          )}
        </div>

        {/* ── Study Loop: cases to review ── */}
        {casesToStudy.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-blue-900">Study These Cases</span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                {casesToStudy.length} {casesToStudy.length === 1 ? 'case' : 'cases'}
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-4">
              You missed questions linked to these cases. Review them, then quiz again.
            </p>
            <div className="space-y-2">
              {casesToStudy.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {c.year}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-800 transition-colors">
                      {c.caseName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.areaOfLaw}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                      {c.missCount} missed
                    </span>
                    <span className="text-slate-400 group-hover:text-blue-600 transition-colors font-semibold">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Fallback: misses exist but none link to a case ── */}
        {missed.length > 0 && casesToStudy.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="text-sm font-bold text-slate-700 mb-1">Review the Landmark Cases</div>
            <p className="text-xs text-slate-500 mb-4">
              The questions you missed cover procedural and jurisdictional concepts. Browse the full case library to deepen your understanding.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {caseRegistry.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.year}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-800 transition-colors truncate">
                      {c.caseName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{c.areaOfLaw}</div>
                  </div>
                  <span className="text-slate-300 group-hover:text-blue-500 font-semibold flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Perfect score: encourage deeper study ── */}
        {missed.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="text-sm font-bold text-green-800 mb-1">Perfect — keep going deeper</div>
            <p className="text-xs text-green-700 mb-4">
              You answered every question correctly. Revisit a landmark case to reinforce the doctrine behind the answers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {caseRegistry.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-200 hover:border-green-400 hover:bg-green-50 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.year}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-green-800 transition-colors truncate">
                      {c.caseName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{c.areaOfLaw}</div>
                  </div>
                  <span className="text-slate-300 group-hover:text-green-600 font-semibold flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Missed questions detail ── */}
        {missed.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
              Review Missed Questions ({missed.length})
            </h2>
            <div className="space-y-2">
              {missedByCaseId.map(([caseId, qs]) => {
                const ref = caseId ? getCaseRef(caseId) : null;
                return (
                  <div key={caseId ?? '__none__'}>
                    {/* Case group header */}
                    {ref && (
                      <div className="flex items-center justify-between px-1 py-2 mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {ref.caseName} ({ref.year})
                        </span>
                        <button
                          onClick={() => onViewCase(ref.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                          Study case →
                        </button>
                      </div>
                    )}
                    {!ref && caseId === null && qs.length > 0 && (
                      <div className="px-1 py-2 mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          General Questions
                        </span>
                      </div>
                    )}
                    <div className="space-y-2 mb-4">
                      {qs.map((q) => {
                        const isOpen = expandedId === q.id;
                        const userAnswer = answers.find((a) => a.questionId === q.id);
                        return (
                          <div key={q.id} className="border border-slate-100 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedId(isOpen ? null : q.id)}
                              className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                ✗
                              </span>
                              <span className="text-sm text-slate-800 flex-1 leading-snug">{q.question}</span>
                              <span className={`text-lg text-slate-400 transition-transform duration-150 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}>
                                ›
                              </span>
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-5 border-t border-slate-100 pt-4 space-y-3">
                                <div>
                                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">
                                    Your answer
                                  </div>
                                  <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">
                                    {userAnswer !== undefined ? q.options[userAnswer.selectedIndex] : '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">
                                    Correct answer
                                  </div>
                                  <div className="text-sm text-green-700 bg-green-50 border border-green-100 p-3 rounded-lg">
                                    {q.options[q.correctIndex]}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">
                                    Explanation
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
                                </div>
                                {ref && (
                                  <button
                                    onClick={() => onViewCase(ref.id)}
                                    className="w-full flex items-center justify-between p-3 mt-1 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center text-xs font-bold">
                                        {ref.year}
                                      </div>
                                      <span className="text-sm font-semibold text-blue-800 group-hover:text-blue-900">
                                        Study: {ref.caseName}
                                      </span>
                                    </div>
                                    <span className="text-blue-500 font-semibold">→</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New badges earned this session */}
        {newBadges.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-4">
              Badges Earned This Session
            </h2>
            <div className="flex flex-wrap gap-3">
              {newBadges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-amber-800">{b.title}</div>
                    <div className="text-xs text-amber-600">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors shadow-sm"
          >
            New Quiz
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Quiz Tab Root ────────────────────────────────────────────────────────────

export default function QuizTab({
  onViewCase,
  onProgressChange,
}: {
  onViewCase: (id: string) => void;
  onProgressChange: (p: UserProgress) => void;
}) {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [xpResult, setXpResult] = useState<ReturnType<typeof calcXpEarned> | null>(null);
  const [prevLevel, setPrevLevel] = useState(1);
  const [newLevel, setNewLevel] = useState(1);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  const handleStart = (questions: QuizQuestion[]) => {
    setSessionQuestions(questions);
    setCurrentIndex(0);
    setAnswers([]);
    setXpResult(null);
    setNewBadges([]);
    setPhase('question');
  };

  const handleAnswer = (selectedIndex: number) => {
    const q = sessionQuestions[currentIndex];
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, selectedIndex, correct: selectedIndex === q.correctIndex },
    ]);
  };

  const handleNext = () => setCurrentIndex((i) => i + 1);

  const handleFinish = () => {
    const finalAnswers = answers;
    const correctCount = finalAnswers.filter((a) => a.correct).length;
    const xp = calcXpEarned(sessionQuestions, correctCount);
    setXpResult(xp);

    const prev = loadProgress();
    const prevLvl = getLevelForXp(prev.totalXp).level;

    // Update category completions — track unique correct answer counts per question id
    const newCatCompletions = { ...prev.categoryCompletions };
    for (const q of sessionQuestions) {
      const ans = finalAnswers.find((a) => a.questionId === q.id);
      if (ans?.correct) {
        newCatCompletions[q.category] = (newCatCompletions[q.category] ?? 0) + 1;
      }
    }

    const accuracy = correctCount / sessionQuestions.length;
    const consecutiveGood = accuracy >= 0.7
      ? prev.consecutiveGoodQuizzes + 1
      : 0;

    const next: UserProgress = {
      totalXp: prev.totalXp + xp.totalXp,
      completedQuizzes: prev.completedQuizzes + 1,
      earnedBadgeIds: [...prev.earnedBadgeIds],
      categoryCompletions: newCatCompletions,
      consecutiveGoodQuizzes: consecutiveGood,
      quizHistory: [
        ...prev.quizHistory,
        {
          date: new Date().toISOString(),
          score: correctCount,
          total: sessionQuestions.length,
          xpEarned: xp.totalXp,
        },
      ],
    };

    const earned = checkNewBadges(prev, next, sessionQuestions, correctCount, sessionQuestions.length);
    next.earnedBadgeIds = [...new Set([...prev.earnedBadgeIds, ...earned.map((b) => b.id)])];

    saveProgress(next);
    onProgressChange(next);

    const newLvl = getLevelForXp(next.totalXp).level;
    setPrevLevel(prevLvl);
    setNewLevel(newLvl);
    setNewBadges(earned);
    setPhase('results');
  };

  const handleRestart = () => setPhase('setup');

  if (phase === 'setup')
    return <SetupScreen progress={loadProgress()} onStart={handleStart} />;

  if (phase === 'question')
    return (
      <QuestionScreen
        questions={sessionQuestions}
        currentIndex={currentIndex}
        answers={answers}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onFinish={handleFinish}
      />
    );

  return (
    <ResultsScreen
      questions={sessionQuestions}
      answers={answers}
      xpResult={xpResult!}
      prevLevel={prevLevel}
      newLevel={newLevel}
      newBadges={newBadges}
      onRestart={handleRestart}
      onViewCase={onViewCase}
    />
  );
}
