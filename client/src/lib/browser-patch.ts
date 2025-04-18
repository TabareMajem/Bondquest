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
    console.log("EXTERNAL BROWSER DETECTED - APPLYING GENTLE SAFETY PATCHES");
    
    // Prevent excessive reload loops, but still allow intentional actions 
    // like login/register to work properly
    
    // Track reload count to prevent infinite loops but allow initial manual reloads
    let reloadCounter = 0;
    const MAX_RELOADS = 2;
    
    // Store the counter in session storage to persist across page loads
    const storedCounter = sessionStorage.getItem('reload_counter');
    if (storedCounter) {
      reloadCounter = parseInt(storedCounter, 10);
    }
    
    // SAFETY FIX: Intelligently manage reload calls in external browsers
    // @ts-ignore
    window.location.reload = function() {
      // Allow reloads that are triggered by login/signup actions
      const isAuthAction = 
        document.location.pathname.includes('/auth') || 
        document.location.pathname === '/' ||
        document.location.pathname.includes('/login') || 
        document.location.pathname.includes('/signup');
        
      if (isAuthAction) {
        console.log("✅ Allowing reload for authentication action");
        // Reset the counter for auth actions
        sessionStorage.setItem('reload_counter', '0');
        return originalReload.apply(window.location, arguments);
      }
      
      // Check if we've reloaded too many times
      if (reloadCounter >= MAX_RELOADS) {
        console.warn(`⚠️ Blocked reload() after ${MAX_RELOADS} successive reloads to prevent infinite loops`);
        
        // Dispatch a custom event for soft refresh
        window.dispatchEvent(new CustomEvent('app:softRefresh', { 
          detail: { timestamp: Date.now() } 
        }));
        
        return false;
      }
      
      // Increment and store the counter
      reloadCounter++;
      sessionStorage.setItem('reload_counter', reloadCounter.toString());
      console.log(`Reload ${reloadCounter}/${MAX_RELOADS} permitted`);
      
      // Allow this reload
      return originalReload.apply(window.location, arguments);
    };
    
    // Monkey-patch sessionStorage to prevent issues
    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function(key: string, value: string) {
      if (key === 'app_version' && value.includes('now')) {
        console.warn("⚠️ Blocked dangerous sessionStorage app_version update");
        return;
      }
      return originalSetItem.call(sessionStorage, key, value);
    };
    
    // Create sentinel to prevent multiple patches
    window.__PATCHED_FOR_EXTERNAL = true;
    
    console.log("🛡️ External browser patches applied in balanced mode - auth will work");
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