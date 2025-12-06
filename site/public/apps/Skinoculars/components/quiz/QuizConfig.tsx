/**
 * QuizConfig Component
 * Quiz configuration screen for selecting options before starting
 */

import React from 'react';
import { QuizConfig as QuizConfigType } from '../../types/quiz';
import { ExamLevel, QUIZ_QUESTIONS } from '../../quiz';

interface QuizConfigProps {
  config: QuizConfigType;
  onUpdateConfig: (partial: Partial<QuizConfigType>) => void;
  onStart: () => void;
  onCancel: () => void;
}

const EXAM_LEVELS: Array<{ id: ExamLevel | 'all'; label: string; description: string }> = [
  { id: 'all', label: 'All Levels', description: 'Mix of all difficulty levels' },
  { id: 'step1', label: 'USMLE Step 1', description: 'Basic science & mechanisms' },
  { id: 'step2', label: 'USMLE Step 2', description: 'Clinical correlations' },
  { id: 'step3', label: 'USMLE Step 3', description: 'Management & therapeutics' },
  { id: 'abd', label: 'ABD Dermatology', description: 'Board-style dermatology' }
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25];

export const QuizConfig: React.FC<QuizConfigProps> = ({
  config,
  onUpdateConfig,
  onStart,
  onCancel
}) => {
  // Get available question count for selected level
  const availableQuestions = config.examLevel === 'all'
    ? QUIZ_QUESTIONS.length
    : QUIZ_QUESTIONS.filter(q => q.examLevels?.includes(config.examLevel as ExamLevel)).length;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">📝</div>
        <h2 className="text-xl font-semibold text-slate-100">Quiz Configuration</h2>
        <p className="text-sm text-slate-400 mt-1">
          Customize your quiz experience
        </p>
      </div>

      {/* Configuration Options */}
      <div className="space-y-5">
        {/* Exam Level */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Exam Level
          </label>
          <div className="grid grid-cols-1 gap-2">
            {EXAM_LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => onUpdateConfig({ examLevel: level.id })}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg border text-left
                  transition-all duration-150
                  ${config.examLevel === level.id
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }
                `}
              >
                <div>
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs text-slate-400">{level.description}</div>
                </div>
                {config.examLevel === level.id && (
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {availableQuestions} questions available for this level
          </p>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Questions
          </label>
          <div className="flex gap-2 flex-wrap">
            {QUESTION_COUNTS.filter(c => c <= availableQuestions).map(count => (
              <button
                key={count}
                onClick={() => onUpdateConfig({ questionCount: count })}
                className={`
                  px-4 py-2 rounded-lg border text-sm font-medium
                  transition-all duration-150
                  ${config.questionCount === count
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                  }
                `}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Shuffle Questions */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-slate-300">Shuffle Questions</label>
            <p className="text-xs text-slate-500">Randomize question order</p>
          </div>
          <button
            onClick={() => onUpdateConfig({ shuffleQuestions: !config.shuffleQuestions })}
            className={`
              relative w-12 h-6 rounded-full transition-colors duration-200
              ${config.shuffleQuestions ? 'bg-blue-600' : 'bg-slate-700'}
            `}
          >
            <span
              className={`
                absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                ${config.shuffleQuestions ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Timed Mode */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-slate-300">Timed Mode</label>
            <p className="text-xs text-slate-500">
              {config.timed ? `${config.timePerQuestion}s per question` : 'No time limit'}
            </p>
          </div>
          <button
            onClick={() => onUpdateConfig({ timed: !config.timed })}
            className={`
              relative w-12 h-6 rounded-full transition-colors duration-200
              ${config.timed ? 'bg-blue-600' : 'bg-slate-700'}
            `}
          >
            <span
              className={`
                absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                ${config.timed ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Time per question (if timed) */}
        {config.timed && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time per Question (seconds)
            </label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(time => (
                <button
                  key={time}
                  onClick={() => onUpdateConfig({ timePerQuestion: time })}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-150
                    ${config.timePerQuestion === time
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                    }
                  `}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onCancel}
          className="
            flex-1 px-4 py-3 rounded-lg border border-slate-700
            bg-slate-800/60 text-slate-300
            hover:bg-slate-800 hover:border-slate-600
            transition-colors text-sm font-medium
          "
        >
          Cancel
        </button>
        <button
          onClick={onStart}
          disabled={availableQuestions === 0}
          className="
            flex-1 px-4 py-3 rounded-lg
            bg-blue-600 text-white font-medium
            hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors text-sm
          "
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizConfig;
