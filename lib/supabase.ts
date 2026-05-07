import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Get Service Role Key (Needed for Force Reset Feature)
export const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Make sure .env.local is configured.");
}

// Client Standar (Untuk User Biasa) - Use a singleton pattern to avoid multiple instances warning
let supabaseInstance: any;
const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;
    
    supabaseInstance = createClient(supabaseUrl || '', supabaseAnonKey || '', {
        db: { schema: 'public' },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
    return supabaseInstance;
};

export const supabase = getSupabase();

// Client Admin (Hanya untuk Fitur Force Reset Password oleh Superadmin)
// Created only when needed to avoid GoTrueClient warnings on the frontend
let adminInstance: any;
export const getSupabaseAdmin = () => {
    if (typeof window !== 'undefined') return null; // Security: Never run admin client on frontend
    if (adminInstance) return adminInstance;
    
    adminInstance = createClient(supabaseUrl || '', supabaseServiceKey || '', {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    return adminInstance;
};

// For backward compatibility but with caution
export const supabaseAdmin = typeof window === 'undefined' ? createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: { autoRefreshToken: false, persistSession: false }
}) : null;

// Helper to get typed response
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;