#!/bin/bash
echo "🚀 Deploying BRIRoom API..."

# Build checks
echo "✅ Running tests..."
npm run test

echo "✅ Checking dependencies..."
npm audit --audit-level high

echo "✅ Setting up production environment..."
export NODE_ENV=production

echo "✅ Starting production server..."
npm start

echo "🎉 Deployment completed!"