@echo off
echo ============================================
echo   AgriConnect — Project Startup Script
echo ============================================
echo.

REM ─── Check Node ─────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
for /f "delims=" %%i in ('node -e "process.stdout.write(process.version)"') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

REM ─── Install backend deps ────────────────────
echo.
echo [1/4] Installing backend dependencies...
cd /d f:\ppp\agriconnect\backend
call npm install
if errorlevel 1 (
  echo [ERROR] Backend npm install failed
  pause
  exit /b 1
)
echo [OK] Backend deps installed

REM ─── Install frontend deps ───────────────────
echo.
echo [2/4] Installing frontend dependencies...
cd /d f:\ppp\agriconnect\frontend
call npm install
if errorlevel 1 (
  echo [ERROR] Frontend npm install failed
  pause
  exit /b 1
)
echo [OK] Frontend deps installed

REM ─── Seed the database ───────────────────────
echo.
echo [3/4] Seeding database (demo users + market data)...
cd /d f:\ppp\agriconnect\backend
call node src/scripts/seed.js
echo [OK] Database seeded

REM ─── Start both servers ──────────────────────
echo.
echo [4/4] Starting servers...
echo.
echo   Backend  → http://localhost:5000
echo   Frontend → http://localhost:5173
echo.

REM Start backend in new terminal
start "AgriConnect Backend" cmd /k "cd /d f:\ppp\agriconnect\backend && npm run dev"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend in new terminal
start "AgriConnect Frontend" cmd /k "cd /d f:\ppp\agriconnect\frontend && npm run dev"

echo [OK] Both servers launched in separate windows.
echo.
echo Open: http://localhost:5173
echo.
echo Demo login:
echo   Farmer  — farmer@demo.com / demo1234
echo   Buyer   — buyer@demo.com  / demo1234
echo   Admin   — admin@demo.com  / demo1234
echo.
pause
