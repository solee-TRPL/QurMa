
import { supabase } from '../lib/supabase';
import { UserRole, UserProfile } from '../types';

export const getCurrentProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    // Fetch from profiles table for persistence (avatar_url, etc)
    const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const metadata = user.user_metadata;
    
    // Merge Auth Metadata with Database Profile
    // database takes priority for dynamic fields
    return {
        id: user.id,
        email: user.email || '',
        full_name: dbProfile?.full_name || metadata.full_name || metadata.fullname || 'User',
        role: (dbProfile?.role as UserRole) || (metadata.role as UserRole) || UserRole.SANTRI,
        whatsapp_number: dbProfile?.whatsapp_number || metadata.whatsapp || '',
        tenant_id: dbProfile?.tenant_id || metadata.tenant_id || null,
        avatar_url: dbProfile?.avatar_url || null
    };
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
};

export const getProfileWithRetry = async (userId: string): Promise<UserProfile | null> => {
    return await getCurrentProfile(userId);
};

export const signUp = async (email: string, password: string, fullName: string, whatsapp: string): Promise<UserProfile> => {
  let assignedRole = UserRole.SANTRI;
  if (email.toLowerCase().includes('admin')) assignedRole = UserRole.ADMIN;

  const { data, error } = await supabase.auth.signUp({
    email,
    password, 
    options: {
      data: {
        full_name: fullName,
        role: assignedRole,
        whatsapp: whatsapp
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Registrasi berhasil.");

  const profile = await getCurrentProfile(data.user.id);
  if (!profile) throw new Error("Gagal memuat profil.");
  return profile;
};

export const signIn = async (email: string, password: string): Promise<UserProfile> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Login gagal.");

    const profile = await getProfileWithRetry(data.user.id);
    if (!profile) throw new Error("Profil tidak ditemukan.");
    return profile;
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};
