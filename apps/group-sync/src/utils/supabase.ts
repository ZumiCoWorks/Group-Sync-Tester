import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evempddvzimznvphcbyh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2ZW1wZGR2emltem52cGhjYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTkxNjEsImV4cCI6MjA5NTAzNTE2MX0.4wiXjDTX-48QmbCq39nijTnspd0X9r1kiGgkxkeLpyg';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
