#!/bin/bash

# This script handles the deployment build and ensures paths are consistent
echo "Starting deployment process..."

# Build the frontend with Vite
echo "Building frontend with Vite..."
vite build

# Build the backend with esbuild 
echo "Building backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Create a symbolic link to ensure both path formats work
echo "Creating compatibility symlink..."
mkdir -p dist/server
ln -sf ../index.js dist/server/index.js

echo "Build completed successfully!"