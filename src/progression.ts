// ─── Level Definitions ────────────────────────────────────────────────────────

export interface Level {
  level: number;
  title: string;
  description: string;
  xpRequired: number; // total XP needed to reach this level
  unlockedDifficulties: Array<'easy' | 'medium' | 'hard'>;
  unlockedCategories: Array<'case-identification' | 'holding' | 'procedural' | 'jurisdiction' | 'scenario'>;
  color: string;
  ringColor: string;
}

export const LEVELS: Level[] = [
  {
    level: 1,
    title: 'Elementary',
    description: 'Just starting out',
    xpRequired: 0,
    unlockedDifficulties: ['easy'],
    unlockedCategories: ['case-identification', 'holding'],
    color: 'text-slate-600',
    ringColor: 'border-slate-400',
  },
  {
    level: 2,
    title: 'Middle School',
    description: 'Building foundational knowledge',
    xpRequired: 100,
    unlockedDifficulties: ['easy'],
    unlockedCategories: ['case-identification', 'holding', 'procedural', 'jurisdiction'],
    color: 'text-green-700',
    ringColor: 'border-green-500',
  },
  {
    level: 3,
    title: 'High School',
    description: 'Solid understanding',
    xpRequired: 300,
    unlockedDifficulties: ['easy', 'medium'],
    unlockedCategories: ['case-identification', 'holding', 'procedural', 'jurisdiction', 'scenario'],
    color: 'text-teal-700',
    ringColor: 'border-teal-500',
  },
  {
    level: 4,
    title: 'College Freshman',
    description: 'Starting to think like a law student',
    xpRequired: 700,
    unlockedDifficulties: ['easy', 'medium'],
    unlockedCategories: ['case-identification', 'holding', 'procedural', 'jurisdiction', 'scenario'],
    color: 'text-blue-700',
    ringColor: 'border-blue-500',
  },
  {
    level: 5,
    title: 'Paralegal',
    description: 'Strong practical knowledge',
    xpRequired: 1400,
    unlockedDifficulties: ['easy', 'medium', 'hard'],
    unlockedCategories: ['case-identification', 'holding', 'procedural', 'jurisdiction', 'scenario'],
    color: 'text-amber-700',
    ringColor: 'border-amber-500',
  },
  {
    level: 6,
    title: 'Lawyer',
    description: 'Law school level understanding',
    xpRequired: 2500,
    unlockedDifficulties: ['easy', 'medium', 'hard'],
    unlockedCategories: ['case-identification', 'holding', 'procedural', 'jurisdiction', 'scenario'],
    color: 'text-orange-700',
    ringColor: 'border-orange-500',
  },
  {
    level: 7,
    title: 'Partner',
    description: 'Expert level — full access + special badges',
    xpRequired: 4000,
    unlockedDifficulties: ['easy', 'medium', 'hard'],
    unlockedCategories: ['case-identification', 'holding', 'procedural', 'jurisdiction', 'scenario'],
    color: 'text-rose-700',
    ringColor: 'border-rose-500',
  },
];

// ─── Badge Definitions ────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: 'first-quiz', title: 'First Steps', description: 'Complete your first quiz', icon: '🎓' },
  { id: 'perfect-score', title: 'Perfect Score', description: 'Get 100% on any quiz', icon: '⭐' },
  { id: 'cat-holding', title: 'Black Letter Law', description: 'Complete all Holdings & Doctrine questions', icon: '⚖️' },
  { id: 'cat-procedural', title: 'By the Book', description: 'Complete all Procedural History questions', icon: '📋' },
  { id: 'cat-jurisdiction', title: 'Forum Selection', description: 'Complete all Jurisdiction questions', icon: '🏛️' },
  { id: 'cat-scenario', title: 'Case Ready', description: 'Complete all Scenario questions', icon: '🔎' },
  { id: 'cat-identification', title: 'Name That Case', description: 'Complete all Case Identification questions', icon: '📚' },
  { id: 'hard-master', title: 'Hard Knocks', description: 'Get 80%+ on a Hard-only quiz', icon: '🏆' },
  { id: 'streak-3', title: 'On a Roll', description: 'Complete 3 quizzes in a row with 70%+', icon: '🔥' },
  { id: 'level-5', title: 'Paralegal', description: 'Reach Level 5', icon: '💼' },
  { id: 'level-7', title: 'Made Partner', description: 'Reach Level 7', icon: '⚡' },
];

