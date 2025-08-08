-- Database Migration Script: Rename daily_rental_price to sell_price in costumes table
-- Run this script manually after updating the application code

-- Connect to the costume_rental database
\c costume_rental;

-- Rename the column from daily_rental_price to sell_price
ALTER TABLE costumes RENAME COLUMN daily_rental_price TO sell_price;

-- Update any constraints that reference the old column name
-- Note: The constraint names might be auto-generated, so check first
-- You can view constraints with: \d costumes

-- If there are any check constraints on the old column, they might need to be recreated
-- First drop the old constraint (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%daily_rental_price%') THEN
        -- This will need to be adjusted based on the actual constraint name
        -- ALTER TABLE costumes DROP CONSTRAINT constraint_name_here;
        RAISE NOTICE 'Check constraints on daily_rental_price column may need manual update';
    END IF;
END $$;

-- Add constraint to ensure sell_price is positive (if not already exists)
ALTER TABLE costumes ADD CONSTRAINT IF NOT EXISTS check_sell_price_positive CHECK (sell_price > 0);

-- Verify the changes
\d costumes;

-- Show sample data with the renamed column
SELECT id, name, sell_price, original_price FROM costumes LIMIT 5;

-- Success message
SELECT 'Database migration completed successfully!' AS message;
SELECT 'Column daily_rental_price renamed to sell_price' AS details;