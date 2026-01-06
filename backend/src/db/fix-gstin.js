import { pool } from './pool.js';

async function fixGSTIN() {
  try {
    console.log('Fixing GSTIN constraint...');
    
    // Drop the unique constraint on GSTIN
    await pool.query(`
      ALTER TABLE dealers 
      DROP CONSTRAINT IF EXISTS dealers_gstin_key;
    `);
    
    // Make GSTIN nullable
    await pool.query(`
      ALTER TABLE dealers 
      ALTER COLUMN gstin DROP NOT NULL;
    `);
    
    console.log('✅ GSTIN constraint fixed successfully!');
    console.log('   - GSTIN is now optional (nullable)');
    console.log('   - Unique constraint removed to allow multiple dealers without GSTIN');
    
  } catch (err) {
    console.error('❌ Error fixing GSTIN:', err.message);
    throw err;
  }
}

fixGSTIN()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
