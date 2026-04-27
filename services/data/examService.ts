import { supabase } from '../../lib/supabase';
import { ExamSchedule, UserProfile, MemorizationStatus } from '../../types';
import { logAudit } from './auditService';

export const getExamSchedules = async (studentId?: string): Promise<ExamSchedule[]> => {
    let query = supabase.from('exam_schedules').select('*').order('date', { ascending: false });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    return error || !data ? [] : data as ExamSchedule[];
};

export const createExamSchedule = async (exam: Omit<ExamSchedule, 'id'>, actor: UserProfile, studentName: string): Promise<ExamSchedule> => {
    const payload = { ...exam, status: 'upcoming' };
    const { data, error } = await supabase.from('exam_schedules').insert(payload).select().single();
    if (error) throw error;
    await logAudit(actor, 'CREATE', `Jadwal Ujian: ${studentName}`, `Menjadwalkan ujian: ${exam.title}`);
    return data as ExamSchedule;
};

export const submitExamGrade = async (examId: string, data: { score: number, verdict: MemorizationStatus, notes: string }, actor: UserProfile, studentName: string): Promise<ExamSchedule> => {
    const updatePayload = {
        ...data,
        status: 'completed',
        graded_at: new Date().toISOString()
    };
    const { data: res, error } = await supabase.from('exam_schedules').update(updatePayload).eq('id', examId).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Nilai Ujian: ${studentName}`, `Input nilai: ${data.score}`);
    return res as ExamSchedule;
};
