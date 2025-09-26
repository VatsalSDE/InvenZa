-- Billing Module Database Schema
-- This extends the existing inventory system with complete billing functionality

-- Bills table - Main billing information
CREATE TABLE IF NOT EXISTS bills (
    bill_id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    dealer_id INTEGER REFERENCES dealers(dealer_id),
    dealer_name VARCHAR(255) NOT NULL,
    dealer_email VARCHAR(255),
    dealer_mobile VARCHAR(20),
    dealer_address TEXT,
    
    -- Bill details
    bill_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 9.0,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 9.0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    amount_in_words TEXT,
    
    -- Payment and status
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, overdue
    payment_method VARCHAR(50),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill items table - Individual items in each bill
CREATE TABLE IF NOT EXISTS bill_items (
    item_id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(bill_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill payments table - Track payment history
CREATE TABLE IF NOT EXISTS bill_payments (
    payment_id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(bill_id),
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill templates table - Customizable bill layouts
CREATE TABLE IF NOT EXISTS bill_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'standard', -- standard, professional, minimal
    header_logo_url TEXT,
    company_name VARCHAR(255),
    company_address TEXT,
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    company_gstin VARCHAR(20),
    footer_text TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill settings table - System-wide billing configuration
CREATE TABLE IF NOT EXISTS bill_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default bill template
INSERT INTO bill_templates (template_name, template_type, company_name, company_address, company_phone, company_email, company_gstin, footer_text) VALUES
('Standard Template', 'standard', 'Vinayak Lakshmi Gas Stoves', '123 Main Street, City, State - PIN', '+91 98765 43210', 'info@vinayaklakshmi.com', 'GSTIN123456789', 'Thank you for your business!');

-- Insert default bill settings
INSERT INTO bill_settings (setting_key, setting_value, setting_description) VALUES
('default_cgst_rate', '9.0', 'Default CGST rate percentage'),
('default_sgst_rate', '9.0', 'Default SGST rate percentage'),
('bill_prefix', 'BL', 'Prefix for bill numbers'),
('auto_generate_bill_number', 'true', 'Automatically generate bill numbers'),
('send_email_on_bill_creation', 'true', 'Send email when bill is created'),
('bill_due_days', '30', 'Default due date in days from bill date');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_dealer_id ON bills(dealer_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON bill_items(product_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments(bill_id);

-- Function to update bill totals
CREATE OR REPLACE FUNCTION update_bill_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update bill totals when items are added/updated/deleted
    UPDATE bills 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM bill_items 
            WHERE bill_id = NEW.bill_id
        ),
        cgst_amount = (
            SELECT COALESCE(SUM(total_price), 0) * cgst_rate / 100
            FROM bill_items, bills 
            WHERE bill_items.bill_id = bills.bill_id 
            AND bill_items.bill_id = NEW.bill_id
        ),
        sgst_amount = (
            SELECT COALESCE(SUM(total_price), 0) * sgst_rate / 100
            FROM bill_items, bills 
            WHERE bill_items.bill_id = bills.bill_id 
            AND bill_items.bill_id = NEW.bill_id
        ),
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0) * (1 + (cgst_rate + sgst_rate) / 100)
            FROM bill_items, bills 
            WHERE bill_items.bill_id = bills.bill_id 
            AND bill_items.bill_id = NEW.bill_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = NEW.bill_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update bill totals
CREATE TRIGGER trigger_update_bill_totals
    AFTER INSERT OR UPDATE OR DELETE ON bill_items
    FOR EACH ROW
    EXECUTE FUNCTION update_bill_totals();

-- Function to generate bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    bill_prefix VARCHAR(10);
    bill_number VARCHAR(50);
BEGIN
    -- Get bill prefix from settings
    SELECT setting_value INTO bill_prefix 
    FROM bill_settings 
    WHERE setting_key = 'bill_prefix';
    
    -- Get next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM LENGTH(bill_prefix) + 1) AS INTEGER)), 0) + 1
    INTO next_number
    FROM bills
    WHERE bill_number LIKE bill_prefix || '%';
    
    -- Format bill number (e.g., BL-2024-0001)
    bill_number := bill_prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN bill_number;
END;
$$ LANGUAGE plpgsql;

-- Function to convert amount to words
CREATE OR REPLACE FUNCTION amount_to_words(amount DECIMAL)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    rupees INTEGER;
    paise INTEGER;
    ones TEXT[] := ARRAY['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    teens TEXT[] := ARRAY['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    tens TEXT[] := ARRAY['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    scales TEXT[] := ARRAY['', 'Thousand', 'Lakh', 'Crore'];
BEGIN
    IF amount = 0 THEN
        RETURN 'Zero Rupees Only';
    END IF;
    
    rupees := FLOOR(amount);
    paise := ROUND((amount - rupees) * 100);
    
    -- Convert rupees to words
    IF rupees > 0 THEN
        result := convert_number_to_words(rupees) || ' Rupees';
    END IF;
    
    -- Add paise if present
    IF paise > 0 THEN
        IF LENGTH(result) > 0 THEN
            result := result || ' and ';
        END IF;
        result := result || convert_number_to_words(paise) || ' Paise';
    END IF;
    
    result := result || ' Only';
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function for number to words conversion
CREATE OR REPLACE FUNCTION convert_number_to_words(num INTEGER)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    ones TEXT[] := ARRAY['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    teens TEXT[] := ARRAY['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    tens TEXT[] := ARRAY['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
BEGIN
    IF num = 0 THEN
        RETURN '';
    ELSIF num < 10 THEN
        RETURN ones[num];
    ELSIF num < 20 THEN
        RETURN teens[num - 9];
    ELSIF num < 100 THEN
        IF num % 10 = 0 THEN
            RETURN tens[num / 10];
        ELSE
            RETURN tens[num / 10] || ' ' || ones[num % 10];
        END IF;
    ELSIF num < 1000 THEN
        IF num % 100 = 0 THEN
            RETURN ones[num / 100] || ' Hundred';
        ELSE
            RETURN ones[num / 100] || ' Hundred and ' || convert_number_to_words(num % 100);
        END IF;
    ELSE
        RETURN 'Number too large for conversion';
    END IF;
END;
$$ LANGUAGE plpgsql;