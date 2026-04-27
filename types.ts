// Domain Types

export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  TEACHER = "teacher", // Guru / Ustadz
  SANTRI = "santri", // Santri
  SUPERVISOR = "supervisor", // Supervisor
}

export enum MemorizationType {
  SABAQ = "sabaq", // Hafalan Baru
  SABQI = "sabqi", // Penguatan Hafalan Baru
  MANZIL = "manzil", // Murajaah Lama
}

export enum MemorizationStatus {
  LANCAR = "LANCAR",
  TIDAK_LANCAR = "TIDAK_LANCAR",
  TIDAK_SETOR = "TIDAK_SETOR",
  SAKIT = "SAKIT",
  IZIN = "IZIN",
  ALPA = "ALPA",
  EMPTY = "-",
}

export interface Tenant {
  id: string;
  name: string;
  code?: string; // School Code / ID (e.g., 0001)
  plan: "basic" | "pro" | "enterprise";
  logo_url?: string;
  created_at: string;
  cycle_config?: any; // To store class cycle settings
  curriculum_config?: {
    sabaq?: any[];
    manzil?: any[];
    sabqi?: any[];
    target_info?: { label: string; value: string }[];
  };
}

export interface UserProfile {
  id: string; // references auth.users
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string | null; // Superadmin has null tenant_id
  avatar_url?: string;
  whatsapp_number?: string;
  initial_password?: string; // Backup for manual reset (no-email env)
  student_name?: string; // For UI display
  tenant_name?: string; // For Superadmin UI display
}

export interface Student {
  id: string;
  full_name: string;
  nis?: string;
  tenant_id: string;
  parent_id?: string;
  halaqah_id?: string;
  class_id?: string;
  current_juz?: number;
  current_page?: number;
  gender?: "L" | "P";
  photo_url?: string;
  daily_target?: string;
  father_name?: string;
  mother_name?: string;
  father_phone?: string;
  mother_phone?: string;
  address?: string; // Standardized as a concatenated version or the main street address
  rt_rw?: string;
  village?: string;
  district?: string;
  city?: string;
}

export interface Class {
  id: string;
  name: string;
  tenant_id: string;
  student_count?: number;
}

export interface Achievement {
  id: string;
  student_id: string;
  title: string;
  date: string; // ISO Date string
  rank: number;
  color?: string;
}

export interface MemorizationRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  record_date: string;
  type: MemorizationType;
  surah_name: string;
  ayat_start: number; // Stores Position (Ayat Terakhir)
  ayat_end: number;   // Stores Volume (Jumlah Baris/Halaman)
  jumlah?: number;    // Optional virtual field for UI/JSON
  status: MemorizationStatus;
  keterangan?: string;
  score?: number;
  is_verified?: boolean;
  is_read_by_parent?: boolean;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface Halaqah {
  id: string;
  name: string;
  teacher_id: string | null;
  teacher_name?: string; // For UI display
  tenant_id: string;
  student_count?: number;
}

export interface ExamSchedule {
  id: string;
  student_id: string;
  student_name?: string;
  title: string;
  date: string;
  time: string;
  examiner_name: string;
  location: string;
  status: "upcoming" | "completed" | "cancelled";
  notes?: string;
  score?: number;
  verdict?: MemorizationStatus;
  graded_at?: string;
  created_at?: string;
}

export interface TeacherNote {
  id: string;
  student_id: string;
  teacher_name: string;
  date: string;
  category: "Motivasi" | "Evaluasi" | "Perilaku" | "Lainnya";
  content: string;
}

export interface AuditLogEntry {
  id: string;
  actor_name: string;
  actor_role: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT";
  entity: string;
  details: string;
  ip_address: string;
  timestamp: string;
  tenant_id?: string; // Optional for generic type, but present in DB
  tenant_name?: string; // For UI display in Global Logs
}

// Stats Interfaces
export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalHalaqahs: number;
  totalRecordsToday: number;
  sabaqToday: number;
  sabqiToday: number;
  manzilToday: number;
  notManzilToday: number;
  manzilDoneIds: string[];
  memorizationQuality: { name: string; value: number; color: string }[];
  memorizationTrend: { name: string; total: number; fullDate: string }[];
  monthlyTrend?: { name: string; total: number }[];
}

export interface SuperAdminStats {
  totalTenants: number;
  totalUsers: number;

  totalTeachers: number;
  totalStudents: number;
}

export interface GuardianDashboardStats {
  currentSurah: string;
  currentAyat: string;
  totalJuz: number;
  lastStatus: MemorizationStatus;
  teacherNote: string;
  teacherNoteDate: string;
  juzProgress: number; // 0-100
  dailyTarget: string;
}

export interface TeacherStats {
  totalStudentsInHalaqah: number;
  sabaqToday: number;
  sabqiToday: number;
  manzilToday: number;
}

// UI State Types
export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

export interface PlatformSettings {
  platform_name: string;
  public_registration_enabled: boolean;
  default_tenant_id: string | null;
  welcome_email_subject: string;
  welcome_email_body: string;
  reset_password_subject: string;
  reset_password_body: string;
}

export interface WeeklyTarget {
  id?: string;
  student_id: string;
  week_start: string; // YYYY-MM-DD (Monday)
  target_data: {
    css?: string;
    manzil_target?: string;
    manzil_hal?: number;
    manzil_ket?: "A" | "B" | "C" | "";
    sabqi_target?: number;
    sabqi_target_surat?: string;
    sabqi_ket?: "A" | "B" | "C" | "";
    sabaq_target?: number;
    sabaq_target_surat?: string;
    sabaq_ket?: "A" | "B" | "C" | "";
    current_juz?: number;
    current_page?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export type PageView =
  // Standard Roles
  | "dashboard"
  | "input-hafalan"
  | "recap-hafalan"
  | "data-santri"
  | "student-contacts"
  | "exam-grades"
  | "guardian-exams"
  | "users"
  | "student-management"
  | "classes"
  | "halaqah-management"
  | "audit-logs"
  | "reports"
  | "settings"
  | "target-management"
  | "weekly-target"
  | "student-progress"
  | "weekly-target-monitor"
  | "monitor-hafalan"
  | "student-progress-manage"
  | "pencapaian"
  | "teacher-notes"
  // Superadmin Roles
  | "sa-dashboard"
  | "sa-tenants"
  | "sa-users"
  | "sa-platform-settings"
  | "sa-email-settings"
  | "sa-audit-logs";
