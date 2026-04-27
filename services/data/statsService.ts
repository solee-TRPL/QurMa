import { supabase } from '../../lib/supabase';
import { 
    AdminStats, 
    TeacherStats, 
    GuardianDashboardStats, 
    SuperAdminStats, 
    Student, 
    MemorizationType, 
    MemorizationStatus 
} from '../../types';

export const getSuperAdminStats = async (): Promise<SuperAdminStats> => {
    try {
        const { count: tenantCount, error: tErr } = await supabase.from('tenants').select('*', { count: 'exact', head: true });
        const { count: userCount, error: uErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: teacherCount, error: trErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
        const { count: studentCount, error: sErr } = await supabase.from('students').select('*', { count: 'exact', head: true });
        
        return { 
            totalTenants: tErr ? 0 : (tenantCount || 0), 
            totalUsers: uErr ? 0 : (userCount || 0), 
            totalTeachers: trErr ? 0 : (teacherCount || 0), 
            totalStudents: sErr ? 0 : (studentCount || 0) 
        };
    } catch (e) {
        return { totalTenants: 0, totalUsers: 0, totalTeachers: 0, totalStudents: 0 };
    }
};

export const getAdminStats = async (tenantId: string): Promise<AdminStats> => { 
    const { data: tenantStudents } = await supabase.from('students').select('id').eq('tenant_id', tenantId);
    const studentIds = tenantStudents?.map(s => s.id) || [];
    
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    const { count: totalTeachers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('role', 'teacher');
    const { count: totalHalaqahs } = await supabase.from('halaqah_classes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    
    if (studentIds.length === 0) {
        return { 
            totalStudents: totalStudents || 0, totalTeachers: totalTeachers || 0, totalHalaqahs: totalHalaqahs || 0, 
            totalRecordsToday: 0, sabaqToday: 0, sabqiToday: 0, manzilToday: 0, notManzilToday: 0, 
            manzilDoneIds: [], memorizationQuality: [], memorizationTrend: [], monthlyTrend: [] 
        };
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recordsToday } = await supabase.from('memorization_records')
        .select('student_id, type')
        .eq('record_date', today)
        .in('student_id', studentIds);
    const safeRecordsToday = recordsToday || [];
    
    const sabaqToday = safeRecordsToday.filter(r => r.type === MemorizationType.SABAQ).length;
    const sabqiToday = safeRecordsToday.filter(r => r.type === MemorizationType.SABQI).length;
    const manzilToday = safeRecordsToday.filter(r => r.type === MemorizationType.MANZIL).length;

    const studentsDoneManzilToday = new Set(safeRecordsToday.filter(r => r.type === MemorizationType.MANZIL).map(r => r.student_id));
    const notManzilToday = Math.max(0, (totalStudents || 0) - studentsDoneManzilToday.size);

    const { data: records } = await supabase.from('memorization_records')
        .select('status, record_date')
        .gte('record_date', thirtyDaysAgo.toISOString())
        .in('student_id', studentIds)
        .order('record_date', { ascending: true });
    const safeRecords = records || [];

    // Quality mapping (Last 30 days)
    const statusCounts = { 
        [MemorizationStatus.LANCAR]: 0, 
        [MemorizationStatus.TIDAK_LANCAR]: 0, 
        [MemorizationStatus.TIDAK_SETOR]: 0 
    };
    safeRecords.forEach(r => {
        if (r.status in statusCounts) {
            statusCounts[r.status as MemorizationStatus]++;
        }
    });

    const totalQualityRecords = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const memorizationQuality = totalQualityRecords > 0 ? [
        { name: 'Lancar', value: Math.round((statusCounts[MemorizationStatus.LANCAR] / totalQualityRecords) * 100), color: '#10b981' },
        { name: 'Tidak Lancar', value: Math.round((statusCounts[MemorizationStatus.TIDAK_LANCAR] / totalQualityRecords) * 100), color: '#f59e0b' },
        { name: 'Tidak Setor', value: Math.round((statusCounts[MemorizationStatus.TIDAK_SETOR] / totalQualityRecords) * 100), color: '#f43f5e' }
    ] : [];

    // Trend mapping (7 days)
    const memorizationTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const count = safeRecords.filter(r => r.record_date.startsWith(dateStr)).length;
        memorizationTrend.push({ name: dayName, total: count, fullDate: dateStr });
    }

    // Monthly Trend (30 days)
    const monthlyTrend = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.getDate().toString();
        const count = safeRecords.filter(r => r.record_date.startsWith(dateStr)).length;
        monthlyTrend.push({ name: dayLabel, total: count });
    }

    return { 
        totalStudents: totalStudents || 0, 
        totalTeachers: totalTeachers || 0, 
        totalHalaqahs: totalHalaqahs || 0, 
        totalRecordsToday: safeRecordsToday.length, 
        sabaqToday,
        sabqiToday,
        manzilToday,
        notManzilToday,
        manzilDoneIds: Array.from(studentsDoneManzilToday),
        memorizationQuality,
        memorizationTrend,
        monthlyTrend
    }; 
};

export const getTeacherStats = async (studentsInHalaqah: Student[]): Promise<TeacherStats | null> => { 
    if (studentsInHalaqah.length === 0) return null;
    const todayDateStr = new Date().toLocaleDateString('en-CA');
    const studentIds = studentsInHalaqah.map(s => s.id);
    
    const { data } = await supabase.from('memorization_records')
        .select('type, ayat_end')
        .in('student_id', studentIds)
        .eq('record_date', todayDateStr);

    const stats = {
        totalStudentsInHalaqah: studentsInHalaqah.length,
        sabaqToday: 0, sabqiToday: 0, manzilToday: 0
    };

    if (data) {
        data.forEach(rec => {
            if (rec.type === MemorizationType.SABAQ) stats.sabaqToday++;
            else if (rec.type === MemorizationType.SABQI) stats.sabqiToday++;
            else if (rec.type === MemorizationType.MANZIL) stats.manzilToday++;
        });
    }
    return stats;
};

export const getGuardianStats = async (studentId: string): Promise<GuardianDashboardStats> => { 
    const { data: student } = await supabase.from('students').select('current_juz, daily_target').eq('id', studentId).maybeSingle();
    const { data: lastRecord } = await supabase.from('memorization_records').select('surah_name, ayat_end, status').eq('student_id', studentId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: lastNote } = await supabase.from('teacher_notes').select('content, date').eq('student_id', studentId).order('date', { ascending: false }).limit(1).maybeSingle();

    return { 
        currentSurah: lastRecord?.surah_name || '-', 
        currentAyat: lastRecord?.ayat_end ? String(lastRecord.ayat_end) : '-', 
        totalJuz: student?.current_juz || 0, 
        lastStatus: lastRecord?.status || MemorizationStatus.LANCAR, 
        teacherNote: lastNote?.content || 'Belum ada catatan', 
        teacherNoteDate: lastNote?.date || '', 
        juzProgress: ((student?.current_juz || 0) / 30) * 100, 
        dailyTarget: student?.daily_target || '-'
    }; 
};
