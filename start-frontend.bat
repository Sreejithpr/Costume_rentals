@echo off
echo Starting Costume Rental Billing System - Frontend
echo.

cd frontend

echo Checking Node.js version...
node --version
echo.

echo Checking npm version...
npm --version
echo.

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo npm install failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Starting Angular development server on http://localhost:4200
ng serve --open

pause