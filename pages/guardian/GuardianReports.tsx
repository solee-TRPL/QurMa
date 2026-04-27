
import React, { useState, useEffect, useMemo } from 'react';
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
    Target
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
    const dates = [];
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
          const allStudents = await getStudents(user.tenant_id);
          const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents[0];
          
          if (myStudent) {
              setStudent(myStudent);
              const [recs, studentNotes, weekData, tenantData, targets] = await Promise.all([
                getStudentRecords(myStudent.id),
                getStudentNotes(myStudent.id),
                getWeeklyMemorization(myStudent.id, selectedWeek),
                getTenant(user.tenant_id),
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

  const [datesToVerify, setDatesToVerify] = useState<Set<string>>(new Set());

  // --- SCROLL-BASED AUTO VERIFICATION (REFINED: DETECT VISIBLE ROWS) ---
  useEffect(() => {
    if (loading || !student || !weeklyData) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            const date = entry.target.getAttribute('data-date');
            if (date) {
                setDatesToVerify(prev => {
                    if (prev.has(date)) return prev;
                    return new Set(prev).add(date);
                });
            }
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    // Observe each date's first row
    const rowElements = document.querySelectorAll('.report-date-row');
    rowElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, weeklyData, weekDates]);

  // Batch update DB every 2 seconds when user stops scrolling
  useEffect(() => {
    if (datesToVerify.size === 0 || !student || !user) return;

    const timer = setTimeout(async () => {
        const updatedData = { ...weeklyData };
        let hasChanges = false;

        Array.from(datesToVerify).forEach(date => {
            if (updatedData[date]) {
                Object.keys(updatedData[date]).forEach(type => {
                    const entry = updatedData[date][type];
                    if (entry && !entry.is_read_by_parent) {
                        updatedData[date][type].is_read_by_parent = true;
                        hasChanges = true;
                    }
                });
            }
        });

        if (hasChanges) {
            try {
                await upsertWeeklyMemorization(student.id, selectedWeek, updatedData, user, student.full_name);
                setWeeklyData(updatedData);
                // We keep the dates in the set to avoid re-triggering, 
                // but since they are now is_read_by_parent=true, they won't trigger hasChanges
            } catch (err) {
                console.error("Failed to batch update read status", err);
            }
        }
    }, 2000);

    return () => clearTimeout(timer);
  }, [datesToVerify, student, user, selectedWeek]);

  const stats = useMemo(() => {
    let sabaqCount = 0;
    let sabqiCount = 0;
    let total = 0;
    let mumtaz = 0;

    Object.values(weeklyData).forEach((day: any) => {
        Object.entries(day).forEach(([type, entry]: [string, any]) => {
            if (!entry) return;
            total++;
            if (entry.status === MemorizationStatus.LANCAR) mumtaz++;
            if (type === MemorizationType.SABAQ) sabaqCount += (entry.jumlah || 0);
            if (type === MemorizationType.SABQI) sabqiCount += (entry.jumlah || 0);
        });
    });

    const quality = total > 0 ? Math.round((mumtaz / total) * 100) : 0;
    return { sabaqCount, sabqiCount, total, quality };
  }, [weeklyData]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => weekDates.includes(n.date));
  }, [notes, weekDates]);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
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
      <div className="hidden lg:flex w-64 flex-col gap-5 shrink-0 h-full overflow-hidden">
          {/* Date Selector Pill */}
          <div className="flex bg-white items-center justify-between p-1 rounded-full border border-slate-200 shadow-sm ring-1 ring-white h-[56px] w-full shrink-0">
              <button 
                  onClick={() => {
                      const d = new Date(selectedWeek);
                      d.setDate(d.getDate() - 7);
                      setSelectedWeek(d.toISOString().split('T')[0]);
                  }}
                  className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400 active:scale-95"
              >
                  <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col items-center justify-center flex-1 px-1">
                   <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tight leading-none whitespace-nowrap">
                       {new Date(weekDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()} - {new Date(weekDates[4]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()}
                   </span>
                   <span className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mt-1">
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
                  className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400 active:scale-95"
              >
                  <ChevronRight className="w-4 h-4" />
              </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Target Pekanan Chartbox */}
              <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm flex flex-col gap-4 animate-in slide-in-from-left duration-500">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                          <Target className="w-4 h-4" />
                      </div>
                      <div>
                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Target Pekanan</h3>
                          <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Disusun Oleh Ustadz</p>
                      </div>
                  </div>

                  <div className="space-y-3">
                      {/* Sabaq Target */}
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sabaq</span>
                              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                  {weeklyTarget?.sabaq_target || 0} Baris
                              </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                              {weeklyTarget?.sabaq_target_surat || '-'}
                          </p>
                      </div>

                      {/* Sabqi Target */}
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sabqi</span>
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                  {weeklyTarget?.sabqi_target || 0} Hal
                              </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                              {weeklyTarget?.sabqi_target_surat || '-'}
                          </p>
                      </div>

                      {/* Manzil Target */}
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Manzil</span>
                              <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                  {weeklyTarget?.manzil_hal || 0} Hal
                              </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                              {weeklyTarget?.manzil_target || '-'}
                          </p>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* MAIN CONTENT AREA - TABLE FOCUS */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full">
          
          {/* Mobile Date Selector (Visible only on mobile) */}
          <div className="lg:hidden shrink-0 bg-white border border-slate-200 rounded-[24px] p-2 shadow-sm mb-4">
              <div className="flex bg-white p-1 rounded-[18px] border border-slate-100 shadow-sm ring-1 ring-white w-full justify-between items-center h-[44px]">
                  <button 
                      onClick={() => {
                          const d = new Date(selectedWeek);
                          d.setDate(d.getDate() - 7);
                          setSelectedWeek(d.toISOString().split('T')[0]);
                      }}
                      className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 active:scale-95"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-2 py-1 text-[9.5px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center flex-1">
                      <span className="flex items-center gap-2 whitespace-nowrap leading-none truncate w-full justify-center">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {new Date(weekDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {new Date(weekDates[4]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                  </div>
                  <button 
                      onClick={() => {
                          const d = new Date(selectedWeek);
                          d.setDate(d.getDate() + 7);
                          setSelectedWeek(d.toISOString().split('T')[0]);
                      }}
                      className="p-1 px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 active:scale-95"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {/* TABLE CONTAINER - MIRROR OF TEACHER INPUT AREA */}
              <div className="flex-1 bg-white rounded-t-[32px] border border-slate-200 flex flex-col overflow-hidden shadow-sm relative min-w-0">
                  
                  {/* Table Header Mirroring Teacher Style */}
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between bg-white relative z-20 gap-3 lg:gap-0 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm text-indigo-500">
                              <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div>
                              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{student.full_name}</h3>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">NIS: {student.nis || '-'}</p>
                          </div>
                      </div>
                      <div className="hidden lg:flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                              <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Mutaba'ah Hafalan</p>
                          </div>
                      </div>
                  </div>

                  {/* High Density Table Body */}
                  <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mt-[1px]">
                      <table className="w-full border-collapse">
                          <thead className="sticky top-0 z-40 bg-white">
                              <tr className="shadow-[0_1px_0_0_rgba(226,232,240,1)] bg-slate-50">
                                  <th className="px-2 lg:px-4 py-4 text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center lg:w-[100px] lg:min-w-[100px] w-[70px] min-w-[70px] sticky left-0 z-50 bg-slate-50 border-r border-slate-200 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-200">TANGGAL</th>
                                  <th className="px-2 lg:px-4 py-4 text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center lg:w-[80px] lg:min-w-[80px] w-[60px] min-w-[60px] sticky lg:left-[100px] left-[70px] z-50 bg-slate-50 border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.05)] after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-300">SETORAN</th>
                                  <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-[100px] border-r border-slate-200 bg-slate-50">JUMLAH</th>
                                  <th className="px-2 lg:px-6 py-4 text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center border-r border-slate-200 bg-slate-50 whitespace-nowrap">SURAT / AYAT</th>
                                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-64 bg-slate-50">KETERANGAN</th>
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
                                                      <td rowSpan={3} className={`px-1 lg:px-2 py-3 align-middle lg:w-[100px] lg:min-w-[100px] w-[70px] min-w-[70px] sticky left-0 z-30 border-b border-r border-slate-200 text-center transition-colors !opacity-100 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-200 ${isToday ? 'bg-[#ECFDF5]' : 'bg-white'}`}>
                                                          {isToday && (
                                                              <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-emerald-600 shadow-[2px_0_8px_rgba(16,185,129,0.3)]"></div>
                                                          )}
                                                          <div className="flex flex-col items-center justify-center space-y-1 lg:space-y-1.5 text-center relative z-10 py-1 lg:py-2">
                                                              {isToday && (
                                                                  <span className="mb-1 lg:mb-2 px-1 lg:px-2 py-0.5 bg-emerald-500 text-white text-[6px] lg:text-[7px] font-black rounded-full uppercase tracking-tighter">HARI INI</span>
                                                              )}
                                                              <p className={`text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight leading-tight ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                                  {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase()}
                                                                  <span className="lg:hidden">,</span>
                                                              </p>
                                                              
                                                              {/* MOBILE DATE FORMAT (Stack) */}
                                                              <div className="lg:hidden flex flex-col items-center -space-y-0.5">
                                                                  <p className={`text-[13px] font-black leading-none ${isToday ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                      {new Date(date).toLocaleDateString('id-ID', { day: '2-digit' })}
                                                                  </p>
                                                                  <p className={`text-[9px] font-black uppercase pt-1 tracking-tighter ${isToday ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                      {new Date(date).toLocaleDateString('id-ID', { month: 'long' }).toUpperCase()}
                                                                  </p>
                                                              </div>

                                                              {/* DESKTOP DATE FORMAT (Flat) */}
                                                              <p className={`hidden lg:block text-[8.5px] font-bold uppercase tracking-widest ${isToday ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                  {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                                                              </p>
                                                          </div>
                                                      </td>
                                                  )}
                                                  <td className={`px-1 lg:px-2 py-3 sticky lg:left-[100px] left-[70px] z-30 lg:w-[80px] lg:min-w-[80px] w-[60px] min-w-[60px] border-b border-r border-slate-200 text-center transition-colors shadow-[4px_0_8px_rgba(0,0,0,0.05)] !opacity-100 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-300 ${isToday ? 'bg-[#ECFDF5]' : 'bg-white'}`}>
                                                      <span className={`text-[8px] lg:text-[9.5px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-600' : 'text-slate-400 opacity-60'}`}>
                                                          {getTypeLabel(type)}
                                                      </span>
                                                  </td>
                                                  
                                                  {/* JUMLAH COLUMN */}
                                                  <td className={`px-4 py-3 border-b border-r border-slate-200 text-center ${isToday ? 'bg-emerald-50/5' : ''}`}>
                                                       <div className="flex items-center justify-start gap-2 px-1 mx-auto">
                                                           <span className={`text-[10px] lg:text-[12px] font-black ${rec?.jumlah ? 'text-slate-800' : 'text-slate-200'}`}>
                                                               {rec?.jumlah || 0}
                                                           </span>
                                                           <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                                               {type === MemorizationType.SABAQ ? 'BARIS' : 'HALAMAN'}
                                                           </span>
                                                       </div>
                                                  </td>

                                                  {/* SURAT : AYAT COLUMN */}
                                                  <td className={`px-4 py-3 border-b border-r border-slate-200 ${isToday ? 'bg-emerald-50/5' : ''}`}>
                                                      <div className="flex items-center justify-start gap-1 max-w-[400px] mx-auto">
                                                          <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-[0.05em] truncate ${rec?.surah_name ? 'text-indigo-600' : 'text-slate-200'}`}>
                                                              {rec?.surah_name || '- SURAT -'}
                                                          </span>
                                                          <span className="text-slate-300 font-black">:</span>
                                                          <span className={`text-[9px] lg:text-[10px] font-black ${rec?.ayat_end ? 'text-slate-800' : 'text-slate-200'}`}>
                                                              {rec?.ayat_end || 0}
                                                          </span>
                                                      </div>
                                                  </td>

                                                  {/* KETERANGAN / STATUS */}
                                                  <td className={`px-2 lg:px-4 py-3 border-b border-slate-200 ${isToday ? 'bg-emerald-50/5' : ''}`}>
                                                       <div className="flex items-center justify-center">
                                                           {rec && rec.status && rec.status !== MemorizationStatus.EMPTY ? (
                                                               <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                                                   rec.status === MemorizationStatus.LANCAR ? 'text-emerald-600' :
                                                                   rec.status === MemorizationStatus.TIDAK_LANCAR ? 'text-amber-600' :
                                                                   'text-rose-600'
                                                               }`}>
                                                                   {rec.status?.replace('_', ' ')}
                                                               </span>
                                                           ) : (
                                                               <span className="text-[8px] lg:text-[9px] font-black text-slate-300 uppercase tracking-widest italic whitespace-nowrap">- STATUS -</span>
                                                           )}
                                                       </div>
                                                  </td>
                                              </tr>
                                          );
                                      })}
                                  </React.Fragment>
                              ))}
                          </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
    </div>
  );
};