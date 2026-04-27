
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
}

/**
 * Fetches the teacher/halaqah assignment history for a specific student.
 */
export const getStudentAssignmentHistory = async (studentId: string): Promise<AssignmentHistory[]> => {
    const { data, error } = await supabase
        .from('student_halaqah_history')
        .select(`
            *,
            halaqah_classes(name),
            profiles(full_name)
        `)
        .eq('student_id', studentId)
        .order('start_date', { ascending: false });

    if (error) {
        console.error("Error fetching assignment history:", error);
        throw error;
    }

    return (data || []).map(item => ({
        ...item,
        halaqah_name: item.halaqah_classes?.name || 'Halaqah Dihapus',
        teacher_name: item.profiles?.full_name || 'Ustadz Dihapus'
    }));
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
