/**
 * This file contains build-time information to force cache busting in browsers.
 * The BUILD_TIMESTAMP is updated each time force-deploy.sh is run.
 */

export const BUILD_TIMESTAMP = Date.now();
export const BUILD_VERSION = '1.0.1'; // Increment this when making significant changes

// Append timestamp to global CSS URLs to force cache invalidation
export function appendCacheBuster(url: string): string {
  if (!url.includes('?')) {
    return `${url}?v=${BUILD_TIMESTAMP}`;
  } else {
    return `${url}&v=${BUILD_TIMESTAMP}`;
  }
}