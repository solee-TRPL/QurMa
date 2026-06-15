
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MemorizationRecord, MemorizationStatus, TeacherNote, UserProfile, Student, MemorizationType } from '../../types';
import { getStudentRecords, getStudentNotes, getStudents, getWeeklyMemorization, upsertWeeklyMemorization, getTenant, getWeeklyTargets } from '../../services/dataService';
import { 
    FileText, 
    Calendar, 
    TrendingUp, 
    BookOpen, 
    Clock, 
    Download,
    Filter,
    ArrowUpRight,
    Award,
    Quote,
    CheckCircle2,
    Check,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Activity,
    Users,
    Zap,
    GraduationCap,
    School,
    RotateCcw,
    Crosshair,
    Pen,
    Square,
    CheckSquare,
    X,
    Eye
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

export const StudentReports: React.FC<{ user?: UserProfile }> = ({ user }) => {
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<any>({});
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState<any>(null);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [parafLoading, setParafLoading] = useState<string | null>(null);

  // WEEKLY LOGIC — initialize from localStorage if available
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('qurma_report_week');
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      return saved;
    }
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Mon
    return d.toISOString().split('T')[0];
  });

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(selectedWeek);
    const dayCount = activeDays.length > 5 ? activeDays.length : 5; // Minimum 5 days
    for (let i = 0; i < dayCount; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [selectedWeek, activeDays]);

  // Persist selectedWeek to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('qurma_report_week', selectedWeek);
  }, [selectedWeek]);

  const currentWeekOffset = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedWeek);
    sel.setHours(0, 0, 0, 0);
    return Math.round((sel.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
  }, [selectedWeek]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
          setLoading(false);
          return;
      }

      try {
          const allStudents = await getStudents(user.tenant_id || '');
          const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents[0];
          
          if (myStudent) {
              setStudent(myStudent);
              const [recs, studentNotes, weekData, tenantData, targets] = await Promise.all([
                getStudentRecords(myStudent.id),
                getStudentNotes(myStudent.id),
                getWeeklyMemorization(myStudent.id, selectedWeek),
                getTenant(user.tenant_id || ''),
                getWeeklyTargets([myStudent.id], selectedWeek)
              ]);

              if (tenantData?.cycle_config?.activeDays) {
                  setActiveDays(tenantData.cycle_config.activeDays);
              }

              setRecords(recs);
              setNotes(studentNotes);
              setWeeklyData(weekData || {});
              setWeeklyTarget(targets.length > 0 ? targets[0].target_data : null);
          }
      } catch (e) {
          console.error("Failed to fetch report data", e);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [user, selectedWeek]);

  // Auto-verification dihapus agar paraf murni dilakukan manual oleh wali santri

  const stats = useMemo(() => {
    let sabaqCount = 0;
    let sabqiCount = 0;
    let manzilCount = 0;
    let total = 0;
    let mumtaz = 0;

    Object.values(weeklyData).forEach((day: any) => {
        Object.entries(day).forEach(([type, entry]: [string, any]) => {
            if (!entry) return;
            total++;
            if (entry.status === MemorizationStatus.LANCAR) mumtaz++;
            if (type === MemorizationType.SABAQ) sabaqCount += (entry.jumlah || 0);
            if (type === MemorizationType.SABQI) sabqiCount += (entry.jumlah || 0);
            if (type === MemorizationType.MANZIL) manzilCount += (entry.jumlah || 0);
        });
    });

    const quality = total > 0 ? Math.round((mumtaz / total) * 100) : 0;
    return { sabaqCount, sabqiCount, manzilCount, total, quality };
  }, [weeklyData]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => weekDates.includes(n.date));
  }, [notes, weekDates]);

  // Handler: simpan/toggle paraf ke weeklyData langsung saat di klik
  const handleParaf = useCallback(async (date: string, type: MemorizationType) => {
    if (!student || !user) return;
    const key = `${date}-${type}`;
    setParafLoading(key);
    try {
      // Deep copy agar tidak mereferensikan object lama di state
      const updatedData = JSON.parse(JSON.stringify(weeklyData));
      if (updatedData[date]?.[type]) {
        // Toggle nilai paraf
        const currentVal = updatedData[date][type].is_read_by_parent;
        updatedData[date][type].is_read_by_parent = !currentVal;
      }
      await upsertWeeklyMemorization(student.id, selectedWeek, updatedData, user, student.full_name);
      setWeeklyData(updatedData);
    } catch (err) {
      console.error('Gagal menyimpan paraf', err);
    } finally {
      setParafLoading(null);
    }
  }, [weeklyData, student, user, selectedWeek]);

  if (loading && !student) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4 h-full">
        <div className="w-10 h-10 border-4 border-jade-100 border-t-jade-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menyusun Laporan...</p>
    </div>
  );

  if (!student) return (
    <div className="h-[calc(100vh-140px)] flex items-center justify-center animate-fade-in">
        <EmptyState 
            message="Data Tidak Ditemukan" 
            description="Pastikan akun Anda sudah terhubung dengan profil santri yang aktif."
            icon="search"
        />
    </div>
  );

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
        case 'LANCAR': return 'bg-emerald-500';
        case 'TIDAK_LANCAR': return 'bg-amber-500';
        case 'TIDAK_SETOR': return 'bg-rose-500';
        default: return 'bg-slate-300';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in relative h-[calc(100vh-140px)] overflow-hidden">
      
      {/* LEFT SIDEBAR - NAVIGATION & INSIGHTS (ONE-SCREEN STYLE) */}
      <div className="hidden lg:flex w-64 flex-col gap-3 lg:gap-4 shrink-0 h-full overflow-hidden pt-1">

          <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Target Pekanan Chartbox */}
              <div className="flex-1 bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 shadow-none flex flex-col gap-2 animate-in slide-in-from-left duration-500 min-h-0 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50/50 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                  
                  <div className="flex items-center gap-3 shrink-0 relative z-10">
                      <div className="w-7 h-7 bg-jade-50 text-jade-700 rounded-lg flex items-center justify-center border border-jade-100">
                          <Crosshair className="w-3.5 h-3.5" />
                      </div>
                      <div>
                          <h3 className="text-[9.5px] font-black text-slate-800 uppercase tracking-widest leading-none">Target Pekanan</h3>
                          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1">Estimasi Target</p>
                      </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-1 lg:gap-1.5 py-0.5 min-h-0 relative z-10">
                      {/* Sabaq Target */}
                      <div className="p-1.5 lg:p-2 bg-slate-50/50 border-2 border-slate-100 rounded-xl group hover:bg-white hover:border-jade-200 transition-all flex-1 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SABAQ</span>
                              <span className="text-[7.5px] font-black text-jade-700 bg-white px-2 py-0.5 rounded-lg border-2 border-jade-100">
                                  {weeklyTarget?.sabaq_target || 0} BARIS
                              </span>
                          </div>
                          <p className="text-[8.5px] font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                              {weeklyTarget?.sabaq_target_surat || 'BELUM ADA'}
                          </p>
                      </div>

                      {/* Sabqi Target */}
                      <div className="p-1.5 lg:p-2 bg-slate-50/50 border-2 border-slate-100 rounded-xl group hover:bg-white hover:border-emerald-200 transition-all flex-1 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SABQI</span>
                              <span className="text-[7.5px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border-2 border-emerald-100">
                                  {weeklyTarget?.sabqi_target || 0} HALAMAN
                              </span>
                          </div>
                          <p className="text-[8.5px] font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                              {weeklyTarget?.sabqi_target_surat || 'BELUM ADA'}
                          </p>
                      </div>

                      {/* Manzil Target */}
                      <div className="p-1.5 lg:p-2 bg-slate-50/50 border-2 border-slate-100 rounded-xl group hover:bg-white hover:border-amber-200 transition-all flex-1 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">MANZIL</span>
                              <span className="text-[7.5px] font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg border-2 border-amber-100">
                                  {weeklyTarget?.manzil_hal || 0} HALAMAN
                              </span>
                          </div>
                          <p className="text-[8.5px] font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                              {weeklyTarget?.manzil_target || 'BELUM ADA'}
                          </p>
                      </div>
                  </div>
              </div>

              {/* Achievement Summary Chartbox */}
              <div className="flex-1 bg-jade-600 rounded-xl p-3 lg:p-4 border-2 border-jade-700 shadow-none flex flex-col gap-2 animate-in slide-in-from-left duration-700 min-h-0 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
                  
                  <div className="flex items-center gap-3 shrink-0 relative z-10">
                      <div className="w-7 h-7 bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/20">
                          <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                          <h3 className="text-[9.5px] font-black text-white uppercase tracking-widest leading-none">Capaian Pekan Ini</h3>
                          <p className="text-[7.5px] font-black text-jade-200 uppercase tracking-widest mt-1">Total Setoran</p>
                      </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1 min-h-0 relative z-10">
                      <div className="flex items-center justify-between p-2.5 bg-jade-700/30 rounded-xl border-2 border-jade-500/50 flex-1 mb-2">
                          <span className="text-[7.5px] font-black text-jade-100 uppercase tracking-widest">SABAQ</span>
                          <span className="text-[11px] font-black text-white">{stats.sabaqCount} <span className="text-[7px] opacity-60">BARIS</span></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-jade-700/30 rounded-xl border-2 border-jade-500/50 flex-1 mb-2">
                          <span className="text-[7.5px] font-black text-jade-100 uppercase tracking-widest">SABQI</span>
                          <span className="text-[11px] font-black text-white">{stats.sabqiCount} <span className="text-[7px] opacity-60">HALAMAN</span></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-jade-700/30 rounded-xl border-2 border-jade-500/50 flex-1">
                          <span className="text-[7.5px] font-black text-jade-100 uppercase tracking-widest">MANZIL</span>
                          <span className="text-[11px] font-black text-white">{stats.manzilCount} <span className="text-[7px] opacity-60">HALAMAN</span></span>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* MAIN CONTENT AREA - TABLE FOCUS */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full">
          
          {/* Mobile Date Selector (Visible only on mobile) */}
          <div className="lg:hidden shrink-0 bg-white border border-slate-200 rounded-3xl p-2 shadow-sm mb-4">
              <div className="flex bg-jade-600 p-1 rounded-xl shadow-none border-2 border-jade-600 w-full justify-between items-center h-10.5">
                  <button 
                      onClick={() => {
                          const d = new Date(selectedWeek);
                          d.setDate(d.getDate() - 7);
                          setSelectedWeek(d.toISOString().split('T')[0]);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white active:scale-95 shrink-0"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-2 flex flex-col items-center justify-center flex-1 relative">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-0.5 truncate w-full text-center">
                          {new Date(weekDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {new Date(weekDates[4]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[6.5px] font-bold text-white/60 uppercase tracking-[0.2em] leading-none">
                          {currentWeekOffset === 0 ? 'PEKAN INI' : 
                           currentWeekOffset === -1 ? 'PEKAN LALU' : 
                           currentWeekOffset < 0 ? `${Math.abs(currentWeekOffset)} PK LALU` : 
                           `${currentWeekOffset} PK DEPAN`}
                      </span>
                  </div>
                  <button 
                      onClick={() => {
                          const d = new Date(selectedWeek);
                          d.setDate(d.getDate() + 7);
                          setSelectedWeek(d.toISOString().split('T')[0]);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white active:scale-95 shrink-0"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {/* TABLE CONTAINER - MIRROR OF TEACHER INPUT AREA */}
              <div className="flex-1 bg-white rounded-xl border-2 border-slate-300 flex flex-col overflow-hidden shadow-none relative min-w-0">
                  
                  {/* Table Header Mirroring Teacher Style */}
                  <div className="px-4 lg:px-4 py-1 lg:py-4 border-b-2 border-slate-100 flex items-center justify-between bg-white relative z-20 shrink-0 gap-3">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-slate-100 text-jade-600">
                              <FileText className="w-4 h-4" />
                          </div>
                          <div>
                              <h3 className="text-[10px] lg:text-[11px] font-black text-slate-800 uppercase tracking-widest">{student.full_name}</h3>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">NIS: {student.nis || '-'}</p>
                          </div>
                      </div>

                      <button 
                          onClick={() => setShowTargetPanel(!showTargetPanel)}
                          className="lg:hidden w-8 h-8 rounded-xl bg-jade-50 text-jade-600 flex items-center justify-center border-2 border-jade-100 shadow-none active:scale-90 transition-all shrink-0"
                      >
                          <Crosshair className={`w-4 h-4 ${showTargetPanel ? 'animate-pulse' : ''}`} />
                      </button>

                        <div className="hidden lg:flex items-center gap-1 bg-jade-600 p-1 rounded-xl shadow-none h-10 justify-between min-w-50 border-2 border-jade-600 shrink-0">
                            <button 
                                onClick={() => {
                                    const d = new Date(selectedWeek);
                                    d.setDate(d.getDate() - 7);
                                    setSelectedWeek(d.toISOString().split('T')[0]);
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white active:scale-95 shrink-0"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <div className="px-3 flex flex-col items-center flex-1 justify-center min-w-30">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none mb-0.5 whitespace-nowrap">
                                    {new Date(weekDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()} - {new Date(weekDates[4]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()}
                                </span>
                                <span className="text-[6.5px] font-bold text-white/60 uppercase tracking-[0.2em] leading-none">
                                    {currentWeekOffset === 0 ? 'PEKAN INI' : 
                                     currentWeekOffset === -1 ? 'PEKAN LALU' : 
                                     currentWeekOffset < 0 ? `${Math.abs(currentWeekOffset)} PK LALU` : 
                                     `${currentWeekOffset} PK DEPAN`}
                                </span>
                            </div>

                            <button 
                                onClick={() => {
                                    const d = new Date(selectedWeek);
                                    d.setDate(d.getDate() + 7);
                                    setSelectedWeek(d.toISOString().split('T')[0]);
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white active:scale-95 shrink-0"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                  </div>
                      
                      {/* MOBILE TARGET MODAL */}
                      {showTargetPanel && (
                          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 lg:hidden">
                              {/* Backdrop */}
                              <div 
                                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                                  onClick={() => setShowTargetPanel(false)}
                              />
                                                           {/* Modal Card */}
                              <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                                  <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                                      <div className="flex items-center gap-3">
                                          <div>
                                              <h3 className="text-[11px] font-black uppercase">Ringkasan Target</h3>
                                              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">{student.full_name}</p>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => setShowTargetPanel(false)}
                                          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                                      >
                                          <X className="w-4 h-4" />
                                      </button>
                                  </div>

                                  <div className="p-4 space-y-5 bg-slate-50/30 overflow-y-auto max-h-[60vh]">
                                      {/* Target Section */}
                                      <div className="space-y-3">
                                          <div className="flex items-center gap-2">
                                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Pekan Ini</p>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2">
                                              <div className="p-3 bg-white rounded-xl border-2 border-slate-200 text-center flex flex-col justify-center min-13.5 shadow-none">
                                                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sabaq</p>
                                                  <p className="text-[10px] font-black text-slate-700 leading-tight">
                                                      {weeklyTarget?.sabaq_target || 0} <span className="text-[7.5px] font-bold text-slate-400 block mt-0.5">Baris</span>
                                                  </p>
                                              </div>
                                              <div className="p-3 bg-white rounded-xl border-2 border-slate-200 text-center flex flex-col justify-center min-13.5 shadow-none">
                                                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sabqi</p>
                                                  <p className="text-[10px] font-black text-slate-700 leading-tight">
                                                      {weeklyTarget?.sabqi_target || 0} <span className="text-[7.5px] font-bold text-slate-400 block mt-0.5">Halaman</span>
                                                  </p>
                                              </div>
                                              <div className="p-3 bg-white rounded-xl border-2 border-slate-200 text-center flex flex-col justify-center min-13.5 shadow-none">
                                                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manzil</p>
                                                  <p className="text-[10px] font-black text-slate-700 leading-tight">
                                                      {weeklyTarget?.manzil_target || 0} <span className="text-[7.5px] font-bold text-slate-400 block mt-0.5">Juz</span>
                                                  </p>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Achievement Section */}
                                      <div className="space-y-3">
                                          <div className="flex items-center gap-2">
                                              <p className="text-[8px] font-black text-jade-600 uppercase tracking-[0.2em]">Capaian</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                              <div className="p-3 bg-jade-50/50 rounded-xl border-2 border-jade-100 text-center relative overflow-hidden flex flex-col justify-center min-13.5">
                                                  <div className="absolute top-0 right-0 w-8 h-8 bg-jade-100/30 rounded-bl-3xl -mr-2 -mt-2" />
                                                  <p className="text-[7px] font-bold text-jade-400 uppercase tracking-widest mb-1">Sabaq</p>
                                                  <p className="text-[10px] font-black text-jade-700 leading-tight">
                                                      {stats.sabaqCount} <span className="text-[7.5px] font-bold text-jade-400 block mt-0.5">Baris</span>
                                                  </p>
                                              </div>
                                              <div className="p-3 bg-jade-50/50 rounded-xl border-2 border-jade-100 text-center relative overflow-hidden flex flex-col justify-center min-13.5">
                                                  <div className="absolute top-0 right-0 w-8 h-8 bg-jade-100/30 rounded-bl-3xl -mr-2 -mt-2" />
                                                  <p className="text-[7px] font-bold text-jade-400 uppercase tracking-widest mb-1">Sabqi</p>
                                                  <p className="text-[10px] font-black text-jade-700 leading-tight">
                                                      {stats.sabqiCount} <span className="text-[7.5px] font-bold text-jade-400 block mt-0.5">Halaman</span>
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
                                      <button 
                                          onClick={() => setShowTargetPanel(false)}
                                          className="px-6 py-2.5 bg-white text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 border-2 border-slate-300"
                                      >
                                          Tutup
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}

                  {/* High Density Table Body */}
                  <div className="hidden lg:block flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mt-px">
                      <table className="w-full border-separate border-spacing-0">
                          <thead className="sticky top-0 z-40 bg-white">
                              <tr className="bg-slate-300 backdrop-blur-sm">
                                  <th className="px-2 lg:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center lg:w-25 lg:min-w-25 w-14 min-w-14 max-w-14 sticky left-0 z-50 bg-slate-300 border-t border-b border-l border-r border-black">
                                      <span className="lg:hidden">TGL</span>
                                      <span className="hidden lg:inline">TANGGAL</span>
                                  </th>
                                  <th className="px-0 lg:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center lg:w-20 lg:min-w-20 w-15 min-w-15 max-w-15 sticky lg:left-25 left-14 z-50 bg-slate-300 border-t border-b border-r border-black shadow-none">SETORAN</th>
                                  <th className="px-4 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-25 border-t border-b border-r border-black bg-slate-300">JUMLAH</th>
                                  <th className="px-2 lg:px-6 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-r border-black bg-slate-300 whitespace-nowrap">SURAT / AYAT</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-64 border-t border-b border-r border-black bg-slate-300">KETERANGAN</th>
                                  <th className="px-3 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-22.5 min-22.5 border-t border-b border-r border-black bg-slate-300 whitespace-nowrap">PARAF WALI</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white">
                              {weekDates.map((date) => (
                                  <React.Fragment key={date}>
                                      {[MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type, tIdx) => {
                                          const rec = weeklyData[date]?.[type];
                                          const isToday = date === new Date().toISOString().split('T')[0];
                                          
                                          const getTypeLabel = (t: MemorizationType) => {
                                              switch(t) {
                                                  case MemorizationType.SABAQ: return 'SABAQ';
                                                  case MemorizationType.SABQI: return 'SABQI';
                                                  case MemorizationType.MANZIL: return 'MANZIL';
                                                  default: return '';
                                              }
                                          };

                                          return (
                                              <tr 
                                                key={`${date}-${type}`} 
                                                data-date={date}
                                                className={`${isToday ? 'bg-emerald-50/10' : 'hover:bg-slate-50/50'} transition-colors ${tIdx === 0 ? 'report-date-row' : ''}`}
                                               >
                                                  {tIdx === 0 && (
                                                      <td rowSpan={3} className={`px-1 lg:px-2 py-3 align-middle lg:w-25 lg:min-w-25 w-14 min-w-14 max-w-14 sticky left-0 z-30 border-b border-r border-slate-200 text-center transition-colors opacity-100 ${isToday ? 'bg-emerald-50' : 'bg-white'}`}>
                                                          {isToday && (
                                                              <div className="absolute top-0 bottom-0 left-0 w-0.75 bg-emerald-600 shadow-none"></div>
                                                          )}
                                                          <div className="flex flex-col items-center justify-center space-y-1 lg:space-y-1.5 text-center relative z-10 py-1 lg:py-2">
                                                              {isToday && (
                                                                  <span className="mb-1 lg:mb-2 px-2 py-0.5 bg-emerald-600 text-white text-[7px] font-black rounded-full uppercase tracking-tighter">HARI INI</span>
                                                              )}
                                                              <p className={`text-[10px] lg:text-[11px] font-black uppercase tracking-tight leading-tight ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                                  {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase()}
                                                                  <span className="lg:hidden">,</span>
                                                              </p>
                                                              
                                                              {/* MOBILE DATE FORMAT (Stack) */}
                                                              <div className="lg:hidden flex flex-col items-center -space-y-0.5">
                                                                  <p className={`text-[13px] font-black leading-none ${isToday ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                      {new Date(date).toLocaleDateString('id-ID', { day: '2-digit' })}
                                                                  </p>
                                                                  <p className={`text-[9px] font-black uppercase pt-1 tracking-tighter ${isToday ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                      {new Date(date).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}
                                                                  </p>
                                                              </div>

                                                              {/* DESKTOP DATE FORMAT (Flat) */}
                                                              <p className={`hidden lg:block text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                  {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                                                              </p>
                                                          </div>
                                                      </td>
                                                  )}
                                                  <td className={`px-1 lg:px-2 py-3 sticky lg:left-25 left-14 z-30 lg:w-20 lg:min-w-20 w-15 min-w-15 max-w-15 border-b border-r border-slate-200 text-center transition-colors shadow-none opacity-100 ${isToday ? 'bg-emerald-50' : 'bg-white'}`}>
                                                      <span className={`text-[8.5px] lg:text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                          {getTypeLabel(type)}
                                                      </span>
                                                  </td>
                                                  
                                                  {/* JUMLAH COLUMN */}
                                                  <td className={`px-4 py-3 border-b border-r border-slate-200 text-center ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                                       <div className="flex items-center justify-center gap-1.5 px-1 mx-auto">
                                                           <span className={`text-[10px] lg:text-[11px] font-black ${rec?.jumlah ? 'text-slate-800' : 'text-slate-200'}`}>
                                                               {rec?.jumlah || 0}
                                                           </span>
                                                           <span className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                                               {type === MemorizationType.SABAQ ? 'BARIS' : 'HALAMAN'}
                                                           </span>
                                                       </div>
                                                  </td>

                                                  {/* SURAT : AYAT COLUMN */}
                                                  <td className={`px-4 py-3 border-b border-r border-slate-200 ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                                      <div className="flex items-center justify-center gap-1.5 max-100 mx-auto">
                                                          <span className={`text-[9px] font-black uppercase tracking-widest truncate ${rec?.surah_name ? 'text-jade-700' : 'text-slate-400'}`}>
                                                              {rec?.surah_name || '- SURAT -'}
                                                          </span>
                                                          <span className="text-slate-400 font-black">:</span>
                                                          <span className={`text-[10px] font-black ${rec?.ayat_end ? 'text-slate-800' : 'text-slate-400'}`}>
                                                              {rec?.ayat_end || 0}
                                                          </span>
                                                      </div>
                                                  </td>

                                                  {/* KETERANGAN / STATUS */}
                                                  <td className={`px-2 lg:px-4 py-3 border-b border-r border-slate-200 ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                                       <div className="flex items-center justify-center">
                                                           {rec && rec.status && rec.status !== MemorizationStatus.EMPTY ? (
                                                               <span className={`text-[8.5px] lg:text-[9.5px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-lg border-2 ${
                                                                   rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                   [MemorizationStatus.TIDAK_LANCAR, MemorizationStatus.SAKIT, MemorizationStatus.IZIN, MemorizationStatus.ALPA].includes(rec.status) ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                   rec.status === MemorizationStatus.TIDAK_SETOR ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                   'bg-blue-50 text-blue-700 border-blue-100'
                                                               }`}>
                                                                   {rec.status?.replace('_', ' ')}
                                                               </span>
                                                           ) : (
                                                               <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest italic whitespace-nowrap opacity-40">- STATUS -</span>
                                                           )}
                                                       </div>
                                                  </td>

                                                  {/* PARAF WALI COLUMN */}
                                                  {(() => {
                                                    const rowKey = `${date}-${type}`;
                                                    const isParafed = !!rec?.is_read_by_parent;
                                                    const hasData = !!rec?.status && rec.status !== MemorizationStatus.EMPTY;
                                                    const isLoadingParaf = parafLoading === rowKey;

                                                    return (
                                                      <td className={`px-2 py-3 border-b border-r border-slate-200 text-center w-22.5 min-22.5 ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                                        {hasData ? (
                                                          <div className="flex items-center justify-center">
                                                            <button
                                                              disabled={isLoadingParaf}
                                                              onClick={() => handleParaf(date, type)}
                                                              title={isParafed ? 'Klik untuk membatalkan paraf' : 'Klik untuk memberi paraf'}
                                                              className={`relative w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                                                                isParafed
                                                                  ? 'bg-jade-500 border-jade-600 shadow-sm shadow-jade-100 hover:bg-rose-500 hover:border-rose-600'
                                                                  : 'bg-white border-slate-300 hover:border-jade-400 hover:bg-slate-50'
                                                              } ${isLoadingParaf ? 'opacity-70 cursor-wait' : 'active:scale-90'}`}
                                                            >
                                                              {isLoadingParaf ? (
                                                                <div className="w-4 h-4 border-2 border-slate-200 border-t-jade-600 rounded-full animate-spin" />
                                                              ) : isParafed ? (
                                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                                              ) : (
                                                                <div className="w-3.5 h-3.5 rounded bg-slate-200 opacity-50" />
                                                              )}
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          // Tidak ada data — kosong
                                                          <span className="text-[8px] font-black text-slate-400">—</span>
                                                        )}
                                                      </td>
                                                    );
                                                  })()}
                                              </tr>
                                          );
                                      })}
                                  </React.Fragment>
                                  ))}
                          </tbody>
                  </table>
              </div>

              {/* MOBILE VIEW - TRANSPOSED TABLE */}
              <div className="lg:hidden h-full flex-1 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory scroll-smooth" style={{ scrollPaddingLeft: "44px" }}>
                  <table className="border-separate table-fixed w-max h-full border-spacing-0">
                    <thead>
                      <tr className="snap-start">
                        <th className="sticky left-0 z-70 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                          <div className="flex flex-col items-center justify-center gap-1.5 py-2 h-full">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TGL</span>
                          </div>
                        </th>
                        {weekDates.map((date) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          const dayWidth = "calc(100vw - 80px)";
                          return (
                            <th
                              key={date}
                              colSpan={3}
                              style={{ width: dayWidth, minWidth: dayWidth, scrollSnapAlign: "start", scrollSnapStop: "always" }}
                              className={`relative px-2 py-2 text-[10px] font-black uppercase tracking-widest text-center border-b border-l border-slate-200 snap-start ${isToday ? 'bg-emerald-50/80 text-emerald-800 after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10 before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : "bg-slate-50 text-slate-500"}`}
                            >
                              {isToday && (
                                <div className="absolute top-1 left-1/2 -translate-x-1/2">
                                  <span className="bg-emerald-500 text-white text-[6px] px-1.5 py-0.5 rounded-full shadow-sm shadow-emerald-500/20">HARI INI</span>
                                </div>
                              )}
                              <div className={isToday ? "mt-3" : ""}>
                                {new Date(date).toLocaleDateString("id-ID", { weekday: "short" })}
                                <span className={`block text-[7px] font-bold leading-none mt-0.5 ${isToday ? "text-emerald-600" : "opacity-60"}`}>{new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                      <tr className="snap-start">
                        <th className="sticky left-0 z-70 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                          <div className="flex items-center justify-center h-full w-full py-2">
                            <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">SETORAN</span>
                          </div>
                        </th>
                        {weekDates.map((date) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                            const colWidth = "calc((100vw - 80px) / 3)";
                            return (
                              <th
                                key={`${date}-${type}`}
                                style={{ width: colWidth, minWidth: colWidth }}
                                className={`px-1 py-1 text-[8px] font-black uppercase tracking-tighter text-center border-b border-l border-slate-200 ${isToday ? "bg-emerald-50/80 text-emerald-700" : "bg-white text-slate-400"} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                              >
                                {type === MemorizationType.SABAQ ? "Sabaq" : type === MemorizationType.SABQI ? "Sabqi" : "Manzil"}
                              </th>
                            );
                          });
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* JUMLAH ROW */}
                      <tr className="hover:bg-slate-50/30 snap-start">
                        <th className="sticky left-0 z-50 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                          <div className="flex items-center justify-center h-full w-full py-2">
                            <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">JUMLAH</span>
                          </div>
                        </th>
                        {weekDates.map((date) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                            const rec = weeklyData[date]?.[type];
                            const colWidth = "calc((100vw - 80px) / 3)";
                            return (
                              <td
                                key={`${date}-${type}-jumlah`}
                                style={{ width: colWidth, minWidth: colWidth }}
                                className={`p-1 border-b border-l border-slate-100 ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-[10px] font-black ${rec?.jumlah ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {rec?.jumlah || 0}
                                  </span>
                                  <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    {type === MemorizationType.SABAQ ? 'Brs' : 'Hal'}
                                  </span>
                                </div>
                              </td>
                            );
                          });
                        })}
                      </tr>
                      {/* SURAT/AYAT ROW */}
                      <tr className="hover:bg-slate-50/30 snap-start">
                        <th className="sticky left-0 z-50 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                          <div className="flex items-center justify-center h-full w-full py-4">
                            <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">SURAT/AYAT</span>
                          </div>
                        </th>
                        {weekDates.map((date) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                            const rec = weeklyData[date]?.[type];
                            const colWidth = "calc((100vw - 80px) / 3)";
                            return (
                              <td
                                key={`${date}-${type}-surah`}
                                style={{ width: colWidth, minWidth: colWidth }}
                                className={`p-1 border-b border-l border-slate-100 ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                              >
                                <div className="flex flex-col items-center justify-center gap-0.5 text-center">
                                  <span className={`text-[8px] font-black uppercase tracking-widest truncate max-w-full px-1 ${rec?.surah_name ? 'text-jade-700' : 'text-slate-400'}`}>
                                    {rec?.surah_name || '-'} : {rec?.ayat_end || 0}
                                  </span>
                                  {/* {rec?.surah_name && (
                                    <span className={`text-[9px] font-black ${rec?.ayat_end ? 'text-slate-800' : 'text-slate-200'}`}>
                                      
                                    </span>
                                  )} */}
                                </div>
                              </td>
                            );
                          });
                        })}
                      </tr>
                      {/* KET ROW */}
                      <tr className="hover:bg-slate-50/30 snap-start">
                        <th className="sticky left-0 z-50 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                          <div className="flex items-center justify-center h-full w-full py-2">
                            <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">KET</span>
                          </div>
                        </th>
                        {weekDates.map((date) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                            const rec = weeklyData[date]?.[type];
                            const colWidth = "calc((100vw - 80px) / 3)";
                            return (
                              <td
                                key={`${date}-${type}-ket`}
                                style={{ width: colWidth, minWidth: colWidth }}
                                className={`p-1 border-b border-l border-slate-100 text-center ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                              >
                                {rec && rec.status && rec.status !== 'HAFALAN AWAL' && rec.status !== 'EMPTY' ? (
                                  <span className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap px-2 py-1 rounded-lg border-2 ${
                                      rec.status === 'LANCAR' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      ['TIDAK_LANCAR', 'SAKIT', 'IZIN', 'ALPA'].includes(rec.status) ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      rec.status === 'TIDAK_SETOR' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                      'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}>
                                      {rec.status.replace('_', ' ')}
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-black text-slate-400">—</span>
                                )}
                              </td>
                            );
                          });
                        })}
                      </tr>
                      {/* PARAF ROW */}
                      <tr className="hover:bg-slate-50/30 snap-start">
                        <th className="sticky left-0 z-50 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                          <div className="flex items-center justify-center h-full w-full py-2">
                            <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">PARAF</span>
                          </div>
                        </th>
                        {weekDates.map((date) => {
                          const isToday = date === new Date().toISOString().split('T')[0];
                          return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                            const rec = weeklyData[date]?.[type];
                            const isCompletable = rec && rec.status && rec.status !== 'EMPTY';
                            const isLoading = parafLoading === `${date}-${type}`;
                            const isRead = rec?.is_read_by_parent;
                            const colWidth = "calc((100vw - 80px) / 3)";
                            return (
                              <td
                                key={`${date}-${type}-paraf`}
                                style={{ width: colWidth, minWidth: colWidth }}
                                className={`p-1 border-b border-l border-slate-100 text-center ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                              >
                                {isCompletable ? (
                                  <button 
                                      onClick={() => handleParaf(date, type)}
                                      disabled={isLoading}
                                      title={isRead ? 'Klik untuk membatalkan paraf' : 'Klik untuk memberi paraf'}
                                      className={`mx-auto relative w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${
                                          isRead 
                                          ? 'bg-jade-500 border-jade-600 shadow-sm shadow-jade-100 hover:bg-rose-500 hover:border-rose-600' 
                                          : 'bg-white border-slate-300 hover:border-jade-400 hover:bg-slate-50'
                                      } ${isLoading ? 'opacity-70 cursor-wait' : 'active:scale-90'}`}
                                  >
                                      {isLoading ? (
                                          <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-jade-600 rounded-full animate-spin"></div>
                                      ) : isRead ? (
                                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                      ) : (
                                          <div className="w-3 h-3 rounded-sm bg-slate-200 opacity-50" />
                                      )}
                                  </button>
                                ) : (
                                  <span className="text-[8px] font-black text-slate-400">—</span>
                                )}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
    </div>
  );
};