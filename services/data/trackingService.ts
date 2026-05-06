
import { supabase } from "../../lib/supabase";
import { UserProfile } from "../../types";

export interface AssignmentHistory {
    id: string;
    student_id: string;
    halaqah_id: string;
    halaqah_name?: string;
    teacher_id: string;
    teacher_name?: string;
    start_date: string;
    end_date: string | null;
    total_sabaq_lines?: number;
}

/**
 * Fetches the teacher/halaqah assignment history for a specific student.
 */
export const getStudentAssignmentHistory = async (studentId: string): Promise<AssignmentHistory[]> => {
    // 1. Fetch History
    const { data: historyData, error: historyError } = await supabase
        .from('student_halaqah_history')
        .select(`
            *,
            halaqah_classes(name),
            profiles(full_name)
        `)
        .eq('student_id', studentId)
        .order('start_date', { ascending: false });

    if (historyError) {
        console.error("Error fetching assignment history:", historyError);
        throw historyError;
    }

    // 2. Fetch all sabaq records for this student to calculate totals per teacher
    const { data: sabaqRecords, error: sabaqError } = await supabase
        .from('memorization_records')
        .select('teacher_id, record_date, ayat_end')
        .eq('student_id', studentId)
        .eq('type', 'sabaq');

    if (sabaqError) {
        console.error("Error fetching sabaq records for history:", sabaqError);
    }

    const records = sabaqRecords || [];

    return (historyData || [])
        .sort((a, b) => {
            // Sort by end_date NULL first (current assignment), then by start_date DESC
            if (!a.end_date && b.end_date) return -1;
            if (a.end_date && !b.end_date) return 1;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        })
        .map(item => {
            // Calculate total sabaq lines for this specific assignment period
            const periodStart = new Date(item.start_date);
            const periodEnd = item.end_date ? new Date(item.end_date) : new Date('2099-12-31');
            
            const totalSabaq = records
                .filter(r => {
                    const recordDate = new Date(r.record_date);
                    return r.teacher_id === item.teacher_id && 
                           recordDate >= periodStart && 
                           recordDate <= periodEnd;
                })
                .reduce((sum, r) => sum + (Number(r.ayat_end) || 0), 0);

            return {
                ...item,
                halaqah_name: item.halaqah_classes?.name || 'Halaqah Dihapus',
                teacher_name: item.profiles?.full_name || 'Ustadz Dihapus',
                total_sabaq_lines: totalSabaq
            };
        });
};

/**
 * Fetches assignments across all students for a specific date range (for Admin tracking).
 */
export const getAssignmentsByDateRange = async (tenantId: string, startDate: string, endDate: string) => {
    // Logic: Find all history entries that overlap with [startDate, endDate]
    // Overlap condition: (start1 <= end2) AND (end1 >= start2)
    // Here end1 might be NULL (infinity)
    
    const { data, error } = await supabase
        .from('student_halaqah_history')
        .select(`
            *,
            students(full_name, nis),
            halaqah_classes(name),
            profiles(full_name)
        `)
        .eq('tenant_id', tenantId)
        .or(`end_date.is.null,end_date.gte.${startDate}`)
        .lte('start_date', endDate)
        .order('start_date', { ascending: true });

    if (error) {
        console.error("Error searching assignment tracking:", error);
        throw error;
    }

    return (data || []).map(item => ({
        id: item.id,
        student_id: item.student_id,
        student_name: item.students?.full_name,
        student_nis: item.students?.nis,
        teacher_name: item.profiles?.full_name,
        halaqah_name: item.halaqah_classes?.name,
        start_date: item.start_date,
        end_date: item.end_date
    }));
};
