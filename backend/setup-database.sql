-- PostgreSQL Database Setup Script for Costume Rental Billing System
-- Run this script as a PostgreSQL superuser (e.g., postgres user)

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE costume_rental'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'costume_rental')\gexec

-- Connect to the database
\c costume_rental;

-- Success message
SELECT 'Database setup completed successfully! You can now start the Spring Boot application.' AS message;