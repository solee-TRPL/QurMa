import { supabase } from '../../lib/supabase';
import { MemorizationRecord, MemorizationType, UserProfile, WeeklyTarget } from '../../types';
import { logAudit } from './auditService';
import { createNotification } from './notificationService';

export const getStudentRecords = async (studentId: string): Promise<MemorizationRecord[]> => {
  const { data, error } = await supabase.from('memorization_records')
    .select('*')
    .eq('student_id', studentId)
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as MemorizationRecord[];
};

/**
 * Gets the most recent record for each type (Sabaq, Sabqi, Manzil)
 * that has actual surah/ayat data (status LANCAR or TIDAK_LANCAR)
 * to be used as a reference for "Not Depositing" states.
 */
export const getLastProgressByType = async (studentId: string): Promise<Record<string, MemorizationRecord | null>> => {
    const { data, error } = await supabase
        .from('memorization_records')
        .select('*')
        .eq('student_id', studentId)
        .order('record_date', { ascending: false })
        .order('created_at', { ascending: false });
    
    const results: Record<string, MemorizationRecord | null> = {
        sabaq: null,
        sabqi: null,
        manzil: null
    };

    if (error || !data) return results;

    const records = data as MemorizationRecord[];
    
    results.sabaq = records.find(r => r.type === MemorizationType.SABAQ) || null;
    results.sabqi = records.find(r => r.type === MemorizationType.SABQI) || null;
    results.manzil = records.find(r => r.type === MemorizationType.MANZIL) || null;

    return results;
};

export const getHalaqahRecords = async (studentIds: string[]): Promise<MemorizationRecord[]> => {
    if (studentIds.length === 0) return [];
    const { data, error } = await supabase
      .from('memorization_records')
      .select('*')
      .in('student_id', studentIds)
      .order('record_date', { ascending: false });
    if (error || !data) return [];
    return data as MemorizationRecord[];
};

export const createRecord = async (record: Omit<MemorizationRecord, 'id' | 'created_at'>, actor: UserProfile, studentName: string) => {
    const { data, error } = await supabase.from('memorization_records')
        .upsert({ ...record, tenant_id: actor.tenant_id }, { onConflict: 'student_id,type,record_date' })
        .select()
        .single();
    if (error) throw error;

    // --- TRIGGER NOTIFICATIONS ---
    try {
        const { data: student } = await supabase.from('students').select('parent_id, full_name').eq('id', record.student_id).single();
        
        const recipients = [];
        if (student?.parent_id) recipients.push(student.parent_id);
        // Student might have their own account where their user_id matches their student_id
        recipients.push(record.student_id);

        await Promise.all(recipients.map(recipientId => 
            createNotification({
                user_id: recipientId,
                tenant_id: actor.tenant_id!,
                title: "Update Hafalan Baru",
                message: `Ustadz ${actor.full_name} telah memperbarui catatan ${record.type} untuk ${student?.full_name || studentName}.`,
                type: 'info',
                metadata: { student_id: record.student_id, date: record.record_date }
            })
        ));
    } catch (notifErr) {
        console.warn("Could not send notification:", notifErr);
    }

    await logAudit(actor, 'CREATE', `Hafalan: ${studentName}`, `SAVE setoran ${record.type} ${record.surah_name}:${record.ayat_start}-${record.ayat_end} (${record.status}).`);
    return data;
};

export const deleteRecord = async (studentId: string, type: string, recordDate: string, actor: UserProfile, studentName: string) => {
    const { error } = await supabase.from('memorization_records')
        .delete()
        .eq('student_id', studentId)
        .eq('type', type)
        .eq('record_date', recordDate);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Hafalan: ${studentName}`, `Hapus setoran ${type} pada ${recordDate}.`);
};

export const updateRecord = async (id: string, record: Partial<MemorizationRecord>, actor: UserProfile, studentName: string) => {
    const { data, error } = await supabase.from('memorization_records').update(record).eq('id', id).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Hafalan: ${studentName}`, `Update setoran ${data.type} ${data.surah_name}:${data.ayat_start}-${data.ayat_end}.`);
    return data;
};

