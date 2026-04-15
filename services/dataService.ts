
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
export { supabase };
import { MemorizationRecord, Student, MemorizationType, MemorizationStatus, Halaqah, Class, UserProfile, UserRole, AuditLogEntry, ExamSchedule, TeacherNote, AdminStats, GuardianDashboardStats, Achievement, TeacherStats, Tenant, SuperAdminStats, PlatformSettings, WeeklyTarget } from '../types';

// --- AUDIT LOGS ---
const logAudit = async (actor: UserProfile, action: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, details: string) => {
    if (!actor) return;
    try {
        await supabase.from('audit_logs').insert({
            tenant_id: actor.tenant_id, // This will be null for Superadmin, which is fine
            actor_name: actor.full_name,
            actor_role: actor.role.toUpperCase(),
            action,
            entity,
            details,
            ip_address: '0.0.0.0'
        });
    } catch (error) {
        console.error("Failed to log audit:", error);
    }
};


// --- TENANT (For Admin & Superadmin) ---
export const getTenant = async (tenantId: string): Promise<Tenant | null> => {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    if (error) return null;
    return data;
};

export const updateTenant = async (tenantId: string, updates: Partial<Tenant>, actor: UserProfile): Promise<Tenant> => {
    const { data, error } = await supabase.from('tenants').update(updates).eq('id', tenantId).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Sekolah: ${data.name}`, `Pengaturan sekolah diperbarui.`);
    return data;
};

export const getTenantAdmin = async (tenantId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid error if no admin exists
    
    if (error) {
        console.error("Error fetching tenant admin:", error);
        return null;
    }
    return data as UserProfile;
};

export const sendPasswordReset = async (email: string, actor: UserProfile): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#settings', // Redirect to settings page to set new password
    });
    
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Reset Password: ${email}`, `Mengirim email reset password ke admin.`);
};

// --- SUPERADMIN ONLY FUNCTIONS ---

export const getSuperAdminStats = async (): Promise<SuperAdminStats> => {
    try {
        const { count: tenantCount } = await supabase.from('tenants').select('*', { count: 'exact', head: true });
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        return { totalTenants: tenantCount || 0, totalUsers: userCount || 0, totalTeachers: teacherCount || 0, totalStudents: studentCount || 0 };
    } catch (e) {
        return { totalTenants: 0, totalUsers: 0, totalTeachers: 0, totalStudents: 0 };
    }
};

export const getAllTenants = async (): Promise<Tenant[]> => {
    const { data, error } = await supabase.from('tenants').select('*').order('code', { ascending: true });
    if (error) throw error;
    return data;
};

export const createTenant = async (tenantData: { name: string, plan: string, code?: string }, actor: UserProfile): Promise<Tenant> => {
    const { data, error } = await supabase.from('tenants').insert(tenantData).select().single();
    if (error) throw error;
    await logAudit(actor, 'CREATE', `Sekolah: ${data.name}`, `Sekolah baru ditambahkan (Kode: ${data.code}).`);
    return data;
};

export const deleteTenant = async (tenantId: string, actor: UserProfile, tenantName: string): Promise<void> => {
    // Note: In a real app, this should be a soft delete or have cascading consequences handled carefully.
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Sekolah: ${tenantName}`, `Sekolah dihapus dari platform.`);
};

export const getAllUsersWithTenant = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('profiles').select('*, tenants(name)');
    if (error) throw error;
    return data.map((u: any) => ({ ...u, tenant_name: u.tenants?.name || 'N/A' }));
};

// --- PLATFORM SETTINGS (SUPERADMIN) ---

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
    const { data, error } = await supabase.from('platform_settings').select('key, value');
    if (error) throw error;
    
    // Convert array of key-value pairs into a single settings object
    const settings = data.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as any);

    return settings as PlatformSettings;
};

// Update one or more settings
export const updatePlatformSettings = async (settingsToUpdate: Partial<PlatformSettings>, actor: UserProfile): Promise<void> => {
    const updates = Object.entries(settingsToUpdate).map(([key, value]) => ({
        key,
        value,
    }));

    // Use upsert to update existing keys or insert new ones
    const { error } = await supabase.from('platform_settings').upsert(updates, { onConflict: 'key' });
    if (error) throw error;
    
    const details = `Memperbarui pengaturan platform: ${Object.keys(settingsToUpdate).join(', ')}`;
    await logAudit(actor, 'UPDATE', 'Platform Settings', details);
};

// --- CORE DATA FETCHING (TENANT-SCOPED) ---

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
  const { data, error } = await supabase.from('students').insert([{ ...student, current_juz: student.current_juz || 1 }]).select().single();
  if (error) throw error;
  await logAudit(actor, 'CREATE', `Student: ${data.full_name}`, `Santri baru ditambahkan dengan NIS: ${data.nis}`);
  return data as Student;
};

export const updateStudent = async (student: Partial<Student>, actor: UserProfile): Promise<Student> => {
    if (!student.id) throw new Error("Student ID required for update");
    const { data, error } = await supabase.from('students').update(student).eq('id', student.id).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Student: ${data.full_name}`, `Data santri diperbarui.`);
    return data as Student;
};

