#!/bin/bash

echo "🚀 Starting Costume Rental Billing System - Full Stack"
echo "=================================================="
echo

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker to continue"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed or not in PATH"
    echo "Please install Docker Compose to continue"
    exit 1
fi

echo "🐳 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=30
while ! docker exec costume-rental-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
done

echo "✅ PostgreSQL is ready!"
echo

# Create database if it doesn't exist
echo "🗄️  Setting up database..."
docker exec costume-rental-db psql -U postgres -c "CREATE DATABASE IF NOT EXISTS costume_rental;" 2>/dev/null || echo "Database already exists or created"

echo "☕ Starting Spring Boot backend..."
cd backend
mvn clean compile spring-boot:run &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Backend URL: http://localhost:8080/api"
echo "Health Check: http://localhost:8080/api/actuator/health"
echo

echo "🔧 To start the frontend, run in another terminal:"
echo "   cd frontend"
echo "   npm install"
echo "   ng serve"
echo

echo "📊 Database info:"
echo "   Host: localhost:5432"
echo "   Database: costume_rental"
echo "   Username: postgres"
echo "   Password: password"
echo

echo "🛑 To stop everything:"
echo "   Press Ctrl+C to stop the backend"
echo "   Run: docker-compose down"

# Wait for the backend process
wait $BACKEND_PID