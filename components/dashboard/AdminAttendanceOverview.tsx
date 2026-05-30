import React from 'react';
import { Activity, AlertCircle, FileText, Target, ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminStats } from '../../types';

import { useAdminDashboard } from './AdminDashboardContext';

export const AdminAttendanceOverview: React.FC = () => {
    const {
        adminStats,
        loadingAdminTargetChart,
        adminTargetWeekRange,
        setAdminTargetWeekOffset,
        adminKehadiranTrendData
    } = useAdminDashboard();
    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
                {[
                    { label: 'Hadir', value: adminStats?.kehadiranToday?.hadir || 0, icon: Activity, color: 'jade', subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.hadir || 0) / adminStats.totalStudents) * 100) : 0}% dari total` },
                    { label: 'Sakit', value: adminStats?.kehadiranToday?.sakit || 0, icon: AlertCircle, color: 'amber', subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.sakit || 0) / adminStats.totalStudents) * 100) : 0}% dari total` },
                    { label: 'Izin', value: adminStats?.kehadiranToday?.izin || 0, icon: FileText, color: 'blue', subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.izin || 0) / adminStats.totalStudents) * 100) : 0}% dari total` },
                    { label: 'Alpa', value: adminStats?.kehadiranToday?.alpa || 0, icon: Target, color: 'rose', subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.alpa || 0) / adminStats.totalStudents) * 100) : 0}% dari total` }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex flex-col justify-center relative overflow-hidden group hover:border-jade-300 transition-all shadow-none">
                        <div className={`absolute right-0 top-0 w-24 h-24 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                            stat.color === 'jade' ? 'bg-jade-50/40' :
                            stat.color === 'amber' ? 'bg-amber-50/40' :
                            stat.color === 'blue' ? 'bg-blue-50/40' :
                            'bg-rose-50/40'
                        }`} />
                        <div className="flex items-center gap-3 lg:gap-4 relative z-10">
                            <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center border-2 ${
                                stat.color === 'jade' ? 'bg-jade-50 text-jade-700 border-jade-100' :
                                stat.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                stat.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                                <stat.icon className="w-4 h-4 lg:w-4.5 lg:h-4.5"/>
                            </div>
                            <div>
                                <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                                <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{stat.value}</h4>
                                <p className="text-[6px] lg:text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.subtext}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col relative min-h75 transition-all duration-500 shadow-none">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 shrink-0 gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                            Tren Kehadiran Pekanan
                        </h3>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Data kehadiran santri selama pekan yang dipilih
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-jade-600 rounded-xl p-1 shrink-0 w-full lg:w-auto h-8 lg:h-9">
                        <button type="button" onClick={() => setAdminTargetWeekOffset(prev => prev - 1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"><ChevronLeft className="w-2.5 h-2.5" /></button>
                        <div className="flex-1 px-1 text-[6.5px] lg:text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1 lg:gap-1.5"><Calendar className="w-2.5 h-2.5 opacity-60 hidden xs:block" /><span className="whitespace-nowrap">{adminTargetWeekRange.display}</span></div>
                        <button type="button" onClick={() => setAdminTargetWeekOffset(prev => prev + 1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"><ChevronRight className="w-2.5 h-2.5" /></button>
                    </div>
                </div>
                <div className="flex-1 w-full overflow-hidden">
                    {loadingAdminTargetChart ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-5 h-5 text-slate-300 animate-spin" />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Memuat data...</p>
                        </div>
                    ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={adminKehadiranTrendData || adminStats?.kehadiranTrend || []} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', padding: '10px', boxShadow: 'none' }} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} itemStyle={{ color: '#1e293b', fontSize: '9px', fontWeight: 900, padding: 0, textTransform: 'uppercase' }} labelStyle={{ color: '#94a3b8', opacity: 1, fontSize: '7px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }} />
                            <Line type="monotone" dataKey="hadir" name="Hadir" stroke="var(--color-jade-600)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="tidak_hadir" name="Tidak Hadir" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
