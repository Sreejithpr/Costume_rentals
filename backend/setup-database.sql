-- PostgreSQL Database Setup Script for Costume Rental Billing System
-- Run this script as a PostgreSQL superuser (e.g., postgres user)

-- Create database
CREATE DATABASE costume_rental;

-- Create user
CREATE USER costume_rental_user WITH PASSWORD 'costume_rental_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE costume_rental TO costume_rental_user;

-- Connect to the database (you'll need to run this separately or use \c costume_rental)
-- Grant schema privileges
\c costume_rental;
GRANT ALL ON SCHEMA public TO costume_rental_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO costume_rental_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO costume_rental_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO costume_rental_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO costume_rental_user;

-- Success message
SELECT 'Database setup completed successfully! You can now start the Spring Boot application.' AS message;