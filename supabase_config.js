/**
 * SUPABASE CONFIGURATION
 * 
 * Connected to kael Project
 */

const SUPABASE_URL = 'https://nvqdmjsnfamknjmrmngj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BrEy6rGrzrE0wgf7YuWXFg_p5CL3QQD';

// Initialize the Supabase Client globally as 'sb'
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🔥 Supabase Cloud Connected as 'sb'");
