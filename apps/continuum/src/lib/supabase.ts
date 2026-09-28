import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const validUrl = supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://');

export const continuumSupabase: SupabaseClient | null =
  validUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const continuumAuthConfigured = Boolean(continuumSupabase);
