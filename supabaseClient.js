/*  supabaseClient.js
 *  One‑liner Supabase helper used by every other script.
 *  Replace the two placeholders with your real project values.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://YOUR‑PROJECT‑REF.supabase.co';
const SUPABASE_KEY  = 'YOUR_PUBLIC_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const PORTRAIT_BUCKET = 'portraits';   // ← bucket that holds the .jpg files
