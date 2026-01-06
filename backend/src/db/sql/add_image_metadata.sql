-- Migration: Add image metadata fields to products table
-- Run this after the main schema.sql

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_public_id VARCHAR,
ADD COLUMN IF NOT EXISTS image_format VARCHAR(10),
ADD COLUMN IF NOT EXISTS image_width INTEGER,
ADD COLUMN IF NOT EXISTS image_height INTEGER,
ADD COLUMN IF NOT EXISTS image_size INTEGER;

-- Add index for better performance on image queries
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);
CREATE INDEX IF NOT EXISTS idx_products_image_public_id ON products(image_public_id);