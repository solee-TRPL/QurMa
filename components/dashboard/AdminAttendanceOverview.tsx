import React from "react";
import { Activity, AlertCircle, FileText, Target, ChevronLeft, ChevronRight, ChevronDown, Calendar, RefreshCw } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AdminStats } from "../../types";

import { useAdminDashboard } from "./AdminDashboardContext";

export const AdminAttendanceOverview: React.FC = () => {
  const {
    adminStats,
    loadingAdminTargetChart,
    adminTargetRange,
    adminKehadiranTrendData,
    adminTargetPeriod,
    setAdminTargetWeekOffset,
    adminTargetMonth,
    setAdminTargetMonth,
    adminTargetYear,
    setAdminTargetYear,
    setAdminTargetPeriod,
  } = useAdminDashboard();
  const [filterMode, setFilterMode] = React.useState<"hadir" | "tidak_hadir">("hadir");
  const [showTargetPeriodDropdown, setShowTargetPeriodDropdown] = React.useState(false);
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
        {[
          {
            label: "Hadir",
            value: adminStats?.kehadiranToday?.hadir || 0,
            icon: Activity,
            color: "jade",
            subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.hadir || 0) / adminStats.totalStudents) * 100) : 0}% dari total`,
          },
          {
            label: "Sakit",
            value: adminStats?.kehadiranToday?.sakit || 0,
            icon: AlertCircle,
            color: "amber",
            subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.sakit || 0) / adminStats.totalStudents) * 100) : 0}% dari total`,
          },
          {
            label: "Izin",
            value: adminStats?.kehadiranToday?.izin || 0,
            icon: FileText,
            color: "blue",
            subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.izin || 0) / adminStats.totalStudents) * 100) : 0}% dari total`,
          },
          {
            label: "Alpa",
            value: adminStats?.kehadiranToday?.alpa || 0,
            icon: Target,
            color: "rose",
            subtext: `${adminStats?.totalStudents ? Math.round(((adminStats?.kehadiranToday?.alpa || 0) / adminStats.totalStudents) * 100) : 0}% dari total`,
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex flex-col justify-center relative overflow-hidden group hover:border-jade-300 transition-all shadow-none">
            <div
              className={`absolute right-0 top-0 w-24 h-24 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                stat.color === "jade" ? "bg-jade-50/40" : stat.color === "amber" ? "bg-amber-50/40" : stat.color === "blue" ? "bg-blue-50/40" : "bg-rose-50/40"
              }`}
            />
            <div className="flex items-center gap-3 lg:gap-4 relative z-10">
              <div
                className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center border-2 ${
                  stat.color === "jade"
                    ? "bg-jade-50 text-jade-700 border-jade-100"
                    : stat.color === "amber"
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : stat.color === "blue"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                <stat.icon className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
              </div>
              <div>
                <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">{stat.value}</h4>
                <p className="text-[6px] lg:text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.subtext}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col relative min-h75 transition-all duration-500 shadow-none">
        {loadingAdminTargetChart && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300 rounded-xl">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Memuat...</p>
            </div>
          </div>
        )}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 shrink-0 gap-4 relative z-30">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Tren Kehadiran</h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data kehadiran santri selama periode yang dipilih</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
            {/* FILTER BUTTONS */}
            <div className="flex gap-1 p-1 bg-white border-[1.5px] border-slate-200/80 rounded-xl shadow-sm items-center h-8 lg:h-9 w-full sm:w-auto">
              <button
                onClick={() => setFilterMode("hadir")}
                className={`flex-1 sm:flex-none py-1 px-1 lg:px-4 rounded-lg text-[7px] lg:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full flex items-center justify-center ${filterMode === "hadir" ? "bg-jade-50 text-jade-600 shadow-sm ring-1 ring-jade-200" : "text-slate-400 hover:text-jade-500 bg-transparent"}`}
              >
                Hadir
              </button>
              <button
                onClick={() => setFilterMode("tidak_hadir")}
                className={`flex-1 sm:flex-none py-1 px-1 lg:px-4 rounded-lg text-[7px] lg:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full flex items-center justify-center ${filterMode === "tidak_hadir" ? "bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-200" : "text-slate-400 hover:text-rose-500 bg-transparent"}`}
              >
                Tidak Hadir
              </button>
            </div>

            <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              <div
                className="relative flex items-center bg-white px-3.5 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-8 lg:h-9 gap-2 focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/period cursor-pointer flex-1 lg:flex-none lg:min-w-32"
                onClick={() => setShowTargetPeriodDropdown(!showTargetPeriodDropdown)}
              >
                <div className="flex items-center justify-between w-full h-full">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 pointer-events-none truncate pr-4">
                    {adminTargetPeriod === "weekly" ? "MINGGUAN" : adminTargetPeriod === "monthly" ? "BULANAN" : adminTargetPeriod === "3months" ? "3 BULANAN" : adminTargetPeriod === "6months" ? "SEMESTERAN" : "TAHUNAN"}
                  </span>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-300 pointer-events-none group-hover/period:text-emerald-500 transition-all ${showTargetPeriodDropdown ? "rotate-180 text-emerald-500" : ""}`}
                  />
                </div>

                {showTargetPeriodDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTargetPeriodDropdown(false);
                      }}
                    />
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { value: "weekly", label: "MINGGUAN" },
                        { value: "monthly", label: "BULANAN" },
                        { value: "3months", label: "3 BULANAN" },
                        { value: "6months", label: "SEMESTERAN" },
                        { value: "yearly", label: "TAHUNAN" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[8px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${adminTargetPeriod === opt.value ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdminTargetPeriod(opt.value as any);
                            setShowTargetPeriodDropdown(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

            <div className="flex items-center gap-1 bg-jade-600 rounded-xl p-1 shrink-0 flex-1 lg:flex-none lg:w-auto h-8 lg:h-9">
            <button
              type="button"
              onClick={() => {
                if (adminTargetPeriod === "weekly") setAdminTargetWeekOffset((prev) => prev - 1);
                else if (adminTargetPeriod === "monthly") {
                  if (adminTargetMonth === 0) {
                    setAdminTargetMonth(11);
                    setAdminTargetYear((prev) => prev - 1);
                  } else setAdminTargetMonth((prev) => prev - 1);
                } else if (adminTargetPeriod === "3months") {
                  setAdminTargetMonth((prev) => {
                    if (prev < 3) {
                      setAdminTargetYear((y) => y - 1);
                      return prev + 12 - 3;
                    }
                    return prev - 3;
                  });
                } else if (adminTargetPeriod === "6months") {
                  setAdminTargetMonth((prev) => {
                    if (prev < 6) {
                      setAdminTargetYear((y) => y - 1);
                      return 11;
                    }
                    return 5;
                  });
                } else if (adminTargetPeriod === "yearly") setAdminTargetYear((prev) => prev - 1);
              }}
              className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <ChevronLeft className="w-2.5 h-2.5" />
            </button>
            <div className="flex-1 px-1 text-[6.5px] lg:text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1 lg:gap-1.5 overflow-hidden">
              <Calendar className="w-2.5 h-2.5 opacity-60 hidden xs:block shrink-0" />
              <span className="truncate">{adminTargetRange.display}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (adminTargetPeriod === "weekly") setAdminTargetWeekOffset((prev) => prev + 1);
                else if (adminTargetPeriod === "monthly") {
                  if (adminTargetMonth === 11) {
                    setAdminTargetMonth(0);
                    setAdminTargetYear((prev) => prev + 1);
                  } else setAdminTargetMonth((prev) => prev + 1);
                } else if (adminTargetPeriod === "3months") {
                  setAdminTargetMonth((prev) => {
                    if (prev > 8) {
                      setAdminTargetYear((y) => y + 1);
                      return prev - 12 + 3;
                    }
                    return prev + 3;
                  });
                } else if (adminTargetPeriod === "6months") {
                  setAdminTargetMonth((prev) => {
                    if (prev < 6) return 11;
                    setAdminTargetYear((y) => y + 1);
                    return 5;
                  });
                } else if (adminTargetPeriod === "yearly") setAdminTargetYear((prev) => prev + 1);
              }}
              className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
          </div>
          </div>
        </div>
        <div className="flex-1 w-full overflow-hidden relative z-10">
          <ResponsiveContainer width="100%" height={240}>
              <LineChart data={adminKehadiranTrendData || adminStats?.kehadiranTrend || []} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: "#94A3B8" }} dy={10} interval={adminTargetPeriod === "weekly" ? 0 : adminTargetPeriod === "monthly" ? 2 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: "#94A3B8" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "2px solid #e2e8f0", backgroundColor: "#fff", color: "#1e293b", padding: "10px", boxShadow: "none" }}
                  cursor={{ stroke: "#f1f5f9", strokeWidth: 2 }}
                  itemStyle={{ color: "#1e293b", fontSize: "9px", fontWeight: 900, padding: 0, textTransform: "uppercase" }}
                  labelStyle={{ color: "#94a3b8", opacity: 1, fontSize: "7px", fontWeight: 900, marginBottom: "4px", textTransform: "uppercase" }}
                />
                {filterMode === "hadir" && (
                  <Line type="monotone" dataKey="hadir" name="Hadir" stroke="var(--color-jade-600)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                )}
                {filterMode === "tidak_hadir" && (
                  <Line type="monotone" dataKey="tidak_hadir" name="Tidak Hadir" stroke="#f43f5e" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
