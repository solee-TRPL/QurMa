import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Get Service Role Key (Needed for Force Reset Feature)
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Make sure .env.local is configured.");
}

// Client Standar (Untuk User Biasa)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  db: { schema: 'public' },
  global: { headers: { 'x-my-custom-header': 'qurma-v14' } },
});

// Client Admin (Hanya untuk Fitur Force Reset Password oleh Superadmin)
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Helper to get typed response
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;