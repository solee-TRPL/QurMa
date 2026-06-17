import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, Student, MemorizationRecord, MemorizationType, Halaqah, WeeklyTarget, UserRole } from "../../types";
import { getStudents, getTenantRecords, getHalaqahs, getUsers, getTenant, updateTenant, getWeeklyTargetsInRange } from "../../services/dataService";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import { BookOpen, Calendar, Search, ChevronDown, Activity, Users, User, ArrowRight, TrendingUp, ChevronRight, Target, Plus, Trash2, HelpCircle, X, Save, AlertTriangle, GraduationCap, Clock, Crosshair } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { Tenant } from "../../types";
import ExcelJS from "exceljs";
import { useLoading } from "../../lib/LoadingContext";
import { useNotification } from "../../lib/NotificationContext";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Download } from "lucide-react";

// Convert total baris to Juz + remaining halaman
// 1 halaman = 15 baris, 1 juz = 20 halaman = 300 baris
const BARIS_PER_HAL = 15;
const HAL_PER_JUZ = 20;
const BARIS_PER_JUZ = BARIS_PER_HAL * HAL_PER_JUZ; // 300

function barisToJuzHalaman(totalBaris: number): { juz: number; halaman: number; sisa: number } {
  const juz = Math.floor(totalBaris / BARIS_PER_JUZ);
  const remainingBaris = totalBaris % BARIS_PER_JUZ;
  const halaman = Math.floor(remainingBaris / BARIS_PER_HAL);
  const sisa = remainingBaris % BARIS_PER_HAL;
  return { juz, halaman, sisa };
}

function formatSabaqDisplay(totalBaris: number): string {
  if (totalBaris <= 0) return "-";
  const { juz, halaman } = barisToJuzHalaman(totalBaris);
  if (juz === 0) return `${halaman} Hal`;
  if (halaman === 0) return `${juz} Juz`;
  return `${juz} Juz ${halaman} Hal`;
}

function formatSabaqExport(totalBaris: number): string {
  if (totalBaris <= 0) return "-";
  const { juz, halaman } = barisToJuzHalaman(totalBaris);
  if (juz === 0) return `${halaman} Halaman`;
  if (halaman === 0) return `${juz} Juz`;
  return `${juz} Juz ${halaman} Halaman`;
}

// --- Sub Component: Manage Target Info Modal ---
interface ManageTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSave: (info: { label: string; value: string }[]) => Promise<void>;
  isReadOnly?: boolean;
}

