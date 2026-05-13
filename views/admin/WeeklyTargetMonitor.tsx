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
  Check
} from 'lucide-react';
import { useNotification } from '../../lib/NotificationContext';
import { useLoading } from '../../lib/LoadingContext';

interface WeeklyTargetMonitorProps {
  user: UserProfile;
  tenantId: string;
  showNotesMode?: boolean;
  onNavigate?: (page: any) => void;
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
  teacherNote: string;
  halaqahName: string;
}

export const WeeklyTargetMonitor: React.FC<WeeklyTargetMonitorProps> = ({ user, tenantId, showNotesMode = false, onNavigate }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();
  
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [allHalaqahs, setAllHalaqahs] = useState<Halaqah[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('halaqahId')
      || localStorage.getItem('qurma_wtm_halaqahId')
      || 'all';
  });
  const [currentHalaqah, setCurrentHalaqah] = useState<Halaqah | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showNisKelas, setShowNisKelas] = useState(false);
  const [weeklyActualTotals, setWeeklyActualTotals] = useState<Record<string, { sabaq: number, sabqi: number, manzil: number }>>({});
  const [showNotes, setShowNotes] = useState(showNotesMode);

  useEffect(() => {
    setShowNotes(showNotesMode);
  }, [showNotesMode]);
  
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri

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
    const dates: string[] = [];
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

  
  // Sync Logic: Teacher -> Halaqah
  const handleTeacherChange = (teacherId: string) => {
      setSelectedTeacherId(teacherId);
      setCurrentPage(1);
      const matchedHalaqah = allHalaqahs.find(h => h.teacher_id === teacherId);
      if (matchedHalaqah) {
          setSelectedHalaqahId(matchedHalaqah.id);
      } else {
          setSelectedHalaqahId('all');
      }
  };

  // Sync Logic: Halaqah -> Teacher
  const handleHalaqahChange = (halaqahId: string) => {
      setSelectedHalaqahId(halaqahId);
      setCurrentPage(1);
      if (halaqahId === 'all') {
          setSelectedTeacherId('all');
          return;
      }
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

  // Unified Data Fetcher
  const performDataFetch = async (hList: Halaqah[]) => {
    if (!tenantId) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    try {
        console.log("[WTM] performDataFetch started");
        const [studentData, classData] = await Promise.all([
            getStudents(tenantId),
            getClasses(tenantId)
        ]);
        
        const classMap = new Map(classData.map(c => [c.id, c.name]));
        setStudents(studentData);

        if (studentData.length > 0) {
            console.log(`[WTM] Fetching targets/totals for ${studentData.length} students`);
            try {
                const [existingTargets, weeklyTotals] = await Promise.all([
                  getWeeklyTargets(studentData.map(s => s.id), weekDates[0] || ""),
                  getWeeklyAllTypeTotals(studentData.map(s => s.id), weekDates[0] || "")
                ]);
                
                setWeeklyActualTotals(weeklyTotals);
                const targetMap = new Map(existingTargets.map(t => [t.student_id, t]));
                const initialTargets: Record<string, TargetRow> = {};

                studentData.forEach(s => {
                    const dbTarget = targetMap.get(s.id);
                    const data = dbTarget?.target_data || {};
                    const juz = data.current_juz ?? s.current_juz ?? 0;
                    const hal = data.current_page ?? s.current_page ?? 0;
                    const currentClassName = s.class_id ? classMap.get(s.class_id) || '-' : '-';

                    initialTargets[s.id] = {
                        studentId: s.id,
                        nis: s.nis || '-',
                        name: s.full_name,
                        className: currentClassName,
                        hafalanJuz: (juz && juz > 0) ? juz.toString() : '',
                        hafalanHal: (hal && hal > 0) ? hal.toString() : '',
                        manzilAtm: calculateManzilAtm(juz).toString() || '',
                        hariAtm: calculateHariAtm(juz, calculateManzilAtm(juz)).toString() || '',
                        sabqiAtm: calculateSabqiAtm(hal),
                        css: data.css || '',
                        manzilTarget: data.manzil_target || '',
                        manzilHal: data.manzil_hal?.toString() || '',
                        manzilKet: calculateABCStatus(weeklyTotals[s.id]?.manzil || 0, data.manzil_hal || 0),
                        sabqiTarget: data.sabqi_target?.toString() || '',
                        sabqiTargetSurat: data.sabqi_target_surat || '',
                        sabqiKet: calculateABCStatus(weeklyTotals[s.id]?.sabqi || 0, data.sabqi_target || 0),
                        sabaqTarget: data.sabaq_target?.toString() || '',
                        sabaqTargetSurat: data.sabaq_target_surat || '',
                        sabaqKet: calculateABCStatus(weeklyTotals[s.id]?.sabaq || 0, data.sabaq_target || 0),
                        teacherNote: data.teacher_note || '',
                        halaqahName: (() => {
                            const h = hList.find(h => h.id === s.halaqah_id);
                            if (!h) return '-';
                            return `${h.name.toUpperCase()} ( ${h.teacher_name?.toUpperCase() || '-'} )`;
                        })()
                    };
                });
                setTargets(initialTargets);
            } catch (targetError) {
                console.error("[WTM] Target fetch failed:", targetError);
            }
        } else {
            setTargets({});
        }
    } catch (error) {
        console.error("[WTM] performDataFetch error:", error);
    } finally {
        setLoading(false);
    }
  };

  // Effect 1: Initial load of static data
  useEffect(() => {
    const initStatic = async () => {
        if (!tenantId) {
            setLoading(false);
            return;
        }
        try {
            console.log("[WTM] Initializing static data with tenantId:", tenantId);
            const [allUsers, tenantData, halaqahData] = await Promise.all([
                getUsers(tenantId),
                getTenant(tenantId),
                getHalaqahs(tenantId)
            ]);

            setTeachers(allUsers);
            const enriched = halaqahData.map(h => ({
                ...h,
                teacher_name: allUsers.find(u => u.id === h.teacher_id)?.full_name || '-'
            }));
            setAllHalaqahs(enriched);
            
            if (tenantData?.cycle_config?.activeDays) {
                const newActiveDays = tenantData.cycle_config.activeDays;
                setActiveDays(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(newActiveDays)) return prev;
                    return newActiveDays;
                });
            }
            
            // Check if selectedHalaqahId is valid, else reset to all
            if (selectedHalaqahId !== 'all' && !enriched.find(h => h.id === selectedHalaqahId)) {
                setSelectedHalaqahId('all');
            }
        } catch (error) {
            console.error("[WTM] InitStatic error:", error);
            setLoading(false);
        }
    };
    initStatic();
  }, [tenantId]);

  // Effect 2: Dynamic data fetch when date range changes
  useEffect(() => {
      performDataFetch(allHalaqahs);
  }, [tenantId, weekDates[0], allHalaqahs]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredStudents = useMemo(() => {
    let result = students;
    
    // 1. Filter by Halaqah / Teacher
    if (selectedHalaqahId !== 'all') {
        result = result.filter(s => s.halaqah_id === selectedHalaqahId);
    } else if (selectedTeacherId !== 'all') {
        // If teacher is selected but halaqah is 'all', filter by all halaqahs belonging to that teacher
        const teacherHalaqahs = allHalaqahs.filter(h => h.teacher_id === selectedTeacherId).map(h => h.id);
        result = result.filter(s => teacherHalaqahs.includes(s.halaqah_id || ''));
    }

    // 2. Filter by Search Query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(s => 
            s.full_name.toLowerCase().includes(query) || 
            s.nis?.toLowerCase().includes(query)
        );
    }
    
    return result;
  }, [students, searchQuery, selectedHalaqahId, selectedTeacherId, allHalaqahs]);

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
      {/* Top Utility Strip - Rearranged for Mobile 2-Row Layout */}
      <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-4 py-2">
          {/* BARIS 1: Halaqah / Teacher Selector & Search Bar */}
          <div className="flex flex-row items-center gap-2 w-full lg:flex-1">
              {/* Halaqah Selector */}
              <div className="flex-1 lg:flex-none flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 rounded-xl border-2 border-slate-300 shadow-none lg:min-w-[340px] focus-within:ring-4 focus-within:ring-jade-50/50 focus-within:border-jade-400 transition-all h-10 lg:h-11">
                  <div className="p-1.5 bg-primary-500 rounded-lg text-white shrink-0">
                      <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <div className="flex-1 relative group/sel-unified min-w-0">
                      <p className="text-[7.5px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halaqoh / Pengampu</p>
                      <div className="relative">
                          <select 
                            value={selectedHalaqahId}
                            onChange={(e) => handleHalaqahChange(e.target.value)}
                            className="w-full bg-transparent text-[8.5px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight focus:outline-none appearance-none cursor-pointer p-0 pr-5 relative z-10 truncate"
                          >
                              <option value="all">SEMUA HALAQOH</option>
                              {allHalaqahs.map(h => (
                                  <option key={h.id} value={h.id}>
                                      {h.name.toUpperCase()} / {h.teacher_name?.toUpperCase() || '-'}
                                  </option>
                              ))}
                          </select>
                          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none z-0 group-hover/sel-unified:text-jade-400 transition-colors" />
                      </div>
                  </div>
              </div>

              {/* Search Bar (Mobile Included) */}
              <div className="relative flex-1 group h-10 lg:h-11 min-w-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-500 transition-colors" />
                  <input 
                      type="text"
                      placeholder="CARI SANTRI..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-full pl-9 pr-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[9.5px] font-black uppercase tracking-widest placeholder:text-slate-300 outline-none shadow-none"
                  />
              </div>
          </div>

          {/* BARIS 2: Date Selector & ReadOnly Label */}
          <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              {/* Date Selector */}
              <div className="flex-1 lg:flex-none flex bg-white p-1 rounded-xl border-2 border-slate-300 shadow-none h-10 lg:h-11 justify-center items-center">
                  <button 
                      onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                      className="p-1 px-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-2 md:px-4 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-jade-600 flex flex-col items-center justify-center min-w-[130px] md:min-w-[170px]">
                      <span className="flex items-center gap-1 md:gap-2 whitespace-nowrap">
                          <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {weekDisplayRange}
                      </span>
                      <span className="text-[6.5px] md:text-[7px] text-jade-300 mt-0.5 opacity-80 uppercase tracking-widest font-black">
                          {currentWeekOffset === 0 ? 'Pekan Ini' : 
                           currentWeekOffset === -1 ? 'Pekan Lalu' : 
                           currentWeekOffset === 1 ? 'Pekan Depan' : 
                           currentWeekOffset < 0 ? `${Math.abs(currentWeekOffset)} Pekan Lalu` : 
                           `${currentWeekOffset} Pekan Depan`}
                      </span>
                  </div>
                  <button 
                      onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                      className="p-1 px-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>

              {/* READ-ONLY */}
              <div className="px-3 md:px-5 py-2 font-black text-[8px] md:text-[9.5px] uppercase tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 shadow-none h-10 lg:h-11 flex items-center whitespace-nowrap">
                  (READ-ONLY)
              </div>
          </div>
      </div>

      {/* Main Table Grid - PLEK KETIPLEK from WeeklyTarget.tsx */}
      <div className="bg-transparent rounded-none overflow-hidden flex flex-col">
          <div className="px-1 py-3 bg-transparent flex flex-row justify-between items-center w-full gap-2 transition-all">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowNisKelas(!showNisKelas)}
                  className={`hidden sm:flex items-center justify-center px-3 h-8 rounded-xl transition-all text-[9.5px] font-black uppercase tracking-widest min-w-[30px] border-2 ${showNisKelas ? 'bg-jade-50/50 text-jade-600 border-jade-300 shadow-none' : 'bg-white text-slate-400 border-slate-300'}`}
                >
                  <span className="hidden sm:inline">{showNisKelas ? 'Sembunyikan Identitas' : 'Tampilkan Identitas'}</span>
                  <span className="sm:hidden">IDENTITAS</span>
                </button>
                <button 
                  onClick={() => {
                    if (onNavigate) {
                        onNavigate(showNotes ? 'weekly-target-monitor' : 'weekly-target-monitor-notes');
                    } else {
                        setShowNotes(!showNotes);
                    }
                  }}
                  className={`flex-none items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-[9.5px] font-black uppercase tracking-widest border-2 ${showNotes ? 'bg-amber-50/50 text-amber-600 border-amber-300 shadow-none' : 'bg-white text-slate-400 border-slate-300 hover:bg-slate-50'}`}
                >
                  <span>{showNotes ? 'Sembunyikan Catatan' : 'Catatan'}</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
                  <span className="flex items-center gap-1 text-[7.5px] md:text-[9px] font-black text-amber-500 uppercase tracking-tighter whitespace-nowrap"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-amber-400/50 flex items-center justify-center"><div className="w-1 h-1 bg-amber-500 rounded-full"></div></div> A: Terlampaui</span>
                  <span className="flex items-center gap-1 text-[7.5px] md:text-[9px] font-black text-emerald-600 uppercase tracking-tighter whitespace-nowrap"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-emerald-400/50 flex items-center justify-center"><div className="w-1 h-1 bg-emerald-600 rounded-full"></div></div> B: Tercapai</span>
                  <span className="flex items-center gap-1 text-[7.5px] md:text-[9px] font-black text-rose-500 uppercase tracking-tighter whitespace-nowrap"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full border-2 border-rose-400/50 flex items-center justify-center"><div className="w-1 h-1 bg-rose-500 rounded-full"></div></div> C: Tidak Tercapai</span>
              </div>
          </div>

          <div className="bg-white border-2 border-slate-300 shadow-none rounded-b-xl overflow-hidden flex flex-col">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40">
                        <tr className="bg-white">
                            <th rowSpan={2} className="w-[40px] md:w-[45px] min-w-[40px] md:min-w-[45px] hidden sm:table-cell sticky sm:left-0 bg-slate-300 z-50 px-1 md:px-2 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-l border-r border-black">NO</th>
                            {showNisKelas && (
                                <th rowSpan={2} className="w-[65px] md:w-[100px] min-w-[65px] md:min-w-[100px] sticky sm:left-[45px] left-0 bg-slate-300 z-50 px-1 md:px-3 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-r border-black animate-in slide-in-from-left-1 duration-300">NIS</th>
                            )}
                            <th rowSpan={2} className={`w-[115px] md:w-[200px] min-w-[115px] md:min-w-[200px] sticky ${showNisKelas ? 'sm:left-[145px] left-[65px]' : 'sm:left-[45px] left-0'} bg-slate-300 z-50 px-2 md:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-left border-t border-b border-r border-black transition-all duration-300`}>NAMA SANTRI</th>
                            <th rowSpan={2} className="hidden lg:table-cell px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-r border-black bg-slate-300 min-w-[180px]">HALAQOH ( PENGAMPU )</th>
                            
                            {!showNotes ? (
                              <>
                                <th colSpan={2} className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-emerald-700 uppercase tracking-[0.1em] border-t border-b border-r border-emerald-700 bg-emerald-50 shadow-inner whitespace-nowrap text-center">HAFALAN SAAT INI</th>
                                <th colSpan={3} className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-blue-700 uppercase tracking-[0.1em] border-t border-b border-r border-blue-700 bg-blue-50 shadow-inner whitespace-nowrap text-center">ATM</th>
                                <th colSpan={6} className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center border-t border-b border-r border-emerald-600 bg-emerald-50/50 whitespace-nowrap">TARGET PEKANAN</th>
                              </>
                            ) : (
                              <th className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-amber-600 uppercase tracking-widest border-t border-b border-r border-amber-600 bg-amber-50/30 text-left whitespace-nowrap">CATATAN USTADZ</th>
                            )}
                        </tr>
                    {!showNotes ? (
                        <tr className="bg-white">
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-emerald-600 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50/30 min-w-[60px]">JUZ</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-emerald-600 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50/30 min-w-[70px]">HAL</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-blue-600 uppercase text-center border-b border-r border-blue-700 bg-blue-50 min-w-[70px]">MANZIL</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-blue-600 uppercase text-center border-b border-r border-blue-700 bg-blue-50 min-w-[60px]">BERPUTAR</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-blue-600 uppercase text-center border-b border-r border-blue-700 bg-blue-50 min-w-[70px]">SABQI</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50 min-w-[160px]">MANZIL (HAL/JUZ)</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50 min-w-[40px]">KET</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50 min-w-[160px]">SABQI (HAL)</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50 min-w-[40px]">KET</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50 min-w-[160px]">SABAQ (BARIS)</th>
                            <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50 min-w-[40px]">KET</th>
                        </tr>
                    ) : (
                        <tr className="bg-white">
                            <th className="px-4 py-3 text-[8.5px] font-black text-amber-600 uppercase text-left border-b border-r border-amber-600 bg-amber-50/5">CATATAN PERKEMBANGAN HAFALAN SANTRI</th>
                        </tr>
                    )}
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
                                <td className="hidden sm:table-cell sticky sm:left-0 bg-white px-1 md:px-3 py-1.5 text-[10px] md:text-[10.5px] font-black text-slate-400 text-center border-r border-b border-slate-100 z-20 transition-colors uppercase w-[40px] md:w-[45px]">
                                    <div className="h-10 flex items-center justify-center">{actualIdx}</div>
                                </td>
                                {showNisKelas && (
                                    <td className="sticky sm:left-[45px] left-0 bg-white px-1 md:px-3 py-1.5 text-[9.5px] md:text-[10.5px] font-black text-slate-500 text-center border-r border-b border-slate-100 z-20 transition-all duration-300 w-[65px] md:w-[100px] tracking-tighter">
                                        <div className="h-10 flex items-center justify-center">{target.nis}</div>
                                    </td>
                                )}
                                <td className={`sticky ${showNisKelas ? 'sm:left-[145px] left-[65px]' : 'sm:left-[45px] left-0'} bg-white px-2 md:px-4 py-1.5 text-[10.5px] md:text-[11px] font-bold text-slate-800 border-r border-b border-slate-100 z-20 transition-all duration-300 truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-[115px] md:w-[200px]`}>
                                    <div className="h-10 flex items-center">{target.name}</div>
                                </td>
                                <td className="hidden lg:table-cell px-4 py-1.5 border-r border-b border-slate-100 text-start bg-white">
                                    <div className="h-10 flex items-center text-[10px] font-black text-slate-500 uppercase tracking-tight truncate">{target.halaqahName}</div>
                                </td>
                                
                                {!showNotes ? (
                                    <>
                                        <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-emerald-50/10">
                                            <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.hafalanJuz ? 'text-emerald-700' : 'text-emerald-200'}`}>{target.hafalanJuz || '-'}</div>
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-emerald-50/10">
                                            <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.hafalanHal ? 'text-emerald-700' : 'text-emerald-200'}`}>{target.hafalanHal || '-'}</div>
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-blue-50/10">
                                            <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.manzilAtm ? 'text-amber-500' : 'text-amber-200'}`}>{target.manzilAtm || '-'} Hlm</div>
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-blue-50/10">
                                            <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.hariAtm ? 'text-amber-500' : 'text-amber-200'}`}>{target.hariAtm || '-'} Hari</div>
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-b border-slate-100 text-center bg-blue-50/10">
                                            <div className={`w-full text-center text-[11px] font-black h-10 flex items-center justify-center ${target.sabqiAtm ? 'text-blue-600' : 'text-blue-200'}`}>{target.sabqiAtm || '-'}</div>
                                        </td>

                                        <td className="px-1.5 py-1.5 border-r border-b border-slate-100 bg-emerald-50/5">
                                            <div className="flex items-center justify-center gap-1">
                                                <div className="w-[85px] px-1 text-[8.5px] font-black bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800 whitespace-nowrap overflow-hidden tracking-tighter">{target.manzilTarget || '-'}</div>
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
                                                <div className="w-[85px] px-1 text-[8.5px] font-black bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800 whitespace-nowrap overflow-hidden tracking-tighter">{target.sabqiTargetSurat || '-'}</div>
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
                                                <div className="w-[85px] px-1 text-[8.5px] font-black bg-white border border-slate-100 rounded-lg h-9 shadow-sm flex items-center justify-center uppercase text-slate-800 whitespace-nowrap overflow-hidden tracking-tighter">{target.sabaqTargetSurat || '-'}</div>
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
                                    </>
                                ) : (
                                    <td className="px-2 lg:px-4 py-1.5 border-b border-slate-100 bg-amber-50/5">
                                        <div className="w-full h-10 px-4 py-2 text-[10.5px] font-bold text-slate-700 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center truncate">
                                            {target.teacherNote || <span className="text-slate-300 font-normal italic uppercase tracking-widest text-[9px]">Belum ada catatan dari ustadz...</span>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-xl">
              <div className="flex items-center gap-2 md:gap-4">

                  <select 
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-white border-2 border-slate-300 rounded-lg px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-none transition-all"
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
                      className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
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
                                  className={`w-7 h-7 md:w-9 md:h-9 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                >
                                  {pNum}
                              </button>
                          );
                      })}
                  </div>

                  <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
                  >
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
              </div>
          </div>
          </div>
      </div>

    </div>
  );
};
