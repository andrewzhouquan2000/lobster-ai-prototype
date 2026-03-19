import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// SQL statements to create tables
const createTables = async () => {
  console.log('Creating database tables...');
  
  // 1. Create profiles table
  const { error: profilesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  
  if (profilesError) {
    console.log('Profiles table might already exist or needs manual creation');
  }
  
  console.log('Note: Supabase REST API cannot execute DDL statements directly.');
  console.log('Please run the SQL scripts in Supabase Dashboard SQL Editor.');
};

createTables();