const ManageTargetInfoModal: React.FC<ManageTargetModalProps> = ({ isOpen, onClose, tenant, onSave, isReadOnly = false }) => {
  const [infoList, setInfoList] = useState<{ label: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; index: number | null }>({ show: false, index: null });

  useEffect(() => {
    if (isOpen && tenant?.curriculum_config?.target_info) {
      setInfoList(tenant.curriculum_config.target_info);
    } else if (isOpen) {
      // Default if empty
      setInfoList([
        { label: "Kelas 1 - 2", value: "3 Baris" },
        { label: "Kelas 3 - 4", value: "5 Baris" },
        { label: "Kelas 5 - 6", value: "7 Baris" },
      ]);
    }
  }, [isOpen, tenant]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setInfoList([...infoList, { label: "", value: "" }]);
  };

  const handleConfirmDelete = (index: number) => {
    setDeleteConfirm({ show: true, index });
  };

  const executeDelete = () => {
    if (deleteConfirm.index !== null) {
      setInfoList(infoList.filter((_, i) => i !== deleteConfirm.index));
    }
    setDeleteConfirm({ show: false, index: null });
  };

  const handleUpdateItem = (index: number, field: "label" | "value", value: string) => {
    const newList = [...infoList];
    newList[index][field] = value;
    setInfoList(newList);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(infoList);
      onClose();
    } catch (error) {
      console.error("Error saving target info:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 lg:pl-64 pt-16" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-none w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-slate-300 flex flex-col max-h-[90vh] md:max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-2.5 border-b border-slate-50 rounded-xl flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 uppercase flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-jade-500" />
              Target Hafalan
            </h3>
            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Acuan Standar Hafalan Santri</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-4 overflow-y-auto custom-scrollbar space-y-3 md:space-y-4 max-h-75 md:max-h-90">
          <div className="space-y-2.5 md:space-y-3">
            {infoList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 md:gap-2 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex-1 space-y-0.5 md:space-y-1">
                  <label className="text-[7.5px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Keterangan</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(idx, "label", e.target.value)}
                    placeholder="Penerima..."
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border-2 border-slate-300 rounded-xl bg-white text-[13px] font-bold focus:border-jade-400 transition-all outline-none shadow-none placeholder:text-slate-300`}
                  />
                </div>
                <div className="flex-1 space-y-0.5 md:space-y-1">
                  <label className="text-[7.5px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target</label>
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleUpdateItem(idx, "value", e.target.value)}
                    placeholder="Target..."
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border-2 border-slate-300 rounded-xl bg-white text-[13px] font-bold focus:border-jade-400 transition-all outline-none shadow-none placeholder:text-slate-300`}
                  />
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => handleConfirmDelete(idx)}
                    className="mt-6 p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90 shadow-none border-2 border-red-100 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-4 border-t border-slate-100 bg-white flex items-center gap-2 md:gap-3">
          {isReadOnly ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-800 text-white rounded-xl text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 shadow-xl shadow-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Tutup
            </button>
          ) : (
            <>
              <button
                onClick={handleAddItem}
                className="flex-1 py-3 bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl border-2 border-red-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 shadow-none transition-all active:scale-95 text-center"
              >
                Batal
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-jade-600 text-white rounded-xl border-2 border-jade-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-jade-700 shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 min-22.5"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                <span>SIMPAN</span>
              </button>
            </>
          )}
        </div>

        <ConfirmModal
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, index: null })}
          onConfirm={executeDelete}
          title="Hapus Target?"
          confirmLabel="YA, HAPUS TARGET"
          variant="danger"
          message={
            <span>
              Hapus target <strong>{infoList[deleteConfirm.index!]?.label || "ini"}</strong>?<span className="text-red-600 font-bold block mt-2 text-[10px]">Tindakan ini permanen dan tidak dapat dibatalkan.</span>
            </span>
          }
        />
      </div>
    </div>
  );
};

