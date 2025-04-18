#!/bin/bash

# This script forces a clean deployment by clearing all caches and rebuilding the app
# Run this script before deploying to ensure the latest changes are included

echo "Starting forced clean deployment process..."

# Kill any processes that might interfere with the deployment
echo "Terminating any existing Node.js processes..."
pkill -f "node" || echo "No server processes found"
sleep 2 # Give processes time to terminate

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove all build artifacts and caches
echo "Performing complete cleanup..."
rm -rf dist
rm -rf .replit.cache
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf client/node_modules/.vite 2>/dev/null || true
rm -rf client/node_modules/.cache 2>/dev/null || true
rm -rf .cache 2>/dev/null || true

# Add timestamp to force rebuild
TIMESTAMP=$(date +%s)
echo "export const BUILD_TIMESTAMP = ${TIMESTAMP};" > client/src/build-info.ts
echo "Added build timestamp: ${TIMESTAMP}"

# Clear browser cache instruction
echo ""
echo "======================= IMPORTANT ============================"
echo "Before deployment, please do the following:"
echo "1. Clear your browser cache completely (Ctrl+Shift+Delete)"
echo "2. Deploy using the Replit deploy button"
echo "3. After deployment, open the app in an incognito/private window"
echo "=============================================================="
echo ""

echo "Ready for deployment! Run deploy.sh or use the Replit deploy button now."