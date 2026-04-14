import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Make sure .env.local is configured.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'qurma-v14' },
  },
});

// Helper to get typed response
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;