export const deleteStudent = async (studentId: string, studentName: string, actor: UserProfile): Promise<void> => {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Student: ${studentName}`, `Santri dihapus dari sistem.`);
};

export const getStudentRecords = async (studentId: string): Promise<MemorizationRecord[]> => {
  const { data, error } = await supabase.from('memorization_records').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as MemorizationRecord[];
};

export const createRecord = async (record: Omit<MemorizationRecord, 'id' | 'created_at'>, actor: UserProfile, studentName: string) => {
    const { data, error } = await supabase.from('memorization_records')
        .upsert(record, { onConflict: 'student_id,type,record_date' })
        .select()
        .single();
    if (error) throw error;
    
    // Determine the action type for auditing
    const action = 'SAVE';
    await logAudit(actor, 'CREATE', `Hafalan: ${studentName}`, `${action} setoran ${record.type} ${record.surah_name}:${record.ayat_start}-${record.ayat_end} (${record.status}).`);
    return data;
};

export const updateRecord = async (id: string, record: Partial<MemorizationRecord>, actor: UserProfile, studentName: string) => {
    const { data, error } = await supabase.from('memorization_records').update(record).eq('id', id).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Hafalan: ${studentName}`, `Memperbarui setoran ${data.type} ${data.surah_name}:${data.ayat_start}-${data.ayat_end} (${data.status}).`);
    return data;
};
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `public/${fileName}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data ? `${data.publicUrl}?t=${new Date().getTime()}` : null;
};

export const uploadLogo = async (tenantId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}.${fileExt}`;
    const filePath = `logos/${fileName}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data ? `${data.publicUrl}?t=${new Date().getTime()}` : null;
};

// --- HALAQAH & USERS ---
export const getHalaqahs = async (tenantId: string): Promise<Halaqah[]> => {
  const { data, error } = await supabase.from('halaqah_classes').select('*').eq('tenant_id', tenantId);
  if (error || !data) return [];
  return data as Halaqah[];
};

export const getUsers = async (tenantId: string): Promise<UserProfile[]> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
  if (error || !data) return [];
  return data as UserProfile[];
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

// --- CLASSES ---

export const getClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase.from('classes').select('*').eq('tenant_id', tenantId).order('name', { ascending: true });
  if (error || !data) return [];
  return data as Class[];
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

export const createUser = async (userData: any, actor: UserProfile): Promise<UserProfile> => {
  const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  
  // Pass all necessary info in metadata for the trigger to use
  const { data: authData, error } = await tempSupabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: { 
      data: { 
        full_name: userData.full_name, 
        role: userData.role, 
        tenant_id: userData.tenant_id, 
        whatsapp_number: userData.whatsapp_number 
      } 
    }
  });

  // --- MULTI-TENANT SAFE: Handle "User already registered" ---
  // Supabase Auth uses email as a GLOBAL unique key. If a parent's email is already
  // registered in another school, signUp will fail — but that's fine.
  // We simply reuse the existing auth user as the parent reference (parent_id).
  // Student data isolation is guaranteed by tenant_id on the students table itself.
  const isAlreadyRegistered = error?.message?.toLowerCase().includes('user already registered')
    || error?.message?.toLowerCase().includes('already registered');

  if (error && !isAlreadyRegistered) {
    throw error; // Re-throw genuine errors (network, validation, etc.)
  }

  if (isAlreadyRegistered) {
    // Find the existing profile by email (searches across all tenants)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userData.email)
      .limit(1)
      .maybeSingle();

    if (!existingProfile) {
      throw new Error(`Email ${userData.email} sudah terdaftar, namun profilnya tidak ditemukan. Hubungi administrator.`);
    }

    // Return the existing profile — their auth user ID will be used as parent_id.
    // The student record will carry the correct tenant_id for the new school,
    // so student data stays fully isolated per school.
    await logAudit(
      actor,
      'CREATE',
      `User: ${existingProfile.full_name}`,
      `Orang tua lintas-sekolah: email ${userData.email} sudah terdaftar, profil yang ada digunakan sebagai referensi.`
    );
    return existingProfile as UserProfile;
  }

  // --- Normal new user flow ---
  if (!authData?.user) {
    throw new Error("Gagal membuat objek pengguna di Supabase Auth.");
  }

  // Poll for the profile to be created by the trigger, resolving the race condition.
  let newProfile: UserProfile | null = null;
  for (let i = 0; i < 5; i++) {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    if (profileData) {
      newProfile = profileData as UserProfile;
      break;
    }
    await new Promise(res => setTimeout(res, 400)); // Wait and retry
  }

  if (!newProfile) {
    throw new Error("Gagal memverifikasi profil pengguna baru setelah pembuatan.");
  }

  // Explicitly update whatsapp_number just in case the trigger missed it or metadata sync delayed
  if (userData.whatsapp_number) {
    const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ whatsapp_number: userData.whatsapp_number })
        .eq('id', newProfile.id)
        .select()
        .single();
    
    if (updatedProfile) {
        newProfile = updatedProfile as UserProfile;
    }
  }

  await logAudit(actor, 'CREATE', `User: ${userData.full_name}`, `User baru dengan role ${userData.role} telah dibuat.`);
  
  // Return the actual, verified profile from the database, which includes the correct tenant_id.
  return newProfile;
};


export const updateUser = async (user: Partial<UserProfile>, actor: UserProfile): Promise<UserProfile> => {
  if (!user.id) throw new Error("ID required");
  const { id, email, ...updateData } = user as any; 
  const { data, error } = await supabase.from('profiles').update(updateData).eq('id', user.id).select().single();
  if (error) throw error;
  const details = user.id === actor.id ? 'Memperbarui profil pribadi.' : `Memperbarui data user: ${data.full_name}.`;
  await logAudit(actor, 'UPDATE', `User: ${data.full_name}`, details);
  return data as UserProfile;
};

export const deleteUser = async (userId: string, userName: string, actor: UserProfile): Promise<void> => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
  await logAudit(actor, 'DELETE', `User: ${userName}`, `User dihapus dari sistem.`);
};

// --- NOTES & ACHIEVEMENTS ---
export const getStudentNotes = async (studentId: string): Promise<TeacherNote[]> => {
    const { data, error } = await supabase.from('teacher_notes').select('*').eq('student_id', studentId).order('date', { ascending: false });
    if (error || !data) return [];
    return data as TeacherNote[];
};
export const createStudentNote = async (note: Omit<TeacherNote, 'id'>, actor: UserProfile, studentName: string): Promise<TeacherNote> => {
    const { data, error } = await supabase.from('teacher_notes').insert(note).select().single();
    if (error) throw error;
    await logAudit(actor, 'CREATE', `Catatan: ${studentName}`, `Menambahkan catatan baru kategori '${note.category}'.`);
    return data as TeacherNote;
};
export const deleteStudentNote = async (noteId: string, actor: UserProfile, studentName: string): Promise<void> => {
    const { error } = await supabase.from('teacher_notes').delete().eq('id', noteId);
    if (error) throw error;
    await logAudit(actor, 'DELETE', `Catatan: ${studentName}`, `Menghapus catatan ustadz.`);
};
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

// --- STATS & EXAMS ---

export const getAdminStats = async (tenantId: string): Promise<AdminStats> => { 
    // Basic Counts
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    const { count: totalTeachers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('role', 'teacher');
    const { count: totalHalaqahs } = await supabase.from('halaqah_classes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    
    // Date Calculations
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Includes today

    // Today's Record Count
    const { count: totalRecordsToday } = await supabase.from('memorization_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

    // Fetch Records for Quality & Trends (Last 30 Days)
    const { data: records } = await supabase
        .from('memorization_records')
        .select('status, record_date')
        .gte('record_date', thirtyDaysAgo.toISOString())
        .order('record_date', { ascending: true });
    
    const safeRecords = records || [];

    // 1. Calculate Target Performance Participation (A/B/C status for current week)
    const monday = new Date();
    const day = monday.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    monday.setDate(monday.getDate() + diff);
    const currentWeekStart = monday.toISOString().split('T')[0];

    // Fetch all students to join with targets
    const { data: studentIdsData } = await supabase
        .from('students')
        .select('id')
        .eq('tenant_id', tenantId);
    
    const tenantStudentIds = studentIdsData?.map(s => s.id) || [];
    
    let targetPerf = { A: 0, B: 0, C: 0 };
    if (tenantStudentIds.length > 0) {
        const { data: weeklyTargets } = await supabase
            .from('weekly_targets')
            .select('target_data')
            .in('student_id', tenantStudentIds)
            .eq('week_start', currentWeekStart);
        
        if (weeklyTargets) {
            weeklyTargets.forEach(t => {
                const data = t.target_data || {};
                // Count status from all 3 types if they exist
                ['manzil_ket', 'sabqi_ket', 'sabaq_ket'].forEach(key => {
                    const val = data[key];
                    if (val === 'A') targetPerf.A++;
                    else if (val === 'B') targetPerf.B++;
                    else if (val === 'C') targetPerf.C++;
                });
            });
        }
    }

    const totalTargetPoints = (targetPerf.A + targetPerf.B + targetPerf.C) || 1;
    
    const memorizationQuality = [
        { name: 'Terlampaui', value: Math.round((targetPerf.A / totalTargetPoints) * 100), color: '#f59e0b' }, // Amber
        { name: 'Tercapai', value: Math.round((targetPerf.B / totalTargetPoints) * 100), color: '#10b981' }, // Emerald
        { name: 'Tidak Tercapai', value: Math.round((targetPerf.C / totalTargetPoints) * 100), color: '#ef4444' }, // Rose
    ];

    // 2. Calculate Weekly Trend (Last 7 Days)
    const memorizationTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

        const count = safeRecords.filter(r => r.record_date.startsWith(dateStr)).length;
        memorizationTrend.push({ name: dayName, total: count, fullDate: dateStr });
    }

    // 3. Calculate Monthly Trend
    const monthlyTrend = [];
    for (let i = 27; i >= 0; i -= 3) {
        const dEnd = new Date();
        dEnd.setDate(dEnd.getDate() - i);
        const label = `${dEnd.getDate()} ${dEnd.toLocaleDateString('id-ID', { month: 'short' })}`;
        
        let groupTotal = 0;
        for (let j = 0; j < 3; j++) {
            const d = new Date();
            d.setDate(d.getDate() - (i + j));
            const dateStr = d.toISOString().split('T')[0];
            groupTotal += safeRecords.filter(r => r.record_date.startsWith(dateStr)).length;
        }
        
        monthlyTrend.push({ name: label, total: groupTotal });
    }

    return { 
        totalStudents: totalStudents || 0, 
        totalTeachers: totalTeachers || 0, 
        totalHalaqahs: totalHalaqahs || 0, 
        totalRecordsToday: totalRecordsToday || 0, 
        memorizationQuality,
        memorizationTrend,
        monthlyTrend
    }; 
};

export const getTeacherStats = async (studentsInHalaqah: Student[]): Promise<TeacherStats | null> => { 
    if (studentsInHalaqah.length === 0) return null;
    
    // Logic to calculate teacher stats
    const todayDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const studentIds = studentsInHalaqah.map(s => s.id);
    
    const { data } = await supabase.from('memorization_records')
        .select('type, ayat_end')
        .in('student_id', studentIds)
        .eq('record_date', todayDateStr)
        .gt('ayat_end', 0); // Only count actual progress entries

    const stats = {
        totalStudentsInHalaqah: studentsInHalaqah.length,
        sabaqToday: 0,
        sabqiToday: 0,
        manzilToday: 0
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
    const { data: student } = await supabase
        .from('students')
        .select('current_juz, daily_target, class_id, tenant_id')
        .eq('id', studentId)
        .single();
    const { data: lastRecord } = await supabase.from('memorization_records').select('surah_name, ayat_end, status').eq('student_id', studentId).order('created_at', { ascending: false }).limit(1).single();
    const { data: lastNote } = await supabase.from('teacher_notes').select('content, date').eq('student_id', studentId).order('date', { ascending: false }).limit(1).single();

    // --- Hitung dailyTarget dari Acuan Sabaq berdasarkan kelas santri ---
    let dailyTarget: string = student?.daily_target || '-';
    try {
        if (student?.class_id && student?.tenant_id) {
            // Fetch kelas untuk dapatkan level/nama kelas
            const { data: classData } = await supabase
                .from('classes')
                .select('name')
                .eq('id', student.class_id)
                .single();

            // Fetch cycle_config dari tenant
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('cycle_config')
                .eq('id', student.tenant_id)
                .single();

            if (classData?.name && tenantData?.cycle_config?.sabaq) {
                // Ekstrak level kelas dari nama (misal "7A" → 7, "Kelas 3" → 3)
                const match = classData.name.match(/(\d+)/);
                const classLevel = match ? parseInt(match[1]) : null;

                // Tentukan semester saat ini (Jan-Jun = 2, Jul-Des = 1)
                const month = new Date().getMonth() + 1; // 1-12
                const currentSemester = month >= 7 ? 1 : 2;

                if (classLevel !== null) {
                    const sabaqConfig: any[] = tenantData.cycle_config.sabaq;
                    // Cari entry yang cocok dengan kelas & semester
                    const entry = sabaqConfig.find(
                        (s: any) => s.kelas === classLevel && s.semester === currentSemester
                    );

                    if (entry && typeof entry.target === 'number' && entry.target > 0) {
                        // Target dalam Juz per semester → konversi ke baris/hari
                        // 1 Juz ≈ 20 halaman, 1 halaman sabaq ≈ 10 baris, 1 semester ≈ 80 hari aktif
                        const barisPerHari = Math.round((entry.target * 20 * 10) / 80);
                        dailyTarget = `${barisPerHari} Baris`;
                    } else if (entry && typeof entry.target === 'string') {
                        // Semester pertama kelas awal: teks kemampuan membaca
                        dailyTarget = 'Membaca Al-Qur\'an';
                    }
                }
            }
        }
    } catch (e) {
        // Fallback ke daily_target dari DB jika ada error
        dailyTarget = student?.daily_target || '-';
    }

    return { 
        currentSurah: lastRecord?.surah_name || '-', 
        currentAyat: lastRecord?.ayat_end ? String(lastRecord.ayat_end) : '-', 
        totalJuz: student?.current_juz || 0, 
        lastStatus: lastRecord?.status || MemorizationStatus.LANCAR, 
        teacherNote: lastNote?.content || 'Belum ada catatan', 
        teacherNoteDate: lastNote?.date || '', 
        juzProgress: ((student?.current_juz || 0) / 30) * 100, 
        dailyTarget 
    }; 
};

// --- EXAM SCHEDULE IMPLEMENTATION ---

export const getExamSchedules = async (studentId?: string): Promise<ExamSchedule[]> => {
    let query = supabase.from('exam_schedules').select('*').order('date', { ascending: false });
    if (studentId) {
        query = query.eq('student_id', studentId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data as ExamSchedule[];
};

export const createExamSchedule = async (exam: Omit<ExamSchedule, 'id'>, actor: UserProfile, studentName: string): Promise<ExamSchedule> => {
    // Force status to 'upcoming' when creating
    const payload = { ...exam, status: 'upcoming' };
    const { data, error } = await supabase.from('exam_schedules').insert(payload).select().single();
    if (error) throw error;
    await logAudit(actor, 'CREATE', `Jadwal Ujian: ${studentName}`, `Menjadwalkan ujian: ${exam.title}`);
    return data as ExamSchedule;
};

export const submitExamGrade = async (examId: string, data: { score: number, verdict: MemorizationStatus, notes: string }, actor: UserProfile, studentName: string): Promise<ExamSchedule> => {
    // CRITICAL: Set status to 'completed' when grading
    const updatePayload = {
        ...data,
        status: 'completed',
        graded_at: new Date().toISOString()
    };
    const { data: res, error } = await supabase.from('exam_schedules').update(updatePayload).eq('id', examId).select().single();
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Nilai Ujian: ${studentName}`, `Input nilai: ${data.score} (${data.verdict})`);
    return res as ExamSchedule;
};

