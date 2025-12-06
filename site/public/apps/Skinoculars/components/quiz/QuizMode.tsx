/**
 * QuizMode Component
 * Main container that orchestrates the entire quiz experience
 * Handles state machine transitions between config, active, review, and results phases
 * With mobile-responsive support
 */

import React, { useCallback, useEffect } from 'react';
import { useQuizState } from '../../hooks/useQuizState';
import { QuizConfig } from './QuizConfig';
import { QuizProgress } from './QuizProgress';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import { QuizReview } from './QuizReview';

interface QuizModeProps {
  onExit: () => void;
  onRequestClickMode?: (enabled: boolean, targetStructure?: string) => void; // Request click mode from parent
  clickedStructureId?: string | null; // Structure ID clicked by user in 3D scene
  isMobile?: boolean;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  onExit,
  onRequestClickMode,
  clickedStructureId,
  isMobile = false
}) => {
  const {
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
  } = useQuizState();

  // Determine if current question is click-based
  const isClickBasedQuestion = currentQuestion && (
    currentQuestion.type === 'structure_identification' ||
    currentQuestion.type === 'pathology_recognition'
  );

  // Request click mode from parent when we have a click-based question
  useEffect(() => {
    if (onRequestClickMode) {
      if (state.phase === 'active' && isClickBasedQuestion) {
        // Enable click mode, optionally pass the target structure for highlighting
        onRequestClickMode(true, currentQuestion?.targetStructureIds?.[0]);
      } else {
        // Disable click mode
        onRequestClickMode(false);
      }
    }
  }, [onRequestClickMode, state.phase, isClickBasedQuestion, currentQuestion?.targetStructureIds]);

  // Handle when user clicks a structure in the 3D scene
  useEffect(() => {
    if (clickedStructureId && state.phase === 'active' && isClickBasedQuestion) {
      // Submit the clicked structure as the answer
      submitAnswer(clickedStructureId);
    }
  }, [clickedStructureId, state.phase, isClickBasedQuestion, submitAnswer]);

  // Handle answer submission and auto-advance
  const handleSubmitAndNext = useCallback(() => {
    if (isLastQuestion) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  }, [isLastQuestion, finishQuiz, nextQuestion]);

  // Handle exit
  const handleExit = useCallback(() => {
    resetQuiz();
    onExit();
  }, [resetQuiz, onExit]);

  // Handle retry
  const handleRetry = useCallback(() => {
    resetQuiz();
  }, [resetQuiz]);

  // Handle back to results from review
  const handleBackToResults = useCallback(() => {
    // Set phase back to results
    finishQuiz();
  }, [finishQuiz]);

  // Render based on phase
  const renderContent = () => {
    switch (state.phase) {
      case 'config':
        return (
          <div className="p-6">
            <QuizConfig
              config={state.config}
              onUpdateConfig={updateConfig}
              onStart={startQuiz}
              onCancel={handleExit}
            />
          </div>
        );

      case 'active':
        if (!currentQuestion) {
          return (
            <div className="p-6 text-center text-slate-400">
              Loading question...
            </div>
          );
        }

        return (
          <div className="flex flex-col h-full p-4">
            {/* Progress bar */}
            <QuizProgress
              currentIndex={state.currentIndex}
              totalQuestions={state.questions.length}
              answers={state.answers}
              onGoToQuestion={goToQuestion}
              timeRemaining={timeRemaining}
            />

            {/* Question content - scrollable */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              <QuizQuestion
                question={currentQuestion}
                selectedAnswer={state.answers[state.currentIndex]?.selectedAnswer || null}
                onSelectAnswer={submitAnswer}
                isReviewMode={false}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={previousQuestion}
                disabled={state.currentIndex === 0}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors
                  ${state.currentIndex === 0
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
                {/* Skip button */}
                {!state.answers[state.currentIndex]?.selectedAnswer && (
                  <button
                    onClick={handleSubmitAndNext}
                    className="px-3 py-1.5 rounded text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                  >
                    Skip
                  </button>
                )}

                {/* Finish early button */}
                <button
                  onClick={finishQuiz}
                  className="px-3 py-1.5 rounded text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                >
                  Finish Quiz
                </button>
              </div>

              <button
                onClick={handleSubmitAndNext}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors
                  ${state.answers[state.currentIndex]?.selectedAnswer
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }
                `}
              >
                {isLastQuestion ? 'Finish' : 'Next'}
                {!isLastQuestion && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        );

      case 'results':
        if (!results) {
          return (
            <div className="p-6 text-center text-slate-400">
              Calculating results...
            </div>
          );
        }

        return (
          <div className="p-6 overflow-y-auto max-h-full">
            <QuizResults
              results={results}
              onReview={reviewQuiz}
              onRetry={handleRetry}
              onExit={handleExit}
            />
          </div>
        );

      case 'review':
        return (
          <div className="flex flex-col h-full p-4">
            <QuizReview
              questions={state.questions}
              answers={state.answers}
              currentIndex={state.currentIndex}
              onGoToQuestion={goToQuestion}
              onNext={nextQuestion}
              onPrevious={previousQuestion}
              onBackToResults={handleBackToResults}
              onExit={handleExit}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-slate-900/95 border-l border-slate-700/70 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/70 bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="text-lg">📝</div>
          <h2 className="text-sm font-semibold text-slate-100">Quiz Mode</h2>
          {state.phase !== 'config' && (
            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 capitalize">
              {state.phase}
            </span>
          )}
        </div>
        <button
          onClick={handleExit}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          title="Exit quiz"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default QuizMode;
