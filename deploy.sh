#!/bin/bash

# This script follows the exact same build process as defined in package.json
# to ensure compatibility with Replit deployment
echo "Starting deployment process..."

# Kill any running node processes to prevent port conflicts
echo "Terminating any existing Node.js processes..."
pkill -f "node.*server/index.ts" || echo "No server processes found"
sleep 2 # Give processes time to terminate

# Clean previous build and node_modules to ensure clean deps
echo "Cleaning previous build and node_modules..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf client/node_modules/.vite 2>/dev/null || true
rm -rf .cache 2>/dev/null || true

# Run the exact same build command as in package.json
echo "Building application..."
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Create server public directory if it doesn't exist
echo "Creating server public directory..."
mkdir -p dist/server/public

# Copy frontend build to server public directory
echo "Copying frontend build to server/public..."
cp -r dist/public/* dist/server/public/

# Copy necessary files to ensure server works correctly
echo "Copying configuration files..."
cp .env dist/ 2>/dev/null || true

# Create a symbolic link for compatibility with potential older references
echo "Creating compatibility links..."
ln -sf server/index.js dist/index.js 2>/dev/null || true

echo "Build completed successfully!"
echo "To start the application, run: NODE_ENV=production node dist/server/index.js"