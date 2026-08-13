import { createClient } from "@supabase/supabase-js"

const URL = import.meta.env.VITE_SUPABASE_URL;
const PUBKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(URL, PUBKEY);