-- Database Migration Script: Add actual_price column to costumes table
-- Run this script manually after updating the application code

-- Connect to the costume_rental database
\c costume_rental;

-- Add original_price column to costumes table
ALTER TABLE costumes ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Set default values for existing records (can be same as sell_price initially)
UPDATE costumes SET original_price = sell_price WHERE original_price IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE costumes ALTER COLUMN original_price SET NOT NULL;

-- Add constraint to ensure original_price is positive
ALTER TABLE costumes ADD CONSTRAINT check_original_price_positive CHECK (original_price > 0);

-- Verify the changes
\d costumes;

-- Show sample data
SELECT id, name, sell_price, original_price FROM costumes LIMIT 5;

-- Success message
SELECT 'Database migration completed successfully!' AS message;
SELECT 'Costumes table updated: original_price column added' AS details;