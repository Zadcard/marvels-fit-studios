import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'supabase_migrations' } }
);

async function checkMigrations() {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('*')
    .order('version', { ascending: true });

  if (error) {
    console.error('Error fetching migrations:', error);
  } else {
    console.log('Registered migrations count:', data.length);
    console.log('Last 20 registered migrations:');
    console.table(data.slice(-20));
  }
}

checkMigrations();
