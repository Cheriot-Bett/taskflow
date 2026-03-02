#!/bin/bash
# TaskFlow - Start development servers

echo "🚀 Starting TaskFlow..."

# Kill any existing instances
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start backend
echo "📡 Starting API server on :3001..."
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!

sleep 1

# Check backend health
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "✅ API running at http://localhost:3001"
else
  echo "❌ Backend failed to start"
  exit 1
fi

# Start frontend dev server
echo "🌐 Starting frontend on :3000..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ TaskFlow is running!"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:3001"
echo ""
echo "Demo credentials:"
echo "   alice@example.com / password123 (Admin)"
echo "   bob@example.com / password123"
echo ""
echo "Press Ctrl+C to stop"
wait
