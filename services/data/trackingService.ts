import { getSupabase } from "../../lib/supabase";
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
  total_absences?: number;
  last_surah?: string;
  last_ayat?: number;
}

/**
 * Fetches the teacher/halaqah assignment history for a specific student.
 */
export const getStudentAssignmentHistory = async (studentId: string): Promise<AssignmentHistory[]> => {
  const supabase = getSupabase();
  // 1. Fetch History
  const { data: historyData, error: historyError } = await supabase
    .from("student_halaqah_history")
    .select(
      `
            *,
            halaqah_classes(name),
            profiles(full_name)
        `,
    )
    .eq("student_id", studentId)
    .order("start_date", { ascending: false });

  if (historyError) {
    console.error("Error fetching assignment history:", historyError);
    throw historyError;
  }

  // 2. Fetch all memorization records for this student to calculate totals per teacher
  const { data: allRecords, error: allRecordsError } = await supabase.from("memorization_records").select("teacher_id, record_date, ayat_end, type, status, surah_name, ayat_start").eq("student_id", studentId);

  if (allRecordsError) {
    console.error("Error fetching memorization records for history:", allRecordsError);
  }

  const records = allRecords || [];

  const sortedHistory = (historyData || []).sort((a, b) => {
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });

  const groupedHistory: any[] = [];
  for (const item of sortedHistory) {
    const tName = item.profiles?.full_name || "Ustadz Dihapus";
    const tId = item.teacher_id || "deleted";

    if (tName === "Ustadz Dihapus") continue;

    if (groupedHistory.length === 0) {
      groupedHistory.push({ ...item, _teacher_name: tName, _teacher_id: tId });
      continue;
    }

    const last = groupedHistory[groupedHistory.length - 1];
    if (last._teacher_id === tId) {
      // Merge consecutive periods with the same teacher
      last.end_date = item.end_date;
    } else {
      groupedHistory.push({ ...item, _teacher_name: tName, _teacher_id: tId });
    }
  }

  return groupedHistory
    .sort((a, b) => {
      // Sort by end_date NULL first (current assignment), then by start_date DESC
      if (!a.end_date && b.end_date) return -1;
      if (a.end_date && !b.end_date) return 1;
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    })
    .map((item) => {
      // Calculate total sabaq lines for this specific assignment period
      const startStr = item.start_date.split("T")[0];
      const endStr = item.end_date ? item.end_date.split("T")[0] : "2099-12-31";

      const periodRecords = records.filter((r) => {
        const recordDateStr = r.record_date.split("T")[0];
        return recordDateStr >= startStr && recordDateStr <= endStr;
      });

      const cumulativeRecords = records.filter((r) => {
        const recordDateStr = r.record_date.split("T")[0];
        return recordDateStr <= endStr;
      });

      const totalSabaq = cumulativeRecords
        .filter(r => r.type === "sabaq")
        .reduce((sum, r) => sum + (Number(r.ayat_end) || 0), 0);

      const absentDates = new Set(
        periodRecords
          .filter(r => r.status === "ALPA" || r.status === "IZIN" || r.status === "SAKIT")
          .map(r => r.record_date)
      );

      const sortedSabaqRecords = cumulativeRecords
        .filter(r => r.type === "sabaq" && r.surah_name && r.ayat_start !== undefined)
        .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
        
      const lastSabaqRecord = sortedSabaqRecords.length > 0 ? sortedSabaqRecords[sortedSabaqRecords.length - 1] : null;

      return {
        ...item,
        teacher_name: item._teacher_name,
        total_sabaq_lines: totalSabaq,
        total_absences: absentDates.size,
        last_surah: lastSabaqRecord ? lastSabaqRecord.surah_name : undefined,
        last_ayat: lastSabaqRecord ? lastSabaqRecord.ayat_start : undefined,
      };
    });
};

/**
 * Fetches assignments across all students for a specific date range (for Admin tracking).
 */
export const getAssignmentsByDateRange = async (tenantId: string, startDate: string, endDate: string) => {
  const supabase = getSupabase();
  // Logic: Find all history entries that overlap with [startDate, endDate]
  // Overlap condition: (start1 <= end2) AND (end1 >= start2)
  // Here end1 might be NULL (infinity)

  const { data, error } = await supabase
    .from("student_halaqah_history")
    .select(
      `
            *,
            students(full_name, nis),
            halaqah_classes(name),
            profiles(full_name)
        `,
    )
    .eq("tenant_id", tenantId)
    .or(`end_date.is.null,end_date.gte.${startDate}`)
    .lte("start_date", endDate)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error searching assignment tracking:", error);
    throw error;
  }

  return (data || []).map((item) => ({
    id: item.id,
    student_id: item.student_id,
    student_name: item.students?.full_name,
    student_nis: item.students?.nis,
    teacher_name: item.profiles?.full_name,
    halaqah_name: item.halaqah_classes?.name,
    start_date: item.start_date,
    end_date: item.end_date,
  }));
};
