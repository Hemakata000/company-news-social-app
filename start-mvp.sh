#!/bin/bash

echo "========================================"
echo "  Company News Social App - MVP Setup"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "Checking configuration..."
if [ ! -f "backend/.env.local" ]; then
    echo "WARNING: backend/.env.local not found!"
    echo "Please copy backend/.env.local and add your API keys."
    exit 1
fi

echo ""
echo "Running database migrations..."
cd backend
npm run migrate
cd ..

echo ""
echo "========================================"
echo "  Starting Application..."
echo "========================================"
echo ""
echo "Backend will start on: http://localhost:3001"
echo "Frontend will start on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  Servers Started!"
echo "========================================"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Open your browser to: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait
