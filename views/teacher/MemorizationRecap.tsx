
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Student, MemorizationRecord, MemorizationType, MemorizationStatus, PageView, Halaqah, Tenant, UserRole } from '../../types';
import { getHalaqahs, getStudents, getWeeklyMemorization, getTenant, getWeeklyTargets } from '../../services/dataService';
import { 
    FileText, 
    Calendar, 
    TrendingUp, 
    BookOpen, 
    Clock, 
    Download,
    Filter,
    ArrowUpRight,
    Award,
    Quote,
    CheckCircle2,
    Check,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Activity,
    Users,
    Zap,
    GraduationCap,
    School,
    RotateCcw,
    Crosshair,
    Search,
    User,
    ChevronDown,
    X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotification } from '../../lib/NotificationContext';
import { useLoading } from '../../lib/LoadingContext';

interface MemorizationRecapProps {
    user: UserProfile;
}

export const MemorizationRecap: React.FC<MemorizationRecapProps> = ({ user }) => {
    // 1. Student Selection State
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // 2. Report Data State
    const [weeklyData, setWeeklyData] = useState<any>({});
    const [weeklyTarget, setWeeklyTarget] = useState<any>(null);
    const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // 3. Weekly Logic
    const [selectedWeek, setSelectedWeek] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Monday
        return d.toISOString().split('T')[0];
    });

    const { addNotification } = useNotification();
    const { setLoading: setGlobalLoading } = useLoading();

    const weekDates = useMemo(() => {
        const dates: string[] = [];
        const start = new Date(selectedWeek);
        const dayCount = activeDays.length > 5 ? activeDays.length : 5;
        for (let i = 0; i < dayCount; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }, [selectedWeek, activeDays]);

    const weekDisplayRange = useMemo(() => {
        if (weekDates.length === 0) return '';
        const start = new Date(weekDates[0]);
        const end = new Date(weekDates[weekDates.length - 1]);
        const startDay = start.getDate().toString().padStart(2, '0');
        const startMonth = start.toLocaleDateString('id-ID', { month: 'short' });
        const endDay = end.getDate().toString().padStart(2, '0');
        const endMonth = end.toLocaleDateString('id-ID', { month: 'short' });
        const year = end.getFullYear();
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    }, [weekDates]);

    // 4. Initial Data Fetch (Students & Tenant)
    useEffect(() => {
        const init = async () => {
            if (!user.tenant_id) return;
            setLoading(true);
            try {
                const [allStudents, tenantData, allHalaqahs] = await Promise.all([
                    getStudents(user.tenant_id),
                    getTenant(user.tenant_id),
                    getHalaqahs(user.tenant_id)
                ]);

                setTenant(tenantData);
                if (tenantData?.cycle_config?.activeDays) {
                    setActiveDays(tenantData.cycle_config.activeDays);
                }

                // Filter students based on teacher role if needed
                let filtered = allStudents;
                if (user.role === UserRole.TEACHER) {
                    const myHalaqahIds = allHalaqahs.filter(h => h.teacher_id === user.id).map(h => h.id);
                    filtered = allStudents.filter(s => s.halaqah_id && myHalaqahIds.includes(s.halaqah_id));
                }

                setStudents(filtered);
                if (filtered.length > 0) {
                    setSelectedStudent(filtered[0]);
                }
            } catch (error) {
                console.error("Failed to init MemorizationRecap:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user.id, user.tenant_id, user.role]);

    // 5. Fetch Report Data when student or week changes
    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedStudent) return;
            setLoading(true);
            try {
                const [weekData, targets] = await Promise.all([
                    getWeeklyMemorization(selectedStudent.id, selectedWeek),
                    getWeeklyTargets([selectedStudent.id], selectedWeek)
                ]);
                setWeeklyData(weekData || {});
                setWeeklyTarget(targets.length > 0 ? targets[0].target_data : null);
            } catch (error) {
                console.error("Failed to fetch report:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedStudent?.id, selectedWeek]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    const stats = useMemo(() => {
        let sabaqCount = 0;
        let sabqiCount = 0;
        let manzilCount = 0;

        Object.values(weeklyData).forEach((dayData: any) => {
            if (dayData[MemorizationType.SABAQ]?.status === MemorizationStatus.LANCAR) {
                sabaqCount += (dayData[MemorizationType.SABAQ]?.jumlah || 0);
            }
            if (dayData[MemorizationType.SABQI]?.status === MemorizationStatus.LANCAR) {
                sabqiCount += (dayData[MemorizationType.SABQI]?.jumlah || 0);
            }
            if (dayData[MemorizationType.MANZIL]?.status === MemorizationStatus.LANCAR) {
                manzilCount += (dayData[MemorizationType.MANZIL]?.jumlah || 0);
            }
        });

        return { sabaqCount, sabqiCount, manzilCount };
    }, [weeklyData]);

    const getTypeLabel = (t: MemorizationType) => {
        switch(t) {
            case MemorizationType.SABAQ: return 'SABAQ';
            case MemorizationType.SABQI: return 'SABQI';
            case MemorizationType.MANZIL: return 'MANZIL';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 lg:gap-6 animate-fade-in overflow-hidden">
            {/* 1. SIDEBAR SANTRI */}
            <div className={`fixed inset-0 z-50 lg:relative lg:inset-auto lg:flex w-full lg:w-64 bg-slate-900/40 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none transition-all duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible lg:opacity-100 lg:visible'}`} onClick={() => setIsSidebarOpen(false)}>
                <div className={`w-72 lg:w-full h-full bg-white lg:rounded-xl border-2 border-slate-300 flex flex-col overflow-hidden shadow-2xl lg:shadow-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Users className="w-4 h-4 text-jade-600" />
                                Daftar Santri
                            </h3>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="CARI SANTRI..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-jade-400 focus:ring-4 focus:ring-jade-50/50 transition-all text-[11px] font-black uppercase tracking-widest placeholder:text-slate-300 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <div className="p-3 space-y-1">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setIsSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                                            selectedStudent?.id === student.id 
                                            ? 'bg-jade-600 text-white shadow-lg shadow-jade-100 border-2 border-jade-600' 
                                            : 'bg-white text-slate-600 border-2 border-transparent hover:bg-slate-50 hover:border-slate-100'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-2 transition-colors ${
                                            selectedStudent?.id === student.id ? 'bg-jade-500/50 border-jade-400' : 'bg-slate-50 border-slate-100 group-hover:bg-white'
                                        }`}>
                                            <User className={`w-4 h-4 ${selectedStudent?.id === student.id ? 'text-white' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className={`text-[11px] font-black truncate uppercase tracking-tight ${selectedStudent?.id === student.id ? 'text-white' : 'text-slate-700'}`}>
                                                {student.full_name}
                                            </p>
                                            <p className={`text-[8.5px] font-black uppercase tracking-widest leading-none mt-1 ${selectedStudent?.id === student.id ? 'text-jade-100' : 'text-slate-400'}`}>
                                                NIS: {student.nis || '-'}
                                            </p>
                                        </div>
                                        {selectedStudent?.id === student.id && (
                                            <div className="ml-auto">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <Activity className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada santri</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN REPORT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Toolbar */}
                <div className="bg-white rounded-xl border-2 border-slate-300 p-3 lg:p-4 mb-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-jade-600 text-white rounded-xl border-2 border-jade-600 shadow-lg shadow-jade-100 active:scale-95 transition-all shrink-0">
                            <Users className="w-4.5 h-4.5" />
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                                {selectedStudent?.full_name || 'Rekap Hafalan'}
                            </h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {weekDisplayRange}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar py-1 lg:py-0">
                        <div className="flex bg-white p-1 rounded-xl border-2 border-slate-300 h-10 items-center justify-center shrink-0">
                            <button 
                                onClick={() => {
                                    const d = new Date(selectedWeek);
                                    d.setDate(d.getDate() - 7);
                                    setSelectedWeek(d.toISOString().split('T')[0]);
                                }}
                                className="p-1 px-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="px-3 text-[10px] font-black text-jade-700 uppercase tracking-widest whitespace-nowrap min-30 text-center">
                                PEKAN INI
                            </div>
                            <button 
                                onClick={() => {
                                    const d = new Date(selectedWeek);
                                    d.setDate(d.getDate() + 7);
                                    setSelectedWeek(d.toISOString().split('T')[0]);
                                }}
                                className="p-1 px-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <button className="flex-1 lg:flex-none h-10 px-4 bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-jade-600 hover:border-jade-200 transition-all text-[10px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap">
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">EKSPOR LAPORAN</span>
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 bg-white rounded-xl border-2 border-slate-300 flex flex-col overflow-hidden relative">
                    {!selectedStudent ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <EmptyState 
                                icon="user" 
                                message="Pilih Santri" 
                                description="Silakan pilih santri dari daftar untuk melihat rekap hafalan." 
                            />
                        </div>
                    ) : (
                        <>
                            {/* Stats Banner */}
                            <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/30">
                                <div className="p-4 border-r border-slate-100 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">TOTAL SABAQ</p>
                                    <p className="text-base font-black text-slate-800 leading-none">
                                        {stats.sabaqCount} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Baris</span>
                                    </p>
                                </div>
                                <div className="p-4 border-r border-slate-100 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">TOTAL SABQI</p>
                                    <p className="text-base font-black text-slate-800 leading-none">
                                        {stats.sabqiCount} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Hlm</span>
                                    </p>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">TOTAL MANZIL</p>
                                    <p className="text-base font-black text-slate-800 leading-none">
                                        {stats.manzilCount} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Hlm</span>
                                    </p>
                                </div>
                            </div>

                            {/* Table Area */}
                            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-40 bg-slate-300">
                                        <tr>
                                            <th className="px-4 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-24 sticky left-0 z-50 bg-slate-300 border-r border-b border-slate-200">TANGGAL</th>
                                            <th className="px-4 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-24 sticky left-24 z-50 bg-slate-300 border-r border-b border-slate-200">SETORAN</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-b border-r border-slate-200 bg-slate-300">SURAT / AYAT</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-48 border-b border-slate-200 bg-slate-300">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-4 py-6 border-b border-r border-slate-100 bg-slate-50/30"></td>
                                                    <td className="px-4 py-6 border-b border-r border-slate-100 bg-slate-50/30"></td>
                                                    <td className="px-4 py-6 border-b border-r border-slate-100"></td>
                                                    <td className="px-4 py-6 border-b border-slate-100"></td>
                                                </tr>
                                            ))
                                        ) : (
                                            weekDates.map(date => (
                                                <React.Fragment key={date}>
                                                    {[MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type, tIdx) => {
                                                        const rec = weeklyData[date]?.[type];
                                                        const isToday = date === new Date().toISOString().split('T')[0];
                                                        
                                                        return (
                                                            <tr key={`${date}-${type}`} className={`${isToday ? 'bg-emerald-50/10' : 'hover:bg-slate-50/20'} transition-colors group`}>
                                                                {tIdx === 0 && (
                                                                    <td rowSpan={3} className={`px-2 py-4 align-middle w-24 sticky left-0 z-30 border-b border-r border-slate-200 text-center transition-colors ${isToday ? 'bg-emerald-50' : 'bg-white'}`}>
                                                                        <div className="flex flex-col items-center justify-center space-y-1 py-1">
                                                                            <p className={`text-[11px] font-black uppercase tracking-tight leading-tight ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                                                {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase()}
                                                                            </p>
                                                                            <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                <td className={`px-2 py-4 sticky left-24 z-30 w-24 border-b border-r border-slate-200 text-center transition-colors ${isToday ? 'bg-emerald-50' : 'bg-white'}`}>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                                        {getTypeLabel(type)}
                                                                    </span>
                                                                </td>
                                                                <td className={`px-6 py-4 border-b border-r border-slate-200 ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex flex-col">
                                                                            <p className={`text-[11px] font-black uppercase tracking-widest ${rec?.surah_name ? 'text-slate-800' : 'text-slate-200'}`}>
                                                                                {rec?.surah_name || '- SURAT -'}
                                                                            </p>
                                                                            <p className={`text-[9px] font-black uppercase tracking-tighter mt-0.5 ${rec?.ayat_end ? 'text-jade-600' : 'text-slate-200'}`}>
                                                                                {rec?.ayat_start || 0} - {rec?.ayat_end || 0}
                                                                            </p>
                                                                        </div>
                                                                        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border-2 border-slate-100">
                                                                            <span className={`text-[11px] font-black ${rec?.jumlah ? 'text-slate-800' : 'text-slate-200'}`}>{rec?.jumlah || 0}</span>
                                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{type === MemorizationType.SABAQ ? 'Brs' : 'Hlm'}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className={`px-6 py-4 border-b-2 border-slate-200 text-center ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                                                    {rec && rec.status && rec.status !== MemorizationStatus.EMPTY ? (
                                                                        <span className={`inline-flex px-4 py-1.5 rounded-xl border-2 text-[9px] font-black uppercase tracking-[0.15em] ${
                                                                            rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                            rec.status === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                            'bg-rose-50 text-rose-700 border-rose-100'
                                                                        }`}>
                                                                            {rec.status.replace('_', ' ')}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest italic">- KOSONG -</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
