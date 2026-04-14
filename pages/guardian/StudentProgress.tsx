
import React, { useState, useEffect } from 'react';
import { UserProfile, Student } from '../../types';
import { getStudents, supabase } from '../../services/dataService';
import { TrendingUp, School, Target, PieChart as PieIcon, LineChart as ChartIcon, Activity, GraduationCap, ChevronRight, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProgressRow {
    kelas: number;
    semester: number;
    hafalanActual: string;
    sabaqActual: string;
    hafalanTarget: string;
    sabaqTarget: string;
    hafalanKet: string;
    sabaqKet: string;
}

export const StudentProgress: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [actuals, setActuals] = useState<Record<string, { hafalan: string, sabaq: string }>>({});

    const sabaqAcuan = [
        { kelas: 1, semester: 1, target: 'Kemampuan membaca Qur\'an', total: null },
        { kelas: 1, semester: 2, target: 1, total: 1 },
        { kelas: 2, semester: 1, target: 1, total: 2 },
        { kelas: 2, semester: 2, target: 1, total: 3 },
        { kelas: 3, semester: 1, target: 1.5, total: 4.5 },
        { kelas: 3, semester: 2, target: 1, total: 5.5 },
        { kelas: 4, semester: 1, target: 1.5, total: 7 },
        { kelas: 4, semester: 2, target: 1, total: 8 },
        { kelas: 5, semester: 1, target: 2, total: 10 },
        { kelas: 5, semester: 2, target: 1.5, total: 11.5 },
        { kelas: 6, semester: 1, target: 2, total: 13.5 },
        { kelas: 6, semester: 2, target: 1.5, total: 15 },
    ];
    
    useEffect(() => {
        const fetchStudentAndProgress = async () => {
            setLoading(true);
            try {
                const allStudents = await getStudents(user.tenant_id!);
                const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents.find(s => s.id === 's1');
                setStudent(myStudent || null);

                if (myStudent) {
                    const { data, error } = await supabase
                        .from('student_semester_progress')
                        .select('progress_data')
                        .eq('student_id', myStudent.id)
                        .maybeSingle();
                    
                    if (data?.progress_data) {
                        setActuals(data.progress_data);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch student progress", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentAndProgress();
    }, [user]);

    const progressData: ProgressRow[] = sabaqAcuan.map((acuan) => {
        const key = `${acuan.kelas}-${acuan.semester}`;
        const currentActual = actuals[key] || { hafalan: '', sabaq: '' };
        const sTargetVal = typeof acuan.target === 'number' ? acuan.target * 20 : 0;
        const hTargetVal = acuan.total || 0;
        const hActualVal = parseFloat(currentActual.hafalan) || 0;
        const sActualVal = parseFloat(currentActual.sabaq) || 0;
        const hKet = currentActual.hafalan !== '' ? (hActualVal >= hTargetVal ? 'Tercapai' : 'Tidak Tercapai') : '';
        const sKet = currentActual.sabaq !== '' ? (sActualVal >= sTargetVal ? 'Tercapai' : 'Tidak Tercapai') : '';

        return {
            kelas: acuan.kelas,
            semester: acuan.semester,
            hafalanTarget: hTargetVal > 0 ? `${hTargetVal} Juz` : '0',
            sabaqTarget: sTargetVal > 0 ? `${sTargetVal} Hal` : '0',
            hafalanActual: currentActual.hafalan,
            sabaqActual: currentActual.sabaq,
            hafalanKet: hKet,
            sabaqKet: sKet,
        };
    });

    const maxSabaqActual = Object.values(actuals).reduce((max, curr) => {
        const val = parseInt(curr.sabaq) || 0;
        return val > max ? val : max;
    }, 0);

    const maxHafalanActual = Object.values(actuals).reduce((max, curr) => {
        const val = parseFloat(curr.hafalan) || 0;
        return val > max ? val : max;
    }, 0);

    const chartData = sabaqAcuan.map((acuan, idx) => {
        const key = `${acuan.kelas}-${acuan.semester}`;
        const actual = actuals[key] || { hafalan: '', sabaq: '' };
        return {
            name: idx + 1,
            hTarget: acuan.total || 0,
            hActual: parseFloat(actual.hafalan) || null,
            sTarget: typeof acuan.target === 'number' ? acuan.target * 20 : 0,
            sActual: parseFloat(actual.sabaq) || null,
            hafalanActual: parseFloat(actual.hafalan) || null,
            targetHafalan: acuan.total || 0,
            sabaqActual: parseFloat(actual.sabaq) || null,
            targetSabaq: typeof acuan.target === 'number' ? acuan.target * 20 : 0,
        };
    });

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Perkembangan...</p>
        </div>
    );

    if (!student) return (
        <div className="p-20 text-center">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Data santri tidak ditemukan.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-6">
            {/* STUDENT PROFILE STRIP - CHARTBOX STYLE */}
            {/* STUDENT PROFILE STRIP - CLEAN INTEGRATED STYLE */}
            <div className="bg-transparent flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-visible group shrink-0 py-2">
                
                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100/50 relative transition-all group-hover:scale-105 group-hover:rotate-3">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{student.full_name}</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100/50 shadow-sm">NIS: {student.nis || '-'}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                {student.gender === 'L' ? 'Putra' : 'Putri'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                    <div className="flex-1 md:flex-none bg-white/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-slate-200/50 text-center transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Maks Sabaq</p>
                        <p className="text-lg font-black text-slate-800 leading-none">{maxSabaqActual} <span className="text-[10px] text-slate-300">Hal</span></p>
                    </div>
                    <div className="flex-1 md:flex-none bg-indigo-50/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-indigo-100/30 text-center transition-all hover:bg-white hover:shadow-md hover:border-indigo-200 group/btn">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Maks Hafalan</p>
                        <p className="text-lg font-black text-indigo-700 leading-none group-hover/btn:text-indigo-800">{maxHafalanActual.toFixed(1)} <span className="text-[10px] text-indigo-300">Juz</span></p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* CLEAN DATA TABLE - TOP */}
                <div className="overflow-x-auto rounded-xl border-2 border-slate-200/60 shadow-sm bg-white overflow-hidden">
                    <table className="w-full text-center border-separate border-spacing-0">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50">
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50/50 w-12 rounded-tl-xl">No. Data</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50/50 w-12">Kelas</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50/50 w-12">Semester</th>
                                <th className="px-4 py-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b border-r border-slate-200 bg-indigo-50/20 min-w-[110px]">Hafalan</th>
                                <th className="px-4 py-2 text-[9px] font-black text-blue-600 uppercase tracking-widest border-b border-r border-slate-200 bg-blue-50/20 min-w-[110px]">Sabaq</th>
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50/30 min-w-[110px]">Target Hafalan</th>
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50/30 min-w-[110px]">Ket</th>
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50/30 min-w-[110px]">Target Sabaq</th>
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-slate-50/30 min-w-[110px] rounded-tr-xl">Ket</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {progressData.map((row, idx) => (
                                <tr key={`${row.kelas}-${row.semester}`} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className={`px-3 py-1.5 border-r border-b border-slate-200 text-[10px] font-black text-slate-300 ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    {row.semester === 1 ? (
                                        <td rowSpan={2} className={`px-3 py-1.5 border-r border-b border-slate-200 bg-slate-50/20 align-middle ${idx === progressData.length - 2 ? 'border-b-0' : ''}`}>
                                            <p className="text-sm font-black text-slate-700 leading-none">{row.kelas}</p>
                                        </td>
                                    ) : null}
                                    <td className={`px-3 py-1.5 border-r border-b border-slate-200 ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        <p className="text-xs font-black text-slate-800 leading-none">{row.semester}</p>
                                    </td>
                                    <td className={`px-2 py-1.5 border-r border-b border-slate-200 bg-indigo-50/5 ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        <p className="text-sm font-black text-indigo-700">{row.hafalanActual || '0.0'}</p>
                                    </td>
                                    <td className={`px-2 py-1.5 border-r border-b border-slate-200 bg-blue-50/5 ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        <p className="text-sm font-black text-blue-700">{row.sabaqActual || '0'}</p>
                                    </td>
                                    <td className={`px-4 py-1.5 border-r border-b border-slate-200 ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        <p className="text-xs font-black text-slate-800 leading-none">{row.hafalanTarget}</p>
                                    </td>
                                    <td className={`px-4 py-1.5 border-r border-b border-slate-200 text-center ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        {row.hafalanKet && (
                                            <span className={`px-2 py-0.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm ${row.hafalanKet === 'Tercapai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-500 border-rose-100/50'}`}>
                                                {row.hafalanKet}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-1.5 border-r border-b border-slate-200 ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        <p className="text-xs font-black text-slate-800 leading-none">{row.sabaqTarget}</p>
                                    </td>
                                    <td className={`px-4 py-1.5 border-b border-slate-200 text-center ${idx === progressData.length - 1 ? 'border-b-0' : ''}`}>
                                        {row.sabaqKet && (
                                            <span className={`px-2 py-0.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm ${row.sabaqKet === 'Tercapai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-500 border-rose-100/50'}`}>
                                                {row.sabaqKet}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* VISUAL ANALYTICS - CHARTS STACKED BELOW TABLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HAFALAN TREND */}
                    <div className="bg-white p-8 rounded-xl border-2 border-slate-50 shadow-sm flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                                Perkembangan Hafalan
                            </h3>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">JUZ</span>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} domain={[0, 30]} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                    />
                                    <Line type="linear" dataKey="targetHafalan" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                                    <Line type="linear" dataKey="hafalanActual" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* SABAQ TREND */}
                    <div className="bg-white p-8 rounded-xl border-2 border-slate-50 shadow-sm flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                                Perkembangan Sabaq
                            </h3>
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">HAL</span>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                    />
                                    <Line type="linear" dataKey="targetSabaq" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                                    <Line type="linear" dataKey="sabaqActual" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
