/**
 * Loading Screen Component
 * Displayed while 3D scene and assets are loading
 */

import React from 'react';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress = 0,
  message = 'Loading 3D model...'
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      {/* Logo */}
      <div className="text-6xl mb-8 animate-pulse">
        🔬
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-slate-100 mb-2">
        Skinoculars
      </h1>
      <p className="text-sm text-slate-400 mb-8">
        Interactive Skin Anatomy
      </p>

      {/* Progress bar */}
      <div className="w-64 mb-4">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Loading message */}
      <p className="text-xs text-slate-500">
        {message}
      </p>

      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
