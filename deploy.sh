#!/bin/bash

# This script follows the exact same build process as defined in package.json
# to ensure compatibility with Replit deployment
echo "Starting deployment process..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist

# Run the exact same build command as in package.json
echo "Building application..."
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Copy necessary files to ensure server works correctly
echo "Copying configuration files..."
cp -r server/public dist/server/public 2>/dev/null || true
cp .env dist/ 2>/dev/null || true

# Create a symbolic link for compatibility with potential older references
echo "Creating compatibility links..."
ln -sf server/index.js dist/index.js 2>/dev/null || true

echo "Build completed successfully!"
echo "To start the application, run: NODE_ENV=production node dist/server/index.js"