/**
 * Quiz-related type definitions for Skinoculars
 */

import { ExamLevel, QuizQuestion } from '../quiz';

// Application modes
export type AppMode = 'study' | 'quiz' | 'compare' | 'tours';

// Quiz phases
export type QuizPhase = 'config' | 'active' | 'review' | 'results';

// Quiz configuration
export interface QuizConfig {
  examLevel: ExamLevel | 'all';
  questionCount: number;
  topicFilter: string | null;
  timed: boolean;
  timePerQuestion: number; // seconds
  shuffleQuestions: boolean;
}

// Individual answer record
export interface QuizAnswer {
  questionId: string;
  questionIndex: number;
  selectedAnswer: string | null; // letter for MCQ, structureId for click
  isCorrect: boolean;
  timeSpent: number; // seconds
}

// Complete quiz state
export interface QuizState {
  phase: QuizPhase;
  config: QuizConfig;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  startTime: Date | null;
  endTime: Date | null;
  currentQuestionStartTime: Date | null;
}

// Quiz results summary
export interface QuizResults {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number; // percentage 0-100
  timeSpent: number; // total seconds
  byCategory: Record<string, { correct: number; total: number }>;
  byExamLevel: Record<string, { correct: number; total: number }>;
  missedQuestions: Array<{
    question: QuizQuestion;
    userAnswer: string | null;
    correctAnswer: string;
  }>;
}

// Default quiz configuration
export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  examLevel: 'all',
  questionCount: 10,
  topicFilter: null,
  timed: false,
  timePerQuestion: 90,
  shuffleQuestions: true,
};

// Initial quiz state
export const INITIAL_QUIZ_STATE: QuizState = {
  phase: 'config',
  config: DEFAULT_QUIZ_CONFIG,
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: null,
  endTime: null,
  currentQuestionStartTime: null,
};
