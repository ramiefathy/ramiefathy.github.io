/**
 * QuizQuestion Component
 * Displays a quiz question with vignette, prompt, and answer options
 */

import React from 'react';
import { QuizQuestion as QuizQuestionType } from '../../quiz';
import { QuizAnswerOptions } from './QuizAnswerOptions';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

// Difficulty badge colors
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  intermediate: 'bg-blue-900/50 text-blue-300 border-blue-700',
  advanced: 'bg-purple-900/50 text-purple-300 border-purple-700',
  board_prep: 'bg-amber-900/50 text-amber-300 border-amber-700'
};

// Question type labels
const TYPE_LABELS: Record<string, string> = {
  structure_identification: 'Click to Identify',
  clinical_correlation: 'Clinical Correlation',
  board_style: 'Board-Style',
  pathology_recognition: 'Pathology Recognition',
  layer_identification: 'Layer Identification',
  function_matching: 'Function Matching'
};

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  isReviewMode = false,
  showExplanation = false
}) => {
  const isClickBased = question.type === 'structure_identification' ||
                       question.type === 'pathology_recognition';

  return (
    <div className="space-y-4">
      {/* Question metadata */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Difficulty badge */}
        <span
          className={`
            px-2 py-0.5 rounded-md text-xs font-medium border
            ${DIFFICULTY_COLORS[question.difficulty] || 'bg-slate-800 text-slate-300'}
          `}
        >
          {question.difficulty.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </span>

        {/* Question type */}
        <span className="px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400 border border-slate-700">
          {TYPE_LABELS[question.type] || question.type}
        </span>

        {/* Exam levels */}
        {question.examLevels && question.examLevels.length > 0 && (
          <div className="flex items-center gap-1">
            {question.examLevels.map(level => (
              <span
                key={level}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/60 text-slate-500 uppercase"
              >
                {level}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Vignette (for board-style questions) */}
      {question.vignette && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {question.vignette}
          </p>
        </div>
      )}

      {/* Question prompt */}
      <div className="py-2">
        <h3 className="text-base font-medium text-slate-100 leading-relaxed">
          {question.leadIn || question.prompt}
        </h3>
        {question.leadIn && question.prompt !== question.leadIn && (
          <p className="text-sm text-slate-400 mt-1">{question.prompt}</p>
        )}
      </div>

      {/* Answer area */}
      {isClickBased ? (
        // Click-based question - instruction to click on 3D model
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                Click on the structure in the 3D model
              </p>
              <p className="text-xs text-slate-400">
                Rotate and explore to find the correct structure
              </p>
            </div>
          </div>

          {/* Show selected structure if any */}
          {selectedAnswer && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-sm text-slate-300">
                Selected: <span className="font-medium text-blue-300">{selectedAnswer}</span>
              </p>
            </div>
          )}

          {/* Show correct answer in review mode */}
          {isReviewMode && question.targetStructureIds && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-sm text-emerald-300">
                Correct: <span className="font-medium">{question.targetStructureIds.join(', ')}</span>
              </p>
            </div>
          )}
        </div>
      ) : question.options ? (
        // MCQ options
        <QuizAnswerOptions
          options={question.options}
          selectedAnswer={selectedAnswer}
          onSelect={onSelectAnswer}
          isReviewMode={isReviewMode}
        />
      ) : null}

      {/* Educational objective (always visible) */}
      {question.educationalObjective && !showExplanation && (
        <div className="text-xs text-slate-500 italic">
          Learning objective: {question.educationalObjective}
        </div>
      )}

      {/* Explanation (review mode) */}
      {showExplanation && question.explanation && (
        <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-300">Explanation</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {question.explanation}
          </p>

          {/* Educational objective */}
          {question.educationalObjective && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                <span className="font-medium">Learning Objective:</span> {question.educationalObjective}
              </p>
            </div>
          )}

          {/* Related structures/conditions */}
          {(question.relatedStructures?.length || question.relatedConditions?.length) && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
              {question.relatedStructures?.map(s => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-300 border border-blue-800"
                >
                  {s}
                </span>
              ))}
              {question.relatedConditions?.map(c => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded text-xs bg-purple-900/30 text-purple-300 border border-purple-800"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
