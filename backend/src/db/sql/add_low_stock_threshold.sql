-- Migration: Add low stock threshold field to products table
-- Run this after the main schema.sql

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;

-- Add index for better performance on low stock queries
CREATE INDEX IF NOT EXISTS idx_products_min_stock ON products(min_stock_level);

-- Update existing products to have a default threshold
UPDATE products SET min_stock_level = 10 WHERE min_stock_level IS NULL;