import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole, Student, Halaqah, Class, WeeklyTarget as WeeklyTargetType } from '../../types';
import { 
    getHalaqahs, 
    getStudents, 
    getClasses, 
    getWeeklyTargets, 
    getWeeklyAllTypeTotals,
    getUsers
} from '../../services/dataService';
import { 
  ClipboardList, 
  Calendar, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  AlertCircle,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Info,
  Target,
  User,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useNotification } from '../../lib/NotificationContext';
import { useLoading } from '../../lib/LoadingContext';

interface WeeklyTargetMonitorProps {
  user: UserProfile;
  tenantId: string;
}

interface TargetRow {
  studentId: string;
  nis: string;
  name: string;
  className: string;
  hafalanJuz: string;
  hafalanHal: string;
  manzilAtm: string;
  hariAtm: string;
  sabqiAtm: string;
  css: string;
  manzilTarget: string;
  manzilHal: string;
  manzilKet: 'A' | 'B' | 'C' | '';
  sabqiTarget: string;
  sabqiTargetSurat: string;
  sabqiKet: 'A' | 'B' | 'C' | '';
  sabaqTarget: string;
  sabaqTargetSurat: string;
  sabaqKet: 'A' | 'B' | 'C' | '';
}

export const WeeklyTargetMonitor: React.FC<WeeklyTargetMonitorProps> = ({ user, tenantId }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();
  
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('teacherId') || '';
  });
  const [currentHalaqah, setCurrentHalaqah] = useState<Halaqah | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showNisKelas, setShowNisKelas] = useState(false);
  const [weeklyActualTotals, setWeeklyActualTotals] = useState<Record<string, { sabaq: number, sabqi: number, manzil: number }>>({});
  
  const [currentWeekOffset, setCurrentWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('weekOffset') || '0');
  });

  // Sync URL when selections change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedTeacherId) url.searchParams.set('teacherId', selectedTeacherId);
    url.searchParams.set('weekOffset', currentWeekOffset.toString());
    window.history.replaceState({}, '', url.toString());
  }, [selectedTeacherId, currentWeekOffset]);

  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6
    const diff = (day === 0 ? -6 : 1) - day + (currentWeekOffset * 7);
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const dayStr = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${dayStr}`);
    }
    return dates;
  }, [currentWeekOffset]);

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

  // Initial Load: Fetch Teachers
  useEffect(() => {
    const init = async () => {
        try {
            const allUsers = await getUsers(tenantId);
            const teacherList = allUsers.filter(u => u.role === UserRole.TEACHER);
            setTeachers(teacherList);
            
            // If no teacherId in URL, default to first teacher
            if (!selectedTeacherId && teacherList.length > 0) {
                setSelectedTeacherId(teacherList[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memuat daftar ustadz.' });
            setLoading(false);
        }
    };
    init();
  }, [tenantId]);

  // ATM Calculation Helpers (Clone from teacher page)
  const calculateManzilAtm = (juz: number) => {
    if (juz >= 1 && juz <= 3) return 5;
    if (juz >= 4 && juz <= 7) return 10;
    if (juz >= 8 && juz <= 15) return 20;
    if (juz >= 16 && juz <= 30) return 40;
    return 0;
  };

  const calculateHariAtm = (juz: number, atm: number) => {
    if (juz > 0 && atm > 0) {
        return Math.ceil((juz * 20) / atm);
    }
    return 0;
  };

  const calculateSabqiAtm = (hal: number) => {
    if (hal <= 0) return '';
    if (hal === 1) return 'Rabth';
    if (hal <= 5) return '1';
    if (hal <= 10) return '2';
    if (hal <= 15) return '3';
    if (hal <= 20) return '5';
    return Math.ceil(hal / 5).toString();
  };

  const calculateABCStatus = (achieved: number, target: number): 'A' | 'B' | 'C' | '' => {
    if (target === 0) return '';
    if (achieved > target) return 'A';
    if (achieved === target) return 'B';
    return 'C';
  };

  const fetchData = async () => {
    if (!selectedTeacherId) return;
    setLoading(true);
    try {
        const [halaqahData, studentData, classData] = await Promise.all([
            getHalaqahs(tenantId),
            getStudents(tenantId),
            getClasses(tenantId)
        ]);

        const filteredHalaqah = halaqahData.find(h => h.teacher_id === selectedTeacherId);
        const classMap = new Map(classData.map(c => [c.id, c.name]));
        
        setCurrentHalaqah(filteredHalaqah || null);

        if (filteredHalaqah) {
            const hStudents = studentData.filter(s => s.halaqah_id === filteredHalaqah.id);
            setStudents(hStudents);
            
            const [existingTargets, weeklyTotals] = await Promise.all([
              getWeeklyTargets(hStudents.map(s => s.id), weekDates[0]),
              getWeeklyAllTypeTotals(hStudents.map(s => s.id), weekDates[0])
            ]);
            setWeeklyActualTotals(weeklyTotals);
            const targetMap = new Map(existingTargets.map(t => [t.student_id, t]));

            const initialTargets: Record<string, TargetRow> = {};
            hStudents.forEach(s => {
                const dbTarget = targetMap.get(s.id);
                const data = dbTarget?.target_data || {};
                
                const juz = data.current_juz ?? s.current_juz ?? 0;
                const hal = data.current_page ?? s.current_page ?? 0;
                const manzilAtmValue = calculateManzilAtm(juz);
                const hariAtmValue = calculateHariAtm(juz, manzilAtmValue);
                const sabqiAtmValue = calculateSabqiAtm(hal);

                const currentClassName = s.class_id ? classMap.get(s.class_id) || '-' : '-';

                initialTargets[s.id] = {
                    studentId: s.id,
                    nis: s.nis || '-',
                    name: s.full_name,
                    className: currentClassName,
                    hafalanJuz: juz > 0 ? juz.toString() : '',
                    hafalanHal: hal > 0 ? hal.toString() : '',
                    manzilAtm: manzilAtmValue > 0 ? manzilAtmValue.toString() : '',
                    hariAtm: hariAtmValue > 0 ? hariAtmValue.toString() : '',
                    sabqiAtm: sabqiAtmValue,
                    css: data.css || '',
                    manzilTarget: data.manzil_target || '',
                    manzilHal: data.manzil_hal?.toString() || '',
                    manzilKet: calculateABCStatus(weeklyTotals[s.id]?.manzil || 0, data.manzil_hal || 0),
                    sabqiTarget: data.sabqi_target?.toString() || '',
                    sabqiTargetSurat: data.sabqi_target_surat || '',
                    sabqiKet: calculateABCStatus(weeklyTotals[s.id]?.sabqi || 0, data.sabqi_target || 0),
                    sabaqTarget: data.sabaq_target?.toString() || '',
                    sabaqTargetSurat: data.sabaq_target_surat || '',
                    sabaqKet: calculateABCStatus(weeklyTotals[s.id]?.sabaq || 0, data.sabaq_target || 0)
                };
            });
            setTargets(initialTargets);
        } else {
            setStudents([]);
            setTargets({});
        }
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memuat data.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
    if (selectedTeacherId) fetchData(); 
  }, [selectedTeacherId, weekDates, currentWeekOffset]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeacherId, searchQuery, currentWeekOffset, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const startEntry = filteredStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endEntry = Math.min(currentPage * itemsPerPage, filteredStudents.length);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Utility Strip - Maintain Teacher Selector for Admin */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-100/30 p-2 rounded-[24px] border border-slate-200/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full lg:w-auto">
              
              {/* Teacher Selector (Keep this for Admin) */}
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 shadow-sm min-w-[240px]">
                  <div className="p-1.5 bg-indigo-500 rounded-lg text-white shrink-0">
                      <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 relative group/sel">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pilih Ustadz</p>
                      <div className="relative">
                          <select 
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="w-full bg-transparent text-[10px] font-black text-slate-800 uppercase tracking-tight focus:outline-none appearance-none cursor-pointer p-0 pr-6 relative z-10"
                          >
                              {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.full_name}</option>
                              ))}
                              {teachers.length === 0 && <option value="">Tidak ada ustadz</option>}
                          </select>
                          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none z-0 group-hover/sel:text-indigo-400 transition-colors" />
                      </div>
                  </div>
              </div>

              <div className="flex bg-white p-1 rounded-[20px] border border-slate-200 shadow-sm ring-1 ring-white">
                  <button 
                      onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                      className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center min-w-[170px]">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5" />
                          {weekDisplayRange}
                      </span>
                      <span className="text-[7px] text-indigo-300 mt-0.5 opacity-80 uppercase tracking-widest font-black">
                          {currentWeekOffset === 0 ? 'Pekan Ini' : 
                           currentWeekOffset === -1 ? 'Pekan Lalu' : 
                           currentWeekOffset === 1 ? 'Pekan Depan' : 
                           currentWeekOffset < 0 ? `${Math.abs(currentWeekOffset)} Pekan Lalu` : 
                           `${currentWeekOffset} Pekan Depan`}
                      </span>
                  </div>
                  <button 
                      onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                      className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 shadow-sm flex-1 md:flex-initial">
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 text-indigo-500">
                      <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halaqah</p>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{currentHalaqah?.name || '-'}</p>
                  </div>
              </div>

              <div className="relative flex-1 w-full max-w-xs group hidden xl:block">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari Santri..." 
                      className="w-full pl-11 pr-4 py-2.5 text-xs font-black border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 transition-all placeholder:font-bold placeholder:text-slate-400 shadow-sm"
                  />
              </div>
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto">
              <div className="px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-100 bg-white/50 text-slate-400 shadow-sm">
                  (READ-ONLY)
              </div>
          </div>
      </div>

      {/* Main Table Grid - PLEK KETIPLEK from WeeklyTarget.tsx */}
      <div className="bg-transparent rounded-none overflow-hidden flex flex-col">
          <div className="p-4 bg-transparent flex flex-col sm:flex-row justify-end items-center gap-4">
              <div className="flex items-center gap-2 bg-transparent">
                  <button 
                    onClick={() => setShowNisKelas(!showNisKelas)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl transition-all text-[10px] font-black uppercase tracking-tight ${showNisKelas ? 'bg-indigo-50/50 text-indigo-600 border border-indigo-100' : 'bg-slate-100/50 text-slate-400 border border-slate-200/50 hover:bg-slate-100'}`}
                  >
                    {showNisKelas ? 'Sembunyikan Identitas' : 'Tampilkan Identitas'}
                  </button>
                  <span className="w-px h-3 bg-slate-200 mx-2"></span>
                  <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-tighter"><CheckCircle2 className="w-3 h-3" /> A: Terampaui</span>
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-tighter"><CheckCircle2 className="w-3 h-3" /> B: Tercapai</span>
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-tighter"><XCircle className="w-3 h-3" /> C: Tidak Tercapai</span>
                  </div>
              </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white rounded-3xl border border-slate-100 shadow-sm">
            <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40">
                    <tr className="bg-white">
                        <th rowSpan={2} className="w-[50px] min-w-[50px] sticky left-0 bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100">No</th>
                        {showNisKelas && (
                            <th rowSpan={2} className="w-[100px] min-w-[100px] sticky left-[50px] bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100 animate-in slide-in-from-left-1 duration-300">NIS</th>
                        )}
                        <th rowSpan={2} className={`w-[220px] min-w-[220px] sticky ${showNisKelas ? 'left-[150px]' : 'left-[50px]'} bg-white z-50 px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-all duration-300`}>Nama Santri</th>
                        {showNisKelas && (
                            <th rowSpan={2} className="w-[80px] min-w-[80px] sticky left-[370px] bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] animate-in slide-in-from-left-1 duration-300">Kelas</th>
                        )}
                        
                        <th colSpan={2} className="px-4 py-3 text-[10px] font-bold text-indigo-600 uppercase tracking-widest text-center border-b border-r border-slate-100 bg-indigo-50/30">Hafalan Saat Ini</th>
                        <th colSpan={3} className="px-4 py-3 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center border-b border-r border-slate-100 bg-blue-50/30">ATM</th>
                        <th rowSpan={2} className="w-24 min-w-[96px] bg-slate-50 px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100">CSS</th>
                        <th colSpan={6} className="px-4 py-3 text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center border-b border-slate-100 bg-emerald-50/30">Target Pekanan</th>
                    </tr>
                    <tr className="bg-white">
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-indigo-50/10 min-w-[60px]">Juz</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-indigo-50/10 min-w-[80px]">Hal</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-blue-50/10 min-w-[80px]">Manzil</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-blue-50/10 min-w-[60px]">/Hari</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-blue-600 uppercase text-center border-b border-r border-slate-100 bg-blue-50/10 min-w-[80px]">Sabqi</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-emerald-50/10 min-w-[180px]">Manzil (Hal/Juz)</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-emerald-50/10 min-w-[50px]">Ket</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-emerald-50/10 min-w-[180px]">Sabqi (Hal)</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-emerald-50/10 min-w-[50px]">Ket</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-r border-slate-100 bg-emerald-50/10 min-w-[180px]">Sabaq (Baris)</th>
                        <th className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase text-center border-b bg-emerald-50/10 min-w-[50px]">Ket</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                        <tr>
                            <td colSpan={20} className="py-24 text-center">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data tidak ditemukan</p>
                            </td>
                        </tr>
                    ) : paginatedStudents.map((s, idx) => {
                        const target = targets[s.id] || {} as TargetRow;
                        const actualIdx = ((currentPage - 1) * itemsPerPage) + idx + 1;

                        return (
                            <tr key={s.id} className="group transition-colors">
                                <td className="sticky left-0 bg-white px-3 py-4 text-[11px] font-bold text-slate-400 text-center border-r border-slate-50 z-20 transition-colors uppercase">{actualIdx}</td>
                                {showNisKelas && (
                                    <td className="sticky left-[50px] bg-white px-3 py-4 text-[11px] font-bold text-slate-600 text-center border-r border-slate-50 z-20 transition-all duration-300">{target.nis}</td>
                                )}
                                <td className={`sticky ${showNisKelas ? 'left-[150px]' : 'left-[50px]'} bg-white px-4 py-4 text-xs font-bold text-slate-800 border-r border-slate-100 z-20 transition-all duration-300 truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)]`}>{target.name}</td>
                                {showNisKelas && (
                                    <td className="sticky left-[370px] bg-white px-3 py-4 text-[11px] font-bold text-slate-600 text-center border-r border-slate-100 z-20 transition-all duration-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{target.className || '-'}</td>
                                )}
                                
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-indigo-50/5 text-slate-800">
                                    <div className="w-full text-center text-xs font-bold h-10 flex items-center justify-center">{target.hafalanJuz || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-indigo-50/5 text-slate-800">
                                    <div className="w-full text-center text-xs font-bold h-10 flex items-center justify-center">{target.hafalanHal || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-blue-50/5">
                                    <div className="w-full text-center text-xs font-black text-blue-600 bg-slate-100/30 rounded h-10 flex items-center justify-center">{target.manzilAtm || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-blue-50/5">
                                    <div className="w-full text-center text-xs font-black text-blue-600 bg-slate-100/30 rounded h-10 flex items-center justify-center">{target.hariAtm || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-blue-50/5">
                                    <div className="w-full text-center text-xs font-black text-blue-600 bg-slate-100/30 rounded h-10 flex items-center justify-center">{target.sabqiAtm || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-100 text-center h-10 text-slate-800">
                                    <div className="w-full text-center text-[10px] font-black flex items-center justify-center">{target.css || '0'}%</div>
                                </td>

                                <td className="px-1.5 py-1.5 border-r border-slate-50 bg-emerald-50/5">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800">{target.manzilTarget || '-'}</div>
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-2 h-9 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700">{target.manzilHal || '0'}</span>
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase ml-1">Hal</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 bg-emerald-50/5 text-center">
                                    <div className={`w-9 h-9 mx-auto flex items-center justify-center text-[11px] font-black rounded-lg border border-slate-100 bg-white shadow-sm ${
                                        target.manzilKet === 'A' ? 'text-amber-500' : 
                                        target.manzilKet === 'C' ? 'text-rose-500' : 
                                        'text-emerald-600'
                                    }`}>{target.manzilKet || '-'}</div>
                                </td>

                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-emerald-50/5 h-10">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800">{target.sabqiTargetSurat || '-'}</div>
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-2 h-9 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700">{target.sabqiTarget || '0'}</span>
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase ml-1">Hal</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 bg-emerald-50/5 text-center">
                                    <div className={`w-9 h-9 mx-auto flex items-center justify-center text-[11px] font-black rounded-lg border border-slate-100 bg-white shadow-sm ${
                                        target.sabqiKet === 'A' ? 'text-amber-500' : 
                                        target.sabqiKet === 'C' ? 'text-rose-500' : 
                                        'text-emerald-600'
                                    }`}>{target.sabqiKet || '-'}</div>
                                </td>

                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-emerald-50/5 h-10">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800">{target.sabaqTargetSurat || '-'}</div>
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-2 h-9 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700">{target.sabaqTarget || '0'}</span>
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase ml-1">Baris</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 bg-emerald-50/5 text-center">
                                    <div className={`w-9 h-9 mx-auto flex items-center justify-center text-[11px] font-black rounded-lg border border-slate-100 bg-white shadow-sm ${
                                        target.sabaqKet === 'A' ? 'text-amber-500' : 
                                        target.sabaqKet === 'C' ? 'text-rose-500' : 
                                        'text-emerald-600'
                                    }`}>{target.sabaqKet || '-'}</div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 rounded-b-3xl shadow-sm mt-2">
              <div className="flex flex-wrap gap-x-8 gap-y-4 text-[10px] font-bold text-slate-400 items-center">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Manzil 15 hari</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Sabqi 5 hari</div>
                  
                  <span className="w-px h-3 bg-slate-200" />
                  
                  <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Tampilkan</span>
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                      </select>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Data</span>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                  {filteredStudents.length > 0 && (
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          Menampilkan <span className="text-indigo-600">{startEntry}-{endEntry}</span> dari <span className="text-slate-800">{filteredStudents.length}</span> santri
                      </div>
                  )}

                  {totalPages > 1 && (
                      <div className="flex items-center gap-3">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                          >
                              <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-1.5">
                              {[...Array(totalPages)].map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-50' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                  >
                                      {i + 1}
                                  </button>
                              ))}
                          </div>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                          >
                              <ChevronRight className="w-4 h-4" />
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
