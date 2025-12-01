/**
 * QuizReview Component
 * Review mode for stepping through answered questions with explanations
 */

import React from 'react';
import { QuizQuestion as QuizQuestionType } from '../../quiz';
import { QuizAnswer } from '../../types/quiz';
import { QuizProgress } from './QuizProgress';
import { QuizQuestion } from './QuizQuestion';

interface QuizReviewProps {
  questions: QuizQuestionType[];
  answers: QuizAnswer[];
  currentIndex: number;
  onGoToQuestion: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onBackToResults: () => void;
  onExit: () => void;
}

export const QuizReview: React.FC<QuizReviewProps> = ({
  questions,
  answers,
  currentIndex,
  onGoToQuestion,
  onNext,
  onPrevious,
  onBackToResults,
  onExit
}) => {
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  if (!currentQuestion) {
    return (
      <div className="text-center py-8 text-slate-400">
        No question to display
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-slate-100">Review Mode</div>
          <div className={`
            px-2 py-0.5 rounded text-xs font-medium
            ${currentAnswer?.isCorrect
              ? 'bg-emerald-900/50 text-emerald-300'
              : 'bg-red-900/50 text-red-300'
            }
          `}>
            {currentAnswer?.isCorrect ? 'Correct' : 'Incorrect'}
          </div>
        </div>
        <button
          onClick={onBackToResults}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Back to Results
        </button>
      </div>

      {/* Progress */}
      <QuizProgress
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        answers={answers}
        onGoToQuestion={onGoToQuestion}
        isReviewMode={true}
      />

      {/* Question content - scrollable */}
      <div className="flex-1 overflow-y-auto mt-4 pr-2">
        <QuizQuestion
          question={currentQuestion}
          selectedAnswer={currentAnswer?.selectedAnswer || null}
          onSelectAnswer={() => {}}
          isReviewMode={true}
          showExplanation={true}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${isFirst
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <button
            onClick={() => {
              // Find next incorrect
              const nextIncorrect = answers.findIndex(
                (a, idx) => idx > currentIndex && !a.isCorrect
              );
              if (nextIncorrect !== -1) {
                onGoToQuestion(nextIncorrect);
              } else {
                // Wrap around
                const firstIncorrect = answers.findIndex(a => !a.isCorrect);
                if (firstIncorrect !== -1 && firstIncorrect !== currentIndex) {
                  onGoToQuestion(firstIncorrect);
                }
              }
            }}
            className="px-3 py-1.5 rounded text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          >
            Next Incorrect
          </button>
        </div>

        <button
          onClick={onNext}
          disabled={isLast}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${isLast
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }
          `}
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Exit button */}
      <div className="mt-4">
        <button
          onClick={onExit}
          className="
            w-full px-4 py-2 rounded-lg border border-slate-700
            bg-slate-800/60 text-slate-400
            hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600
            transition-colors text-sm
          "
        >
          Exit Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizReview;
