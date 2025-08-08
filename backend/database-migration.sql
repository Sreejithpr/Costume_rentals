-- Database Migration Script: Remove last_name column and make email optional
-- Run this script manually after updating the application code

-- Connect to the costume_rental database
\c costume_rental;

-- Remove the last_name column from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS last_name;

-- Make email column nullable (if it's not already)
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Remove unique constraint on email if it exists (since email is now optional)
-- Note: This will only work if the constraint exists
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
    EXCEPTION 
        WHEN others THEN NULL;
    END;
END $$;

-- Update any existing data if needed
-- (No specific updates needed for this migration)

-- Verify the changes
\d customers;

-- Success message
SELECT 'Database migration completed successfully!' AS message;
SELECT 'Customers table structure updated: last_name column removed, email is now optional' AS details;