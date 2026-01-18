import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Using any type for flexibility with Supabase queries
// The database types are complex and may not match perfectly
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
