import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that listens to media query changes
 * @param query CSS media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize state with the current match result
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    // Default to false for SSR
    return false;
  });

  useEffect(() => {
    // Return early if not in browser environment
    if (typeof window === 'undefined') return undefined;

    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Update the state when matches change
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add the event listener
    // Using the older and newer APIs for wider browser support
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(updateMatches);
    }

    // Initial check
    setMatches(mediaQueryList.matches);

    // Clean up 
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', updateMatches);
      } else {
        // Fallback cleanup for older browsers
        mediaQueryList.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}