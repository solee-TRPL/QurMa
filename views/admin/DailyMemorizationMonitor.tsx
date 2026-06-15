import React, { useEffect, useState, useMemo } from "react";
import { UserProfile, Student, MemorizationRecord, MemorizationType, MemorizationStatus, Halaqah, Tenant, UserRole } from "../../types";
import {
  getHalaqahs,
  getStudents,
  getStudentsByHalaqah,
  getWeeklyMemorization,
  upsertWeeklyMemorization,
  createRecord,
  deleteRecord,
  getTenant,
  updateTenant,
  getLastProgressByType,
  getWeeklyTargets,
  getLatestMemorizationBaselines,
  updateStudent,
  getFirstRecordDate,
  getUsers,
  getStudentRecords,
  updateRecord,
} from "../../services/dataService";
import {
  BookOpen,
  Search,
  User,
  Users,
  Calendar,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Save,
  X,
  Book,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  AlertTriangle,
  Settings2,
  ChevronDown,
  Circle,
  HeartPulse,
  FileText,
  UserX,
  Activity,
  GraduationCap,
} from "lucide-react";
import { useNotification } from "../../lib/NotificationContext";
import { useLoading } from "../../lib/LoadingContext";
import { SURAH_DATA, SURAH_PROGRESSION } from "../../lib/quranData";
import { calculateLines, calculatePages, getNextAyah, getSabaqPositionFromHafalan, getPhysicalLocation, getJuzStart } from "../../lib/quranUtils";
import { QURAN_NAME_TO_ID } from "../../lib/quranNameToId";

export interface DailyMemorizationMonitorProps {
  user: UserProfile;
  tenantId: string;
  onSetUnsavedChanges?: (hasChanges: boolean) => void;
  saveTrigger?: number;
  onSaveSuccess?: () => void;
  isGlobalModalOpen?: boolean;
  onMobileDateChange?: (date: string) => void;
}

