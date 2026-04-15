
import React, { useState, useEffect } from 'react';
import { UserProfile, Student } from '../../types';
import { getStudentsByHalaqah, getUsers, supabase } from '../../services/dataService';
import { 
    GraduationCap, 
    Users, 
    Search, 
    Save, 
    TrendingUp, 
    Activity, 
    ChevronRight,
    Search as SearchIcon,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotification } from '../../lib/NotificationContext';

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

export const ManageStudentProgress: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actuals, setActuals] = useState<Record<string, { hafalan: string, sabaq: string }>>({});
    const { addNotification } = useNotification();
    const studentIdParam = new URLSearchParams(window.location.search).get('id');

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
        const fetchStudents = async () => {
            setLoading(true);
            try {
                // Find teacher's halaqah
                const allHalaqahs = await supabase.from('halaqah_classes').select('*').eq('teacher_id', user.id);
                if (allHalaqahs.data && allHalaqahs.data.length > 0) {
                    const halaqahId = allHalaqahs.data[0].id;
                    const studentList = await getStudentsByHalaqah(halaqahId);
                    setStudents(studentList);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [user]);

    // Sync selected student from URL param or auto-select first
    useEffect(() => {
        if (students.length > 0) {
            if (studentIdParam) {
                const student = students.find(s => s.id === studentIdParam);
                if (student) setSelectedStudent(student);
            } else if (!selectedStudent) {
                // Auto-select first student if none selected via URL
                setSelectedStudent(students[0]);
            }
        }
    }, [students, studentIdParam]);

    // Handle student selection
    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        
        // Update URL without page reload using Native History API
        const url = new URL(window.location.href);
        url.searchParams.set('id', student.id);
        window.history.pushState({}, '', url);
    };

    useEffect(() => {
        if (!selectedStudent) return;
        
        const fetchProgress = async () => {
            try {
                const { data, error } = await supabase
                    .from('student_semester_progress')
                    .select('progress_data')
                    .eq('student_id', selectedStudent.id)
                    .maybeSingle();
                
                if (data?.progress_data) {
                    setActuals(data.progress_data);
                } else {
                    setActuals({});
                }
            } catch (e) {
                setActuals({});
            }
        };
        fetchProgress();
    }, [selectedStudent]);

    const handleSave = async () => {
        if (!selectedStudent) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('student_semester_progress')
                .upsert({
                    student_id: selectedStudent.id,
                    progress_data: actuals,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'student_id' });
            
            if (error) throw error;
            addNotification({ type: 'success', title: 'Berhasil', message: `Data perkembangan ${selectedStudent.full_name} telah disimpan.` });
        } catch (e) {
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan data perkembangan.' });
        } finally {
            setSaving(false);
        }
    };

    const handleActualChange = (e: React.ChangeEvent<HTMLInputElement>, kelas: number, semester: number, field: 'hafalan' | 'sabaq') => {
        const value = e.target.value;
        const key = `${kelas}-${semester}`;
        const prevValue = actuals[key]?.[field] || '';
        
        let processedValue = value;
        let setCursorAt: number | null = null;

        if (field === 'hafalan') {
            processedValue = processedValue.replace(/^0+(?=\d)/, '');
            if (prevValue === '' && processedValue.length === 1 && /^\d$/.test(processedValue)) {
                processedValue = `${processedValue}.0`;
                setCursorAt = 1;
            }
            if (processedValue.includes('.')) {
                const [integerPart, decimalPart] = processedValue.split('.');
                if (decimalPart && decimalPart.length > 1) {
                    processedValue = `${integerPart}.${decimalPart[0]}`;
                }
            }
        } else if (field === 'sabaq') {
            processedValue = processedValue.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        }

        setActuals(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || { hafalan: '', sabaq: '' }),
                [field]: processedValue
            }
        }));

        if (setCursorAt !== null) {
            const target = e.target;
            setTimeout(() => {
                target.setSelectionRange(setCursorAt, setCursorAt);
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, kelas: number, semester: number, field: 'hafalan' | 'sabaq') => {
        // Block decimals for Sabaq
        if (field === 'sabaq' && (e.key === '.' || e.key === ',')) {
            e.preventDefault();
            return;
        }

        if (field !== 'hafalan' || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
        e.preventDefault();
        const key = `${kelas}-${semester}`;
        const current = actuals[key]?.hafalan || '0.0';
        let val = parseFloat(current) || 0;
        if (e.key === 'ArrowUp') val = Math.min(30, val + 0.1);
        else val = Math.max(0, val - 0.1);
        const formatted = val.toFixed(1);
        setActuals(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || { hafalan: '', sabaq: '' }),
                hafalan: formatted
            }
        }));
    };

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

    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.includes(searchQuery))
    );

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menyiapkan Dashboard Guru...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-5 animate-fade-in pb-10">
            {/* TOP ACTION BAR - WEEKLY TARGET STYLE */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-100/30 p-2 rounded-[24px] border border-slate-200/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full lg:w-auto">
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 shadow-sm">
                        <div className="p-1.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100/50">
                            <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Materi</p>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Progres Semesteran</p>
                        </div>
                    </div>

                    <div className="relative flex-1 w-full max-w-xs group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Cari nama santri..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-slate-50 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-black text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all shadow-sm placeholder:font-bold placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {selectedStudent && (
                    <div className="flex gap-2 w-full lg:w-auto">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 lg:flex-none flex items-center justify-center px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:border-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-pulse' : ''}`} />
                            {saving ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* STUDENT LIST SIDEBAR - ENHANCED STYLE */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col max-h-[700px]">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                Daftar Santri
                            </h3>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">{filteredStudents.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                            {filteredStudents.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectStudent(s)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left group ${
                                        selectedStudent?.id === s.id 
                                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-100/50' 
                                        : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100'
                                    }`}
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-[11px] font-black truncate leading-tight uppercase tracking-tight ${selectedStudent?.id === s.id ? 'text-indigo-700' : 'text-slate-800'}`}>{s.full_name}</p>
                                        <p className={`text-[9px] font-bold mt-0.5 ${selectedStudent?.id === s.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                                            NIS: {s.nis || '-'}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedStudent?.id === s.id ? 'rotate-90 text-indigo-500 opacity-100' : 'text-slate-300 opacity-30 group-hover:translate-x-1 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MANAGEMENT AREA */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {selectedStudent ? (
                        <>
                            {/* STUDENT HEADER INFO - STRIP STYLE */}
                            <div className="bg-white rounded-[24px] p-5 border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-10 -translate-y-10 blur-3xl pointer-events-none" />
                                
                                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{selectedStudent.full_name}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100/50">NIS: {selectedStudent.nis || '-'}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                {selectedStudent.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto relative z-10">
                                    <div className="flex-1 md:flex-none bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-center min-w-[120px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Kurikulum</p>
                                        <p className="text-sm font-black text-slate-800 leading-none">15 <span className="text-[9px] text-slate-400">Juz</span></p>
                                    </div>
                                    <div className="flex-1 md:flex-none bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100/50 text-center min-w-[120px]">
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Status Progres</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-sm font-black text-emerald-700 leading-none">Aktif</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PROGRESS TABLE - WEEKLY TARGET COLOR SCHEME */}
                            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto min-h-[400px]">
                                <table className="w-full text-center border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest">
                                            <th className="px-3 py-2 text-slate-400 border-b border-r border-slate-200 bg-slate-50/50 w-12 rounded-tl-lg">Kelas</th>
                                            <th className="px-3 py-2 text-slate-400 border-b border-r border-slate-200 bg-slate-50/50 w-12">Semester</th>
                                            <th className="px-4 py-2 text-indigo-600 border-b border-r border-slate-200 bg-indigo-50/20 min-w-[90px]">Hafalan</th>
                                            <th className="px-4 py-2 text-blue-600 border-b border-r border-slate-200 bg-blue-50/20 min-w-[90px]">Sabaq</th>
                                            <th className="px-4 py-2 text-slate-400 border-b border-r border-slate-200 bg-slate-50/30 min-w-[110px]">Target Hafalan</th>
                                            <th className="px-4 py-2 text-slate-400 border-b border-r border-slate-200 bg-slate-50/30 min-w-[120px]">Ket</th>
                                            <th className="px-4 py-2 text-slate-400 border-b border-r border-slate-200 bg-slate-50/30 min-w-[110px]">Target Sabaq</th>
                                            <th className="px-4 py-2 text-slate-400 border-b border-slate-200 bg-slate-50/30 min-w-[120px] rounded-tr-lg">Ket</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {progressData.map((row, idx) => (
                                            <tr key={`${row.kelas}-${row.semester}`} className="hover:bg-slate-50/50 transition-colors group">
                                                {row.semester === 1 ? (
                                                    <td rowSpan={2} className="px-3 py-1.5 border-r border-b border-slate-100 bg-slate-50/10 align-middle">
                                                        <p className="text-sm font-black text-slate-700 leading-none">{row.kelas}</p>
                                                    </td>
                                                ) : null}
                                                <td className="px-3 py-1.5 border-r border-b border-slate-100">
                                                    <p className="text-[11px] font-black text-slate-800 leading-none">{row.semester}</p>
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-b border-slate-100 bg-indigo-50/5">
                                                    <input 
                                                        type="number"
                                                        step="0.1"
                                                        value={row.hafalanActual}
                                                        onChange={(e) => handleActualChange(e, row.kelas, row.semester, 'hafalan')}
                                                        onKeyDown={(e) => handleKeyDown(e, row.kelas, row.semester, 'hafalan')}
                                                        className="w-full text-center text-xs font-black text-indigo-700 bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded-xl h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="0.0"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-b border-slate-100 bg-indigo-50/5">
                                                    <input 
                                                        type="number"
                                                        value={row.sabaqActual}
                                                        onChange={(e) => handleActualChange(e, row.kelas, row.semester, 'sabaq')}
                                                        onKeyDown={(e) => handleKeyDown(e, row.kelas, row.semester, 'sabaq')}
                                                        className="w-full text-center text-xs font-black text-indigo-700 bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded-xl h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-1.5 border-r border-b border-slate-100 bg-emerald-50/5">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase">{row.hafalanTarget}</p>
                                                </td>
                                                <td className="px-4 py-1.5 border-r border-b border-slate-100 bg-emerald-50/5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${
                                                        row.hafalanKet === 'Tercapai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 
                                                        row.hafalanKet === 'Tidak Tercapai' ? 'bg-rose-50 text-rose-500 border-rose-100/50' : 
                                                        'bg-slate-50 text-slate-300 border-slate-100'
                                                    }`}>
                                                        {row.hafalanKet || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-1.5 border-r border-b border-slate-100 bg-emerald-50/5">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase">{row.sabaqTarget}</p>
                                                </td>
                                                <td className="px-4 py-1.5 border-b border-slate-100 bg-emerald-50/5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${
                                                        row.sabaqKet === 'Tercapai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 
                                                        row.sabaqKet === 'Tidak Tercapai' ? 'bg-rose-50 text-rose-500 border-rose-100/50' : 
                                                        'bg-slate-50 text-slate-300 border-slate-100'
                                                    }`}>
                                                        {row.sabaqKet || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Pilih Santri</h3>
                            <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed">Pilih salah satu santri dari daftar di sebelah kiri untuk mulai mengelola perkembangan semesterannya.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
