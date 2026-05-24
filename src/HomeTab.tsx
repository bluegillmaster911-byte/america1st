import { useMemo } from 'react';
import {
  LEVELS,
  BADGES,
  getLevelForXp,
  getNextLevel,
  xpProgressIntoLevel,
  type UserProgress,
} from './progression';
import { caseRegistry } from './caseRegistry';
import { quizQuestions } from './quizData';

const FEATURE_CARDS = [
  {
    id: 'quiz',
    label: 'Quiz',
    headline: 'Test Your Knowledge',
    sub: 'Scenario questions, case holdings, and procedural history',
    accent: 'bg-blue-900',
    textAccent: 'text-blue-900',
    borderAccent: 'border-blue-200',
    bgHover: 'hover:bg-blue-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'case-history',
    label: 'Cases',
    headline: 'Landmark SCOTUS Cases',
    sub: 'Deep dives into Brown, Miranda, Nixon, Roe, and Marbury',
    accent: 'bg-slate-800',
    textAccent: 'text-slate-800',
    borderAccent: 'border-slate-200',
    bgHover: 'hover:bg-slate-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'federal-jurisdiction',
    label: 'Matrix',
    headline: 'Jurisdiction Matrix',
    sub: 'Interactive federal court system — forums, appeals, and SC review',
    accent: 'bg-teal-700',
    textAccent: 'text-teal-700',
    borderAccent: 'border-teal-100',
    bgHover: 'hover:bg-teal-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18" />
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'Progress',
    headline: 'Track Your Progress',
    sub: 'XP, levels, badges, and quiz history over time',
    accent: 'bg-amber-600',
    textAccent: 'text-amber-700',
    borderAccent: 'border-amber-100',
    bgHover: 'hover:bg-amber-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
] as const;

type TabId = (typeof FEATURE_CARDS)[number]['id'];

export default function HomeTab({
  progress,
  onNavigate,
  onViewCase,
}: {
  progress: UserProgress;
  onNavigate: (tab: TabId) => void;
  onViewCase: (id: string) => void;
}) {
  const currentLevel = getLevelForXp(progress.totalXp);
  const nextLevel = getNextLevel(currentLevel);
  const xpPct = xpProgressIntoLevel(progress.totalXp, currentLevel, nextLevel);
  const xpToNext = nextLevel ? nextLevel.xpRequired - progress.totalXp : 0;

  const recentHistory = useMemo(
    () => [...(progress.quizHistory ?? [])].reverse().slice(0, 3),
    [progress.quizHistory]
  );

  const earnedBadges = useMemo(
    () => BADGES.filter((b) => progress.earnedBadgeIds.includes(b.id)),
    [progress.earnedBadgeIds]
  );

  const nextBadge = useMemo(
    () => BADGES.find((b) => !progress.earnedBadgeIds.includes(b.id)),
    [progress.earnedBadgeIds]
  );

  const isFirstVisit = progress.completedQuizzes === 0;

  // Suggested next action
  const suggestion = useMemo(() => {
    if (isFirstVisit) return { label: 'Start your first quiz', tab: 'quiz' as TabId };
    const lastScore = recentHistory[0];
    if (lastScore && lastScore.score / lastScore.total < 0.7) {
      return { label: 'Review cases from your last quiz', tab: 'case-history' as TabId };
    }
    return { label: 'Take a quiz', tab: 'quiz' as TabId };
  }, [isFirstVisit, recentHistory]);

  // Unlocked question count
  const unlockedCount = useMemo(
    () =>
      quizQuestions.filter(
        (q) =>
          currentLevel.unlockedDifficulties.includes(q.difficulty) &&
          currentLevel.unlockedCategories.includes(q.category)
      ).length,
    [currentLevel]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* ── Hero / Level card ── */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 mb-8 relative overflow-hidden">
        {/* subtle background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Level ring */}
          <div className="flex-shrink-0">
            <div className={`w-20 h-20 rounded-2xl border-4 ${currentLevel.ringColor} bg-slate-800 flex flex-col items-center justify-center shadow-lg`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${currentLevel.color}`}>Lv</span>
              <span className={`text-3xl font-black leading-none ${currentLevel.color}`}>{currentLevel.level}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`text-2xl font-bold ${currentLevel.color}`}>{currentLevel.title}</h1>
              {progress.completedQuizzes > 0 && (
                <span className="text-xs bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full font-medium">
                  {progress.completedQuizzes} {progress.completedQuizzes === 1 ? 'quiz' : 'quizzes'} completed
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4">{currentLevel.description}</p>

            {/* XP bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r from-slate-400 to-white/80`}
                  style={{ width: `${Math.round(xpPct * 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                {progress.totalXp} XP
                {nextLevel && ` · ${xpToNext} to Lv.${nextLevel.level}`}
                {!nextLevel && ' · Max level'}
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => onNavigate('quiz')}
            className="flex-shrink-0 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm"
          >
            {isFirstVisit ? 'Start Quiz' : 'New Quiz'}
          </button>
        </div>
      </div>

      {/* ── Suggested next action ── */}
      <button
        onClick={() => onNavigate(suggestion.tab)}
        className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-8 hover:bg-blue-100 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Suggested next step</div>
            <div className="text-sm font-semibold text-blue-900">{suggestion.label}</div>
          </div>
        </div>
        <span className="text-blue-400 group-hover:text-blue-700 font-bold transition-colors">→</span>
      </button>

      {/* ── Navigation cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {FEATURE_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`flex flex-col items-start p-4 bg-white rounded-2xl border ${card.borderAccent} ${card.bgHover} transition-all hover:shadow-md group text-left`}
          >
            <div className={`w-10 h-10 rounded-xl ${card.accent} text-white flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${card.textAccent}`}>{card.label}</div>
            <div className="text-sm font-semibold text-slate-800 leading-snug">{card.headline}</div>
          </button>
        ))}
      </div>

      {/* ── Two-column detail section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Recent quiz history */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recent Quizzes</h2>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Full history →
            </button>
          </div>
          {recentHistory.length === 0 ? (
            <div className="py-6 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-slate-500">No quizzes yet — take your first one!</p>
              <button
                onClick={() => onNavigate('quiz')}
                className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                Start now →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((h, i) => {
                const pct = Math.round((h.score / h.total) * 100);
                const color = pct >= 90 ? 'text-green-700 bg-green-50' : pct >= 70 ? 'text-blue-700 bg-blue-50' : pct >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${color} flex-shrink-0 tabular-nums`}>
                      {pct}%
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 font-medium">
                        {h.score}/{h.total} correct
                      </div>
                      <div className="text-xs text-slate-400">{h.date}</div>
                    </div>
                    <span className="text-xs font-semibold text-green-600 flex-shrink-0">+{h.xpEarned} XP</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Badges</h2>
            <span className="text-xs text-slate-400 font-medium">{earnedBadges.length}/{BADGES.length} earned</span>
          </div>
          {earnedBadges.length === 0 ? (
            <div className="py-4 text-center">
              <div className="text-3xl mb-2">🏅</div>
              <p className="text-sm text-slate-500 mb-1">No badges yet</p>
              {nextBadge && (
                <p className="text-xs text-slate-400">
                  Next up: <span className="font-semibold text-slate-600">{nextBadge.icon} {nextBadge.title}</span>
                  <br /><span className="text-slate-400">{nextBadge.description}</span>
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {earnedBadges.slice(0, 6).map((b) => (
                  <div
                    key={b.id}
                    title={`${b.title} — ${b.description}`}
                    className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl cursor-default"
                  >
                    {b.icon}
                  </div>
                ))}
                {earnedBadges.length > 6 && (
                  <button
                    onClick={() => onNavigate('progress')}
                    className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    +{earnedBadges.length - 6}
                  </button>
                )}
              </div>
              {nextBadge && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-sm">
                  <span className="text-lg">{nextBadge.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Next: {nextBadge.title}</div>
                    <div className="text-xs text-slate-400">{nextBadge.description}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Level progression strip ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Level Progression</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {LEVELS.map((lvl, i) => {
            const reached = progress.totalXp >= lvl.xpRequired;
            const isCurrent = lvl.level === currentLevel.level;
            return (
              <div key={lvl.level} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-slate-900 text-white shadow-md'
                      : reached
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className={`text-xs font-bold ${isCurrent ? 'text-white' : reached ? lvl.color : 'text-slate-400'}`}>
                    Lv.{lvl.level}
                  </span>
                  <span className="text-xs font-medium leading-tight text-center whitespace-nowrap">{lvl.title}</span>
                  <span className="text-xs opacity-60">{lvl.xpRequired} XP</span>
                </div>
                {i < LEVELS.length - 1 && (
                  <div className={`w-4 h-0.5 flex-shrink-0 ${reached && lvl.level < currentLevel.level ? 'bg-slate-400' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {unlockedCount} of {quizQuestions.length} questions unlocked at your current level
        </p>
      </div>

      {/* ── Case library quick-access ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Case Library</h2>
          <button
            onClick={() => onNavigate('case-history')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            Browse all →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {caseRegistry.map((c) => (
            <button
              key={c.id}
              onClick={() => onViewCase(c.id)}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
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
    </div>
  );
}
