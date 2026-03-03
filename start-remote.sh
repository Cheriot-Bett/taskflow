#!/bin/bash
# TaskFlow - Start with remote access via localtunnel
# Usage: ./start-remote.sh

set -e

PROJECT_DIR="$(dirname "$0")"

echo "🚀 Starting TaskFlow with remote access..."

# Kill existing instances
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "localtunnel\|lt --port" 2>/dev/null || true
sleep 1

# Start backend
echo "📡 Starting API server on :3001..."
cd "$PROJECT_DIR/backend"
node server.js > /tmp/taskflow-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

if ! curl -s http://localhost:3001/api/health > /dev/null; then
  echo "❌ Backend failed to start. Check /tmp/taskflow-backend.log"
  exit 1
fi
echo "✅ Backend running (PID $BACKEND_PID)"

# Start frontend
echo "🌐 Starting frontend on :3000..."
cd "$PROJECT_DIR/frontend"
node_modules/.bin/vite --port 3000 --host > /tmp/taskflow-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Frontend failed to start. Check /tmp/taskflow-frontend.log"
  exit 1
fi
echo "✅ Frontend running (PID $FRONTEND_PID)"

# Start tunnels
echo "🔗 Starting localtunnels..."
npx localtunnel --port 3000 > /tmp/lt-frontend.log 2>&1 &
LT_FRONT_PID=$!
npx localtunnel --port 3001 > /tmp/lt-api.log 2>&1 &
LT_API_PID=$!

sleep 5

FRONTEND_URL=$(grep -o 'https://[^ ]*' /tmp/lt-frontend.log 2>/dev/null | head -1)
API_URL=$(grep -o 'https://[^ ]*' /tmp/lt-api.log 2>/dev/null | head -1)

echo ""
echo "✨ TaskFlow is running remotely!"
echo ""
echo "   🌐 App:  ${FRONTEND_URL:-http://localhost:3000}"
echo "   📡 API:  ${API_URL:-http://localhost:3001}"
echo ""
echo "⚠️  Note: Localtunnel shows a splash page on first visit."
echo "   Click 'Click to Continue' to proceed."
echo ""
echo "Demo credentials:"
echo "   alice@example.com / password123 (Admin)"
echo "   bob@example.com / password123"
echo ""
echo "Press Ctrl+C to stop all services"

# Save URLs for reference
echo "FRONTEND_URL=$FRONTEND_URL" > /tmp/taskflow-urls.env
echo "API_URL=$API_URL" >> /tmp/taskflow-urls.env

wait
