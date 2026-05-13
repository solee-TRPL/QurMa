
import React, { useState } from 'react';
import { GraduationCap, Users, School, FileText, AlertCircle, Activity, Zap, Book, ChevronRight, ChevronLeft, ChevronDown, Calendar, RefreshCw, Target } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { UserProfile, UserRole, Student, MemorizationRecord, AdminStats, Halaqah, MemorizationType, MemorizationStatus } from '../../types';
import { PendingManzilModal } from './PendingManzilModal';

interface AdminDashboardProps {
    user: UserProfile;
    adminStats: AdminStats | null;
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    students: Student[];
    activeDays: number[];
    isRefreshing: boolean;
    refreshData: (showFullLoader?: boolean) => Promise<void>;
    
    // Trend States
    adminTrendType: MemorizationType | 'all';
    setAdminTrendType: (t: MemorizationType | 'all') => void;
    adminTrendPeriod: 'weekly' | 'monthly' | '3months' | '6months' | 'yearly';
    setAdminTrendPeriod: (p: any) => void;
    adminTrendWeekOffset: number;
    setAdminTrendWeekOffset: (o: number | ((v: number) => number)) => void;
    adminTrendMonth: number;
    setAdminTrendMonth: (m: number | ((v: number) => number)) => void;
    adminTrendYear: number;
    setAdminTrendYear: (y: number | ((v: number) => number)) => void;
    loadingAdminTrend: boolean;
    adminTrendData: any[];

    

    // Target States
    adminTargetHalaqahId: string;
    setAdminTargetHalaqahId: (id: string) => void;
    adminTargetWeekOffset: number;
    setAdminTargetWeekOffset: (o: number | ((v: number) => number)) => void;
    adminTargetData: any[];
    loadingAdminTargetChart: boolean;
    adminTargetWeekRange: { display: string };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    user,
    adminStats,
    halaqahs,
    allUsers,
    students,
    activeDays,
    isRefreshing,
    refreshData,
    adminTrendType,
    setAdminTrendType,
    adminTrendPeriod,
    setAdminTrendPeriod,
    adminTrendWeekOffset,
    setAdminTrendWeekOffset,
    adminTrendMonth,
    setAdminTrendMonth,
    adminTrendYear,
    setAdminTrendYear,
    loadingAdminTrend,
    adminTrendData,
    
