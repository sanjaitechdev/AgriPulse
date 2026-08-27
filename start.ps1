# AgriConnect — Full Stack Startup (PowerShell)

Write-Host "============================================" -ForegroundColor Green
Write-Host "  AgriConnect — Startup Script" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Check Node.js
try {
    $nodeVer = node --version 2>&1
    Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install backend
Write-Host "`n[1/4] Installing backend dependencies..." -ForegroundColor Cyan
Set-Location f:\ppp\agriconnect\backend
npm install
Write-Host "[OK] Backend installed" -ForegroundColor Green

# Install frontend
Write-Host "`n[2/4] Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location f:\ppp\agriconnect\frontend
npm install
Write-Host "[OK] Frontend installed" -ForegroundColor Green

# Seed database
Write-Host "`n[3/4] Seeding database..." -ForegroundColor Cyan
Set-Location f:\ppp\agriconnect\backend
node src/scripts/seed.js
Write-Host "[OK] Database seeded" -ForegroundColor Green

# Start servers
Write-Host "`n[4/4] Starting servers..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location f:\ppp\agriconnect\backend; npm run dev" -WindowStyle Normal
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location f:\ppp\agriconnect\frontend; npm run dev" -WindowStyle Normal

Write-Host "`n[OK] Both servers launched!" -ForegroundColor Green
Write-Host "`n  Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "`n  farmer@demo.com / demo1234" -ForegroundColor White
Write-Host "  buyer@demo.com  / demo1234" -ForegroundColor White
Write-Host "  admin@demo.com  / demo1234" -ForegroundColor White
