
import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole, Student, MemorizationRecord, MemorizationStatus, MemorizationType, ExamSchedule, AdminStats, GuardianDashboardStats, Halaqah, Achievement, TeacherStats, PageView } from '../types';
import { getHalaqahs, getStudents, getStudentsByHalaqah, getStudentRecords, getAdminStats, getGuardianStats, getExamSchedules, getUsers, getAchievements, getTeacherStats } from '../services/dataService';
import { Trophy, TrendingUp, Calendar, AlertCircle, Users, GraduationCap, School, FileText, PieChart as PieIcon, Activity, Star, Book, Clock, CheckCircle, X, MapPin, User, ChevronRight, BookOpen, Award, Download, ArrowRight, ClipboardCheck, Zap, ChevronDown, Target } from 'lucide-react';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Button } from '../components/ui/Button';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
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
                                    onClick={() => onNavigate && onNavigate('input-hafalan')}
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
                                        <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 shrink-0 shadow-sm ${rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-500 ring-4 ring-emerald-50' : rec.status === MemorizationStatus.PERBAIKAN ? 'bg-amber-500 ring-4 ring-amber-50' : 'bg-rose-500 ring-4 ring-rose-50'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{student?.full_name || 'Santri'}</p>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(rec.record_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                                                {rec.type === MemorizationType.SABAQ ? `${rec.ayat_end} Baris` : 
                                                 rec.type === MemorizationType.SABQI ? `${rec.ayat_end} Halaman` : 
                                                 `${rec.surah_name} • ${rec.ayat_start}-${rec.ayat_end}`}
                                            </p>
                                            <div className="flex items-center mt-1.5 gap-2">
                                                <span className="text-[7px] font-black bg-white px-1.5 py-0.5 rounded-md border border-slate-100 text-slate-400 uppercase tracking-widest shadow-sm">{rec.type}</span>
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-widest ${
                                                    rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    rec.status === MemorizationStatus.PERBAIKAN ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    Lancar
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

  // State for Chart Filter
  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Body scroll lock effect
  useEffect(() => {
    const isAnyModalOpen = isActivityModalOpen || isPendingModalOpen || isExamModalOpen || isAchievementModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isActivityModalOpen, isPendingModalOpen, isExamModalOpen, isAchievementModalOpen]);

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      // Only show full loader if we have NO data yet
      const needsFullLoad = !dashboardCache.hasLoadedOnce;
      if (needsFullLoad) setLoading(true);
      
      try {
        if (user.role === UserRole.TEACHER) {
            const allHalaqahs = await getHalaqahs(user.tenant_id);
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
            } else {
                setStudents([]); 
                dashboardCache.students = [];
            }
            
            if (studentsInHalaqah.length > 0) {
                const allRecordsPromises = studentsInHalaqah.map(student => getStudentRecords(student.id));
                const allRecordsArrays = await Promise.all(allRecordsPromises);
                const flattenedRecords = allRecordsArrays.flat().filter(rec => (rec.ayat_end || 0) > 0);
                flattenedRecords.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
                setRecentRecords(flattenedRecords);
                dashboardCache.recentRecords = flattenedRecords;
            } else {
                setRecentRecords([]);
                dashboardCache.recentRecords = [];
            }

        } else if (user.role === UserRole.SANTRI) {
            const allStudents = await getStudents(user.tenant_id);
            const myStudent = allStudents.find(s => s.parent_id === user.id);
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
                    const [allHalaqahs, allUsers] = await Promise.all([
                        getHalaqahs(user.tenant_id),
                        getUsers(user.tenant_id)
                    ]);
                    const foundHalaqah = allHalaqahs.find(h => h.id === studentToLoad.halaqah_id) || null;
                    if (foundHalaqah) {
                        setStudentHalaqah(foundHalaqah);
                        dashboardCache.studentHalaqah = foundHalaqah;
                        const foundTeacher = allUsers.find(u => u.id === foundHalaqah.teacher_id) || null;
                        setHalaqahTeacher(foundTeacher);
                        dashboardCache.halaqahTeacher = foundTeacher;
                    }
                }
            }

        } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) {
            const stats = await getAdminStats(user.tenant_id);
            setAdminStats(stats);
            dashboardCache.adminStats = stats;
        }
      } catch (err) {
          console.error("Dashboard data load error:", err);
      } finally {
          setLoading(false);
          dashboardCache.hasLoadedOnce = true;
      }
    };
    loadData();
  }, [user]);

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

  const teacherPieData = useMemo(() => {
    if (user.role !== UserRole.TEACHER) return [];
    
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

  // Remove global loading return to prevent full-page flicker
  // if (loading) return <div className="p-8 lg:p-12"><DashboardSkeleton /></div>;

  // --- TEACHER VIEW ---
  if (user.role === UserRole.TEACHER) {
    const displayedPending = studentsNotDeposited.slice(0, 4);
    const hasMorePending = studentsNotDeposited.length > 4;

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in overflow-hidden">
        {user.role === UserRole.TEACHER && !myHalaqah && !loading && (
           <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-center gap-3 text-amber-800 shadow-sm shadow-amber-50">
               <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
               <p className="text-xs font-bold uppercase tracking-tight">Anda belum ditugaskan ke halaqah manapun. Hubungi admin untuk pengaturan halaqah.</p>
           </div>
        )}

        {/* TOP STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Users className="w-5 h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Santri</p>
                <h4 className="text-xl font-black text-slate-800 leading-none">{students.length}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Book className="w-5 h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Sabaq Hari Ini</p>
                <h4 className="text-xl font-black text-slate-800 leading-none">{teacherStats?.sabaqToday ?? 0}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Zap className="w-5 h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Sabqi Hari Ini</p>
                <h4 className="text-xl font-black text-slate-800 leading-none">{teacherStats?.sabqiToday ?? 0}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                <Activity className="w-5 h-5"/>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Manzil Hari Ini</p>
                <h4 className="text-xl font-black text-slate-800 leading-none">{teacherStats?.manzilToday ?? 0}</h4>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-3 bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-6 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                        Performa Pekan Ini
                    </h3>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] w-full">
                    {teacherPieData.length > 0 ? (
                        <>
                            <div className="flex-1 w-full max-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={teacherPieData}
                                            innerRadius={60}
                                            outerRadius={85}
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
                            <div className="grid grid-cols-3 gap-3 w-full mt-4">
                                {teacherPieData.map(entry => (
                                    <div key={entry.name} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-800">{entry.value}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center opacity-40 py-12">
                            <Activity className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada data pekan ini</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-6 flex flex-col h-full overflow-hidden">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                    Aktivitas Terbaru
                </h3>
                <div className="flex-1 p-1 overflow-y-auto no-scrollbar space-y-4">
                    {recentRecords.slice(0, 3).map((rec, idx) => {
                        const student = students.find(s => s.id === rec.student_id);
                        return (
                            <div key={rec.id} className={`py-3 group transition-all ${idx !== 2 ? 'border-b border-slate-50' : ''}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                                        {student?.full_name || 'Santri'}
                                    </p>
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${
                                        rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-600' : 
                                        rec.status === MemorizationStatus.PERBAIKAN ? 'bg-amber-50 text-amber-600' : 
                                        'bg-rose-50 text-rose-600'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-80">{rec.type}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                        <span className="text-slate-600">
                                            {rec.type === MemorizationType.SABAQ ? `${rec.ayat_end} Baris` : 
                                             rec.type === MemorizationType.SABQI ? `${rec.ayat_end} Hal` : 
                                             `${rec.surah_name} ${rec.ayat_start}-${rec.ayat_end}`}
                                        </span>
                                        <span className="ml-2 text-slate-300 font-medium">({new Date(rec.record_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {recentRecords.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                            <Clock className="w-8 h-8 text-slate-200 mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Menunggu aktivitas...</p>
                        </div>
                    )}
                </div>
                {recentRecords.length > 3 && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                        <button 
                            onClick={() => setIsActivityModalOpen(true)}
                            className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center hover:text-indigo-700 transition-colors mx-auto"
                        >
                            Selengkapnya <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        <RecentActivityModal 
            isOpen={isActivityModalOpen}
            onClose={() => setIsActivityModalOpen(false)}
            records={recentRecords}
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
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in overflow-hidden">
        {/* STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {[
                { label: 'Target Harian', value: guardianStats?.dailyTarget || '-', icon: Target, color: 'indigo' },
                { label: 'Total Hafalan', value: `${guardianStats?.totalJuz || 0} Juz`, icon: BookOpen, color: 'emerald' },
                { label: 'Progres Juz', value: `${Math.round(guardianStats?.juzProgress || 0)}%`, icon: TrendingUp, color: 'blue' },
                { label: 'Halaqah', value: studentHalaqah?.name || 'Belum Ada', icon: School, color: 'orange' }
            ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm relative z-10 ${
                        stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                        'bg-emerald-50 text-emerald-600'
                    }`}>
                        <stat.icon className="w-5 h-5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                        <h4 className="text-xl font-black text-slate-800 leading-none truncate max-w-[150px]">{stat.value}</h4>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
            {/* WEEKLY PERFORMANCE (Borrowed from Teacher Style) */}
            <div className="lg:col-span-3 bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-6 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                        Perkembangan Pekan Ini
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">Mumtaz</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">Jayyid</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] w-full">
                    {studentPieData.length > 0 ? (
                        <>
                            <div className="flex-1 w-full max-h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={studentPieData}
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={8}
                                            dataKey="value"
                                            labelLine={false}
                                            animationDuration={1500}
                                        >
                                            {studentPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={4} stroke="#fff" className="focus:outline-none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-3 w-full mt-4">
                                {studentPieData.map(entry => (
                                    <div key={entry.name} className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
                                        </div>
                                        <p className="text-xs font-black text-slate-800">{entry.value}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center opacity-40 py-8">
                            <Activity className="w-8 h-8 text-slate-200 mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Belum ada data pekan ini</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="lg:col-span-2 bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-6 flex flex-col h-full overflow-hidden">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                    Aktivitas Terkini
                </h3>
                <div className="flex-1 p-1 overflow-y-auto no-scrollbar space-y-4">
                    {recentRecords.slice(0, 4).map(rec => (
                        <div key={rec.id} className="flex items-start group">
                            <div className={`w-1.5 h-10 rounded-full mr-4 shrink-0 shadow-sm ${rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-500' : rec.status === MemorizationStatus.PERBAIKAN ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                            <div className="min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest opacity-80">{rec.type}</p>
                                    <span className="text-[8px] font-bold text-slate-400">
                                        {new Date(rec.record_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                                    {rec.type === MemorizationType.SABAQ ? 'Sabaq Baru' : 
                                     rec.type === MemorizationType.SABQI ? 'Murojaah Sabqi' : 
                                     rec.surah_name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <BookOpen className="w-3 h-3 text-slate-300" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        {rec.type === MemorizationType.SABAQ ? `${rec.ayat_end} Baris` : 
                                         rec.type === MemorizationType.SABQI ? `${rec.ayat_end} Halaman` : 
                                         `Ayat ${rec.ayat_start}-${rec.ayat_end}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentRecords.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                            <Clock className="w-8 h-8 text-slate-200 mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Menunggu aktivitas...</p>
                        </div>
                    )}
                </div>
                {recentRecords.length > 4 && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                        <button 
                            onClick={() => setIsActivityModalOpen(true)}
                            className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center hover:text-indigo-700 transition-colors mx-auto"
                        >
                            Selengkapnya <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                    </div>
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
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in overflow-hidden">
        {/* Stat Cards Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {[
                { label: 'Total Santri', value: adminStats?.totalStudents || 0, icon: GraduationCap, color: 'indigo' },
                { label: 'Total Guru', value: adminStats?.totalTeachers || 0, icon: Users, color: 'blue' },
                { label: 'Total Halaqah', value: adminStats?.totalHalaqahs || 0, icon: School, color: 'orange' },
                { label: 'Setoran Hari Ini', value: adminStats?.totalRecordsToday || 0, icon: FileText, color: 'emerald' }
            ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm relative z-10 ${
                        stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                        stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                        'bg-emerald-50 text-emerald-600'
                    }`}>
                        <stat.icon className="w-5 h-5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                        <h4 className="text-xl font-black text-slate-800 leading-none">{stat.value}</h4>
                    </div>
                </div>
            ))}
        </div>

        {/* Analytical Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-8 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-10 shrink-0">
                    <div>
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                            Tren Setoran Hafalan
                        </h3>
                    </div>
                    <div className="p-1 bg-slate-50 rounded-full border border-slate-100 flex gap-0.5">
                        <button 
                            onClick={() => setTrendPeriod('weekly')}
                            className={`px-4 py-1.5 text-[9px] font-black rounded-full transition-all ${trendPeriod === 'weekly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-500'}`}
                        >MINGGUAN</button>
                        <button 
                            onClick={() => setTrendPeriod('monthly')}
                            className={`px-4 py-1.5 text-[9px] font-black rounded-full transition-all ${trendPeriod === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-500'}`}
                        >BULANAN</button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                                dataKey="name" 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                                tickLine={false} 
                                axisLine={false} 
                                dx={-5}
                            />
                            <Tooltip 
                                cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                contentStyle={{ 
                                    borderRadius: '1rem', 
                                    border: 'none',
                                    backgroundColor: '#1e293b',
                                    color: '#fff',
                                    padding: '10px 14px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                }}
                                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 800 }}
                                labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 900, marginBottom: '2px', textTransform: 'uppercase' }}
                                formatter={(value: number) => [`${value} Setoran`, 'Jumlah']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#6366f1" 
                                strokeWidth={3} 
                                dot={{ r: 0 }} 
                                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: '#6366f1' }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Target Performance Distribution */}
            <div className="bg-white rounded-[22px] shadow-sm border-2 border-slate-50 p-8 flex flex-col h-full overflow-hidden">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-4 flex items-center">
                    <PieIcon className="w-4 h-4 mr-2 text-indigo-500" />
                    Performa Target Pekanan
                </h3>
                
                <div className="flex-1 flex flex-col justify-center min-h-0">
                    {pieData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
                        <>
                            <div className="h-full max-h-[250px] mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="value"
                                            labelLine={false}
                                            animationDuration={1500}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none stroke-white" strokeWidth={5} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 overflow-y-auto no-scrollbar">
                                {pieData.map(entry => (
                                    <div key={entry.name} className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full mr-3 shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{entry.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase">{entry.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                            <Activity className="w-10 h-10 text-slate-200 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  return null;
};
