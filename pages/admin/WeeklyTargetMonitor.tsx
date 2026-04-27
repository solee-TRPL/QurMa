import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole, Student, Halaqah, Class, WeeklyTarget as WeeklyTargetType } from '../../types';
import { 
    getHalaqahs, 
    getStudents, 
    getClasses, 
    getWeeklyTargets, 
    getWeeklyAllTypeTotals,
    getUsers,
    getTenant,
    updateTenant
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
  Filter,
  Settings2,
  Check,
  X
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
  const [allHalaqahs, setAllHalaqahs] = useState<Halaqah[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('halaqahId')
      || localStorage.getItem('qurma_wtm_halaqahId')
      || '';
  });
  const [currentHalaqah, setCurrentHalaqah] = useState<Halaqah | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showNisKelas, setShowNisKelas] = useState(false);
  const [weeklyActualTotals, setWeeklyActualTotals] = useState<Record<string, { sabaq: number, sabqi: number, manzil: number }>>({});
  
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [isDayConfigModalOpen, setIsDayConfigModalOpen] = useState(false);
  const [isSavingCycle, setIsSavingCycle] = useState(false);

  const [currentWeekOffset, setCurrentWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('weekOffset');
    if (fromUrl !== null) return parseInt(fromUrl);
    const fromStorage = localStorage.getItem('qurma_wtm_weekOffset');
    return fromStorage !== null ? parseInt(fromStorage) : 0;
  });

  // Sync URL + localStorage when selections change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedHalaqahId) {
      url.searchParams.set('halaqahId', selectedHalaqahId);
      localStorage.setItem('qurma_wtm_halaqahId', selectedHalaqahId);
    } else {
      url.searchParams.delete('halaqahId');
    }
    url.searchParams.delete('teacherId'); // Clean up old param
    url.searchParams.set('weekOffset', currentWeekOffset.toString());
    localStorage.setItem('qurma_wtm_weekOffset', currentWeekOffset.toString());
    window.history.replaceState({}, '', url.toString());
  }, [selectedHalaqahId, currentWeekOffset]);

  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6
    const diff = (day === 0 ? -6 : 1) - day + (currentWeekOffset * 7);
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        if (activeDays.includes(current.getDay())) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const dayStr = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${dayStr}`);
        }
    }
    return dates;
  }, [currentWeekOffset, activeDays]);

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

  
  // Initial Load: Fetch Teachers, Halaqahs & Tenant Settings
  useEffect(() => {
    const init = async () => {
        try {
            const [allUsers, tenantData, halaqahs] = await Promise.all([
                getUsers(tenantId),
                getTenant(tenantId),
                getHalaqahs(tenantId)
            ]);
            
            if (tenantData?.cycle_config?.activeDays) {
                setActiveDays(tenantData.cycle_config.activeDays);
            }

            const teacherList = allUsers.filter(u => u.role === UserRole.TEACHER);
            setTeachers(teacherList);
            setAllHalaqahs(halaqahs);
            
            // Initial selection sync
            if (selectedHalaqahId) {
                const h = halaqahs.find(h => h.id === selectedHalaqahId);
                if (h && h.teacher_id) setSelectedTeacherId(h.teacher_id);
            } else if (halaqahs.length > 0) {
                const firstHalaqah = halaqahs[0];
                setSelectedHalaqahId(firstHalaqah.id);
                if (firstHalaqah.teacher_id) setSelectedTeacherId(firstHalaqah.teacher_id);
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

  // Sync Logic: Teacher -> Halaqah
  const handleTeacherChange = (teacherId: string) => {
      setSelectedTeacherId(teacherId);
      const matchedHalaqah = allHalaqahs.find(h => h.teacher_id === teacherId);
      if (matchedHalaqah) {
          setSelectedHalaqahId(matchedHalaqah.id);
      } else {
          setSelectedHalaqahId('');
      }
  };

  // Sync Logic: Halaqah -> Teacher
  const handleHalaqahChange = (halaqahId: string) => {
      setSelectedHalaqahId(halaqahId);
      const h = allHalaqahs.find(h => h.id === halaqahId);
      if (h && h.teacher_id) {
          setSelectedTeacherId(h.teacher_id);
      }
  };

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
    if (!selectedTeacherId || !selectedHalaqahId) return;
    setLoading(true);
    try {
        const [studentData, classData] = await Promise.all([
            getStudents(tenantId),
            getClasses(tenantId)
        ]);

        const filteredHalaqah = allHalaqahs.find(h => h.id === selectedHalaqahId);
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
                    hafalanJuz: (juz && juz > 0) ? juz.toString() : '',
                    hafalanHal: (hal && hal > 0) ? hal.toString() : '',
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
    if (selectedTeacherId && selectedHalaqahId) fetchData(); 
  }, [selectedTeacherId, selectedHalaqahId, weekDates, currentWeekOffset]);

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
  }, [selectedTeacherId, selectedHalaqahId, searchQuery, currentWeekOffset, itemsPerPage]);

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
      <div className="flex flex-col lg:flex-row items-center gap-2 md:gap-4 bg-slate-100/30 p-2 rounded-[24px] border border-slate-100/50 backdrop-blur-sm">
          {/* Row 1: Unified Halaqah / Teacher Selector */}
          <div className="flex flex-row items-center gap-2 w-full lg:w-auto lg:flex-1">
              <div className="flex-1 md:flex-initial flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 rounded-2xl border-2 border-slate-10 shadow-sm md:min-w-[340px]">
                  <div className="p-1.5 bg-indigo-500 rounded-lg text-white shrink-0">
                      <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <div className="flex-1 relative group/sel-unified">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pilih Halaqoh / Pengampu</p>
                      <div className="relative">
                          <select 
                            value={selectedHalaqahId}
                            onChange={(e) => handleHalaqahChange(e.target.value)}
                            className="w-full bg-transparent text-[9px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight focus:outline-none appearance-none cursor-pointer p-0 pr-5 relative z-10 truncate"
                          >
                              <option value="">PILIH HALAQOH</option>
                              {allHalaqahs.map(h => {
                                  const t = teachers.find(u => u.id === h.teacher_id);
                                  return (
                                      <option key={h.id} value={h.id}>
                                          {h.name} / {t?.full_name || 'TANPA PENGAMPU'}
                                      </option>
                                  );
                              })}
                          </select>
                          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none z-0 group-hover/sel-unified:text-indigo-400 transition-colors" />
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              {/* Date Selector */}
              <div className="flex-1 lg:flex-none flex bg-white p-1 rounded-[20px] border border-slate-100 shadow-sm ring-1 ring-white h-10 md:h-auto justify-center items-center">
                  <button 
                      onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                      className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-2 md:px-4 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center min-w-[130px] md:min-w-[170px]">
                      <span className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
                          <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {weekDisplayRange}
                          <button 
                              onClick={() => setIsDayConfigModalOpen(true)}
                              className="ml-1 p-0.5 hover:text-indigo-800 transition-colors"
                              title="Atur Hari Kerja"
                          >
                              <Settings2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          </button>
                      </span>
                      <span className="text-[6.5px] md:text-[7px] text-indigo-300 mt-0.5 opacity-80 uppercase tracking-widest font-black">
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

              {/* READ-ONLY */}
              <div className="px-3 md:px-6 py-2 md:py-2.5 font-black text-[8px] md:text-[10px] uppercase tracking-widest rounded-xl border border-slate-100 bg-white/50 text-slate-400 shadow-sm h-10 md:h-auto flex items-center whitespace-nowrap">
                  (READ-ONLY)
              </div>
          </div>

          <div className="relative flex-1 w-full max-w-xs group hidden xl:block">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari Santri..." 
                  className="w-full pl-11 pr-4 py-2.5 text-xs font-black border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 transition-all placeholder:font-bold placeholder:text-slate-400 shadow-sm"
              />
          </div>
      </div>

      {/* Main Table Grid - PLEK KETIPLEK from WeeklyTarget.tsx */}
      <div className="bg-transparent rounded-none overflow-hidden flex flex-col">
          <div className="px-1 py-3 bg-transparent flex flex-row justify-between items-center w-full gap-2 transition-all">
              <button 
                onClick={() => setShowNisKelas(!showNisKelas)}
                className={`hidden sm:flex items-center justify-center px-3 h-8 rounded-xl transition-all text-[9.5px] font-black uppercase tracking-widest min-w-[30px] border ${showNisKelas ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100 shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                <span className="hidden sm:inline">{showNisKelas ? 'Sembunyikan Identitas' : 'Tampilkan Identitas'}</span>
                <span className="sm:hidden">IDENTITAS</span>
              </button>
              
              <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
                  <span className="flex items-center gap-1 text-[7.5px] md:text-[9px] font-black text-amber-500 uppercase tracking-tighter whitespace-nowrap"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-amber-400/50 flex items-center justify-center"><div className="w-1 h-1 bg-amber-500 rounded-full"></div></div> A: Terlampaui</span>
                  <span className="flex items-center gap-1 text-[7.5px] md:text-[9px] font-black text-emerald-600 uppercase tracking-tighter whitespace-nowrap"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-emerald-400/50 flex items-center justify-center"><div className="w-1 h-1 bg-emerald-600 rounded-full"></div></div> B: Tercapai</span>
                  <span className="flex items-center gap-1 text-[7.5px] md:text-[9px] font-black text-rose-500 uppercase tracking-tighter whitespace-nowrap"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-rose-400/50 flex items-center justify-center"><div className="w-1 h-1 bg-rose-500 rounded-full"></div></div> C: Tidak Tercapai</span>
              </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white border-2 border-slate-200 shadow-sm">
            <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40">
                    <tr className="bg-white">
                        <th rowSpan={2} className="w-[40px] md:w-[45px] min-w-[40px] md:min-w-[45px] hidden sm:table-cell sticky sm:left-0 bg-white z-50 px-1 md:px-2 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100">NO</th>
                        {showNisKelas && (
                            <th rowSpan={2} className="w-[65px] md:w-[100px] min-w-[65px] md:min-w-[100px] sticky sm:left-[45px] left-0 bg-white z-50 px-1 md:px-3 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 animate-in slide-in-from-left-1 duration-300">NIS</th>
                        )}
                        <th rowSpan={2} className={`w-[115px] md:w-[200px] min-w-[115px] md:min-w-[200px] sticky ${showNisKelas ? 'sm:left-[145px] left-[65px]' : 'sm:left-[45px] left-0'} bg-white z-50 px-2 md:px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-left border-b-2 border-r-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-all duration-300`}>NAMA SANTRI</th>
                        
                        <th colSpan={2} className="px-4 py-3 text-[9.5px] font-black text-emerald-700 uppercase tracking-[0.1em] border-b-2 border-r-2 border-slate-100 bg-emerald-50/80 shadow-inner">HAFALAN SAAT INI</th>
                        <th colSpan={3} className="px-4 py-3 text-[9.5px] font-black text-blue-700 uppercase tracking-[0.1em] border-b-2 border-r-2 border-slate-100 bg-blue-50/80 shadow-inner">ATM (ACUAN SETORAN)</th>
                        <th colSpan={6} className="px-4 py-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center border-b-2 border-slate-100 bg-emerald-50/50">TARGET PEKANAN</th>
                    </tr>
                    <tr className="bg-white">
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[60px]">JUZ</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[70px]">HAL</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[70px]">MANZIL</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[60px]">/HARI</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-blue-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[70px]">SABQI</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[160px]">MANZIL (HAL/JUZ)</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[40px]">KET</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[160px]">SABQI (HAL)</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[40px]">KET</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[160px]">SABAQ (BARIS)</th>
                        <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-slate-100 bg-white min-w-[40px]">KET</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                        <tr>
                            <td colSpan={20} className="py-24 text-center border-b border-slate-100">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data tidak ditemukan</p>
                            </td>
                        </tr>
                    ) : paginatedStudents.map((s, idx) => {
                        const target = targets[s.id] || {} as TargetRow;
                        const actualIdx = ((currentPage - 1) * itemsPerPage) + idx + 1;

                        return (
                            <tr key={s.id} className="group transition-colors hover:bg-slate-50/30">
                                <td className="hidden sm:table-cell sticky sm:left-0 bg-white px-1 md:px-3 py-4 text-[10px] md:text-[10.5px] font-black text-slate-400 text-center border-r-2 border-b border-slate-100 z-20 transition-colors uppercase w-[40px] md:w-[45px]">{actualIdx}</td>
                                {showNisKelas && (
                                    <td className="sticky sm:left-[45px] left-0 bg-white px-1 md:px-3 py-4 text-[9.5px] md:text-[10.5px] font-black text-slate-500 text-center border-r-2 border-b border-slate-100 z-20 transition-all duration-300 w-[65px] md:w-[100px] tracking-tighter">{target.nis}</td>
                                )}
                                <td className={`sticky ${showNisKelas ? 'sm:left-[145px] left-[65px]' : 'sm:left-[45px] left-0'} bg-white px-2 md:px-4 py-4 text-[10.5px] md:text-[11px] font-bold text-slate-800 border-r-2 border-b border-slate-100 z-20 transition-all duration-300 truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[115px] md:w-[200px]`}>{target.name}</td>
                                
                                <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-emerald-50/10">
                                    <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.hafalanJuz ? 'text-emerald-700' : 'text-emerald-200'}`}>{target.hafalanJuz || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r-2 border-b border-slate-100 text-center bg-emerald-50/10">
                                    <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.hafalanHal ? 'text-emerald-700' : 'text-emerald-200'}`}>{target.hafalanHal || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-blue-50/10">
                                    <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.manzilAtm ? 'text-blue-700' : 'text-blue-200'}`}>{target.manzilAtm || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-blue-50/10">
                                    <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.hariAtm ? 'text-blue-700' : 'text-blue-200'}`}>{target.hariAtm || '-'}</div>
                                </td>
                                <td className="px-1 py-1.5 border-r-2 border-b border-slate-100 text-center bg-blue-50/10">
                                    <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.sabqiAtm ? 'text-blue-600' : 'text-blue-200'}`}>{target.sabqiAtm || '-'}</div>
                                </td>

                                <td className="px-1.5 py-1.5 border-r border-b border-slate-100 bg-emerald-50/5">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800">{target.manzilTarget || '-'}</div>
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-2 h-9 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700">{target.manzilHal || '0'}</span>
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase ml-1">Hal</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-r-2 border-b border-slate-100 bg-emerald-50/5 text-center">
                                    <div className={`w-9 h-9 mx-auto flex items-center justify-center text-[11px] font-black rounded-lg border border-slate-100 bg-white shadow-sm ${
                                        target.manzilKet === 'A' ? 'text-amber-500' : 
                                        target.manzilKet === 'C' ? 'text-rose-500' : 
                                        'text-emerald-600'
                                    }`}>{target.manzilKet || '-'}</div>
                                </td>

                                <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-emerald-50/5 h-10">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800">{target.sabqiTargetSurat || '-'}</div>
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-2 h-9 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700">{target.sabqiTarget || '0'}</span>
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase ml-1">Hal</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-r-2 border-b border-slate-100 bg-emerald-50/5 text-center">
                                    <div className={`w-9 h-9 mx-auto flex items-center justify-center text-[11px] font-black rounded-lg border border-slate-100 bg-white shadow-sm ${
                                        target.sabqiKet === 'A' ? 'text-amber-500' : 
                                        target.sabqiKet === 'C' ? 'text-rose-500' : 
                                        'text-emerald-600'
                                    }`}>{target.sabqiKet || '-'}</div>
                                </td>

                                <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-emerald-50/5 h-10">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800">{target.sabaqTargetSurat || '-'}</div>
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-2 h-9 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700">{target.sabaqTarget || '0'}</span>
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase ml-1">Baris</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-b border-slate-100 bg-emerald-50/5 text-center">
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
          
          <div className="bg-[#F8FAFC] border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-lg">
              <div className="flex items-center gap-2 md:gap-4">
                  {/* Legend inside the bar (Desktop Only) */}
                  <div className="hidden xl:flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-6 mr-2">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]"></div> MANZIL</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div> SABQI</div>
                  </div>

                  <select 
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-white border-2 border-slate-100 rounded-xl px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-sm transition-all"
                  >
                      {[10, 25, 50, 100].map(val => (
                          <option key={val} value={val}>{val}</option>
                      ))}
                  </select>
                  <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                      <span className="hidden sm:inline">DATA</span> {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, filteredStudents.length)} <span className="hidden sm:inline text-slate-300">/</span> <span className="text-primary-600 ml-0.5">{filteredStudents.length}</span>
                  </p>
              </div>

              <div className="flex items-center gap-0.5 md:gap-1">
                  <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                  >
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
                  </button>
                  
                  <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                      {[...Array(totalPages)].map((_, i) => {
                          const pNum = i + 1;
                          if (totalPages > 5) {
                              if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                                  if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[8px] md:text-[10px] font-black">..</span>;
                                  return null;
                              }
                          }
                          
                          return (
                              <button 
                                  key={pNum}
                                  onClick={() => setCurrentPage(pNum)}
                                  className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 border-2 border-primary-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                >
                                  {pNum}
                              </button>
                          );
                      })}
                  </div>

                  <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                  >
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
              </div>
          </div>
      </div>

      {/* Day Config Modal */}
      {isDayConfigModalOpen && (
          <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16 pb-16"
              onClick={() => setIsDayConfigModalOpen(false)}
          >
              <div 
                  className="bg-white rounded-[24px] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                      <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                              <h3 className="text-[11px] font-black text-slate-800 tracking-tight uppercase">Hari Kerja Pekanan</h3>
                              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Tentukan hari aktif sekolah</p>
                          </div>
                      </div>
                      <button onClick={() => setIsDayConfigModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"> <X className="w-3.5 h-3.5 text-slate-400" /> </button>
                  </div>
                  
                  <div className="p-5 space-y-3">
                      <div className="grid grid-cols-1 gap-1.5">
                          {[
                              { id: 1, label: 'Senin' },
                              { id: 2, label: 'Selasa' },
                              { id: 3, label: 'Rabu' },
                              { id: 4, label: 'Kamis' },
                              { id: 5, label: 'Jumat' },
                              { id: 6, label: 'Sabtu' },
                              { id: 0, label: 'Minggu' }
                          ].map((day) => {
                              const isActive = activeDays.includes(day.id);
                              return (
                                  <button
                                      key={day.id}
                                      onClick={() => {
                                          if (isActive) {
                                              if (activeDays.length > 1) {
                                                  setActiveDays(activeDays.filter(d => d !== day.id));
                                              }
                                          } else {
                                              setActiveDays([...activeDays, day.id].sort());
                                          }
                                      }}
                                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                          isActive 
                                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' 
                                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                      }`}
                                  >
                                      <span className="text-[10px] font-black uppercase tracking-widest">{day.label}</span>
                                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                          isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'
                                      }`}>
                                          {isActive && <Check className="w-2.5 h-2.5" />}
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                      
                      <div className="pt-2 flex gap-3">
                          <button
                              onClick={async () => {
                                  if (!tenantId) return;
                                  setIsSavingCycle(true);
                                  try {
                                      const tenant = await getTenant(tenantId);
                                      if (tenant) {
                                          const cycle_config = tenant.cycle_config || {};
                                          cycle_config.activeDays = activeDays;
                                          await updateTenant(tenantId, { cycle_config }, user);
                                          addNotification({ type: 'success', title: 'Berhasil', message: 'Hari kerja sekolah berhasil diperbarui.' });
                                          setIsDayConfigModalOpen(false);
                                      }
                                  } catch (err) {
                                      addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan konfigurasi.' });
                                  } finally {
                                      setIsSavingCycle(false);
                                  }
                              }}
                              disabled={isSavingCycle}
                              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                          >
                              {isSavingCycle ? 'Menyimpan...' : 'Simpan Hari Kerja'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
