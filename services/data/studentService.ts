import { supabase } from '../../lib/supabase';
import { Student, UserProfile, TeacherNote, Achievement } from '../../types';
import { logAudit } from './auditService';

export const getStudents = async (tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase.from('students').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: true });
  if (error || !data) return []; 
  return data as Student[];
};

export const getStudentsByHalaqah = async (halaqahId: string): Promise<Student[]> => {
  const { data, error } = await supabase.from('students').select('*').eq('halaqah_id', halaqahId).order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as Student[];
};

export const getUnassignedStudents = async (tenantId: string): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').eq('tenant_id', tenantId).is('halaqah_id', null).order('full_name', { ascending: true });
    if (error || !data) return [];
    return data as Student[];
};

export const getUnlinkedStudents = async (tenantId: string): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').eq('tenant_id', tenantId).is('parent_id', null).order('full_name', { ascending: true });
    if (error || !data) return [];
    return data;
};

export const createStudent = async (student: Partial<Student>, actor: UserProfile): Promise<Student> => {
  const { data, error } = await supabase.from('students').insert([{ ...student, current_juz: student.current_juz || 0 }]).select().single();
  if (error) throw error;
  await logAudit(actor, 'CREATE', `Student: ${data.full_name}`, `Santri baru ditambahkan (NIS: ${data.nis})`);
  return data as Student;
};

export const updateStudent = async (student: Partial<Student>, actor: UserProfile): Promise<Student> => {
    if (!student.id) throw new Error("ID required");
    const { data, error } = await supabase.from('students').update(student).eq('id', student.id).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Student: ${data.full_name}`, `Data santri diperbarui.`);
    return data as Student;
};

export const deleteStudent = async (studentId: string, studentName: string, actor: UserProfile): Promise<void> => {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Student: ${studentName}`, `Santri dihapus.`);
};

// Notes
export const getStudentNotes = async (studentId: string): Promise<TeacherNote[]> => {
    const { data, error } = await supabase.from('teacher_notes').select('*').eq('student_id', studentId).order('date', { ascending: false });
    if (error || !data) return [];
    return data as TeacherNote[];
};

export const createStudentNote = async (note: Omit<TeacherNote, 'id'>, actor: UserProfile, studentName: string): Promise<TeacherNote> => {
    const { data, error } = await supabase.from('teacher_notes').insert(note).select().single();
    if (error) throw error;
    await logAudit(actor, 'CREATE', `Catatan: ${studentName}`, `Menambahkan catatan kategori '${note.category}'.`);
    return data as TeacherNote;
};

export const deleteStudentNote = async (noteId: string, actor: UserProfile, studentName: string): Promise<void> => {
    const { error } = await supabase.from('teacher_notes').delete().eq('id', noteId);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Catatan: ${studentName}`, `Menghapus catatan ustadz.`);
};

// Achievements
export const getAchievements = async (studentId: string): Promise<Achievement[]> => {
    const { data, error } = await supabase.from('achievements').select('*').eq('student_id', studentId).order('date', { ascending: false });
    if (error || !data) return [];
    return data as Achievement[];
};

export const createAchievement = async (data: Omit<Achievement, 'id'>, actor: UserProfile, studentName: string): Promise<Achievement> => {
    const { data: res, error } = await supabase.from('achievements').insert(data).select().single();
    if (error) throw error;
    await logAudit(actor, 'CREATE', `Pencapaian: ${studentName}`, `Menambahkan pencapaian '${res.title}'.`);
    return res as Achievement;
};

export const deleteAchievement = async (id: string, actor: UserProfile, studentName: string, achievementTitle: string): Promise<void> => {
    const { error } = await supabase.from('achievements').delete().eq('id', id);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Pencapaian: ${studentName}`, `Menghapus pencapaian '${achievementTitle}'.`);
};
