import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve environment variables across server (Node process.env) and browser environments
const getEnvVar = (key: string, viteKey: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key]!;
    if (process.env[viteKey]) return process.env[viteKey]!;
  }
  return '';
};

const DEFAULT_SUPABASE_URL = 'https://mxgputlyhoxejkinyblq.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_2zqEA4-fPxSYYkwuEka_Jg_hwpY0uMJ';

const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseKey =
  getEnvVar('SUPABASE_KEY', 'VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') ||
  DEFAULT_SUPABASE_KEY;

/**
 * Supabase client instance initialized with project credentials.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export function getSupabaseClient(): SupabaseClient {
  const url = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
  const key =
    getEnvVar('SUPABASE_KEY', 'VITE_SUPABASE_ANON_KEY') ||
    getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') ||
    DEFAULT_SUPABASE_KEY;

  return createClient(url, key);
}
