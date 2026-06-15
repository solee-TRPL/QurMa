import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, Student, Halaqah, Class, WeeklyTarget as WeeklyTargetType } from "../../types";
import { getHalaqahs, getStudents, getClasses, getWeeklyTargets, upsertWeeklyTarget, getWeeklyAllTypeTotals, updateStudent, getTenant, getLatestMemorizationBaselines } from "../../services/dataService";
import { calculateLines, calculatePages, getNextAyah, validateMemorizationSequence, getSequenceScore } from "../../lib/quranUtils";
import { ClipboardList, Calendar, Search, Save, BookOpen, CheckCircle2, XCircle, TrendingUp, AlertCircle, GraduationCap, ChevronRight, ChevronLeft, ChevronDown, Info, Target, HelpCircle, RotateCcw, X, MessageSquare } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { SURAH_DATA } from "../../lib/quranData";
import { useNotification } from "../../lib/NotificationContext";
import { useLoading } from "../../lib/LoadingContext";

interface WeeklyTargetProps {
  user: UserProfile;
  tenantId: string;
  onSetUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>>;
  saveTrigger?: number;
  onSaveSuccess?: () => void;
  isGlobalModalOpen?: boolean;
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
  manzilTarget: string;
  manzilHal: string;
  manzilKet: "A" | "B" | "C" | "";
  sabqiTarget: string;
  sabqiTargetSurat: string;
  sabqiKet: "A" | "B" | "C" | "";
  sabaqTarget: string;
  sabaqTargetSurat: string;
  sabaqKet: "A" | "B" | "C" | "";
  teacherNote: string;
  supervisorNote: string;
  css: string;
}

