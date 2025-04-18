#!/bin/bash

# This script follows the exact same build process as defined in package.json
# but with additional cache-busting steps for deployment
echo "Starting enhanced deployment process..."

# Kill any running node processes to prevent port conflicts
echo "Terminating any existing Node.js processes..."
pkill -f "node.*server/index.ts" || echo "No server processes found"
sleep 2 # Give processes time to terminate

# More aggressive cleaning of previous build artifacts and caches
echo "Performing thorough cleanup of build artifacts and caches..."
rm -rf dist
rm -rf .replit.cache
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf client/node_modules/.vite 2>/dev/null || true
rm -rf client/node_modules/.cache 2>/dev/null || true
rm -rf .cache 2>/dev/null || true

# Add a timestamp to force a clean build
TIMESTAMP=$(date +%s)
echo "export const BUILD_TIMESTAMP = ${TIMESTAMP};" > client/src/build-info.ts
echo "Added build timestamp: ${TIMESTAMP}"

# Run the build command with cache disabled
echo "Building application with cache disabled..."
VITE_CACHE_OFF=1 NODE_ENV=production vite build --force && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Create server public directory if it doesn't exist
echo "Creating server public directory..."
mkdir -p dist/server/public

# Copy frontend build to server public directory
echo "Copying frontend build to server/public..."
cp -r dist/public/* dist/server/public/

# Add a meta tag for cache busting in the HTML
echo "Adding cache-busting meta tag to HTML..."
TIMESTAMP_META="<meta name=\"build-timestamp\" content=\"${TIMESTAMP}\">"
sed -i "s|</head>|${TIMESTAMP_META}</head>|" dist/public/index.html 2>/dev/null || true
sed -i "s|</head>|${TIMESTAMP_META}</head>|" dist/server/public/index.html 2>/dev/null || true

# Copy necessary files to ensure server works correctly
echo "Copying configuration files..."
cp .env dist/ 2>/dev/null || true

# Create a symbolic link for compatibility with potential older references
echo "Creating compatibility links..."
ln -sf server/index.js dist/index.js 2>/dev/null || true

echo "Enhanced build completed successfully!"
echo "To start the application, run: NODE_ENV=production node dist/server/index.js"