/**
 * Left Navigation Sidebar
 * Mode-based navigation for the application
 * Memoized for performance
 */

import React, { memo } from 'react';
import { AppMode } from '../../types/quiz';

interface NavItem {
  mode: AppMode;
  icon: string;
  label: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    mode: 'study',
    icon: '📚',
    label: 'Study',
    description: 'Explore skin anatomy'
  },
  {
    mode: 'quiz',
    icon: '📝',
    label: 'Quiz',
    description: 'Test your knowledge'
  },
  {
    mode: 'compare',
    icon: '⚖️',
    label: 'Compare',
    description: 'Compare conditions'
  },
  {
    mode: 'tours',
    icon: '🎯',
    label: 'Tours',
    description: 'Guided learning'
  }
];

interface LeftNavigationProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const LeftNavigationComponent: React.FC<LeftNavigationProps> = ({
  activeMode,
  onModeChange,
  collapsed,
  onToggleCollapse
}) => {
  return (
    <nav
      className={`
        fixed left-0 top-[50px] bottom-[70px] z-[60]
        bg-slate-900/95 border-r border-slate-700/70
        flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[60px]' : 'w-[180px]'}
      `}
      aria-label="Main navigation"
    >
      {/* Navigation items */}
      <div className="flex-1 py-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.mode}
            onClick={() => onModeChange(item.mode)}
            className={`
              w-full flex items-center gap-3 px-4 py-3
              transition-all duration-200
              ${activeMode === item.mode
                ? 'bg-blue-600/30 border-r-2 border-blue-400 text-blue-100'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }
            `}
            title={collapsed ? `${item.label}: ${item.description}` : undefined}
            aria-current={activeMode === item.mode ? 'page' : undefined}
          >
            <span className="text-xl" role="img" aria-hidden="true">
              {item.icon}
            </span>
            {!collapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {item.description}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-slate-700/70 p-2">
        <button
          onClick={onToggleCollapse}
          className="
            w-full flex items-center justify-center gap-2 px-3 py-2
            text-slate-500 hover:text-slate-300 hover:bg-slate-800/50
            rounded transition-colors
          "
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <span
            className={`
              text-lg transition-transform duration-300
              ${collapsed ? 'rotate-180' : ''}
            `}
          >
            ◀
          </span>
          {!collapsed && (
            <span className="text-xs">Collapse</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export const LeftNavigation = memo(LeftNavigationComponent);
LeftNavigation.displayName = 'LeftNavigation';

export default LeftNavigation;
