-- Database Migration Script: Rename actual_price to original_price in costumes table
-- Run this script manually after updating the application code

-- Connect to the costume_rental database
\c costume_rental;

-- Rename the column from actual_price to original_price
ALTER TABLE costumes RENAME COLUMN actual_price TO original_price;

-- Update any constraints that reference the old column name
-- Drop the old constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'check_actual_price_positive') THEN
        ALTER TABLE costumes DROP CONSTRAINT check_actual_price_positive;
        RAISE NOTICE 'Dropped old constraint check_actual_price_positive';
    END IF;
END $$;

-- Add constraint to ensure original_price is positive
ALTER TABLE costumes ADD CONSTRAINT IF NOT EXISTS check_original_price_positive CHECK (original_price > 0);

-- Verify the changes
\d costumes;

-- Show sample data with the renamed column
SELECT id, name, sell_price, original_price FROM costumes LIMIT 5;

-- Success message
SELECT 'Database migration completed successfully!' AS message;
SELECT 'Column actual_price renamed to original_price' AS details;