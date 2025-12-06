import React, { useState, useCallback } from 'react';
import { ShareableState, URLStateManager } from '../utils/urlState';

interface ShareButtonProps {
  getState: () => ShareableState;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ getState, className }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyLink = useCallback(async () => {
    const state = getState();
    const success = await URLStateManager.copyShareLink(state);

    if (success) {
      setTooltipText('Link copied!');
    } else {
      setTooltipText('Failed to copy');
    }
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
    setIsMenuOpen(false);
  }, [getState]);

  const handleShareNative = useCallback(async () => {
    const state = getState();
    const url = URLStateManager.getShareLink(state);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Skinoculars - Interactive Skin Anatomy',
          text: 'Check out this view of skin anatomy!',
          url
        });
        setIsMenuOpen(false);
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  }, [getState, handleCopyLink]);

  const handleOpenInNew = useCallback(() => {
    const state = getState();
    const url = URLStateManager.getShareLink(state);
    window.open(url, '_blank');
    setIsMenuOpen(false);
  }, [getState]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-300 whitespace-nowrap">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700" />
        </div>
      )}

      {/* Dropdown menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-slate-200 text-[11px] text-left transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy link
            </button>

            {typeof navigator.share === 'function' && (
              <button
                onClick={handleShareNative}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-slate-200 text-[11px] text-left transition-colors border-t border-slate-800"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Share via...
              </button>
            )}

            <button
              onClick={handleOpenInNew}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 text-slate-200 text-[11px] text-left transition-colors border-t border-slate-800"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Compact share icon button (for toolbar)
 */
export const ShareIconButton: React.FC<{
  getState: () => ShareableState;
  className?: string;
}> = ({ getState, className }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const state = getState();
    const success = await URLStateManager.copyShareLink(state);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getState]);

  return (
    <button
      onClick={handleClick}
      title={copied ? 'Copied!' : 'Copy share link'}
      className={`
        p-2 rounded-md transition-all
        ${copied
          ? 'bg-green-600/20 text-green-400'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }
        ${className}
      `}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
};

export default ShareButton;
