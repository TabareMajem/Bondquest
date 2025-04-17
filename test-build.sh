#!/bin/bash

# This script tests the build process to ensure it's working correctly for deployment

echo "Testing build process..."

# Run the deployment script
sh ./deploy.sh

# Check if server file exists in the expected location
if [ -f "dist/server/index.js" ]; then
  echo "✅ Server file found in correct location"
else
  echo "❌ Server file NOT found in dist/server/index.js"
  exit 1
fi

# Check if the frontend assets are built
if [ -d "dist/assets" ]; then
  echo "✅ Frontend assets found"
else
  echo "❌ Frontend assets NOT found in dist/assets"
  exit 1
fi

# Check for index.html
if [ -f "dist/index.html" ]; then
  echo "✅ Frontend index.html found"
else
  echo "❌ Frontend index.html NOT found"
  exit 1
fi

echo "Build verification complete! Your app should be ready for deployment."
echo "To start the server, use: NODE_ENV=production node dist/server/index.js"