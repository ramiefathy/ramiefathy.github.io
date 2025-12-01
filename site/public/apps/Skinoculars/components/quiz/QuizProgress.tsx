/**
 * QuizProgress Component
 * Displays quiz progress bar and question navigation dots
 */

import React from 'react';
import { QuizAnswer } from '../../types/quiz';

interface QuizProgressProps {
  currentIndex: number;
  totalQuestions: number;
  answers: QuizAnswer[];
  onGoToQuestion?: (index: number) => void;
  isReviewMode?: boolean;
  timeRemaining?: number | null;
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentIndex,
  totalQuestions,
  answers,
  onGoToQuestion,
  isReviewMode = false,
  timeRemaining
}) => {
  const percentage = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const answeredCount = answers.filter(a => a.selectedAnswer !== null).length;

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Header with counts and timer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-slate-300">
            Question <span className="font-semibold text-white">{currentIndex + 1}</span> of{' '}
            <span className="font-semibold text-white">{totalQuestions}</span>
          </span>
          {!isReviewMode && (
            <span className="text-slate-500">
              {answeredCount} answered
            </span>
          )}
        </div>

        {/* Timer */}
        {timeRemaining !== null && timeRemaining !== undefined && (
          <div
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg
              ${timeRemaining <= 10
                ? 'bg-red-900/50 text-red-300 animate-pulse'
                : timeRemaining <= 30
                  ? 'bg-amber-900/50 text-amber-300'
                  : 'bg-slate-800 text-slate-300'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono font-medium">
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Question dots navigation */}
      {totalQuestions <= 25 && (
        <div className="flex flex-wrap gap-1.5 justify-center py-2">
          {Array.from({ length: totalQuestions }, (_, idx) => {
            const answer = answers[idx];
            const isCurrent = idx === currentIndex;
            const isAnswered = answer?.selectedAnswer !== null;
            const isCorrect = answer?.isCorrect;

            // Determine dot style
            let dotClass = 'bg-slate-700 border-slate-600';
            if (isReviewMode && isAnswered) {
              dotClass = isCorrect
                ? 'bg-emerald-600/50 border-emerald-500'
                : 'bg-red-600/50 border-red-500';
            } else if (isAnswered) {
              dotClass = 'bg-blue-600/50 border-blue-500';
            }

            if (isCurrent) {
              dotClass += ' ring-2 ring-white ring-offset-1 ring-offset-slate-900';
            }

            return (
              <button
                key={idx}
                onClick={() => onGoToQuestion?.(idx)}
                disabled={!onGoToQuestion}
                className={`
                  w-6 h-6 rounded-md border text-xs font-medium
                  transition-all duration-150
                  ${dotClass}
                  ${onGoToQuestion ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                `}
                title={`Question ${idx + 1}${isAnswered ? ' (answered)' : ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Summary for many questions */}
      {totalQuestions > 25 && (
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-600/50 border border-blue-500" />
            <span>Answered ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600" />
            <span>Remaining ({totalQuestions - answeredCount})</span>
          </div>
          {isReviewMode && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-600/50 border border-emerald-500" />
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-600/50 border border-red-500" />
                <span>Incorrect</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizProgress;
