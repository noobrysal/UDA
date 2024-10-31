
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.REACT_APP_AUTHENTICATION_URL;
const supabaseAnonKey = process.env.REACT_APP_AUTHENTICATION_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);