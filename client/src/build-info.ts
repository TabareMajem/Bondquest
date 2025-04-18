/**
 * This file contains build information that should be updated during deployments
 * It is used for cache busting and version tracking
 */

// This timestamp represents the build/deployment date
// It should be updated during the deployment process
export const BUILD_TIMESTAMP = 1744950000000; // Fixed timestamp (April 18, 2025)

// Version number in semver format (can be used in addition to timestamp)
export const APP_VERSION = '1.0.0';

// Environment information
export const NODE_ENV = import.meta.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';