export const getWeeklyMemorization = async (studentId: string, weekStart: string): Promise<any> => {
    const { data, error } = await supabase
        .from('weekly_memorization')
        .select('records_data')
        .eq('student_id', studentId)
        .eq('week_start', weekStart)
        .maybeSingle();
    return error ? null : (data?.records_data || {});
};

export const upsertWeeklyMemorization = async (studentId: string, weekStart: string, recordsData: any, actor: UserProfile, studentName: string): Promise<void> => {
    const { error } = await supabase
        .from('weekly_memorization')
        .upsert({
            tenant_id: actor.tenant_id,
            student_id: studentId,
            week_start: weekStart,
            records_data: recordsData,
            updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,week_start' });
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Setoran Mingguan: ${studentName}`, `Update setoran pekan ${weekStart}.`);
};

export const getWeeklyAllTypeTotals = async (studentIds: string[], weekStart: string): Promise<Record<string, { sabaq: number, sabqi: number, manzil: number }>> => {
    const totals: Record<string, { sabaq: number, sabqi: number, manzil: number }> = {};
    if (studentIds.length === 0) return totals;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from('weekly_memorization')
            .select('student_id, records_data')
            .in('student_id', chunk)
            .eq('week_start', weekStart);
        
        if (!error && data) {
            data.forEach(item => {
                const records = item.records_data || {};
                const studentTotals = { sabaq: 0, sabqi: 0, manzil: 0 };
                Object.values(records).forEach((dayData: any) => {
                    if (!dayData) return;
                    ['sabaq', 'sabqi', 'manzil'].forEach(type => {
                        const entry = dayData[type];
                        if (entry && entry.jumlah) studentTotals[type as keyof typeof studentTotals] += entry.jumlah;
                    });
                });
                totals[item.student_id] = studentTotals;
            });
        }
    }
    return totals;
};

export const getWeeklyTargets = async (studentIds: string[], weekStart: string): Promise<WeeklyTarget[]> => {
    if (studentIds.length === 0) return [];

    const CHUNK_SIZE = 100;
    const allTargets: WeeklyTarget[] = [];
    
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from('weekly_targets')
            .select('*')
            .in('student_id', chunk)
            .eq('week_start', weekStart);
        
        if (!error && data) {
            allTargets.push(...(data as WeeklyTarget[]));
        }
    }
    return allTargets;
};

export const getWeeklyTargetsInRange = async (studentIds: string[], startDate: string, endDate: string): Promise<WeeklyTarget[]> => {
    if (studentIds.length === 0) return [];

    const CHUNK_SIZE = 100;
    const allTargets: WeeklyTarget[] = [];
    
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from('weekly_targets')
            .select('*')
            .in('student_id', chunk)
            .gte('week_start', startDate)
            .lte('week_start', endDate)
            .order('week_start', { ascending: false });
        
        if (!error && data) {
            allTargets.push(...(data as WeeklyTarget[]));
        }
    }
    return allTargets;
};

export const upsertWeeklyTarget = async (target: WeeklyTarget, actor: UserProfile, studentName: string): Promise<WeeklyTarget> => {
    const { data, error } = await supabase
        .from('weekly_targets')
        .upsert(target, { onConflict: 'student_id,week_start' })
        .select()
        .single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Target: ${studentName}`, `Update target pekan ${target.week_start}.`);
    return data as WeeklyTarget;
};
export const getTenantRecords = async (studentIds: string[], startDate: string, endDate: string): Promise<MemorizationRecord[]> => {
    if (studentIds.length === 0) return [];
    
    // Split studentIds into chunks of 100 to avoid Supabase/Postgres limits
    const CHUNK_SIZE = 100;
    const allRecords: MemorizationRecord[] = [];
    
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
        const chunk = studentIds.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
            .from('memorization_records')
            .select('*')
            .in('student_id', chunk)
            .gte('record_date', startDate)
            .lte('record_date', endDate)
            .order('record_date', { ascending: true });
            
        if (!error && data) {
            allRecords.push(...(data as MemorizationRecord[]));
        }
    }
    
    return allRecords;
};
