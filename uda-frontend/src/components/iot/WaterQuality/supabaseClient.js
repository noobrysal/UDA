import { createClient } from '@supabase/supabase-js';

// Remove trailing slash from URL if present
const supabaseUrl = process.env.REACT_APP_WATER_QUALITY_URL;
const supabaseAnonKey = process.env.REACT_APP_WATER_QUALITY_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
