@echo off
echo ========================================
echo   Company News Social App - MVP Setup
echo ========================================
echo.

REM Check if node_modules exists
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Checking configuration...
if not exist "backend\.env.local" (
    echo WARNING: backend\.env.local not found!
    echo Please copy backend\.env.local and add your API keys.
    pause
    exit /b 1
)

echo.
echo Running database migrations...
cd backend
call npm run migrate
cd ..

echo.
echo ========================================
echo   Starting Application...
echo ========================================
echo.
echo Backend will start on: http://localhost:3001
echo Frontend will start on: http://localhost:5173
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend in new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Open your browser to: http://localhost:5173
echo.
echo To stop servers: Close the terminal windows
echo.
pause
