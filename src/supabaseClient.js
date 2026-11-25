// The only place the Supabase client is created. Only lib/repository.js uses it.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Both values are required. There is no local fallback: a missing env file is
// a configuration error, not a different mode of the app.
export const supabase = createClient(url, anonKey);
