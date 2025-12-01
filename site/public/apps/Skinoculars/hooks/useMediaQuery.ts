/**
 * useMediaQuery Hook
 * Responsive breakpoint detection for mobile optimization
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface MediaQueryState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
}

// Breakpoint thresholds (Tailwind defaults)
const MOBILE_MAX = 640;   // sm
const TABLET_MAX = 1024;  // lg

export function useMediaQuery(): MediaQueryState {
  const [state, setState] = useState<MediaQueryState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
        width: 1200
      };
    }

    const width = window.innerWidth;
    return {
      isMobile: width <= MOBILE_MAX,
      isTablet: width > MOBILE_MAX && width <= TABLET_MAX,
      isDesktop: width > TABLET_MAX,
      breakpoint: width <= MOBILE_MAX ? 'mobile' : width <= TABLET_MAX ? 'tablet' : 'desktop',
      width
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width <= MOBILE_MAX,
        isTablet: width > MOBILE_MAX && width <= TABLET_MAX,
        isDesktop: width > TABLET_MAX,
        breakpoint: width <= MOBILE_MAX ? 'mobile' : width <= TABLET_MAX ? 'tablet' : 'desktop',
        width
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

export default useMediaQuery;
