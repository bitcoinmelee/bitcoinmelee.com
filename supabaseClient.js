/*  supabaseClient.js
 *  One‑liner Supabase helper used by every other script.
 *  Replace the two placeholders with your real project values.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://fvdfhlajlnpfrucvztth.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZGZobGFqbG5wZnJ1Y3Z6dHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDgwMjAsImV4cCI6MjA2Mzg4NDAyMH0.NARqWbOhAAWxjresB2E1YM-L7wmFiJKChUrTRzDFK2M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const PORTRAIT_BUCKET = 'characters/characters';   // ← bucket that holds the .jpg files
