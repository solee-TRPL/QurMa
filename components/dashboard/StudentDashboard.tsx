
import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, Calendar, School, User, ChevronLeft, ChevronRight, RotateCcw, Target, Award, MapPin, Activity, Mail, MessageSquare } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UserProfile, Student, MemorizationRecord, Halaqah, Achievement, MemorizationType, PageView, MemorizationStatus, TeacherNote } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { ExamScheduleModal } from './ExamScheduleModal';
import { AchievementsModal } from './AchievementsModal';
import { NotesModal } from './NotesModal';
import { RecentActivityModal } from './RecentActivityModal';

interface StudentDashboardProps {
    user: UserProfile;
    studentProfile: Student | null;
    recentRecords: MemorizationRecord[];
    studentHalaqah: Halaqah | null;
    halaqahTeacher: UserProfile | null;
    achievements: Achievement[];
    notes?: TeacherNote[];
    loading: boolean;
    activeDays: number[];
    isRefreshing: boolean;
    refreshData: (showFullLoader?: boolean) => Promise<void>;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
    user,
    studentProfile,
    recentRecords,
    studentHalaqah,
    halaqahTeacher,
    achievements,
    notes = [],
    loading,
    activeDays,
    isRefreshing,
    refreshData
}) => {
    const [lineChartType, setLineChartType] = useState<MemorizationType>(MemorizationType.SABAQ);
    const [lineChartRange, setLineChartRange] = useState<'pekanan' | 'bulanan' | 'semesteran' | 'tahunan'>('pekanan');
    const [chartWeekOffset, setChartWeekOffset] = useState(0);
    const [chartMonth, setChartMonth] = useState(new Date().getMonth());
    const [chartYear, setChartYear] = useState(new Date().getFullYear());
    
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    const isMatch = (recDate: string | undefined, targetY: number, targetM: number, targetD?: number) => {
        if (!recDate) return false;
        const parts = recDate.split(/[-T ]/).map(p => parseInt(p));
        if (!parts[0] || !parts[1]) return false;
        
        if (targetD !== undefined) {
            return parts[0] === targetY && parts[1] === (targetM + 1) && parts[2] === targetD;
        }
        return parts[0] === targetY && parts[1] === (targetM + 1);
    };

    const chartData = useMemo(() => {
        const filteredRecords = recentRecords.filter(r => r.type === lineChartType);
        let data: any[] = [];

        if (lineChartRange === 'pekanan') {
            const fullDays = [
                { id: 1, label: 'Sen' }, { id: 2, label: 'Sel' }, { id: 3, label: 'Rab' },
                { id: 4, label: 'Kam' }, { id: 5, label: 'Jum' }, { id: 6, label: 'Sab' }, { id: 0, label: 'Min' }
            ];
            
            const monday = new Date();
            const diff = (monday.getDay() === 0 ? -6 : 1) - monday.getDay() + (chartWeekOffset * 7);
            monday.setDate(monday.getDate() + diff);

            data = fullDays.map((fd) => {
                const d = new Date(monday);
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
    }, [lineChartType, lineChartRange, chartWeekOffset, chartMonth, chartYear, recentRecords, activeDays]);

    const chartTotal = useMemo(() => chartData.reduce((sum, d) => sum + d.amount, 0), [chartData]);

    const chartTimeframeInfo = useMemo(() => {
        if (lineChartRange === 'pekanan') {
            const today = new Date();
            const day = today.getDay();
            const diff = (day === 0 ? -6 : 1) - day + (chartWeekOffset * 7);
            const start = new Date(today);
            start.setDate(today.getDate() + diff);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            
            const range = `${start.getDate()} ${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`.toUpperCase();
            const relative = chartWeekOffset === 0 ? 'Pekan Ini' : 
                             chartWeekOffset === -1 ? 'Pekan Lalu' : 
                             chartWeekOffset === 1 ? 'Pekan Depan' : 
                             `${Math.abs(chartWeekOffset)} Pekan ${chartWeekOffset < 0 ? 'Lalu' : 'Depan'}`;
            return { range, relative: relative.toUpperCase() };
        } else if (lineChartRange === 'bulanan') {
            const range = new Date(chartYear, chartMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase();
            const diff = (chartYear - new Date().getFullYear()) * 12 + (chartMonth - new Date().getMonth());
            const relative = diff === 0 ? 'Bulan Ini' : diff === -1 ? 'Bulan Lalu' : diff === 1 ? 'Bulan Depan' : `${Math.abs(diff)} Bulan ${diff < 0 ? 'Lalu' : 'Depan'}`;
            return { range, relative: relative.toUpperCase() };
        } else {
            const diff = chartYear - new Date().getFullYear();
            const range = chartYear.toString();
            const relative = diff === 0 ? 'Tahun Ini' : diff === -1 ? 'Tahun Lalu' : diff === 1 ? 'Tahun Depan' : `${Math.abs(diff)} Tahun ${diff < 0 ? 'Lalu' : 'Depan'}`;
            return { range, relative: relative.toUpperCase() };
        }
    }, [lineChartRange, chartWeekOffset, chartMonth, chartYear]);

    const monthlyStats = useMemo(() => {
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
    }, [recentRecords]);

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
        <div className="flex-1 h-auto flex flex-col gap-3 lg:gap-4 animate-fade-in pb-20 lg:pb-8">


            {/* Header Chartboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 shrink-0">
                {/* Chartbox 1: Halaqoh/Pengampu */}
                <div className="bg-white rounded-2xl p-3.5 lg:p-4 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group transition-all hover:border-jade-200 hover:shadow-md">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-slate-50/30 rounded-full -translate-y-6 translate-x-6 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-9 h-9 rounded-xl bg-jade-50 text-jade-700 flex items-center justify-center shadow-sm border border-jade-100">
                            <School className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Halaqoh / Pengampu</p>
                            <h4 className="text-xs lg:text-sm font-black text-jade-700 leading-tight uppercase">
                                {studentHalaqah?.name || 'BELUM ADA'}
                            </h4>
                            <p className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                                Ustadz: <span className="text-slate-800 font-black">{halaqahTeacher?.full_name || 'BELUM ADA'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chartbox 3: Catatan Guru */}
                <div 
                    onClick={() => setIsNotesModalOpen(true)}
                    className="bg-white rounded-2xl p-3.5 lg:p-4 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group transition-all hover:border-jade-200 hover:shadow-md cursor-pointer"
                >
                    <div className="absolute right-0 top-0 w-16 h-16 bg-jade-50/30 rounded-full -translate-y-6 translate-x-6 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-9 h-9 rounded-xl bg-jade-50 text-jade-700 flex items-center justify-center shadow-sm border border-jade-100 group-hover:bg-jade-600 group-hover:text-white transition-all">
                            <MessageSquare className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Catatan Guru</p>
                            <h4 className="text-xs lg:text-sm font-black text-slate-800 leading-tight uppercase flex items-center gap-2">
                                {notes.length} Catatan
                                {notes.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />}
                            </h4>
                        </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-jade-700 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Chartbox 4: Pencapaian Santri */}
                <div 
                    onClick={() => setIsAchievementModalOpen(true)}
                    className="bg-white rounded-2xl p-3.5 lg:p-4 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group transition-all hover:border-amber-200 hover:shadow-md cursor-pointer"
                >
                    <div className="absolute right-0 top-0 w-16 h-16 bg-amber-50/20 rounded-full -translate-y-6 translate-x-6 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-sm border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Trophy className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Pencapaian</p>
                            <h4 className="text-xs lg:text-sm font-black text-slate-800 leading-tight uppercase">
                                {achievements.length} Prestasi
                            </h4>
                        </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Main Progress Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 lg:p-6 flex flex-col min-h-[340px]">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 shrink-0">
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                            Grafik Progress Hafalan
                        </h3>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total: {chartTotal} {lineChartType === MemorizationType.SABAQ ? 'Baris' : lineChartType === MemorizationType.SABQI ? 'Halaman' : 'Kali'}</p>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center w-full lg:w-72 bg-slate-50 p-1 rounded-full border border-slate-200 shadow-sm h-9 lg:h-10 shrink-0">
                            {[MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => (
                                <button 
                                    key={type}
                                    onClick={() => setLineChartType(type)}
                                    className={`flex-1 px-4 py-1.5 lg:py-2 rounded-full text-[8px] font-black uppercase tracking-wider transition-all ${
                                        lineChartType === type 
                                        ? 'bg-jade-600 text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-1 bg-emerald-600 p-1 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.15)] h-9 lg:h-10 justify-between min-w-[130px]">
                            <button 
                                onClick={() => {
                                    if (lineChartRange === 'pekanan') setChartWeekOffset(prev => prev - 1);
                                    else if (lineChartRange === 'bulanan') {
                                        if (chartMonth === 0) { setChartMonth(11); setChartYear(prev => prev - 1); }
                                        else setChartMonth(prev => prev - 1);
                                    }
                                    else setChartYear(prev => prev - 1);
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                            <div className="flex flex-col items-center justify-center flex-1 min-w-[110px]">
                                <span className="text-[7.5px] font-black text-white uppercase tracking-widest leading-none mb-0.5">{chartTimeframeInfo.range}</span>
                                <span className="text-[5.5px] font-bold text-white/60 uppercase tracking-[0.2em] leading-none">{chartTimeframeInfo.relative}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    if (lineChartRange === 'pekanan') setChartWeekOffset(prev => prev + 1);
                                    else if (lineChartRange === 'bulanan') {
                                        if (chartMonth === 11) { setChartMonth(0); setChartYear(prev => prev + 1); }
                                        else setChartMonth(prev => prev + 1);
                                    }
                                    else setChartYear(prev => prev + 1);
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                            >
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#10b981" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorAmount)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            <ExamScheduleModal 
                isOpen={isExamModalOpen}
                onClose={() => setIsExamModalOpen(false)}
                studentId={studentProfile?.id || ''}
            />
            
            <AchievementsModal 
                isOpen={isAchievementModalOpen}
                onClose={() => setIsAchievementModalOpen(false)}
                achievements={achievements}
            />

            <NotesModal 
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                notes={notes}
                user={user}
                onRefresh={refreshData}
            />

            <RecentActivityModal 
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                records={recentRecords}
                students={studentProfile ? [studentProfile] : []}
            />
        </div>
    );
};
