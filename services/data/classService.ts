import { supabase } from '../../lib/supabase';
import { Class, UserProfile } from '../../types';
import { logAudit } from './auditService';

export const getClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase.from('classes').select('*').eq('tenant_id', tenantId).order('name', { ascending: true });
  return error || !data ? [] : data as Class[];
};

export const createClass = async (classData: Partial<Class>, actor: UserProfile): Promise<Class> => {
  const { data, error } = await supabase.from('classes').insert(classData).select().single();
  if (error) throw error;
  await logAudit(actor, 'CREATE', `Kelas: ${data.name}`, `Kelas baru dibuat.`);
  return data as Class;
};

export const updateClass = async (id: string, classData: Partial<Class>, actor: UserProfile): Promise<Class> => {
  const { data, error } = await supabase.from('classes').update(classData).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(actor, 'UPDATE', `Kelas: ${data.name}`, `Data kelas diperbarui.`);
  return data as Class;
};

export const deleteClass = async (id: string, className: string, actor: UserProfile): Promise<void> => {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
  await logAudit(actor, 'DELETE', `Kelas: ${className}`, `Kelas dihapus.`);
};
