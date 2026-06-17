import { getSupabase } from "../../lib/supabase";
import { Student, UserProfile, TeacherNote, Achievement } from "../../types";
import { logAudit } from "./auditService";
import { createNotification } from "./notificationService";

export const getStudents = async (tenantId: string): Promise<Student[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("students").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as Student[];
};

export const getStudentsByHalaqah = async (halaqahId: string): Promise<Student[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("students").select("*").eq("halaqah_id", halaqahId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as Student[];
};

export const getUnassignedStudents = async (tenantId: string): Promise<Student[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("students").select("*").eq("tenant_id", tenantId).is("halaqah_id", null).order("full_name", { ascending: true });
  if (error || !data) return [];
  return data as Student[];
};

export const getStudentById = async (studentId: string): Promise<Student | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("students").select("*").eq("id", studentId).single();
  if (error || !data) return null;
  return data as Student;
};

export const checkNisExistsGlobal = async (nis: string, excludeStudentId?: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!nis) return false;
  let query = supabase.from("students").select("id").eq("nis", nis.trim());
  if (excludeStudentId) {
    query = query.neq("id", excludeStudentId);
  }
  const { data, error } = await query.limit(1);
  if (error) {
    console.error("Error checking NIS globally:", error);
    return false;
  }
  return data && data.length > 0;
};

export const getUnlinkedStudents = async (tenantId: string): Promise<Student[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("students").select("*").eq("tenant_id", tenantId).is("parent_id", null).order("full_name", { ascending: true });
  if (error || !data) return [];
  return data;
};

export const createStudent = async (student: Partial<Student>, actor: UserProfile): Promise<Student> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("students")
    .insert([{ ...student, current_juz: student.current_juz || 0 }])
    .select()
    .single();
  if (error) throw error;
  await logAudit(actor, "CREATE", `Student: ${data.full_name}`, `Santri baru ditambahkan (NIS: ${data.nis})`);
  return data as Student;
};

export const updateStudent = async (student: Partial<Student>, actor: UserProfile): Promise<Student> => {
  const supabase = getSupabase();
  if (!student.id) throw new Error("ID required");
  const { data, error } = await supabase.from("students").update(student).eq("id", student.id).select().single();
  if (error) throw error;
  await logAudit(actor, "UPDATE", `Student: ${data.full_name}`, `Data santri diperbarui.`);
  return data as Student;
};

export const deleteStudent = async (studentId: string, studentName: string, actor: UserProfile): Promise<void> => {
  const supabase = getSupabase();
  
  // Ambil data santri dulu untuk tahu parent_id nya
  const { data: student } = await supabase.from("students").select("parent_id").eq("id", studentId).single();
  
  // Hapus data santri
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw error;

  // Jika ada parent_id (akun profil), hapus juga profil tersebut
  if (student?.parent_id) {
    await supabase.from("profiles").delete().eq("id", student?.parent_id);

    // Coba hapus juga dari auth.users
    const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceKey && supabaseUrl) {
      try {
        const adminClient = require("@supabase/supabase-js").createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
        await adminClient.auth.admin.deleteUser(student.parent_id);
      } catch (err) {
        console.error("Failed to delete auth user:", err);
      }
    }
  }

  await logAudit(actor, "DELETE", `Student: ${studentName}`, `Santri dihapus beserta data profilnya.`);
};

// Notes
export const getStudentNotes = async (studentId: string): Promise<TeacherNote[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("teacher_notes").select("*").eq("student_id", studentId).order("date", { ascending: false });
  if (error || !data) return [];
  return data as TeacherNote[];
};

export const createStudentNote = async (note: Omit<TeacherNote, "id">, actor: UserProfile, studentName: string): Promise<TeacherNote> => {
  const supabase = getSupabase();
  const roleMap: Record<string, string> = {
    TEACHER: "teacher",
    ADMIN: "admin",
    SUPERVISOR: "supervisor",
  };
  const userRole = roleMap[actor.role] || "teacher";
  const readerString = `${actor.full_name} [${userRole}]`;

  const { data, error } = await supabase
    .from("teacher_notes")
    .insert({ ...note, tenant_id: actor.tenant_id })
    .select()
    .single();
  if (error) throw error;

  // Set initial seen status safely (silently fails if seen_by column not yet created in Supabase)
  const { error: updateError } = await supabase
    .from("teacher_notes")
    .update({ seen_by: [readerString] })
    .eq("id", data.id);
  if (!updateError) {
    data.seen_by = [readerString];
  }

  // --- TRIGGER NOTIFICATIONS ---
  try {
    const { data: student } = await supabase.from("students").select("parent_id, full_name").eq("id", note.student_id).single();

    const recipients: string[] = [];
    if (student?.parent_id) recipients.push(student.parent_id);
    // Notifications are sent to parents/guardians.
    // Direct student notifications are disabled because most students do not have user accounts.

    await Promise.all(
      recipients.map((recipientId) =>
        createNotification({
          user_id: recipientId,
          tenant_id: actor.tenant_id!,
          title: "Catatan Baru dari Ustadz",
          message: `Ada catatan ${note.category} untuk Ananda ${student?.full_name?.split(" ")[0] || studentName.split(" ")[0]}.`,
          type: "info",
          metadata: { student_id: note.student_id, type: "note" },
        }),
      ),
    );
  } catch (notifErr) {
    console.warn("Could not send notification:", notifErr);
  }

  await logAudit(actor, "CREATE", `Catatan: ${studentName}`, `Menambahkan catatan kategori '${note.category}'.`);
  return data as TeacherNote;
};

