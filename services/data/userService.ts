import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { logAudit } from './auditService';

export const getUsers = async (tenantId: string): Promise<UserProfile[]> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
  if (error || !data) return [];
  return data as UserProfile[];
};

export const getAllUsersWithTenant = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('profiles').select('*, tenants(name)');
    if (error) throw error;
    return data.map((u: any) => ({ ...u, tenant_name: u.tenants?.name || 'N/A' }));
};

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `public/${fileName}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data ? `${data.publicUrl}?t=${new Date().getTime()}` : null;
};

export const createUser = async (userData: any, actor: UserProfile): Promise<UserProfile> => {
  const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  
  const { data: authData, error } = await tempSupabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: { 
      data: { 
        full_name: userData.full_name, 
        role: userData.role, 
        tenant_id: userData.tenant_id, 
        whatsapp_number: userData.whatsapp_number 
      } 
    }
  });

  const isAlreadyRegistered = error?.message?.toLowerCase().includes('user already registered')
    || error?.message?.toLowerCase().includes('already registered');

  if (error && !isAlreadyRegistered) {
    throw error;
  }

  if (isAlreadyRegistered) {
    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userData.email)
      .maybeSingle();

    if (!existingProfile) {
      // AUTO-REPAIR: Auth user exists but profile is missing.
      try {
        // Try repair RPC first
        await supabase.rpc('repair_user_profile', { target_email: userData.email });
        
        // If still not there, try manual insert with ID lookup
        const { data: authUsers } = await supabase.rpc('get_user_id_by_email', { target_email: userData.email });
        const existingId = authUsers?.[0]?.id;

        if (existingId) {
            await supabase.from('profiles').upsert({
                id: existingId,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                tenant_id: userData.tenant_id,
                whatsapp_number: userData.whatsapp_number,
                initial_password: userData.password
            });
            
            await new Promise(res => setTimeout(res, 500));
            const { data: repaired } = await supabase.from('profiles').select('*').eq('id', existingId).single();
            existingProfile = repaired as UserProfile;
        }
      } catch (repairError) {
        console.error("[Repair] Self-healing failed:", repairError);
      }
    }

    if (!existingProfile) {
      throw new Error(`Email ${userData.email} sudah terdaftar, namun profilnya tidak ditemukan.`);
    }

    await logAudit(
      actor,
      'CREATE',
      `User: ${existingProfile.full_name}`,
      `Orang tua lintas-sekolah: profil yang ada digunakan.`
    );
    return existingProfile as UserProfile;
  }

  if (!authData?.user) {
    throw new Error("Gagal membuat objek pengguna.");
  }

  let newProfile: UserProfile | null = null;
  for (let i = 0; i < 5; i++) {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    if (profileData) {
      newProfile = profileData as UserProfile;
      break;
    }
    await new Promise(res => setTimeout(res, 400));
  }

  if (!newProfile) {
    throw new Error("Gagal memverifikasi profil baru.");
  }

  // Save all details including role and tenant_id explicitly to ensure connection
  const { data: updatedProfile } = await supabase
      .from('profiles')
      .update({ 
          full_name: userData.full_name,
          role: userData.role,
          tenant_id: userData.tenant_id,
          whatsapp_number: userData.whatsapp_number,
          initial_password: userData.password // BACKUP: For environments without email reset
      })
      .eq('id', newProfile.id)
      .select()
      .single();
  
  if (updatedProfile) newProfile = updatedProfile as UserProfile;

  await logAudit(actor, 'CREATE', `User: ${userData.full_name}`, `User baru created (Initial Password Cached).`);
  return newProfile;
};

export const updateUser = async (user: Partial<UserProfile>, actor: UserProfile): Promise<UserProfile> => {
  if (!user.id) throw new Error("ID required");
  const { id, email, ...updateData } = user as any; 
  const { data, error } = await supabase.from('profiles').update(updateData).eq('id', user.id).select().single();
  if (error) throw error;
  const details = user.id === actor.id ? 'Memperbarui profil pribadi.' : `Memperbarui data user: ${data.full_name}.`;
  await logAudit(actor, 'UPDATE', `User: ${data.full_name}`, details);
  return data as UserProfile;
};

export const deleteUser = async (userId: string, userName: string, actor: UserProfile): Promise<void> => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
  await logAudit(actor, 'DELETE', `User: ${userName}`, `User dihapus.`);
};

export const forceResetPassword = async (userId: string, targetPassword: string, actor: UserProfile): Promise<void> => {
    const { supabaseAdmin } = await import('../../lib/supabase');
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
        password: targetPassword 
    });
    
    if (error) throw error;
    
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
    await logAudit(actor, 'UPDATE', `Force Reset: ${profile?.email}`, `Password dipaksa kembali ke default oleh Superadmin.`);
};