export const DailyMemorizationMonitor: React.FC<DailyMemorizationMonitorProps> = ({ user, tenantId, onSetUnsavedChanges, saveTrigger, onSaveSuccess, isGlobalModalOpen }) => {
  const getStudentIdFromUrl = () => new URLSearchParams(window.location.search).get("studentId");
  const [studentIdParam, setStudentIdParam] = useState(getStudentIdFromUrl());

  const [students, setStudents] = useState<Student[]>([]);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>("all");
  const [showHalaqahDropdown, setShowHalaqahDropdown] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [saveCounter, setSaveCounter] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [firstRecordDate, setFirstRecordDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get("weekOffset") || "0");
  });

  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]); // Default 7 Days: Mon(1)-Sun(0)

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isFetchingRecords, setIsFetchingRecords] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [showLocalUnsavedModal, setShowLocalUnsavedModal] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [lastProgress, setLastProgress] = useState<Record<string, MemorizationRecord | null>>({});
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [openInitDropdown, setOpenInitDropdown] = useState<"sabaq" | "sabqi" | "manzil" | null>(null);
  const [openSurahDropdown, setOpenSurahDropdown] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [surahSearchQuery, setSurahSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">("bottom");
  const [initForm, setInitForm] = useState<{ surah: string; ayat: number; sabqiSurah: string; sabqiAyat: number; manzilSurah: string; manzilAyat: number; date?: string }>({
    surah: "",
    ayat: 0,
    sabqiSurah: "",
    sabqiAyat: 1,
    manzilSurah: "An-Naba'",
    manzilAyat: 1,
  });

  const getSabqiPosForSabaq = (surah: string, ayat: number) => {
    const loc = getPhysicalLocation(surah, ayat);
    if (loc) {
      const juzStart = getJuzStart(loc.juz);
      if (juzStart) {
        return juzStart;
      }
    }
    return { surah, ayah: 1 };
  };

  const handleInitSabaqChange = (surah: string, ayat: number) => {
    const sabqiPos = getSabqiPosForSabaq(surah, ayat);
    setInitForm((prev) => ({
      ...prev,
      surah,
      ayat,
      sabqiSurah: sabqiPos.surah,
      sabqiAyat: sabqiPos.ayah,
    }));
  };

  const { addNotification } = useNotification();
  const { setLoading: setGlobalLoading } = useLoading();
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollMobileDays = (direction: "left" | "right") => {
    if (!mobileScrollRef.current) return;
    // Use actual rendered width of the first day column for precision
    const firstDay = mobileScrollRef.current.querySelector('th[colspan="3"]');
    if (firstDay) {
      const scrollAmount = firstDay.clientWidth;
      mobileScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    } else {
      // Fallback to calculation if element not found
      const scrollAmount = window.innerWidth - 80;
      mobileScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const selectedStudentRef = React.useRef(selectedStudent);
  useEffect(() => {
    selectedStudentRef.current = selectedStudent;
  }, [selectedStudent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if ((event.target as Element).closest('.surah-dropdown-container') || (event.target as Element).closest('.status-dropdown-container') || (event.target as Element).closest('.init-dropdown-container')) {
        return;
      }
      if (openSurahDropdown) {
        setOpenSurahDropdown(null);
        setSurahSearchQuery("");
      }
      if (openStatusDropdown) {
        setOpenStatusDropdown(null);
      }
      if (openInitDropdown) {
        setOpenInitDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [openSurahDropdown, openStatusDropdown, openInitDropdown]);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const activePeriodsStr = JSON.stringify(tenant?.cycle_config?.activePeriods || []);
  const activeDaysStr = JSON.stringify(activeDays);

  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6
    // Adjust to Monday: Monday is 1, Sunday is 0 -> diff: (1 - day)
    // If Sunday (0), it goes back 6 days to prev Monday.
    const diff = (day === 0 ? -6 : 1) - day + currentWeekOffset * 7;

    const start = new Date(today);
    start.setDate(today.getDate() + diff);

    const dates: string[] = [];
    const activePeriods = JSON.parse(activePeriodsStr);
    const parsedActiveDays = JSON.parse(activeDaysStr);

    // Loop through 7 full days starting from Monday
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const currentDateStr = getLocalDateString(current);

      let isWithinActiveRange = true;
      if (activePeriods.length > 0) {
        isWithinActiveRange = activePeriods.some((period: any) => {
          const startOk = !period.startDate || currentDateStr >= period.startDate;
          const endOk = !period.endDate || currentDateStr <= period.endDate;
          return startOk && endOk;
        });
      }

      // Check if this date has any records or pending changes
      const hasData = records.some(r => r.record_date === currentDateStr) || 
                      Object.keys(pendingChanges).some(k => k.startsWith(currentDateStr + "|"));

      // Only add to table if it's an active day based on config, AND (is within active range OR has data)
      if (parsedActiveDays.includes(current.getDay()) && (isWithinActiveRange || hasData)) {
        dates.push(currentDateStr);
      }
    }
    return dates;
  }, [currentWeekOffset, activeDaysStr, activePeriodsStr, records, pendingChanges]);

  const checkHoliday = (offset: number) => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day + offset * 7;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);

    const activePeriods = JSON.parse(activePeriodsStr);
    const parsedActiveDays = JSON.parse(activeDaysStr);

    let hasActiveDay = false;
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const currentDateStr = getLocalDateString(current);

      let isWithinActiveRange = true;
      if (activePeriods.length > 0) {
        isWithinActiveRange = activePeriods.some((period: any) => {
          const startOk = !period.startDate || currentDateStr >= period.startDate;
          const endOk = !period.endDate || currentDateStr <= period.endDate;
          return startOk && endOk;
        });
      }
      if (parsedActiveDays.includes(current.getDay()) && isWithinActiveRange) {
        hasActiveDay = true;
        break;
      }
    }
    return !hasActiveDay;
  };

  const holidayBlock = useMemo(() => {
    if (weekDates.length > 0) return null;

    const activePeriods = JSON.parse(activePeriodsStr);
    const getMonday = (offset: number) => {
      const today = new Date();
      const day = today.getDay();
      const diff = (day === 0 ? -6 : 1) - day + offset * 7;
      const d = new Date(today);
      d.setDate(today.getDate() + diff);
      return d;
    };
    const getSunday = (offset: number) => {
      const d = getMonday(offset);
      d.setDate(d.getDate() + 6);
      return d;
    };

    let isOutsideActive = false;
    let isBeforeStart = false;
    let isAfterEnd = false;

    if (activePeriods.length === 0) {
      isOutsideActive = true;
      isBeforeStart = true;
      isAfterEnd = true;
    } else {
      let minDateStr = "";
      let maxDateStr = "";
      let hasUnboundedStart = false;
      let hasUnboundedEnd = false;

      activePeriods.forEach((p: any) => {
        if (!p.startDate) hasUnboundedStart = true;
        else if (!minDateStr || p.startDate < minDateStr) minDateStr = p.startDate;

        if (!p.endDate) hasUnboundedEnd = true;
        else if (!maxDateStr || p.endDate > maxDateStr) maxDateStr = p.endDate;
      });

      const currentWeekMondayStr = getLocalDateString(getMonday(currentWeekOffset));
      const currentWeekSundayStr = getLocalDateString(getSunday(currentWeekOffset));

      if (!hasUnboundedStart && minDateStr && currentWeekSundayStr < minDateStr) {
        isOutsideActive = true;
        isBeforeStart = true;
      } else if (!hasUnboundedEnd && maxDateStr && currentWeekMondayStr > maxDateStr) {
        isOutsideActive = true;
        isAfterEnd = true;
      }
    }

    if (isOutsideActive) {
      return {
        startOffset: currentWeekOffset,
        endOffset: currentWeekOffset,
        displayRange: "",
        isOutsideActive: true,
        isBeforeStart,
        isAfterEnd,
      };
    }

    let startOffset = currentWeekOffset;
    while (checkHoliday(startOffset - 1) && startOffset > currentWeekOffset - 50) {
      startOffset--;
    }

    let endOffset = currentWeekOffset;
    while (checkHoliday(endOffset + 1) && endOffset < currentWeekOffset + 50) {
      endOffset++;
    }

    const startDate = getMonday(startOffset);
    const endDate = getSunday(endOffset);

    const formatOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
    return {
      startOffset,
      endOffset,
      displayRange: `${startDate.toLocaleDateString("id-ID", formatOptions)} - ${endDate.toLocaleDateString("id-ID", formatOptions)}`,
      isOutsideActive: false,
    };
  }, [currentWeekOffset, weekDates.length, activePeriodsStr, activeDaysStr]);

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

  const currentMondayStr = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day + currentWeekOffset * 7;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    return getLocalDateString(start);
  }, [currentWeekOffset]);

  const weekTotals = useMemo(() => {
    const sabaqLines = records.filter((r) => r.type === MemorizationType.SABAQ && r.status === MemorizationStatus.LANCAR).reduce((acc, r) => acc + (r.jumlah || 0), 0);
    const sabqiPages = records.filter((r) => r.type === MemorizationType.SABQI && r.status === MemorizationStatus.LANCAR).reduce((acc, r) => acc + (r.jumlah || 0), 0);
    const manzilPages = records.filter((r) => r.type === MemorizationType.MANZIL && r.status === MemorizationStatus.LANCAR).reduce((acc, r) => acc + (r.jumlah || 0), 0);

    return { sabaqLines, sabqiPages, manzilPages };
  }, [records]);

  // Form State
  const [formData, setFormData] = useState({
    type: MemorizationType.SABAQ,
    surah_name: "Al-Fatihah",
    ayat_start: 1,
    ayat_end: 7,
    status: MemorizationStatus.EMPTY,
    record_date: (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })(),
    keterangan: "-",
    is_verified: false,
    is_read_by_parent: false,
    jumlah: 0,
  });

  const fetchData = async (force: boolean = false) => {
    if (!user.tenant_id) return;
    setLoading(true);
    try {
      const [allHalaqahsRaw, tenantData, allUsers] = await Promise.all([getHalaqahs(user.tenant_id), getTenant(user.tenant_id), getUsers(user.tenant_id)]);

      const allHalaqahs = allHalaqahsRaw.map((h) => {
        const teacher = allUsers.find((u) => u.id === h.teacher_id);
        return { ...h, teacher_name: teacher?.full_name || "-" };
      });

      // Load Cycle Config
      if (tenantData) {
        setTenant(tenantData);
        if (tenantData?.cycle_config?.activeDays) {
          setActiveDays(tenantData.cycle_config.activeDays);
        }
      }

      const myHalaqahs = allHalaqahs.filter((h) => h.teacher_id === user.id);
      const isAdminOrSupervisor = user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR;

      if (isAdminOrSupervisor) {
        setHalaqahs(allHalaqahs);
        const studentData = await getStudents(user.tenant_id);
        
        let filteredData = studentData;
        if (selectedHalaqahId !== "all") {
           filteredData = studentData.filter(s => s.halaqah_id === selectedHalaqahId);
        }
        
        setStudents(filteredData);
        if (filteredData.length > 0) {
          if (studentIdParam) {
            const found = filteredData.find((s) => s.id === studentIdParam);
            if (found) setSelectedStudent(found);
          }
        }
      }
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Gagal memuat data santri." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id, selectedHalaqahId]);

  useEffect(() => {
    setRecords([]);
    setPendingChanges({});

    // Comprehensive URL Sync (Student + Week)
    const url = new URL(window.location.href);
    let changed = false;

    if (selectedStudent && selectedStudent.id !== studentIdParam) {
      url.searchParams.set("studentId", selectedStudent.id);
      setStudentIdParam(selectedStudent.id);
      changed = true;
    }

    if (url.searchParams.get("weekOffset") !== currentWeekOffset.toString()) {
      url.searchParams.set("weekOffset", currentWeekOffset.toString());
      changed = true;
    }

    if (changed) {
      window.history.replaceState({}, "", url.toString());
    }

    if (selectedStudent) {
      fetchRecords();
    }
  }, [selectedStudent, currentWeekOffset]);

  // Auto-scroll to today on mobile load or student change
  useEffect(() => {
    if (!loading && mobileScrollRef.current) {
      const todayStr = getLocalDateString(new Date());
      const todayIndex = weekDates.indexOf(todayStr);
      if (todayIndex !== -1) {
        // Wait for render to settle
        const timer = setTimeout(() => {
          const firstDay = mobileScrollRef.current?.querySelector('th[colspan="3"]');
          if (firstDay && mobileScrollRef.current) {
            const colWidth = firstDay.clientWidth;
            mobileScrollRef.current.scrollTo({
              left: todayIndex * colWidth,
              behavior: "smooth",
            });
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, weekDates, selectedStudent?.id]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()));
  }, [students, search]);

  const recordsByDate = useMemo(() => {
    const map: Record<string, MemorizationRecord[]> = {};
    records.forEach((rec) => {
      const date = rec.record_date.split("T")[0];
      if (!map[date]) map[date] = [];
      map[date].push(rec);
    });
    return map;
  }, [records]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setGlobalLoading(true);
    try {
      const weekStart = currentMondayStr;
      const currentRecordsData = await getWeeklyMemorization(selectedStudent.id, weekStart);
      const newRecordsData = { ...currentRecordsData };

      const date = formData.record_date;
      const type = formData.type;

      const recordPayload = {
        surah_name: formData.surah_name,
        jumlah: formData.jumlah || formData.ayat_end, // Use calculated lines, fallback to ayat_end if null (previous behavior)
        ayat_end: formData.ayat_start, // Last Verse Number
        status: formData.status,
        keterangan: formData.keterangan || "-",
        score: undefined,
        is_verified: false,
        created_by: user.id,
      };

      if (!newRecordsData[date]) newRecordsData[date] = {};
      newRecordsData[date][type] = recordPayload;

      // DUAL SAVE: Weekly JSON (for Target Table) + Individual Record (for Dashboard/Activity)
      await Promise.all([
        upsertWeeklyMemorization(selectedStudent.id, weekStart, newRecordsData, user, selectedStudent.full_name),
        createRecord(
          {
            student_id: selectedStudent.id,
            teacher_id: user.id,
            type: type,
            record_date: date,
            surah_name: recordPayload.surah_name,
            ayat_start: recordPayload.ayat_end, // DB ayat_start = UI ayat_end (Position)
            ayat_end: recordPayload.jumlah, // DB ayat_end   = UI jumlah (Volume)
            status: recordPayload.status,
            keterangan: recordPayload.keterangan,
          },
          user,
          selectedStudent.full_name,
        ),
      ]);

      addNotification({ type: "success", title: "Berhasil", message: "Setoran hafalan berhasil dicatat." });
      setIsAddModalOpen(false);
      fetchRecords();
    } catch (error) {
      console.error("Add record failed:", error);
      addNotification({ type: "error", title: "Gagal", message: "Gagal mencatat setoran." });
    } finally {
      setGlobalLoading(false);
    }
  };



  useEffect(() => {
    const hasChanges = Object.keys(pendingChanges).length > 0;
    if (onSetUnsavedChanges) onSetUnsavedChanges(hasChanges);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // We DON'T reset to false here because the component might unmount
      // during a successful navigation. The parent (App.tsx) handles resetting.
    };
  }, [pendingChanges, onSetUnsavedChanges]);

  const openInitModal = () => {
    let initialSurah = "";
    let initialAyat = 0;

    if (selectedStudent) {
      const juz = selectedStudent.current_juz || 0;
      const hal = selectedStudent.current_page || 0;
      
      const sabaqPos = getSabaqPositionFromHafalan(juz, hal);
      if (sabaqPos) {
        initialSurah = sabaqPos.surah;
        initialAyat = sabaqPos.ayah;
      }
    }

    const initialSabqiPos = initialSurah && initialAyat > 0 ? getSabqiPosForSabaq(initialSurah, initialAyat) : null;

    setInitForm((prev) => ({ 
      ...prev, 
      surah: initialSurah, 
      ayat: initialAyat,
      sabqiSurah: initialSabqiPos?.surah || prev.sabqiSurah,
      sabqiAyat: initialSabqiPos?.ayah || prev.sabqiAyat,
      date: undefined 
    }));
    setIsInitModalOpen(true);
  };

  const fetchRecords = async () => {
    if (!selectedStudent) return;

    // We removed the early return for weekDates.length === 0 so that records can fetch
    // and populate weekDates for inactive days that have data.
    
    const targetId = selectedStudent.id;
    const weekStart = currentMondayStr;
    setIsFetchingRecords(true);
    try {
      const recordsData = await getWeeklyMemorization(targetId, weekStart);
      // Only update if the user hasn't switched to another student
      if (selectedStudentRef.current?.id === targetId) {
        // UNPACK: Convert JSONB map back to virtual records array for UI
        const virtualRecords: MemorizationRecord[] = [];
        Object.entries(recordsData).forEach(([date, dayRecords]: [string, any]) => {
          Object.entries(dayRecords).forEach(([type, record]: [string, any]) => {
            virtualRecords.push({
              id: `${date}|${type}`, // Virtual ID since they share one DB row
              student_id: targetId,
              type: type as MemorizationType,
              record_date: date,
              ...record,
            });
          });
        });
        setRecords(virtualRecords);
        setPendingChanges({});

        // Fetch last progress BEFORE this week for reference
        const lastMap = await getLastProgressByType(targetId, weekStart);
        setLastProgress(lastMap);

        // Fetch first record date for disabling previous days
        const firstDate = await getFirstRecordDate(targetId);
        setFirstRecordDate(firstDate);

        // Jika santri belum pernah sama sekali memiliki record, buka inisialisasi modal
        if (!firstDate && !loading) {
          openInitModal();
        }
      }
    } catch (error) {
      console.error("Fetch records failed:", error);
    } finally {
      setIsFetchingRecords(false);
    }
  };

  // Auto-scroll to today
  useEffect(() => {
    if (selectedStudent && records.length > 0) {
      const todayStr = getLocalDateString(new Date());
      // Small delay to ensure table is fully rendered
      const timer = setTimeout(() => {
        const todayElement = document.getElementById(`row-${todayStr}`);
        if (todayElement && tableContainerRef.current) {
          todayElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedStudent, records.length]);

  const toggleVerification = (date: string, type: MemorizationType, rec?: MemorizationRecord) => {
    if (!firstRecordDate) {
      openInitModal();
      addNotification({
        type: "warning",
        title: "Inisialisasi Diperlukan",
        message: "Data awal tiap santri harus ditentukan dari modal posisi hafalan terakhir.",
      });
      return;
    }

    const key = `${date}|${type}`;
    const currentVerified = pendingChanges[key]?.is_verified ?? rec?.is_verified ?? false;

    setPendingChanges((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        is_verified: !currentVerified,
      },
    }));
  };

  const findLatestPosition = (type: MemorizationType, currentDate: string, customPending?: Record<string, any>): { surah_name: string; ayat_pos: number } | null => {
    const sortedDates = [...weekDates].sort((a, b) => a.localeCompare(b)); // Ascending: 20, 21, 22...
    const currentIndex = sortedDates.indexOf(currentDate);
    const activePending = customPending || pendingChanges;

    // Check dates BEFORE currentDate in reverse
    for (let i = currentIndex - 1; i >= 0; i--) {
      const d = sortedDates[i];
      const key = `${d}|${type}`;

      const existing = (recordsByDate[d] || []).find((r) => r.type === type);
      const curr = {
        ...existing,
        ...(activePending[key] || {}),
      };

      if (curr.surah_name && curr.ayat_end) {
        return { surah_name: curr.surah_name, ayat_pos: curr.ayat_end };
      }
    }

    // Fallback to lastProgress
    const last = lastProgress[type];
    if (last) {
      return { surah_name: last.surah_name, ayat_pos: last.ayat_start };
    }
    return null;
  };

  const applyRippleEffect = (basePending: Record<string, any>, startDate: string, type: MemorizationType) => {
    let newPending = { ...basePending };
    const sortedDates = [...weekDates].sort((a, b) => a.localeCompare(b));
    const startIndex = sortedDates.indexOf(startDate);

    for (let i = startIndex + 1; i < sortedDates.length; i++) {
      const d = sortedDates[i];
      const k = `${d}|${type}`;
      const rec = (recordsByDate[d] || []).find((r) => r.type === type);
      const curr = {
        ...rec,
        ...(newPending[k] || {}),
      };

      if (curr.surah_name && curr.ayat_end) {
        const lastPos = findLatestPosition(type, d, newPending);
        if (lastPos) {
          const start = getNextAyah(lastPos.surah_name, lastPos.ayat_pos);
          if (start) {
            const val = type === MemorizationType.SABAQ ? calculateLines(start.surah, start.ayah, curr.surah_name, curr.ayat_end) : calculatePages(start.surah, start.ayah, curr.surah_name, curr.ayat_end);

            if (val <= 0 && type === MemorizationType.SABAQ) {
              newPending[k] = {
                ...newPending[k],
                surah_name: "",
                ayat_end: 0,
                jumlah: 0,
                is_verified: false,
                status: MemorizationStatus.EMPTY,
                keterangan: "-",
              };
            } else {
              newPending[k] = {
                ...newPending[k],
                jumlah: val > 0 ? val : 0,
                is_verified: false,
              };
            }
          } else {
            newPending[k] = { ...newPending[k], jumlah: 0, is_verified: false };
          }
        } else {
          newPending[k] = { ...newPending[k], jumlah: 0, is_verified: false };
        }
      }
    }
    return newPending;
  };

  const handleLocalChange = (date: string, type: MemorizationType, value: string, subType: string = "value") => {
    if (!selectedStudent) return;

    if (!firstRecordDate) {
      openInitModal();
      addNotification({
        type: "warning",
        title: "Inisialisasi Diperlukan",
        message: "Data awal tiap santri harus ditentukan dari modal posisi hafalan terakhir.",
      });
      return;
    }

    const key = `${date}|${type}`;

    // Handle Status Dropdown (String)
    if (subType === "status") {
      const isNotDepositing = value === MemorizationStatus.TIDAK_SETOR || value === MemorizationStatus.SAKIT || value === MemorizationStatus.IZIN || value === MemorizationStatus.ALPA;

      // Validation: LANCAR/TIDAK LANCAR requires Surah and Jumlah
      if (value === MemorizationStatus.LANCAR || value === MemorizationStatus.TIDAK_LANCAR) {
        const current = {
          ...((recordsByDate[date] || []).find((r) => r.type === type) || {}),
          ...(pendingChanges[key] || {}),
        };

        if (!current.surah_name || !current.jumlah || current.jumlah <= 0) {
          addNotification({
            type: "error",
            title: "Data Tidak Lengkap",
            message: `Mohon isi Nama Surah dan Total Baris/Hal terlebih dahulu sebelum memberi keterangan ${value}.`,
          });
          return;
        }
      }

      const lastRef = lastProgress[type];

      setPendingChanges((prev) => {
        const newPending = {
          ...prev,
          [key]: {
            ...prev[key],
            status: value as MemorizationStatus,
            keterangan: value,
            is_verified: false,
            is_read_by_parent: false,
          },
        };

        // GENERAL REPEAT LOGIC: If status is anything other than LANCAR/EMPTY, repeat on next day
        if (value !== MemorizationStatus.LANCAR && value !== MemorizationStatus.EMPTY) {
          const current = {
            ...((recordsByDate[date] || []).find((r) => r.type === type) || {}),
            ...(newPending[key] || {}),
          };

          const sortedDates = [...weekDates].sort((a, b) => a.localeCompare(b));
          const currentIndex = sortedDates.indexOf(date);
          if (currentIndex !== -1 && currentIndex < sortedDates.length - 1) {
            const nextDate = sortedDates[currentIndex + 1];
            const nextKey = `${nextDate}|${type}`;

            newPending[nextKey] = {
              ...newPending[nextKey],
              surah_name: current.surah_name,
              ayat_end: current.ayat_end,
              jumlah: current.jumlah,
              status: MemorizationStatus.EMPTY,
              keterangan: "-",
              is_verified: false,
              is_read_by_parent: false,
            };
          }
        }
        // UNDO REPEAT LOGIC: If changed to LANCAR, clear the next day's repeat if it matches
        else if (value === MemorizationStatus.LANCAR) {
          const current = {
            ...((recordsByDate[date] || []).find((r) => r.type === type) || {}),
            ...(newPending[key] || {}),
          };

          const sortedDates = [...weekDates].sort((a, b) => a.localeCompare(b));
          const currentIndex = sortedDates.indexOf(date);
          if (currentIndex !== -1 && currentIndex < sortedDates.length - 1) {
            const nextDate = sortedDates[currentIndex + 1];
            const nextKey = `${nextDate}|${type}`;
            const nextRec = {
              ...((recordsByDate[nextDate] || []).find((r) => r.type === type) || {}),
              ...(newPending[nextKey] || {}),
            };

            // If next day is still EMPTY and matches current day's content, clear it
            if (nextRec.status === MemorizationStatus.EMPTY && nextRec.surah_name === current.surah_name && nextRec.ayat_end === current.ayat_end) {
              newPending[nextKey] = {
                ...newPending[nextKey],
                surah_name: "",
                ayat_end: 0,
                jumlah: 0,
                status: MemorizationStatus.EMPTY,
                keterangan: "-",
                is_verified: false,
              };
            }
          }
        }

        return newPending;
      });
      return;
    }

    if (subType === "surah_name") {
      const last = findLatestPosition(type, date);
      let suggestedAyat = value === "" ? 0 : 1;
      let autoJumlah = 0;

      if (value && last) {
        const nextPoint = getNextAyah(last.surah_name, last.ayat_pos);
        if (nextPoint) {
          if (value === last.surah_name) {
            suggestedAyat = last.ayat_pos + 1;
          } else if (value === nextPoint.surah) {
            suggestedAyat = nextPoint.ayah;
          }

          if (suggestedAyat > 0) {
            autoJumlah = type === MemorizationType.SABAQ ? calculateLines(nextPoint.surah, nextPoint.ayah, value, suggestedAyat) : calculatePages(nextPoint.surah, nextPoint.ayah, value, suggestedAyat);
          }
        }
      }

      setPendingChanges((prev) => {
        const newPending = {
          ...prev,
          [key]: {
            ...prev[key],
            surah_name: value,
            ayat_end: suggestedAyat,
            jumlah: autoJumlah > 0 ? autoJumlah : 0,
            is_verified: false,
            is_read_by_parent: false,
            ...(value === "" ? { status: MemorizationStatus.EMPTY } : {}),
          },
        };
        return applyRippleEffect(newPending, date, type);
      });
      return;
    }

    // Handle empty/clear input
    if (value.trim() === "") {
      setPendingChanges((prev) => {
        const newPending = {
          ...prev,
          [key]: {
            ...prev[key],
            [subType === "score" ? "score" : subType === "ayat_end" ? "ayat_end" : "jumlah"]: null,
            is_verified: false,
            is_read_by_parent: false,
          },
        };
        return applyRippleEffect(newPending, date, type);
      });
      return;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      // Still allow null/empty for deletion
      if (value.trim() === "") return;
    }

    setPendingChanges((prev) => {
      const current = {
        ...((recordsByDate[date] || []).find((r) => r.type === type) || {}),
        ...(prev[key] || {}),
      };

      let updatedChanges = {
        ...prev[key],
        [subType === "score" ? "score" : subType === "ayat_end" ? "ayat_end" : "jumlah"]: value.trim() === "" ? null : numValue,
        is_verified: false,
        is_read_by_parent: false,
      };

      // AUTO-CALCULATE LINES
      if (subType === "ayat_end" || subType === "surah_name") {
        const targetSurah = subType === "surah_name" ? value : current.surah_name;
        const targetAyat = subType === "ayat_end" ? numValue : current.ayat_end;
        const last = findLatestPosition(type, date, prev);

        if (targetSurah && targetAyat && last) {
          const startPoint = getNextAyah(last.surah_name, last.ayat_pos);
          if (startPoint) {
            const calculatedVal = type === MemorizationType.SABAQ ? calculateLines(startPoint.surah, startPoint.ayah, targetSurah, targetAyat) : calculatePages(startPoint.surah, startPoint.ayah, targetSurah, targetAyat);

            updatedChanges.jumlah = calculatedVal > 0 ? calculatedVal : 0;
          } else {
            updatedChanges.jumlah = 0;
          }
        } else {
          // IF PREVIOUS DATA IS MISSING/EMPTY, CLEAR CURRENT JUMLAH
          updatedChanges.jumlah = 0;
        }
      }

      let newPending = {
        ...prev,
        [key]: updatedChanges,
      };

      return applyRippleEffect(newPending, date, type);
    });
  };

  const handleMassSave = async (isManual: boolean = false, isSilent: boolean = false) => {
    if (!selectedStudent || Object.keys(pendingChanges).length === 0) {
      if (isManual) {
        addNotification({ type: "info", title: "Info", message: "Tidak ada perubahan untuk disimpan." });
      }
      return;
    }

    setIsSaving(true);
    try {
      // PACK: Merge existing records with pending changes into one JSONB object
      const weekStart = currentMondayStr;
      const currentRecordsData = await getWeeklyMemorization(selectedStudent.id, weekStart);
      const newRecordsData = { ...currentRecordsData };

      // Validasi: Cegah simpan jika ada Surat yang diisi tapi Status masih kosong (- STATUS -)
      let hasValidationError = false;
      let errorMessage = "";
      for (const [key, changes] of Object.entries(pendingChanges)) {
        const [date, type] = key.split("|");
        const currentChanges = changes as any;
        const existing = (newRecordsData[date] && newRecordsData[date][type]) || {};
        const finalStatus = currentChanges.status ?? existing.status ?? MemorizationStatus.EMPTY;
        const finalSurah = currentChanges.surah_name ?? existing.surah_name ?? "";

        if (finalSurah && finalStatus === MemorizationStatus.EMPTY) {
          hasValidationError = true;
          errorMessage = `Mohon lengkapi Status untuk hafalan surat ${finalSurah}.`;
          break;
        }
      }

      if (hasValidationError) {
        addNotification({ type: "warning", title: "Data Belum Lengkap", message: errorMessage });
        setIsSaving(false);
        return;
      }

      Object.entries(pendingChanges).forEach(([key, changes]) => {
        const [date, type] = key.split("|");
        const currentChanges = changes as any;

        const existing = (newRecordsData[date] && newRecordsData[date][type]) || {};
        const finalStatus = currentChanges.status ?? existing.status ?? MemorizationStatus.EMPTY;
        const finalSurah = currentChanges.surah_name ?? existing.surah_name ?? "";

        const isAbsenteeism = finalStatus === MemorizationStatus.SAKIT || finalStatus === MemorizationStatus.IZIN || finalStatus === MemorizationStatus.ALPA || finalStatus === MemorizationStatus.TIDAK_SETOR;

        // Handle deletion (EMPTY status OR (empty surah AND NOT absenteeism))
        if (finalStatus === MemorizationStatus.EMPTY || (!finalSurah && !isAbsenteeism)) {
          if (newRecordsData[date]) {
            delete newRecordsData[date][type];
            if (Object.keys(newRecordsData[date]).length === 0) {
              delete newRecordsData[date];
            }
          }
          // Force status to EMPTY so the next block deletes it from memorization_records too
          currentChanges.status = MemorizationStatus.EMPTY;
          return;
        }

        if (!newRecordsData[date]) newRecordsData[date] = {};

        // Explicitly check for property existence to honor 'null' (cleared) state
        const hasJumlah = Object.prototype.hasOwnProperty.call(currentChanges, "jumlah");
        const hasAyatEnd = Object.prototype.hasOwnProperty.call(currentChanges, "ayat_end");

        newRecordsData[date][type] = {
          ...existing,
          ...changes,
          // Map to new UI structure for JSONB
          surah_name: currentChanges.surah_name ?? existing.surah_name ?? "",
          jumlah: hasJumlah ? (currentChanges.jumlah ?? 0) : (existing.jumlah ?? 0),
          ayat_end: hasAyatEnd ? (currentChanges.ayat_end ?? 0) : (existing.ayat_end ?? 0),
          status: currentChanges.status ?? existing.status ?? MemorizationStatus.LANCAR,
          keterangan: currentChanges.status ?? existing.status ?? MemorizationStatus.LANCAR,
        };
        // Cleanup old keys if they exist in the object
        delete (newRecordsData[date][type] as any).ayat_start;
      });

      // DUAL SAVE: Update Weekly JSON + Create/Update Individual Records
      const savePromises = Object.entries(pendingChanges).map(([key, changes]) => {
        const [date, type] = key.split("|");
        const currentChanges = changes as any;

        if (currentChanges.status === MemorizationStatus.EMPTY) {
          return deleteRecord(selectedStudent.id, type, date, user, selectedStudent.full_name);
        }

        const existing = newRecordsData[date]?.[type];
        if (!existing) return Promise.resolve();

        // Map UI keys to DB Columns
        return createRecord(
          {
            student_id: selectedStudent.id,
            teacher_id: user.id,
            type: type as MemorizationType,
            record_date: date,
            surah_name: existing.surah_name,
            ayat_start: existing.ayat_end || 0, // Posisi Ayat (from UI ayat_end)
            ayat_end: existing.jumlah || 0, // Volume (from UI jumlah)
            status: existing.status,
            keterangan: existing.status,
            is_verified: existing.is_verified,
          },
          user,
          selectedStudent.full_name,
        );
      });

      await Promise.all([upsertWeeklyMemorization(selectedStudent.id, weekStart, newRecordsData, user, selectedStudent.full_name), ...savePromises]);

      await fetchRecords();

      // --- Auto-update Juz & Halaman di tabel Students ---
      try {
        const baselines = await getLatestMemorizationBaselines([selectedStudent.id]);
        const latestSabaq = baselines[selectedStudent.id]?.sabaq;

        if (latestSabaq && latestSabaq.surah_name) {
          const totalPages = calculatePages("An-Naba'", 1, latestSabaq.surah_name, latestSabaq.ayat_start || 0);
          let calculatedJuz = Math.floor(totalPages / 20);
          let calculatedHal = totalPages % 20;

          // Maksimal Juz adalah 30 (Khatam), sisanya (seperti 604 hal) tidak boleh menjadi halaman sisa
          if (calculatedJuz >= 30) {
            calculatedJuz = 30;
            calculatedHal = 0;
          }

          if (selectedStudent.current_juz !== calculatedJuz || selectedStudent.current_page !== calculatedHal) {
            await updateStudent(
              {
                id: selectedStudent.id,
                current_juz: calculatedJuz,
                current_page: calculatedHal,
              },
              user,
            );
            // Update local student object to prevent extra calls
            selectedStudent.current_juz = calculatedJuz;
            selectedStudent.current_page = calculatedHal;
          }
        }
      } catch (err) {
        console.warn("Failed to auto-update student global progress:", err);
      }
      // ---------------------------------------------------

      setSaveCounter((c) => c + 1);

      if (!isSilent) {
        // Construct a detailed success message
        const keys = Object.keys(pendingChanges);
        let progressDetail = "";

        if (keys.length === 1) {
          const ch = pendingChanges[keys[0]] as any;
          if (ch.surah_name && ch.ayat_end) {
            progressDetail = ` (${ch.surah_name}: ${ch.ayat_end})`;
          }
        } else if (keys.length > 1) {
          // Get the record with the most recent date from the pending collection
          const sorted = keys.sort((a, b) => b.localeCompare(a));
          const latest = pendingChanges[sorted[0]] as any;
          if (latest.surah_name && latest.ayat_end) {
            progressDetail = ` (Terakhir: ${latest.surah_name}: ${latest.ayat_end})`;
          }
        }

        addNotification({
          type: "success",
          title: "Setoran Berhasil Disimpan",
          message: `Progress ${selectedStudent.full_name} berhasil diperbarui${progressDetail}.`,
        });
      }
    } catch (error: any) {
      console.error("Mass save error:", error);
      addNotification({
        type: "error",
        title: "Gagal Menyimpan",
        message: error.message || "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add effect to handle save trigger from parent
  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleMassSave(false, true)
        .then(() => {
          if (onSaveSuccess) onSaveSuccess();
        })
        .catch(() => {
          // If save fails, we don't proceed with navigation so user can fix issues
          console.error("Auto-save failed during navigation.");
        });
    }
  }, [saveTrigger]);

  const handleStudentSwitch = (student: Student) => {
    if (student.id === selectedStudent?.id) return;

    if (Object.keys(pendingChanges).length > 0) {
      setPendingStudent(student);
      setShowLocalUnsavedModal(true);
      return;
    }

    setSelectedStudent(student);
  };

  const proceedStudentSwitch = () => {
    if (pendingStudent) {
      setSelectedStudent(pendingStudent);
      setPendingStudent(null);
      setPendingChanges({});
    }
    setShowLocalUnsavedModal(false);
  };

  const handleLocalSaveAndSwitch = async () => {
    await handleMassSave(false, true);
    proceedStudentSwitch();
  };

  // Prevent double modal: if app level modal is open, hide local modal
  useEffect(() => {
    if (isGlobalModalOpen) {
      setShowLocalUnsavedModal(false);
      setPendingStudent(null);
    }
  }, [isGlobalModalOpen]);

  const getStatusIcon = (status: MemorizationStatus) => {
    switch (status) {
      case MemorizationStatus.LANCAR:
        return <Check className="w-4 h-4 text-emerald-500" />;
      case MemorizationStatus.TIDAK_LANCAR:
        return <Circle className="w-4 h-4 text-amber-500" />;
      case MemorizationStatus.TIDAK_SETOR:
        return <X className="w-4 h-4 text-rose-500" />;
      case MemorizationStatus.SAKIT:
        return <HeartPulse className="w-4 h-4 text-jade-500" />;
      case MemorizationStatus.IZIN:
        return <FileText className="w-4 h-4 text-jade-500" />;
      case MemorizationStatus.ALPA:
        return <UserX className="w-4 h-4 text-jade-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: MemorizationStatus) => {
    switch (status) {
      case MemorizationStatus.LANCAR:
        return "Lancar";
      case MemorizationStatus.TIDAK_LANCAR:
        return "Tidak Lancar";
      case MemorizationStatus.TIDAK_SETOR:
        return "Tidak Setor";
      case MemorizationStatus.SAKIT:
        return "Sakit";
      case MemorizationStatus.IZIN:
        return "Izin";
      case MemorizationStatus.ALPA:
        return "Alpa";
      default:
        return status;
    }
  };

  const getTypeColor = (type: MemorizationType) => {
    switch (type) {
      case MemorizationType.SABAQ:
        return "text-jade-600 bg-jade-50 border-jade-100";
      case MemorizationType.SABQI:
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case MemorizationType.MANZIL:
        return "text-amber-600 bg-amber-50 border-amber-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const getTypeLabel = (type: MemorizationType) => {
    switch (type) {
      case MemorizationType.SABAQ:
        return "Sabaq";
      case MemorizationType.SABQI:
        return "Sabqi";
      case MemorizationType.MANZIL:
        return "Manzil";
      default:
        return type;
    }
  };

  const handleInitialize = async () => {
    if (!selectedStudent) return;

    // Validasi: hanya Sabaq yang diisi user
    const isComplete = initForm.surah && initForm.ayat > 0;
    if (!isComplete) {
      addNotification({ type: "warning", title: "Data Belum Lengkap", message: "Mohon isi posisi terakhir Sabaq terlebih dahulu." });
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = initForm.date ? initForm.date : getLocalDateString(yesterday);
    const dateObj = initForm.date ? new Date(initForm.date) : yesterday;

    // Check for changes before submitting
    let sabaq: any, sabqi: any, manzil: any;
    records.forEach((r) => {
      if (r.record_date === dateStr && r.status === MemorizationStatus.HAFALAN_AWAL) {
        if (r.type === MemorizationType.SABAQ) sabaq = r;
        if (r.type === MemorizationType.SABQI) sabqi = r;
        if (r.type === MemorizationType.MANZIL) manzil = r;
      }
    });

    const isChanged = 
      initForm.surah !== (sabaq?.surah_name || "") ||
      initForm.ayat !== (sabaq?.ayat_end || 0) ||
      initForm.sabqiSurah !== (sabqi?.surah_name || "") ||
      initForm.sabqiAyat !== (sabqi?.ayat_end || 0) ||
      initForm.manzilSurah !== (manzil?.surah_name || "") ||
      initForm.manzilAyat !== (manzil?.ayat_end || 0);

    if (!isChanged) {
      addNotification({ type: "info", title: "Tidak Ada Perubahan", message: "Posisi hafalan tidak ada yang diubah." });
      setIsInitModalOpen(false);
      setInitForm((prev) => ({ ...prev, date: undefined }));
      return;
    }

    setIsInitializing(true);
    try {
      // Hitung week_start untuk pekan ini (Senin)
      const today = new Date();
      const todayDay = today.getDay();
      const diffToMonday = (todayDay === 0 ? -6 : 1) - todayDay;
      const weekStartObj = new Date(today);
      weekStartObj.setDate(today.getDate() + diffToMonday);
      const weekStartStr = getLocalDateString(weekStartObj);

      // Hitung week_start untuk yesterday (untuk upsert data inisialisasi)
      const yestDay = dateObj.getDay();
      const diffYest = (yestDay === 0 ? -6 : 1) - yestDay;
      const yestWeekStartObj = new Date(dateObj);
      yestWeekStartObj.setDate(dateObj.getDate() + diffYest);
      const yestWeekStartStr = getLocalDateString(yestWeekStartObj);

      // Susun posisi masing-masing tipe
      const typeData: Record<string, { surah: string; ayat: number }> = {
        [MemorizationType.SABAQ]: { surah: initForm.surah, ayat: initForm.ayat },
        [MemorizationType.SABQI]: { surah: initForm.sabqiSurah, ayat: initForm.sabqiAyat },
        [MemorizationType.MANZIL]: { surah: initForm.manzilSurah, ayat: initForm.manzilAyat },
      };

      const types = [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL];

      // Get current weekly data for yesterday's week
      const currentWeeklyData = await getWeeklyMemorization(selectedStudent.id, yestWeekStartStr);
      const updatedWeeklyData = { ...currentWeeklyData };
      if (!updatedWeeklyData[dateStr]) updatedWeeklyData[dateStr] = {};

      // Process each type
      for (const type of types) {
        const data = typeData[type];
        const recordPayload = {
          surah_name: data.surah,
          ayat_end: data.ayat,
          jumlah: 0,
          status: MemorizationStatus.HAFALAN_AWAL,
          keterangan: "Hafalan Awal",
          is_verified: true,
          created_by: user.id,
        };

        // 1. Create individual record
        await createRecord(
          {
            student_id: selectedStudent.id,
            teacher_id: user.id,
            type: type,
            record_date: dateStr,
            surah_name: data.surah,
            ayat_start: data.ayat,
            ayat_end: 0,
            status: MemorizationStatus.HAFALAN_AWAL,
            keterangan: "Hafalan Awal",
            is_verified: true,
          },
          user,
          selectedStudent.full_name,
        );

        // 2. Prepare JSONB update
        updatedWeeklyData[dateStr][type] = recordPayload;
      }

      // 3. Upsert once
      await upsertWeeklyMemorization(selectedStudent.id, yestWeekStartStr, updatedWeeklyData, user, selectedStudent.full_name);

      // --- Auto-update Juz & Halaman di tabel Students ---
      const totalPages = calculatePages("An-Naba'", 1, initForm.surah, initForm.ayat);
      let calculatedJuz = Math.floor(totalPages / 20);
      let calculatedHal = totalPages % 20;

      if (calculatedJuz >= 30) {
        calculatedJuz = 30;
        calculatedHal = 0;
      }

      if (selectedStudent.current_juz !== calculatedJuz || selectedStudent.current_page !== calculatedHal) {
        await updateStudent(
          {
            id: selectedStudent.id,
            current_juz: calculatedJuz,
            current_page: calculatedHal,
          },
          user,
        );
      }

      // --- Recalculate subsequent records ---
      try {
        const allRecords = await getStudentRecords(selectedStudent.id);
        allRecords.sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
        
        const subsequentRecords = allRecords.filter(r => r.record_date > dateStr);
        if (subsequentRecords.length > 0) {
          const currentPos: Record<string, { surah: string; ayat: number }> = {
            [MemorizationType.SABAQ]: { surah: initForm.surah, ayat: initForm.ayat },
            [MemorizationType.SABQI]: { surah: initForm.sabqiSurah, ayat: initForm.sabqiAyat },
            [MemorizationType.MANZIL]: { surah: initForm.manzilSurah, ayat: initForm.manzilAyat },
          };

          const weeklyUpdates: Record<string, any> = {};
          const recordUpdates: MemorizationRecord[] = [];

          for (const rec of subsequentRecords) {
            if (rec.status === MemorizationStatus.HAFALAN_AWAL || rec.status === MemorizationStatus.EMPTY) continue;
            const pos = currentPos[rec.type];
            if (!pos) continue;

            const isDepositing = [MemorizationStatus.LANCAR, MemorizationStatus.TIDAK_LANCAR].includes(rec.status as MemorizationStatus);
            let newJumlah = rec.ayat_end || 0; // In DB, ayat_end stores Volume (jumlah)

            if (isDepositing) {
              const startPoint = getNextAyah(pos.surah, pos.ayat);
              if (startPoint) {
                // In DB, ayat_start stores Position
                newJumlah = rec.type === MemorizationType.SABAQ 
                  ? calculateLines(startPoint.surah, startPoint.ayah, rec.surah_name, rec.ayat_start)
                  : calculatePages(startPoint.surah, startPoint.ayah, rec.surah_name, rec.ayat_start);
              }
              pos.surah = rec.surah_name;
              pos.ayat = rec.ayat_start;
            } else {
              newJumlah = 0;
            }

            if (rec.ayat_end !== newJumlah) {
              rec.ayat_end = newJumlah > 0 ? newJumlah : 0;
              recordUpdates.push(rec);

              const dObj = new Date(rec.record_date);
              const day = dObj.getDay();
              const diff = (day === 0 ? -6 : 1) - day;
              const wStartObj = new Date(dObj);
              wStartObj.setDate(dObj.getDate() + diff);
              const wStart = getLocalDateString(wStartObj);

              if (!weeklyUpdates[wStart]) {
                weeklyUpdates[wStart] = (await getWeeklyMemorization(selectedStudent.id, wStart)) || {};
              }
              if (!weeklyUpdates[wStart][rec.record_date]) {
                weeklyUpdates[wStart][rec.record_date] = {};
              }
              weeklyUpdates[wStart][rec.record_date][rec.type] = {
                ...weeklyUpdates[wStart][rec.record_date][rec.type],
                jumlah: rec.ayat_end
              };
            }
          }

          const promises: Promise<any>[] = [];
          for (const [wStart, data] of Object.entries(weeklyUpdates)) {
            promises.push(upsertWeeklyMemorization(selectedStudent.id, wStart, data, user, selectedStudent.full_name));
          }
          for (const rec of recordUpdates) {
            promises.push(updateRecord(rec.id, { ayat_end: rec.ayat_end }, user, selectedStudent.full_name));
          }

          await Promise.all(promises);
        }
      } catch (subErr) {
        console.error("Recalculation error:", subErr);
      }
      // ---------------------------------------------------

      const info = `Sabqi → ${initForm.sabqiSurah}:${initForm.sabqiAyat}, Manzil → ${initForm.manzilSurah}:${initForm.manzilAyat}`;

      addNotification({
        type: "success",
        title: "Inisialisasi Berhasil",
        message: `Posisi awal ${selectedStudent.full_name} berhasil dikonfigurasi. ${info}.`,
      });

      setIsInitModalOpen(false);
      fetchRecords();
      setInitForm((prev) => ({ ...prev, date: undefined }));
    } catch (error) {
      console.error("Initialization failed:", error);
      addNotification({ type: "error", title: "Gagal", message: "Gagal melakukan inisialisasi." });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleEditHafalanAwal = (dateStr: string) => {
    let sabaq, sabqi, manzil;
    records.forEach((r) => {
      if (r.record_date === dateStr && r.status === MemorizationStatus.HAFALAN_AWAL) {
        if (r.type === MemorizationType.SABAQ) sabaq = r;
        if (r.type === MemorizationType.SABQI) sabqi = r;
        if (r.type === MemorizationType.MANZIL) manzil = r;
      }
    });

    setInitForm({
      date: dateStr,
      surah: sabaq?.surah_name || "",
      ayat: sabaq?.ayat_end || 0,
      sabqiSurah: sabqi?.surah_name || "",
      sabqiAyat: sabqi?.ayat_end || 0,
      manzilSurah: manzil?.surah_name || "",
      manzilAyat: manzil?.ayat_end || 0,
    });
    setIsInitModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 lg:gap-6 animate-fade-in overflow-hidden no-scrollbar">
      {/* Sidebar Santri */}
      <div className="hidden lg:flex w-64 bg-white rounded-xl border-2 border-slate-300 flex-col overflow-hidden shadow-none shrink-0 h-full">
        <div className="px-4 py-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-jade-600" />
              Daftar Santri
            </h3>
            <span className="text-[10px] font-black bg-jade-50 text-jade-600 px-2 py-0.5 rounded-full ring-1 ring-jade-100">{students.length}</span>
          </div>
          <div className="flex flex-col gap-2 relative z-50">
            {/* Halaqah Dropdown */}
            <div className="relative group/halaqah z-50">
              <div className="absolute inset-0 bg-primary-100 rounded-xl blur-md opacity-0 group-hover/halaqah:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white border-2 border-slate-200 rounded-xl flex items-center px-2 py-1.5 shadow-sm hover:border-primary-300 transition-all cursor-pointer" onClick={() => setShowHalaqahDropdown(!showHalaqahDropdown)}>
                <div className="p-1.5 bg-primary-500 rounded-lg text-white shrink-0 mr-2">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col justify-center relative min-w-0">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Halaqoh / Pengampu</p>
                  <div className="flex items-center justify-between w-full">
                    <span className="bg-transparent text-[10px] font-black text-slate-800 uppercase tracking-tight truncate pointer-events-none leading-none">
                      {selectedHalaqahId === "all"
                        ? "SEMUA HALAQAH"
                        : (() => {
                            const h = halaqahs.find((h) => h.id === selectedHalaqahId);
                            return h ? `${h.name.toUpperCase()} / ${h.teacher_name?.toUpperCase() || "-"}` : "PILIH HALAQAH";
                          })()}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 pointer-events-none transition-all ${showHalaqahDropdown ? "rotate-180 text-primary-500" : ""}`} />
                  </div>
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
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                      <div
                        className={`px-3 py-2.5 border-b border-slate-200 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors truncate ${selectedHalaqahId === "all" ? "text-primary-600 bg-primary-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHalaqahId("all");
                          setSelectedStudent(null);
                          setShowHalaqahDropdown(false);
                        }}
                      >
                        SEMUA HALAQAH
                      </div>
                      {halaqahs.map((h) => (
                        <div
                          key={h.id}
                          className={`px-3 py-2.5 border-b border-slate-200 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors truncate ${selectedHalaqahId === h.id ? "text-primary-600 bg-primary-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHalaqahId(h.id);
                            setSelectedStudent(null);
                            setShowHalaqahDropdown(false);
                          }}
                        >
                          {h.name.toUpperCase()} / {h.teacher_name?.toUpperCase() || "-"}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-slate-400 transition-all outline-none placeholder:font-black placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => handleStudentSwitch(student)}
              className={`w-full flex items-center px-4 py-4 transition-all text-left group ${
                selectedStudent?.id === student.id ? "bg-jade-100 border border-jade-400 rounded-xs text-jade-700" : "hover:bg-slate-50 text-slate-600 border-transparent"
              }`}
            >
              <div className="flex-1 overflow-hidden">
                <p className={`text-[11px] font-black uppercase tracking-tight truncate ${selectedStudent?.id === student.id ? "text-jade-700" : "text-slate-800"}`}>{student.full_name}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedStudent?.id === student.id ? "text-jade-600" : "text-slate-400"}`}>NIS: {student.nis || "-"}</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedStudent?.id === student.id ? "rotate-90 text-jade-500 opacity-100" : "text-slate-400 group-hover:opacity-100 group-hover:translate-x-1"}`} />
            </button>
          ))}

          {filteredStudents.length === 0 && (
            <div className="py-12 text-center opacity-40">
              <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Santri tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden min-h-0">
        {/* Mobile Student Selector (Visible only on mobile) */}
        <div className="lg:hidden shrink-0 bg-white rounded-xl border-2 border-slate-300 overflow-visible shadow-sm relative z-100">
          <div className="flex flex-col">
            {/* Selected Student Display / Toggle Button */}
            <div className="relative">
              <button
                onClick={() => {
                  const dropdown = document.getElementById("student-mobile-dropdown");
                  if (dropdown) dropdown.classList.toggle("hidden");
                }}
                className="w-full flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-jade-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-60">Santri Terpilih</p>
                    <p className="text-[11px] font-black uppercase tracking-tight leading-none">{selectedStudent?.full_name || "Pilih Santri"}</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-md bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </button>

              {/* Dropdown Menu */}
              <div id="student-mobile-dropdown" className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-xl z-50 max-h-[75vh] overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex flex-col gap-2">
                  <div className="relative group/halaqah z-50">
                    <div className="relative bg-white border border-slate-300 rounded-lg flex items-center px-2 py-1.5 shadow-sm cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowHalaqahDropdown(!showHalaqahDropdown); }}>
                      <div className="p-1 bg-primary-500 rounded text-white shrink-0 mr-2">
                        <GraduationCap className="w-3 h-3" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center relative min-w-0">
                        <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 mt-0.5">Halaqoh / Pengampu</p>
                        <div className="flex items-center justify-between w-full">
                          <span className="bg-transparent text-[9px] font-black text-slate-800 uppercase tracking-tight truncate pointer-events-none leading-none">
                            {selectedHalaqahId === "all"
                              ? "SEMUA HALAQAH"
                              : (() => {
                                  const h = halaqahs.find((h) => h.id === selectedHalaqahId);
                                  return h ? `${h.name.toUpperCase()} / ${h.teacher_name?.toUpperCase() || "-"}` : "PILIH HALAQAH";
                                })()}
                          </span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 pointer-events-none transition-all ${showHalaqahDropdown ? "rotate-180 text-primary-500" : ""}`} />
                        </div>
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
                          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            <div
                              className={`px-3 py-2.5 border-b border-slate-200 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors truncate ${selectedHalaqahId === "all" ? "text-primary-600 bg-primary-50" : "text-slate-600"}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHalaqahId("all");
                                setSelectedStudent(null);
                                setShowHalaqahDropdown(false);
                              }}
                            >
                              SEMUA HALAQAH
                            </div>
                            {halaqahs.map((h) => (
                              <div
                                key={h.id}
                                className={`px-3 py-2.5 border-b border-slate-200 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors truncate ${selectedHalaqahId === h.id ? "text-primary-600 bg-primary-50" : "text-slate-600"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHalaqahId(h.id);
                                  setSelectedStudent(null);
                                  setShowHalaqahDropdown(false);
                                }}
                              >
                                {h.name.toUpperCase()} / {h.teacher_name?.toUpperCase() || "-"}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari santri..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-jade-50/50 focus:border-jade-400 transition-all outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin p-1.5">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        handleStudentSwitch(student);
                        document.getElementById("student-mobile-dropdown")?.classList.add("hidden");
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${selectedStudent?.id === student.id ? "bg-jade-50 text-jade-700" : "hover:bg-slate-50 text-slate-700"}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${selectedStudent?.id === student.id ? "text-jade-700" : "text-slate-800"}`}>{student.full_name}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${selectedStudent?.id === student.id ? "text-jade-500" : "text-slate-400"}`}>NIS: {student.nis || "-"}</span>
                      </div>
                      {selectedStudent?.id === student.id && <CheckCircle2 className="w-3.5 h-3.5 text-jade-500" />}
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="py-6 text-center opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tidak ditemukan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedStudent ? (
          <>
            {/* Log Table Area */}
            <div className="flex-1 bg-white rounded-xl border-2 border-slate-300 flex flex-col overflow-hidden shadow-none relative min-h-0">
              {/* Table Header Filter / Title - MADE SOLID AND SEAMLESS */}
              <div className="px-4 lg:px-6 py-2 lg:py-4 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between bg-white relative z-20 gap-2 lg:gap-0">
                <div className="hidden lg:flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                    <Book className="w-3.5 h-3.5 text-jade-500" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{selectedStudent.full_name}</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Mutaba'ah Hafalan</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-1.5 w-full lg:w-auto">
                  <div className="flex bg-white p-0.5 rounded-xl border-2 border-slate-300 ring-1 ring-white scale-90 lg:scale-100 origin-left">
                    {!holidayBlock?.isBeforeStart ? (
                      <button
                        onClick={() => (holidayBlock ? setCurrentWeekOffset(holidayBlock.startOffset - 1) : setCurrentWeekOffset((prev) => prev - 1))}
                        className="p-1 px-1.5 lg:px-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    ) : (
                      <button disabled className="p-1 px-1.5 lg:px-2 rounded-xl text-transparent cursor-default">
                        <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    )}
                    <div className="px-1.5 sm:px-2 lg:px-3 py-1 text-[7.5px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-jade-600 flex flex-col items-center justify-center min-w-27.5 sm:min-w-32.5 lg:min-w-40">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                        {holidayBlock ? holidayBlock.displayRange : weekDisplayRange}
                      </span>
                      <span className="text-[6px] lg:text-[7px] text-jade-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none">
                        {holidayBlock
                          ? "Masa Liburan"
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
                    {!holidayBlock?.isAfterEnd ? (
                      <button
                        onClick={() => (holidayBlock ? setCurrentWeekOffset(holidayBlock.endOffset + 1) : setCurrentWeekOffset((prev) => prev + 1))}
                        className="p-1 px-1.5 lg:px-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                      >
                        <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    ) : (
                      <button disabled className="p-1 px-1.5 lg:px-2 rounded-xl text-transparent cursor-default">
                        <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsInfoModalOpen(true)}
                      className="p-1.5 lg:p-2.5 bg-white border-2 border-slate-300 rounded-xl text-slate-400 hover:text-jade-600 hover:border-jade-100 transition-all group"
                      title="Informasi Target Harian"
                    >
                      <HelpCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      onClick={() => setIsProgressModalOpen(true)}
                      className="p-1.5 lg:p-2.5 bg-white border-2 border-slate-300 rounded-xl text-slate-400 hover:text-jade-600 hover:border-jade-100 transition-all group"
                      title="Informasi Jumlah Hafalan"
                    >
                      <Activity className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>

                  </div>
                </div>
              </div>

              {/* Dense Grid Table */}
              <div ref={tableContainerRef} key={selectedStudent.id} className="flex-1 flex flex-col overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mt-px">
                {/* DESKTOP VIEW - ORIGINAL TABLE */}
                {/* UNIFIED TABLE FOR BOTH MOBILE & DESKTOP */}
                <div className={`hidden lg:block ${weekDates.length === 0 ? "h-full min-h-100" : ""}`}>
                  <table className={`w-full border-separate border-spacing-0 ${weekDates.length === 0 ? "h-full" : ""}`}>
                    <thead className="sticky top-0 z-50">
                      <tr>
                        <th className="px-2 lg:px-2 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-14 min-w-14 max-w-14 lg:w-18.75 lg:min-w-18.75 sticky left-0 z-50 bg-slate-300 border-t border-b border-l border-r border-black">
                          <span className="lg:hidden">TGL</span>
                          <span className="hidden lg:inline">TANGGAL</span>
                        </th>
                        <th className="px-0 lg:px-0 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-15 min-w-15 max-w-15 lg:w-16.25 lg:min-w-16.25 sticky left-14 lg:left-18.75 z-50 bg-slate-300 border-t border-b border-r border-black">
                          SETORAN
                        </th>
                        <th className="px-2 lg:px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-20 min-w-20 lg:w-24 lg:min-w-24 border-t border-b border-r border-black bg-slate-300">
                          JUMLAH
                        </th>
                        <th className="px-6 py-4 text-[9px] lg:text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center border-t border-b border-r border-emerald-700 bg-emerald-50 w-28 min-w-28 lg:w-auto lg:min-w-auto">
                          SURAT / AYAT
                        </th>
                        <th className="px-2 lg:px-4 py-4 text-[9px] lg:text-[10px] font-black text-blue-700 uppercase tracking-widest text-center w-24 min-w-24 lg:w-48 lg:min-w-48 border-t border-b border-r border-blue-700 bg-blue-50">
                          <span className="lg:hidden">KET</span>
                          <span className="hidden lg:inline">KETERANGAN / STATUS</span>
                        </th>
                        <th className="px-4 py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-center w-24 border-t border-b border-r border-black bg-slate-300">PARAF</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(() => {
                        return weekDates.map((date) => {
                          const dayRecords = recordsByDate[date] || [];
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const rowDate = new Date(date);
                          rowDate.setHours(0, 0, 0, 0);
                          const isFuture = rowDate > today;
                          const isBeforeHafalanAwal = !!firstRecordDate && date < firstRecordDate;

                          return (
                            <React.Fragment key={date}>
                              {isFetchingRecords
                                ? [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type, idx) => (
                                    <tr key={`${date}-${type}-loading`} className="animate-pulse">
                                      {idx === 0 && (
                                        <td
                                          rowSpan={3}
                                          className="px-2 py-5 align-middle w-18.75 min-w-18.75 sticky left-0 z-20 border-b border-slate-200 bg-slate-50 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-200"
                                        >
                                          <div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div>
                                        </td>
                                      )}
                                      <td className="px-2 py-3 w-16.25 min-w-16.25 sticky left-18.75 z-20 border-b border-slate-200 bg-white shadow-[4px_0_8px_rgba(0,0,0,0.05)] after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1.5px] after:bg-slate-300">
                                        <div className="h-4 bg-slate-200 rounded w-10 mx-auto"></div>
                                      </td>
                                      <td className="px-4 py-3 border border-slate-200">
                                        <div className="h-8 bg-slate-50 rounded-lg w-full max-w-50 mx-auto"></div>
                                      </td>
                                      <td className="px-4 py-3 border border-slate-200">
                                        <div className="h-7 bg-slate-50 rounded-full w-full mx-auto"></div>
                                      </td>
                                      <td className="px-4 py-3 border border-slate-200">
                                        <div className="flex justify-center gap-2">
                                          <div className="w-7 h-7 bg-slate-50 rounded-md"></div>
                                          <div className="w-7 h-7 bg-slate-50 rounded-md"></div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                : [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type, idx) => {
                                    const dayRecords = recordsByDate[date] || [];
                                    const rec = dayRecords.find((r) => r.type === type && r.student_id === selectedStudent.id);
                                    const currentStatus = pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY;
                                    const isHafalanAwal = currentStatus === MemorizationStatus.HAFALAN_AWAL;
                                    const isRowDisabled = isBeforeHafalanAwal;
                                    const isToday = date === getLocalDateString(new Date());

                                    return (
                                      <tr key={`${date}-${type}`} className={`group ${isToday ? "bg-emerald-50/40" : "hover:bg-emerald-50/40"}`}>
                                        {idx === 0 && (
                                          <td
                                            id={`row-${date}`}
                                            rowSpan={3}
                                            className={`px-1 lg:px-2 py-3 lg:py-5 align-middle w-14 min-w-14 max-w-14 lg:w-18.75 lg:min-w-18.75 sticky left-0 z-20 border-l border-r border-b border-slate-200 opacity-100 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[0.5px] after:bg-slate-100 ${isToday ? "bg-[#ECFDF5]" : isFuture ? "bg-[#FDFDFD]" : "bg-white"} group-hover:bg-emerald-50/60`}
                                          >
                                            {isToday && <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500 shadow-[2px_0_8px_rgba(16,185,129,0.3)]"></div>}
                                            <div className="flex flex-col items-center justify-center space-y-1 text-center relative z-10">
                                              {isToday && <span className="mb-1 lg:mb-2 px-1 lg:px-1.5 py-0.5 bg-emerald-500 text-white text-[6px] lg:text-[7px] font-black rounded-full uppercase tracking-tighter">Hari Ini</span>}
                                              <p className={`text-[10px] lg:text-[11px] font-black uppercase tracking-tighter leading-tight ${isToday ? "text-emerald-700" : "text-slate-800"}`}>
                                                {new Date(date).toLocaleDateString("id-ID", { weekday: "short" })}
                                                <span className="lg:hidden">,</span>
                                              </p>
                                              <div className="lg:hidden flex flex-col items-center -space-y-0.5 mt-1">
                                                <p className={`text-[13px] font-black leading-none ${isToday ? "text-emerald-600" : "text-slate-900"}`}>{new Date(date).toLocaleDateString("id-ID", { day: "2-digit" })}</p>
                                                <p className={`text-[8.5px] font-black uppercase pt-1 tracking-tighter ${isToday ? "text-emerald-500" : "text-slate-400"}`}>
                                                  {new Date(date).toLocaleDateString("id-ID", { month: "short" }).toUpperCase()}
                                                </p>
                                              </div>
                                              <p className={`hidden lg:block text-[8px] font-medium uppercase tracking-widest ${isToday ? "text-emerald-500" : "text-slate-400"}`}>
                                                {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })}
                                              </p>
                                            </div>
                                          </td>
                                        )}
                                        <td
                                          className={`px-1 lg:px-2 py-3 sticky left-14 lg:left-18.75 z-20 w-15 min-w-15 max-w-15 lg:w-16.25 lg:min-w-16.25 border-r border-b border-slate-200 text-center transition-colors shadow-[4px_0_8px_rgba(0,0,0,0.05)] opacity-100 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[0.5px] after:bg-slate-200 ${isToday ? "bg-[#ECFDF5]" : isFuture ? "bg-[#FDFDFD]" : "bg-white group-hover:bg-emerald-50/60"}`}
                                        >
                                          <span className={`text-[8px] font-black ${isToday ? "text-emerald-600" : "text-slate-500"} uppercase tracking-tighter ${isFuture ? "opacity-60" : ""}`}>{getTypeLabel(type)}</span>
                                        </td>
                                        {/* JUMLAH COLUMN */}
                                        <td className="px-1 lg:px-2 py-1 border-b border-r border-slate-200 text-center">
                                          <div className="flex items-center justify-center">
                                            <div className="flex items-center bg-slate-100/50 border border-slate-200 rounded-lg focus-within:ring-1 focus-within:ring-jade-200 h-8 px-1.5 w-18 lg:w-21">
                                              <input
                                                type="number"
                                                readOnly
                                                disabled={isFuture || isHafalanAwal}
                                                value={(() => {
                                                  const pending = pendingChanges[`${date}|${type}`];
                                                  const val = pending && Object.prototype.hasOwnProperty.call(pending, "jumlah") ? pending.jumlah : rec?.jumlah;
                                                  return val === 0 || val === null || val === undefined ? "" : val;
                                                })()}
                                                placeholder="0"
                                                className="bg-transparent w-full text-[12px] font-black text-center text-slate-500 outline-none border-none ring-0 appearance-none cursor-default"
                                              />
                                              <span className="text-[7px] font-black text-slate-400 uppercase opacity-60 flex-none">{type === MemorizationType.SABAQ ? "Baris" : "Hal"}</span>
                                            </div>
                                          </div>
                                        </td>

                                        {/* SURAT / AYAT COLUMN */}
                                        <td className={"px-2 py-1 border-b border-slate-200 " + (openSurahDropdown === `desktop-${date}-${type}` ? "relative" : "")} style={{ zIndex: openSurahDropdown === `desktop-${date}-${type}` ? 49 : undefined }}>
                                          <div className="flex items-center gap-1 justify-center min-w-36 lg:min-w-50">
                                            <div className="flex-1 min-w-15">
                                              {(() => {
                                                let isKhatam = false;
                                                if (type === MemorizationType.SABAQ) {
                                                  const prevPos = findLatestPosition(type, date);
                                                  if (prevPos && prevPos.surah_name === "Al-Fatihah" && prevPos.ayat_pos >= 7) {
                                                    isKhatam = true;
                                                  }
                                                }

                                                if (isKhatam) {
                                                  return (
                                                    <select
                                                      disabled
                                                      className="w-full h-8 bg-jade-50 border border-jade-200 rounded-lg px-2 text-[9px] font-bold outline-none transition-all appearance-none text-center shadow-sm text-jade-700"
                                                    >
                                                      <option>Hafalan Selesai</option>
                                                    </select>
                                                  );
                                                }

                                                const dropdownId = `desktop-${date}-${type}`;
                                                const isOpen = openSurahDropdown === dropdownId;
                                                const currentValue = pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name ?? "";
                                                const disabled = true;

                                                return (
                                                  <div className="relative group/surah w-full surah-dropdown-container">
                                                    <div
                                                      onClick={(e) => {
                                                        if (isHafalanAwal) {
                                                          e.stopPropagation();
                                                          handleEditHafalanAwal(date);
                                                          return;
                                                        }
                                                        if (disabled) return;
                                                        e.stopPropagation();
                                                        if (!isOpen) {
                                                          setSurahSearchQuery("");
                                                          const rect = e.currentTarget.getBoundingClientRect();
                                                          const spaceBelow = window.innerHeight - rect.bottom;
                                                          const spaceAbove = rect.top;
                                                          setDropdownPosition(spaceBelow < 250 && spaceAbove > spaceBelow ? "top" : "bottom");
                                                        }
                                                        setOpenSurahDropdown(isOpen ? null : dropdownId);
                                                      }}
                                                      title={isHafalanAwal ? "Posisi hafalan awal, tidak ada nilai setoran" : undefined}
                                                      className={`w-full h-8 bg-white px-2.5 rounded-lg border-2 shadow-none text-[8px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all flex items-center justify-between ${isOpen ? "border-jade-400 ring-4 ring-jade-50/50" : isHafalanAwal ? "border-slate-300 border-dashed cursor-pointer hover:border-jade-400 hover:ring-2 hover:ring-jade-50/50" : "border-slate-300"} ${disabled && !isHafalanAwal ? "opacity-50 pointer-events-none" : ""}`}
                                                    >
                                                      <span className="truncate">{currentValue || "- Surat -"}</span>
                                                      <ChevronDown className={`w-3 h-3 text-slate-300 transition-all ${isOpen ? "rotate-180 text-jade-500" : "group-hover/surah:text-jade-500"}`} />
                                                    </div>

                                                    {isOpen && (
                                                      <>
                                                        <div className={`absolute ${dropdownPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-0 w-40 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-40! flex flex-col animate-in fade-in ${dropdownPosition === "top" ? "slide-in-from-bottom-2" : "slide-in-from-top-2"} duration-200`} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                                            <input
                                                              type="text"
                                                              placeholder="CARI SURAT..."
                                                              value={surahSearchQuery}
                                                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                                                              onClick={(e) => e.stopPropagation()}
                                                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[8px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-jade-400 focus:ring-2 focus:ring-jade-50/50 transition-all placeholder:text-slate-300"
                                                            />
                                                          </div>
                                                          <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                            <div
                                                              className={`px-3 py-2.5 text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${currentValue === "" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLocalChange(date, type, "", "surah_name");
                                                                setOpenSurahDropdown(null);
                                                                setSurahSearchQuery("");
                                                              }}
                                                            >
                                                              - Surat -
                                                            </div>
                                                            {SURAH_DATA.slice(0, 114)
                                                              .filter((s) => s.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                                                              .map((s) => {
                                                            let skip = false;
                                                            if (type === MemorizationType.SABAQ) {
                                                              const prevPos = findLatestPosition(type, date);
                                                              if (prevPos) {
                                                                const prevSurahIndex = SURAH_PROGRESSION.indexOf(prevPos.surah_name);
                                                                const currentSurahIndex = SURAH_PROGRESSION.indexOf(s.name);
                                                                if (currentSurahIndex < prevSurahIndex) skip = true;
                                                              }
                                                            } else if (type === MemorizationType.SABQI || type === MemorizationType.MANZIL) {
                                                              const sabaqCurrent = {
                                                                ...((recordsByDate[date] || []).find((r) => r.type === MemorizationType.SABAQ) || {}),
                                                                ...(pendingChanges[`${date}|${MemorizationType.SABAQ}`] || {})
                                                              };
                                                              let sabaqPos: { surah_name: string; ayat_pos: number } | null = null;
                                                              if (sabaqCurrent.surah_name && sabaqCurrent.ayat_end) {
                                                                sabaqPos = { surah_name: sabaqCurrent.surah_name, ayat_pos: sabaqCurrent.ayat_end };
                                                              } else {
                                                                sabaqPos = findLatestPosition(MemorizationType.SABAQ, date);
                                                              }
                                                              
                                                              if (sabaqPos) {
                                                                const sabaqSurahIndex = SURAH_PROGRESSION.indexOf(sabaqPos.surah_name);
                                                                const currentSurahIndex = SURAH_PROGRESSION.indexOf(s.name);
                                                                if (currentSurahIndex > sabaqSurahIndex) skip = true;
                                                              }
                                                            }
                                                            if (skip) return null;
                                                            
                                                            const isSelected = currentValue === s.name;
                                                            return (
                                                              <div
                                                                key={s.name}
                                                                className={`px-3 py-2.5 text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handleLocalChange(date, type, s.name, "surah_name");
                                                                  setOpenSurahDropdown(null);
                                                                  setSurahSearchQuery("");
                                                                }}
                                                              >
                                                                {s.name}
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                      </>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            </div>

                                            <span className="text-slate-300 font-bold self-center">:</span>

                                            {/* AYAT - NOW "ayat_end" */}
                                            <div
                                              onClick={(e) => {
                                                if (isHafalanAwal) {
                                                  e.stopPropagation();
                                                  handleEditHafalanAwal(date);
                                                }
                                              }}
                                              className={`flex items-center h-8 px-1 flex-none w-17 rounded-lg transition-all shadow-none ${
                                                !!!(pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name)
                                                  ? "bg-slate-50/30 border border-slate-100 opacity-30 cursor-not-allowed"
                                                  : isHafalanAwal ? "bg-white border-2 border-slate-300 border-dashed cursor-pointer hover:border-jade-400 hover:ring-2 hover:ring-jade-50/50" : "bg-slate-50/50 border border-slate-100 shadow-sm focus-within:bg-white focus-within:border-jade-400 focus-within:ring-1 focus-within:ring-jade-200"
                                              }`}
                                            >
                                              {(() => {
                                                const sName = pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name;
                                                const surahInfo = SURAH_DATA.find((s) => s.name === sName);
                                                const isSurahSelected = !!sName && sName !== "";
                                                return (
                                                  <input
                                                    type="number"
                                                    disabled={true}
                                                    placeholder="0"
                                                    min={0}
                                                    max={surahInfo?.totalAyah || 286}
                                                    value={(() => {
                                                      // Force empty string (placeholder) if no surah is selected
                                                      if (!isSurahSelected) return "";
                                                      const pending = pendingChanges[`${date}|${type}`];
                                                      const val = pending && Object.prototype.hasOwnProperty.call(pending, "ayat_end") ? pending.ayat_end : rec?.ayat_end;
                                                      return val === 0 || val === null || val === undefined ? "" : val;
                                                    })()}
                                                    onChange={(e) => {
                                                      const rawVal = e.target.value;
                                                      const cleanedVal = rawVal.replace("-", "").replace(/^0+(?=\d)/, "");
                                                      if (cleanedVal === "") {
                                                        handleLocalChange(date, type, "", "ayat_end");
                                                        return;
                                                      }
                                                      let val = parseInt(cleanedVal);
                                                      if (isNaN(val)) val = 0;
                                                      if (val < 0) val = 0;
                                                      if (surahInfo && val > surahInfo.totalAyah) val = surahInfo.totalAyah;
                                                      handleLocalChange(date, type, val.toString(), "ayat_end");
                                                    }}
                                                    className={`bg-transparent w-full text-[12px] font-black text-center text-slate-700 outline-none border-none ring-0 h-full ${isHafalanAwal ? "pointer-events-none" : ""}`}
                                                  />
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </td>
                                        <td className={`px-1 lg:px-2 py-1 border-b border-slate-200 min-w-12.5 lg:min-w-45 ${isFuture ? "opacity-40 pointer-events-none grayscale-[0.5]" : ""}`}>
                                          <div className="flex flex-col gap-1">
                                            {/* Desktop Select */}
                                            {(() => {
                                              const dropdownId = `desktop-status-${date}-${type}`;
                                              const isOpen = openStatusDropdown === dropdownId;
                                              const disabled = true;
                                              const STATUS_OPTIONS = [
                                                { value: MemorizationStatus.EMPTY, label: "- STATUS -" },
                                                ...(isHafalanAwal ? [{ value: MemorizationStatus.HAFALAN_AWAL, label: "HAFALAN AWAL" }] : []),
                                                { value: MemorizationStatus.LANCAR, label: "LANCAR" },
                                                { value: MemorizationStatus.TIDAK_LANCAR, label: "TIDAK LANCAR" },
                                                { value: MemorizationStatus.TIDAK_SETOR, label: "TIDAK SETOR" },
                                                { value: MemorizationStatus.SAKIT, label: "SAKIT" },
                                                { value: MemorizationStatus.IZIN, label: "IZIN" },
                                                { value: MemorizationStatus.ALPA, label: "ALPA" },
                                              ];
                                              const currentLabel = STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label || "- STATUS -";

                                              const bgColor =
                                                currentStatus === MemorizationStatus.HAFALAN_AWAL
                                                  ? "bg-blue-100 text-blue-800 border-blue-400"
                                                  : currentStatus === MemorizationStatus.LANCAR
                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                                                    : currentStatus === MemorizationStatus.TIDAK_LANCAR
                                                      ? "bg-amber-100 text-amber-800 border-amber-400"
                                                      : currentStatus === MemorizationStatus.TIDAK_SETOR
                                                        ? "bg-rose-100 text-rose-800 border-rose-400"
                                                        : currentStatus === MemorizationStatus.SAKIT || currentStatus === MemorizationStatus.IZIN || currentStatus === MemorizationStatus.ALPA
                                                          ? "bg-rose-100 text-rose-800 border-rose-400"
                                                          : "bg-white text-slate-800 border-slate-300";

                                              return (
                                                <div className="relative w-full status-dropdown-container hidden lg:block">
                                                  <div
                                                    onClick={(e) => {
                                                      if (disabled) return;
                                                      if (!isOpen) {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const spaceAbove = rect.top;
                                                        setDropdownPosition(spaceBelow < 250 && spaceAbove > spaceBelow ? "top" : "bottom");
                                                      }
                                                      setOpenStatusDropdown(isOpen ? null : dropdownId);
                                                    }}
                                                    className={`group/status w-full h-8 px-2.5 rounded-lg border-2 shadow-none text-[8px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer flex items-center justify-between ${isOpen ? "border-blue-400 ring-4 ring-blue-50/50" : ""} ${bgColor} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                                                  >
                                                    <span className="truncate">{currentLabel}</span>
                                                    <ChevronDown className={`w-3 h-3 transition-all flex-none ml-1 opacity-50 group-hover/status:opacity-100 ${isOpen ? "rotate-180" : ""}`} />
                                                  </div>
                                                  {isOpen && (
                                                    <div className={`absolute ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-2"} left-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-40! flex flex-col animate-in fade-in ${dropdownPosition === "top" ? "slide-in-from-bottom-2" : "slide-in-from-top-2"} duration-200`}>
                                                      <div className="flex flex-col">
                                                        {STATUS_OPTIONS.map((opt) => {
                                                          const isSelected = currentStatus === opt.value;
                                                          const isPlaceholder = opt.value === MemorizationStatus.EMPTY;
                                                          const selectedClass = isPlaceholder ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700";
                                                          return (
                                                            <div
                                                              key={opt.value}
                                                              className={`px-3 py-2.5 text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? selectedClass : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLocalChange(date, type, opt.value, "status");
                                                                setOpenStatusDropdown(null);
                                                              }}
                                                            >
                                                              {opt.label}
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}

                                            {/* Mobile Select (Symbols Only) */}
                                            {(() => {
                                              const dropdownId = `mobile-inline-status-${date}-${type}`;
                                              const isOpen = openStatusDropdown === dropdownId;
                                              const disabled = true;
                                              const STATUS_OPTIONS = [
                                                { value: MemorizationStatus.EMPTY, label: "-" },
                                                ...(isHafalanAwal ? [{ value: MemorizationStatus.HAFALAN_AWAL, label: "AWL" }] : []),
                                                { value: MemorizationStatus.LANCAR, label: "LANCAR" },
                                                { value: MemorizationStatus.TIDAK_LANCAR, label: "TIDAK LANCAR" },
                                                { value: MemorizationStatus.TIDAK_SETOR, label: "TIDAK SETOR" },
                                                { value: MemorizationStatus.SAKIT, label: "SAKIT" },
                                                { value: MemorizationStatus.IZIN, label: "IZIN" },
                                                { value: MemorizationStatus.ALPA, label: "ALPA" },
                                              ];
                                              const currentLabel = STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label || "-";

                                              const bgColor =
                                                currentStatus === MemorizationStatus.HAFALAN_AWAL
                                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                                  : currentStatus === MemorizationStatus.LANCAR
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    : currentStatus === MemorizationStatus.TIDAK_LANCAR
                                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                                      : currentStatus === MemorizationStatus.TIDAK_SETOR
                                                        ? "bg-rose-50 text-rose-800 border-rose-200"
                                                        : currentStatus === MemorizationStatus.SAKIT || currentStatus === MemorizationStatus.IZIN || currentStatus === MemorizationStatus.ALPA
                                                          ? "bg-rose-50 text-rose-800 border-rose-200"
                                                          : "bg-white text-slate-800 border-slate-300";

                                              return (
                                                <div className="relative w-full status-dropdown-container block lg:hidden">
                                                  <div
                                                    onClick={(e) => {
                                                      if (disabled) return;
                                                      if (!isOpen) {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const spaceAbove = rect.top;
                                                        setDropdownPosition(spaceBelow < 250 && spaceAbove > spaceBelow ? "top" : "bottom");
                                                      }
                                                      setOpenStatusDropdown(isOpen ? null : dropdownId);
                                                    }}
                                                    className={`group/status w-full h-8 px-2.5 rounded-lg border-2 shadow-none text-[8px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer flex items-center justify-between ${isOpen ? "border-blue-400 ring-4 ring-blue-50/50" : ""} ${bgColor} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                                                  >
                                                    <span className="truncate">{currentLabel}</span>
                                                    <ChevronDown className={`w-3 h-3 transition-all flex-none ml-1 opacity-50 group-hover/status:opacity-100 ${isOpen ? "rotate-180" : ""}`} />
                                                  </div>
                                                  {isOpen && (
                                                    <div className={`absolute ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"} left-0 w-24 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-40! flex flex-col animate-in fade-in ${dropdownPosition === "top" ? "slide-in-from-bottom-2" : "slide-in-from-top-2"} duration-200`}>
                                                      <div className="flex flex-col">
                                                        {STATUS_OPTIONS.map((opt) => {
                                                          const isSelected = currentStatus === opt.value;
                                                          const isPlaceholder = opt.value === MemorizationStatus.EMPTY;
                                                          const selectedClass = isPlaceholder ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700";
                                                          return (
                                                            <div
                                                              key={opt.value}
                                                              className={`px-3 py-2 text-[7.5px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? selectedClass : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLocalChange(date, type, opt.value, "status");
                                                                setOpenStatusDropdown(null);
                                                              }}
                                                            >
                                                              {opt.label}
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </td>
                                        <td className={`px-2 py-3 border-b border-slate-200 text-center w-24`}>
                                          <div className="flex items-center justify-center gap-2">
                                            {/* Guru Paraf */}
                                            {(() => {
                                              const p = pendingChanges[`${date}|${type}`];
                                              const isCompletable = (p?.surah_name ?? rec?.surah_name) && (p?.jumlah ?? rec?.jumlah) > 0 && (p?.status ?? rec?.status) && (p?.status ?? rec?.status) !== MemorizationStatus.EMPTY;

                                              return (
                                                <button
                                                  disabled={isFuture || !isCompletable || isRowDisabled}
                                                  onClick={() => toggleVerification(date, type, rec)}
                                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                    (pendingChanges[`${date}|${type}`]?.is_verified ?? rec?.is_verified)
                                                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                      : !isCompletable
                                                        ? "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                                                        : "bg-slate-50 border border-slate-100 text-slate-400 opacity-20 hover:opacity-100 hover:border-jade-400 hover:text-jade-400 hover:bg-white"
                                                  }`}
                                                  title={
                                                    isFuture
                                                      ? "Belum masuk tanggalnya"
                                                      : !isCompletable
                                                        ? "Lengkapi data (Surat, Ayat, Status) untuk memaraf"
                                                        : (pendingChanges[`${date}|${type}`]?.is_verified ?? rec?.is_verified)
                                                          ? "Terverifikasi (Pending)"
                                                          : "Klik untuk memaraf"
                                                  }
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                </button>
                                              );
                                            })()}

                                            {/* Ortu Indicator */}
                                            <div
                                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                rec?.is_read_by_parent ? "bg-jade-50 text-jade-600 border border-jade-100" : "bg-slate-50 border border-slate-100 opacity-20"
                                              }`}
                                              title="Paraf Orang Tua"
                                            >
                                              {rec?.is_read_by_parent ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                            </React.Fragment>
                          );
                        });
                      })()}
                      {weekDates.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`text-center bg-slate-50/30 border-b border-l border-r border-slate-300 shadow-inner ${holidayBlock?.isOutsideActive ? "py-24" : "py-16"}`}>
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 ring-1 ring-slate-100 shadow-sm">
                              <BookOpen className="w-8 h-8 opacity-50" />
                            </div>
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{holidayBlock?.isOutsideActive ? "Belum ada Tanggal Aktif" : "Masa Liburan"}</h4>
                            <p className="text-[10px] font-bold text-slate-400 text-center max-w-62.5 mx-auto leading-relaxed">
                              {holidayBlock?.isOutsideActive ? "Tanggal yang dipilih berada di luar periode aktif yang telah dikonfigurasi oleh admin." : "Tidak ada hari efektif yang dikonfigurasi pada periode ini."}
                            </p>
                            {holidayBlock && !holidayBlock.isOutsideActive && (
                              <div className="inline-block mt-4 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest border border-emerald-100">{holidayBlock.displayRange}</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE VIEW - TRANSPOSED TABLE */}
                <div ref={mobileScrollRef} className={`lg:hidden flex-1 h-full overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory scroll-smooth ${weekDates.length === 0 ? "min-h-100" : ""}`} style={{ scrollPaddingLeft: "44px" }}>
                  {weekDates.length > 0 ? (
                    <table className="border-separate table-fixed w-max border-spacing-0 h-full">
                      <thead>
                        <tr className="snap-start">
                          <th className="sticky left-0 z-70 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                            <div className="flex flex-col items-center justify-center gap-1.5 py-2 h-full">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TGL</span>
                              <div className="flex items-center justify-center gap-1 w-full px-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollMobileDays("left");
                                  }}
                                  className="text-jade-600 hover:bg-jade-50 rounded transition-colors"
                                >
                                  <ChevronLeft className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollMobileDays("right");
                                  }}
                                  className="text-jade-600 hover:bg-jade-50 rounded transition-colors"
                                >
                                  <ChevronRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </th>
                          {weekDates.map((date) => {
                            const isToday = date === getLocalDateString(new Date());
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
                            const isToday = date === getLocalDateString(new Date());
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
                            const isToday = date === getLocalDateString(new Date());
                            return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                              const rec = (recordsByDate[date] || []).find((r) => r.type === type);
                              const rowDate = new Date(date);
                              rowDate.setHours(0, 0, 0, 0);
                              const isFuture = rowDate > new Date();
                              const colWidth = "calc((100vw - 80px) / 3)";
                              const currentStatus = pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY;
                              const isHafalanAwal = currentStatus === MemorizationStatus.HAFALAN_AWAL;

                              return (
                                <td
                                  key={`${date}-${type}-jumlah`}
                                  style={{ width: colWidth, minWidth: colWidth }}
                                  className={`p-1 border-b border-l border-slate-100 ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                                >
                                  <div className="flex flex-col items-center justify-center h-full w-full">
                                    <div className="flex items-center bg-white border-2 border-slate-300 rounded-md shadow-none focus-within:border-jade-400 focus-within:ring-2 focus-within:ring-jade-50/50 transition-all h-6 px-1.5 w-[92%] max-w-12.5">
                                      <input
                                        type="number"
                                        readOnly
                                        disabled={isFuture || isHafalanAwal}
                                        value={(() => {
                                          const pending = pendingChanges[`${date}|${type}`];
                                          const val = pending && Object.prototype.hasOwnProperty.call(pending, "jumlah") ? pending.jumlah : rec?.jumlah;
                                          return val === 0 || val === null || val === undefined ? "" : val;
                                        })()}
                                        placeholder="0"
                                        className="bg-transparent w-full text-[10px] font-black text-center text-slate-500 outline-none border-none ring-0 appearance-none cursor-default"
                                      />
                                      <span className="text-[6px] font-black text-slate-400 uppercase opacity-60 flex-none">{type === MemorizationType.SABAQ ? "Brs" : "Hal"}</span>
                                    </div>
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
                              <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">SURAT / AYAT</span>
                            </div>
                          </th>
                          {weekDates.map((date) => {
                            const isToday = date === getLocalDateString(new Date());
                            return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                              const rec = (recordsByDate[date] || []).find((r) => r.type === type);
                              const rowDate = new Date(date);
                              rowDate.setHours(0, 0, 0, 0);
                              const isFuture = rowDate > new Date();
                              const colWidth = "calc((100vw - 80px) / 3)";
                              const currentStatus = pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY;
                              const isHafalanAwal = currentStatus === MemorizationStatus.HAFALAN_AWAL;

                              return (
                                <td
                                  key={`${date}-${type}-surah`}
                                  style={{ width: colWidth, minWidth: colWidth, zIndex: openSurahDropdown === `mobile-${date}-${type}` ? 99 : undefined }}
                                  className={`p-1 border-b border-l border-slate-100 ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                                >
                                  <div className="flex flex-col gap-1 w-full items-center">
                                    {/* Row 1: SURAH SELECT */}
                                    <div className="relative group/surah w-[92%] surah-dropdown-container">
                                      {(() => {
                                        const dropdownId = `mobile-${date}-${type}`;
                                        const isOpen = openSurahDropdown === dropdownId;
                                        const currentValue = pendingChanges[`${date}|${type}`]?.surah_name ?? rec?.surah_name ?? "";
                                        const disabled = true;

                                        return (
                                          <>
                                            <div
                                              onClick={(e) => {
                                                if (isHafalanAwal) {
                                                  e.stopPropagation();
                                                  handleEditHafalanAwal(date);
                                                  return;
                                                }
                                                if (disabled) return;
                                                e.stopPropagation();
                                                if (!isOpen) {
                                                  setSurahSearchQuery("");
                                                  const rect = e.currentTarget.getBoundingClientRect();
                                                  const spaceBelow = window.innerHeight - rect.bottom;
                                                  const spaceAbove = rect.top;
                                                  setDropdownPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom");
                                                }
                                                setOpenSurahDropdown(isOpen ? null : dropdownId);
                                              }}
                                              title={isHafalanAwal ? "Posisi hafalan awal, tidak ada nilai setoran" : undefined}
                                              className={`w-full h-6 bg-white px-1.5 rounded-md border-2 shadow-none text-[6px] font-black uppercase tracking-wider text-slate-600 outline-none transition-all flex items-center justify-between ${isOpen ? "border-jade-400 ring-2 ring-jade-50/50" : isHafalanAwal ? "border-slate-300 border-dashed cursor-pointer hover:border-jade-400 hover:ring-2 hover:ring-jade-50/50" : "border-slate-300"} ${disabled && !isHafalanAwal ? "opacity-50 pointer-events-none" : ""}`}
                                            >
                                              <span className="truncate">{currentValue || "- Surat -"}</span>
                                              <ChevronDown className={`w-2.5 h-2.5 text-slate-300 transition-all ${isOpen ? "rotate-180 text-jade-500" : "group-hover/surah:text-jade-500"}`} />
                                            </div>

                                            {isOpen && (
                                              <>
                                                <div className={`absolute ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"} left-0 w-30 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-40! flex flex-col animate-in fade-in ${dropdownPosition === "top" ? "slide-in-from-bottom-2" : "slide-in-from-top-2"} duration-200`} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                                  <div className="p-1.5 border-b border-slate-100 bg-slate-50/50">
                                                    <input
                                                      type="text"
                                                      placeholder="CARI SURAT..."
                                                      value={surahSearchQuery}
                                                      onChange={(e) => setSurahSearchQuery(e.target.value)}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[6.5px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-jade-400 focus:ring-2 focus:ring-jade-50/50 transition-all placeholder:text-slate-300"
                                                    />
                                                  </div>
                                                  <div className="max-h-40 overflow-y-auto no-scrollbar">
                                                    <div
                                                      className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${currentValue === "" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLocalChange(date, type, "", "surah_name");
                                                        setOpenSurahDropdown(null);
                                                        setSurahSearchQuery("");
                                                      }}
                                                    >
                                                      - Surat -
                                                    </div>
                                                    {SURAH_DATA.slice(0, 114)
                                                      .filter((s) => s.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                                                      .map((s) => {
                                                    let skip = false;
                                                    if (type === MemorizationType.SABAQ) {
                                                      const prevPos = findLatestPosition(type, date);
                                                      if (prevPos) {
                                                        const prevSurahIndex = SURAH_PROGRESSION.indexOf(prevPos.surah_name);
                                                        const currentSurahIndex = SURAH_PROGRESSION.indexOf(s.name);
                                                        if (currentSurahIndex < prevSurahIndex) skip = true;
                                                      }
                                                    } else if (type === MemorizationType.SABQI || type === MemorizationType.MANZIL) {
                                                      const sabaqCurrent = {
                                                        ...((recordsByDate[date] || []).find((r) => r.type === MemorizationType.SABAQ) || {}),
                                                        ...(pendingChanges[`${date}|${MemorizationType.SABAQ}`] || {})
                                                      };
                                                      let sabaqPos: { surah_name: string; ayat_pos: number } | null = null;
                                                      if (sabaqCurrent.surah_name && sabaqCurrent.ayat_end) {
                                                        sabaqPos = { surah_name: sabaqCurrent.surah_name, ayat_pos: sabaqCurrent.ayat_end };
                                                      } else {
                                                        sabaqPos = findLatestPosition(MemorizationType.SABAQ, date);
                                                      }
                                                      
                                                      if (sabaqPos) {
                                                        const sabaqSurahIndex = SURAH_PROGRESSION.indexOf(sabaqPos.surah_name);
                                                        const currentSurahIndex = SURAH_PROGRESSION.indexOf(s.name);
                                                        if (currentSurahIndex > sabaqSurahIndex) skip = true;
                                                      }
                                                    }
                                                    if (skip) return null;
                                                    
                                                    const isSelected = currentValue === s.name;
                                                    return (
                                                      <div
                                                        key={s.name}
                                                        className={`px-2.5 py-2 text-[7px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleLocalChange(date, type, s.name, "surah_name");
                                                          setOpenSurahDropdown(null);
                                                          setSurahSearchQuery("");
                                                        }}
                                                      >
                                                        {s.name}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                              </>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* Row 2: AYAT INPUT */}
                                    <div 
                                      className={`relative w-[92%] h-6 flex items-center justify-center rounded-md transition-all ${isHafalanAwal ? "bg-white border-2 border-slate-300 border-dashed cursor-pointer hover:border-jade-400 hover:ring-2 hover:ring-jade-50/50" : "bg-white border-2 border-slate-300 shadow-none focus-within:border-jade-400 focus-within:ring-2 focus-within:ring-jade-50/50"}`}
                                      onClick={(e) => {
                                        if (isHafalanAwal) {
                                          e.stopPropagation();
                                          handleEditHafalanAwal(date);
                                        }
                                      }}
                                    >
                                      <input
                                        type="number"
                                        disabled={true}
                                        placeholder="Ayat"
                                        value={(() => {
                                          const pending = pendingChanges[`${date}|${type}`];
                                          const val = pending && Object.prototype.hasOwnProperty.call(pending, "ayat_end") ? pending.ayat_end : rec?.ayat_end;
                                          return val === 0 || val === null || val === undefined ? "" : val;
                                        })()}
                                        onChange={(e) => handleLocalChange(date, type, e.target.value, "ayat_end")}
                                        className={`w-full bg-transparent text-[6.5px] font-black text-center outline-none border-none ring-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isHafalanAwal ? "pointer-events-none" : ""}`}
                                      />
                                    </div>
                                  </div>
                                </td>
                              );
                            });
                          })}
                        </tr>

                        {/* KETERANGAN ROW */}
                        <tr className="hover:bg-slate-50/30 snap-start">
                          <th className="sticky left-0 z-50 bg-slate-50 border-b border-r-2 border-slate-300 w-11 min-w-11">
                            <div className="flex items-center justify-center h-full w-full py-2">
                              <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">KET</span>
                            </div>
                          </th>
                          {weekDates.map((date) => {
                            const isToday = date === getLocalDateString(new Date());
                            return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                              const rec = (recordsByDate[date] || []).find((r) => r.type === type);
                              const rowDate = new Date(date);
                              rowDate.setHours(0, 0, 0, 0);
                              const isFuture = rowDate > new Date();
                              const currentStatus = pendingChanges[`${date}|${type}`]?.status ?? rec?.status ?? MemorizationStatus.EMPTY;
                              const isHafalanAwal = currentStatus === MemorizationStatus.HAFALAN_AWAL;
                              const colWidth = "calc((100vw - 80px) / 3)";

                              return (
                                <td
                                  key={`${date}-${type}-status`}
                                  style={{ width: colWidth, minWidth: colWidth }}
                                  className={`p-1 border-b border-l justify-center border-slate-100 ${isFuture ? "opacity-30 pointer-events-none" : ""} ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                                >
                                  {(() => {
                                        const dropdownId = `mobile-transposed-status-${date}-${type}`;
                                        const isOpen = openStatusDropdown === dropdownId;
                                        const disabled = true;
                                        const STATUS_OPTIONS = [
                                          { value: MemorizationStatus.EMPTY, label: "-" },
                                          ...(isHafalanAwal ? [{ value: MemorizationStatus.HAFALAN_AWAL, label: "AWL" }] : []),
                                          { value: MemorizationStatus.LANCAR, label: "LANCAR" },
                                          { value: MemorizationStatus.TIDAK_LANCAR, label: "TIDAK LANCAR" },
                                          { value: MemorizationStatus.TIDAK_SETOR, label: "TIDAK SETOR" },
                                          { value: MemorizationStatus.SAKIT, label: "SAKIT" },
                                          { value: MemorizationStatus.IZIN, label: "IZIN" },
                                          { value: MemorizationStatus.ALPA, label: "ALPA" },
                                        ];
                                        const currentLabel = STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label || "-";

                                        const bgColor =
                                          currentStatus === MemorizationStatus.HAFALAN_AWAL
                                            ? "bg-blue-50 text-blue-600 border-blue-200"
                                            : currentStatus === MemorizationStatus.LANCAR
                                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                              : currentStatus === MemorizationStatus.TIDAK_LANCAR
                                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                                : currentStatus === MemorizationStatus.TIDAK_SETOR
                                                  ? "bg-rose-50 text-rose-600 border-rose-200"
                                                  : currentStatus === MemorizationStatus.SAKIT || currentStatus === MemorizationStatus.IZIN || currentStatus === MemorizationStatus.ALPA
                                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                                    : "bg-white text-slate-600 border-slate-300";

                                        return (
                                          <div className="flex flex-col items-center justify-center h-full w-full">
                                            <div className="relative w-[92%] status-dropdown-container flex justify-center">
                                            <div
                                              onClick={(e) => {
                                                if (disabled) return;
                                                if (!isOpen) {
                                                  const rect = e.currentTarget.getBoundingClientRect();
                                                  const spaceBelow = window.innerHeight - rect.bottom;
                                                  const spaceAbove = rect.top;
                                                  setDropdownPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom");
                                                }
                                                setOpenStatusDropdown(isOpen ? null : dropdownId);
                                              }}
                                              className={`group/status w-full h-6 px-1.5 rounded-md border-2 shadow-none text-[6.5px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer flex items-center justify-center relative ${isOpen ? "border-blue-400 ring-2 ring-blue-50/50" : ""} ${bgColor} ${disabled && !isHafalanAwal ? "opacity-50 pointer-events-none" : ""}`}
                                            >
                                              <span className="w-full text-center truncate pr-3 pl-1">{currentLabel}</span>
                                              <ChevronDown className={`w-2.5 h-2.5 transition-all absolute right-1.5 opacity-50 group-hover/status:opacity-100 ${isOpen ? "rotate-180" : ""}`} />
                                            </div>
                                            {isOpen && (
                                              <div className={`absolute ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-2"} left-1/2 -translate-x-1/2 w-20 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-40! flex flex-col animate-in fade-in ${dropdownPosition === "top" ? "slide-in-from-bottom-2" : "slide-in-from-top-2"} duration-200`}>
                                                <div className="flex flex-col">
                                                  {STATUS_OPTIONS.map((opt) => {
                                                    const isSelected = currentStatus === opt.value;
                                                    const isPlaceholder = opt.value === MemorizationStatus.EMPTY;
                                                    const selectedClass = isPlaceholder ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700";
                                                    return (
                                                      <div
                                                        key={opt.value}
                                                        className={`px-2 py-1.5 text-[6px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isSelected ? selectedClass : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleLocalChange(date, type, opt.value, "status");
                                                          setOpenStatusDropdown(null);
                                                        }}
                                                      >
                                                        {opt.label}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        );
                                      })()}
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
                            const isToday = date === getLocalDateString(new Date());
                            return [MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((type) => {
                              const rec = (recordsByDate[date] || []).find((r) => r.type === type);
                              const rowDate = new Date(date);
                              rowDate.setHours(0, 0, 0, 0);
                              const isFuture = rowDate > new Date();
                              const p = pendingChanges[`${date}|${type}`];
                              const isCompletable = (p?.surah_name ?? rec?.surah_name) && (p?.jumlah ?? rec?.jumlah) > 0 && (p?.status ?? rec?.status) && (p?.status ?? rec?.status) !== MemorizationStatus.EMPTY;
                              const colWidth = "calc((100vw - 80px) / 3)";

                              return (
                                <td
                                  key={`${date}-${type}-paraf`}
                                  style={{ width: colWidth, minWidth: colWidth }}
                                  className={`p-1 border-b border-l border-slate-100 ${isFuture ? "opacity-30 pointer-events-none" : ""} ${isToday ? "bg-emerald-50/40" : ""} relative ${isToday && type === MemorizationType.SABAQ ? 'after:content-[""] after:absolute after:top-0 after:left-0 after:bottom-0 after:w-0.5 after:bg-emerald-500 after:z-10' : ""} ${isToday && type === MemorizationType.MANZIL ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-0.5 before:bg-emerald-500 before:z-10' : ""}`}
                                >
                                  <div className="flex flex-row items-center justify-center gap-1">
                                    <button
                                      disabled={isFuture || !isCompletable}
                                      onClick={() => toggleVerification(date, type, rec)}
                                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                                        (pendingChanges[`${date}|${type}`]?.is_verified ?? rec?.is_verified) ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : !isCompletable ? "bg-slate-50 border border-slate-100 text-slate-400 opacity-20" : "bg-slate-50 border border-slate-100 text-slate-400 opacity-20 hover:opacity-100 hover:border-jade-400 hover:text-jade-400 hover:bg-white"
                                      }`}
                                    >
                                      <Check className="w-2.5 h-2.5" />
                                    </button>
                                    <div
                                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                                        rec?.is_read_by_parent ? "bg-jade-50 text-jade-600 border border-jade-100" : "bg-slate-50 border border-slate-100 opacity-20"
                                      }`}
                                    >
                                      {rec?.is_read_by_parent ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                                    </div>
                                  </div>
                                </td>
                              );
                            });
                          })}
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className={`flex flex-col items-center justify-center bg-slate-50/30 h-full w-full max-w-sm mx-auto ${holidayBlock?.isOutsideActive ? "py-20" : "py-12"}`}>
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-300 ring-1 ring-slate-200 shadow-sm">
                        <BookOpen className="w-7 h-7 opacity-50" />
                      </div>
                      <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{holidayBlock?.isOutsideActive ? "Belum ada Tanggal Aktif" : "Masa Liburan"}</h4>
                      <p className="text-[10px] font-bold text-slate-400 text-center max-w-50 leading-relaxed">
                        {holidayBlock?.isOutsideActive ? "Tanggal yang dipilih berada di luar periode aktif yang telah dikonfigurasi." : "Tidak ada hari efektif yang dikonfigurasi pada periode ini."}
                      </p>
                      {holidayBlock && !holidayBlock.isOutsideActive && (
                        <div className="inline-block mt-4 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest border border-emerald-100">{holidayBlock.displayRange}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-slate-300 shadow-sm min-h-75">
            <div className="relative mb-6 group">
              {/* Decorative Background Circles */}
              <div className="absolute inset-0 bg-jade-100/50 rounded-32px blur-xl group-hover:scale-110 transition-transform duration-700"></div>

              {/* Main Icon Container */}
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 bg-linear-to-br from-jade-50 to-white border border-jade-100/50 rounded-32px shadow-inner flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] opacity-[0.03]"></div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-jade-500/10 rounded-full flex items-center justify-center animate-bounce-slow">
                  <Users className="w-6 h-6 lg:w-7 lg:h-7 text-jade-500" />
                </div>
              </div>

              {/* Floating Accents */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-xl shadow-lg shadow-amber-200 border-2 border-white flex items-center justify-center animate-float">
                <Search className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="text-center max-w-xs space-y-2.5">
              <h3 className="text-sm lg:text-base font-black text-slate-800 uppercase tracking-[0.2em]">Pilih Santri</h3>
              <div className="h-0.5 w-8 bg-jade-500/20 mx-auto rounded-full"></div>
              <p className="text-[9px] lg:text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Pilih salah satu santri dari daftar di sebelah kiri untuk mulai mengelola hafalan mereka.</p>
            </div>

            {/* Subtle Hint */}
            <div className="mt-8 flex items-center gap-1 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Gunakan kolom pencarian untuk mempercepat</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Modal */}
      {isAddModalOpen && (
        <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-9999 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-28px shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-jade-50 text-jade-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-3xl font-black text-slate-800 tracking-tight uppercase leading-none hidden md:block">Monitor Hafalan Harian</h1>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Catat Setoran Baru</h3>
                  <p className="text-[9px] font-black text-jade-400 uppercase tracking-widest mt-0.5">{selectedStudent?.full_name}</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                {" "}
                <X className="w-4 h-4 text-slate-400" />{" "}
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Setoran</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {[MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`py-2 px-1 text-[8.5px] font-black uppercase tracking-tight rounded-xl transition-all ${
                          formData.type === t ? "bg-white text-jade-600 shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {t === MemorizationType.SABAQ ? "Sabaq" : t === MemorizationType.SABQI ? "Sabqi" : "Manzil"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.record_date}
                    onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-jade-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Surah</label>
                  <select
                    value={formData.surah_name}
                    onChange={(e) => {
                      const surah = SURAH_DATA.find((s) => s.name === e.target.value);
                      const newSurah = e.target.value;
                      const newAyatEnd = surah?.totalAyah || 1;

                      let newJumlah = 0;
                      const last = lastProgress[formData.type];
                      if (newSurah && newAyatEnd && last) {
                        const startPoint = getNextAyah(last.surah_name, last.ayat_start);
                        if (startPoint) {
                          newJumlah = formData.type === MemorizationType.SABAQ ? calculateLines(startPoint.surah, startPoint.ayah, newSurah, newAyatEnd) : calculatePages(startPoint.surah, startPoint.ayah, newSurah, newAyatEnd);
                        }
                      }

                      setFormData({
                        ...formData,
                        surah_name: newSurah,
                        ayat_end: newAyatEnd,
                        ayat_start: 1, // Note: This field is confusingly named in the modal, but used as "Dari Ayat"
                        jumlah: newJumlah > 0 ? newJumlah : 0,
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-jade-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none appearance-none"
                  >
                    <option value="">-- Pilih Surah --</option>
                    {SURAH_DATA.map((s) => {
                      if (formData.type === MemorizationType.SABQI || formData.type === MemorizationType.MANZIL) {
                        const sabaqPos = lastProgress[MemorizationType.SABAQ];
                        if (sabaqPos) {
                          const sabaqSurahIndex = SURAH_PROGRESSION.indexOf(sabaqPos.surah_name);
                          const currentSurahIndex = SURAH_PROGRESSION.indexOf(s.name);
                          if (currentSurahIndex > sabaqSurahIndex) return null;
                        }
                      }
                      return (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari Ayat</label>
                    <input
                      type="number"
                      disabled={!formData.surah_name}
                      value={formData.ayat_start}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        const surah = SURAH_DATA.find((s) => s.name === formData.surah_name);
                        if (isNaN(val)) val = 1;
                        if (val < 1) val = 1;
                        if (surah && val > surah.totalAyah) val = surah.totalAyah;
                        setFormData({ ...formData, ayat_start: val });
                      }}
                      className={`w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-jade-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none ${!formData.surah_name ? "opacity-30 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Sampai Ayat</label>
                    <input
                      type="number"
                      disabled={!formData.surah_name}
                      value={formData.ayat_end}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        const surah = SURAH_DATA.find((s) => s.name === formData.surah_name);
                        if (isNaN(val)) val = 1;
                        if (val < 1) val = 1;
                        if (surah && val > surah.totalAyah) val = surah.totalAyah;

                        let newJumlah = 0;
                        const last = lastProgress[formData.type];
                        if (formData.surah_name && val && last) {
                          const startPoint = getNextAyah(last.surah_name, last.ayat_start);
                          if (startPoint) {
                            newJumlah = formData.type === MemorizationType.SABAQ ? calculateLines(startPoint.surah, startPoint.ayah, formData.surah_name, val) : calculatePages(startPoint.surah, startPoint.ayah, formData.surah_name, val);
                          }
                        }

                        setFormData({
                          ...formData,
                          ayat_end: val,
                          jumlah: newJumlah > 0 ? newJumlah : 0,
                        });
                      }}
                      className={`w-full px-4 py-3 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:ring-0 focus:border-jade-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none ${!formData.surah_name ? "opacity-30 cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kualitas Hafalan (Keterangan)</label>
                <div className="flex gap-3">
                  {[MemorizationStatus.LANCAR, MemorizationStatus.TIDAK_LANCAR, MemorizationStatus.TIDAK_SETOR, MemorizationStatus.SAKIT, MemorizationStatus.IZIN, MemorizationStatus.ALPA].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const isNotDepositing = s === MemorizationStatus.TIDAK_SETOR || s === MemorizationStatus.SAKIT || s === MemorizationStatus.IZIN || s === MemorizationStatus.ALPA;
                        const lastRef = lastProgress[formData.type];
                        setFormData({
                          ...formData,
                          status: s,
                          ...(isNotDepositing
                            ? {
                                surah_name: lastRef?.surah_name || "",
                                ayat_start: lastRef?.ayat_start || 1, // UI ayat_start
                                ayat_end: lastRef?.ayat_end || 1, // UI ayat_end (volume)
                              }
                            : {}),
                        });
                      }}
                      className={`flex-1 py-3 px-1 rounded-2xl font-black text-[8px] uppercase tracking-tighter border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.status === s
                          ? s === MemorizationStatus.LANCAR
                            ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm"
                            : s === MemorizationStatus.TIDAK_LANCAR
                              ? "bg-amber-50 border-amber-500 text-amber-600 shadow-sm"
                              : s === MemorizationStatus.TIDAK_SETOR
                                ? "bg-rose-50 border-rose-500 text-rose-600 shadow-sm"
                                : "bg-jade-50 border-jade-500 text-jade-600 shadow-sm"
                          : "bg-white border-slate-50 text-slate-400 grayscale"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          s === MemorizationStatus.LANCAR
                            ? "bg-emerald-100 text-emerald-600"
                            : s === MemorizationStatus.TIDAK_LANCAR
                              ? "bg-amber-100 text-amber-600"
                              : s === MemorizationStatus.TIDAK_SETOR
                                ? "bg-rose-100 text-rose-600"
                                : "bg-jade-100 text-jade-600"
                        }`}
                      >
                        {getStatusIcon(s)}
                      </div>
                      {getStatusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3.5 font-black text-[11px] uppercase tracking-widest rounded-2xl border-2 border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3.5 font-black text-[11px] uppercase tracking-widest rounded-2xl border-2 border-jade-600 bg-jade-600 text-white shadow-xl shadow-primary-100 hover:bg-jade-700 hover:border-jade-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  SIMPAN REKAMAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Modal */}
      {isInfoModalOpen && (
        <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-999999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsInfoModalOpen(false)}>
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

      {/* Progress Information Modal - Compact Version */}
      {isProgressModalOpen && (
        <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-999999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsProgressModalOpen(false)}>
          <div className="relative bg-white rounded-xl shadow-none w-full max-w-sm overflow-hidden animate-scale-in border-2 border-slate-300 flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-jade-50 rounded-lg flex items-center justify-center text-jade-500 border border-jade-100">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Jumlah Hafalan</h3>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Akumulasi Progress</p>
                </div>
              </div>
              <button onClick={() => setIsProgressModalOpen(false)} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="py-2.5 px-4 bg-jade-50 rounded-xl border-2 border-jade-100 flex items-center justify-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-jade-600" />
                <span className="text-[9.5px] font-black text-jade-700 uppercase tracking-widest">{holidayBlock ? holidayBlock.displayRange : weekDisplayRange}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-colors hover:border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Sabaq</span>
                  <span className="px-3.5 py-1.5 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider">{weekTotals.sabaqLines} Baris</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-colors hover:border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Sabqi</span>
                  <span className="px-3.5 py-1.5 bg-white text-amber-600 border-2 border-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider">{weekTotals.sabqiPages} Halaman</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-colors hover:border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Manzil</span>
                  <span className="px-3.5 py-1.5 bg-white text-rose-600 border-2 border-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider">{weekTotals.manzilPages} Halaman</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border-2 border-blue-100 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[8.5px] font-black text-blue-700 leading-tight uppercase tracking-wide">Dihitung dari hafalan berstatus 'Lancar' pada pekan ini.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-white">
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="w-full py-3.5 bg-slate-800 text-white rounded-xl text-[9.5px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-none border-2 border-slate-800"
              >
              Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Local Unsaved Changes Modal (for Switching Students) */}
      {showLocalUnsavedModal && (
        <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-999 flex items-center justify-center p-4 sm:p-6 text-slate-800">
          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => { setShowLocalUnsavedModal(false); setPendingStudent(null); }} />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-3.5 border-b-2 border-slate-300 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border-2 border-slate-100 shadow-none shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">Tunggu Sebentar!</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1 opacity-70">Konfirmasi Sistem</p>
                </div>
              </div>
              <button onClick={() => { setShowLocalUnsavedModal(false); setPendingStudent(null); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Message / Body */}
            <div className="overflow-y-auto px-6 py-5 flex-1 text-[11px] font-bold text-slate-500 leading-normal text-left custom-scrollbar">
              Anda memiliki perubahan data untuk <b className="text-slate-700">{selectedStudent?.full_name}</b> yang belum disimpan. Ingin menyimpannya dulu?
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-3 border-t-2 border-slate-300 bg-slate-50/50 flex gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowLocalUnsavedModal(false);
                  setPendingStudent(null);
                }}
                className="px-2 md:px-6 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex-1 shadow-none whitespace-nowrap active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={proceedStudentSwitch}
                className="px-2 md:px-6 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl border-2 border-rose-500 bg-rose-500 hover:bg-rose-600 text-white transition-all flex-1 shadow-none whitespace-nowrap active:scale-95"
              >
                Buang
              </button>
              <button
                onClick={handleLocalSaveAndSwitch}
                className="px-2 md:px-6 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 hover:bg-jade-700 text-white transition-all flex-2 shadow-none whitespace-nowrap active:scale-95 outline-none"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Initialization Modal */}
      {isInitModalOpen && (
        <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-999999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
          <div className="relative bg-white rounded-xl shadow-none w-full max-w-sm animate-scale-in border-2 border-slate-300 flex flex-col">
            <button
              onClick={() => setIsInitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-6 text-center pb-2">
              <div className="w-12 h-12 bg-jade-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-jade-500 border-2 border-jade-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-normal mb-1">Hafalan Santri</h3>
              <p className="text-[8px] font-black text-slate-400 leading-relaxed uppercase tracking-widest mb-5 px-2 opacity-70">
                Atur posisi hafalan terakhir <b>{selectedStudent?.full_name?.split(" ")[0]}</b>
              </p>

              <div className="space-y-1.5 text-left pb-2">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[9px] font-black text-jade-600 uppercase tracking-widest">Posisi Sabaq Terakhir</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative init-dropdown-container">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openInitDropdown !== "sabaq") setSurahSearchQuery("");
                          setOpenInitDropdown(openInitDropdown === "sabaq" ? null : "sabaq");
                        }}
                        className={`w-full h-10 bg-white border-2 rounded-xl px-3 text-[10.5px] font-black text-slate-700 outline-none transition-all flex items-center justify-between cursor-pointer ${openInitDropdown === "sabaq" ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <span className="truncate">{initForm.surah || "- Pilih Surat -"}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-all ${openInitDropdown === "sabaq" ? "rotate-180 text-jade-500" : ""}`} />
                      </div>
                      
                      {openInitDropdown === "sabaq" && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <input
                              type="text"
                              placeholder="CARI SURAT..."
                              value={surahSearchQuery}
                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[8.5px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-jade-400 focus:ring-2 focus:ring-jade-50/50 transition-all placeholder:text-slate-300"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto no-scrollbar">
                            {SURAH_DATA.slice(0, 114)
                              .filter((s) => s.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                              .map((s) => (
                                <div
                                  key={s.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInitSabaqChange(s.name, 1);
                                    setOpenInitDropdown(null);
                                  }}
                                  className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${initForm.surah === s.name ? "bg-jade-50 text-jade-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                >
                                  {s.name}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  <span className="text-slate-300 font-bold">:</span>
                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      max={SURAH_DATA.find((s) => s.name === initForm.surah)?.totalAyah || 1000}
                      value={initForm.ayat || ""}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        const maxAyah = SURAH_DATA.find((s) => s.name === initForm.surah)?.totalAyah || 1000;
                        if (val > maxAyah) val = maxAyah;
                        handleInitSabaqChange(initForm.surah, val);
                      }}
                      className="w-full h-10 bg-white border-2 border-slate-100 rounded-xl px-2 text-[10.5px] font-black text-slate-800 focus:border-jade-400 transition-all outline-none text-center shadow-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {initForm.surah && initForm.ayat > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Posisi Sabqi Terakhir</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <div className="flex-1 relative init-dropdown-container">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openInitDropdown !== "sabqi") setSurahSearchQuery("");
                          setOpenInitDropdown(openInitDropdown === "sabqi" ? null : "sabqi");
                        }}
                        className={`w-full h-10 bg-white border-2 rounded-xl px-3 text-[10.5px] font-black text-slate-700 outline-none transition-all flex items-center justify-between cursor-pointer ${openInitDropdown === "sabqi" ? "border-emerald-400 ring-4 ring-emerald-50/50" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <span className="truncate">{initForm.sabqiSurah || "- Pilih Surat -"}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-all ${openInitDropdown === "sabqi" ? "rotate-180 text-emerald-500" : ""}`} />
                      </div>
                      
                      {openInitDropdown === "sabqi" && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <input
                              type="text"
                              placeholder="CARI SURAT..."
                              value={surahSearchQuery}
                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[8.5px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50/50 transition-all placeholder:text-slate-300"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto no-scrollbar">
                            {SURAH_DATA.slice(0, 114)
                              .filter((s) => s.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                              .map((s) => (
                                <div
                                  key={s.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInitForm((prev) => ({ ...prev, sabqiSurah: s.name, sabqiAyat: 1 }));
                                    setOpenInitDropdown(null);
                                  }}
                                  className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${initForm.sabqiSurah === s.name ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                >
                                  {s.name}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                      <span className="text-slate-300 font-bold">:</span>
                      <div className="w-16">
                        <input
                          type="number"
                          min={1}
                          max={SURAH_DATA.find((s) => s.name === initForm.sabqiSurah)?.totalAyah || 1000}
                          value={initForm.sabqiAyat || ""}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            const maxAyah = SURAH_DATA.find((s) => s.name === initForm.sabqiSurah)?.totalAyah || 1000;
                            if (val > maxAyah) val = maxAyah;
                            setInitForm((prev) => ({ ...prev, sabqiAyat: val }));
                          }}
                          className="w-full h-10 bg-white border-2 border-slate-100 rounded-xl px-2 text-[10.5px] font-black text-slate-800 focus:border-emerald-400 transition-all outline-none text-center shadow-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Posisi Manzil Terakhir</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <div className="flex-1 relative init-dropdown-container">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openInitDropdown !== "manzil") setSurahSearchQuery("");
                          setOpenInitDropdown(openInitDropdown === "manzil" ? null : "manzil");
                        }}
                        className={`w-full h-10 bg-white border-2 rounded-xl px-3 text-[10.5px] font-black text-slate-700 outline-none transition-all flex items-center justify-between cursor-pointer ${openInitDropdown === "manzil" ? "border-amber-400 ring-4 ring-amber-50/50" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        <span className="truncate">{initForm.manzilSurah || "- Pilih Surat -"}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-all ${openInitDropdown === "manzil" ? "rotate-180 text-amber-500" : ""}`} />
                      </div>
                      
                      {openInitDropdown === "manzil" && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <input
                              type="text"
                              placeholder="CARI SURAT..."
                              value={surahSearchQuery}
                              onChange={(e) => setSurahSearchQuery(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[8.5px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50/50 transition-all placeholder:text-slate-300"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto no-scrollbar">
                            {SURAH_DATA.slice(0, 114)
                              .filter((s) => s.name.toLowerCase().includes(surahSearchQuery.toLowerCase()))
                              .map((s) => (
                                <div
                                  key={s.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInitForm((prev) => ({ ...prev, manzilSurah: s.name, manzilAyat: 1 }));
                                    setOpenInitDropdown(null);
                                  }}
                                  className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-b border-slate-50 last:border-0 ${initForm.manzilSurah === s.name ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                                >
                                  {s.name}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                      <span className="text-slate-300 font-bold">:</span>
                      <div className="w-16">
                        <input
                          type="number"
                          min={1}
                          max={SURAH_DATA.find((s) => s.name === initForm.manzilSurah)?.totalAyah || 1000}
                          value={initForm.manzilAyat || ""}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            const maxAyah = SURAH_DATA.find((s) => s.name === initForm.manzilSurah)?.totalAyah || 1000;
                            if (val > maxAyah) val = maxAyah;
                            setInitForm((prev) => ({ ...prev, manzilAyat: val }));
                          }}
                          className="w-full h-10 bg-white border-2 border-slate-100 rounded-xl px-2 text-[10.5px] font-black text-slate-800 focus:border-amber-400 transition-all outline-none text-center shadow-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-3 px-1 opacity-70">✦ Anda dapat mengubah rekomendasi Sabqi dan Manzil di atas jika tidak sesuai.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-8 pt-4 flex flex-col gap-2.5">
              {(() => {
                const isComplete = initForm.surah && initForm.ayat > 0;
                return (
                  <button
                    onClick={handleInitialize}
                    disabled={!isComplete || isInitializing}
                    className={`w-full py-3.5 rounded-xl text-[9.5px] font-black uppercase tracking-[0.2em] transition-all outline-none border-2 flex items-center justify-center gap-2 ${
                      isComplete && !isInitializing ? "bg-jade-600 text-white border-jade-600 hover:bg-jade-700 shadow-lg shadow-jade-100 active:scale-95" : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-80"
                    }`}
                  >
                    {isInitializing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-400 rounded-full animate-spin" />
                        MENYIMPAN
                      </>
                    ) : (
                      "Simpan Posisi"
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
