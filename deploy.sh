#!/bin/bash

# This script handles the deployment build and ensures paths are consistent
echo "Starting deployment process..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist

# Build the frontend with Vite
echo "Building frontend with Vite..."
vite build

# Build the backend with esbuild directly to server folder
echo "Building backend with esbuild..."
mkdir -p dist/server
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Copy necessary files to ensure server works correctly
echo "Copying configuration files..."
cp -r server/public dist/server/public 2>/dev/null || true
cp .env dist/ 2>/dev/null || true

echo "Build completed successfully!"
echo "To start the application, run: NODE_ENV=production node dist/server/index.js"