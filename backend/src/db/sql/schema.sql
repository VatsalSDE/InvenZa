-- Enable extensions if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- 📁 Table: login
-- =========================
CREATE TABLE IF NOT EXISTS login (
    username VARCHAR PRIMARY KEY,
    password TEXT NOT NULL
);
-- =========================
-- 📁 Table: products
-- =========================
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    product_code VARCHAR UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT CHECK (category IN ('steel', 'glass')),
    no_burners INTEGER CHECK (no_burners BETWEEN 1 AND 4),
    type_burner TEXT CHECK (type_burner IN ('Brass', 'Alloy')),
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 👥 Table: dealers
-- =========================
CREATE TABLE IF NOT EXISTS dealers (
    dealer_id SERIAL PRIMARY KEY,
    dealer_code VARCHAR UNIQUE NOT NULL,
    firm_name TEXT NOT NULL,
    person_name TEXT,
    gstin VARCHAR,
    mobile_number VARCHAR(15),
    email TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 🧾 Table: orders
-- =========================
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    order_code VARCHAR UNIQUE NOT NULL,
    dealer_id INTEGER NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    order_status TEXT DEFAULT 'Pending',
    total_amount NUMERIC(10,2),
    delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 🛒 Table: order_items
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- =========================
-- 💳 Table: payments
-- =========================
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id),
    order_id INTEGER REFERENCES orders(order_id),
    paid_amount NUMERIC(10, 2) NOT NULL,
    method TEXT CHECK (method IN ('Cash', 'UPI', 'Card', 'NEFT', 'Online', 'Bank Transfer', 'Cheque')),
    transaction_id VARCHAR UNIQUE NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);