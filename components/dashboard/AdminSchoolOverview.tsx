import React from 'react';
import { GraduationCap, Users, School, FileText } from 'lucide-react';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AdminStats, Halaqah, Student } from '../../types';

import { useAdminDashboard } from './AdminDashboardContext';

export const AdminSchoolOverview: React.FC = () => {
    const { adminStats, halaqahs, students } = useAdminDashboard();
    return (
        <div className="flex flex-col gap-4 animate-fade-in">
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

            <div className="bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col relative min-h-75 transition-all duration-500 shadow-none">
                <div className="flex flex-col mb-6 shrink-0">
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                        Distribusi Santri per Halaqah
                    </h3>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Diagram jumlah santri di masing-masing kelompok halaqah
                    </p>
                </div>
                <div className="flex-1 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={halaqahs.map(h => ({ name: h.name, total: students.filter(s => s.halaqah_id === h.id).length })).sort((a, b) => b.total - a.total)} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: '#94A3B8' }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', padding: '10px', boxShadow: 'none' }} cursor={{ fill: '#f8fafc' }} itemStyle={{ color: '#1e293b', fontSize: '9px', fontWeight: 900, padding: 0, textTransform: 'uppercase' }} labelStyle={{ color: '#94a3b8', opacity: 1, fontSize: '7px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }} />
                            <Bar dataKey="total" name="Jumlah Santri" fill="var(--color-blue-500)" radius={[5, 5, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
