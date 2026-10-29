@echo off
echo ===============================================================
echo Project Chimera: AI-Powered Self-Healing Software System
echo College Capstone Execution Script (Windows)
echo ===============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Python 3 is not found in PATH. Some ML scripts may not run.
)

echo [1/3] Installing Dependencies...
call npm install

echo [2/3] Running Reliability Test Suite...
python tests\run_tests.py
if %errorlevel% neq 0 (
    echo [WARNING] Python test runner had issues, continuing to launch server...
)

echo [3/3] Starting Project Chimera Platform on http://localhost:3000...
echo.
echo Open your browser and navigate to: http://localhost:3000
echo.
call npm run dev
pause
