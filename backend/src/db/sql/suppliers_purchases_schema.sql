-- ============================================
-- INVENZA Database Schema for Supabase
-- Run this in Supabase SQL Editor to create
-- the suppliers and purchases tables
-- ============================================

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    firm_name VARCHAR(255) NOT NULL,
    person_name VARCHAR(255),
    mobile VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier models (what product models each supplier provides)
CREATE TABLE IF NOT EXISTS supplier_models (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL
);

-- Purchases (Purchase Orders) table
CREATE TABLE IF NOT EXISTS purchases (
    purchase_id SERIAL PRIMARY KEY,
    purchase_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    status VARCHAR(20) CHECK (status IN ('Pending', 'Received')) DEFAULT 'Pending',
    total_amount DECIMAL(12, 2) DEFAULT 0,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase items
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10, 2) DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suppliers_is_archived ON suppliers(is_archived);
CREATE INDEX IF NOT EXISTS idx_suppliers_firm_name ON suppliers(firm_name);
CREATE INDEX IF NOT EXISTS idx_supplier_models_supplier_id ON supplier_models(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

-- Enable Row Level Security (RLS) - optional but recommended for production
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE supplier_models ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Create policies for anon key access (if using RLS)
-- CREATE POLICY "Allow all operations for authenticated users" ON suppliers FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for authenticated users" ON supplier_models FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for authenticated users" ON purchases FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for authenticated users" ON purchase_items FOR ALL USING (true);

-- ============================================
-- Helpful views for common queries
-- ============================================

-- View: Suppliers with model count
CREATE OR REPLACE VIEW suppliers_with_model_count AS
SELECT 
    s.*,
    COUNT(sm.id) as model_count
FROM suppliers s
LEFT JOIN supplier_models sm ON s.supplier_id = sm.supplier_id
GROUP BY s.supplier_id;

-- View: Purchases with supplier info
CREATE OR REPLACE VIEW purchases_with_supplier AS
SELECT 
    p.*,
    s.firm_name as supplier_name,
    s.supplier_code as supplier_code
FROM purchases p
LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id;

-- ============================================
-- Sample data (optional - for testing)
-- ============================================

-- INSERT INTO suppliers (supplier_code, firm_name, person_name, mobile, city, state)
-- VALUES 
--     ('SUP-001', 'ABC Gas Parts', 'Ramesh Kumar', '9876543210', 'Ahmedabad', 'Gujarat'),
--     ('SUP-002', 'XYZ Steel Works', 'Suresh Patel', '9876543211', 'Rajkot', 'Gujarat');
