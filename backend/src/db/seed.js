import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Seed the admin user into the login table
 */
async function seedAdminUser() {
  const username = 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  console.log('🌱 Starting database seed...\n');

  try {
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('login')
      .select('username')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      console.log('ℹ️  Admin user already exists. Updating password...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { error: updateError } = await supabase
        .from('login')
        .update({ password: hashedPassword })
        .eq('username', username);

      if (updateError) throw updateError;
      
      console.log('✅ Admin password updated successfully');
    } else {
      console.log('📝 Creating admin user...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { error: insertError } = await supabase
        .from('login')
        .insert({ username, password: hashedPassword });

      if (insertError) throw insertError;
      
      console.log('✅ Admin user created successfully');
    }

    console.log(`
╔═══════════════════════════════════════════════════╗
║           ADMIN CREDENTIALS                       ║
╠═══════════════════════════════════════════════════╣
║  Username: admin                                  ║
║  Password: ${password.padEnd(37)}║
╚═══════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}
// Run the seed
seedAdminUser();