    adminTargetHalaqahId,
    setAdminTargetHalaqahId,
    adminTargetWeekOffset,
    setAdminTargetWeekOffset,
    adminTargetData,
    loadingAdminTargetChart,
    adminTargetWeekRange
}) => {
    const [isPendingManzilModalOpen, setIsPendingManzilModalOpen] = useState(false);

    return (
        <div className="flex-1 h-auto flex flex-col gap-3 lg:gap-4 animate-fade-in pb-20 lg:pb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
                {[
                    { label: 'Total Santri', value: adminStats?.totalStudents || 0, icon: GraduationCap, color: 'jade' },
                    { label: 'Total Guru', value: adminStats?.totalTeachers || 0, icon: Users, color: 'blue' },
                    { label: 'Total Halaqah', value: adminStats?.totalHalaqahs || 0, icon: School, color: 'orange' },
                    { label: 'Setoran Hari Ini', value: adminStats?.totalRecordsToday || 0, icon: FileText, color: 'emerald' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-jade-300 transition-all shadow-none">
                        <div className={`absolute right-0 top-0 w-24 h-24 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                            stat.color === 'jade' ? 'bg-jade-50/40' :
                            stat.color === 'blue' ? 'bg-blue-50/40' :
                            stat.color === 'orange' ? 'bg-orange-50/40' :
                            'bg-emerald-50/40'
                        }`} />
                        <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center border-2 relative z-10 ${
                            stat.color === 'jade' ? 'bg-jade-50 text-jade-700 border-jade-100' :
                            stat.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            stat.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                            <stat.icon className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                            <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
                {[
                    { label: 'Belum Manzil Hari Ini', value: adminStats?.notManzilToday || 0, icon: AlertCircle, color: 'rose', onClick: () => setIsPendingManzilModalOpen(true) },
                    { label: 'Setoran Manzil Hari Ini', value: adminStats?.manzilToday || 0, icon: Activity, color: 'emerald' },
                    { label: 'Setoran Sabaq Hari Ini', value: adminStats?.sabaqToday || 0, icon: Zap, color: 'rose' },
                    { label: 'Setoran Sabqi Hari Ini', value: adminStats?.sabqiToday || 0, icon: Book, color: 'amber' }
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        className={`bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center justify-between relative overflow-hidden group transition-all shadow-none ${stat.onClick ? 'cursor-pointer hover:border-rose-300 active:scale-98' : 'hover:border-jade-300'}`}
                        onClick={stat.onClick}
                    >
                        <div className={`absolute right-0 top-0 w-24 h-24 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                            stat.color === 'rose' ? 'bg-rose-50/40' :
                            stat.color === 'amber' ? 'bg-amber-50/40' :
                            'bg-emerald-50/40'
                        }`} />
                        
                        <div className="flex items-center gap-3 lg:gap-4 relative z-10">
                            <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center border-2 ${
                                stat.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                stat.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                                <stat.icon className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                            </div>
                            <div>
                                <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                                <h4 className={`text-sm lg:text-lg font-black leading-none ${stat.label === 'Belum Manzil Hari Ini' ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {stat.value}
                                </h4>
                            </div>
                        </div>

                        {stat.onClick && (
                            <div className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-50 border-2 border-slate-100 items-center justify-center text-slate-300 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all relative z-10">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5 flex-1 min-h-0">
                {/* 1. Trend Chart (Full Width) */}
                <div className="lg:col-span-4 bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col min-h-[400px] lg:min-h-[340px] relative transition-all duration-500 overflow-hidden shadow-none">
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
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                                Tren Setoran
                            </h3>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data harian kategori hafalan</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center bg-white px-4 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 shrink-0 justify-center sm:justify-start gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-jade-600"></div>
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">SABAQ</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">SABQI</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></div>
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">MANZIL</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:gap-3 sm:w-auto">
                                <div className="flex items-center bg-white px-3.5 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 gap-1.5 hover:border-jade-300 transition-all group cursor-pointer relative shrink-0">
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

                                <div className="flex items-center bg-white px-4 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-11 gap-1.5 hover:border-jade-300 transition-all group cursor-pointer relative shrink-0">
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
                            
                            <div className="flex items-center gap-1.5 ml-auto">
                                <div className="flex items-center gap-1 bg-jade-600 p-1 rounded-xl shadow-none flex-1 sm:flex-none sm:min-w-[140px] shrink-0 h-9 lg:h-10">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (adminTrendPeriod === 'weekly') setAdminTrendWeekOffset(prev => prev - 1);
                                            else if (adminTrendPeriod === 'monthly') {
                                                if (adminTrendMonth === 0) { setAdminTrendMonth(11); setAdminTrendYear(prev => prev - 1); }
                                                else setAdminTrendMonth(prev => prev - 1);
                                            } else if (adminTrendPeriod === '3months') {
                                                setAdminTrendMonth(prev => {
                                                    if (prev < 3) { setAdminTrendYear(y => y - 1); return prev + 12 - 3; }
                                                    return prev - 3;
                                                });
                                            } else if (adminTrendPeriod === '6months') {
                                                setAdminTrendMonth(prev => {
                                                    if (prev < 6) { setAdminTrendYear(y => y - 1); return 11; }
                                                    return 5;
                                                });
                                            } else if (adminTrendPeriod === 'yearly') setAdminTrendYear(prev => prev - 1);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>
                                    <div className="flex-1 px-1 text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                                        <Calendar className="w-2.5 h-2.5 opacity-60" />
                                        <span className="whitespace-nowrap text-[6.5px] lg:text-[7.5px]">
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
                                                if (adminTrendPeriod === 'monthly') return new Date(adminTrendYear, adminTrendMonth).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
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
                                                if (adminTrendPeriod === 'yearly') return adminTrendYear.toString();
                                                return new Date(adminTrendYear, adminTrendMonth).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
                                            })()}
                                        </span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (adminTrendPeriod === 'weekly') setAdminTrendWeekOffset(prev => prev + 1);
                                            else if (adminTrendPeriod === 'monthly') {
                                                if (adminTrendMonth === 11) { setAdminTrendMonth(0); setAdminTrendYear(prev => prev + 1); }
                                                else setAdminTrendMonth(prev => prev + 1);
                                            } else if (adminTrendPeriod === '3months') {
                                                setAdminTrendMonth(prev => {
                                                    if (prev > 8) { setAdminTrendYear(y => y + 1); return prev - 12 + 3; }
                                                    return prev + 3;
                                                });
                                            } else if (adminTrendPeriod === '6months') {
                                                setAdminTrendMonth(prev => {
                                                    if (prev < 6) return 11;
                                                    setAdminTrendYear(y => y + 1);
                                                    return 5;
                                                });
                                            } else if (adminTrendPeriod === 'yearly') setAdminTrendYear(prev => prev + 1);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>

                                <button 
                                    onClick={() => refreshData()}
                                    className={`h-9 w-9 lg:h-10 lg:w-10 bg-white text-slate-400 rounded-xl border-2 border-slate-300 hover:text-jade-600 hover:bg-white transition-all shadow-none flex items-center justify-center ${isRefreshing ? 'opacity-50' : ''}`}
                                >
                                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <LineChart data={adminTrendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={8} 
                                    interval={adminTrendPeriod === 'weekly' ? 0 : adminTrendPeriod === 'monthly' ? 2 : 0}
                                />
                                <YAxis tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                                <Tooltip 
                                    cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                    contentStyle={{ borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', padding: '10px', boxShadow: 'none' }}
                                    itemStyle={{ color: '#1e293b', fontSize: '9px', fontWeight: 900, padding: 0, textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#94a3b8', opacity: 1, fontSize: '7px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}
                                />
                                {(adminTrendType === 'all' || adminTrendType === MemorizationType.SABAQ) && (
                                    <Line type="monotone" name="Sabaq" dataKey="sabaq" stroke="var(--color-jade-600)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: 'var(--color-jade-600)' }} />
                                )}
                                {(adminTrendType === 'all' || adminTrendType === MemorizationType.SABQI) && (
                                    <Line type="monotone" name="Sabqi" dataKey="sabqi" stroke="var(--color-primary-500)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: 'var(--color-primary-500)' }} />
                                )}
                                {(adminTrendType === 'all' || adminTrendType === MemorizationType.MANZIL) && (
                                    <Line type="monotone" name="Manzil" dataKey="manzil" stroke="#94a3b8" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#94a3b8' }} />
                                )} 
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col relative min-h-[340px] transition-all duration-500 overflow-hidden shadow-none">
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
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                            Pencapaian Target Pekanan
                        </h3>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Monitor hasil capaian pekanan 
                            {adminTargetData.some(d => d.tercapai > 0 || d.tidakTercapai > 0 || d.terlampaui > 0) && (
                                <span className="text-emerald-500 ml-1">
                                    {adminTargetData.reduce((acc, curr) => acc + (curr.tercapai || 0) + (curr.tidakTercapai || 0) + (curr.terlampaui || 0), 0)} DATA
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <div className="hidden lg:flex items-center gap-4 px-5 rounded-xl bg-white border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 shrink-0">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-jade-600"></div>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">TERCAPAI</span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">TERLAMPAUI</span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></div>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">TIDAK TERCAPAI</span>
                            </div>
                        </div>

                        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center bg-white px-3.5 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 gap-2 hover:border-jade-300 transition-all group cursor-pointer relative flex-1 sm:flex-none sm:min-w-[110px]">
                                <select value={adminTargetHalaqahId} onChange={(e) => setAdminTargetHalaqahId(e.target.value)} className="bg-transparent text-[8px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase appearance-none pr-4 w-full">
                                    <option value="all">HALAQAH</option>
                                    {halaqahs.map(h => (
                                        <option key={h.id} value={h.id}>{h.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-300 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                            </div>

                            <div className="flex items-center gap-1 bg-jade-600 p-1 rounded-xl shadow-none flex-1 sm:flex-none sm:min-w-[140px] h-9 lg:h-10">
                                <button type="button" onClick={() => setAdminTargetWeekOffset(prev => prev - 1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"><ChevronLeft className="w-2.5 h-2.5" /></button>
                                <div className="flex-1 px-1 text-[6.5px] lg:text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1 lg:gap-1.5"><Calendar className="w-2.5 h-2.5 opacity-60 hidden xs:block" /><span className="whitespace-nowrap">{adminTargetWeekRange.display}</span></div>
                                <button type="button" onClick={() => setAdminTargetWeekOffset(prev => prev + 1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"><ChevronRight className="w-2.5 h-2.5" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full overflow-hidden">
                    {adminTargetData.some(d => (d.tercapai || 0) > 0 || (d.tidakTercapai || 0) > 0 || (d.terlampaui || 0) > 0) ? (
                        <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
                            <BarChart data={adminTargetData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', padding: '10px', boxShadow: 'none' }} cursor={{ fill: '#f8fafc' }} itemStyle={{ color: '#1e293b', fontSize: '9px', fontWeight: 900, padding: 0, textTransform: 'uppercase' }} labelStyle={{ color: '#94a3b8', opacity: 1, fontSize: '7px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }} />
                                <Bar dataKey="tercapai" name="Tercapai" fill="var(--color-jade-600)" radius={[5, 5, 0, 0]} barSize={28} />
                                <Bar dataKey="tidakTercapai" name="Tidak Tercapai" fill="#f43f5e" radius={[5, 5, 0, 0]} barSize={28} />
                                <Bar dataKey="terlampaui" name="Terlampaui" fill="var(--color-primary-500)" radius={[5, 5, 0, 0]} barSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-3"><Target className="w-7 h-7 text-slate-200" /></div>
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
};
