import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Student, Halaqah, Class, WeeklyTarget as WeeklyTargetType } from '../../types';
import { 
    getHalaqahs, 
    getStudents, 
    getClasses, 
    getWeeklyTargets, 
    upsertWeeklyTarget, 
    getWeeklyAllTypeTotals,
    updateStudent 
} from '../../services/dataService';
import { 
  ClipboardList, 
  Calendar, 
  Search, 
  Save, 
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
  HelpCircle,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../lib/NotificationContext';
import { useLoading } from '../../lib/LoadingContext';

interface WeeklyTargetProps {
  user: UserProfile;
  onSetUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>;
  saveTrigger?: number;
  onSaveSuccess?: () => void;
  isGlobalModalOpen?: boolean;
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

export const WeeklyTarget: React.FC<WeeklyTargetProps> = ({ user, onSetUnsavedChanges, saveTrigger, onSaveSuccess, isGlobalModalOpen }) => {
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  // Protect navigation
  useEffect(() => {
    if (onSetUnsavedChanges) onSetUnsavedChanges(isDirty);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, onSetUnsavedChanges]);
  
  const [myHalaqah, setMyHalaqah] = useState<Halaqah | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showNisKelas, setShowNisKelas] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [weeklyActualTotals, setWeeklyActualTotals] = useState<Record<string, { sabaq: number, sabqi: number, manzil: number }>>({});
  
  const [currentWeekOffset, setCurrentWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('weekOffset') || '0');
  });

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
        dates.push(getLocalDateString(current));
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

  const [startDate, setStartDate] = useState(weekDates[0]);
  const [endDate, setEndDate] = useState(weekDates[4]);

  useEffect(() => {
    setStartDate(weekDates[0]);
    setEndDate(weekDates[4]);
  }, [weekDates]);


  useEffect(() => { 
    // Sync URL when week offset changes
    const url = new URL(window.location.href);
    url.searchParams.set('weekOffset', currentWeekOffset.toString());
    window.history.replaceState({}, '', url.toString());

    fetchData(); 
  }, [user.id, weekDates, currentWeekOffset]);

  // ATM Calculation Helpers
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
    setLoading(true);
    try {
        const [halaqahData, studentData, classData] = await Promise.all([
            getHalaqahs(user.tenant_id!),
            getStudents(user.tenant_id!),
            getClasses(user.tenant_id!)
        ]);

        const filteredHalaqah = halaqahData.find(h => h.teacher_id === user.id);
        const classMap = new Map(classData.map(c => [c.id, c.name]));
        
        setMyHalaqah(filteredHalaqah || null);

        if (filteredHalaqah) {
            const hStudents = studentData.filter(s => s.halaqah_id === filteredHalaqah.id);
            setStudents(hStudents);
            
            // NEW: Fetch existing targets AND actual weekly totals for this week
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
            setIsDirty(false);
        }
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memuat data.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const handleInputChange = (studentId: string, field: keyof TargetRow, value: string) => {
    setIsDirty(true);
    setTargets(prev => {
        const studentTargets = { ...prev[studentId], [field]: value };

        // 1. Automation Triggered by Hafalan Juz
        if (field === 'hafalanJuz') {
            const juzVal = parseInt(value || '0');
            const atm = calculateManzilAtm(juzVal);
            const days = calculateHariAtm(juzVal, atm);
            
            studentTargets.manzilAtm = atm > 0 ? atm.toString() : '';
            studentTargets.hariAtm = days > 0 ? days.toString() : '';
        }

        // 2. Automation Triggered by Hafalan Hal (Pages)
        if (field === 'hafalanHal') {
            const halVal = parseInt(value || '0');
            studentTargets.sabqiAtm = calculateSabqiAtm(halVal);
        }

        // 3. Automation Triggered by Targets
        if (field === 'sabaqTarget') {
            const targetVal = parseInt(value || '0');
            const achievedTotal = weeklyActualTotals[studentId]?.sabaq || 0;
            studentTargets.sabaqKet = calculateABCStatus(achievedTotal, targetVal);
        }
        if (field === 'sabqiTarget') {
            const targetVal = parseInt(value || '0');
            const achievedTotal = weeklyActualTotals[studentId]?.sabqi || 0;
            studentTargets.sabqiKet = calculateABCStatus(achievedTotal, targetVal);
        }
        if (field === 'manzilHal') {
            const targetVal = parseInt(value || '0');
            const achievedTotal = weeklyActualTotals[studentId]?.manzil || 0;
            studentTargets.manzilKet = calculateABCStatus(achievedTotal, targetVal);
        }

        return { ...prev, [studentId]: studentTargets };
    });
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const handleSave = async (isSilent: boolean = false) => {
    setGlobalLoading(true);
    try {
        const updatePromises = Object.values(targets).map(async (target) => {
            const juzVal = parseInt(target.hafalanJuz);
            const halVal = parseInt(target.hafalanHal);
            
            // 1. Update Student Current Progress
            const studentUpdates: any = { id: target.studentId };
            // Save as 0 even if visually empty or typed as 0
            studentUpdates.current_juz = isNaN(juzVal) ? 0 : juzVal;
            studentUpdates.current_page = isNaN(halVal) ? 0 : halVal;

            await updateStudent(studentUpdates, user);

            // 2. Upsert Weekly Target using JSONB target_data
            const targetPayload: WeeklyTargetType = {
                student_id: target.studentId,
                week_start: weekDates[0],
                target_data: {
                    css: target.css,
                    manzil_target: target.manzilTarget,
                    manzil_hal: target.manzilHal ? parseInt(target.manzilHal) : (target.manzilHal === '0' ? 0 : undefined),
                    manzil_ket: target.manzilKet as any,
                    sabqi_target: target.sabqiTarget ? parseInt(target.sabqiTarget) : (target.sabqiTarget === '0' ? 0 : undefined),
                    sabqi_target_surat: target.sabqiTargetSurat,
                    sabqi_ket: target.sabqiKet as any,
                    sabaq_target: target.sabaqTarget ? parseInt(target.sabaqTarget) : (target.sabaqTarget === '0' ? 0 : undefined),
                    sabaq_target_surat: target.sabaqTargetSurat,
                    sabaq_ket: target.sabaqKet as any,
                    current_juz: isNaN(juzVal) ? 0 : juzVal,
                    current_page: isNaN(halVal) ? 0 : halVal
                }
            };

            return upsertWeeklyTarget(targetPayload, user, target.name);
        });

        await Promise.all(updatePromises);
        
        if (!isSilent) {
          addNotification({ 
              type: 'success', 
              title: 'Berhasil', 
              message: 'Laporan target pekanan telah disimpan dan data santri diperbarui.' 
          });
        }
        
        await fetchData(); // Refresh local data from DB
        setIsDirty(false);
    } catch (error) {
        console.error("Failed to save targets:", error);
        addNotification({ 
            type: 'error', 
            title: 'Gagal', 
            message: 'Terjadi kesalahan saat menyimpan data.' 
        });
    } finally {
        setGlobalLoading(false);
    }
  };

  // Add effect to handle save trigger from parent
  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
        handleSave(true).then(() => {
            if (onSaveSuccess) onSaveSuccess();
        }).catch(() => {
            console.error("Auto-save failed during navigation.");
        });
    }
  }, [saveTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-[32px] border-2 border-slate-50 shadow-sm animate-fade-in">
        <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-[0.3em]">Memuat Data Target</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Utility Strip */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-100/30 p-2 rounded-[24px] border border-slate-200/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full lg:w-auto">
              <div className="flex bg-white p-1 rounded-[20px] border border-slate-200 shadow-sm ring-1 ring-white">
                  <button 
                      onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                      className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center min-w-[160px]">
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
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                      <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halaqah</p>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{myHalaqah?.name || '-'}</p>
                  </div>
              </div>

              <div className="relative flex-1 w-full max-w-xs group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari NIS atau Nama..." 
                      className="w-full pl-11 pr-4 py-2.5 text-xs font-black border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 transition-all placeholder:font-bold placeholder:text-slate-400 shadow-sm"
                  />
              </div>
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto">
              <button 
                onClick={() => addNotification({type: 'info', title: 'Reset', message: 'Form direset.'})}
                className="flex-1 lg:flex-none px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95 shadow-sm"
              >
                  RESET
              </button>
              <button 
                onClick={() => setIsInfoModalOpen(true)}
                className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
                title="Informasi Target Harian"
              >
                  <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => handleSave()}
                className="flex-1 lg:flex-none flex items-center justify-center px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:border-emerald-700 transition-all active:scale-95"
              >
                  <Save className="w-4 h-4 mr-2" />
                  SIMPAN LAPORAN
              </button>
          </div>
      </div>

      {/* Main Table Grid */}
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

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40">
                    <tr className="bg-white">
                        {/* Frozen Headers */}
                        <th rowSpan={2} className="w-[50px] min-w-[50px] sticky left-0 bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100">No</th>
                        {showNisKelas && (
                            <th rowSpan={2} className="w-[100px] min-w-[100px] sticky left-[50px] bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100 animate-in slide-in-from-left-1 duration-300">NIS</th>
                        )}
                        <th rowSpan={2} className={`w-[220px] min-w-[220px] sticky ${showNisKelas ? 'left-[150px]' : 'left-[50px]'} bg-white z-50 px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-all duration-300`}>Nama Santri</th>
                        {showNisKelas && (
                            <th rowSpan={2} className="w-[80px] min-w-[80px] sticky left-[370px] bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] animate-in slide-in-from-left-1 duration-300">Kelas</th>
                        )}
                        
                        {/* Scrollable Group Headers */}
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
                    {filteredStudents.length === 0 ? (
                        <tr>
                            <td colSpan={15} className="py-24 text-center">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data santri tidak ditemukan</p>
                            </td>
                        </tr>
                    ) : filteredStudents.map((s, idx) => {
                        const target = targets[s.id] || {
                          studentId: s.id, nis: s.nis || '-', name: s.full_name, className: '-',
                          hafalanJuz: '', hafalanHal: '', manzilAtm: '', hariAtm: '', sabqiAtm: '', css: '',
                          manzilTarget: '', manzilHal: '', manzilKet: '', sabqiTarget: '', sabqiTargetSurat: '', sabqiKet: '', sabaqTarget: '', sabaqTargetSurat: '', sabaqKet: ''
                        } as TargetRow;

                        return (
                            <tr key={s.id} className="group transition-colors">
                                {/* Frozen Body Cells */}
                                <td className="sticky left-0 bg-white px-3 py-4 text-[11px] font-bold text-slate-400 text-center border-r border-slate-50 z-20 transition-colors">{idx + 1}</td>
                                {showNisKelas && (
                                    <td className="sticky left-[50px] bg-white px-3 py-4 text-[11px] font-bold text-slate-600 text-center border-r border-slate-50 z-20 transition-all duration-300">{target.nis}</td>
                                )}
                                <td className={`sticky ${showNisKelas ? 'left-[150px]' : 'left-[50px]'} bg-white px-4 py-4 text-xs font-bold text-slate-800 border-r border-slate-100 z-20 transition-all duration-300 truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)]`}>{target.name}</td>
                                {showNisKelas && (
                                    <td className="sticky left-[370px] bg-white px-3 py-4 text-[11px] font-bold text-slate-600 text-center border-r border-slate-100 z-20 transition-all duration-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{target.className}</td>
                                )}
                                
                                {/* Scrollable Content */}
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-indigo-50/5">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="30" 
                                        value={target.hafalanJuz} 
                                        onChange={e => {
                                            let val = parseInt(e.target.value);
                                            if (isNaN(val)) handleInputChange(s.id, 'hafalanJuz', '');
                                            else {
                                                if (val < 1) val = 1;
                                                if (val > 30) val = 30;
                                                handleInputChange(s.id, 'hafalanJuz', val.toString());
                                            }
                                        }} 
                                        className="w-full text-center text-[11px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        placeholder="Juz" 
                                    />
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-indigo-50/5">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="20" 
                                        value={target.hafalanHal} 
                                        onChange={e => {
                                            let val = parseInt(e.target.value);
                                            if (isNaN(val)) handleInputChange(s.id, 'hafalanHal', '');
                                            else {
                                                if (val < 1) val = 1;
                                                if (val > 20) val = 20;
                                                handleInputChange(s.id, 'hafalanHal', val.toString());
                                            }
                                        }} 
                                        className="w-full text-center text-[11px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-1 focus:ring-indigo-300 rounded h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        placeholder="Hal" 
                                    />
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-blue-50/5">
                                    <input readOnly type="text" value={target.manzilAtm} className="w-full text-center text-[11px] font-black text-blue-600 tracking-tight bg-slate-100/30 border-none focus:ring-0 rounded h-10 cursor-default" />
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-blue-50/5">
                                    <input readOnly type="text" value={target.hariAtm} className="w-full text-center text-[11px] font-black text-blue-600 tracking-tight bg-slate-100/30 border-none focus:ring-0 rounded h-10 cursor-default" />
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-blue-50/5">
                                    <input readOnly type="text" value={target.sabqiAtm} className="w-full text-center text-[11px] font-black text-blue-600 tracking-tight bg-slate-100/30 border-none focus:ring-0 rounded h-10 cursor-default" />
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-100 text-center h-10">
                                    <input type="text" value={target.css} onChange={e => handleInputChange(s.id, 'css', e.target.value)} className="w-full text-center text-[10px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0" placeholder="%" />
                                </td>

                                <td className="px-1.5 py-1.5 border-r border-slate-50 bg-emerald-50/5">
                                    <div className="flex items-center gap-1">
                                        <input type="text" value={target.manzilTarget} onChange={e => handleInputChange(s.id, 'manzilTarget', e.target.value)} className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm focus:border-emerald-300" placeholder="[Surat]:[Ayat]" />
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-1 shadow-sm focus-within:border-emerald-300">
                                            <input 
                                                type="number" 
                                                value={target.manzilHal} 
                                                onChange={e => handleInputChange(s.id, 'manzilHal', e.target.value)} 
                                                className="w-10 text-center text-[11px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 rounded h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0" 
                                                placeholder="0"
                                            />
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase mr-1">Hal</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 bg-emerald-50/5">
                                    <select 
                                        value={target.manzilKet} 
                                        onChange={e => handleInputChange(s.id, 'manzilKet', e.target.value)} 
                                        className={`w-full h-9 text-[11px] font-black bg-white border border-slate-100 rounded-lg focus:ring-0 text-center shadow-sm appearance-none ${
                                            target.manzilKet === 'A' ? 'text-amber-500' : 
                                            target.manzilKet === 'C' ? 'text-rose-500' : 
                                            'text-emerald-600'
                                        }`}
                                    >
                                        <option value="">-</option>
                                        <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                                    </select>
                                </td>

                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-emerald-50/5 h-10">
                                    <div className="flex items-center justify-center gap-1 animate-in zoom-in-95 duration-100">
                                        <input type="text" value={target.sabqiTargetSurat} onChange={e => handleInputChange(s.id, 'sabqiTargetSurat', e.target.value)} className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm focus:border-emerald-300" placeholder="[Surat]:[Ayat]" />
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-1 shadow-sm focus-within:border-emerald-300">
                                            <input 
                                                type="number" 
                                                value={target.sabqiTarget} 
                                                onChange={e => handleInputChange(s.id, 'sabqiTarget', e.target.value)} 
                                                className="w-10 text-center text-[11px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 rounded h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0" 
                                                placeholder="0"
                                            />
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase mr-1">Hal</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 border-r border-slate-50 bg-emerald-50/5">
                                    <select 
                                        value={target.sabqiKet} 
                                        onChange={e => handleInputChange(s.id, 'sabqiKet', e.target.value)} 
                                        className={`w-full h-9 text-[11px] font-black bg-white border border-slate-100 rounded-lg focus:ring-0 text-center shadow-sm appearance-none ${
                                            target.sabqiKet === 'A' ? 'text-amber-500' : 
                                            target.sabqiKet === 'C' ? 'text-rose-500' : 
                                            'text-emerald-600'
                                        }`}
                                    >
                                        <option value="">-</option>
                                        <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                                    </select>
                                </td>

                                <td className="px-1 py-1.5 border-r border-slate-50 text-center bg-emerald-50/5 h-10">
                                    <div className="flex items-center justify-center gap-1 animate-in zoom-in-95 duration-100">
                                        <input type="text" value={target.sabaqTargetSurat} onChange={e => handleInputChange(s.id, 'sabaqTargetSurat', e.target.value)} className="w-[100px] px-2 text-[10px] font-bold bg-white border border-slate-100 rounded-lg h-9 shadow-sm focus:border-emerald-300" placeholder="[Surat]:[Ayat]" />
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg px-1 shadow-sm focus-within:border-emerald-300">
                                            <input 
                                                type="number" 
                                                value={target.sabaqTarget} 
                                                onChange={e => handleInputChange(s.id, 'sabaqTarget', e.target.value)} 
                                                className="w-10 text-center text-[11px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 rounded h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0" 
                                                placeholder="0"
                                            />
                                            <span className="text-[8px] font-extrabold text-emerald-400 uppercase mr-1">Baris</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-1 py-1.5 bg-emerald-50/5">
                                    <select 
                                        value={target.sabaqKet} 
                                        onChange={e => handleInputChange(s.id, 'sabaqKet', e.target.value)} 
                                        className={`w-full h-9 text-[11px] font-black bg-white border border-slate-100 rounded-lg focus:ring-0 text-center shadow-sm appearance-none ${
                                            target.sabaqKet === 'A' ? 'text-amber-500' : 
                                            target.sabaqKet === 'C' ? 'text-rose-500' : 
                                            'text-emerald-600'
                                        }`}
                                    >
                                        <option value="">-</option>
                                        <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                                    </select>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between lg:items-center gap-6">
              <div className="flex flex-wrap gap-x-8 gap-y-4 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Manzil ideal rotasi 15 hari</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Sabqi ideal rotasi 5 hari</div>
                  <div className="flex items-center gap-2"><Info className="w-3.5 h-3.5" /> 
                  Format Pengisian (cukup target akhir) 
                  = [Nama surat]:[Ayat](Keterangan)</div>
              </div>
              {/* <div className="flex items-center px-4 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-full">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Capaian Terurut Abjad</p>
              </div> */}
          </div>
      </div>

      {/* Info Modal */}
      {isInfoModalOpen && (
          <div 
              className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 lg:pl-64 pt-20"
              onClick={() => setIsInfoModalOpen(false)}
          >
              <div 
                  className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-200 border border-white flex flex-col max-h-[70vh]"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="p-6 overflow-y-auto scrollbar-hide">
                      <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                                  <HelpCircle className="w-4 h-4" />
                              </div>
                              <div>
                                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Informasi Target</h3>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Acuan Sabaq Harian</p>
                              </div>
                          </div>
                          <button onClick={() => setIsInfoModalOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5 text-slate-300" />
                          </button>
                      </div>

                      <div className="space-y-3.5">
                          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Kelas 1 - 2</span>
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">3 Baris</span>
                              </div>
                              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Kelas 3 - 4</span>
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">5 Baris</span>
                              </div>
                              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Kelas 5 - 6</span>
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tighter ring-1 ring-indigo-100/50">7 Baris</span>
                              </div>
                          </div>

                          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 flex items-start gap-2.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase tracking-wide opacity-80">
                                  Gunakan acuan ini sebagai standar minimal pencapaian harian santri.
                              </p>
                          </div>
                      </div>

                      <button 
                          onClick={() => setIsInfoModalOpen(false)}
                          className="w-full mt-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
                      >
                          Mengerti
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
