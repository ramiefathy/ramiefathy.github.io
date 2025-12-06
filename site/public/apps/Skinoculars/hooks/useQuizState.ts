/**
 * useQuizState Hook
 * Manages quiz state machine with config, active, review, and results phases
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  QuizState,
  QuizConfig,
  QuizAnswer,
  QuizPhase,
  QuizResults,
  DEFAULT_QUIZ_CONFIG,
  INITIAL_QUIZ_STATE
} from '../types/quiz';
import {
  QuizQuestion,
  ExamLevel,
  QUIZ_QUESTIONS,
  getQuestionsByExamLevel
} from '../quiz';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface UseQuizStateReturn {
  // State
  state: QuizState;
  currentQuestion: QuizQuestion | null;
  isLastQuestion: boolean;
  progress: { current: number; total: number; percentage: number };
  timeRemaining: number | null;

  // Actions
  updateConfig: (partial: Partial<QuizConfig>) => void;
  startQuiz: () => void;
  submitAnswer: (answer: string | null) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  finishQuiz: () => void;
  reviewQuiz: () => void;
  resetQuiz: () => void;

  // Results
  results: QuizResults | null;
}

export function useQuizState(): UseQuizStateReturn {
  const [state, setState] = useState<QuizState>(INITIAL_QUIZ_STATE);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<(() => void) | null>(null);

  // Current question
  const currentQuestion = useMemo(() => {
    if (state.questions.length === 0) return null;
    return state.questions[state.currentIndex] || null;
  }, [state.questions, state.currentIndex]);

  // Is last question
  const isLastQuestion = useMemo(() => {
    return state.currentIndex >= state.questions.length - 1;
  }, [state.currentIndex, state.questions.length]);

  // Progress
  const progress = useMemo(() => {
    const total = state.questions.length;
    const current = state.currentIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  }, [state.currentIndex, state.questions.length]);

  // Timer effect - runs every second when timed mode is active
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only run timer in active phase with timed mode
    if (state.phase !== 'active' || !state.config.timed) {
      setTimeRemaining(null);
      return;
    }

    // Initialize timer for current question
    setTimeRemaining(state.config.timePerQuestion);

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          // Time's up - auto-advance to next question
          if (autoAdvanceRef.current) {
            autoAdvanceRef.current();
          }
          return state.config.timePerQuestion; // Reset for next question
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.phase, state.config.timed, state.config.timePerQuestion, state.currentIndex]);

  // Calculate results
  const results = useMemo((): QuizResults | null => {
    if (state.phase !== 'results' && state.phase !== 'review') return null;

    const totalQuestions = state.questions.length;
    const answeredQuestions = state.answers.filter(a => a.selectedAnswer !== null).length;
    const correctAnswers = state.answers.filter(a => a.isCorrect).length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Calculate time spent
    const timeSpent = state.answers.reduce((sum, a) => sum + a.timeSpent, 0);

    // By category (using question type as category)
    const byCategory: Record<string, { correct: number; total: number }> = {};
    state.questions.forEach((q, idx) => {
      const answer = state.answers[idx];
      if (!byCategory[q.type]) {
        byCategory[q.type] = { correct: 0, total: 0 };
      }
      byCategory[q.type].total++;
      if (answer?.isCorrect) {
        byCategory[q.type].correct++;
      }
    });

    // By exam level
    const byExamLevel: Record<string, { correct: number; total: number }> = {};
    state.questions.forEach((q, idx) => {
      const answer = state.answers[idx];
      (q.examLevels || []).forEach(level => {
        if (!byExamLevel[level]) {
          byExamLevel[level] = { correct: 0, total: 0 };
        }
        byExamLevel[level].total++;
        if (answer?.isCorrect) {
          byExamLevel[level].correct++;
        }
      });
    });

    // Missed questions
    const missedQuestions = state.questions
      .map((q, idx) => ({
        question: q,
        answer: state.answers[idx]
      }))
      .filter(({ answer }) => !answer?.isCorrect)
      .map(({ question, answer }) => {
        // Find correct answer
        let correctAnswer = '';
        if (question.options) {
          const correct = question.options.find(o => o.isCorrect);
          correctAnswer = correct?.text || correct?.id || '';
        } else if (question.targetStructureIds) {
          correctAnswer = question.targetStructureIds.join(', ');
        }
        return {
          question,
          userAnswer: answer?.selectedAnswer || null,
          correctAnswer
        };
      });

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      score,
      timeSpent,
      byCategory,
      byExamLevel,
      missedQuestions
    };
  }, [state.phase, state.questions, state.answers]);

  // Update config
  const updateConfig = useCallback((partial: Partial<QuizConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...partial }
    }));
  }, []);

  // Start quiz
  const startQuiz = useCallback(() => {
    setState(prev => {
      // Get question pool
      let pool: QuizQuestion[] = [...QUIZ_QUESTIONS];

      // Filter by exam level
      if (prev.config.examLevel !== 'all') {
        pool = getQuestionsByExamLevel(prev.config.examLevel as ExamLevel);
      }

      // Filter by topic if specified
      if (prev.config.topicFilter) {
        pool = pool.filter(q =>
          q.relatedStructures?.includes(prev.config.topicFilter!) ||
          q.relatedConditions?.includes(prev.config.topicFilter!) ||
          q.targetStructureIds?.includes(prev.config.topicFilter!)
        );
      }

      // Shuffle if needed
      if (prev.config.shuffleQuestions) {
        pool = shuffleArray(pool);
      }

      // Take requested count
      const questions = pool.slice(0, prev.config.questionCount);

      // Initialize answers array
      const answers: QuizAnswer[] = questions.map((q, idx) => ({
        questionId: q.id,
        questionIndex: idx,
        selectedAnswer: null,
        isCorrect: false,
        timeSpent: 0
      }));

      return {
        ...prev,
        phase: 'active' as QuizPhase,
        questions,
        currentIndex: 0,
        answers,
        startTime: new Date(),
        endTime: null,
        currentQuestionStartTime: new Date()
      };
    });

    // Reset timer if timed mode
    setTimeRemaining(null);
  }, []);

  // Submit answer for current question
  const submitAnswer = useCallback((answer: string | null) => {
    setState(prev => {
      if (prev.phase !== 'active') return prev;

      const question = prev.questions[prev.currentIndex];
      if (!question) return prev;

      // Determine if correct
      let isCorrect = false;
      if (question.options) {
        // MCQ - check if selected option is correct
        const selectedOption = question.options.find(o => o.id === answer);
        isCorrect = selectedOption?.isCorrect || false;
      } else if (question.targetStructureIds) {
        // Click-based - check if clicked structure matches
        isCorrect = question.targetStructureIds.includes(answer || '');
      }

      // Calculate time spent on this question
      const now = new Date();
      const timeSpent = prev.currentQuestionStartTime
        ? Math.round((now.getTime() - prev.currentQuestionStartTime.getTime()) / 1000)
        : 0;

      // Update answer
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentIndex] = {
        questionId: question.id,
        questionIndex: prev.currentIndex,
        selectedAnswer: answer,
        isCorrect,
        timeSpent
      };

      return {
        ...prev,
        answers: newAnswers
      };
    });
  }, []);

  // Go to next question
  const nextQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex >= prev.questions.length - 1) return prev;
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        currentQuestionStartTime: new Date()
      };
    });
  }, []);

  // Set up auto-advance callback for timer
  useEffect(() => {
    autoAdvanceRef.current = () => {
      setState(prev => {
        if (prev.currentIndex >= prev.questions.length - 1) {
          // Last question - finish quiz
          return {
            ...prev,
            phase: 'results' as QuizPhase,
            endTime: new Date()
          };
        }
        // Move to next question
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
          currentQuestionStartTime: new Date()
        };
      });
    };
  }, []);

  // Go to previous question
  const previousQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex <= 0) return prev;
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
        currentQuestionStartTime: new Date()
      };
    });
  }, []);

  // Go to specific question
  const goToQuestion = useCallback((index: number) => {
    setState(prev => {
      if (index < 0 || index >= prev.questions.length) return prev;
      return {
        ...prev,
        currentIndex: index,
        currentQuestionStartTime: new Date()
      };
    });
  }, []);

  // Finish quiz - go to results
  const finishQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'results' as QuizPhase,
      endTime: new Date()
    }));
  }, []);

  // Review quiz - go to review mode
  const reviewQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'review' as QuizPhase,
      currentIndex: 0
    }));
  }, []);

  // Reset quiz - back to config
  const resetQuiz = useCallback(() => {
    setState({
      ...INITIAL_QUIZ_STATE,
      config: DEFAULT_QUIZ_CONFIG
    });
    setTimeRemaining(null);
  }, []);

  return {
    state,
    currentQuestion,
    isLastQuestion,
    progress,
    timeRemaining,
    updateConfig,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    finishQuiz,
    reviewQuiz,
    resetQuiz,
    results
  };
}

export default useQuizState;
