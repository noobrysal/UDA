
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_AIR_QUALITY_URL;
const supabaseAnonKey = process.env.REACT_APP_AIR_QUALITY_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
