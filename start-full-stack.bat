@echo off
echo 🚀 Starting Costume Rental Billing System - Full Stack
echo ==================================================
echo.

:: Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker to continue
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed or not in PATH
    echo Please install Docker Compose to continue
    pause
    exit /b 1
)

echo 🐳 Starting PostgreSQL database...
docker-compose up -d postgres

:: Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul
:wait_loop
docker exec costume-rental-db pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)

echo ✅ PostgreSQL is ready!
echo.

:: Create database if it doesn't exist
echo 🗄️ Setting up database...
docker exec costume-rental-db psql -U postgres -c "CREATE DATABASE costume_rental;" 2>nul || echo Database already exists or created

echo ☕ Starting Spring Boot backend...
cd backend
start "Spring Boot Backend" mvn clean compile spring-boot:run

echo.
echo Backend starting in separate window...
echo Backend URL: http://localhost:8080/api
echo Health Check: http://localhost:8080/api/actuator/health
echo.

echo 🔧 To start the frontend, run in another terminal:
echo    cd frontend
echo    npm install
echo    ng serve
echo.

echo 📊 Database info:
echo    Host: localhost:5432
echo    Database: costume_rental
echo    Username: postgres
echo    Password: password
echo.

echo 🛑 To stop everything:
echo    Close the backend window
echo    Run: docker-compose down

pause