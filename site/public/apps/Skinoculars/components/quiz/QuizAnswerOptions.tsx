/**
 * QuizAnswerOptions Component
 * Renders MCQ answer options with selection and review states
 */

import React from 'react';
import { QuizOption } from '../../quiz';

interface QuizAnswerOptionsProps {
  options: QuizOption[];
  selectedAnswer: string | null;
  onSelect: (optionId: string) => void;
  isReviewMode?: boolean;
  disabled?: boolean;
}

export const QuizAnswerOptions: React.FC<QuizAnswerOptionsProps> = ({
  options,
  selectedAnswer,
  onSelect,
  isReviewMode = false,
  disabled = false
}) => {
  // Letter labels for options
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-2">
      {options.map((option, idx) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = option.isCorrect;
        const letter = letters[idx] || String(idx + 1);

        // Determine styling based on state
        let optionClass = '';
        let indicatorClass = '';
        let textClass = 'text-slate-200';

        if (isReviewMode) {
          if (isCorrect) {
            // Correct answer - always highlight in review
            optionClass = 'bg-emerald-900/30 border-emerald-500';
            indicatorClass = 'bg-emerald-600 text-white';
            textClass = 'text-emerald-200';
          } else if (isSelected && !isCorrect) {
            // Wrong selection
            optionClass = 'bg-red-900/30 border-red-500';
            indicatorClass = 'bg-red-600 text-white';
            textClass = 'text-red-200';
          } else {
            // Unselected wrong answer
            optionClass = 'bg-slate-800/40 border-slate-700 opacity-60';
            indicatorClass = 'bg-slate-700 text-slate-400';
            textClass = 'text-slate-400';
          }
        } else {
          // Active quiz mode
          if (isSelected) {
            optionClass = 'bg-blue-900/40 border-blue-500';
            indicatorClass = 'bg-blue-600 text-white';
            textClass = 'text-blue-100';
          } else {
            optionClass = 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600';
            indicatorClass = 'bg-slate-700 text-slate-300 group-hover:bg-slate-600';
          }
        }

        return (
          <button
            key={option.id}
            onClick={() => !disabled && !isReviewMode && onSelect(option.id)}
            disabled={disabled || isReviewMode}
            className={`
              group w-full flex items-start gap-3 p-3 rounded-lg border
              transition-all duration-150 text-left
              ${optionClass}
              ${disabled || isReviewMode ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            {/* Letter indicator */}
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-lg
                flex items-center justify-center
                text-sm font-semibold
                transition-colors duration-150
                ${indicatorClass}
              `}
            >
              {isReviewMode && isCorrect ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : isReviewMode && isSelected && !isCorrect ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                letter
              )}
            </div>

            {/* Option text */}
            <div className={`flex-1 pt-1 text-sm ${textClass}`}>
              {option.text}
            </div>

            {/* Selection indicator (active mode only) */}
            {!isReviewMode && isSelected && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QuizAnswerOptions;
