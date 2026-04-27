
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole, Student, MemorizationRecord, MemorizationStatus, MemorizationType, ExamSchedule, AdminStats, GuardianDashboardStats, Halaqah, Achievement, TeacherStats, PageView, WeeklyTarget } from '../types';
import { getHalaqahs, getStudents, getStudentsByHalaqah, getStudentRecords, getAdminStats, getGuardianStats, getExamSchedules, getUsers, getAchievements, getTeacherStats, getWeeklyTargets, getTenant, getHalaqahRecords, getTenantRecords, getWeeklyAllTypeTotals } from '../services/dataService';
import { ChevronLeft, Trophy, TrendingUp, Calendar, AlertCircle, Users, GraduationCap, School, FileText, PieChart as PieIcon, Activity, Star, Book, Clock, CheckCircle, X, MapPin, User, ChevronRight, BookOpen, Award, Download, ArrowRight, ClipboardCheck, Zap, ChevronDown, Target, RotateCcw, RefreshCw } from 'lucide-react';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Button } from '../components/ui/Button';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';

interface DashboardProps {
  user: UserProfile;
  onNavigate?: (page: PageView) => void;
}




// --- Sub Component: Exam Schedule Modal ---
interface ExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
}

const ExamScheduleModal: React.FC<ExamModalProps> = ({ isOpen, onClose, studentId }) => {
    const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getExamSchedules(studentId).then((data) => {
                setSchedules(data);
                setLoading(false);
            });
        }
    }, [isOpen, studentId]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center lg:pl-64 p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <Calendar className="w-4 h-4 text-indigo-500" />
                             Jadwal Ujian & Tasmi'
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Agenda ujian sekolah Anda</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto scrollbar-hide max-h-[60vh]">
                    {loading ? (
                         <div className="py-12 text-center text-slate-400">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Memuat jadwal...</p>
                        </div>
                    ) : schedules.length > 0 ? (
                        <div className="space-y-4">
                            {schedules.map((exam) => (
                                <div key={exam.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[10px] font-black text-indigo-600 leading-none">{new Date(exam.date).toLocaleDateString('id-ID', { day: '2-digit' })}</span>
                                            <span className="text-[7px] font-black text-indigo-300 uppercase leading-none mt-1">{new Date(exam.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{exam.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{exam.location} • {exam.time}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                        exam.status === 'upcoming' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>{exam.status === 'upcoming' ? 'UJIAN' : 'SELESAI'}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-400 uppercase tracking-widest text-[9px] font-black opacity-60">Belum ada jadwal ujian.</div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub Component: Pending Manzil Modal (Admin) ---
interface PendingManzilModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    doneIds: string[];
}

const PendingManzilModal: React.FC<PendingManzilModalProps> = ({ isOpen, onClose, students, halaqahs, allUsers, doneIds }) => {
    if (!isOpen) return null;

    const doneSet = new Set(doneIds);
    const pendingStudents = students.filter(s => !doneSet.has(s.id));

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <AlertCircle className="w-4 h-4 text-rose-500" />
                             Belum Manzil Hari Ini
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Daftar santri yang belum setoran murojaah</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh]">
                    <div className="space-y-2">
                        {pendingStudents.length > 0 ? pendingStudents.map(student => {
                            const halaqah = halaqahs.find(h => h.id === student.halaqah_id);
                            const teacher = allUsers.find(u => u.id === halaqah?.teacher_id);
                            return (
                                <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xs font-black text-rose-500 uppercase border border-rose-100 group-hover:scale-110 transition-transform">
                                            {student.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{student.full_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {halaqah?.name || 'Tanpa Halaqah'}
                                                </span>
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-0.5">
                                                    {teacher?.full_name || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">TERAKHIR</p>
                                        <p className="text-[10px] font-black text-slate-500">Juz {student.current_juz}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-16 text-center text-slate-400 uppercase tracking-widest text-[9px] font-black opacity-60">
                                Alhamdulillah, semua santri sudah setoran Manzil hari ini.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub Component: Pending Students Modal ---
interface PendingStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    onNavigate: (page: PageView) => void;
}

const PendingStudentsModal: React.FC<PendingStudentsModalProps> = ({ isOpen, onClose, students, onNavigate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in shadow-2xl">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-red-500" />
                        Belum Setoran ({students.length})
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="space-y-2">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 capitalize">
                                        {student.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 capitalize">{student.full_name}</p>
                                        <p className="text-xs text-slate-500">Juz {student.current_juz}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        onNavigate && onNavigate('input-hafalan')
                                        onClose()
                                    }}
                                    className="text-xs font-medium text-primary-600 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                                >
                                    Input Setoran
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 text-right shrink-0">
                    <Button variant="secondary" onClick={onClose}>Tutup</Button>
                </div>
            </div>
        </div>
    );
};

// --- Sub Component: Achievements Modal ---
interface AchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievements: Achievement[];
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, achievements }) => {
    if (!isOpen) return null;

    const getColorClass = (color?: string) => {
        switch (color) {
            case 'emerald': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'orange': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'pink': return 'bg-pink-50 text-pink-600 border-pink-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-[9999] flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 shadow-indigo-100/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <Trophy className="w-4 h-4 text-amber-500" />
                             Semua Pencapaian
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Daftar prestasi santri</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh]">
                    <div className="space-y-2">
                        {achievements.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border-2 border-white shadow-sm shrink-0 ${getColorClass(item.color)}`}>
                                    {item.rank}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-tight">{item.title}</p>
                                    <p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub Component: Recent Activity Modal ---
interface RecentActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: MemorizationRecord[];
    students: Student[]; // Required for Teacher, optional for Guardian logic
}

const RecentActivityModal: React.FC<RecentActivityModalProps> = ({ isOpen, onClose, records, students }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-[9999] flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 shadow-indigo-100/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <Activity className="w-4 h-4 text-indigo-500" />
                             Semua Aktivitas Setoran
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Log aktivitas hafalan santri</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-white">
                    {records.length > 0 ? (
                        <div className="space-y-2">
                            {records.map(rec => {
                                const student = students.find(s => s.id === rec.student_id);
                                return (
                                    <div key={rec.id} className="flex items-start p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                                        <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 shrink-0 shadow-sm ${rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-500 ring-4 ring-emerald-50' : rec.status === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-500 ring-4 ring-amber-50' : 'bg-rose-500 ring-4 ring-rose-50'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{student?.full_name || 'Santri'}</p>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(rec.record_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                                                {(() => {
                                                    const rawStatus = String(rec.status || rec.keterangan || '').toUpperCase().replace(/_/g, ' ').trim();
                                                    const isTidakSetor = rawStatus.includes('SETOR') && (rawStatus.includes('TIDAK') || rawStatus.includes('BELUM'));
                                                    
                                                    if (isTidakSetor) return null;

                                                    return rec.type === MemorizationType.SABAQ ? `${rec.ayat_end} Baris` : 
                                                           rec.type === MemorizationType.SABQI ? `${rec.ayat_end} Halaman` : 
                                                           `${rec.surah_name || '-'} • ${rec.ayat_start}-${rec.ayat_end}`;
                                                })()}
                                            </p>
                                            <div className="flex items-center mt-1.5 gap-2">
                                                <span className="text-[7px] font-black bg-white px-1.5 py-0.5 rounded-md border border-slate-100 text-slate-400 uppercase tracking-widest shadow-sm">{rec.type}</span>
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-widest ${
                                                    rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    rec.status === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {rec.status === MemorizationStatus.LANCAR ? 'Lancar' : 
                                                     rec.status === MemorizationStatus.TIDAK_LANCAR ? 'Tidak Lancar' : 
                                                     'Tidak Setor'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-400 uppercase tracking-widest text-[9px] font-black opacity-60">Belum ada aktivitas setoran.</div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Persistent Cache for Instant Navigation ---
// This keeps the dashboard data in memory so that when the user returns to the Home tab,
// the state is instantly available without a loading flicker.
interface DashboardCache {
    students: Student[];
    recentRecords: MemorizationRecord[];
    adminStats: AdminStats | null;
    guardianStats: GuardianDashboardStats | null;
    studentProfile: Student | null;
    myHalaqah: Halaqah | null;
    teacherStats: TeacherStats | null;
    studentHalaqah: Halaqah | null;
    halaqahTeacher: UserProfile | null;
    achievements: Achievement[];
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    activeDays: number[];
    hasLoadedOnce: boolean;
}

const dashboardCache: DashboardCache = {
    students: [],
    recentRecords: [],
    adminStats: null,
    guardianStats: null,
    studentProfile: null,
    myHalaqah: null,
    teacherStats: null,
    studentHalaqah: null,
    halaqahTeacher: null,
    achievements: [],
    halaqahs: [],
    allUsers: [],
    activeDays: [1, 2, 3, 4, 5, 6, 0],
    hasLoadedOnce: false
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [students, setStudents] = useState<Student[]>(dashboardCache.students);
  const [recentRecords, setRecentRecords] = useState<MemorizationRecord[]>(dashboardCache.recentRecords);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(dashboardCache.adminStats);
  const [guardianStats, setGuardianStats] = useState<GuardianDashboardStats | null>(dashboardCache.guardianStats);
  const [studentProfile, setStudentProfile] = useState<Student | null>(dashboardCache.studentProfile); 
  const [loading, setLoading] = useState(!dashboardCache.hasLoadedOnce);
  
  // Teacher-specific state
  const [myHalaqah, setMyHalaqah] = useState<Halaqah | null>(dashboardCache.myHalaqah);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(dashboardCache.teacherStats);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false); 

  // Guardian Specific State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [studentHalaqah, setStudentHalaqah] = useState<Halaqah | null>(dashboardCache.studentHalaqah);
  const [halaqahTeacher, setHalaqahTeacher] = useState<UserProfile | null>(dashboardCache.halaqahTeacher);
  const [achievements, setAchievements] = useState<Achievement[]>(dashboardCache.achievements);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(dashboardCache.halaqahs);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(dashboardCache.allUsers);
  const [activeDays, setActiveDays] = useState<number[]>(dashboardCache.activeDays);

  // State for Chart Filter
  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [isPendingManzilModalOpen, setIsPendingManzilModalOpen] = useState(false);
  const [weeklyTarget, setWeeklyTarget] = useState<WeeklyTarget | null>(null);

  // NEW: Line Chart States
  const [lineChartType, setLineChartType] = useState<MemorizationType>(MemorizationType.SABAQ);
  const [lineChartRange, setLineChartRange] = useState<'pekanan' | 'bulanan' | 'semesteran' | 'tahunan'>('pekanan');
  const [chartWeekOffset, setChartWeekOffset] = useState(0);
  const [chartMonth, setChartMonth] = useState(new Date().getMonth());
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [perfTimeframe, setPerfTimeframe] = useState<'pekanan' | 'bulanan'>('pekanan');
  const [perfType, setPerfType] = useState<MemorizationType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Admin Chart Filters
  const [adminTrendType, setAdminTrendType] = useState<MemorizationType | 'all'>('all');
  const [adminTrendPeriod, setAdminTrendPeriod] = useState<'weekly' | 'monthly' | '3months' | '6months' | 'yearly'>('monthly');
  const [adminTrendWeekOffset, setAdminTrendWeekOffset] = useState(0);
  const [adminTrendMonth, setAdminTrendMonth] = useState(new Date().getMonth());
  const [adminTrendYear, setAdminTrendYear] = useState(new Date().getFullYear());
  const [adminAllRecords, setAdminAllRecords] = useState<MemorizationRecord[]>([]);
  const [loadingAdminTrend, setLoadingAdminTrend] = useState(false);

  // Admin Quality Filters (Independent from Trend)
  const [perfWeekOffset, setPerfWeekOffset] = useState(0);
  const [perfMonth, setPerfMonth] = useState(new Date().getMonth());
  const [perfYear, setPerfYear] = useState(new Date().getFullYear());
  const [perfRecords, setPerfRecords] = useState<MemorizationRecord[]>([]);
  const [loadingPerfRecords, setLoadingPerfRecords] = useState(false);

  // Admin Target Achievement Chart States
  const [adminTargetHalaqahId, setAdminTargetHalaqahId] = useState<string>('all');
  const [adminTargetWeekOffset, setAdminTargetWeekOffset] = useState<number>(0);
  const [adminTargetData, setAdminTargetData] = useState<any[]>([]);
  const [loadingAdminTargetChart, setLoadingAdminTargetChart] = useState(false);

  // Clear cache if user changed (CRITICAL for Account Switching)
  useEffect(() => {
    if (dashboardCache.hasLoadedOnce && dashboardCache.allUsers.length > 0) {
        // Find if the current user is different from the one who cached the data
        const cachedUser = dashboardCache.allUsers.find(u => u.role === user.role);
        // Simple heuristic: if we switch roles or it's a new session, clear cache
        if (!cachedUser || cachedUser.id !== user.id) {
            Object.keys(dashboardCache).forEach(key => {
                if (key === 'hasLoadedOnce') (dashboardCache as any)[key] = false;
                else if (Array.isArray((dashboardCache as any)[key])) (dashboardCache as any)[key] = [];
                else (dashboardCache as any)[key] = null;
            });
        }
    }
  }, [user.id]);

  // Body scroll lock effect
  useEffect(() => {
    const isAnyModalOpen = isActivityModalOpen || isPendingModalOpen || isExamModalOpen || isAchievementModalOpen || isPendingManzilModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isActivityModalOpen, isPendingModalOpen, isExamModalOpen, isAchievementModalOpen, isPendingManzilModalOpen]);

  const refreshData = React.useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      if (user.role === UserRole.TEACHER) {
          const [allHalaqahs, tenantData] = await Promise.all([
              getHalaqahs(user.tenant_id),
              getTenant(user.tenant_id)
          ]);
          
          if (tenantData?.cycle_config?.activeDays) {
              setActiveDays(tenantData.cycle_config.activeDays);
              dashboardCache.activeDays = tenantData.cycle_config.activeDays;
          }

          const teacherHalaqah = allHalaqahs.find(h => h.teacher_id === user.id) || null;
          setMyHalaqah(teacherHalaqah);
          dashboardCache.myHalaqah = teacherHalaqah;
          
          let studentsInHalaqah: Student[] = [];
          if (teacherHalaqah) {
              studentsInHalaqah = await getStudentsByHalaqah(teacherHalaqah.id);
              setStudents(studentsInHalaqah);
              dashboardCache.students = studentsInHalaqah;

              const stats = await getTeacherStats(studentsInHalaqah);
              setTeacherStats(stats);
              dashboardCache.teacherStats = stats;

              const halaqahRecords = await getHalaqahRecords(studentsInHalaqah.map(s => s.id));
              setRecentRecords(halaqahRecords);
              dashboardCache.recentRecords = halaqahRecords;
              
              dashboardCache.hasLoadedOnce = true;
          } else {
              setStudents([]); 
              dashboardCache.students = [];
              setRecentRecords([]);
              dashboardCache.recentRecords = [];
          }

      } else if (user.role === UserRole.SANTRI) {
          const allStudents = await getStudents(user.tenant_id);
          const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents.find(s => s.id === user.id);
          const studentToLoad = myStudent || allStudents.find(s => s.id === 's1') || null; 
          setStudentProfile(studentToLoad);
          dashboardCache.studentProfile = studentToLoad;
          
          if (studentToLoad) {
              const recs = await getStudentRecords(studentToLoad.id);
              recs.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
              setRecentRecords(recs);
              dashboardCache.recentRecords = recs;

              const stats = await getGuardianStats(studentToLoad.id);
              setGuardianStats(stats);
              dashboardCache.guardianStats = stats;
              
              const achs = await getAchievements(studentToLoad.id);
              setAchievements(achs);
              dashboardCache.achievements = achs;
              
              if (studentToLoad.halaqah_id) {
                  const [allHalaqahs, allUsers, tenantData] = await Promise.all([
                      getHalaqahs(user.tenant_id),
                      getUsers(user.tenant_id),
                      getTenant(user.tenant_id)
                  ]);
                  
                  if (tenantData?.cycle_config?.activeDays) {
                      setActiveDays(tenantData.cycle_config.activeDays);
                      dashboardCache.activeDays = tenantData.cycle_config.activeDays;
                  }

                  const foundHalaqah = allHalaqahs.find(h => h.id === studentToLoad.halaqah_id) || null;
                  if (foundHalaqah) {
                      setStudentHalaqah(foundHalaqah);
                      dashboardCache.studentHalaqah = foundHalaqah;
                      const foundTeacher = allUsers.find(u => u.id === foundHalaqah.teacher_id) || null;
                      if (foundTeacher) {
                          setHalaqahTeacher(foundTeacher);
                          dashboardCache.halaqahTeacher = foundTeacher;
                      }
                  }
              }

              const monday = new Date();
              const day = monday.getDay();
              const diff = (day === 0 ? -6 : 1) - day;
              monday.setDate(monday.getDate() + diff);
              const weekStart = monday.toISOString().split('T')[0];
              
              getWeeklyTargets([studentToLoad.id], weekStart).then(targets => {
                  if (targets.length > 0) setWeeklyTarget(targets[0]);
              });
          }

      } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
          const [stats, studentList, halaqahList, userList, tenantData] = await Promise.all([
              getAdminStats(user.tenant_id),
              getStudents(user.tenant_id),
              getHalaqahs(user.tenant_id),
              getUsers(user.tenant_id),
              getTenant(user.tenant_id)
          ]);
          setAdminStats(stats);
          setStudents(studentList);
          setHalaqahs(halaqahList);
          setAllUsers(userList);
          
          if (tenantData?.cycle_config?.activeDays) {
              setActiveDays(tenantData.cycle_config.activeDays);
              dashboardCache.activeDays = tenantData.cycle_config.activeDays;
          }
          
          dashboardCache.adminStats = stats;
          dashboardCache.students = studentList;
          dashboardCache.halaqahs = halaqahList;
          dashboardCache.allUsers = userList;

          // Fetch initial records for trend
          const studentIds = studentList.map(s => s.id);
          const start = new Date(adminTrendYear, adminTrendMonth, 1);
          const end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
          
          const formatD = (d: Date) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${day}`;
          };

          const records = await getTenantRecords(studentIds, formatD(start), formatD(end));
          setAdminAllRecords(records);
      }
    } catch (err) {
        console.error("Dashboard data load error:", err);
    } finally {
        setLoading(false);
        setIsRefreshing(false);
        dashboardCache.hasLoadedOnce = true;
    }
  }, [user, adminTrendMonth, adminTrendYear]);

  // Handle Admin Filter Changes
  useEffect(() => {
    if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
        const fetchRangeData = async () => {
            setLoadingAdminTrend(true);
            try {
                const studentIds = students.map(s => s.id);
                
                let start, end;
                if (adminTrendPeriod === 'weekly') {
                    // Sync with Target Monitor logic (Monday - Sunday/End of active days)
                    const today = new Date();
                    const day = today.getDay();
                    const diff = (day === 0 ? -6 : 1) - day + (adminTrendWeekOffset * 7);
                    start = new Date(today);
                    start.setDate(today.getDate() + diff);
                    
                    end = new Date(start);
                    const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                    end.setDate(start.getDate() + rangeLength);
                } else if (adminTrendPeriod === 'monthly') {
                    start = new Date(adminTrendYear, adminTrendMonth, 1);
                    end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                } else if (adminTrendPeriod === '3months') {
                    end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                    start = new Date(adminTrendYear, adminTrendMonth - 2, 1);
                } else if (adminTrendPeriod === '6months') {
                    // Normalize to fixed semesters: Jan-Jun or Jul-Dec
                    if (adminTrendMonth < 6) {
                        start = new Date(adminTrendYear, 0, 1);
                        end = new Date(adminTrendYear, 6, 0); // End of June
                    } else {
                        start = new Date(adminTrendYear, 6, 1);
                        end = new Date(adminTrendYear, 12, 0); // End of December
                    }
                } else if (adminTrendPeriod === 'yearly') {
                    start = new Date(adminTrendYear, 0, 1);
                    end = new Date(adminTrendYear, 11, 31);
                } else {
                    start = new Date(adminTrendYear, adminTrendMonth, 1);
                    end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                }
                
                const formatD = (d: Date) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };

                const records = await getTenantRecords(studentIds, formatD(start), formatD(end));
                setAdminAllRecords(records);
            } catch (error) {
                console.error("Error fetching admin trend records:", error);
            } finally {
                setLoadingAdminTrend(false);
            }
        };
        fetchRangeData();
    }
  }, [adminTrendMonth, adminTrendYear, adminTrendPeriod, adminTrendWeekOffset, user.role, students.length]);

  // Fetch Records for Quality Chart (Independent)
  useEffect(() => {
    if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
        const fetchPerfData = async () => {
            setLoadingPerfRecords(true);
            try {
                const studentIds = students.map(s => s.id);
                let start, end;
                if (perfTimeframe === 'pekanan') {
                    const today = new Date();
                    const day = today.getDay();
                    const diff = (day === 0 ? -6 : 1) - day + (perfWeekOffset * 7);
                    start = new Date(today);
                    start.setDate(today.getDate() + diff);
                    end = new Date(start);
                    const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                    end.setDate(start.getDate() + rangeLength);
                } else {
                    start = new Date(perfYear, perfMonth, 1);
                    end = new Date(perfYear, perfMonth + 1, 0);
                }

                const formatD = (d: Date) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };

                const records = await getTenantRecords(studentIds, formatD(start), formatD(end));
                setPerfRecords(records);
            } catch (error) {
                console.error("Error fetching perf records:", error);
            } finally {
                setLoadingPerfRecords(false);
            }
        };
        fetchPerfData();
    }
  }, [perfTimeframe, perfWeekOffset, perfMonth, perfYear, user.role, students.length]);

  const adminTargetWeekRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6
    const diff = (day === 0 ? -6 : 1) - day + (adminTargetWeekOffset * 7);
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    
    const end = new Date(start);
    const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
    end.setDate(start.getDate() + rangeLength);

    const formatToLocalISO = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayStr}`;
    };
    
    return {
        start: formatToLocalISO(start),
        end: formatToLocalISO(end),
        display: `${start.getDate()} ${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short' })} ${end.getFullYear()}`
    };
  }, [adminTargetWeekOffset, activeDays.length]);

  useEffect(() => {
    if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
        const fetchTargetAchievement = async () => {
            setLoadingAdminTargetChart(true);
            try {
                let filteredStudents = students;
                if (adminTargetHalaqahId !== 'all') {
                    filteredStudents = students.filter(s => s.halaqah_id === adminTargetHalaqahId);
                }
                
                if (filteredStudents.length === 0) {
                    setAdminTargetData([]);
                    return;
                }

                const studentIds = filteredStudents.map(s => s.id);
                const weekStart = adminTargetWeekRange.start;

                const [targets, weeklyTotals] = await Promise.all([
                    getWeeklyTargets(studentIds, weekStart),
                    getWeeklyAllTypeTotals(studentIds, weekStart)
                ]);

                // Achievement categories
                const stats = {
                    sabaq: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 },
                    sabqi: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 },
                    manzil: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 }
                };

                targets.forEach(t => {
                    const studentTotals = weeklyTotals[t.student_id] || { sabaq: 0, sabqi: 0, manzil: 0 };
                    const data = t.target_data || {};

                    // Sabaq
                    const sabaqTarget = Number(data.sabaq_target || 0);
                    const sabaqActual = Number(studentTotals.sabaq || 0);
                    if (sabaqTarget > 0) {
                        if (sabaqActual > sabaqTarget) stats.sabaq.terlampaui++;
                        else if (sabaqActual === sabaqTarget) stats.sabaq.tercapai++;
                        else stats.sabaq.tidakTercapai++;
                    }

                    // Sabqi
                    const sabqiTarget = Number(data.sabqi_target || 0);
                    const sabqiActual = Number(studentTotals.sabqi || 0);
                    if (sabqiTarget > 0) {
                        if (sabqiActual > sabqiTarget) stats.sabqi.terlampaui++;
                        else if (sabqiActual === sabqiTarget) stats.sabqi.tercapai++;
                        else stats.sabqi.tidakTercapai++;
                    }

                    // Manzil
                    const manzilTarget = Number(data.manzil_hal || 0);
                    const manzilActual = Number(studentTotals.manzil || 0);
                    if (manzilTarget > 0) {
                        if (manzilActual > manzilTarget) stats.manzil.terlampaui++;
                        else if (manzilActual === manzilTarget) stats.manzil.tercapai++;
                        else stats.manzil.tidakTercapai++;
                    }
                });

                const formattedData = [
                    { name: 'SABAQ', tercapai: stats.sabaq.tercapai, tidakTercapai: stats.sabaq.tidakTercapai, terlampaui: stats.sabaq.terlampaui },
                    { name: 'SABQI', tercapai: stats.sabqi.tercapai, tidakTercapai: stats.sabqi.tidakTercapai, terlampaui: stats.sabqi.terlampaui },
                    { name: 'MANZIL', tercapai: stats.manzil.tercapai, tidakTercapai: stats.manzil.tidakTercapai, terlampaui: stats.manzil.terlampaui }
                ];
                setAdminTargetData(formattedData);

            } catch (error) {
                console.error("Error fetching target achievement data:", error);
            } finally {
                setLoadingAdminTargetChart(false);
            }
        };
        fetchTargetAchievement();
    }
  }, [user.role, students, adminTargetHalaqahId, adminTargetWeekOffset, adminTargetWeekRange.start]);

  const adminTrendData = useMemo(() => {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) return [];
    
    // Determine aggregation level
    const isMonthlyAggregation = adminTrendPeriod !== 'weekly' && adminTrendPeriod !== 'monthly';
    const groups: Record<string, { sabaq: number, sabqi: number, manzil: number }> = {};
    
    // Set Range
    let start, end;
    if (adminTrendPeriod === 'weekly') {
        const today = new Date();
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day + (adminTrendWeekOffset * 7);
        start = new Date(today);
        start.setDate(today.getDate() + diff);
        
        end = new Date(start);
        const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
        end.setDate(start.getDate() + rangeLength);
    } else if (adminTrendPeriod === 'monthly') {
        start = new Date(adminTrendYear, adminTrendMonth, 1);
        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
    } else if (adminTrendPeriod === '3months') {
        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
        start = new Date(adminTrendYear, adminTrendMonth - 2, 1);
    } else if (adminTrendPeriod === '6months') {
        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
        start = new Date(adminTrendYear, adminTrendMonth - 5, 1);
    } else if (adminTrendPeriod === 'yearly') {
        start = new Date(adminTrendYear, 0, 1);
        end = new Date(adminTrendYear, 11, 31);
    } else {
        start = new Date(adminTrendYear, adminTrendMonth, 1);
        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
    }

    if (!isMonthlyAggregation) {
        // Daily Grouping
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            groups[dateStr] = { sabaq: 0, sabqi: 0, manzil: 0 };
        }
    } else {
        // Monthly Grouping
        for (let d = new Date(start); d <= end; ) {
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            groups[mKey] = { sabaq: 0, sabqi: 0, manzil: 0 };
            d.setMonth(d.getMonth() + 1);
        }
    }

    adminAllRecords.forEach(rec => {
        const dateStr = rec.record_date.split('T')[0];
        const mKey = dateStr.slice(0, 7); // YYYY-MM
        const key = isMonthlyAggregation ? mKey : dateStr;

        if (groups[key] !== undefined && rec.status !== MemorizationStatus.TIDAK_SETOR) {
             if (rec.type === MemorizationType.SABAQ) groups[key].sabaq++;
             else if (rec.type === MemorizationType.SABQI) groups[key].sabqi++;
             else if (rec.type === MemorizationType.MANZIL) groups[key].manzil++;
        }
    });

    return Object.entries(groups).map(([key, counts]) => {
        let name = "";
        if (!isMonthlyAggregation) {
            const d = new Date(key);
            name = d.getDate().toString();
        } else {
            const [y, m] = key.split('-');
            name = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
        }

        return {
            name,
            sabaq: counts.sabaq,
            sabqi: counts.sabqi,
            manzil: counts.manzil,
            fullDate: key
        };
    });
  }, [adminAllRecords, adminTrendMonth, adminTrendYear, adminTrendPeriod, user.role]);

  // Initial Data Fetch
  useEffect(() => {
    refreshData(!dashboardCache.hasLoadedOnce);
  }, [refreshData]);

  const weeklyProgressData = useMemo(() => {
    if (user.role !== UserRole.TEACHER && user.role !== UserRole.SANTRI) return [];
    
    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            date: d.toLocaleDateString('en-CA'), // YYYY-MM-DD
            label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
            sabaq: 0,
            sabqi: 0,
            manzil: 0
        });
    }

    recentRecords.forEach(rec => {
        const recDate = rec.record_date.split('T')[0];
        const dayMatch = days.find(d => d.date === recDate);
        if (dayMatch) {
            if (rec.type === MemorizationType.SABAQ) dayMatch.sabaq += (rec.ayat_end || 0);
            else if (rec.type === MemorizationType.SABQI) dayMatch.sabqi += (rec.ayat_end || 0);
            else if (rec.type === MemorizationType.MANZIL) dayMatch.manzil += 1; // Count per set for Manzil
        }
    });

    return days;
  }, [recentRecords, user.role]);

  const filteredRecentRecords = useMemo(() => {
    return recentRecords.filter(r => 
        r.status && 
        r.status !== MemorizationStatus.EMPTY
    );
  }, [recentRecords]);

  const teacherPieData = useMemo(() => {
    if (user.role !== UserRole.TEACHER) return [];
    
    const now = new Date();
    // Get Monday of current week (local time)
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // For Monthly: First day of current month
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const cutoffStr = perfTimeframe === 'pekanan' ? weekStartStr : monthStartStr;

    const totals = { 
        [MemorizationStatus.LANCAR]: 0, 
        [MemorizationStatus.TIDAK_LANCAR]: 0, 
        [MemorizationStatus.TIDAK_SETOR]: 0 
    };

    recentRecords.forEach(rec => {
        if (!rec.record_date) return;
        
        // Use string comparison for dates to avoid timezone shifts
        const rDate = rec.record_date.split('T')[0];
        
        // Type Filter logic: show all if perfType is 'all'
        const isTypeMatch = perfType === 'all' || String(rec.type).toLowerCase() === String(perfType).toLowerCase();
        
        if (rDate >= cutoffStr && isTypeMatch) {
            const rawStatus = String(rec.status || rec.keterangan || '').toUpperCase().replace(/_/g, ' ').trim();
            
            // Comprehensive status matching - check for 'SETOR' and 'TIDAK' keywords
            const isTidakSetor = rawStatus.includes('SETOR') && (rawStatus.includes('TIDAK') || rawStatus.includes('BELUM'));
            const isTidakLancar = rawStatus.includes('LANCAR') && (rawStatus.includes('TIDAK') || rawStatus.includes('BELUM'));
            const isLancar = rawStatus.includes('LANCAR') && !isTidakLancar;

            if (isLancar) {
                totals[MemorizationStatus.LANCAR]++;
            } else if (isTidakLancar) {
                totals[MemorizationStatus.TIDAK_LANCAR]++;
            } else if (isTidakSetor) {
                totals[MemorizationStatus.TIDAK_SETOR]++;
            }
        }
    });

    const totalCount = Object.values(totals).reduce((a, b) => a + b, 0);

    const data = [
      { name: 'Lancar', value: totals[MemorizationStatus.LANCAR], color: '#10b981' },
      { name: 'Tidak Lancar', value: totals[MemorizationStatus.TIDAK_LANCAR], color: '#f59e0b' },
      { name: 'Tidak Setor', value: totals[MemorizationStatus.TIDAK_SETOR], color: '#f43f5e' }
    ];

    // If no data, show a neutral state
    if (totalCount === 0) {
        return [{ name: 'Belum Ada Data', value: 1, color: '#f1f5f9' }];
    }

    return data;
  }, [recentRecords, user.role, perfTimeframe, perfType]);

  const studentsNotDeposited = useMemo(() => {
    if (user.role !== UserRole.TEACHER) return [];
    
    // Get distinct IDs of students who have a record TODAY
    const today = new Date().toISOString().split('T')[0];
    const depositedStudentIds = new Set(
        recentRecords
            .filter(r => r.record_date.startsWith(today))
            .map(r => r.student_id)
    );

    // Filter students who are NOT in that set
    return students.filter(s => !depositedStudentIds.has(s.id));
  }, [students, recentRecords, user.role]);

  const studentPieData = useMemo(() => {
    if (user.role !== UserRole.SANTRI) return [];
    
    const totals = { sabaq: 0, sabqi: 0, manzil: 0 };
    weeklyProgressData.forEach(day => {
        totals.sabaq += day.sabaq;
        totals.sabqi += day.sabqi;
        totals.manzil += day.manzil;
    });

    const data = [
      { name: 'Sabaq', value: totals.sabaq, color: '#ef4444' },
      { name: 'Sabqi', value: totals.sabqi, color: '#f59e0b' },
      { name: 'Manzil', value: totals.manzil, color: '#10b981' }
    ].filter(item => item.value > 0);

    return data;
  }, [weeklyProgressData, user.role]);

  const monthlyStats = useMemo(() => {
    if (user.role !== UserRole.SANTRI) return { sabaq: 0, sabqi: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let sabaq = 0;
    let sabqi = 0;
    recentRecords.forEach(rec => {
        const d = new Date(rec.record_date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (rec.type === MemorizationType.SABAQ) sabaq += (rec.jumlah || rec.ayat_end || 0);
            if (rec.type === MemorizationType.SABQI) sabqi += (rec.jumlah || rec.ayat_end || 0);
        }
    });
    return { sabaq, sabqi };
  }, [recentRecords, user.role]);

  // Helper for Guardian View Colors
  const getAchievementColorClass = (color?: string) => {
    switch (color) {
        case 'emerald': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
        case 'blue': return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'orange': return 'bg-orange-50 text-orange-600 border-orange-200';
        case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200';
        case 'pink': return 'bg-pink-50 text-pink-600 border-pink-200';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Guardian View Helpers & Memoized Data
  const chartData = useMemo(() => {
    if (user.role !== UserRole.SANTRI) return [];
    
    const isMatch = (recDate: string | undefined, targetY: number, targetM: number, targetD?: number) => {
        if (!recDate) return false;
        const parts = recDate.split(/[-T ]/).map(p => parseInt(p));
        if (!parts[0] || !parts[1]) return false;
        
        if (targetD !== undefined) {
            return parts[0] === targetY && parts[1] === (targetM + 1) && parts[2] === targetD;
        }
        return parts[0] === targetY && parts[1] === (targetM + 1);
    };

    const filteredRecords = recentRecords.filter(r => r.type === lineChartType);
    let data: any[] = [];

    if (lineChartRange === 'pekanan') {
        const fullDays = [
            { id: 1, label: 'Sen' },
            { id: 2, label: 'Sel' },
            { id: 3, label: 'Rab' },
            { id: 4, label: 'Kam' },
            { id: 5, label: 'Jum' },
            { id: 6, label: 'Sab' },
            { id: 0, label: 'Min' }
        ];

        const activeFullDays = fullDays.filter(fd => activeDays.includes(fd.id));

        const monday = new Date();
        const diff = (monday.getDay() === 0 ? -6 : 1) - monday.getDay() + (chartWeekOffset * 7);
        monday.setDate(monday.getDate() + diff);

        data = activeFullDays.map((fd) => {
            const d = new Date(monday);
            // Adjust d to the specific day id
            // If fd.id is 1 (Mon), offset is 0. If fd.id is 2 (Tue), offset is 1.
            // If fd.id is 0 (Sun), offset is 6.
            const dayOffset = fd.id === 0 ? 6 : fd.id - 1;
            d.setDate(monday.getDate() + dayOffset);
            
            const daySum = filteredRecords
                .filter(r => isMatch(r.record_date, d.getFullYear(), d.getMonth(), d.getDate()))
                .reduce((sum, r) => sum + Number(r.jumlah || r.ayat_end || 0), 0);
            return { name: fd.label, amount: daySum, day: d.getDate() };
        });
    } else if (lineChartRange === 'bulanan') {
        const daysInMonth = new Date(chartYear, chartMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const daySum = filteredRecords
                .filter(r => isMatch(r.record_date, chartYear, chartMonth, i))
                .reduce((sum, r) => sum + Number(r.jumlah || r.ayat_end || 0), 0);
            data.push({ name: `${i}`, amount: daySum, day: i });
        }
    } else if (lineChartRange === 'semesteran') {
        const monthsInIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const startIdx = chartMonth < 6 ? 0 : 6;
        const endIdx = chartMonth < 6 ? 5 : 11;
        
        for (let i = startIdx; i <= endIdx; i++) {
            const monthlySum = filteredRecords
                .filter(r => {
                    if (!r.record_date) return false;
                    const parts = r.record_date.split(/[-T ]/).map(p => parseInt(p));
                    return parts[0] === chartYear && (parts[1] - 1) === i;
                })
                .reduce((sum, r) => sum + Number(r.jumlah || r.ayat_end || 0), 0);
            data.push({ name: monthsInIndo[i], amount: monthlySum, month: i });
        }
    } else if (lineChartRange === 'tahunan') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        data = months.map((monthName, index) => {
            const monthlySum = filteredRecords
                .filter(r => {
                    if (!r.record_date) return false;
                    const parts = r.record_date.split(/[-T ]/).map(p => parseInt(p));
                    return parts[0] === chartYear && (parts[1] - 1) === index;
                })
                .reduce((sum, r) => sum + Number(r.jumlah || r.ayat_end || 0), 0);
            return { name: monthName, amount: monthlySum, month: index };
        });
    }
    return data;
  }, [lineChartType, lineChartRange, chartWeekOffset, chartMonth, chartYear, recentRecords, user.role]);

  const chartTotal = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.amount, 0);
  }, [chartData]);

  const chartTimeframeLabel = useMemo(() => {
    if (lineChartRange === 'pekanan') {
        return chartWeekOffset === 0 ? 'Pekan Ini' : 
               chartWeekOffset === -1 ? 'Pekan Lalu' : 
               chartWeekOffset === 1 ? 'Pekan Depan' : 
               `${Math.abs(chartWeekOffset)} Pekan ${chartWeekOffset < 0 ? 'Lalu' : 'Depan'}`;
    } else if (lineChartRange === 'bulanan') {
        const diff = (chartYear - new Date().getFullYear()) * 12 + (chartMonth - new Date().getMonth());
        return diff === 0 ? 'Bulan Ini' : diff === -1 ? 'Bulan Lalu' : diff === 1 ? 'Bulan Depan' : `${Math.abs(diff)} Bulan ${diff < 0 ? 'Lalu' : 'Depan'}`;
    } else {
        const diff = chartYear - new Date().getFullYear();
        return diff === 0 ? 'Tahun Ini' : diff === -1 ? 'Tahun Lalu' : diff === 1 ? 'Tahun Depan' : `${Math.abs(diff)} Tahun ${diff < 0 ? 'Lalu' : 'Depan'}`;
    }
  }, [lineChartRange, chartWeekOffset, chartMonth, chartYear]);

  // Remove global loading return to prevent full-page flicker
  // if (loading) return <div className="p-8 lg:p-12"><DashboardSkeleton /></div>;

  // --- TEACHER VIEW ---
  if (user.role === UserRole.TEACHER) {
    const displayedPending = studentsNotDeposited.slice(0, 4);
    const hasMorePending = studentsNotDeposited.length > 4;

    return (
      <div className="flex-1 h-auto flex flex-col gap-4 lg:gap-6 animate-fade-in pb-24 lg:pb-12">
        {user.role === UserRole.TEACHER && !myHalaqah && !loading && (
           <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-center gap-3 text-amber-800 shadow-sm shadow-amber-50">
               <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
               <p className="text-xs font-bold uppercase tracking-tight">Anda belum ditugaskan ke halaqah manapun. Hubungi admin untuk pengaturan halaqah.</p>
           </div>
        )}

        {/* TOP STATS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
          <div className="bg-white rounded-[22px] p-3.5 lg:p-5 border-2 border-slate-50 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Users className="w-4 h-4 lg:w-5 lg:h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Total Santri</p>
                <h4 className="text-base lg:text-xl font-black text-slate-800 leading-none">{students.length}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-3.5 lg:p-5 border-2 border-slate-50 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-rose-50 text-rose-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Book className="w-4 h-4 lg:w-5 lg:h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Sabaq Hari Ini</p>
                <h4 className="text-base lg:text-xl font-black text-slate-800 leading-none">{teacherStats?.sabaqToday ?? 0}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-3.5 lg:p-5 border-2 border-slate-50 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-amber-50 text-amber-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Zap className="w-4 h-4 lg:w-5 lg:h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Sabqi Hari Ini</p>
                <h4 className="text-base lg:text-xl font-black text-slate-800 leading-none">{teacherStats?.sabqiToday ?? 0}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-3.5 lg:p-5 border-2 border-slate-50 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-emerald-50 text-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Activity className="w-4 h-4 lg:w-5 lg:h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Manzil Hari Ini</p>
                <h4 className="text-base lg:text-xl font-black text-slate-800 leading-none">{teacherStats?.manzilToday ?? 0}</h4>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
            <div className="bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-4 lg:p-6 flex flex-col h-full relative">
                <div className="flex flex-row items-center justify-between gap-2 mb-3 lg:mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[9.5px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                            Performa {perfTimeframe === 'pekanan' ? 'Pekan' : 'Bulan'}
                        </h3>
                        
                        {/* Desktop Filters */}
                        <div className="hidden lg:flex items-center gap-2">
                            {/* Type Tabs Filter */}
                            <div className="flex flex-none bg-slate-50 p-0.5 rounded-xl border border-slate-100 shadow-sm transition-all group hover:border-indigo-100">
                                {[
                                    { id: 'all', label: 'Semua' },
                                    { id: MemorizationType.SABAQ, label: 'Sabaq' },
                                    { id: MemorizationType.SABQI, label: 'Sabqi' },
                                    { id: MemorizationType.MANZIL, label: 'Manzil' }
                                ].map(type => (
                                    <button 
                                        key={type.id}
                                        onClick={() => setPerfType(type.id as any)}
                                        className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                                            perfType === type.id ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Timeframe Filter */}
                            <div className="flex flex-none bg-slate-50 p-0.5 rounded-xl border border-slate-100 shadow-sm transition-all group hover:border-indigo-100">
                                {[
                                    { id: 'pekanan', label: 'Pekan' },
                                    { id: 'bulanan', label: 'Bulan' }
                                ].map(tf => (
                                    <button 
                                        key={tf.id}
                                        onClick={() => setPerfTimeframe(tf.id as any)}
                                        className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                                            perfTimeframe === tf.id ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsActivityModalOpen(true)}
                            className="bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-[9px] font-black text-indigo-500 uppercase tracking-widest transition-all active:scale-95 border border-indigo-100/50"
                        >
                            Log
                        </button>

                        <button 
                            onClick={() => refreshData(false)}
                            disabled={isRefreshing}
                            className={`p-2 lg:p-1.5 bg-indigo-50 lg:bg-slate-50 text-indigo-400 lg:text-slate-400 rounded-xl lg:rounded-lg border border-indigo-100 lg:border-slate-100 hover:text-indigo-600 hover:border-indigo-100 transition-all ${isRefreshing ? 'opacity-50' : 'active:scale-90 lg:active:scale-95 shadow-sm lg:shadow-none'}`}
                        >
                            <RotateCcw className={`w-3.5 h-3.5 lg:w-3 lg:h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Mobile-only Filters Bar - Wrapping Layout */}
                <div className="lg:hidden flex flex-col gap-2.5 mb-4">
                    <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-100 shadow-sm w-full divide-x divide-slate-200/50">
                        {['all', MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setPerfType(t as any)}
                                className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${perfType === t ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400'}`}
                            >
                                {String(t).replace('all', 'Semua')}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-100 shadow-sm w-full divide-x divide-slate-200/50">
                        {['pekanan', 'bulanan'].map(tf => (
                            <button 
                                key={tf} 
                                onClick={() => setPerfTimeframe(tf as any)}
                                className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${perfTimeframe === tf ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400'}`}
                            >
                                {tf === 'pekanan' ? 'Pekan' : 'Bulan'}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] w-full">
                    {teacherPieData.length > 0 ? (
                        <>
                            <div className="w-full h-[140px] lg:h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={teacherPieData}
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={8}
                                            dataKey="value"
                                            labelLine={false}
                                            animationDuration={1500}
                                        >
                                            {teacherPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={5} stroke="#fff" className="focus:outline-none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className={`${teacherPieData.length === 1 ? 'flex justify-center' : 'grid grid-cols-3'} gap-2 w-full mt-2`}>
                                {teacherPieData.map(entry => {
                                    const totalValue = teacherPieData.reduce((acc, curr) => acc + curr.value, 0);
                                    const percentage = totalValue > 0 ? Math.round((entry.value / totalValue) * 100) : 0;
                                    const isNoData = entry.name === 'Belum Ada Data';

                                    return (
                                        <div key={entry.name} className={`bg-slate-50/80 rounded-2xl p-2 lg:p-3 border border-slate-100 flex flex-col items-center justify-center group hover:bg-white hover:shadow-md transition-all ${isNoData ? 'min-w-[120px]' : ''}`}>
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                                                <span className="text-[7px] lg:text-[9px] font-black text-slate-400 uppercase tracking-tight lg:tracking-widest whitespace-nowrap">{entry.name}</span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-[10px] lg:text-sm font-black text-slate-800">{isNoData ? 0 : entry.value}</p>
                                                {!isNoData && <p className="text-[7.5px] lg:text-[9px] font-bold text-slate-400">({percentage}%)</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <EmptyState 
                            message="Data Tidak Ditemukan" 
                            description="Belum ada aktivitas setoran tercatat untuk pekan ini."
                            icon="ghost"
                        />
                    )}
                </div>
            </div>
        </div>

        <RecentActivityModal 
            isOpen={isActivityModalOpen}
            onClose={() => setIsActivityModalOpen(false)}
            records={filteredRecentRecords}
            students={students}
        />

        <PendingStudentsModal 
            isOpen={isPendingModalOpen}
            onClose={() => setIsPendingModalOpen(false)}
            students={studentsNotDeposited}
            onNavigate={onNavigate || (() => {})}
        />
      </div>
    );
  }

  // --- GUARDIAN VIEW (ADMIN-STYLE REDESIGN) ---
  if (user.role === UserRole.SANTRI) {
    if (!studentProfile && !loading) {
        return (
            <div className="h-[calc(100vh-140px)] flex items-center justify-center animate-fade-in">
                <EmptyState 
                    message="Data santri tidak ditemukan." 
                    description="Akun ini belum terhubung dengan data santri manapun. Silakan hubungi admin sekolah untuk penautan data."
                    icon="user"
                />
            </div>
        );
    }

    return (
      <div className="flex flex-col gap-3 lg:gap-6 animate-fade-in relative min-h-[calc(100vh-100px)] lg:min-h-0">
        {/* STATS STRIP - UNIFIED GRID (2 boxes per row on mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4 shrink-0">
            {[
                { label: 'Ustadz Pengampu', value: halaqahTeacher?.full_name || 'Menunggu...', icon: User, color: 'indigo' },
                { label: 'Halaqah', value: studentHalaqah?.name || 'Belum Ada', icon: School, color: 'orange' }
            ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[18px] p-2 lg:p-5 border border-slate-200 shadow-sm flex items-center gap-2.5 lg:gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className={`w-7 h-7 lg:w-10 lg:h-10 rounded-lg lg:rounded-2xl flex items-center justify-center shadow-sm relative z-10 ${
                        stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                        stat.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                        stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                    }`}>
                        <stat.icon className="w-3.5 h-3.5 lg:w-5 lg:h-5"/>
                    </div>
                    <div className="relative z-10 flex-1 min-w-0 text-left">
                        <p className="text-[7.5px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 lg:mb-1.5">{stat.label}</p>
                        <h4 className="text-[10.5px] lg:text-sm font-black text-slate-800 leading-tight truncate w-full" title={stat.value}>
                            {stat.value}
                        </h4>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 shrink-0">
            {/* Unified Filter Row - Type & Range */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
                {/* Type Filter */}
                <div className="flex bg-white p-1 rounded-[18px] border border-slate-200 shadow-sm ring-1 ring-white shrink-0">
                    {[
                        { id: MemorizationType.SABAQ, label: 'Sabaq', sub: 'Baru' },
                        { id: MemorizationType.SABQI, label: 'Sabqi', sub: 'Dekat' },
                        { id: MemorizationType.MANZIL, label: 'Manzil', sub: 'Jauh' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setLineChartType(t.id as MemorizationType)}
                            className={`px-2.5 lg:px-4 py-1 rounded-xl transition-all flex flex-col items-center justify-center min-w-[55px] lg:min-w-[70px] ${
                                lineChartType === t.id ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-500'
                            }`}
                        >
                            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest leading-none">{t.label}</span>
                            <span className={`text-[6.5px] mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none ${lineChartType === t.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                                {t.sub}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Range Filter */}
                <div className="flex bg-white p-1 rounded-[18px] border border-slate-200 shadow-sm ring-1 ring-white shrink-0">
                    {[
                        { id: 'pekanan', label: 'Pekan', sub: 'Mingguan' },
                        { id: 'bulanan', label: 'Bulan', sub: 'Bulanan' },
                        { id: 'semesteran', label: 'Semester', sub: 'Semesteran' },
                        { id: 'tahunan', label: 'Tahun', sub: 'Tahunan' }
                    ].map(r => (
                        <button
                            key={r.id}
                            onClick={() => setLineChartRange(r.id as any)}
                            className={`px-2.5 lg:px-4 py-1 rounded-xl transition-all flex flex-col items-center justify-center min-w-[55px] lg:min-w-[80px] ${
                                lineChartRange === r.id ? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-100/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-500'
                            }`}
                        >
                            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest leading-none">{r.label}</span>
                            <span className={`text-[6.5px] mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none ${lineChartRange === r.id ? 'text-emerald-300' : 'text-slate-300'}`}>
                                {r.sub}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeframe Selector (Dynamic based on Range) */}
            <div className="flex bg-white p-1 rounded-[18px] border border-slate-200 shadow-sm ring-1 ring-white w-full xl:w-[320px] justify-between items-center h-[44px]">
                {lineChartRange === 'pekanan' && (
                    <>
                        <button 
                            onClick={() => setChartWeekOffset(prev => prev - 1)}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-2 py-1 text-[9.5px] lg:text-[10px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center flex-1 min-w-0">
                            <span className="flex items-center gap-2 whitespace-nowrap leading-none truncate w-full justify-center">
                                <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                                {(() => {
                                    const monday = new Date();
                                    const day = monday.getDay();
                                    const diff = (day === 0 ? -6 : 1) - day + (chartWeekOffset * 7);
                                    monday.setDate(monday.getDate() + diff);
                                    
                                    const sunday = new Date(monday);
                                    sunday.setDate(monday.getDate() + 6);
                                    
                                    return `${monday.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - ${sunday.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                                })()}
                            </span>
                            <span className="text-[7px] text-indigo-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none">
                                {chartWeekOffset === 0 ? 'Pekan Ini' : 
                                 chartWeekOffset === -1 ? 'Pekan Lalu' : 
                                 chartWeekOffset === 1 ? 'Pekan Depan' : 
                                 chartWeekOffset < 0 ? `${Math.abs(chartWeekOffset)} Pekan Lalu` : 
                                 `${chartWeekOffset} Pekan Depan`}
                            </span>
                        </div>
                        <button 
                            onClick={() => setChartWeekOffset(prev => prev + 1)}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {lineChartRange === 'semesteran' && (
                    <>
                        <button 
                            onClick={() => {
                                // Toggle between Jan-Jun (0-5) and Jul-Dec (6-11)
                                if (chartMonth < 6) {
                                    setChartMonth(6);
                                    setChartYear(prev => prev - 1);
                                } else {
                                    setChartMonth(0);
                                }
                            }}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-2 py-1 text-[9.5px] lg:text-[10px] font-black uppercase tracking-widest text-rose-600 flex flex-col items-center justify-center flex-1 min-w-0">
                            <span className="flex items-center gap-2 whitespace-nowrap leading-none truncate w-full justify-center">
                                <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                                {chartMonth < 6 ? `Jan - Jun ${chartYear}` : `Jul - Des ${chartYear}`}
                            </span>
                            <span className="text-[7px] text-rose-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none">
                                {(() => {
                                    const today = new Date();
                                    const curY = today.getFullYear();
                                    const isH1 = today.getMonth() < 6;
                                    if (chartYear === curY && (chartMonth < 6) === isH1) return 'Semester Ini';
                                    return 'Semester Lain';
                                })()}
                            </span>
                        </div>
                        <button 
                            onClick={() => {
                                if (chartMonth < 6) {
                                    setChartMonth(6);
                                } else {
                                    setChartMonth(0);
                                    setChartYear(prev => prev + 1);
                                }
                            }}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {lineChartRange === 'bulanan' && (
                    <>
                        <button 
                            onClick={() => {
                                if (chartMonth === 0) {
                                    setChartMonth(11);
                                    setChartYear(prev => prev - 1);
                                } else setChartMonth(prev => prev - 1);
                            }}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-2 py-1 text-[9.5px] lg:text-[10px] font-black uppercase tracking-widest text-emerald-600 flex flex-col items-center justify-center flex-1 min-w-0">
                            <span className="flex items-center gap-2 whitespace-nowrap leading-none truncate w-full justify-center">
                                <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                                {new Date(chartYear, chartMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-[7px] text-emerald-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none">
                                {(() => {
                                    const today = new Date();
                                    const curM = today.getMonth();
                                    const curY = today.getFullYear();
                                    const diff = (chartYear - curY) * 12 + (chartMonth - curM);
                                    
                                    if (diff === 0) return 'Bulan Ini';
                                    if (diff === -1) return 'Bulan Lalu';
                                    if (diff === 1) return 'Bulan Depan';
                                    if (diff < 0) return `${Math.abs(diff)} Bulan Lalu`;
                                    return `${diff} Bulan Depan`;
                                })()}
                            </span>
                        </div>
                        <button 
                            onClick={() => {
                                if (chartMonth === 11) {
                                    setChartMonth(0);
                                    setChartYear(prev => prev + 1);
                                } else setChartMonth(prev => prev + 1);
                            }}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {lineChartRange === 'tahunan' && (
                    <>
                        <button 
                            onClick={() => setChartYear(prev => prev - 1)}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-2 py-1 text-[9.5px] lg:text-[10px] font-black uppercase tracking-widest text-amber-600 flex flex-col items-center justify-center flex-1 min-w-0">
                            <span className="flex items-center gap-2 whitespace-nowrap leading-none truncate w-full justify-center">
                                <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                                {chartYear}
                            </span>
                            <span className="text-[7px] text-amber-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none">
                                {(() => {
                                    const curY = new Date().getFullYear();
                                    const diff = chartYear - curY;
                                    
                                    if (diff === 0) return 'Tahun Ini';
                                    if (diff === -1) return 'Tahun Lalu';
                                    if (diff === 1) return 'Tahun Depan';
                                    if (diff < 0) return `${Math.abs(diff)} Tahun Lalu`;
                                    return `${diff} Tahun Depan`;
                                })()}
                            </span>
                        </div>
                        <button 
                            onClick={() => setChartYear(prev => prev + 1)}
                            className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1">
            {/* WEEKLY PERFORMANCE (Borrowed from Teacher Style) */}
            <div className="lg:col-span-3 bg-white rounded-[18px] shadow-sm border border-slate-200 p-3 lg:p-6 flex flex-col h-full overflow-hidden">
                <div className="mb-2 lg:mb-4 flex flex-row justify-between items-center gap-2">
                    <div className="flex flex-col items-start gap-1">
                        <h3 className="text-[9.5px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center">
                            Perkembangan Hafalan
                        </h3>
                        <button 
                            onClick={() => setIsActivityModalOpen(true)}
                            className="lg:hidden flex items-center gap-1 pr-1.5 py-0.5 text-indigo-600 text-[6.5px] font-black uppercase tracking-[0.1em] active:scale-95 transition-all"
                        >
                            Log Aktivitas
                        </button>
                    </div>

                    {/* DYNAMIC TOTAL STAT */}
                    <div className="text-right">
                        <p className="text-[11px] lg:text-sm font-black text-slate-800">
                            {chartTotal} <span className="text-[8.5px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">
                                {lineChartType === MemorizationType.SABAQ ? 'Baris' : 'Halaman'}
                            </span>
                        </p>
                        {chartTimeframeLabel && (
                            <p className="text-[6.5px] lg:text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5 leading-none">{chartTimeframeLabel}</p>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center w-full mt-1 min-h-0">
                    <div className="w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    interval={0}
                                    tick={{ fontSize: 8, fontWeight: 900, fill: '#94A3B8' }}
                                    dy={10}
                                    tickFormatter={(val) => {
                                        if (lineChartRange !== 'bulanan') return val;
                                        const day = parseInt(val);
                                        if (isNaN(day)) return val;
                                        // Show 1, 5, 10, 15, 20, 25, 30 for cleaner monthly view on mobile
                                        return (day % 5 === 0 || day === 1 || day === 30) ? val : '';
                                    }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={40}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }}
                                    label={{ 
                                        value: lineChartType === MemorizationType.SABAQ ? 'Baris' : 'Halaman', 
                                        angle: -90, 
                                        position: 'insideLeft', 
                                        offset: 10,
                                        style: { fontSize: 8, fontWeight: 900, fill: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }
                                    }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: '900', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#4F46E5', textTransform: 'uppercase' }}
                                    formatter={(value) => [`${value} ${lineChartType === MemorizationType.SABAQ ? 'Baris' : 'Halaman'}`, 'Hafalan']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#6366F1" 
                                    strokeWidth={4} 
                                    dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* RECENT ACTIVITY - HIDDEN ON MOBILE */}
            <div className="hidden lg:flex lg:col-span-1 bg-slate-50/80 rounded-[20px] shadow-sm border border-slate-200 p-5 flex-col h-full overflow-hidden">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                        Log Aktivitas
                    </span>
                    <span className="bg-white/50 px-2 py-0.5 rounded-full border border-slate-100 text-slate-400">Baru</span>
                </h3>
                <div className="max-h-[285px] p-0.5 overflow-y-auto no-scrollbar space-y-2">
                    {recentRecords.slice(0, 10).map(rec => (
                        <div key={rec.id} className="p-3 bg-white border border-slate-100 rounded-2xl group hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                    rec.type === MemorizationType.SABAQ ? 'bg-indigo-50 text-indigo-500' :
                                    rec.type === MemorizationType.SABQI ? 'bg-amber-50 text-amber-600' :
                                    'bg-emerald-50 text-emerald-600'
                                }`}>
                                    {rec.type}
                                </div>
                                <span className="text-[7px] font-bold text-slate-300">
                                    {new Date(rec.record_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors mb-1">
                                {rec.type === MemorizationType.SABAQ ? 'Sabaq Baru' : 
                                 rec.type === MemorizationType.SABQI ? 'Murojaah Sabqi' : 
                                 rec.surah_name}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    {rec.type === MemorizationType.SABAQ ? `${rec.ayat_end} Baris` : 
                                     rec.type === MemorizationType.SABQI ? `${rec.ayat_end} Halaman` : 
                                     `Ayat ${rec.ayat_start}`}
                                </p>
                            </div>
                        </div>
                    ))}
                    {recentRecords.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                            <Zap className="w-8 h-8 mb-2" />
                            <p className="text-[8px] font-black uppercase tracking-tighter">Belum ada aktivitas</p>
                        </div>
                    )}
                </div>
                {recentRecords.length > 5 && (
                    <button 
                        onClick={() => setIsActivityModalOpen(true)}
                        className="mt-4 p-2.5 bg-white text-indigo-600 text-[8px] font-black uppercase tracking-widest flex items-center justify-center rounded-xl border border-slate-100 hover:bg-indigo-50 transition-all group shadow-sm active:scale-95"
                    >
                        Tampilkan Semua <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}
            </div>
        </div>

        <RecentActivityModal 
            isOpen={isActivityModalOpen}
            onClose={() => setIsActivityModalOpen(false)}
            records={recentRecords}
            students={studentProfile ? [studentProfile] : []}
        />
      </div>
    );
  }

  // --- ADMIN VIEW (AND SUPERVISOR) ---
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
    const pieData = adminStats?.memorizationQuality || [];
    const trendData = trendPeriod === 'weekly' ? (adminStats?.memorizationTrend || []) : (adminStats?.monthlyTrend || []);

    return (
      <div className="flex-1 h-auto flex flex-col gap-4 lg:gap-6 animate-fade-in pb-24 lg:pb-12">
        {/* Stat Cards Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
            {[
                { label: 'Total Santri', value: adminStats?.totalStudents || 0, icon: GraduationCap, color: 'indigo' },
                { label: 'Total Guru', value: adminStats?.totalTeachers || 0, icon: Users, color: 'blue' },
                { label: 'Total Halaqah', value: adminStats?.totalHalaqahs || 0, icon: School, color: 'orange' },
                { label: 'Setoran Hari Ini', value: adminStats?.totalRecordsToday || 0, icon: FileText, color: 'emerald' }
            ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[22px] p-3.5 lg:p-5 border-2 border-slate-50 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm relative z-10 ${
                        stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                        'bg-emerald-50 text-emerald-600'
                    }`}>
                        <stat.icon className="w-4 h-4 lg:w-5 lg:h-5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                        <h4 className="text-base lg:text-xl font-black text-slate-800 leading-none">{stat.value}</h4>
                    </div>
                </div>
            ))}
        </div>

        {/* Second Row: Specific Daily Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
            {[
                { label: 'Belum Manzil Hari Ini', value: adminStats?.notManzilToday || 0, icon: AlertCircle, color: 'rose', onClick: () => setIsPendingManzilModalOpen(true) },
                { label: 'Setoran Manzil Hari Ini', value: adminStats?.manzilToday || 0, icon: Activity, color: 'emerald' },
                { label: 'Setoran Sabaq Hari Ini', value: adminStats?.sabaqToday || 0, icon: Zap, color: 'rose' },
                { label: 'Setoran Sabqi Hari Ini', value: adminStats?.sabqiToday || 0, icon: Book, color: 'amber' }
            ].map((stat, i) => (
                <div 
                    key={i} 
                    className={`bg-white rounded-[22px] p-3.5 lg:p-5 border-2 border-slate-50 shadow-sm flex items-center justify-between relative overflow-hidden group transition-all ${stat.onClick ? 'cursor-pointer hover:border-rose-100 hover:shadow-md active:scale-[0.98]' : ''}`}
                    onClick={stat.onClick}
                >
                    <div className="absolute right-0 top-0 w-16 h-16 bg-slate-50/50 rounded-full -translate-y-6 translate-x-6 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-3 lg:gap-4 relative z-10">
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm ${
                            stat.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                            stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                        }`}>
                            <stat.icon className="w-4 h-4 lg:w-5 lg:h-5"/>
                        </div>
                        <div>
                            <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                            <h4 className={`text-base lg:text-xl font-black leading-none ${stat.label === 'Belum Manzil Hari Ini' ? 'text-rose-600' : 'text-slate-800'}`}>
                                {stat.value}
                            </h4>
                        </div>
                    </div>

                    {stat.onClick && (
                        <div className="hidden lg:flex w-8 h-8 rounded-xl bg-slate-50 items-center justify-center text-slate-300 group-hover:bg-rose-500 group-hover:text-white transition-all relative z-10">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    )}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            {/* 1. Trend Chart (Left - 3 Cols) */}
            <div className="lg:col-span-3 bg-white rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-6 lg:p-7 flex flex-col min-h-[360px] relative transition-all duration-500 overflow-hidden">
                {loadingAdminTrend && (
                    <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Memuat...</p>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                            Tren Setoran
                        </h3>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data harian kategori hafalan</p>
                    </div>

                    {/* ACTION BAR STYLE: Mimicking SS - Responsive Multi-row for Mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                        <div className="grid grid-cols-2 sm:flex sm:items-center bg-white rounded-2xl sm:rounded-full border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-1.5 gap-1.5 sm:w-auto lg:px-2">
                        {/* Custom Legend - Full width on mobile top */}
                        <div className="col-span-2 sm:col-span-1 flex items-center bg-slate-50/50 rounded-full px-2.5 py-1.5 gap-2.5 border border-slate-50 shrink-0 justify-center sm:justify-start">
                            <div className="flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-[#6366f1]"></div>
                                <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-tighter">SABAQ</span>
                            </div>
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-2.5">
                                <div className="w-1 h-1 rounded-full bg-[#10b981]"></div>
                                <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-tighter">SABQI</span>
                            </div>
                            <div className="flex items-center gap-1 border-l border-slate-100 pl-2.5">
                                <div className="w-1 h-1 rounded-full bg-[#f59e0b]"></div>
                                <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-tighter">MANZIL</span>
                            </div>
                        </div>

                        {/* Dropdown Pill: Kategori - Left Column on mobile */}
                        <div className="col-span-1 flex items-center bg-white px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm gap-1.5 hover:border-emerald-200 transition-all group cursor-pointer relative shrink-0">
                            <select 
                                value={adminTrendType} 
                                onChange={(e) => setAdminTrendType(e.target.value as any)}
                                className="bg-transparent text-[8px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase appearance-none pr-4 w-full"
                            >
                                <option value="all">KATEGORI</option>
                                <option value={MemorizationType.SABAQ}>SABAQ</option>
                                <option value={MemorizationType.SABQI}>SABQI</option>
                                <option value={MemorizationType.MANZIL}>MANZIL</option>
                            </select>
                            <ChevronDown className="w-2.5 h-2.5 text-slate-300 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                        </div>


                        {/* Dropdown Pill: Period - Right Column on mobile */}
                        <div className="col-span-1 flex items-center bg-white px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm gap-1.5 hover:border-emerald-200 transition-all group cursor-pointer relative shrink-0">
                            <select 
                                value={adminTrendPeriod} 
                                onChange={(e) => setAdminTrendPeriod(e.target.value as any)}
                                className="bg-transparent text-[8px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase appearance-none pr-4 w-full"
                            >
                                <option value="weekly">MINGGUAN</option>
                                <option value="monthly">BULANAN</option>
                                <option value="3months">3 BULANAN</option>
                                <option value="6months">SEMESTERAN</option>
                                <option value="yearly">TAHUNAN</option>
                            </select>
                            <ChevronDown className="w-2.5 h-2.5 text-slate-300 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        {/* Navigation Pill: Structured like SS buttons */}
                        <div className="flex items-center gap-1 bg-emerald-500 p-1 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.2)] flex-1 sm:flex-none sm:min-w-[150px] shrink-0">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (adminTrendPeriod === 'weekly') {
                                        setAdminTrendWeekOffset(prev => prev - 1);
                                    } else if (adminTrendPeriod === 'monthly') {
                                        if (adminTrendMonth === 0) {
                                            setAdminTrendMonth(11);
                                            setAdminTrendYear(prev => prev - 1);
                                        } else setAdminTrendMonth(prev => prev - 1);
                                    } else if (adminTrendPeriod === '3months') {
                                        setAdminTrendMonth(prev => {
                                            if (prev < 3) { setAdminTrendYear(y => y - 1); return prev + 12 - 3; }
                                            return prev - 3;
                                        });
                                    } else if (adminTrendPeriod === '6months') {
                                        setAdminTrendMonth(prev => {
                                            // Jan-Jun -> Dec of prev year | Jul-Dec -> Jun of same year
                                            if (prev < 6) {
                                                setAdminTrendYear(y => y - 1);
                                                return 11; // Dec
                                            } else {
                                                return 5; // Jun
                                            }
                                        });
                                    } else if (adminTrendPeriod === 'yearly') {
                                        setAdminTrendYear(prev => prev - 1);
                                    }
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex-1 px-1 text-[8px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                                <Calendar className="w-3 h-3 opacity-60" />
                                <span className="whitespace-nowrap">
                                    {(() => {
                                        if (adminTrendPeriod === 'weekly') {
                                            const today = new Date();
                                            const day = today.getDay();
                                            const diff = (day === 0 ? -6 : 1) - day + (adminTrendWeekOffset * 7);
                                            const start = new Date(today);
                                            start.setDate(today.getDate() + diff);
                                            
                                            const end = new Date(start);
                                            const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                                            end.setDate(start.getDate() + rangeLength);

                                            return `${start.getDate()} ${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`.toUpperCase();
                                        }
                                        if (adminTrendPeriod === 'monthly') {
                                            return new Date(adminTrendYear, adminTrendMonth).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
                                        }
                                        if (adminTrendPeriod === '3months') {
                                            const end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                                            const start = new Date(adminTrendYear, adminTrendMonth - 2, 1);
                                            return `${start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`.toUpperCase();
                                        }
                                        if (adminTrendPeriod === '6months') {
                                            const isH1 = adminTrendMonth < 6;
                                            const start = isH1 ? new Date(adminTrendYear, 0, 1) : new Date(adminTrendYear, 6, 1);
                                            const end = isH1 ? new Date(adminTrendYear, 5, 30) : new Date(adminTrendYear, 11, 31);
                                            return `${start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase()} - ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase()}`;
                                        }
                                        if (adminTrendPeriod === 'yearly') {
                                            return adminTrendYear.toString();
                                        }
                                        return new Date(adminTrendYear, adminTrendMonth).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
                                    })()}
                                </span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (adminTrendPeriod === 'weekly') {
                                        setAdminTrendWeekOffset(prev => prev + 1);
                                    } else if (adminTrendPeriod === 'monthly') {
                                        if (adminTrendMonth === 11) {
                                            setAdminTrendMonth(0);
                                            setAdminTrendYear(prev => prev + 1);
                                        } else setAdminTrendMonth(prev => prev + 1);
                                    } else if (adminTrendPeriod === '3months') {
                                        setAdminTrendMonth(prev => {
                                            if (prev > 8) { setAdminTrendYear(y => y + 1); return prev - 12 + 3; }
                                            return prev + 3;
                                        });
                                    } else if (adminTrendPeriod === '6months') {
                                        setAdminTrendMonth(prev => {
                                            // Jan-Jun -> Jul of same year | Jul-Dec -> Jan of next year
                                            if (prev < 6) {
                                                return 11; // Move to Jul-Dec block
                                            } else {
                                                setAdminTrendYear(y => y + 1);
                                                return 5; // Move to Jan-Jun of next year
                                            }
                                        });
                                    } else if (adminTrendPeriod === 'yearly') {
                                        setAdminTrendYear(prev => prev + 1);
                                    }
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Small Refresh Button like SS end */}
                        <button 
                            onClick={() => refreshData()}
                            className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-white transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
                </div>

                <div className="flex-1 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={adminTrendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                                dataKey="name" 
                                tick={{fill: '#94a3b8', fontSize: 7, fontWeight: 900}} 
                                tickLine={false} 
                                axisLine={false} 
                                dy={8} 
                                interval={adminTrendPeriod === 'weekly' ? 0 : adminTrendPeriod === 'monthly' ? 2 : 0}
                            />
                            <YAxis tick={{fill: '#94a3b8', fontSize: 7, fontWeight: 900}} tickLine={false} axisLine={false} dx={-5} />
                            <Tooltip 
                                cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                contentStyle={{ borderRadius: '1.25rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', padding: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 800, padding: 0 }}
                                labelStyle={{ color: '#94a3b8', fontSize: '7px', fontWeight: 900, marginBottom: '6px', textTransform: 'uppercase' }}
                            />
                            {(adminTrendType === 'all' || adminTrendType === MemorizationType.SABAQ) && (
                                <Line type="monotone" name="Sabaq" dataKey="sabaq" stroke="#6366f1" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#6366f1' }} />
                            )}
                            {(adminTrendType === 'all' || adminTrendType === MemorizationType.SABQI) && (
                                <Line type="monotone" name="Sabqi" dataKey="sabqi" stroke="#10b981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#10b981' }} />
                            )}
                            {(adminTrendType === 'all' || adminTrendType === MemorizationType.MANZIL) && (
                                <Line type="monotone" name="Manzil" dataKey="manzil" stroke="#f59e0b" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#f59e0b' }} />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Target Performa (Right - 1 Col) */}
            <div className="bg-white rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-6 lg:p-7 flex flex-col min-h-[360px] relative transition-all duration-500 overflow-hidden">
                {loadingPerfRecords && (
                    <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col mb-6 gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-0">
                            Kualitas Sabaq
                        </h3>
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Period Toggle */}
                        <div className="flex bg-slate-50 p-1 rounded-full border border-slate-100 w-full shadow-inner">
                            {['pekanan', 'bulanan'].map(tf => (
                                <button 
                                    key={tf} 
                                    onClick={() => setPerfTimeframe(tf as any)}
                                    className={`flex-1 py-1.5 text-[7px] font-black uppercase rounded-full transition-all flex items-center justify-center gap-1.5 ${perfTimeframe === tf ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tf === 'pekanan' ? 'PEKANAN' : 'BULANAN'}
                                </button>
                            ))}
                        </div>

                        {/* Navigator Navigator */}
                        <div className="flex items-center gap-1 bg-emerald-500 p-1 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.2)] w-full">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (perfTimeframe === 'pekanan') {
                                        setPerfWeekOffset(prev => prev - 1);
                                    } else {
                                        if (perfMonth === 0) {
                                            setPerfMonth(11);
                                            setPerfYear(prev => prev - 1);
                                        } else setPerfMonth(prev => prev - 1);
                                    }
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex-1 px-1 text-[7px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3 opacity-60" />
                                <span className="whitespace-nowrap">
                                    {(() => {
                                        if (perfTimeframe === 'pekanan') {
                                            const today = new Date();
                                            const day = today.getDay();
                                            const diff = (day === 0 ? -6 : 1) - day + (perfWeekOffset * 7);
                                            const start = new Date(today);
                                            start.setDate(today.getDate() + diff);
                                            const end = new Date(start);
                                            const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                                            end.setDate(start.getDate() + rangeLength);
                                            return `${start.getDate()} ${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`.toUpperCase();
                                        }
                                        return new Date(perfYear, perfMonth).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
                                    })()}
                                </span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (perfTimeframe === 'pekanan') {
                                        setPerfWeekOffset(prev => prev + 1);
                                    } else {
                                        if (perfMonth === 11) {
                                            setPerfMonth(0);
                                            setPerfYear(prev => prev + 1);
                                        } else setPerfMonth(prev => prev + 1);
                                    }
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    {(() => {
                        const totals = { LANCAR: 0, TIDAK_LANCAR: 0, TIDAK_SETOR: 0 };
                        perfRecords.forEach(r => {
                            // Filter ONLY for SABAQ type
                            if (r.type === MemorizationType.SABAQ) {
                                if (r.status === MemorizationStatus.LANCAR) totals.LANCAR++;
                                else if (r.status === MemorizationStatus.TIDAK_LANCAR) totals.TIDAK_LANCAR++;
                                else if (r.status === MemorizationStatus.TIDAK_SETOR) totals.TIDAK_SETOR++;
                            }
                        });
                        const total = totals.LANCAR + totals.TIDAK_LANCAR + totals.TIDAK_SETOR;
                        const data = [
                            { name: 'Lancar', value: totals.LANCAR, color: '#10b981' },
                            { name: 'Kurang Lancar', value: totals.TIDAK_LANCAR, color: '#f59e0b' },
                            { name: 'Belum Setor', value: totals.TIDAK_SETOR, color: '#ef4444' }
                        ];

                        if (total === 0) return (
                            <div className="py-12 text-center opacity-30">
                                <p className="text-[8px] font-black uppercase text-slate-400">Belum Ada Data</p>
                            </div>
                        );

                        return (
                            <>
                                <div className="flex-1 w-full h-[200px] mb-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={6}
                                                dataKey="value"
                                                labelLine={false}
                                                animationDuration={1500}
                                            >
                                                {data.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none stroke-white hover:opacity-80 transition-opacity" strokeWidth={6} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '1.25rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', padding: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-2 w-full mt-2">
                                    {data.map(entry => {
                                        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                                        return (
                                            <div key={entry.name} className="flex flex-col items-center justify-center transition-all hover:opacity-70 group">
                                                <span className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">{pct}%</span>
                                                <span className="text-[7px] font-black text-center text-slate-400 uppercase tracking-widest mb-" style={{ color: entry.color }}>{entry.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-6 lg:p-7 flex flex-col relative min-h-[360px] transition-all duration-500 overflow-hidden">
            {loadingAdminTargetChart && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Mengkalkulasi...</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4">
                <div className="flex flex-col">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                        Pencapaian Target Pekanan
                    </h3>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Monitor hasil capaian pekanan 
                        {adminTargetData.some(d => d.tercapai > 0 || d.tidakTercapai > 0 || d.terlampaui > 0) && (
                            <span className="text-emerald-500 ml-1">
                                • {adminTargetData.reduce((acc, curr) => acc + (curr.tercapai || 0) + (curr.tidakTercapai || 0) + (curr.terlampaui || 0), 0)} DATA
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center bg-white rounded-full border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-1 gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {/* Custom Legend moved here */}
                    <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-50/50 border border-slate-50">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">TERCAPAI</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-100 pl-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">TERLAMPAUI</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-100 pl-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">TIDAK TERCAPAI</span>
                        </div>
                    </div>

                    {/* Halaqah Filter: Dropdown Pill */}
                    <div className="flex items-center bg-white px-3.5 py-1.5 rounded-full border border-slate-100 shadow-sm gap-2 hover:border-emerald-200 transition-all group cursor-pointer relative min-w-[110px]">
                        <select 
                            value={adminTargetHalaqahId} 
                            onChange={(e) => setAdminTargetHalaqahId(e.target.value)}
                            className="bg-transparent text-[8px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase appearance-none pr-4 w-full"
                        >
                            <option value="all">HALAQAH</option>
                            {halaqahs.map(h => (
                                <option key={h.id} value={h.id}>{h.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-300 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                    </div>

                    {/* Navigation Pill: Structured like SS buttons */}
                    <div className="flex items-center gap-1 bg-emerald-500 p-1 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.2)] min-w-[160px]">
                        <button 
                            type="button"
                            onClick={() => setAdminTargetWeekOffset(prev => prev - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1 px-1 text-[8px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                            <Calendar className="w-3 h-3 opacity-60" />
                            <span className="whitespace-nowrap">{adminTargetWeekRange.display}</span>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setAdminTargetWeekOffset(prev => prev + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full overflow-hidden">
                {adminTargetData.some(d => (d.tercapai || 0) > 0 || (d.tidakTercapai || 0) > 0 || (d.terlampaui || 0) > 0) ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={adminTargetData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }}
                                allowDecimals={false}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '1.25rem', border: 'none', backgroundColor: '#1e293b', color: '#fff', padding: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                                itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 800, padding: 0 }}
                                labelStyle={{ color: '#94a3b8', fontSize: '7px', fontWeight: 900, marginBottom: '6px', textTransform: 'uppercase' }}
                            />
                            <Bar dataKey="tercapai" name="Tercapai" fill="#10B981" radius={[5, 5, 0, 0]} barSize={28} />
                            <Bar dataKey="tidakTercapai" name="Tidak Tercapai" fill="#F43F5E" radius={[5, 5, 0, 0]} barSize={28} />
                            <Bar dataKey="terlampaui" name="Terlampaui" fill="#F59E0B" radius={[5, 5, 0, 0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-3">
                            <Target className="w-7 h-7 text-slate-200" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Belum ada data periode ini</p>
                    </div>
                )}
            </div>
        </div>

        <PendingManzilModal 
            isOpen={isPendingManzilModalOpen}
            onClose={() => setIsPendingManzilModalOpen(false)}
            students={students}
            halaqahs={halaqahs}
            allUsers={allUsers}
            doneIds={adminStats?.manzilDoneIds || []}
        />
      </div>
    );
  }

  return null;
};
