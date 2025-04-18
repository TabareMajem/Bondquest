#!/bin/bash

# SUPER AGGRESSIVE CACHE BUSTING DEPLOYMENT SCRIPT
# This script forces a 100% clean deployment by clearing all caches and rebuilding everything
# Run this script before deploying to ensure the latest changes are included

echo "Starting ultra-clean deployment process..."

# Kill any processes that might interfere with the deployment
echo "Terminating any existing processes..."
pkill -f "node" || echo "No Node.js processes found"
pkill -f "npm" || echo "No npm processes found"
sleep 3 # Give processes time to terminate

# Create backup of critical files
echo "Creating backups..."
mkdir -p .deployment-backup
cp package.json .deployment-backup/ 2>/dev/null || true
cp package-lock.json .deployment-backup/ 2>/dev/null || true

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove ALL build artifacts and caches - extremely aggressive cleanup
echo "Performing complete cleanup..."
rm -rf dist
rm -rf .replit.cache
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf client/node_modules/.vite 2>/dev/null || true
rm -rf client/node_modules/.cache 2>/dev/null || true
rm -rf .cache 2>/dev/null || true
rm -rf .vercel 2>/dev/null || true
rm -rf .next 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Generate completely new version markers in multiple places to force rebuild
TIMESTAMP=$(date +%s)
RANDOM_SUFFIX=$(openssl rand -hex 4)
DEPLOY_ID="${TIMESTAMP}_${RANDOM_SUFFIX}"

# Create or update version files
echo "export const BUILD_TIMESTAMP = ${TIMESTAMP};" > client/src/build-info.ts
echo "export const DEPLOY_ID = '${DEPLOY_ID}';" >> client/src/build-info.ts
echo "console.log('Deployment ID: ${DEPLOY_ID}');" >> client/src/build-info.ts

# Add special HTML comment in index.html to verify the correct version is deployed
sed -i.bak "s|</head>|<!-- DEPLOY_VERSION: ${DEPLOY_ID} --></head>|" client/index.html || true
rm -f client/index.html.bak 2>/dev/null || true

echo "Added build identifiers: ${DEPLOY_ID}"

# Make the browser-patch.ts file detect ALL environments as potentially problematic
echo "Updating browser patches to work in all environments..."
sed -i.bak 's/const isExternalBrowser = !window.location.hostname.includes(.replit.)/const isExternalBrowser = true;/' client/src/lib/browser-patch.ts || true
rm -f client/src/lib/browser-patch.ts.bak 2>/dev/null || true

# Clear browser cache instruction
echo ""
echo "======================= CRITICAL STEPS ============================"
echo "For a successful deployment, you MUST:"
echo "1. Clear your browser cache completely (Ctrl+Shift+Delete)"
echo "2. Deploy using the Replit deploy button"
echo "3. After deployment completes, wait 30 seconds"
echo "4. Open the app in a NEW incognito/private window"
echo "5. Verify the DEPLOY_ID in browser console matches: ${DEPLOY_ID}"
echo "=================================================================="
echo ""

echo "Ready for deployment! Use the Replit deploy button now."