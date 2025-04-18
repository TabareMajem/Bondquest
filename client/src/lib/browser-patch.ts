/**
 * This module contains emergency patches for browser compatibility
 * and prevents the endless reload loops in external browsers
 */
import { BUILD_TIMESTAMP, DEPLOY_ID } from '../build-info';

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
  
  console.log(`Applying browser patches - Build: ${BUILD_TIMESTAMP}, Deploy ID: ${DEPLOY_ID}`);
  
  // Store original methods
  originalReload = window.location.reload;
  originalAssign = window.location.assign;
  originalReplace = window.location.replace;
  
  // Detect if running in external browser (not in Replit preview)
  const isReplitPreview = window.location.hostname.includes('replit');
  const isDeployedApp = window.location.hostname.includes('replit.app');
  
  // Add deployment detection to console for debugging
  if (isReplitPreview) {
    console.log("🔍 Running in Replit preview environment");
  } else if (isDeployedApp) {
    console.log("🚀 Running in deployed Replit environment");
  } else {
    console.log("🌐 Running in external browser environment");
  }
  
  // Apply patches to all environments except Replit preview
  // This ensures deployed apps also get the safety patches
  if (!isReplitPreview || isDeployedApp) {
    console.log("APPLYING BALANCED SAFETY PATCHES");
    
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
      // Always allow reloads that are triggered by auth actions
      const isAuthAction = 
        document.location.pathname.includes('/auth') || 
        document.location.pathname === '/' ||
        document.location.pathname.includes('/login') || 
        document.location.pathname.includes('/register') ||
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
        
        // Instead of reloading, dispatch a custom event for components to refresh their state
        window.dispatchEvent(new CustomEvent('app:softRefresh', { 
          detail: { 
            timestamp: BUILD_TIMESTAMP,
            deployId: DEPLOY_ID
          } 
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
    
    // Monkey-patch sessionStorage to prevent issues with app_version updates
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
    
    console.log("🛡️ Browser patches applied in balanced mode - auth will work");
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