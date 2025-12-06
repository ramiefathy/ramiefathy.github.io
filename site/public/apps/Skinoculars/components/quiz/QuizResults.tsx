/**
 * QuizResults Component
 * Displays quiz results with score breakdown, stats, and actions
 */

import React from 'react';
import { QuizResults as QuizResultsType } from '../../types/quiz';

interface QuizResultsProps {
  results: QuizResultsType;
  onReview: () => void;
  onRetry: () => void;
  onExit: () => void;
}

// Score grade thresholds
const getGrade = (score: number): { label: string; color: string; emoji: string } => {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400', emoji: '🏆' };
  if (score >= 80) return { label: 'Great', color: 'text-blue-400', emoji: '🌟' };
  if (score >= 70) return { label: 'Good', color: 'text-cyan-400', emoji: '👍' };
  if (score >= 60) return { label: 'Passing', color: 'text-amber-400', emoji: '📚' };
  return { label: 'Keep Studying', color: 'text-red-400', emoji: '💪' };
};

export const QuizResults: React.FC<QuizResultsProps> = ({
  results,
  onReview,
  onRetry,
  onExit
}) => {
  const grade = getGrade(results.score);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Category labels
  const categoryLabels: Record<string, string> = {
    structure_identification: 'Structure ID',
    clinical_correlation: 'Clinical',
    board_style: 'Board-Style',
    pathology_recognition: 'Pathology',
    layer_identification: 'Layers',
    function_matching: 'Functions'
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Score header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{grade.emoji}</div>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Quiz Complete!</h2>
        <p className={`text-lg font-medium ${grade.color}`}>{grade.label}</p>
      </div>

      {/* Main score */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-white mb-2">
            {results.score}%
          </div>
          <div className="text-sm text-slate-400">
            {results.correctAnswers} of {results.totalQuestions} correct
          </div>
        </div>

        {/* Progress ring visualization */}
        <div className="relative w-24 h-24 mx-auto mt-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={results.score >= 70 ? 'text-emerald-500' : results.score >= 50 ? 'text-amber-500' : 'text-red-500'}
              strokeDasharray={`${results.score * 2.51} 251`}
            />
          </svg>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-xl font-semibold text-emerald-400">
              {results.correctAnswers}
            </div>
            <div className="text-xs text-slate-500">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-red-400">
              {results.totalQuestions - results.correctAnswers}
            </div>
            <div className="text-xs text-slate-500">Incorrect</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-blue-400">
              {formatTime(results.timeSpent)}
            </div>
            <div className="text-xs text-slate-500">Time</div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(results.byCategory).length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Performance by Category</h3>
          <div className="space-y-2">
            {Object.entries(results.byCategory)
              .filter(([_, data]) => data.total > 0)
              .map(([category, data]) => {
                const pct = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={category} className="flex items-center gap-3">
                    <div className="flex-1 text-xs text-slate-400 truncate">
                      {categoryLabels[category] || category}
                    </div>
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-slate-300 w-16 text-right">
                      {data.correct}/{data.total} ({pct}%)
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Exam level breakdown */}
      {Object.keys(results.byExamLevel).length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Performance by Exam Level</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(results.byExamLevel)
              .filter(([_, data]) => data.total > 0)
              .map(([level, data]) => {
                const pct = Math.round((data.correct / data.total) * 100);
                return (
                  <div
                    key={level}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      ${pct >= 70
                        ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800'
                        : pct >= 50
                          ? 'bg-amber-900/30 text-amber-300 border border-amber-800'
                          : 'bg-red-900/30 text-red-300 border border-red-800'
                      }
                    `}
                  >
                    {level.toUpperCase()}: {pct}% ({data.correct}/{data.total})
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Missed questions summary */}
      {results.missedQuestions.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Questions to Review ({results.missedQuestions.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {results.missedQuestions.slice(0, 5).map((missed, idx) => (
              <div
                key={missed.question.id}
                className="flex items-start gap-2 text-xs"
              >
                <span className="text-red-400 mt-0.5">•</span>
                <span className="text-slate-400 line-clamp-2">
                  {missed.question.prompt}
                </span>
              </div>
            ))}
            {results.missedQuestions.length > 5 && (
              <div className="text-xs text-slate-500 pl-4">
                +{results.missedQuestions.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onExit}
          className="
            flex-1 px-4 py-3 rounded-lg border border-slate-700
            bg-slate-800/60 text-slate-300
            hover:bg-slate-800 hover:border-slate-600
            transition-colors text-sm font-medium
          "
        >
          Exit
        </button>
        <button
          onClick={onReview}
          className="
            flex-1 px-4 py-3 rounded-lg border border-blue-700
            bg-blue-900/30 text-blue-300
            hover:bg-blue-900/50 hover:border-blue-600
            transition-colors text-sm font-medium
          "
        >
          Review Answers
        </button>
        <button
          onClick={onRetry}
          className="
            flex-1 px-4 py-3 rounded-lg
            bg-blue-600 text-white font-medium
            hover:bg-blue-500
            transition-colors text-sm
          "
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
