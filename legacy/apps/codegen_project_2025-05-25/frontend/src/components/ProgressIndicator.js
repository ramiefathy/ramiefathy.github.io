import React from 'react';

/**
 * A reusable React component to provide visual feedback on the status of long-running operations.
 * It shows loading states, progress, and completion.
 *
 * @param {object} props - The component props.
 * @param {'idle' | 'processing' | 'completed' | 'error'} props.status - The current status of the operation.
 * @param {string} [props.message] - A custom message to display. Defaults to status-specific messages.
 * @param {number} [props.progress] - The progress percentage (0-100) for 'processing' status.
 * @returns {JSX.Element} The ProgressIndicator component.
 */
const ProgressIndicator = ({ status = 'idle', message = '', progress = 0 }) => {
  let indicatorContent;
  let indicatorClasses = 'p-4 rounded-lg text-center shadow-md'; // Basic styling for the container

  switch (status) {
    case 'idle':
      indicatorContent = (
        <div className="flex items-center justify-center">
          <p className="text-gray-600 text-lg font-medium">Ready to start processing.</p>
        </div>
      );
      indicatorClasses += ' bg-white border border-gray-200';
      break;
    case 'processing':
      indicatorContent = (
        <div>
          <div className="flex items-center justify-center mb-3">
            {/* Simple spinner animation using Tailwind CSS */}
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500 mr-4"></div>
            <p className="text-blue-700 text-lg font-semibold">{message || 'Processing documents...'}</p>
          </div>
          {/* Progress bar, only visible if progress is provided */}
          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} // Ensure progress is between 0 and 100
              ></div>
            </div>
          )}
        </div>
      );
      indicatorClasses += ' bg-blue-100 border border-blue-200';
      break;
    case 'completed':
      indicatorContent = (
        <div className="flex items-center justify-center">
          {/* Checkmark icon */}
          <svg className="h-10 w-10 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-green-700 text-lg font-semibold">{message || 'Processing completed successfully!'}</p>
        </div>
      );
      indicatorClasses += ' bg-green-100 border border-green-200';
      break;
    case 'error':
      indicatorContent = (
        <div className="flex items-center justify-center">
          {/* Exclamation mark icon */}
          <svg className="h-10 w-10 text-red-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-red-700 text-lg font-semibold">{message || 'An error occurred during processing.'}</p>
        </div>
      );
      indicatorClasses += ' bg-red-100 border border-red-200';
      break;
    default:
      indicatorContent = (
        <div className="flex items-center justify-center">
          <p className="text-gray-500 text-lg">Unknown status.</p>
        </div>
      );
      indicatorClasses += ' bg-white border border-gray-200';
      break;
  }

  return (
    <div className={indicatorClasses}>
      {indicatorContent}
    </div>
  );
};

export default ProgressIndicator;