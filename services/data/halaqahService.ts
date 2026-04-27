import { supabase } from '../../lib/supabase';
import { Halaqah, UserProfile } from '../../types';
import { logAudit } from './auditService';

export const getHalaqahs = async (tenantId: string): Promise<Halaqah[]> => {
  const { data, error } = await supabase.from('halaqah_classes').select('*').eq('tenant_id', tenantId);
  return error || !data ? [] : data as Halaqah[];
};

export const createHalaqah = async (halaqah: Partial<Halaqah>, actor: UserProfile): Promise<Halaqah> => {
  const { teacher_name, student_count, ...dbPayload } = halaqah;
  const { data, error } = await supabase.from('halaqah_classes').insert(dbPayload).select().single();
  if (error) throw error;
  await logAudit(actor, 'CREATE', `Halaqah: ${data.name}`, `Halaqah baru dibuat.`);
  return data as Halaqah;
};

export const updateHalaqah = async (id: string, halaqah: Partial<Halaqah>, actor: UserProfile): Promise<Halaqah> => {
  const { teacher_name, student_count, ...dbPayload } = halaqah;
  const { data, error } = await supabase.from('halaqah_classes').update(dbPayload).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(actor, 'UPDATE', `Halaqah: ${data.name}`, `Data halaqah diperbarui.`);
  return data as Halaqah;
};

export const deleteHalaqah = async (id: string, halaqahName: string, actor: UserProfile): Promise<void> => {
  const { error } = await supabase.from('halaqah_classes').delete().eq('id', id);
  if (error) throw error;
  await logAudit(actor, 'DELETE', `Halaqah: ${halaqahName}`, `Halaqah dihapus.`);
};