export const deleteStudentNote = async (noteId: string, actor: UserProfile, studentName: string): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.from("teacher_notes").delete().eq("id", noteId);
  if (error) throw error;
  await logAudit(actor, "DELETE", `Catatan: ${studentName}`, `Menghapus catatan ustadz.`);
};

export const updateStudentNote = async (noteId: string, content: string, category: string, actor: UserProfile, studentName: string): Promise<TeacherNote> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("teacher_notes").update({ content, category }).eq("id", noteId).select().single();
  if (error) throw error;
  await logAudit(actor, "UPDATE", `Catatan: ${studentName}`, `Memperbarui catatan ustadz.`);
  return data as TeacherNote;
};

export const replyStudentNote = async (noteId: string, replyContent: string, actor: UserProfile): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("teacher_notes")
    .update({
      reply_content: replyContent,
      replied_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  if (error) {
    console.error("Error replying to note:", error);
    throw error;
  }

  await logAudit(actor, "UPDATE", `Balasan Catatan`, `Santri membalas catatan ustadz.`);
};

export const deleteNoteReply = async (noteId: string, actor: UserProfile): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("teacher_notes")
    .update({
      reply_content: null,
      replied_at: null,
    })
    .eq("id", noteId);

  if (error) {
    console.error("Error deleting reply:", error);
    throw error;
  }

  await logAudit(actor, "UPDATE", `Hapus Balasan Catatan`, `Santri menghapus balasan catatan.`);
};

export const markNoteAsSeen = async (noteId: string, role: string, currentSeenBy: string[] = []): Promise<void> => {
  if (currentSeenBy.includes(role)) return; // Already marked

  const updatedSeenBy = [...currentSeenBy, role];
  const supabase = getSupabase();
  const { error } = await supabase.from("teacher_notes").update({ seen_by: updatedSeenBy }).eq("id", noteId);

  // We ignore errors silently here because if the seen_by column hasn't been created in Supabase yet,
  // or if RLS blocks it, we don't want to break the UI or flood the console.
  if (error && process.env.NODE_ENV === "development") {
    console.warn("Could not mark note as seen. Please ensure 'seen_by' column exists as text[] in teacher_notes table.");
  }
};

// Achievements
export const getAchievements = async (studentId: string): Promise<Achievement[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("achievements").select("*").eq("student_id", studentId).order("date", { ascending: false });
  if (error || !data) return [];
  return data as Achievement[];
};

export const createAchievement = async (data: Omit<Achievement, "id">, actor: UserProfile, studentName: string): Promise<Achievement> => {
  const supabase = getSupabase();
  const { data: res, error } = await supabase
    .from("achievements")
    .insert({ ...data, tenant_id: actor.tenant_id, teacher_name: actor.full_name })
    .select()
    .single();
  if (error) throw error;

  // --- TRIGGER NOTIFICATIONS ---
  try {
    const { data: student } = await supabase.from("students").select("parent_id, full_name").eq("id", data.student_id).single();

    const recipients: string[] = [];
    if (student?.parent_id) recipients.push(student.parent_id);
    // Notifications are sent to parents/guardians.
    // Direct student notifications are disabled because most students do not have user accounts.

    await Promise.all(
      recipients.map((recipientId) =>
        createNotification({
          user_id: recipientId,
          tenant_id: actor.tenant_id!,
          title: "Pencapaian Baru! 🎉",
          message: `Barakallah! Ananda ${student?.full_name?.split(" ")[0] || studentName.split(" ")[0]} meraih: ${res.title}.`,
          type: "success",
          metadata: { student_id: data.student_id, type: "achievement" },
        }),
      ),
    );
  } catch (notifErr) {
    console.warn("Could not send notification:", notifErr);
  }

  await logAudit(actor, "CREATE", `Pencapaian: ${studentName}`, `Menambahkan pencapaian '${res.title}'.`);
  return res as Achievement;
};

export const deleteAchievement = async (id: string, actor: UserProfile, studentName: string, achievementTitle: string): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) throw error;
  await logAudit(actor, "DELETE", `Pencapaian: ${studentName}`, `Menghapus pencapaian '${achievementTitle}'.`);
};

export const updateAchievement = async (id: string, title: string, color: string, actor: UserProfile, studentName: string): Promise<Achievement> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("achievements").update({ title, color }).eq("id", id).select().single();
  if (error) throw error;
  await logAudit(actor, "UPDATE", `Pencapaian: ${studentName}`, `Memperbarui pencapaian '${title}'.`);
  return data as Achievement;
};
