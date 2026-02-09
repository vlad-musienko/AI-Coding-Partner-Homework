#!/bin/bash

# Customer Support System API - Demo Runner
# This script starts the application and demonstrates its functionality

set -e

echo "=========================================="
echo "Customer Support System API - Demo"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Start the server in the background
echo "🚀 Starting server..."
npm start &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if ! curl -s http://localhost:3000/tickets > /dev/null; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Server is running at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep the script running
wait $SERVER_PID
