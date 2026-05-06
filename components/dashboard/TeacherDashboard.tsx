
import React, { useState, useMemo } from 'react';
import { Users, Book, Zap, Activity, AlertCircle, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserProfile, UserRole, Student, MemorizationRecord, TeacherStats, PageView, MemorizationType, MemorizationStatus } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { RecentActivityModal } from './RecentActivityModal';

interface TeacherDashboardProps {
    user: UserProfile;
    students: Student[];
    teacherStats: TeacherStats | null;
    recentRecords: MemorizationRecord[];
    myHalaqah: any | null;
    loading: boolean;
    isRefreshing: boolean;
    refreshData: (showFullLoader?: boolean) => Promise<void>;
    onNavigate: (page: PageView) => void;
    activeDays: number[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
    user,
    students,
    teacherStats,
    recentRecords,
    myHalaqah,
    loading,
    isRefreshing,
    refreshData,
    onNavigate,
    activeDays
}) => {
    const [perfTimeframe, setPerfTimeframe] = useState<'pekanan' | 'bulanan'>('pekanan');
    const [perfType, setPerfType] = useState<MemorizationType | 'all'>('all');
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    const teacherPieData = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + diff);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const cutoffStr = perfTimeframe === 'pekanan' ? weekStartStr : monthStartStr;

        const totals = { 
            [MemorizationStatus.LANCAR]: 0, 
            [MemorizationStatus.TIDAK_LANCAR]: 0, 
            [MemorizationStatus.TIDAK_SETOR]: 0 
        };

        recentRecords.forEach(rec => {
            if (!rec.record_date) return;
            const rDate = rec.record_date.split('T')[0];
            const isTypeMatch = perfType === 'all' || String(rec.type).toLowerCase() === String(perfType).toLowerCase();
            
            if (rDate >= cutoffStr && isTypeMatch) {
                const rawStatus = String(rec.status || rec.keterangan || '').toUpperCase().replace(/_/g, ' ').trim();
                const isTidakSetor = rawStatus.includes('SETOR') && (rawStatus.includes('TIDAK') || rawStatus.includes('BELUM'));
                const isTidakLancar = rawStatus.includes('LANCAR') && (rawStatus.includes('TIDAK') || rawStatus.includes('BELUM'));
                const isLancar = rawStatus.includes('LANCAR') && !isTidakLancar;

                if (isLancar) totals[MemorizationStatus.LANCAR]++;
                else if (isTidakLancar) totals[MemorizationStatus.TIDAK_LANCAR]++;
                else if (isTidakSetor) totals[MemorizationStatus.TIDAK_SETOR]++;
            }
        });

        const totalCount = Object.values(totals).reduce((a, b) => a + b, 0);
        if (totalCount === 0) return [{ name: 'Belum Ada Data', value: 1, color: '#f1f5f9' }];

        return [
            { name: 'Lancar', value: totals[MemorizationStatus.LANCAR], color: '#10b981' },
            { name: 'Tidak Lancar', value: totals[MemorizationStatus.TIDAK_LANCAR], color: '#f59e0b' },
            { name: 'Tidak Setor', value: totals[MemorizationStatus.TIDAK_SETOR], color: '#f43f5e' }
        ];
    }, [recentRecords, perfTimeframe, perfType]);

    const studentsNotDeposited = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const depositedStudentIds = new Set(
            recentRecords
                .filter(r => r.record_date.startsWith(today))
                .map(r => r.student_id)
        );
        return students.filter(s => !depositedStudentIds.has(s.id));
    }, [students, recentRecords]);

    const filteredRecentRecords = useMemo(() => {
        return recentRecords.filter(r => 
            r.status && 
            r.status !== MemorizationStatus.EMPTY
        );
    }, [recentRecords]);


    return (
        <div className="flex-1 h-[calc(100vh-110px)] lg:h-[calc(100vh-140px)] flex flex-col gap-2.5 lg:gap-3 animate-fade-in pb-0 overflow-hidden">
            {user.role === UserRole.TEACHER && !myHalaqah && !loading && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-center gap-3 text-amber-800 shadow-sm shadow-amber-50">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                    <p className="text-xs font-bold uppercase tracking-tight">Anda belum ditugaskan ke halaqah manapun. Hubungi admin untuk pengaturan halaqah.</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
                <div className="bg-white rounded-2xl p-3 lg:p-4 border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-jade-200 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-jade-50/40 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className="w-8 h-8 lg:w-9 lg:h-9 bg-jade-50 text-jade-700 rounded-xl flex items-center justify-center shadow-sm relative z-10">
                        <Users className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Total Santri</p>
                        <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{students.length}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 lg:p-4 border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-rose-200 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50/40 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className="w-8 h-8 lg:w-9 lg:h-9 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center shadow-sm relative z-10">
                        <Book className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Sabaq Hari Ini</p>
                        <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{teacherStats?.sabaqToday ?? 0}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 lg:p-4 border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-amber-200 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/40 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className="w-8 h-8 lg:w-9 lg:h-9 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shadow-sm relative z-10">
                        <Zap className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Sabqi Hari Ini</p>
                        <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{teacherStats?.sabqiToday ?? 0}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 lg:p-4 border border-slate-100 shadow-sm flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-emerald-200 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/40 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                    <div className="w-8 h-8 lg:w-9 lg:h-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shadow-sm relative z-10">
                        <Activity className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Manzil Hari Ini</p>
                        <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{teacherStats?.manzilToday ?? 0}</h4>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-5 flex flex-col h-full relative">
                    <div className="flex flex-row items-center justify-between gap-2 mb-3 lg:mb-6">
                        <div className="flex items-start gap-3">
                            <h3 className="text-[9.5px] lg:text-[10px] ps-2 font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                Performa {perfTimeframe === 'pekanan' ? 'Pekan' : 'Bulan'}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="hidden lg:flex items-center gap-2 ml-auto">
                                <div className="flex flex-none bg-white p-1 rounded-full border border-slate-200 shadow-sm ring-1 ring-white group hover:border-jade-100 transition-all h-9 lg:h-10">
                                    {[
                                        { id: 'all', label: 'Semua' },
                                        { id: MemorizationType.SABAQ, label: 'Sabaq' },
                                        { id: MemorizationType.SABQI, label: 'Sabqi' },
                                        { id: MemorizationType.MANZIL, label: 'Manzil' }
                                    ].map(type => (
                                        <button 
                                            key={type.id}
                                            onClick={() => setPerfType(type.id as any)}
                                            className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap ${
                                                perfType === type.id ? 'bg-jade-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-none bg-white p-1 rounded-full border border-slate-200 shadow-sm ring-1 ring-white group hover:border-jade-100 transition-all h-9 lg:h-10">
                                    {[
                                        { id: 'pekanan', label: 'Pekan' },
                                        { id: 'bulanan', label: 'Bulan' }
                                    ].map(tf => (
                                        <button 
                                            key={tf.id}
                                            onClick={() => setPerfTimeframe(tf as any)}
                                            className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap ${
                                                perfTimeframe === tf.id ? 'bg-jade-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {tf.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={() => refreshData(false)}
                                disabled={isRefreshing}
                                className={`h-9 w-9 lg:h-10 lg:w-10 bg-white text-slate-400 rounded-full border border-slate-200 hover:text-jade-600 hover:border-jade-100 transition-all shadow-sm flex items-center justify-center ${isRefreshing ? 'opacity-50' : 'active:scale-90 lg:active:scale-95'}`}
                            >
                                <RotateCcw className={`w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>

                            <button 
                                onClick={() => setIsActivityModalOpen(true)}
                                className="bg-white hover:bg-slate-50 px-4 h-9 lg:h-10 rounded-full text-[8.5px] font-black text-jade-700 uppercase tracking-widest transition-all active:scale-95 border border-slate-200 shadow-sm flex items-center justify-center min-w-[50px]"
                            >
                                LOG
                            </button>
                        </div>
                    </div>

                    <div className="lg:hidden flex flex-col gap-2.5 mb-4">
                        <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm w-full divide-x divide-slate-100 ring-1 ring-white h-10">
                            {['all', MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => setPerfType(t as any)}
                                    className={`flex-1 py-1 text-[8px] font-black uppercase rounded-full transition-all ${perfType === t ? 'bg-jade-600 text-white shadow-md' : 'text-slate-400'}`}
                                >
                                    {String(t).replace('all', 'Semua')}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm w-full divide-x divide-slate-100 ring-1 ring-white h-10">
                            {['pekanan', 'bulanan'].map(tf => (
                                <button 
                                    key={tf} 
                                    onClick={() => setPerfTimeframe(tf as any)}
                                    className={`flex-1 py-1 text-[8px] font-black uppercase rounded-full transition-all ${perfTimeframe === tf ? 'bg-jade-600 text-white shadow-md' : 'text-slate-400'}`}
                                >
                                    {tf === 'pekanan' ? 'Pekan' : 'Bulan'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full overflow-hidden">
                        {teacherPieData.length > 0 ? (
                            <>
                                <div className="w-full flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={teacherPieData}
                                                innerRadius="60%"
                                                outerRadius="85%"
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
                                <div className={`${teacherPieData.length === 1 ? 'flex justify-center' : 'grid grid-cols-3'} gap-2 w-full mt-1 shrink-0`}>
                                    {teacherPieData.map(entry => {
                                        const totalValue = teacherPieData.reduce((acc, curr) => acc + curr.value, 0);
                                        const percentage = totalValue > 0 ? Math.round((entry.value / totalValue) * 100) : 0;
                                        const isNoData = entry.name === 'Belum Ada Data';

                                        return (
                                            <div key={entry.name} className={`bg-white rounded-2xl py-1.5 px-2 border border-slate-200 flex flex-col items-center justify-center group hover:shadow-md transition-all ${isNoData ? 'min-w-[120px]' : ''}`}>
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                                                    <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">{entry.name}</span>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-[10px] lg:text-xs font-black text-slate-800">{isNoData ? 0 : entry.value}</p>
                                                    {!isNoData && <p className="text-[7px] lg:text-[8px] font-bold text-slate-400">({percentage}%)</p>}
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

        </div>
    );
};
