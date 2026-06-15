"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function forceResetPasswordServer(userId: string, targetPassword: string) {

  if (!supabaseServiceKey) {
    throw new Error("Akses Service Role tidak tersedia. Fitur ini hanya dapat dijalankan jika kunci admin dikonfigurasi.");
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: targetPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
  return true;
}
