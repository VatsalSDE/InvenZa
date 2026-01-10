import { pool } from './pool.js';

async function addMissingColumns() {
  try {
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_sent BOOLEAN DEFAULT false");
    await pool.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Completed','Pending')) DEFAULT 'Completed'");
    console.log('Missing columns ensured successfully');
  } catch (err) {
    console.error('Failed to add missing columns:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addMissingColumns().then(() => process.exit(0));

