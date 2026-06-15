import { getSupabase } from "../../lib/supabase";
import { Tenant, UserProfile } from "../../types";
import { logAudit } from "./auditService";

export const getTenant = async (tenantId: string): Promise<Tenant | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  if (error || !data) return null;
  
  if (data.cycle_config && Array.isArray(data.cycle_config.activePeriods)) {
      const todayStr = new Date().toISOString().split("T")[0];
      let periods = data.cycle_config.activePeriods;
      let changed = false;
      
      while (periods.length > 0 && periods[0].endDate && periods[0].endDate < todayStr) {
          periods.shift();
          changed = true;
      }
      
      if (changed) {
          data.cycle_config.activePeriods = periods;
          supabase.from("tenants").update({ cycle_config: data.cycle_config }).eq("id", tenantId).then();
      }
  }

  return data;
};

export const updateTenant = async (tenantId: string, updates: Partial<Tenant>, actor: UserProfile): Promise<Tenant> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("tenants").update(updates).eq("id", tenantId).select().single();
  if (error) throw error;
  await logAudit(actor, "UPDATE", `Sekolah: ${data.name}`, `Pengaturan sekolah diperbarui.`);
  return data;
};

export const getTenantAdmin = async (tenantId: string): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("profiles").select("*").eq("tenant_id", tenantId).eq("role", "admin").limit(1).maybeSingle();

  if (error) {
    console.error("Error fetching tenant admin:", error);
    return null;
  }
  return data as UserProfile;
};

export const getAllTenants = async (): Promise<Tenant[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("tenants").select("*").order("code", { ascending: true });
  if (error) throw error;
  return data;
};

export const createTenant = async (tenantData: { name: string; plan: string; code?: string }, actor: UserProfile): Promise<Tenant> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("tenants").insert(tenantData).select().single();
  if (error) throw error;
  await logAudit(actor, "CREATE", `Sekolah: ${data.name}`, `Sekolah baru ditambahkan (Kode: ${data.code}).`);
  return data;
};

export const deleteTenant = async (tenantId: string, actor: UserProfile, tenantName: string): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
  if (error) throw error;
  await logAudit(actor, "DELETE", `Sekolah: ${tenantName}`, `Sekolah dihapus dari platform.`);
};

export const sendPasswordReset = async (email: string, actor: UserProfile): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: (typeof window !== "undefined" ? window.location.origin : "") + "/app/settings",
  });

  if (error) throw error;
  await logAudit(actor, "UPDATE", `Reset Password: ${email}`, `Mengirim email reset password ke admin.`);
};
