@echo off
echo Starting Costume Rental Billing System - Backend
echo.

cd backend

echo Checking Java version...
java -version
echo.

echo Installing dependencies and starting Spring Boot application...
mvn clean install
if %errorlevel% neq 0 (
    echo Maven build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Starting the application on http://localhost:8080/api
mvn spring-boot:run

pause