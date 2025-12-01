/**
 * Simplified Header Component
 * Minimal header with logo and utility buttons
 * Memoized for performance
 */

import React, { memo } from 'react';

interface HeaderProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onFullscreenClick: () => void;
  isFullscreen: boolean;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({
  onSettingsClick,
  onHelpClick,
  onFullscreenClick,
  isFullscreen,
  isMobile = false,
  onMenuClick
}) => {
  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40
        bg-slate-900/95 border-b border-slate-700/70
        flex items-center justify-between px-4
        backdrop-blur-sm
        ${isMobile ? 'h-[44px]' : 'h-[50px]'}
      `}
    >
      {/* Mobile menu button */}
      {isMobile && onMenuClick && (
        <button
          onClick={onMenuClick}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-lg text-slate-400
            hover:bg-slate-800 hover:text-slate-200
            transition-colors mr-2
          "
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Logo and title */}
      <div className="flex items-center gap-2">
        <div className={isMobile ? 'text-xl' : 'text-2xl'} role="img" aria-label="Microscope">
          🔬
        </div>
        <div>
          <h1 className={`font-semibold tracking-wide text-slate-50 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Skinoculars
          </h1>
          {!isMobile && (
            <p className="text-[10px] text-slate-400">
              Interactive Skin Anatomy
            </p>
          )}
        </div>
      </div>

      {/* Utility buttons */}
      <div className="flex items-center gap-2">
        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-lg border border-slate-700
            bg-slate-800/80 text-slate-400
            hover:bg-slate-700 hover:text-slate-200
            transition-colors
          "
          title="Settings"
          aria-label="Open settings"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Help button */}
        <button
          onClick={onHelpClick}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-lg border border-slate-700
            bg-slate-800/80 text-slate-400
            hover:bg-slate-700 hover:text-slate-200
            transition-colors
          "
          title="Help (H)"
          aria-label="Open help"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Fullscreen button */}
        <button
          onClick={onFullscreenClick}
          className="
            hidden md:flex
            w-9 h-9 items-center justify-center
            rounded-lg border border-slate-700
            bg-slate-800/80 text-slate-400
            hover:bg-slate-700 hover:text-slate-200
            transition-colors
          "
          title="Fullscreen (F)"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
Header.displayName = 'Header';

export default Header;
