import quizQuestionsData from './data/quizQuestions.json';
import categoriesData from './data/categories.json';

export interface QuizQuestion {
  id: string;
  category: 'case-identification' | 'procedural' | 'holding' | 'jurisdiction' | 'scenario';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedCaseId?: string;
}

export const quizQuestions = quizQuestionsData as QuizQuestion[];

export const CATEGORIES = categoriesData as { id: QuizQuestion['category']; label: string; description: string }[];
