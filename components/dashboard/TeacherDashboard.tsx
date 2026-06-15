import React, { useState, useMemo } from "react";
import { Users, Book, Zap, Activity, AlertCircle, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { UserProfile, UserRole, Student, MemorizationRecord, TeacherStats, PageView, MemorizationType, MemorizationStatus } from "../../types";
import { EmptyState } from "../ui/EmptyState";
import { RecentActivityModal } from "./RecentActivityModal";

interface TeacherDashboardProps {
  user: UserProfile;
  students: Student[];
  teacherStats: TeacherStats | null;
  recentRecords: MemorizationRecord[];
  myHalaqah: any | null;
  loading: boolean;
  isRefreshing: boolean;
  refreshData: (showFullLoader?: boolean) => Promise<void>;
  onNavigate: (page: PageView) => void;
  activeDays: number[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, students, teacherStats, recentRecords, myHalaqah, loading, isRefreshing, refreshData, onNavigate, activeDays }) => {
  const [perfType, setPerfType] = useState<MemorizationType>(MemorizationType.SABAQ);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedAttendanceCategory, setExpandedAttendanceCategory] = useState<string | null>(null);
  const [attendancePeriod, setAttendancePeriod] = useState<"daily" | "weekly" | "monthly" | "3months" | "6months">("daily");
  const [showAttendancePeriodDropdown, setShowAttendancePeriodDropdown] = useState(false);
  const [attendanceOffset, setAttendanceOffset] = useState(0);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth());
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());

  const attendanceRange = useMemo(() => {
    let start: Date;
    let end: Date;
    let display = "";

    if (attendancePeriod === "daily") {
      const d = new Date();
      d.setDate(d.getDate() + attendanceOffset);
      d.setHours(0,0,0,0);
      start = new Date(d);
      end = new Date(d);
      end.setHours(23,59,59,999);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      if (start.getTime() === today.getTime()) {
        display = "HARI INI";
      } else {
        display = start.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
      }
    } else if (attendancePeriod === "weekly") {
      const today = new Date();
      today.setHours(0,0,0,0);
      const day = today.getDay();
      const diff = (day === 0 ? -6 : 1) - day + attendanceOffset * 7;
      start = new Date(today);
      start.setDate(today.getDate() + diff);
      end = new Date(start);
      const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
      end.setDate(start.getDate() + rangeLength);
      end.setHours(23,59,59,999);
      display = `${start.getDate()} ${start.toLocaleDateString("id-ID", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`.toUpperCase();
    } else if (attendancePeriod === "monthly") {
      start = new Date(attendanceYear, attendanceMonth, 1);
      end = new Date(attendanceYear, attendanceMonth + 1, 0, 23, 59, 59, 999);
      display = start.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase();
    } else if (attendancePeriod === "3months") {
      start = new Date(attendanceYear, attendanceMonth - 2, 1);
      end = new Date(attendanceYear, attendanceMonth + 1, 0, 23, 59, 59, 999);
      display = `${start.toLocaleDateString("id-ID", { month: "short", year: "numeric" })} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`.toUpperCase();
    } else {
      const isH1 = attendanceMonth < 6;
      start = isH1 ? new Date(attendanceYear, 0, 1) : new Date(attendanceYear, 6, 1);
      end = isH1 ? new Date(attendanceYear, 5, 30, 23, 59, 59, 999) : new Date(attendanceYear, 11, 31, 23, 59, 59, 999);
      display = `${start.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase()} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase()}`;
    }

    return { start, end, display };
  }, [attendancePeriod, attendanceOffset, attendanceMonth, attendanceYear, activeDays]);

  const attendancePieData = useMemo(() => {
    const totals = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    const studentSets = {
      Hadir: new Map<string, number>(),
      Sakit: new Map<string, number>(),
      Izin: new Map<string, number>(),
      Alpa: new Map<string, number>(),
    };

    let periodRecordsCount = 0;

    if (attendancePeriod === "daily") {
      const attendanceMap = new Map<string, string>();
      const targetDateStr = new Date(attendanceRange.start.getTime() - attendanceRange.start.getTimezoneOffset() * 60000).toISOString().split("T")[0];

      recentRecords.forEach((rec) => {
        if (!rec.record_date) return;
        if (rec.record_date.split("T")[0] === targetDateStr) {
          periodRecordsCount++;
          const rawStatus = String(rec.status || rec.keterangan || "")
            .toUpperCase()
            .replace(/_/g, " ")
            .trim();

          if (rawStatus.includes("LANCAR") || rawStatus.includes("SETOR")) {
            attendanceMap.set(rec.student_id, "Hadir");
          } else if (!attendanceMap.has(rec.student_id) || attendanceMap.get(rec.student_id) === "Alpa") {
            if (rawStatus.includes("SAKIT")) attendanceMap.set(rec.student_id, "Sakit");
            else if (rawStatus.includes("IZIN")) attendanceMap.set(rec.student_id, "Izin");
            else if (rawStatus.includes("ALPA")) attendanceMap.set(rec.student_id, "Alpa");
          }
        }
      });

      students.forEach((student) => {
        const status = attendanceMap.get(student.id) || "Alpa";
        totals[status as keyof typeof totals]++;
        const map = studentSets[status as keyof typeof totals];
        map.set(student.full_name, (map.get(student.full_name) || 0) + 1);
      });

      if (students.length === 0 || periodRecordsCount === 0) return [{ name: "Belum Ada Data", value: 1, color: "#e2e8f0", students: [] }];
    } else {
      const dailyAttendance = new Map<string, Map<string, string>>();

      recentRecords.forEach((rec) => {
        if (!rec.record_date) return;
        const recDate = new Date(rec.record_date);
        
        if (recDate >= attendanceRange.start && recDate <= attendanceRange.end) {
          periodRecordsCount++;
          const dateStr = rec.record_date.split("T")[0];
          if (!dailyAttendance.has(dateStr)) dailyAttendance.set(dateStr, new Map());
          const dayMap = dailyAttendance.get(dateStr)!;

          const rawStatus = String(rec.status || rec.keterangan || "").toUpperCase().replace(/_/g, " ").trim();
          let status = "Alpa";
          if (rawStatus.includes("LANCAR") || rawStatus.includes("SETOR")) status = "Hadir";
          else if (rawStatus.includes("SAKIT")) status = "Sakit";
          else if (rawStatus.includes("IZIN")) status = "Izin";
          
          const existing = dayMap.get(rec.student_id);
          if (status === "Hadir") dayMap.set(rec.student_id, "Hadir");
          else if (!existing || existing === "Alpa") dayMap.set(rec.student_id, status);
        }
      });

      dailyAttendance.forEach((dayMap) => {
        students.forEach((student) => {
          const status = dayMap.get(student.id) || "Alpa";
          totals[status as keyof typeof totals]++;
          const map = studentSets[status as keyof typeof totals];
          map.set(student.full_name, (map.get(student.full_name) || 0) + 1);
        });
      });

      if (students.length === 0 || periodRecordsCount === 0 || dailyAttendance.size === 0) return [{ name: "Belum Ada Data", value: 1, color: "#e2e8f0", students: [] }];
    }

    const formatStudents = (map: Map<string, number>) => {
      if (attendancePeriod === "daily") return Array.from(map.keys());
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => `${name} (${count}x)`);
    };

    return [
      { name: "Hadir", value: totals.Hadir, color: "#10b981", students: formatStudents(studentSets.Hadir) },
      { name: "Sakit", value: totals.Sakit, color: "#f59e0b", students: formatStudents(studentSets.Sakit) },
      { name: "Izin", value: totals.Izin, color: "#3b82f6", students: formatStudents(studentSets.Izin) },
      { name: "Alpa", value: totals.Alpa, color: "#f43f5e", students: formatStudents(studentSets.Alpa) },
    ];
  }, [recentRecords, students, attendancePeriod, attendanceRange]);

  const teacherPieData = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const totals = {
      [MemorizationStatus.LANCAR]: 0,
      [MemorizationStatus.TIDAK_LANCAR]: 0,
      [MemorizationStatus.TIDAK_SETOR]: 0,
    };
    const studentSets = {
      [MemorizationStatus.LANCAR]: new Set<string>(),
      [MemorizationStatus.TIDAK_LANCAR]: new Set<string>(),
      [MemorizationStatus.TIDAK_SETOR]: new Set<string>(),
    };

    recentRecords.forEach((rec) => {
      if (!rec.record_date) return;
      const rDate = rec.record_date.split("T")[0];
      const isTypeMatch = rec.type === perfType;

      if (rDate === todayStr && isTypeMatch) {
        const rawStatus = String(rec.status || rec.keterangan || "")
          .toUpperCase()
          .replace(/_/g, " ")
          .trim();
        const isTidakSetor = rawStatus.includes("SETOR") && (rawStatus.includes("TIDAK") || rawStatus.includes("BELUM"));
        const isTidakLancar = rawStatus.includes("LANCAR") && (rawStatus.includes("TIDAK") || rawStatus.includes("BELUM"));
        const isLancar = rawStatus.includes("LANCAR") && !isTidakLancar;

        const studentName = students.find((s) => s.id === rec.student_id)?.full_name || "Tanpa Nama";

        if (isLancar) {
          totals[MemorizationStatus.LANCAR]++;
          studentSets[MemorizationStatus.LANCAR].add(studentName);
        } else if (isTidakLancar) {
          totals[MemorizationStatus.TIDAK_LANCAR]++;
          studentSets[MemorizationStatus.TIDAK_LANCAR].add(studentName);
        } else if (isTidakSetor) {
          totals[MemorizationStatus.TIDAK_SETOR]++;
          studentSets[MemorizationStatus.TIDAK_SETOR].add(studentName);
        }
      }
    });

    const totalCount = Object.values(totals).reduce((a, b) => a + b, 0);
    if (totalCount === 0) return [{ name: "Belum Ada Data", value: 1, color: "#e2e8f0", students: [] }];

    return [
      { name: "Lancar", value: totals[MemorizationStatus.LANCAR], color: "#10b981", students: Array.from(studentSets[MemorizationStatus.LANCAR]) },
      { name: "Tidak Lancar", value: totals[MemorizationStatus.TIDAK_LANCAR], color: "#f59e0b", students: Array.from(studentSets[MemorizationStatus.TIDAK_LANCAR]) },
      { name: "Tidak Setor", value: totals[MemorizationStatus.TIDAK_SETOR], color: "#f43f5e", students: Array.from(studentSets[MemorizationStatus.TIDAK_SETOR]) },
    ];
  }, [recentRecords, perfType, students]);

  const studentsNotDeposited = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const depositedStudentIds = new Set(recentRecords.filter((r) => r.record_date.startsWith(today)).map((r) => r.student_id));
    return students.filter((s) => !depositedStudentIds.has(s.id));
  }, [students, recentRecords]);

  const filteredRecentRecords = useMemo(() => {
    return recentRecords.filter((r) => r.status && r.status !== MemorizationStatus.EMPTY);
  }, [recentRecords]);

  return (
    <div className="flex-1 min-h-[calc(100vh-110px)] lg:min-h-[calc(100vh-140px)] flex flex-col gap-2.5 lg:gap-3 animate-fade-in pb-6">
      {user.role === UserRole.TEACHER && !myHalaqah && !loading && (
        <div className="bg-amber-50 border-4 border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <p className="text-xs font-bold uppercase tracking-tight">Anda belum ditugaskan ke halaqah manapun. Hubungi admin untuk pengaturan halaqah.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
        <div className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-jade-300 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-jade-50/40 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-jade-50 text-jade-700 rounded-xl flex items-center justify-center border-2 border-jade-100 relative z-10">
            <Users className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
          </div>
          <div className="relative z-10">
            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Total Santri</p>
            <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{students.length}</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50/40 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center border-2 border-rose-100 relative z-10">
            <Book className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
          </div>
          <div className="relative z-10">
            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Sabaq Hari Ini</p>
            <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{teacherStats?.sabaqToday ?? 0}</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50/40 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border-2 border-amber-100 relative z-10">
            <Zap className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
          </div>
          <div className="relative z-10">
            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Sabqi Hari Ini</p>
            <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{teacherStats?.sabqiToday ?? 0}</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/40 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border-2 border-emerald-100 relative z-10">
            <Activity className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
          </div>
          <div className="relative z-10">
            <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Manzil Hari Ini</p>
            <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{teacherStats?.manzilToday ?? 0}</h4>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3 lg:gap-3.5">
        <div className="flex-1 bg-white rounded-xl border-2 border-slate-300 p-4 lg:p-5 flex flex-col relative min-h-87.5 lg:min-h-100">
          <div className="flex flex-row items-center justify-between gap-2 mb-3 lg:mb-6">
            <div className="flex items-start gap-3">
              <h3 className="text-[9.5px] lg:text-[10px] ps-2 font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Performa Hari Ini</h3>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="hidden lg:flex items-center gap-2 ml-auto">
                <div className="flex gap-1 p-1 bg-white border-[1.5px] border-slate-200/80 rounded-xl shadow-sm items-center h-9 lg:h-10 w-full sm:w-auto">
                  {[
                    { id: MemorizationType.SABAQ, label: "Sabaq" },
                    { id: MemorizationType.SABQI, label: "Sabqi" },
                    { id: MemorizationType.MANZIL, label: "Manzil" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPerfType(type.id as any)}
                      className={`flex-1 sm:flex-none py-1 px-1 lg:px-4 rounded-lg text-[7px] lg:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full flex items-center justify-center ${perfType === type.id ? "bg-jade-50 text-jade-600 shadow-sm ring-1 ring-jade-200" : "text-slate-400 hover:text-jade-500 bg-transparent"}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => refreshData(false)}
                disabled={isRefreshing}
                className={`h-9 w-9 lg:h-10 lg:w-10 bg-white text-slate-400 rounded-xl border-2 border-slate-300 hover:text-jade-600 hover:border-jade-200 transition-all flex items-center justify-center ${isRefreshing ? "opacity-50" : "active:scale-90 lg:active:scale-95"}`}
              >
                <RotateCcw className={`w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="bg-white hover:bg-slate-50 px-4 h-9 lg:h-10 rounded-xl text-[8.5px] font-black text-jade-700 uppercase tracking-widest transition-all active:scale-95 border-2 border-slate-300 flex items-center justify-center min-w-12.5"
              >
                AKTIVITAS
              </button>
            </div>
          </div>

          <div className="lg:hidden flex flex-col gap-2.5 mb-4">
            <div className="flex gap-1 p-1 bg-white border-[1.5px] border-slate-200/80 rounded-xl shadow-sm items-center h-10 w-full sm:w-auto">
              {[
                { id: MemorizationType.SABAQ, label: "Sabaq" },
                { id: MemorizationType.SABQI, label: "Sabqi" },
                { id: MemorizationType.MANZIL, label: "Manzil" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPerfType(type.id as any)}
                  className={`flex-1 sm:flex-none py-1 px-1 lg:px-4 rounded-lg text-[7px] lg:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full flex items-center justify-center ${perfType === type.id ? "bg-jade-50 text-jade-600 shadow-sm ring-1 ring-jade-200" : "text-slate-400 hover:text-jade-500 bg-transparent"}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
            {teacherPieData.length > 0 ? (
              <>
                <div className="w-full h-55 lg:h-65 shrink-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie data={teacherPieData} innerRadius="60%" outerRadius="85%" paddingAngle={2} stroke="none" dataKey="value" labelLine={false} animationDuration={1500}>
                        {teacherPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "2px solid #e2e8f0", boxShadow: "none" }} itemStyle={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={`${teacherPieData.length === 1 ? "flex justify-center" : "grid grid-cols-3"} gap-2 w-full mt-1 shrink-0 items-start`}>
                  {teacherPieData.map((entry: any) => {
                    const totalValue = teacherPieData.reduce((acc, curr) => acc + curr.value, 0);
                    const percentage = totalValue > 0 ? Math.round((entry.value / totalValue) * 100) : 0;
                    const isNoData = entry.name === "Belum Ada Data";
                    const isExpanded = expandedCategory === entry.name;

                    return (
                      <div key={entry.name} className={`bg-white rounded-xl py-1.5 px-2 border-2 border-slate-300 flex flex-col transition-all relative ${isNoData ? "min-w-30" : ""}`}>
                        <div className={`flex flex-col items-center justify-center relative ${!isNoData ? "cursor-pointer hover:opacity-80" : ""}`} onClick={() => !isNoData && setExpandedCategory(isExpanded ? null : entry.name)}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">{entry.name}</span>
                          </div>
                          <div className="flex items-baseline gap-1 relative w-full justify-center">
                            <p className="text-[10px] lg:text-xs font-black text-slate-800">{isNoData ? 0 : entry.value}</p>
                            {!isNoData && <p className="text-[7px] lg:text-[8px] font-bold text-slate-400">({percentage}%)</p>}
                            {!isNoData && <ChevronDown className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />}
                          </div>
                        </div>
                        {isExpanded && !isNoData && entry.students && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 flex flex-col gap-1 max-36.25 overflow-y-auto custom-scrollbar p-2 text-left">
                            {entry.students.length > 0 ? (
                              entry.students.map((name: string, i: number) => (
                                <div key={i} className="text-[9px] font-bold text-slate-600 uppercase tracking-tight truncate py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-1 rounded-md" title={name}>
                                  {name}
                                </div>
                              ))
                            ) : (
                              <div className="text-[9px] font-bold text-slate-400 italic text-center py-2">Kosong</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState message="Data Tidak Ditemukan" description="Belum ada aktivitas setoran tercatat untuk pekan ini." icon="ghost" />
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border-2 border-slate-300 p-4 lg:p-5 flex flex-col relative min-h-87.5 lg:min-h-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3 lg:mb-6">
            <div className="flex items-start gap-3">
              <h3 className="text-[9.5px] lg:text-[10px] ps-2 font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Statistik Kehadiran</h3>
            </div>
            
            <div className="flex flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div
                className="relative flex items-center bg-white px-3.5 rounded-xl border-2 border-slate-300 shadow-none h-9 lg:h-10 gap-2 focus-within:border-jade-400 focus-within:ring-2 focus-within:ring-jade-50/50 transition-all group/period cursor-pointer w-[40%] sm:w-auto sm:flex-none sm:min-w-32"
                onClick={() => setShowAttendancePeriodDropdown(!showAttendancePeriodDropdown)}
              >
                <div className="flex items-center justify-between w-full h-full">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 pointer-events-none truncate pr-4">
                    {attendancePeriod === "daily" ? "HARIAN" : attendancePeriod === "weekly" ? "MINGGUAN" : attendancePeriod === "monthly" ? "BULANAN" : attendancePeriod === "3months" ? "3 BULANAN" : "SEMESTERAN"}
                  </span>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-300 pointer-events-none group-hover/period:text-emerald-500 transition-all ${showAttendancePeriodDropdown ? "rotate-180 text-emerald-500" : ""}`}
                  />
                </div>

                {showAttendancePeriodDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAttendancePeriodDropdown(false);
                      }}
                    />
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { value: "daily", label: "HARIAN" },
                        { value: "weekly", label: "MINGGUAN" },
                        { value: "monthly", label: "BULANAN" },
                        { value: "3months", label: "3 BULANAN" },
                        { value: "6months", label: "SEMESTERAN" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[8px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${attendancePeriod === opt.value ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttendancePeriod(opt.value as any);
                            setShowAttendancePeriodDropdown(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 bg-jade-600 p-1 rounded-xl shadow-none w-[60%] sm:w-auto sm:flex-none sm:min-w-35 h-9 lg:h-10">
                <button
                  type="button"
                  onClick={() => {
                    if (attendancePeriod === "daily" || attendancePeriod === "weekly") setAttendanceOffset((prev) => prev - 1);
                    else if (attendancePeriod === "monthly") {
                      if (attendanceMonth === 0) {
                        setAttendanceMonth(11);
                        setAttendanceYear((prev) => prev - 1);
                      } else setAttendanceMonth((prev) => prev - 1);
                    } else if (attendancePeriod === "3months") {
                      setAttendanceMonth((prev) => {
                        if (prev < 3) {
                          setAttendanceYear((y) => y - 1);
                          return prev + 12 - 3;
                        }
                        return prev - 3;
                      });
                    } else if (attendancePeriod === "6months") {
                      setAttendanceMonth((prev) => {
                        if (prev < 6) {
                          setAttendanceYear((y) => y - 1);
                          return 11;
                        }
                        return 5;
                      });
                    }
                  }}
                  className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <ChevronLeft className="w-2.5 h-2.5" />
                </button>
                <div className="flex-1 px-1 text-[6.5px] lg:text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1 lg:gap-1.5 overflow-hidden">
                  <Calendar className="w-2.5 h-2.5 opacity-60 hidden xs:block shrink-0" />
                  <span className="truncate">{attendanceRange.display}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (attendancePeriod === "daily" || attendancePeriod === "weekly") setAttendanceOffset((prev) => prev + 1);
                    else if (attendancePeriod === "monthly") {
                      if (attendanceMonth === 11) {
                        setAttendanceMonth(0);
                        setAttendanceYear((prev) => prev + 1);
                      } else setAttendanceMonth((prev) => prev + 1);
                    } else if (attendancePeriod === "3months") {
                      setAttendanceMonth((prev) => {
                        if (prev > 8) {
                          setAttendanceYear((y) => y + 1);
                          return prev - 12 + 3;
                        }
                        return prev + 3;
                      });
                    } else if (attendancePeriod === "6months") {
                      setAttendanceMonth((prev) => {
                        if (prev < 6) return 11;
                        setAttendanceYear((y) => y + 1);
                        return 5;
                      });
                    }
                  }}
                  className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
            {attendancePieData.length > 0 ? (
              <>
                <div className="w-full h-55 lg:h-65 shrink-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie data={attendancePieData} innerRadius="60%" outerRadius="85%" paddingAngle={2} stroke="none" dataKey="value" labelLine={false} animationDuration={1500}>
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "2px solid #e2e8f0", boxShadow: "none" }} itemStyle={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={`${attendancePieData.length === 1 ? "flex justify-center" : "grid grid-cols-2 lg:grid-cols-4"} gap-2 w-full mt-1 shrink-0 items-start`}>
                  {attendancePieData.map((entry: any) => {
                    const totalValue = attendancePieData.reduce((acc, curr) => acc + curr.value, 0);
                    const percentage = totalValue > 0 ? Math.round((entry.value / totalValue) * 100) : 0;
                    const isNoData = entry.name === "Belum Ada Data";
                    const isExpanded = expandedAttendanceCategory === entry.name;

                    return (
                      <div key={entry.name} className={`bg-white rounded-xl py-1.5 px-2 border-2 border-slate-300 flex flex-col transition-all relative ${isNoData ? "min-w-30" : ""}`}>
                        <div className={`flex flex-col items-center justify-center relative ${!isNoData ? "cursor-pointer hover:opacity-80" : ""}`} onClick={() => !isNoData && setExpandedAttendanceCategory(isExpanded ? null : entry.name)}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">{entry.name}</span>
                          </div>
                          <div className="flex items-baseline gap-1 relative w-full justify-center">
                            <p className="text-[10px] lg:text-xs font-black text-slate-800">{isNoData ? 0 : entry.value}</p>
                            {!isNoData && <p className="text-[7px] lg:text-[8px] font-bold text-slate-400">({percentage}%)</p>}
                            {!isNoData && <ChevronDown className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />}
                          </div>
                        </div>
                        {isExpanded && !isNoData && entry.students && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 flex flex-col gap-1 max-36.25 overflow-y-auto custom-scrollbar p-2 text-left">
                            {entry.students.length > 0 ? (
                              entry.students.map((name: string, i: number) => (
                                <div key={i} className="text-[9px] font-bold text-slate-600 uppercase tracking-tight truncate py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-1 rounded-md" title={name}>
                                  {name}
                                </div>
                              ))
                            ) : (
                              <div className="text-[9px] font-bold text-slate-400 italic text-center py-2">Kosong</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState message="Data Tidak Ditemukan" description="Belum ada aktivitas tercatat." icon="ghost" />
            )}
          </div>
        </div>
      </div>

      <RecentActivityModal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} records={filteredRecentRecords} students={students} />
    </div>
  );
};
