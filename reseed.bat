@echo off
echo.
echo ===================================================
echo   AgriConnect — Re-seed Database
echo   (Clears demo users and re-creates them correctly)
echo ===================================================
echo.
cd /d f:\ppp\agriconnect\backend
node src/scripts/seed.js
echo.
pause
