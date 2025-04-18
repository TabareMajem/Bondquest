/**
 * This module contains emergency patches for browser compatibility
 * and prevents the endless reload loops in external browsers
 */

// Original window.location methods
let originalReload: Function;
let originalAssign: Function;
let originalReplace: Function;

/**
 * Apply emergency patches to prevent browser reload loops
 * Call this early in the application
 */
export function applyBrowserPatches() {
  // Only apply in browsers, not in server-side rendering
  if (typeof window === 'undefined') return;
  
  console.log("Applying browser compatibility patches");
  
  // Store original methods
  originalReload = window.location.reload;
  originalAssign = window.location.assign;
  originalReplace = window.location.replace;
  
  // Detect if running in external browser (not in Replit preview)
  const isExternalBrowser = !window.location.hostname.includes('replit');
  
  if (isExternalBrowser) {
    console.log("EXTERNAL BROWSER DETECTED - APPLYING SAFETY PATCHES");
    
    // EMERGENCY FIX: Block all reload calls in external browsers
    // @ts-ignore
    window.location.reload = function() {
      console.warn("⚠️ Blocked reload() call to prevent infinite loops");
      
      // Instead of reloading, try to refresh component state by:
      // 1. Clearing local React query cache
      if (window.__REACT_QUERY_GLOBAL_CALLBACKS) {
        console.log("🔄 Triggering React Query cache refresh instead of page reload");
        try {
          // @ts-ignore - Access React Query internals to refresh cache
          window.__REACT_QUERY_GLOBAL_CALLBACKS.forEach(cb => typeof cb === 'function' && cb());
        } catch (e) {
          console.error("Failed to refresh React Query cache:", e);
        }
      }
      
      // 2. Dispatch a custom event that components can listen for
      window.dispatchEvent(new CustomEvent('app:softRefresh', { 
        detail: { timestamp: Date.now() } 
      }));
      
      return false;
    };
    
    // Monkey-patch sessionStorage to prevent issues
    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function(key: string, value: string) {
      if (key === 'app_version') {
        console.warn("⚠️ Blocked sessionStorage app_version update to prevent infinite loops");
        return;
      }
      return originalSetItem.call(sessionStorage, key, value);
    };
    
    // Create sentinel to prevent multiple patches
    window.__PATCHED_FOR_EXTERNAL = true;
    
    console.log("🛡️ External browser patches applied successfully");
  }
}

/**
 * Remove the browser patches (if needed)
 */
export function removeBrowserPatches() {
  if (typeof window === 'undefined') return;
  if (window.__PATCHED_FOR_EXTERNAL) {
    // @ts-ignore
    window.location.reload = originalReload;
    // @ts-ignore
    window.location.assign = originalAssign;
    // @ts-ignore
    window.location.replace = originalReplace;
    
    delete window.__PATCHED_FOR_EXTERNAL;
  }
}

// Add global type declaration
declare global {
  interface Window {
    __PATCHED_FOR_EXTERNAL?: boolean;
    __REACT_QUERY_GLOBAL_CALLBACKS?: Function[];
  }
}