// ─── XP Calculation ───────────────────────────────────────────────────────────

const DIFFICULTY_XP: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

const ACCURACY_MULTIPLIERS = [
  { threshold: 1.0, multiplier: 2.0, label: '2× Perfect score!' },
  { threshold: 0.9, multiplier: 1.5, label: '1.5× Excellent!' },
  { threshold: 0.7, multiplier: 1.25, label: '1.25× Good job!' },
  { threshold: 0.5, multiplier: 1.0, label: '1× Keep going!' },
  { threshold: 0, multiplier: 0.5, label: '0.5× Keep studying!' },
];

export function calcXpEarned(
  questions: Array<{ difficulty: 'easy' | 'medium' | 'hard' }>,
  correctCount: number
): { baseXp: number; multiplier: number; multiplierLabel: string; totalXp: number } {
  const baseXp = questions.reduce((sum, q) => sum + DIFFICULTY_XP[q.difficulty], 0);
  const accuracy = questions.length > 0 ? correctCount / questions.length : 0;
  const entry = ACCURACY_MULTIPLIERS.find((e) => accuracy >= e.threshold)!;
  const totalXp = Math.round(baseXp * entry.multiplier);
  return { baseXp, multiplier: entry.multiplier, multiplierLabel: entry.label, totalXp };
}

// ─── Level Lookup ─────────────────────────────────────────────────────────────

export function getLevelForXp(xp: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
  }
  return current;
}

export function getNextLevel(currentLevel: Level): Level | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function xpProgressIntoLevel(xp: number, current: Level, next: Level | null): number {
  if (!next) return 1;
  const span = next.xpRequired - current.xpRequired;
  const into = xp - current.xpRequired;
  return Math.min(into / span, 1);
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export interface UserProgress {
  totalXp: number;
  completedQuizzes: number;
  earnedBadgeIds: string[];
  categoryCompletions: Record<string, number>; // category id → correct count
  consecutiveGoodQuizzes: number; // for streak-3 badge
  quizHistory: Array<{ date: string; score: number; total: number; xpEarned: number }>;
}

const STORAGE_KEY = 'lawStudyProgress_v1';

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserProgress;
  } catch {
    // ignore
  }
  return {
    totalXp: 0,
    completedQuizzes: 0,
    earnedBadgeIds: [],
    categoryCompletions: {},
    consecutiveGoodQuizzes: 0,
    quizHistory: [],
  };
}

export function saveProgress(p: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ─── Badge Checking ───────────────────────────────────────────────────────────

import { quizQuestions, CATEGORIES } from './quizData';

export function checkNewBadges(
  prev: UserProgress,
  next: UserProgress,
  sessionQuestions: Array<{ category: string; difficulty: string }>,
  correctCount: number,
  total: number
): Badge[] {
  const newBadges: Badge[] = [];
  const already = new Set(prev.earnedBadgeIds);
  const earn = (id: string) => {
    if (!already.has(id)) {
      const badge = BADGES.find((b) => b.id === id);
      if (badge) newBadges.push(badge);
    }
  };

  if (next.completedQuizzes >= 1) earn('first-quiz');
  if (correctCount === total) earn('perfect-score');
  if (getLevelForXp(next.totalXp).level >= 5) earn('level-5');
  if (getLevelForXp(next.totalXp).level >= 7) earn('level-7');
  if (next.consecutiveGoodQuizzes >= 3) earn('streak-3');

  // Hard-only 80%+
  const allHard = sessionQuestions.every((q) => q.difficulty === 'hard');
  if (allHard && correctCount / total >= 0.8) earn('hard-master');

  // Category completions — check if every question in each category has been answered correctly
  for (const cat of CATEGORIES) {
    const catTotal = quizQuestions.filter((q) => q.category === cat.id).length;
    const catCorrect = next.categoryCompletions[cat.id] ?? 0;
    if (catCorrect >= catTotal) {
      const badgeId = `cat-${cat.id === 'case-identification' ? 'identification' : cat.id}`;
      earn(badgeId);
    }
  }

  return newBadges;
}
