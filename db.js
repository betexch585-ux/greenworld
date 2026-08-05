import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://mxgputlyhoxejkinyblq.supabase.co';

const supabaseKey =
  process.env.SUPABASE_API_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection to 'users' table
if (supabaseUrl && supabaseKey && !supabaseKey.includes('dummy')) {
  supabase
    .from('users')
    .select('*')
    .limit(1)
    .then(({ data, error }) => {
      if (error) console.error('Connection error:', error);
      else console.log('Connected to Supabase (users table):', data);
    })
    .catch((err) => console.error('Supabase query error:', err));
}

/**
 * Utility function to query any table from Supabase
 * @param {string} tableName - Name of table (e.g., 'users', 'deposits', 'withdrawals', 'packages')
 */
export async function queryTable(tableName = 'users') {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error querying table ${tableName}:`, error);
    throw error;
  }
  return data;
}

export default supabase;

