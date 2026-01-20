#!/bin/bash

# Test runner for one-click demo feature
# Runs: install, build, unit tests, E2E tests

set -e

echo "🚀 Starting demo test suite..."
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 2: Build
echo "🔨 Building project..."
npm run build
if [ $? -eq 0 ]; then
  echo "✓ Build successful"
else
  echo "✗ Build failed"
  exit 1
fi
echo ""

# Step 3: Run unit tests
echo "🧪 Running unit tests..."
npm run test -- __tests__/demo.test.ts
if [ $? -eq 0 ]; then
  echo "✓ Unit tests passed"
else
  echo "✗ Unit tests failed"
  exit 1
fi
echo ""

# Step 4: Run E2E tests (if dev server is running)
echo "🎭 Running E2E tests..."
echo "   (Make sure dev server is running: npm run dev)"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "⚠️  Dev server not running. Starting it..."
  npm run dev &
  DEV_PID=$!
  sleep 3
fi

# Run E2E tests
npm run test:e2e -- __tests__/demo.e2e.ts
E2E_RESULT=$?

# Kill dev server if we started it
if [ ! -z "$DEV_PID" ]; then
  kill $DEV_PID 2>/dev/null || true
fi

if [ $E2E_RESULT -eq 0 ]; then
  echo "✓ E2E tests passed"
else
  echo "✗ E2E tests failed"
  exit 1
fi

echo ""
echo "✅ All tests passed! Demo is ready."
echo ""
echo "📝 To run the demo manually:"
echo "   1. npm run dev"
echo "   2. Open http://localhost:3000"
echo "   3. Click 'Run Demo' button"
echo "   4. Watch the magic happen!"

