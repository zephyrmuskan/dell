import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('YOUR_SUPABASE_PROJECT_ID') || 
  supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY');

if (isPlaceholder) {
  console.warn(
    'Supabase credentials are not fully configured. ' +
    'Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