export const MonitorHafalan: React.FC<{ user: UserProfile; tenantId: string }> = ({ user, tenantId }) => {
  // 1. State for Date Range (Default: Last 30 days)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
  }, []);

  const [students, setStudents] = useState<Student[]>([]);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"nis" | "sabaq" | "sabqi" | "manzil">("nis");
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [showHalaqahDropdown, setShowHalaqahDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showNisMobile, setShowNisMobile] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPaginationDropdown, setShowPaginationDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  const [selectedMonth, setSelectedMonth] = useState<string>("custom");

  const monthOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return monthNames.map((name, index) => {
      const m = String(index + 1).padStart(2, "0");
      return { value: `${currentYear}-${m}`, label: name.toUpperCase() };
    });
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId, startDate, endDate]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedHalaqahId, selectedGender, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allStudents, allHalaqahs, allUsers, currentTenant] = await Promise.all([getStudents(tenantId), getHalaqahs(tenantId), getUsers(tenantId), getTenant(tenantId)]);

      setStudents(allStudents);

      const enrichedHalaqahs = allHalaqahs.map((h) => {
        const teacher = allUsers.find((u) => u.id === h.teacher_id);
        return { ...h, teacher_name: teacher?.full_name || "-" };
      });
      setHalaqahs(enrichedHalaqahs);
      setTeachers(allUsers);
      setTenant(currentTenant);

      if (allStudents.length > 0) {
        const studentIds = allStudents.map((s) => s.id);
        const [recs, targets] = await Promise.all([getTenantRecords(studentIds, startDate, endDate), getWeeklyTargetsInRange(studentIds, startDate, endDate)]);
        setRecords(recs);
        setWeeklyTargets(targets);
      }
    } catch (error) {
      console.error("[MonitorHafalan] Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTargetInfo = async (infoList: { label: string; value: string }[]) => {
    if (!tenantId || !user) return;
    try {
      const updates = {
        curriculum_config: {
          ...(tenant?.curriculum_config || {}),
          target_info: infoList,
        },
      };
      const updatedTenant = await updateTenant(tenantId, updates, user);
      setTenant(updatedTenant);
    } catch (error) {
      console.error("Failed to save target info:", error);
      throw error;
    }
  };

  // 2. Data Aggregation per Student
  const studentStats = students.map((student) => {
    const studentRecords = records.filter((r) => r.student_id === student.id);
    const halaqah = halaqahs.find((h) => h.id === student.halaqah_id);
    const currentTeacherId = halaqah?.teacher_id;
    const pengampu = teachers.find((t) => t.id === currentTeacherId);

    let sabaqBaris = 0;

    // Get the latest weekly target to get Juz info
    const studentTargets = weeklyTargets.filter((t) => t.student_id === student.id);
    const latestTarget = studentTargets.length > 0 ? studentTargets[0] : null; // Sorted by week_start DESC in service
    const juzValue = latestTarget?.target_data?.current_juz ?? student.current_juz ?? null;
    const pageValue = student.current_page ?? null;
    const totalJuz = juzValue != null ? `${juzValue}` : "-";
    const totalPage = pageValue != null && pageValue > 0 ? `${pageValue}` : null;

    const sakitDates = new Set<string>();
    const izinDates = new Set<string>();
    const alpaDates = new Set<string>();

    studentRecords.forEach((r) => {
      const amount = Number(r.ayat_end || r.jumlah || 0);
      if (r.type === MemorizationType.SABAQ) sabaqBaris += amount;
      
      if (r.status === "SAKIT") sakitDates.add(r.record_date);
      else if (r.status === "IZIN") izinDates.add(r.record_date);
      else if (r.status === "ALPA") alpaDates.add(r.record_date);
    });

    const sakit = sakitDates.size;
    const izin = izinDates.size;
    const alpa = alpaDates.size;

    return {
      ...student,
      halaqahName: halaqah?.name || "Belum Ada",
      teacherName: pengampu?.full_name || halaqah?.teacher_name || "-",
      teacherId: currentTeacherId || "none",
      sabaqBaris,
      totalJuz,
      totalPage,
      sakit,
      izin,
      alpa,
    };
  });

  const filteredAndSortedStats = studentStats
    .filter((s) => {
      const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHalaqah = selectedHalaqahId === "all" || s.halaqah_id === selectedHalaqahId;
      const matchesGender = selectedGender === "all" || s.gender === selectedGender;
      return matchesSearch && matchesHalaqah && matchesGender;
    })
    .sort((a, b) => {
      if (sortBy === "sabaq") return b.sabaqBaris - a.sabaqBaris;
      return (a.nis || "").localeCompare(b.nis || "");
    });

  const totalPages = Math.ceil(filteredAndSortedStats.length / itemsPerPage);
  const paginatedStats = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStats.slice(start, start + itemsPerPage);
  }, [filteredAndSortedStats, currentPage, itemsPerPage]);

  const handleExport = async () => {
    setGlobalLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Monitor Hafalan");

      // Styling
      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      const cellStyle: Partial<ExcelJS.Style> = {
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
        alignment: { horizontal: "center" },
      };

      // Define columns
      worksheet.columns = [
        { header: "No", key: "no", width: 8 },
        { header: "NIS", key: "nis", width: 15 },
        { header: "Nama Santri", key: "name", width: 40 },
        { header: "Gender", key: "gender", width: 15 },
        { header: "Halaqah", key: "halaqah", width: 25 },
        { header: "Pengampu", key: "teacher", width: 25 },
        { header: "Sakit", key: "sakit", width: 10 },
        { header: "Izin", key: "izin", width: 10 },
        { header: "Alpa", key: "alpa", width: 10 },
        { header: "Sabaq (Juz + Halaman)", key: "sabaq", width: 25 },
        { header: "Total Hafalan (Juz + Halaman)", key: "total", width: 30 },
      ];

      // Apply header style
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Add rows
      filteredAndSortedStats.forEach((stat, index) => {
        const row = worksheet.addRow({
          no: index + 1,
          nis: stat.nis || "-",
          name: stat.full_name,
          gender: stat.gender === "L" ? "Laki-laki" : stat.gender === "P" ? "Perempuan" : "-",
          halaqah: stat.halaqahName,
          teacher: stat.teacherName,
          sabaq: formatSabaqExport(stat.sabaqBaris),
          total: (() => {
            const juz = Number(stat.totalJuz) || 0;
            const hal = Number(stat.totalPage) || 0;
            if (juz === 0 && hal === 0) return "-";
            if (juz === 0) return `${hal} Halaman`;
            if (hal === 0) return `${juz} Juz`;
            return `${juz} Juz ${hal} Halaman`;
          })(),
          sakit: stat.sakit,
          izin: stat.izin,
          alpa: stat.alpa,
        });
        row.eachCell((cell) => {
          cell.style = cellStyle;
        });
        row.getCell("name").alignment = { horizontal: "left" };
        row.getCell("halaqah").alignment = { horizontal: "left" };
        row.getCell("teacher").alignment = { horizontal: "left" };
      });

      // Summary info at top
      worksheet.insertRow(1, []);
      worksheet.insertRow(1, [`LAPORAN MONITOR HAFALAN SANTRI (${startDate} s/d ${endDate})`]);
      worksheet.mergeCells("A1:K1");
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Monitor_Hafalan_${startDate}_to_${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      addNotification({ type: "success", title: "Berhasil", message: "Laporan Monitor Hafalan berhasil diunduh." });
    } catch (error) {
      console.error("Export error:", error);
      addNotification({ type: "error", title: "Gagal", message: "Terjadi kesalahan saat mengekspor data." });
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 md:gap-3 animate-fade-in pb-12">
      {/* Premium Multi-Row Filter Bar */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 md:gap-2 py-3 bg-white w-full sticky top-0 z-100 border-b border-slate-100 lg:border-none lg:static lg:py-0">
        {/* --- BARIS 1 (Mobile) / ROW 1 (Desktop) --- */}

        {/* 1. Halaqah Selector */}
        <div className="order-1 lg:order-1 flex-1 lg:flex-none flex items-center gap-2.5 md:gap-3 bg-white pt-2 md:pt-2 pb-2 md:pb-2 pl-4.5 pr-4.5 rounded-xl border-2 border-slate-300 shadow-none lg:min-w-85 focus-within:ring-4 focus-within:ring-jade-50/50 focus-within:border-jade-400 transition-all relative cursor-pointer" onClick={() => setShowHalaqahDropdown(!showHalaqahDropdown)}>
          <div className="p-1.5 bg-primary-500 rounded-lg text-white shrink-0">
            <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <div className="flex-1 flex flex-col justify-center relative group/sel-unified min-w-0 h-full">
            <p className="text-[7.5px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 mt-0.5">Halaqoh / Pengampu</p>
            <div className="relative mt-0.5">
              <div className="flex items-center justify-between w-full pr-1">
                <span className="bg-transparent text-[9px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight truncate pointer-events-none leading-none">
                  {selectedHalaqahId === "all"
                    ? "SEMUA HALAQAH"
                    : (() => {
                        const h = halaqahs.find((h) => h.id === selectedHalaqahId);
                        return h ? `${h.name.toUpperCase()} / ${h.teacher_name?.toUpperCase() || "-"}` : "PILIH HALAQAH";
                      })()}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 pointer-events-none group-hover/sel-unified:text-primary-500 transition-all ${showHalaqahDropdown ? "rotate-180 text-primary-500" : ""}`} />
              </div>

              {showHalaqahDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHalaqahDropdown(false);
                    }}
                  />
                  <div className="absolute top-[calc(100%+8px)] -left-4.5 -right-4.5 bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                    <div
                      className={`px-2 md:px-3 py-2 md:py-2.5 border-b border-slate-200 last:border-0 text-[8.5px] md:text-[10px] font-black tracking-tight md:tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors truncate ${selectedHalaqahId === "all" ? "text-primary-600 bg-primary-50" : "text-slate-600"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHalaqahId("all");
                        setShowHalaqahDropdown(false);
                      }}
                      title="SEMUA HALAQAH"
                    >
                      SEMUA HALAQAH
                    </div>
                    {halaqahs.map((h) => (
                      <div
                        key={h.id}
                        className={`px-2 md:px-3 py-2 md:py-2.5 border-b border-slate-200 last:border-0 text-[8.5px] md:text-[10px] font-black tracking-tight md:tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors truncate ${selectedHalaqahId === h.id ? "text-primary-600 bg-primary-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHalaqahId(h.id);
                          setShowHalaqahDropdown(false);
                        }}
                        title={`${h.name.toUpperCase()} / ${h.teacher_name?.toUpperCase() || "-"}`}
                      >
                        {h.name.toUpperCase()} / {h.teacher_name?.toUpperCase() || "-"}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Search Input */}
        <div className="order-8 lg:order-2 relative flex-1 lg:flex-1 group h-10 lg:h-11 min-35">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-500 transition-colors" />
          <input
            type="text"
            placeholder="CARI SANTRI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[9.5px] font-black uppercase tracking-widest placeholder:text-slate-300 outline-none shadow-none"
          />
        </div>

        {/* BREAK 1 (After Row 1 on Mobile) */}
        <div className="w-full lg:hidden order-4 h-0" />

        {/* --- BARIS 2 (Mobile) / ROW 2 (Desktop Hybrid) --- */}

        {/* 6. Month Selector - Order 5 on mobile */}
        <div className="order-5 lg:order-6 relative h-10 lg:h-11 flex-none w-27.5 lg:w-auto lg:min-35 flex items-center px-3 lg:px-4 bg-white border-2 border-slate-300 rounded-xl shadow-none group/month transition-all lg:ml-auto cursor-pointer" onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
          <Calendar className="w-3.5 h-3.5 text-jade-500 mr-1.5 lg:mr-2 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between w-full">
              <span className="bg-transparent text-[8.5px] lg:text-[9px] font-black text-slate-700 uppercase tracking-widest pointer-events-none truncate pr-4">
                {selectedMonth === "custom" ? "BULAN" : monthOptions.find((m) => m.value === selectedMonth)?.label || "BULAN"}
              </span>
              <ChevronDown
                className={`absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/month:text-jade-500 transition-all ${showMonthDropdown ? "rotate-180 text-jade-500" : ""}`}
              />
            </div>

            {showMonthDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMonthDropdown(false);
                  }}
                />
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                  <div
                    className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${selectedMonth === "custom" ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMonth("custom");
                      setShowMonthDropdown(false);
                    }}
                  >
                    BULAN
                  </div>
                  {monthOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${selectedMonth === opt.value ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMonth(opt.value);
                        if (opt.value !== "custom") {
                          const [y, m] = opt.value.split("-").map(Number);
                          const firstDay = new Date(y, m - 1, 1);
                          const lastDay = new Date(y, m, 0);
                          setStartDate(firstDay.toISOString().split("T")[0]);
                          setEndDate(lastDay.toISOString().split("T")[0]);
                        }
                        setShowMonthDropdown(false);
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 7. Date Range Group - Order 6 on mobile */}
        <div className="order-6 lg:order-7 flex items-center gap-1 shrink-0 h-10 lg:h-11 flex-1 lg:flex-none">
          <div className="relative h-full flex-1 lg:flex-none lg:min-31.25 flex justify-center items-center px-2 md:px-4 bg-white border-2 border-slate-300 rounded-xl shadow-none transition-all">
            <CustomDatePicker
              value={startDate}
              align="center"
              className="static w-full h-full"
              onChange={(val) => {
                setStartDate(val);
                setSelectedMonth("custom");
                if (val >= endDate) {
                  const nextDay = new Date(val);
                  nextDay.setDate(nextDay.getDate() + 1);
                  setEndDate(nextDay.toISOString().split("T")[0]);
                }
              }}
            />
          </div>

          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />

          <div className="relative h-full flex-1 lg:flex-none lg:min-31.25 flex justify-center items-center px-2 md:px-4 bg-white border-2 border-slate-300 rounded-xl shadow-none transition-all">
            <CustomDatePicker
              value={endDate}
              align="none"
              className="static w-full h-full"
              modalClassName="right-0 left-auto translate-x-0 md:left-1/2 md:right-auto md:-translate-x-1/2 lg:right-0 lg:left-auto lg:translate-x-0"
              onChange={(val) => {
                setEndDate(val);
                setSelectedMonth("custom");
                if (val <= startDate) {
                  const prevDay = new Date(val);
                  prevDay.setDate(prevDay.getDate() - 1);
                  setStartDate(prevDay.toISOString().split("T")[0]);
                }
              }}
            />
          </div>
        </div>

        {/* BREAK 2 (After Row 2 on Mobile) */}
        <div className="w-full lg:hidden order-7 h-0" />

        {/* --- BARIS 3 (Mobile) / ROW 1 & 2 (Desktop Hybrid) --- */}

        {/* 3. Manage Target Button - Order 2 on mobile */}
        <button
          onClick={() => setIsManageModalOpen(true)}
          className="order-2 lg:order-3 h-10 lg:h-11 w-10 lg:w-11 bg-jade-600 border-2 border-jade-600 rounded-xl text-white hover:bg-jade-700 transition-all flex items-center justify-center group shrink-0 shadow-none"
          title="Kelola Target"
        >
          <Crosshair className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* 4. Export Button - Order 3 on mobile */}
        {user.role !== UserRole.SUPERVISOR && (
          <button
            onClick={handleExport}
            className="order-3 lg:order-4 h-10 lg:h-11 px-3 md:px-4 bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all flex items-center justify-center gap-2 group shrink-0 shadow-none"
            title="Ekspor Excel"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">EKSPOR</span>
          </button>
        )}

        {/* BREAK for Desktop (Row 1 Ends) */}
        <div className="hidden lg:block w-full lg:order-4 h-0" />

        {/* 5. Gender Selector - Order 9 on mobile */}
        <div className="order-9 lg:order-5 flex-none flex items-center justify-end lg:justify-start">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-300 px-3 py-2 rounded-xl shadow-none h-10 lg:h-11 group/gender min-25 lg:min-30 relative cursor-pointer" onClick={() => setShowGenderDropdown(!showGenderDropdown)}>
            <User className="w-3.5 h-3.5 text-blue-500 mr-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between w-full">
                <span className="bg-transparent text-[8.5px] lg:text-[9px] font-black text-slate-700 uppercase tracking-widest pointer-events-none truncate pr-4">
                  {selectedGender === "all" ? "GENDER" : selectedGender === "L" ? "PUTRA" : "PUTRI"}
                </span>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/gender:text-blue-500 transition-all ${showGenderDropdown ? "rotate-180 text-blue-500" : ""}`} />
              </div>

              {showGenderDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGenderDropdown(false);
                    }}
                  />
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                    {[
                      { value: "all", label: "GENDER" },
                      { value: "L", label: "PUTRA" },
                      { value: "P", label: "PUTRI" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${selectedGender === opt.value ? "text-blue-600 bg-blue-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGender(opt.value);
                          setShowGenderDropdown(false);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-none border-2 border-slate-300 overflow-hidden flex flex-col">
        {/* Table Section */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th
                  rowSpan={2}
                  className="hidden md:table-cell w-7.5 min-w-7.5 md:w-11.25 md:min-w-11.25 sticky left-0 bg-slate-300 z-20 px-1 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-l border-slate-400"
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  className={`${showNisMobile ? "table-cell" : "hidden"} md:table-cell w-19 min-w-19 md:w-25 md:min-w-25 sticky left-0 md:left-11.25 bg-slate-300 z-20 px-1 md:px-3 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-l border-slate-400`}
                >
                  NIS
                </th>
                <th
                  rowSpan={2}
                  className={`w-28.75 min-w-28.75 max-w-28.75 md:w-45 md:min-w-45 md:max-w-none sticky ${showNisMobile ? "left-19" : "left-0"} md:left-36.25 bg-slate-300 z-20 px-2 md:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-left border-t border-b border-r border-l border-slate-400`}
                >
                  NAMA SANTRI
                </th>
                <th rowSpan={2} className="hidden md:table-cell px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-r border-slate-400 bg-slate-300 min-60">
                  HALAQOH ( <span className="text-jade-600">PENGAMPU</span> )
                </th>
                <th colSpan={3} className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-rose-700 uppercase tracking-widest text-center border-t border-b border-r border-slate-400 bg-rose-50">
                  KETIDAKHADIRAN
                </th>
                <th colSpan={2} className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center border-t border-b border-slate-400 bg-emerald-50">
                  HAFALAN
                </th>
              </tr>
              <tr className="bg-white">
                <th className="px-1 py-3 text-[8.5px] lg:text-[9.5px] font-black text-blue-600 uppercase text-center border-b border-r border-slate-400 bg-blue-50/50 w-8 md:w-12">S</th>
                <th className="px-1 py-3 text-[8.5px] lg:text-[9.5px] font-black text-indigo-600 uppercase text-center border-b border-r border-slate-400 bg-indigo-50/50 w-8 md:w-12">I</th>
                <th className="px-1 py-3 text-[8.5px] lg:text-[9.5px] font-black text-rose-600 uppercase text-center border-b border-r border-slate-400 bg-rose-50/50 w-8 md:w-12">A</th>
                <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-emerald-600 uppercase text-center border-b border-r border-slate-400 bg-emerald-50/50 w-21.25 md:min-25">SABAQ<br/></th>
                <th className="px-2 py-3 text-[8.5px] lg:text-[9.5px] font-black text-amber-600 uppercase text-center border-b border-slate-400 bg-amber-50/50 w-22.5 md:min-30">TOTAL JUZ</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="hidden md:table-cell sticky left-0 bg-white border-r border-b border-slate-100 w-7.5 min-w-7.5 md:w-11.25 md:min-w-11.25">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </td>
                    <td className={`${showNisMobile ? "table-cell" : "hidden"} md:table-cell sticky left-0 md:left-11.25 bg-white border-r border-b border-slate-100 w-19 min-w-19 md:w-25 md:min-w-25`}>
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </td>
                    <td className={`sticky ${showNisMobile ? "left-19" : "left-0"} md:left-36.25 bg-white border-r border-b border-slate-100 w-28.75 min-w-28.75 max-w-28.75 md:w-45 md:min-w-45 md:max-w-none`}>
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 border-r border-b border-slate-100">
                      <Skeleton className="h-4 w-40 mx-auto" />
                    </td>
                    <td className="px-2 py-4 border-r border-b border-slate-100">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </td>
                    <td className="px-2 py-4 border-r border-b border-slate-100">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </td>
                    <td className="px-2 py-4 border-r border-b border-slate-100">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </td>
                    <td className="px-4 py-4 border-r border-b border-slate-100">
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </td>
                    <td className="px-4 py-4 border-b border-slate-100">
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedStats.length > 0 ? (
                paginatedStats.map((stat, index) => (
                  <tr key={stat.id} className="group transition-colors hover:bg-slate-50/30">
                    <td className="hidden md:table-cell sticky left-0 bg-white px-1 py-4 text-[10px] md:text-[10.5px] font-black text-slate-400 text-center border-r border-b border-slate-100 z-20 group-hover:bg-slate-50 transition-colors uppercase w-7.5 min-w-7.5 md:w-11.25 md:min-w-11.25">
                      {String((currentPage - 1) * itemsPerPage + index + 1)}
                    </td>
                    <td
                      className={`${showNisMobile ? "table-cell" : "hidden"} md:table-cell sticky left-0 md:left-11.25 bg-white px-1 md:px-3 py-4 text-[9.5px] md:text-[10.5px] font-black text-slate-500 text-center border-r border-b border-slate-100 z-20 group-hover:bg-slate-50 transition-colors tracking-normal w-19 min-w-19 md:w-25 md:min-w-25`}
                    >
                      {stat.nis || "-"}
                    </td>
                    <td
                      className={`sticky ${showNisMobile ? "left-19" : "left-0"} md:left-36.25 bg-white px-2 py-4 text-[10.5px] md:text-[11px] font-bold text-slate-800 border-r border-b border-slate-100 z-20 group-hover:bg-slate-50 transition-colors whitespace-normal wrap-break-words leading-tight md:whitespace-nowrap md:truncate w-28.75 min-w-28.75 max-w-28.75 md:w-45 md:min-w-45 md:max-w-none`}
                    >
                      <span className="capitalize" title={stat.full_name}>
                        {stat.full_name}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-[10px] font-black text-slate-600 text-start border-r border-b border-slate-100 uppercase tracking-tight whitespace-nowrap min-60">
                      <span className="text-slate-800">{stat.halaqahName}</span>
                      <span className="mx-1 text-slate-300 font-bold">(</span>
                      <span className="text-jade-600 font-black">{stat.teacherName}</span>
                      <span className="mx-1 text-slate-300 font-bold">)</span>
                    </td>
                    <td className="px-2 py-4 text-center border-b border-r border-slate-100 bg-blue-50/10">
                      <span className={`text-[11px] font-black ${stat.sakit > 0 ? "text-blue-600" : "text-slate-300"}`}>{stat.sakit > 0 ? stat.sakit : "-"}</span>
                    </td>
                    <td className="px-2 py-4 text-center border-b border-r border-slate-100 bg-indigo-50/10">
                      <span className={`text-[11px] font-black ${stat.izin > 0 ? "text-indigo-600" : "text-slate-300"}`}>{stat.izin > 0 ? stat.izin : "-"}</span>
                    </td>
                    <td className="px-2 py-4 text-center border-b border-r border-slate-100 bg-rose-50/10">
                      <span className={`text-[11px] font-black ${stat.alpa > 0 ? "text-rose-600" : "text-slate-300"}`}>{stat.alpa > 0 ? stat.alpa : "-"}</span>
                    </td>
                    <td className="px-4 py-4 text-center border-r border-b border-slate-100 bg-jade-50/5">
                      {stat.sabaqBaris > 0 ? (() => {
                        const { juz, halaman } = barisToJuzHalaman(stat.sabaqBaris);
                        return (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            {juz > 0 && (
                              <span className="text-[11px] font-black text-jade-700 leading-none whitespace-nowrap">
                                {juz} <span className="text-[9px] font-bold text-jade-400">Juz</span>
                              </span>
                            )}
                            {halaman > 0 && (
                              <span className="text-[10px] font-black text-jade-500 leading-none whitespace-nowrap">
                                {halaman} <span className="text-[8px] font-bold text-jade-400"><span className="md:hidden">Hal</span><span className="hidden md:inline">Halaman</span></span>
                              </span>
                            )}
                            {juz === 0 && halaman === 0 && (
                              <span className="text-[10px] font-black text-jade-500">{'<'} 1 Hal</span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-[11px] font-black text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center border-b border-slate-100 bg-amber-50/5">
                      {!stat.totalJuz || stat.totalJuz === "-" || (stat.totalJuz === "0" && (!stat.totalPage || stat.totalPage === "0")) ? (
                        <span className="text-[10.5px] font-bold text-slate-300 tracking-tight">-</span>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          {stat.totalJuz && stat.totalJuz !== "0" && stat.totalJuz !== "-" && (
                            <span className="text-[11px] font-black text-amber-600 leading-none whitespace-nowrap">
                              {stat.totalJuz} <span className="text-[9px] font-bold text-amber-400">Juz</span>
                            </span>
                          )}
                          {stat.totalPage && stat.totalPage !== "0" && (
                            <span className="text-[9px] font-black text-jade-500 leading-none whitespace-nowrap">
                              {stat.totalPage} <span className="text-[7.5px] font-bold text-jade-400"><span className="md:hidden">Hal</span><span className="hidden md:inline">Halaman</span></span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center border-b border-slate-100 bg-white">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Data Tidak Ditemukan</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredAndSortedStats.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  onClick={() => setShowPaginationDropdown(!showPaginationDropdown)}
                  className="bg-white border-2 border-slate-300 rounded-lg px-2 md:px-3 py-1 flex items-center justify-between gap-1.5 md:gap-2 text-[10px] font-black text-slate-700 outline-none hover:border-slate-400 cursor-pointer shadow-none transition-all select-none min-w-12.5 md:min-w-15"
                >
                  <span>{itemsPerPage}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showPaginationDropdown ? "rotate-180 text-jade-500" : ""}`} />
                </div>

                {showPaginationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPaginationDropdown(false)} />
                    <div className="absolute bottom-[calc(100%+4px)] left-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-99! py-1 min-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {[10, 25, 50, 100].map((val) => (
                        <div
                          key={val}
                          className={`px-3 py-2 text-[10px] font-black cursor-pointer transition-colors text-center ${itemsPerPage === val ? "bg-jade-50 text-jade-600" : "text-slate-600 hover:bg-slate-50"}`}
                          onClick={() => {
                            setItemsPerPage(val);
                            setCurrentPage(1);
                            setShowPaginationDropdown(false);
                          }}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                <span className="hidden sm:inline">DATA</span> {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedStats.length)} <span className="hidden sm:inline text-slate-300">/</span>{" "}
                <span className="text-primary-600 ml-0.5">{filteredAndSortedStats.length}</span>
              </p>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === 1 ? "text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
              </button>

              <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  if (totalPages > 5) {
                    if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                      if (pNum === 2 || pNum === totalPages - 1)
                        return (
                          <span key={pNum} className="text-slate-300 text-[8px] md:text-[10px] font-black">
                            ..
                          </span>
                        );
                      return null;
                    }
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? "bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent"}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === totalPages ? "text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MANAGE MODAL */}
      <ManageTargetInfoModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} tenant={tenant} onSave={handleSaveTargetInfo} isReadOnly={user.role === UserRole.SUPERVISOR} />
    </div>
  );
};