export const WeeklyTarget: React.FC<WeeklyTargetProps> = ({ user, tenantId, onSetUnsavedChanges, saveTrigger, onSaveSuccess, isGlobalModalOpen, showNotesMode = false, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  // Protect navigation
  useEffect(() => {
    if (onSetUnsavedChanges) onSetUnsavedChanges(isDirty);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, onSetUnsavedChanges]);

  const [myHalaqah, setMyHalaqah] = useState<Halaqah | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetRow>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAtm, setShowAtm] = useState(false);
  const [showNotes, setShowNotes] = useState(showNotesMode);

  useEffect(() => {
    setShowNotes(showNotesMode);
  }, [showNotesMode]);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [weeklyActualTotals, setWeeklyActualTotals] = useState<Record<string, { sabaq: number; sabqi: number; manzil: number }>>({});
  const [latestBaselines, setLatestBaselines] = useState<Record<string, Record<string, any>>>({});
  const [tenant, setTenant] = useState<any>(null);
  const [selectedSupervisorNote, setSelectedSupervisorNote] = useState<{studentName: string, note: string} | null>(null);

  const [openSurahDropdown, setOpenSurahDropdown] = useState<string | null>(null);
  const [surahSearchQuery, setSurahSearchQuery] = useState("");
  const [dropdownCoords, setDropdownCoords] = useState<{top: number, left: number, width: number} | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if ((event.target as Element).closest('.surah-dropdown-menu') || (event.target as Element).closest('.surah-dropdown-container')) {
        return;
      }
      if (openSurahDropdown) {
        setOpenSurahDropdown(null);
        setSurahSearchQuery("");
      }
    };
    
    const handleScroll = (event: Event) => {
      if ((event.target as Element).closest?.('.surah-dropdown-menu')) {
        return;
      }
      if (openSurahDropdown) {
        setOpenSurahDropdown(null);
        setSurahSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openSurahDropdown]);

  const [currentWeekOffset, setCurrentWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get("weekOffset") || "0");
  });

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const activePeriodsStr = JSON.stringify(tenant?.cycle_config?.activePeriods || []);
  const activeDaysStr = JSON.stringify(tenant?.cycle_config?.activeDays || [1, 2, 3, 4, 5]);
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6
    const diff = (day === 0 ? -6 : 1) - day + currentWeekOffset * 7;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    const dates: string[] = [];
    const activePeriods = JSON.parse(activePeriodsStr);
    const activeDays = JSON.parse(activeDaysStr);

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      if (!activeDays.includes(current.getDay())) continue;

      const currentDateStr = getLocalDateString(current);

      let isWithinActiveRange = true;
      if (activePeriods.length > 0) {
        isWithinActiveRange = activePeriods.some((period: any) => {
          const startOk = !period.startDate || currentDateStr >= period.startDate;
          const endOk = !period.endDate || currentDateStr <= period.endDate;
          return startOk && endOk;
        });
      }

      if (isWithinActiveRange) {
        dates.push(currentDateStr);
      }
    }
    return dates;
  }, [currentWeekOffset, activePeriodsStr, activeDaysStr]);

  const weekDisplayRange = useMemo(() => {
    if (weekDates.length === 0) return "";
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[weekDates.length - 1]);
    const startDay = start.getDate().toString().padStart(2, "0");
    const startMonth = start.toLocaleDateString("id-ID", { month: "short" });
    const endDay = end.getDate().toString().padStart(2, "0");
    const endMonth = end.toLocaleDateString("id-ID", { month: "short" });
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
    // When week offset changes, simply fetch new data without altering the URL to avoid full page reloads
    fetchData();
  }, [user.id, weekDates, currentWeekOffset]);

  // ATM Calculation Helpers
  const calculateManzilAtm = (juz: number, hal: number = 0) => {
    if (juz === 1 && hal === 0) return 0;
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
    if (hal <= 0) return "";
    if (hal === 1) return "Rabth";
    if (hal <= 5) return "1";
    if (hal <= 10) return "2";
    if (hal <= 15) return "3";
    if (hal <= 20) return "5";
    return Math.ceil(hal / 5).toString();
  };

  const calculateABCStatus = (achieved: number, target: number): "A" | "B" | "C" | "" => {
    if (target === 0) return "";
    if (achieved > target) return "A";
    if (achieved === target) return "B";
    return "C";
  };

  const fetchData = async (silentLoad: boolean = false) => {
    if (!silentLoad) setLoading(true);
    try {
      const [halaqahData, studentData, classData, tenantData] = await Promise.all([getHalaqahs(user.tenant_id!), getStudents(user.tenant_id!), getClasses(user.tenant_id!), getTenant(user.tenant_id!)]);

      const filteredHalaqah = halaqahData.find((h) => h.teacher_id === user.id);
      const classMap = new Map(classData.map((c) => [c.id, c.name]));

      setMyHalaqah(filteredHalaqah || null);
      setTenant(tenantData);

      if (filteredHalaqah) {
        const hStudents = studentData.filter((s) => s.halaqah_id === filteredHalaqah.id);
        setStudents(hStudents);

        // NEW: Fetch existing targets AND actual weekly totals AND latest baselines
        const [existingTargets, weeklyTotals, baselines] = await Promise.all([
          weekDates.length > 0
            ? getWeeklyTargets(
                hStudents.map((s) => s.id),
                weekDates[0],
              )
            : Promise.resolve([]),
          weekDates.length > 0
            ? getWeeklyAllTypeTotals(
                hStudents.map((s) => s.id),
                weekDates[0],
              )
            : Promise.resolve({}),
          getLatestMemorizationBaselines(hStudents.map((s) => s.id)),
        ]);
        setWeeklyActualTotals(weeklyTotals);
        setLatestBaselines(baselines);
        const targetMap = new Map(existingTargets.map((t) => [t.student_id, t]));

        const initialTargets: Record<string, TargetRow> = {};
        hStudents.forEach((s) => {
          const dbTarget = targetMap.get(s.id);
          const data = dbTarget?.target_data || {};

          // Automatisasi Hafalan Saat Ini (Juz & Hal) dari Posisi Sabaq Terakhir
          const latestSabaq = baselines[s.id]?.sabaq;
          let calculatedJuz = 0;
          let calculatedHal = 0;

          let totalPages = 0;
          if (latestSabaq && latestSabaq.surah_name) {
            totalPages = calculatePages("An-Naba'", 1, latestSabaq.surah_name, latestSabaq.ayat_start || 0);
            calculatedJuz = Math.floor(totalPages / 20);
            calculatedHal = totalPages % 20;

            if (calculatedJuz >= 30) {
              calculatedJuz = 30;
              calculatedHal = 0;
            }
          } else {
            // Fallback jika belum pernah ada sabaq sama sekali
            calculatedJuz = data.current_juz ?? s.current_juz ?? 0;
            calculatedHal = data.current_page ?? s.current_page ?? 0;
          }

          const juz = calculatedJuz;
          const hal = calculatedHal;
          
          let atmJuz = juz;
          let atmHal = hal;

          if (atmHal === 0 && (atmJuz > 0 || totalPages > 0)) {
            atmHal = 20;
          }

          const manzilAtmValue = calculateManzilAtm(atmJuz, hal);
          const hariAtmValue = calculateHariAtm(atmJuz, manzilAtmValue);
          const sabqiAtmValue = calculateSabqiAtm(atmHal);

          const currentClassName = s.class_id ? classMap.get(s.class_id) || "-" : "-";

          initialTargets[s.id] = {
            studentId: s.id,
            nis: s.nis || "-",
            name: s.full_name,
            className: currentClassName,
            hafalanJuz: juz > 0 || hal > 0 || !!latestSabaq ? juz.toString() : "0",
            hafalanHal: juz > 0 || hal > 0 || !!latestSabaq ? hal.toString() : "0",
            manzilAtm: manzilAtmValue > 0 ? manzilAtmValue.toString() : "",
            hariAtm: hariAtmValue > 0 ? hariAtmValue.toString() : "",
            sabqiAtm: sabqiAtmValue,
            manzilTarget: data.manzil_target || "",
            manzilHal: data.manzil_hal?.toString() || "",
            manzilKet: calculateABCStatus(weeklyTotals[s.id]?.manzil || 0, data.manzil_hal || 0),
            sabqiTarget: data.sabqi_target?.toString() || "",
            sabqiTargetSurat: data.sabqi_target_surat || "",
            sabqiKet: calculateABCStatus(weeklyTotals[s.id]?.sabqi || 0, data.sabqi_target || 0),
            sabaqTarget: data.sabaq_target?.toString() || "",
            sabaqTargetSurat: data.sabaq_target_surat || "",
            sabaqKet: calculateABCStatus(weeklyTotals[s.id]?.sabaq || 0, data.sabaq_target || 0),
            teacherNote: data.teacher_note || "",
            supervisorNote: data.supervisor_note || "",
            css: data.css || "",
          };
        });
        setTargets(initialTargets);
        setIsDirty(false);
      }
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Gagal memuat data." });
    } finally {
      if (!silentLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleReset = () => {
    fetchData();
  };

  const handleInputChange = (studentId: string, field: keyof TargetRow, value: string) => {
    setIsDirty(true);
    setTargets((prev) => {
      const studentTargets = { ...prev[studentId], [field]: value };

      // 1. Automation Triggered by Hafalan Juz
      if (field === "hafalanJuz") {
        const juzVal = parseInt(value || "0");
        const halVal = parseInt(studentTargets.hafalanHal || "0");
        
        const atm = calculateManzilAtm(juzVal, halVal);
        const days = calculateHariAtm(juzVal, atm);

        studentTargets.manzilAtm = atm > 0 ? atm.toString() : "";
        studentTargets.hariAtm = days > 0 ? days.toString() : "";
        
        let sabqiHal = halVal;
        if (sabqiHal === 0 && juzVal > 0) sabqiHal = 20;
        studentTargets.sabqiAtm = calculateSabqiAtm(sabqiHal);
      }

      // 2. Automation Triggered by Hafalan Hal (Pages)
      if (field === "hafalanHal") {
        const halVal = parseInt(value || "0");
        const juzVal = parseInt(studentTargets.hafalanJuz || "0");
        
        let sabqiHal = halVal;
        if (sabqiHal === 0 && juzVal > 0) sabqiHal = 20;
        studentTargets.sabqiAtm = calculateSabqiAtm(sabqiHal);
        
        const atm = calculateManzilAtm(juzVal, halVal);
        const days = calculateHariAtm(juzVal, atm);
        studentTargets.manzilAtm = atm > 0 ? atm.toString() : "";
        studentTargets.hariAtm = days > 0 ? days.toString() : "";
      }

      // 3. Automation Triggered by Targets
      if (field === "sabaqTarget") {
        const targetVal = parseInt(value || "0");
        const achievedTotal = weeklyActualTotals[studentId]?.sabaq || 0;
        studentTargets.sabaqKet = calculateABCStatus(achievedTotal, targetVal);
      }
      if (field === "sabqiTarget") {
        const targetVal = parseInt(value || "0");
        const achievedTotal = weeklyActualTotals[studentId]?.sabqi || 0;
        studentTargets.sabqiKet = calculateABCStatus(achievedTotal, targetVal);
      }
      if (field === "manzilHal") {
        const targetVal = parseInt(value || "0");
        const achievedTotal = weeklyActualTotals[studentId]?.manzil || 0;
        studentTargets.manzilKet = calculateABCStatus(achievedTotal, targetVal);
      }

      // 4. Automation for Sabaq (Automatic Line Count)
      if (field === "sabaqTargetSurat") {
        const [endSurah, endAyahStr] = value.split(":");
        const endAyah = parseInt(endAyahStr || "0");
        const baseline = latestBaselines[studentId]?.sabaq;

        if (baseline && endSurah && endAyah > 0) {
          const nextStart = getNextAyah(baseline.surah_name, baseline.ayat_start);
          if (nextStart) {
            const lineCount = calculateLines(nextStart.surah, nextStart.ayah, endSurah, endAyah);
            studentTargets.sabaqTarget = lineCount > 0 ? lineCount.toString() : "";
            const achievedTotal = weeklyActualTotals[studentId]?.sabaq || 0;
            studentTargets.sabaqKet = calculateABCStatus(achievedTotal, lineCount);
          }
        } else {
          studentTargets.sabaqTarget = "";
        }
      }

      // 5. Automation for Sabqi (Automatic Page Count)
      if (field === "sabqiTargetSurat") {
        const [endSurah, endAyahStr] = value.split(":");
        const endAyah = parseInt(endAyahStr || "0");
        const baseline = latestBaselines[studentId]?.sabqi;

        if (baseline && endSurah && endAyah > 0) {
          const nextStart = getNextAyah(baseline.surah_name, baseline.ayat_start);
          if (nextStart) {
            const pageCount = calculatePages(nextStart.surah, nextStart.ayah, endSurah, endAyah);
            studentTargets.sabqiTarget = pageCount > 0 ? pageCount.toString() : "";
            const achievedTotal = weeklyActualTotals[studentId]?.sabqi || 0;
            studentTargets.sabqiKet = calculateABCStatus(achievedTotal, pageCount);
          }
        } else {
          studentTargets.sabqiTarget = "";
        }
      }

      // 6. Automation for Manzil (Automatic Page Count)
      if (field === "manzilTarget") {
        const [endSurah, endAyahStr] = value.split(":");
        const endAyah = parseInt(endAyahStr || "0");
        const baseline = latestBaselines[studentId]?.manzil;

        if (baseline && endSurah && endAyah > 0) {
          const nextStart = getNextAyah(baseline.surah_name, baseline.ayat_start);
          if (nextStart) {
            const pageCount = calculatePages(nextStart.surah, nextStart.ayah, endSurah, endAyah);
            studentTargets.manzilHal = pageCount > 0 ? pageCount.toString() : "";
            const achievedTotal = weeklyActualTotals[studentId]?.manzil || 0;
            studentTargets.manzilKet = calculateABCStatus(achievedTotal, pageCount);
          }
        } else {
          studentTargets.manzilHal = "";
        }
      }

      return { ...prev, [studentId]: studentTargets };
    });
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, searchQuery]);

  const handleSave = async (isSilent: boolean = false) => {
    if (!isDirty && !isSilent) {
      addNotification({
        type: "info",
        title: "Info",
        message: "Tidak ada data yang berubah.",
      });
      return;
    }

    // 0. Validate Sabaq Sequence (Hard Block)
    if (!isSilent) {
      const invalidTargets: string[] = [];
      for (const [studentId, target] of Object.entries(targets)) {
        if (target.sabaqTargetSurat) {
          const [surahName, ayahStr] = target.sabaqTargetSurat.split(":");
          const ayah = parseInt(ayahStr) || 1;

          const baseline = latestBaselines[studentId]?.sabaq;
          if (baseline && baseline.surah_name) {
            const isValid = validateMemorizationSequence(baseline.surah_name, baseline.ayat_start || 1, surahName, ayah);
            if (!isValid) {
              invalidTargets.push(target.name);
            }
          }
        }
      }

      if (invalidTargets.length > 0) {
        addNotification({
          type: "error",
          title: "Validasi Gagal",
          message: `Alur target Sabaq tidak valid (Juz harus mundur, Surat harus maju) untuk: ${invalidTargets.join(", ")}`,
        });
        return;
      }
    }

    setIsSaving(true);
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
            manzil_target: target.manzilTarget,
            manzil_hal: target.manzilHal ? parseInt(target.manzilHal) : target.manzilHal === "0" ? 0 : undefined,
            manzil_ket: target.manzilKet as any,
            sabqi_target: target.sabqiTarget ? parseInt(target.sabqiTarget) : target.sabqiTarget === "0" ? 0 : undefined,
            sabqi_target_surat: target.sabqiTargetSurat,
            sabqi_ket: target.sabqiKet as any,
            sabaq_target: target.sabaqTarget ? parseInt(target.sabaqTarget) : target.sabaqTarget === "0" ? 0 : undefined,
            sabaq_target_surat: target.sabaqTargetSurat,
            sabaq_ket: target.sabaqKet as any,
            current_juz: isNaN(juzVal) ? 0 : juzVal,
            current_page: isNaN(halVal) ? 0 : halVal,
            teacher_note: target.teacherNote,
            supervisor_note: target.supervisorNote,
            css: target.css,
          },
        };

        return upsertWeeklyTarget(targetPayload, user, target.name);
      });

      await Promise.all(updatePromises);

      if (!isSilent) {
        addNotification({
          type: "success",
          title: "Berhasil",
          message: "Laporan target pekanan telah disimpan dan data santri diperbarui.",
        });
      }

      await fetchData(true); // Refresh local data from DB without triggering full page loading state
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save targets:", error);
      addNotification({
        type: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add effect to handle save trigger from parent
  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleSave(true)
        .then(() => {
          if (onSaveSuccess) onSaveSuccess();
        })
        .catch(() => {
          console.error("Auto-save failed during navigation.");
        });
    }
  }, [saveTrigger]);

  return (
    <div className="space-y-0">
      {/* Top Utility Strip */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-4 py-2 lg:py-3">
        {/* Row 1: Week & Halaqah */}
        <div className="flex items-stretch gap-2 shrink-0">
          {/* Week Selector */}
          <div className="flex-1 lg:flex-none flex bg-white p-0.5 lg:p-1 rounded-xl border-2 border-slate-300 ring-1 ring-white">
            <button onClick={() => setCurrentWeekOffset((prev) => prev - 1)} className="p-1 px-1.5 lg:px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
              <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </button>
            <div className="flex-1 flex flex-col items-center justify-center px-1 lg:px-4 py-1 text-center min-w-30 lg:min-w-40">
              <span className="flex items-center gap-1.5 text-[8.5px] lg:text-[10px] font-black uppercase tracking-widest text-jade-600 whitespace-nowrap">
                {loading ? <div className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 border-2 border-jade-600 border-t-transparent rounded-full animate-spin" /> : <Calendar className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" />}
                {loading ? "MEMUAT..." : weekDisplayRange}
              </span>
              <span className="text-[6px] lg:text-[7px] text-jade-300 mt-0.5 opacity-80 uppercase tracking-[0.2em] font-black leading-none">
                {loading
                  ? "MOHON TUNGGU"
                  : currentWeekOffset === 0
                    ? "Pekan Ini"
                    : currentWeekOffset === -1
                      ? "Pekan Lalu"
                      : currentWeekOffset === 1
                        ? "Pekan Depan"
                        : currentWeekOffset < 0
                          ? `${Math.abs(currentWeekOffset)} Pekan Lalu`
                          : `${currentWeekOffset} Pekan Depan`}
              </span>
            </div>
            <button onClick={() => setCurrentWeekOffset((prev) => prev + 1)} className="p-1 px-1.5 lg:px-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
              <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </button>
          </div>

          {/* Halaqah Info */}
          <div className="flex items-center gap-1 lg:gap-2 bg-white px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-2xl border border-slate-400">
            <div className="px-0 lg:px-0 p-1 lg:p-1.5 bg-slate-50 rounded-lg text-slate-400">
              <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
            </div>
            <div className="text-left">
              <p className="hidden lg:block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halaqah</p>
              <p className="text-[8.5px] lg:text-[10px] font-black text-slate-800 uppercase tracking-tight truncate max-w-17.5 lg:max-w-none">{myHalaqah?.name || "-"}</p>
            </div>
          </div>
        </div>

        {/* Row 2: Search & Actions */}
        <div className="flex-1 flex items-stretch gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-3 h-3 lg:w-4 lg:h-4 group-focus-within:text-jade-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri..."
              className="w-full pl-8 lg:pl-11 pr-2 lg:pr-4 py-1.5 lg:py-2.5 text-[10px] font-black uppercase tracking-widest border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-slate-400 focus:outline-none bg-white text-slate-500 transition-all placeholder:font-black placeholder:text-slate-300 h-8 lg:h-11"
            />
          </div>

          <div className="flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="h-full p-2 lg:p-2.5 bg-white border-2 border-slate-300 rounded-xl text-slate-400 hover:text-jade-600 hover:border-jade-300 transition-all group shadow-none"
              title="Informasi Target Harian"
            >
              <HelpCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:scale-110 transition-transform" />
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              className="h-full flex items-center justify-center px-3 lg:px-6 py-2 lg:py-2.5 font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 border-2 border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <div className="w-3.5 h-3.5 lg:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5 lg:mr-2" />}
              <span className="hidden lg:inline">{isSaving ? "MENYIMPAN" : "SIMPAN LAPORAN"}</span>
              <span className="lg:hidden ml-1.5">{isSaving ? "MENYIMPAN" : "SIMPAN"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Utility Strip (Outside bordered container) */}
      <div className="py-2 lg:py-4 bg-transparent flex flex-row flex-wrap items-start lg:items-center justify-between gap-2 lg:gap-2 mb-1 lg:mb-0 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAtm(!showAtm)}
            className={`flex-none flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl transition-all text-[7px] md:text-[10px] font-black uppercase tracking-tight border-[1.5px] md:border-2 shadow-none ${showAtm ? "bg-jade-50/50 text-jade-600 border-jade-300" : "bg-white text-slate-400 border-slate-300 hover:bg-slate-50"}`}
          >
            <span>{showAtm ? "Sembunyikan ATM" : "Tampilkan ATM"}</span>
          </button>
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate(showNotes ? "weekly-target" : "weekly-target-notes");
              } else {
                setShowNotes(!showNotes);
              }
            }}
            className={`flex-none flex items-center justify-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl transition-all text-[7px] md:text-[10px] font-black uppercase tracking-tight md:tracking-widest border-[1.5px] md:border-2 shadow-none ${
              showNotes ? "bg-amber-50/50 text-amber-600 border-amber-300" : "bg-white text-slate-400 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span>{showNotes ? "Sembunyikan Catatan" : "Catatan"}</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5 md:gap-4 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0">
          <span className="flex items-center gap-1 text-[7px] md:text-[9px] font-black text-amber-500 uppercase tracking-tighter whitespace-nowrap">
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full border-[1.5px] md:border-2 border-amber-400/50 flex items-center justify-center">
              <div className="w-0.5 md:w-1 h-0.5 md:h-1 bg-amber-500 rounded-full"></div>
            </div>{" "}
            A: Terlampaui
          </span>
          <span className="flex items-center gap-1 text-[7px] md:text-[9px] font-black text-emerald-600 uppercase tracking-tighter whitespace-nowrap">
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full border-[1.5px] md:border-2 border-emerald-400/50 flex items-center justify-center">
              <div className="w-0.5 md:w-1 h-0.5 md:h-1 bg-emerald-600 rounded-full"></div>
            </div>{" "}
            B: Tercapai
          </span>
          <span className="flex items-center gap-1 text-[7px] md:text-[9px] font-black text-rose-500 uppercase tracking-tighter whitespace-nowrap">
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full border-[1.5px] md:border-2 border-rose-400/50 flex items-center justify-center">
              <div className="w-0.5 md:w-1 h-0.5 md:h-1 bg-rose-500 rounded-full"></div>
            </div>{" "}
            C: Tidak Tercapai
          </span>
        </div>
      </div>

      {weekDates.length > 0 ? (
        <>
          {/* Main Table Grid (With Borders) */}
          <div className="bg-transparent rounded-none overflow-hidden border-2 border-t-0 border-slate-300 flex flex-col">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent transition-all duration-300">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40">
                  <tr className="bg-slate-300">
                    {/* Frozen Headers */}
                    <th
                      rowSpan={2}
                      className="w-8.75 lg:w-12.5 min-w-8.75 lg:min-w-12.5 hidden sm:table-cell sticky sm:left-0 bg-slate-300 z-50 px-1 lg:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-wider text-center border-t border-b border-l border-black"
                    >
                      No
                    </th>
                    <th
                      rowSpan={2}
                      className={`w-23.75 lg:w-55 min-w-23.75 lg:min-w-55 sticky left-0 bg-slate-300 z-50 px-2 lg:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-wider text-left border-t border-b border-r border-l border-black shadow-[2px_0_5_rgba(0,0,0,0.05)] transition-all duration-300`}
                    >
                      Nama Santri
                    </th>
                    {/* {showNisKelas && (
                            <th rowSpan={2} className="w-20 min-20 sticky left-92.5 bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] animate-in slide-in-from-left-1 duration-300">Kelas</th>
                        )} */}

                    {/* Scrollable Group Headers */}
                    {!showNotes ? (
                      <>
                        <th
                          colSpan={2}
                          className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-emerald-700 uppercase tracking-tighter lg:tracking-widest text-center border-t border-b border-r border-emerald-700 bg-emerald-50 whitespace-nowrap"
                        >
                          Hafalan Saat Ini
                        </th>
                        {showAtm && (
                          <th
                            colSpan={3}
                            className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-blue-700 uppercase tracking-tighter lg:tracking-widest text-center border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap"
                          >
                            ATM
                          </th>
                        )}
                        <th colSpan={6} className="px-4 py-3 text-[9px] lg:text-[10px] font-black text-blue-700 uppercase tracking-tighter lg:tracking-widest text-center border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap">
                          Target Pekanan
                        </th>
                        <th rowSpan={2} className="px-2 py-3 text-[9px] lg:text-[10px] font-black text-violet-700 uppercase tracking-tighter lg:tracking-widest text-center border-t border-b border-r border-violet-700 bg-violet-50 whitespace-nowrap w-16 lg:w-24">
                          SPV
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="w-full px-2 py-3 text-[9px] lg:text-[10px] font-black text-amber-700 uppercase tracking-tighter lg:tracking-widest text-start border-t border-b border-r border-amber-700 bg-amber-50 whitespace-nowrap">
                          Catatan Ustadz
                        </th>
                        <th rowSpan={2} className="px-2 py-3 text-[9px] lg:text-[10px] font-black text-violet-700 uppercase tracking-tighter lg:tracking-widest text-center border-t border-b border-r border-violet-700 bg-violet-50 whitespace-nowrap w-16 lg:w-24">
                          SPV
                        </th>
                      </>
                    )}
                  </tr>
                  <tr className="bg-slate-300">
                    {!showNotes ? (
                      <>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50/50 min-w-11.25 lg:min-w-15">Juz</th>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-slate-500 uppercase text-center border-b border-r border-emerald-700 bg-emerald-50/50 min-w-13.75 lg:min-w-20">Halaman</th>
                        {showAtm && (
                          <>
                            <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-amber-600 uppercase text-center border-b border-r border-amber-600 bg-amber-50/50 min-w-13.75 lg:min-w-20">Manzil</th>
                            <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-amber-600 uppercase text-center border-b border-r border-amber-600 bg-amber-50/50 min-w-11.25 lg:min-w-15">Berputar</th>
                            <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-600 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-13.75 lg:min-w-20">Sabqi</th>
                          </>
                        )}
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-700 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-32.5 lg:min-w-45">Manzil (Hal/Juz)</th>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-700 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-10 lg:min-w-12.5">Ket</th>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-700 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-32.5 lg:min-w-45">Sabqi (Hal)</th>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-700 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-10 lg:min-w-12.5">Ket</th>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-700 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-32.5 lg:min-w-45">Sabaq (Baris)</th>
                        <th className="px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-blue-700 uppercase text-center border-b border-r border-blue-700 bg-blue-50/50 min-w-10 lg:min-w-12.5">Ket</th>
                      </>
                    ) : (
                      <>
                        <th className="w-full px-1 lg:px-2 py-2 text-[8.5px] lg:text-[9px] font-black text-amber-700 uppercase text-start border-b border-r border-amber-700 bg-amber-50/50">Input Catatan Perkembangan Santri</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-24 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data santri tidak ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const target =
                        targets[s.id] ||
                        ({
                          studentId: s.id,
                          nis: s.nis || "-",
                          name: s.full_name,
                          className: "-",
                          hafalanJuz: "0",
                          hafalanHal: "0",
                          manzilAtm: "",
                          hariAtm: "",
                          sabqiAtm: "",
                          manzilTarget: "",
                          manzilHal: "",
                          manzilKet: "",
                          sabqiTarget: "",
                          sabqiTargetSurat: "",
                          sabqiKet: "",
                          sabaqTarget: "",
                          sabaqTargetSurat: "",
                          sabaqKet: "",
                          teacherNote: "",
                          supervisorNote: "",
                          css: "",
                        } as TargetRow);

                      return (
                        <tr key={s.id} className="group transition-colors h-15.5 hover:bg-emerald-50/40">
                          {/* Frozen Body Cells */}
                          <td className="hidden sm:table-cell sticky sm:left-0 bg-white px-1 lg:px-3 py-4 text-[10px] lg:text-[11px] font-bold text-slate-400 text-center border-l-2 border-r border-slate-300 z-20 transition-colors">
                            {idx + 1}
                          </td>
                          <td
                            className={`sticky left-0 bg-white px-2 lg:px-4 py-4 text-[9.5px] lg:text-xs font-bold text-slate-800 z-20 transition-all duration-300 whitespace-normal leading-tight wrap-break-words shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-23.75 lg:w-55`}
                          >
                            {target.name}
                          </td>
                          {/* {showNisKelas && (
                                    <td className="sticky left-92.5 bg-white px-3 py-4 text-[11px] font-bold text-slate-600 text-center border-r z-20 transition-all duration-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{target.className}</td>
                                )} */}

                          {/* Scrollable Content */}
                          {!showNotes ? (
                            <>
                              <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 text-center bg-slate-50/50">
                                <input
                                  type="text"
                                  value={target.hafalanJuz === "-" ? "0" : target.hafalanJuz}
                                  readOnly
                                  disabled
                                  title="Juz dihitung otomatis dari posisi Sabaq terakhir"
                                  className="w-full text-center text-[9px] lg:text-[10px] font-black text-slate-700 tracking-tight bg-transparent border-none focus:ring-0 rounded h-8 cursor-not-allowed opacity-80"
                                  placeholder="Juz"
                                />
                              </td>
                              <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 text-center bg-slate-50/50">
                                <input
                                  type="text"
                                  value={target.hafalanHal === "-" ? "0" : target.hafalanHal}
                                  readOnly
                                  disabled
                                  title="Halaman dihitung otomatis dari posisi Sabaq terakhir"
                                  className="w-full text-center text-[9px] lg:text-[10px] font-black text-slate-700 tracking-tight bg-transparent border-none focus:ring-0 rounded h-8 cursor-not-allowed opacity-80"
                                  placeholder="Halaman"
                                />
                              </td>
                              {showAtm && (
                                <>
                                  <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 text-center bg-blue-50/5">
                                    <input
                                      readOnly
                                      type="text"
                                      value={target.manzilAtm ? `${target.manzilAtm} Hal` : "-"}
                                      className="w-full text-center text-[9px] lg:text-[10px] font-black text-amber-500 tracking-tight bg-slate-100/30 border-none focus:ring-0 rounded h-8 cursor-default"
                                    />
                                  </td>
                                  <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 text-center bg-blue-50/5">
                                    <input
                                      readOnly
                                      type="text"
                                      value={target.hariAtm ? `${target.hariAtm} Hari` : "-"}
                                      className="w-full text-center text-[9px] lg:text-[10px] font-black text-amber-500 tracking-tight bg-slate-100/30 border-none focus:ring-0 rounded h-8 cursor-default"
                                    />
                                  </td>
                                  <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 text-center bg-blue-50/5">
                                    <input
                                      readOnly
                                      type="text"
                                      value={target.sabqiAtm ? `${target.sabqiAtm} Hal` : "-"}
                                      className="w-full text-center text-[9px] lg:text-[10px] font-black text-blue-600 tracking-tight bg-slate-100/30 border-none focus:ring-0 rounded h-8 cursor-default"
                                    />
                                  </td>
                                </>
                              )}

                              <td className="px-1 lg:px-1.5 py-1.5 border-r border-b border-slate-200 bg-emerald-50/5">
                                <div className="flex items-center gap-0.5">
                                  {/* Manzil Surah & Ayat */}
                                  <div className="flex items-center gap-0.5">
                                    <div className="relative w-18.75 lg:w-25 surah-dropdown-container flex-none group/surah">
                                      <div
                                        onClick={(e) => {
                                          const dropdownId = `${s.id}-manzil`;
                                          const isOpen = openSurahDropdown === dropdownId;
                                          if (!isOpen) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: 160 });
                                          }
                                          setOpenSurahDropdown(isOpen ? null : dropdownId);
                                          setSurahSearchQuery("");
                                        }}
                                        className={`w-full h-7 px-1.5 rounded-lg border-2 shadow-none text-[8px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all flex items-center justify-between cursor-pointer ${openSurahDropdown === `${s.id}-manzil` ? "border-emerald-400 ring-4 ring-emerald-50/50 bg-white" : "border-slate-300 bg-white hover:bg-slate-50"}`}
                                      >
                                        <span className={`truncate ${target.manzilTarget.split(":")[0] ? "text-slate-700" : "text-slate-500"}`}>
                                          {target.manzilTarget.split(":")[0] || "- Surat -"}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-slate-300 transition-all ${openSurahDropdown === `${s.id}-manzil` ? "rotate-180 text-emerald-500" : "group-hover/surah:text-emerald-500"}`} />
                                      </div>
                                      
                                      {openSurahDropdown === `${s.id}-manzil` && dropdownCoords && (
                                        <div 
                                          className={`fixed surah-dropdown-menu bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-999999! flex flex-col animate-in fade-in slide-in-from-top-2 duration-200`}
                                          style={{ top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
                                        >
                                          <div className="p-1.5 border-b border-slate-100 bg-slate-50 shrink-0 relative">
                                            <input
                                              type="text"
                                              placeholder="Cari surat..."
                                              value={surahSearchQuery}
                                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                                              onClick={(e) => e.stopPropagation()}
                                              autoFocus
                                              className="w-full pl-2 pt-1 pr-2 py-1 text-[7px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all placeholder:text-slate-300"
                                            />
                                          </div>
                                          <div className="overflow-y-auto max-h-40 custom-scrollbar overscroll-contain">
                                            <div className="flex flex-col py-0.5">
                                              <div
                                                className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${target.manzilTarget.split(":")[0] === "" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleInputChange(s.id, "manzilTarget", "");
                                                  setOpenSurahDropdown(null);
                                                  setSurahSearchQuery("");
                                                }}
                                              >
                                                - SURAT -
                                              </div>
                                              {SURAH_DATA.filter((surahItem) => surahItem.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                                                .filter((surah) => {
                                                  const sabaqBaseline = latestBaselines[s.id]?.sabaq;
                                                  if (!sabaqBaseline || !sabaqBaseline.surah_name) return false;
                                                  return getSequenceScore(sabaqBaseline.surah_name, sabaqBaseline.ayat_start || 1) >= getSequenceScore(surah.name, 1);
                                                })
                                                .map((surah) => {
                                                const isSelected = target.manzilTarget.split(":")[0] === surah.name;
                                                return (
                                                  <div
                                                    key={surah.name}
                                                    className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      let initialAyah = 1;
                                                      const baseline = latestBaselines[s.id]?.manzil;
                                                      if (baseline && baseline.surah_name === surah.name) {
                                                        initialAyah = (baseline.ayat_start || 1) + 1;
                                                        if (initialAyah > surah.totalAyah) initialAyah = surah.totalAyah;
                                                      }
                                                      handleInputChange(s.id, "manzilTarget", `${surah.name}:${initialAyah}`);
                                                      setOpenSurahDropdown(null);
                                                      setSurahSearchQuery("");
                                                    }}
                                                  >
                                                    {surah.name}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-slate-300 font-bold self-center">:</span>
                                    <div className={`flex items-center h-7 px-0.5 flex-none w-8 lg:w-10 border rounded-lg transition-all shadow-sm ${!target.manzilTarget.split(":")[0] ? "bg-slate-50/30 border-slate-100 opacity-50" : "bg-slate-50/50 border-slate-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200"}`}>
                                      <input
                                        type="number"
                                        min={1}
                                        disabled={!target.manzilTarget.split(":")[0]}
                                        value={target.manzilTarget.split(":")[1] || ""}
                                        onChange={(e) => {
                                          const surahName = target.manzilTarget.split(":")[0] || "";
                                          const surahInfo = SURAH_DATA.find((sr) => sr.name === surahName);
                                          let val = e.target.value;
                                          
                                          let minAyah = 1;
                                          const baseline = latestBaselines[s.id]?.manzil;
                                          if (baseline && baseline.surah_name === surahName) {
                                            minAyah = (baseline.ayat_start || 1) + 1;
                                            if (surahInfo && minAyah > surahInfo.totalAyah) minAyah = surahInfo.totalAyah;
                                          }

                                          let maxAyah = surahInfo ? surahInfo.totalAyah : 1;
                                          const sabaqBaseline = latestBaselines[s.id]?.sabaq;
                                          if (sabaqBaseline && sabaqBaseline.surah_name === surahName) {
                                            maxAyah = sabaqBaseline.ayat_start || 1;
                                          }

                                          if (val === "") {
                                            val = minAyah.toString();
                                          } else {
                                            let numVal = parseInt(val);
                                            if (isNaN(numVal)) numVal = minAyah;
                                            if (numVal < minAyah) numVal = minAyah;
                                            if (numVal > maxAyah) numVal = maxAyah;
                                            val = numVal.toString();
                                          }
                                          handleInputChange(s.id, "manzilTarget", surahName ? `${surahName}:${val}` : "");
                                        }}
                                        className="w-full text-center text-[9px] lg:text-[10px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 rounded h-6 appearance-none p-0 outline-none"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-0.5 lg:px-1">
                                    <input
                                      type="number"
                                      readOnly
                                      value={target.manzilHal}
                                      className="w-8 lg:w-10 text-center text-[9px] lg:text-[10px] font-black text-slate-500 tracking-tight bg-transparent border-none focus:ring-0 rounded h-7 appearance-none p-0 cursor-not-allowed"
                                      placeholder="0"
                                    />
                                    <span className="text-[7.5px] lg:text-[8px] font-extrabold text-emerald-400 uppercase mr-0.5 lg:mr-1">Halaman</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 bg-emerald-50/5">
                                <input
                                  type="text"
                                  readOnly
                                  value={target.manzilKet || "-"}
                                  className={`w-full h-9 text-[10px] lg:text-[11px] font-black bg-slate-50/50 border rounded-lg focus:ring-0 text-center cursor-default ${
                                    target.manzilKet === "A" ? "text-amber-500" : target.manzilKet === "C" ? "text-rose-500" : target.manzilKet === "B" ? "text-emerald-600" : "text-slate-300"
                                  }`}
                                />
                              </td>

                              <td className="px-1 lg:px-1.5 py-1.5 border-r border-b border-slate-200 bg-emerald-50/5">
                                <div className="flex items-center gap-0.5 animate-in zoom-in-95 duration-100">
                                  {/* Sabqi Surah & Ayat */}
                                  <div className="flex items-center gap-0.5">
                                    <div className="relative w-18.75 lg:w-25 surah-dropdown-container flex-none group/surah">
                                      <div
                                        onClick={(e) => {
                                          const dropdownId = `${s.id}-sabqi`;
                                          const isOpen = openSurahDropdown === dropdownId;
                                          if (!isOpen) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: 160 });
                                          }
                                          setOpenSurahDropdown(isOpen ? null : dropdownId);
                                          setSurahSearchQuery("");
                                        }}
                                        className={`w-full h-7 px-1.5 rounded-lg border-2 shadow-none text-[8px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all flex items-center justify-between cursor-pointer ${openSurahDropdown === `${s.id}-sabqi` ? "border-emerald-400 ring-4 ring-emerald-50/50 bg-white" : "border-slate-300 bg-white hover:bg-slate-50"}`}
                                      >
                                        <span className={`truncate ${target.sabqiTargetSurat.split(":")[0] ? "text-slate-700" : "text-slate-500"}`}>
                                          {target.sabqiTargetSurat.split(":")[0] || "- Surat -"}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-slate-300 transition-all ${openSurahDropdown === `${s.id}-sabqi` ? "rotate-180 text-emerald-500" : "group-hover/surah:text-emerald-500"}`} />
                                      </div>
                                      
                                      {openSurahDropdown === `${s.id}-sabqi` && dropdownCoords && (
                                        <div 
                                          className={`fixed surah-dropdown-menu bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-999999! flex flex-col animate-in fade-in slide-in-from-top-2 duration-200`}
                                          style={{ top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
                                        >
                                          <div className="p-1.5 border-b border-slate-100 bg-slate-50 shrink-0 relative">
                                            <input
                                              type="text"
                                              placeholder="Cari surat..."
                                              value={surahSearchQuery}
                                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                                              onClick={(e) => e.stopPropagation()}
                                              autoFocus
                                              className="w-full pl-2 pr-2 py-1 text-[7px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all placeholder:text-slate-300"
                                            />
                                          </div>
                                          <div className="overflow-y-auto max-h-40 custom-scrollbar overscroll-contain">
                                            <div className="flex flex-col py-0.5">
                                              <div
                                                className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${target.sabqiTargetSurat.split(":")[0] === "" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleInputChange(s.id, "sabqiTargetSurat", "");
                                                  setOpenSurahDropdown(null);
                                                  setSurahSearchQuery("");
                                                }}
                                              >
                                                - SURAT -
                                              </div>
                                              {SURAH_DATA.filter((surahItem) => surahItem.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                                                .filter((surah) => {
                                                  const sabaqBaseline = latestBaselines[s.id]?.sabaq;
                                                  if (!sabaqBaseline || !sabaqBaseline.surah_name) return false;
                                                  return getSequenceScore(sabaqBaseline.surah_name, sabaqBaseline.ayat_start || 1) >= getSequenceScore(surah.name, 1);
                                                })
                                                .map((surah) => {
                                                const isSelected = target.sabqiTargetSurat.split(":")[0] === surah.name;
                                                return (
                                                  <div
                                                    key={surah.name}
                                                    className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      let initialAyah = 1;
                                                      const baseline = latestBaselines[s.id]?.sabqi;
                                                      if (baseline && baseline.surah_name === surah.name) {
                                                        initialAyah = (baseline.ayat_start || 1) + 1;
                                                        if (initialAyah > surah.totalAyah) initialAyah = surah.totalAyah;
                                                      }
                                                      handleInputChange(s.id, "sabqiTargetSurat", `${surah.name}:${initialAyah}`);
                                                      setOpenSurahDropdown(null);
                                                      setSurahSearchQuery("");
                                                    }}
                                                  >
                                                    {surah.name}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-slate-300 font-bold self-center">:</span>
                                    <div className={`flex items-center h-7 px-0.5 flex-none w-8 lg:w-10 border rounded-lg transition-all shadow-sm ${!target.sabqiTargetSurat.split(":")[0] ? "bg-slate-50/30 border-slate-100 opacity-50" : "bg-slate-50/50 border-slate-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200"}`}>
                                      <input
                                        type="number"
                                        min={1}
                                        disabled={!target.sabqiTargetSurat.split(":")[0]}
                                        value={target.sabqiTargetSurat.split(":")[1] || ""}
                                        onChange={(e) => {
                                          const surahName = target.sabqiTargetSurat.split(":")[0] || "";
                                          const surahInfo = SURAH_DATA.find((sr) => sr.name === surahName);
                                          let val = e.target.value;
                                          
                                          let minAyah = 1;
                                          const baseline = latestBaselines[s.id]?.sabqi;
                                          if (baseline && baseline.surah_name === surahName) {
                                            minAyah = (baseline.ayat_start || 1) + 1;
                                            if (surahInfo && minAyah > surahInfo.totalAyah) minAyah = surahInfo.totalAyah;
                                          }

                                          let maxAyah = surahInfo ? surahInfo.totalAyah : 1;
                                          const sabaqBaseline = latestBaselines[s.id]?.sabaq;
                                          if (sabaqBaseline && sabaqBaseline.surah_name === surahName) {
                                            maxAyah = sabaqBaseline.ayat_start || 1;
                                          }

                                          if (val === "") {
                                            val = minAyah.toString();
                                          } else {
                                            let numVal = parseInt(val);
                                            if (isNaN(numVal)) numVal = minAyah;
                                            if (numVal < minAyah) numVal = minAyah;
                                            if (numVal > maxAyah) numVal = maxAyah;
                                            val = numVal.toString();
                                          }
                                          handleInputChange(s.id, "sabqiTargetSurat", surahName ? `${surahName}:${val}` : "");
                                        }}
                                        className="w-full text-center text-[9px] lg:text-[10px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 rounded h-6 appearance-none p-0 outline-none"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-0.5 lg:px-1">
                                    <input
                                      type="number"
                                      readOnly
                                      value={target.sabqiTarget}
                                      className="w-8 lg:w-10 text-center text-[9px] lg:text-[10px] font-black text-slate-500 tracking-tight bg-transparent border-none focus:ring-0 rounded h-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 outline-none cursor-not-allowed"
                                      placeholder="0"
                                    />
                                    <span className="text-[7.5px] lg:text-[8px] font-extrabold text-emerald-400 uppercase mr-0.5 lg:mr-1">Halaman</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-0.5 lg:px-1 py-1.5 border-r border-b border-slate-200 bg-emerald-50/5">
                                <input
                                  type="text"
                                  readOnly
                                  value={target.sabqiKet || "-"}
                                  className={`w-full h-9 text-[10px] lg:text-[11px] font-black bg-slate-50/50 border rounded-lg focus:ring-0 text-center cursor-default ${
                                    target.sabqiKet === "A" ? "text-amber-500" : target.sabqiKet === "C" ? "text-rose-500" : target.sabqiKet === "B" ? "text-emerald-600" : "text-slate-300"
                                  }`}
                                />
                              </td>

                              <td className="px-1 lg:px-1.5 py-1.5 border-r border-b border-slate-200 bg-emerald-50/5">
                                <div className="flex items-center justify-center gap-0.5 animate-in zoom-in-95 duration-100 text-left">
                                  {/* Sabaq Surah & Ayat */}
                                  <div className="flex items-center gap-0.5">
                                    <div className="relative w-18.75 lg:w-25 surah-dropdown-container flex-none group/surah">
                                      <div
                                        onClick={(e) => {
                                          const dropdownId = `${s.id}-sabaq`;
                                          const isOpen = openSurahDropdown === dropdownId;
                                          if (!isOpen) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setDropdownCoords({ top: rect.bottom + 4, left: rect.left, width: 160 });
                                          }
                                          setOpenSurahDropdown(isOpen ? null : dropdownId);
                                          setSurahSearchQuery("");
                                        }}
                                        className={`w-full h-7 px-1.5 rounded-lg border-2 shadow-none text-[8px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all flex items-center justify-between cursor-pointer ${openSurahDropdown === `${s.id}-sabaq` ? "border-emerald-400 ring-4 ring-emerald-50/50 bg-white" : "border-slate-300 bg-white hover:bg-slate-50"}`}
                                      >
                                        <span className={`truncate ${target.sabaqTargetSurat.split(":")[0] ? "text-slate-700" : "text-slate-500"}`}>
                                          {target.sabaqTargetSurat.split(":")[0] || "- Surat -"}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-slate-300 transition-all ${openSurahDropdown === `${s.id}-sabaq` ? "rotate-180 text-emerald-500" : "group-hover/surah:text-emerald-500"}`} />
                                      </div>
                                      
                                      {openSurahDropdown === `${s.id}-sabaq` && dropdownCoords && (
                                        <div 
                                          className={`fixed surah-dropdown-menu bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-999999! flex flex-col animate-in fade-in slide-in-from-top-2 duration-200`}
                                          style={{ top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
                                        >
                                          <div className="p-1.5 border-b border-slate-100 bg-slate-50 shrink-0 relative">
                                            <input
                                              type="text"
                                              placeholder="Cari surat..."
                                              value={surahSearchQuery}
                                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                                              onClick={(e) => e.stopPropagation()}
                                              autoFocus
                                              className="w-full pl-2 pr-2 py-1 text-[7px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all placeholder:text-slate-300"
                                            />
                                          </div>
                                          <div className="overflow-y-auto max-h-40 custom-scrollbar overscroll-contain">
                                            <div className="flex flex-col py-0.5">
                                              <div
                                                className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${target.sabaqTargetSurat.split(":")[0] === "" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleInputChange(s.id, "sabaqTargetSurat", "");
                                                  setOpenSurahDropdown(null);
                                                  setSurahSearchQuery("");
                                                }}
                                              >
                                                - SURAT -
                                              </div>
                                              {SURAH_DATA.filter((surahItem) => surahItem.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                                                .filter((surah) => {
                                                  const baseline = latestBaselines[s.id]?.sabaq;
                                                  const isMemorized = baseline && baseline.surah_name ? getSequenceScore(baseline.surah_name, baseline.ayat_start || 1) >= getSequenceScore(surah.name, surah.totalAyah) : false;
                                                  return !isMemorized;
                                                })
                                                .map((surah) => {
                                                const isSelected = target.sabaqTargetSurat.split(":")[0] === surah.name;

                                                return (
                                                  <div
                                                    key={surah.name}
                                                    className={`flex items-center justify-between px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all border-b border-slate-50 last:border-0 ${isSelected ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      let initialAyah = 1;
                                                      const baseline = latestBaselines[s.id]?.sabaq;
                                                      if (baseline && baseline.surah_name === surah.name) {
                                                        initialAyah = (baseline.ayat_start || 1) + 1;
                                                        if (initialAyah > surah.totalAyah) initialAyah = surah.totalAyah;
                                                      }
                                                      handleInputChange(s.id, "sabaqTargetSurat", `${surah.name}:${initialAyah}`);
                                                      setOpenSurahDropdown(null);
                                                      setSurahSearchQuery("");
                                                    }}
                                                  >
                                                    <span>{surah.name}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-slate-300 font-bold self-center">:</span>
                                    <div className={`flex items-center h-7 px-0.5 flex-none w-8 lg:w-10 border rounded-lg transition-all shadow-sm ${!target.sabaqTargetSurat.split(":")[0] ? "bg-slate-50/30 border-slate-100 opacity-50" : "bg-slate-50/50 border-slate-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200"}`}>
                                      <input
                                        type="number"
                                        min={1}
                                        disabled={!target.sabaqTargetSurat.split(":")[0]}
                                        value={target.sabaqTargetSurat.split(":")[1] || ""}
                                        onChange={(e) => {
                                          const surahName = target.sabaqTargetSurat.split(":")[0] || "";
                                          const surahInfo = SURAH_DATA.find((sr) => sr.name === surahName);
                                          let val = e.target.value;
                                          
                                          let minAyah = 1;
                                          const baseline = latestBaselines[s.id]?.sabaq;
                                          if (baseline && baseline.surah_name === surahName) {
                                            minAyah = (baseline.ayat_start || 1) + 1;
                                            if (surahInfo && minAyah > surahInfo.totalAyah) minAyah = surahInfo.totalAyah;
                                          }

                                          if (val === "") {
                                            val = minAyah.toString();
                                          } else {
                                            let numVal = parseInt(val);
                                            if (isNaN(numVal)) numVal = minAyah;
                                            if (numVal < minAyah) numVal = minAyah;
                                            if (surahInfo && numVal > surahInfo.totalAyah) numVal = surahInfo.totalAyah;
                                            val = numVal.toString();
                                          }
                                          handleInputChange(s.id, "sabaqTargetSurat", surahName ? `${surahName}:${val}` : "");
                                        }}
                                        className="w-full text-center text-[9px] lg:text-[10px] font-black text-slate-800 tracking-tight bg-transparent border-none focus:ring-0 rounded h-6 appearance-none p-0 outline-none"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-0.5 lg:px-1">
                                    <input
                                      type="number"
                                      readOnly
                                      value={target.sabaqTarget}
                                      className="w-8 lg:w-10 text-center text-[9px] lg:text-[10px] font-black text-slate-500 tracking-tight bg-transparent border-none focus:ring-0 rounded h-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 outline-none cursor-not-allowed"
                                      placeholder="0"
                                    />
                                    <span className="text-[7.5px] lg:text-[8px] font-extrabold text-emerald-400 uppercase mr-0.5 lg:mr-1">Baris</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-0.5 lg:px-1 py-1.5 bg-emerald-50/5">
                                <input
                                  type="text"
                                  readOnly
                                  value={target.sabaqKet || "-"}
                                  className={`w-full h-9 text-[10px] lg:text-[11px] font-black bg-slate-50/50 border rounded-lg focus:ring-0 text-center cursor-default ${
                                    target.sabaqKet === "A" ? "text-amber-500" : target.sabaqKet === "C" ? "text-rose-500" : target.sabaqKet === "B" ? "text-emerald-600" : "text-slate-300"
                                  }`}
                                />
                              </td>
                              <td className="px-0.5 lg:px-1 py-1.5 bg-emerald-50/5 border-l border-slate-200">
                                <div className="flex items-center justify-center w-full h-full">
                                  {target.supervisorNote && (
                                    <button
                                      onClick={() => setSelectedSupervisorNote({ studentName: target.name, note: target.supervisorNote })}
                                      className="h-8 w-8 lg:h-9 lg:w-9 bg-violet-100 hover:bg-violet-200 text-violet-600 rounded-lg flex items-center justify-center border border-violet-200 transition-colors"
                                      title="Lihat Catatan Supervisor"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1.5 bg-amber-50/5 h-15.5 border-r border-slate-200">
                                <textarea
                                  spellCheck={false}
                                  value={target.teacherNote}
                                  onChange={(e) => handleInputChange(s.id, "teacherNote", e.target.value)}
                                  placeholder="Tambahkan catatan..."
                                  className="w-full h-10 pb-1 pt-1.5 px-2 text-[10px] lg:text-[11px] font-bold text-slate-700 bg-white border-2 rounded-lg focus:ring-0 border-slate-300 focus:border-amber-300 outline-none transition-all resize-none placeholder:font-bold placeholder:text-slate-300 leading-tight text-start"
                                />
                              </td>
                              <td className="px-0.5 lg:px-1 py-1.5 bg-violet-50/5">
                                <div className="flex items-center justify-center w-full h-full">
                                  {target.supervisorNote && (
                                    <button
                                      onClick={() => setSelectedSupervisorNote({ studentName: target.name, note: target.supervisorNote })}
                                      className="h-8 w-8 lg:h-9 lg:w-9 bg-violet-100 hover:bg-violet-200 text-violet-600 rounded-lg flex items-center justify-center border border-violet-200 transition-colors"
                                      title="Lihat Catatan Supervisor"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-2 py-3 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row justify-between lg:items-center gap-4">
              <div className="flex flex-col lg:flex-row lg:flex-wrap gap-x-4 gap-y-1 lg:gap-y-4 text-[9px] lg:text-[10px] font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full shrink-0"></div> Manzil ideal rotasi 15 hari
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></div> Sabqi ideal rotasi 5 hari
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border-2 border-slate-300 rounded-xl mt-4">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-400 border border-slate-100">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest mb-1">Di Luar Masa Aktif</h3>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tahun ajaran tidak aktif pada minggu ini.</p>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in lg:pl-64 pt-16" onClick={() => setIsInfoModalOpen(false)}>
          <div className="relative bg-white rounded-xl shadow-none w-full max-w-sm overflow-hidden animate-scale-in border-2 border-slate-300 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-jade-50 rounded-lg flex items-center justify-center text-jade-500 border border-jade-100">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Informasi Target</h3>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Acuan Sabaq Harian</p>
                </div>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto scrollbar-hide space-y-4">
              <div className="space-y-2">
                {tenant?.curriculum_config?.target_info ? (
                  tenant.curriculum_config.target_info.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-colors hover:border-slate-200">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                      <span className="px-3.5 py-1.5 bg-white text-jade-600 border-2 border-jade-600 rounded-xl text-[10px] font-black uppercase tracking-wider">{item.value}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Kelas 1 - 2</span>
                      <span className="px-3.5 py-1.5 bg-white text-jade-600 border-2 border-jade-600 rounded-xl text-[10px] font-black uppercase tracking-wider">3 Baris</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Kelas 3 - 4</span>
                      <span className="px-3.5 py-1.5 bg-white text-jade-600 border-2 border-jade-600 rounded-xl text-[10px] font-black uppercase tracking-wider">5 Baris</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Kelas 5 - 6</span>
                      <span className="px-3.5 py-1.5 bg-white text-jade-600 border-2 border-jade-600 rounded-xl text-[10px] font-black uppercase tracking-wider">7 Baris</span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border-2 border-amber-100 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[8.5px] font-black text-amber-700 leading-relaxed uppercase tracking-wide">Gunakan acuan ini sebagai standar minimal pencapaian harian santri.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-white">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="w-full py-3.5 bg-slate-800 text-white rounded-xl text-[9.5px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all active:scale-95 shadow-none border-2 border-slate-800"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Note Modal */}
      {selectedSupervisorNote && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in lg:pl-64 pt-16" onClick={() => setSelectedSupervisorNote(null)}>
          <div className="relative bg-white rounded-xl shadow-none w-full max-w-md overflow-hidden animate-scale-in border-2 border-slate-300 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-violet-50 shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-[10px] font-black text-violet-800 uppercase tracking-widest leading-none">Catatan Supervisor</h3>
                  <p className="text-[7.5px] font-black text-violet-500 uppercase tracking-widest mt-1">Untuk {selectedSupervisorNote.studentName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSupervisorNote(null)} className="p-1.5 hover:bg-violet-100 rounded-full transition-colors text-violet-400 hover:text-violet-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] md:text-xs font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedSupervisorNote.note}</p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-white">
              <button
                onClick={() => setSelectedSupervisorNote(null)}
                className="w-full py-3 bg-violet-600 text-white rounded-xl text-[9.5px] font-black uppercase tracking-[0.2em] hover:bg-violet-700 transition-all active:scale-95 shadow-none"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
