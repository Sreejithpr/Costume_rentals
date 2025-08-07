#!/bin/bash

echo "Starting Costume Rental Billing System - Backend"
echo

cd backend

echo "Checking Java version..."
java -version
echo

echo "Installing dependencies and starting Spring Boot application..."
mvn clean install
if [ $? -ne 0 ]; then
    echo "Maven build failed!"
    exit 1
fi

echo
echo "Starting the application on http://localhost:8080/api"
mvn spring-boot:run