export const getAuditLogs = async (tenantId: string): Promise<AuditLogEntry[]> => {
  const { data, error } = await supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('timestamp', { ascending: false });
  if (error || !data) return [];
  return data as AuditLogEntry[];
};

export const getGlobalAuditLogs = async (): Promise<AuditLogEntry[]> => {
    // Join with tenants to get the tenant name
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*, tenants(name)')
        .order('timestamp', { ascending: false })
        .limit(200); // Limit logs for performance
    
    if (error || !data) return [];
    
    // Map the nested tenant data to a flat structure
    return data.map((log: any) => ({
        ...log,
        tenant_name: log.tenants?.name || (log.tenant_id === null ? 'Superadmin/System' : 'Unknown School')
    }));
};
export const getWeeklyTargets = async (studentIds: string[], weekStart: string): Promise<WeeklyTarget[]> => {
    const { data, error } = await supabase
        .from('weekly_targets')
        .select('*')
        .in('student_id', studentIds)
        .eq('week_start', weekStart);
    
    if (error || !data) return [];
    return data as WeeklyTarget[];
};

export const upsertWeeklyTarget = async (target: WeeklyTarget, actor: UserProfile, studentName: string): Promise<WeeklyTarget> => {
    const { data, error } = await supabase
        .from('weekly_targets')
        .upsert(target, { onConflict: 'student_id,week_start' })
        .select()
        .single();
    
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Target: ${studentName}`, `Memperbarui target mingguan pekan ${target.week_start}.`);
    return data as WeeklyTarget;
};
export const getWeeklyMemorization = async (studentId: string, weekStart: string): Promise<any> => {
    const { data, error } = await supabase
        .from('weekly_memorization')
        .select('records_data')
        .eq('student_id', studentId)
        .eq('week_start', weekStart)
        .maybeSingle();
    
    if (error) return null;
    return data?.records_data || {};
};

export const upsertWeeklyMemorization = async (studentId: string, weekStart: string, recordsData: any, actor: UserProfile, studentName: string): Promise<void> => {
    const { error } = await supabase
        .from('weekly_memorization')
        .upsert({
            student_id: studentId,
            week_start: weekStart,
            records_data: recordsData,
            updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,week_start' });
    
    if (error) throw error;
    await logAudit(actor, 'UPDATE', `Setoran Mingguan: ${studentName}`, `Memperbarui setoran pekan ${weekStart}.`);
};

export const getWeeklyAllTypeTotals = async (studentIds: string[], weekStart: string): Promise<Record<string, { sabaq: number, sabqi: number, manzil: number }>> => {
    const { data, error } = await supabase
        .from('weekly_memorization')
        .select('student_id, records_data')
        .in('student_id', studentIds)
        .eq('week_start', weekStart);
    
    if (error) {
        console.error("Error fetching weekly totals:", error);
        return {};
    }
    
    const totals: Record<string, { sabaq: number, sabqi: number, manzil: number }> = {};
    if (!data) return totals;

    data.forEach(item => {
        const records = item.records_data || {};
        const studentTotals = { sabaq: 0, sabqi: 0, manzil: 0 };
        
        Object.values(records).forEach((dayData: any) => {
            if (!dayData || typeof dayData !== 'object') return;

            ['sabaq', 'sabqi', 'manzil'].forEach(type => {
                const typeKey = Object.keys(dayData).find(k => k.toLowerCase() === type);
                if (typeKey) {
                    const entry = dayData[typeKey];
                    if (entry) {
                        const ayatEndKey = Object.keys(entry).find(k => k.toLowerCase() === 'ayat_end');
                        if (ayatEndKey) {
                            const val = entry[ayatEndKey];
                            const numericVal = typeof val === 'number' ? val : parseInt(val);
                            if (!isNaN(numericVal)) {
                                (studentTotals as any)[type] += numericVal;
                            }
                        }
                    }
                }
            });
        });
        
        totals[item.student_id] = studentTotals;
    });
    
    return totals;
};
