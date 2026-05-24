import {
  LEVELS,
  BADGES,
  getLevelForXp,
  getNextLevel,
  xpProgressIntoLevel,
  type UserProgress,
} from './progression';
import { quizQuestions, CATEGORIES } from './quizData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-1 leading-tight">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Level Chip ───────────────────────────────────────────────────────────────

function LevelChip({ levelNum, active, unlocked }: { levelNum: number; active: boolean; unlocked: boolean }) {
  const lvl = LEVELS[levelNum - 1];
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
        active
          ? `${lvl.ringColor} bg-white shadow-md scale-105`
          : unlocked
          ? 'border-slate-200 bg-white'
          : 'border-slate-100 bg-slate-50 opacity-40'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
          active ? `${lvl.ringColor} ${lvl.color}` : unlocked ? 'border-slate-300 text-slate-500' : 'border-slate-200 text-slate-300'
        }`}
      >
        {unlocked ? levelNum : '🔒'}
      </div>
      <div className={`text-xs font-semibold text-center leading-tight ${active ? lvl.color : 'text-slate-400'}`}>
        {lvl.title}
      </div>
      <div className="text-xs text-slate-400 text-center leading-tight">{lvl.xpRequired.toLocaleString()} XP</div>
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────

function CategoryBar({
  label,
  correct,
  total,
  color,
}: {
  label: string;
  correct: number;
  total: number;
  color: string;
}) {
  const p = pct(correct, total);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-700">
          {correct}/{total}
          <span className="text-slate-400 font-normal ml-1">({p}%)</span>
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ProgressTab({ progress }: { progress: UserProgress }) {
  const currentLevel = getLevelForXp(progress.totalXp);
  const nextLevel = getNextLevel(currentLevel);
  const barPct = xpProgressIntoLevel(progress.totalXp, currentLevel, nextLevel);

  const recentHistory = [...progress.quizHistory].reverse().slice(0, 10);

  // Per-category stats based on cumulative correct counts vs total questions in category
  const categoryStats = CATEGORIES.map((cat) => {
    const total = quizQuestions.filter((q) => q.category === cat.id).length;
    const correct = progress.categoryCompletions[cat.id] ?? 0;
    return { cat, total, correct };
  });

  const bestCat = [...categoryStats].sort(
    (a, b) => pct(b.correct, b.total) - pct(a.correct, a.total)
  )[0];
  const totalCorrect = Object.values(progress.categoryCompletions).reduce((s, v) => s + v, 0);
  const totalAnswered = progress.quizHistory.reduce((s, h) => s + h.total, 0);
  const overallPct = pct(totalCorrect, totalAnswered);

  const avgXpPerQuiz =
    progress.completedQuizzes > 0
      ? Math.round(progress.totalXp / progress.completedQuizzes)
      : 0;

  const categoryBarColors: Record<string, string> = {
    'case-identification': 'bg-blue-500',
    holding: 'bg-slate-500',
    procedural: 'bg-teal-500',
    jurisdiction: 'bg-orange-500',
    scenario: 'bg-rose-500',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Your Progress</h1>
        <p className="text-slate-500">XP, levels, achievements, and study stats — all in one place.</p>
      </div>

      {/* Level hero */}
      <div className="bg-slate-800 text-white rounded-2xl p-7 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center mb-5">
          <div
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-bold flex-shrink-0 ${currentLevel.ringColor}`}
          >
            {currentLevel.level}
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-baseline gap-3 mb-1">
              <span className={`text-2xl font-bold ${currentLevel.color}`}>{currentLevel.title}</span>
              <span className="text-slate-400 text-sm">{currentLevel.description}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{progress.totalXp.toLocaleString()} XP total</span>
              {nextLevel ? (
                <span>{nextLevel.xpRequired.toLocaleString()} XP for {nextLevel.title}</span>
              ) : (
                <span>Max level reached!</span>
              )}
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.round(barPct * 100)}%` }}
              />
            </div>
            {nextLevel && (
              <div className="text-xs text-slate-400 mt-1.5">
                {(nextLevel.xpRequired - progress.totalXp).toLocaleString()} XP until{' '}
                <span className={`font-semibold ${nextLevel.color}`}>{nextLevel.title}</span>
                {nextLevel.unlockedDifficulties.length > currentLevel.unlockedDifficulties.length && (
                  <span className="text-slate-500 ml-1">
                    · unlocks <span className="font-medium text-slate-400">{nextLevel.unlockedDifficulties.at(-1)}</span> difficulty
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard value={progress.totalXp.toLocaleString()} label="Total XP" />
        <StatCard value={progress.completedQuizzes} label="Quizzes Done" sub={avgXpPerQuiz > 0 ? `avg ${avgXpPerQuiz} XP each` : undefined} />
        <StatCard
          value={`${overallPct}%`}
          label="Overall Accuracy"
          sub={totalAnswered > 0 ? `${totalCorrect} of ${totalAnswered} correct` : 'No quizzes yet'}
        />
        <StatCard
          value={`${progress.earnedBadgeIds.length}/${BADGES.length}`}
          label="Badges Earned"
        />
      </div>

      {/* Category performance */}
      {progress.completedQuizzes > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Performance by Category</h2>
            {bestCat.correct > 0 && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                Best: {bestCat.cat.label}
              </span>
            )}
          </div>
          <div className="space-y-4">
            {categoryStats.map(({ cat, correct, total }) => (
              <CategoryBar
                key={cat.id}
                label={cat.label}
                correct={correct}
                total={total}
                color={categoryBarColors[cat.id]}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Counts reflect correct answers across all quizzes. Full mastery = answered every question in the category correctly.
          </p>
        </div>
      )}

      {/* Level ladder */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-5">Level Ladder</h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {LEVELS.map((lvl) => (
            <LevelChip
              key={lvl.level}
              levelNum={lvl.level}
              active={lvl.level === currentLevel.level}
              unlocked={progress.totalXp >= lvl.xpRequired}
            />
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Achievements</h2>
          <span className="text-xs text-slate-400">
            {progress.earnedBadgeIds.length} of {BADGES.length} earned
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BADGES.map((badge) => {
            const earned = progress.earnedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  earned
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <span className={`text-2xl flex-shrink-0 ${earned ? '' : 'grayscale opacity-30'}`}>
                  {badge.icon}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold truncate ${earned ? 'text-slate-900' : 'text-slate-400'}`}>
                    {badge.title}
                  </div>
                  <div className="text-xs text-slate-400 leading-snug mt-0.5">{badge.description}</div>
                </div>
                {earned && (
                  <span className="ml-auto text-green-500 text-lg flex-shrink-0">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent quiz history */}
      {recentHistory.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Recent Quizzes
          </h2>
          <div className="space-y-2">
            {recentHistory.map((h, i) => {
              const score = pct(h.score, h.total);
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 text-sm">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      score >= 90
                        ? 'bg-green-100 text-green-700'
                        : score >= 70
                        ? 'bg-blue-100 text-blue-700'
                        : score >= 50
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-700">{h.score}/{h.total} correct</div>
                    <div className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div className="text-green-700 font-semibold whitespace-nowrap">+{h.xpEarned} XP</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-slate-600 font-medium">No quizzes completed yet.</p>
          <p className="text-slate-400 text-sm mt-1">Head to the Quiz tab to earn your first XP!</p>
        </div>
      )}
    </div>
  );
}
