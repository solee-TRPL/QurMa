import React, { useState } from "react";
import { AlertCircle, Activity, Zap, Book, ChevronLeft, ChevronRight, ChevronDown, Calendar, RefreshCw, Crosshair } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AdminStats, Halaqah, Student, UserProfile, MemorizationType } from "../../types";
import { PendingManzilModal } from "./PendingManzilModal";

import { useAdminDashboard } from "./AdminDashboardContext";

export const AdminMemorizationOverview: React.FC = () => {
  const {
    adminStats,
    halaqahs,
    allUsers,
    students,
    activeDays,
    isRefreshing,
    refreshData,
    adminTrendType,
    setAdminTrendType,
    adminTrendPeriod,
    setAdminTrendPeriod,
    adminTrendWeekOffset,
    setAdminTrendWeekOffset,
    adminTrendMonth,
    setAdminTrendMonth,
    adminTrendYear,
    setAdminTrendYear,
    loadingAdminTrend,
    adminTrendData,
    adminTargetHalaqahId,
    setAdminTargetHalaqahId,
    adminTargetWeekOffset,
    setAdminTargetWeekOffset,
    adminTargetData,
    loadingAdminTargetChart,
    adminTargetRange,
    adminTargetPeriod,
    setAdminTargetPeriod,
    adminTargetMonth,
    setAdminTargetMonth,
    adminTargetYear,
    setAdminTargetYear,
    adminAvgSabaqPeriod,
    setAdminAvgSabaqPeriod,
    adminAvgSabaqWeekOffset,
    setAdminAvgSabaqWeekOffset,
    adminAvgSabaqMonth,
    setAdminAvgSabaqMonth,
    adminAvgSabaqYear,
    setAdminAvgSabaqYear,
    loadingAdminAvgSabaq,
    adminAvgSabaqData,
  } = useAdminDashboard();
  const [isPendingManzilModalOpen, setIsPendingManzilModalOpen] = useState(false);
  const [showTrendPeriodDropdown, setShowTrendPeriodDropdown] = useState(false);
  const [showTargetHalaqahDropdown, setShowTargetHalaqahDropdown] = useState(false);
  const [showTargetPeriodDropdown, setShowTargetPeriodDropdown] = useState(false);
  const [showAvgSabaqPeriodDropdown, setShowAvgSabaqPeriodDropdown] = useState(false);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 shrink-0">
        {[
          { label: "Belum Manzil Hari Ini", value: adminStats?.notManzilToday || 0, icon: AlertCircle, color: "rose", onClick: () => setIsPendingManzilModalOpen(true) },
          { label: "Setoran Manzil Hari Ini", value: adminStats?.manzilToday || 0, icon: Activity, color: "emerald" },
          { label: "Setoran Sabaq Hari Ini", value: adminStats?.sabaqToday || 0, icon: Zap, color: "rose" },
          { label: "Setoran Sabqi Hari Ini", value: adminStats?.sabqiToday || 0, icon: Book, color: "amber" },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl p-3 lg:p-4 border-2 border-slate-300 flex items-center justify-between relative overflow-hidden group transition-all shadow-none ${stat.onClick ? "cursor-pointer hover:border-rose-300 active:scale-98" : "hover:border-jade-300"}`}
            onClick={stat.onClick}
          >
            <div
              className={`absolute right-0 top-0 w-24 h-24 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                stat.color === "rose" ? "bg-rose-50/40" : stat.color === "amber" ? "bg-amber-50/40" : "bg-emerald-50/40"
              }`}
            />

            <div className="flex items-center gap-3 lg:gap-4 relative z-10">
              <div
                className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center border-2 ${
                  stat.color === "rose" ? "bg-rose-50 text-rose-700 border-rose-100" : stat.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                <stat.icon className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
              </div>
              <div>
                <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">{stat.label}</p>
                <h4 className={`text-sm lg:text-lg font-black leading-none ${stat.label === "Belum Manzil Hari Ini" ? "text-rose-600" : "text-slate-800"}`}>{stat.value}</h4>
              </div>
            </div>

            {stat.onClick && (
              <div className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-50 border-2 border-slate-100 items-center justify-center text-slate-300 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all relative z-10">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5 flex-1 min-h-0">
        {/* 1. Trend Chart (Full Width) */}
        <div className="lg:col-span-4 bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col min-h-100 lg:min-h-85 relative transition-all duration-500 overflow-hidden shadow-none">
          {loadingAdminTrend && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Memuat...</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0 w-full relative z-30">
            <div className="flex items-center justify-between gap-3 w-full xl:w-auto">
              <div className="flex flex-col">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Tren Setoran</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Data harian kategori hafalan</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-start xl:justify-end w-full xl:w-auto">
              <div className="flex justify-center items-center bg-white px-2 lg:px-4 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 shrink-0 gap-2 lg:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-jade-600"></div>
                  <span className="text-[7px] lg:text-[8px] font-black text-slate-500 uppercase tracking-wider">SABAQ</span>
                </div>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2 lg:pl-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  <span className="text-[7px] lg:text-[8px] font-black text-slate-500 uppercase tracking-wider">SABQI</span>
                </div>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2 lg:pl-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <span className="text-[7px] lg:text-[8px] font-black text-slate-500 uppercase tracking-wider">MANZIL</span>
                </div>
              </div>

              <div className="flex gap-1 p-1 bg-white border-[1.5px] border-slate-200/80 rounded-xl shadow-sm items-center h-9 w-full sm:w-auto">
                {[
                  { label: "SABAQ", value: MemorizationType.SABAQ, activeClass: "bg-jade-50 text-jade-600 shadow-sm ring-1 ring-jade-200", hoverClass: "hover:text-jade-500" },
                  { label: "SABQI", value: MemorizationType.SABQI, activeClass: "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200", hoverClass: "hover:text-blue-500" },
                  { label: "MANZIL", value: MemorizationType.MANZIL, activeClass: "bg-slate-100 text-slate-600 shadow-sm ring-1 ring-slate-300", hoverClass: "hover:text-slate-500" },
                ].map((type) => {
                  const isActive = adminTrendType === type.value || (adminTrendType === "all" && type.value === MemorizationType.SABAQ);
                  return (
                  <button
                    key={type.value}
                    onClick={() => setAdminTrendType(type.value as any)}
                    className={`flex-1 sm:flex-none py-1 px-1 lg:px-4 rounded-lg text-[7px] lg:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full flex items-center justify-center ${
                      isActive ? type.activeClass : `text-slate-400 bg-transparent ${type.hoverClass}`
                    }`}
                  >
                    {type.label}
                  </button>
                )})}
              </div>

              <div className="flex items-center gap-1 bg-[#226649] p-1 rounded-xl shadow-none h-9 w-full sm:w-auto min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (adminTrendPeriod === "weekly") setAdminTrendWeekOffset((prev) => prev - 1);
                    else if (adminTrendPeriod === "monthly") {
                      if (adminTrendMonth === 0) {
                        setAdminTrendMonth(11);
                        setAdminTrendYear((prev) => prev - 1);
                      } else setAdminTrendMonth((prev) => prev - 1);
                    } else if (adminTrendPeriod === "3months") {
                      setAdminTrendMonth((prev) => {
                        if (prev < 3) {
                          setAdminTrendYear((y) => y - 1);
                          return prev + 12 - 3;
                        }
                        return prev - 3;
                      });
                    } else if (adminTrendPeriod === "6months") {
                      setAdminTrendMonth((prev) => {
                        if (prev < 6) {
                          setAdminTrendYear((y) => y - 1);
                          return 11;
                        }
                        return 5;
                      });
                    } else if (adminTrendPeriod === "yearly") setAdminTrendYear((prev) => prev - 1);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div className="flex-1 px-1 text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 min-w-0 overflow-hidden">
                  <Calendar className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  <span className="truncate text-[6.5px] lg:text-[7.5px]">
                    {(() => {
                      if (adminTrendPeriod === "weekly") {
                        const today = new Date();
                        const day = today.getDay();
                        const diff = (day === 0 ? -6 : 1) - day + adminTrendWeekOffset * 7;
                        const start = new Date(today);
                        start.setDate(today.getDate() + diff);
                        const end = new Date(start);
                        const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                        end.setDate(start.getDate() + rangeLength);
                        return `${start.getDate()} ${start.toLocaleDateString("id-ID", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`.toUpperCase();
                      }
                      if (adminTrendPeriod === "monthly") return new Date(adminTrendYear, adminTrendMonth).toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase();
                      if (adminTrendPeriod === "3months") {
                        const end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                        const start = new Date(adminTrendYear, adminTrendMonth - 2, 1);
                        return `${start.toLocaleDateString("id-ID", { month: "short", year: "numeric" })} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`.toUpperCase();
                      }
                      if (adminTrendPeriod === "6months") {
                        const isH1 = adminTrendMonth < 6;
                        const start = isH1 ? new Date(adminTrendYear, 0, 1) : new Date(adminTrendYear, 6, 1);
                        const end = isH1 ? new Date(adminTrendYear, 5, 30) : new Date(adminTrendYear, 11, 31);
                        return `${start.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase()} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase()}`;
                      }
                      if (adminTrendPeriod === "yearly") return adminTrendYear.toString();
                      return new Date(adminTrendYear, adminTrendMonth).toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase();
                    })()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (adminTrendPeriod === "weekly") setAdminTrendWeekOffset((prev) => prev + 1);
                    else if (adminTrendPeriod === "monthly") {
                      if (adminTrendMonth === 11) {
                        setAdminTrendMonth(0);
                        setAdminTrendYear((prev) => prev + 1);
                      } else setAdminTrendMonth((prev) => prev + 1);
                    } else if (adminTrendPeriod === "3months") {
                      setAdminTrendMonth((prev) => {
                        if (prev > 8) {
                          setAdminTrendYear((y) => y + 1);
                          return prev - 12 + 3;
                        }
                        return prev + 3;
                      });
                    } else if (adminTrendPeriod === "6months") {
                      setAdminTrendMonth((prev) => {
                        if (prev < 6) return 11;
                        setAdminTrendYear((y) => y + 1);
                        return 5;
                      });
                    } else if (adminTrendPeriod === "yearly") setAdminTrendYear((prev) => prev + 1);
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full overflow-hidden mt-4">
            {adminTrendData && (
              <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
                <LineChart data={adminTrendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 900 }} tickLine={false} axisLine={false} dy={8} interval={adminTrendPeriod === "weekly" ? 0 : adminTrendPeriod === "monthly" ? 2 : 0} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 900 }} tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: "#f1f5f9", strokeWidth: 2 }}
                    contentStyle={{ borderRadius: "12px", border: "2px solid #e2e8f0", backgroundColor: "#fff", color: "#1e293b", padding: "10px", boxShadow: "none" }}
                    itemStyle={{ color: "#1e293b", fontSize: "9px", fontWeight: 900, padding: 0, textTransform: "uppercase" }}
                    labelStyle={{ color: "#94a3b8", opacity: 1, fontSize: "7px", fontWeight: 900, marginBottom: "4px", textTransform: "uppercase" }}
                  />
                  {(adminTrendType === "all" || adminTrendType === MemorizationType.SABAQ) && (
                    <Line type="monotone" name="Sabaq" dataKey="sabaq" stroke="var(--color-jade-600)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "var(--color-jade-600)" }} />
                  )}
                  {(adminTrendType === "all" || adminTrendType === MemorizationType.SABQI) && (
                    <Line type="monotone" name="Sabqi" dataKey="sabqi" stroke="var(--color-primary-500)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "var(--color-primary-500)" }} />
                  )}
                  {(adminTrendType === "all" || adminTrendType === MemorizationType.MANZIL) && (
                    <Line type="monotone" name="Manzil" dataKey="manzil" stroke="#94a3b8" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#94a3b8" }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col relative min-h-85 transition-all duration-500 overflow-hidden shadow-none">
        {loadingAdminTargetChart && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Mengkalkulasi...</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4 relative z-30">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Pencapaian Target</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Monitor hasil capaian per periode
              {adminTargetData.some((d) => d.tercapai > 0 || d.tidakTercapai > 0 || d.terlampaui > 0) && (
                <span className="text-emerald-500 ml-1">{adminTargetData.reduce((acc, curr) => acc + (curr.tercapai || 0) + (curr.tidakTercapai || 0) + (curr.terlampaui || 0), 0)} DATA</span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="hidden lg:flex items-center gap-4 px-5 rounded-xl bg-white border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-jade-600"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">TERCAPAI</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">TERLAMPAUI</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">TIDAK TERCAPAI</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div
                className="relative flex items-center bg-white px-3.5 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 gap-2 focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/halaqah cursor-pointer flex-1 sm:flex-none sm:min-w-32"
                onClick={() => setShowTargetHalaqahDropdown(!showTargetHalaqahDropdown)}
              >
                <div className="flex items-center justify-between w-full h-full">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 pointer-events-none truncate pr-4">
                    {adminTargetHalaqahId === "all" ? "HALAQAH" : halaqahs.find((h) => h.id === adminTargetHalaqahId)?.name.toUpperCase() || "HALAQAH"}
                  </span>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-300 pointer-events-none group-hover/halaqah:text-emerald-500 transition-all ${showTargetHalaqahDropdown ? "rotate-180 text-emerald-500" : ""}`}
                  />
                </div>

                {showTargetHalaqahDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTargetHalaqahDropdown(false);
                      }}
                    />
                    <div className="absolute top-[calc(100%+4px)] -left-0.5 min-w-[calc(100%+4px)] bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                      <div
                        className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[9px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors whitespace-nowrap ${adminTargetHalaqahId === "all" ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdminTargetHalaqahId("all");
                          setShowTargetHalaqahDropdown(false);
                        }}
                      >
                        HALAQAH
                      </div>
                      {halaqahs.map((h) => (
                        <div
                          key={h.id}
                          className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[9px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors whitespace-nowrap ${adminTargetHalaqahId === h.id ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdminTargetHalaqahId(h.id);
                            setShowTargetHalaqahDropdown(false);
                          }}
                        >
                          {h.name.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div
                className="relative flex items-center bg-white px-3.5 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 lg:h-10 gap-2 focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/period cursor-pointer flex-1 sm:flex-none sm:min-w-32"
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

              <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-jade-600 p-1 rounded-xl shadow-none flex-1 sm:flex-none sm:min-35 h-9 lg:h-10">
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

        <div className="flex-1 w-full overflow-hidden">
          {adminTargetData && (
            <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
              <BarChart data={adminTargetData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: "#94A3B8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: "#94A3B8" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "2px solid #e2e8f0", backgroundColor: "#fff", color: "#1e293b", padding: "10px", boxShadow: "none" }}
                  cursor={{ fill: "#f8fafc" }}
                  itemStyle={{ color: "#1e293b", fontSize: "9px", fontWeight: 900, padding: 0, textTransform: "uppercase" }}
                  labelStyle={{ color: "#94a3b8", opacity: 1, fontSize: "7px", fontWeight: 900, marginBottom: "4px", textTransform: "uppercase" }}
                />
                <Bar dataKey="tercapai" name="Tercapai" fill="var(--color-jade-600)" radius={[5, 5, 0, 0]} barSize={28} />
                <Bar dataKey="tidakTercapai" name="Tidak Tercapai" fill="#f43f5e" radius={[5, 5, 0, 0]} barSize={28} />
                <Bar dataKey="terlampaui" name="Terlampaui" fill="var(--color-primary-500)" radius={[5, 5, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-slate-300 p-5 lg:p-6 flex flex-col relative min-h-87.5 transition-all duration-500 overflow-hidden shadow-none mt-2">
        {loadingAdminAvgSabaq && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Memuat...</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0 w-full relative z-30">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Rata-rata Sabaq Santri</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Rata-rata volume setoran sabaq per periode</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start xl:justify-end w-full xl:w-auto">
            <div
              className="relative flex items-center bg-white px-3 lg:px-4 rounded-xl border-2 border-slate-300 shadow-none ring-1 ring-white h-9 gap-1.5 focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/period cursor-pointer w-full sm:w-auto sm:min-w-32"
              onClick={() => setShowAvgSabaqPeriodDropdown(!showAvgSabaqPeriodDropdown)}
            >
              <div className="flex items-center justify-between w-full h-full">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 pointer-events-none truncate pr-4">
                  {adminAvgSabaqPeriod === "weekly" ? "MINGGUAN" : adminAvgSabaqPeriod === "monthly" ? "BULANAN" : adminAvgSabaqPeriod === "3months" ? "3 BULANAN" : adminAvgSabaqPeriod === "6months" ? "SEMESTERAN" : "TAHUNAN"}
                </span>
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-300 pointer-events-none group-hover/period:text-emerald-500 transition-all ${showAvgSabaqPeriodDropdown ? "rotate-180 text-emerald-500" : ""}`}
                />
              </div>

              {showAvgSabaqPeriodDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvgSabaqPeriodDropdown(false);
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
                        className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[8px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${adminAvgSabaqPeriod === opt.value ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdminAvgSabaqPeriod(opt.value as any);
                          setShowAvgSabaqPeriodDropdown(false);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 bg-[#226649] p-1 rounded-xl shadow-none h-9 w-full sm:w-auto min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (adminAvgSabaqPeriod === "weekly") setAdminAvgSabaqWeekOffset((prev) => prev - 1);
                  else if (adminAvgSabaqPeriod === "monthly") {
                    if (adminAvgSabaqMonth === 0) {
                      setAdminAvgSabaqMonth(11);
                      setAdminAvgSabaqYear((prev) => prev - 1);
                    } else setAdminAvgSabaqMonth((prev) => prev - 1);
                  } else if (adminAvgSabaqPeriod === "3months") {
                    setAdminAvgSabaqMonth((prev) => {
                      if (prev < 3) {
                        setAdminAvgSabaqYear((y) => y - 1);
                        return prev + 12 - 3;
                      }
                      return prev - 3;
                    });
                  } else if (adminAvgSabaqPeriod === "6months") {
                    setAdminAvgSabaqMonth((prev) => {
                      if (prev < 6) {
                        setAdminAvgSabaqYear((y) => y - 1);
                        return 11;
                      }
                      return 5;
                    });
                  } else if (adminAvgSabaqPeriod === "yearly") setAdminAvgSabaqYear((prev) => prev - 1);
                }}
                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <div className="flex-1 px-1 text-[7.5px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 min-w-0 overflow-hidden">
                <Calendar className="w-2.5 h-2.5 opacity-60 shrink-0" />
                <span className="truncate text-[6.5px] lg:text-[7.5px]">
                  {(() => {
                    if (adminAvgSabaqPeriod === "weekly") {
                      const today = new Date();
                      const day = today.getDay();
                      const diff = (day === 0 ? -6 : 1) - day + adminAvgSabaqWeekOffset * 7;
                      const start = new Date(today);
                      start.setDate(today.getDate() + diff);
                      const end = new Date(start);
                      const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                      end.setDate(start.getDate() + rangeLength);
                      return `${start.getDate()} ${start.toLocaleDateString("id-ID", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`.toUpperCase();
                    }
                    if (adminAvgSabaqPeriod === "monthly") return new Date(adminAvgSabaqYear, adminAvgSabaqMonth).toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase();
                    if (adminAvgSabaqPeriod === "3months") {
                      const end = new Date(adminAvgSabaqYear, adminAvgSabaqMonth + 1, 0);
                      const start = new Date(adminAvgSabaqYear, adminAvgSabaqMonth - 2, 1);
                      return `${start.toLocaleDateString("id-ID", { month: "short", year: "numeric" })} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`.toUpperCase();
                    }
                    if (adminAvgSabaqPeriod === "6months") {
                      const isH1 = adminAvgSabaqMonth < 6;
                      const start = isH1 ? new Date(adminAvgSabaqYear, 0, 1) : new Date(adminAvgSabaqYear, 6, 1);
                      const end = isH1 ? new Date(adminAvgSabaqYear, 5, 30) : new Date(adminAvgSabaqYear, 11, 31);
                      return `${start.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase()} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase()}`;
                    }
                    if (adminAvgSabaqPeriod === "yearly") return adminAvgSabaqYear.toString();
                    return new Date(adminAvgSabaqYear, adminAvgSabaqMonth).toLocaleDateString("id-ID", { month: "short", year: "numeric" }).toUpperCase();
                  })()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (adminAvgSabaqPeriod === "weekly") setAdminAvgSabaqWeekOffset((prev) => prev + 1);
                  else if (adminAvgSabaqPeriod === "monthly") {
                    if (adminAvgSabaqMonth === 11) {
                      setAdminAvgSabaqMonth(0);
                      setAdminAvgSabaqYear((prev) => prev + 1);
                    } else setAdminAvgSabaqMonth((prev) => prev + 1);
                  } else if (adminAvgSabaqPeriod === "3months") {
                    setAdminAvgSabaqMonth((prev) => {
                      if (prev > 8) {
                        setAdminAvgSabaqYear((y) => y + 1);
                        return prev - 12 + 3;
                      }
                      return prev + 3;
                    });
                  } else if (adminAvgSabaqPeriod === "6months") {
                    setAdminAvgSabaqMonth((prev) => {
                      if (prev < 6) return 11;
                      setAdminAvgSabaqYear((y) => y + 1);
                      return 5;
                    });
                  } else if (adminAvgSabaqPeriod === "yearly") setAdminAvgSabaqYear((prev) => prev + 1);
                }}
                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full overflow-hidden mt-4">
          {adminAvgSabaqData && (
            <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
              <LineChart data={adminAvgSabaqData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 900 }} tickLine={false} axisLine={false} dy={8} interval={adminAvgSabaqPeriod === "weekly" ? 0 : adminAvgSabaqPeriod === "monthly" ? 2 : 0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 900 }} tickLine={false} axisLine={false} dx={-5} allowDecimals={true} />
                <Tooltip
                  cursor={{ stroke: "#f1f5f9", strokeWidth: 2 }}
                  contentStyle={{ borderRadius: "12px", border: "2px solid #e2e8f0", backgroundColor: "#fff", color: "#1e293b", padding: "10px", boxShadow: "none" }}
                  itemStyle={{ color: "#1e293b", fontSize: "9px", fontWeight: 900, padding: 0, textTransform: "uppercase" }}
                  labelStyle={{ color: "#94a3b8", opacity: 1, fontSize: "7px", fontWeight: 900, marginBottom: "4px", textTransform: "uppercase" }}
                />
                <Line
                  type="monotone"
                  dataKey="avgSabaq"
                  name="Rata-rata Volume (Baris/Hal)"
                  stroke="var(--color-jade-600)"
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "var(--color-jade-600)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <PendingManzilModal isOpen={isPendingManzilModalOpen} onClose={() => setIsPendingManzilModalOpen(false)} students={students} halaqahs={halaqahs} allUsers={allUsers} doneIds={adminStats?.manzilDoneIds || []} />
    </div>
  );
};
