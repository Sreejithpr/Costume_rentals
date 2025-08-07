#!/bin/bash

echo "Starting Costume Rental Billing System - Frontend"
echo

cd frontend

echo "Checking Node.js version..."
node --version
echo

echo "Checking npm version..."
npm --version
echo

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "npm install failed!"
    exit 1
fi

echo
echo "Starting Angular development server on http://localhost:4200"
ng serve --open