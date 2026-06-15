import React, { useEffect, useState, useMemo } from "react";
import { getClasses, createClass, updateClass, deleteClass, getStudents, updateStudent, deleteStudent, getTenant, updateTenant, getStudentAssignmentHistory } from "../../services/dataService";
import { Class, UserProfile, Student, UserRole } from "../../types";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import {
  Plus,
  Users,
  School,
  X,
  ChevronRight,
  Save,
  Edit,
  Trash2,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  MessageCircle,
  Check,
  ArrowRight,
  RefreshCw,
  Wand2,
  Lock,
  Archive,
  Search,
  Medal,
  Calendar,
  UserCheck,
  ChevronDown,
  ArrowLeft,
  Info,
  History,
  Home,
  User,
  Fingerprint,
} from "lucide-react";
import { useLoading } from "../../lib/LoadingContext";
import { useNotification } from "../../lib/NotificationContext";
import { getPhysicalLocation } from "../../lib/quranUtils";
import { HistoryModal, InfoModal } from "../../components/ui/SharedStudentModals";

// --- Components ---

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { names: string[] }) => Promise<void>;
  initialData?: Class | null;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [className, setClassName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setClassName(initialData ? initialData.name : "");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Nama kelas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ names: [className.trim().toUpperCase()] });
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data kelas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-800 lg:pl-64 pt-16">
      <div className="bg-white rounded-xl shadow-none w-full max-w-xs overflow-hidden border-2 border-slate-300 flex flex-col max-h-[80vh] relative">
        {/* Close Button UI */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20">
          <X className="w-3.5 h-3.5" />
        </button>
        {/* Header */}
        <div className="px-5 py-2.5 border-b border-slate-50 rounded-xl flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 uppercase">{initialData ? "Edit Kelas" : "Kelas Baru"}</h3>
            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Manajemen Kelas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kelas</label>
            <input
              autoFocus
              required
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl bg-white text-[13px] font-bold text-slate-800 outline-none uppercase focus:border-jade-400 transition-all placeholder:text-slate-300"
              placeholder="CONTOH: 3"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <p className="text-[9px] font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 shrink-0">
            <button type="button" className="flex-1 px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-300 text-slate-400 hover:bg-slate-50 transition-all active:scale-95" onClick={onClose}>
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 flex items-center justify-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "..." : initialData ? "SIMPAN PERUBAHAN" : "BUAT KELAS BARU"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ClassManagement: React.FC<{ tenantId: string; user: UserProfile }> = ({ tenantId, user }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  // Modals State
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteAction, setPromoteAction] = useState<"hapus" | "lulus" | "proses" | null>(null);
  const [isGraduationConfirmOpen, setIsGraduationConfirmOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [showTargetClassDropdown, setShowTargetClassDropdown] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [alumniSearch, setAlumniSearch] = useState("");
  const [alumniSortYear, setAlumniSortYear] = useState<string>("all");
  const [showAlumniYearDropdown, setShowAlumniYearDropdown] = useState(false);
  const [alumniPage, setAlumniPage] = useState(1);
  const [alumniPerPage, setAlumniPerPage] = useState(10);
  const [showAlumniPaginationDropdown, setShowAlumniPaginationDropdown] = useState(false);
  const [selectedAlumniIds, setSelectedAlumniIds] = useState<string[]>([]);
  const [isAlumniDeleteModalOpen, setIsAlumniDeleteModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"classes" | "alumni">("classes");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "alumni") {
        setActiveTab("alumni");
      }
    }
  }, []);

  const handleTabChange = (tab: "classes" | "alumni") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "alumni") {
        url.searchParams.set("tab", "alumni");
      } else {
        url.searchParams.delete("tab");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const filteredAlumni = useMemo(() => {
    return alumniList.filter((a) => {
      const matchSearch = a.full_name?.toLowerCase().includes(alumniSearch.toLowerCase()) || a.nis?.toLowerCase().includes(alumniSearch.toLowerCase());
      const matchYear = alumniSortYear === "all" ? true : a.graduated_year?.toString() === alumniSortYear;
      return matchSearch && matchYear;
    });
  }, [alumniList, alumniSearch, alumniSortYear]);

  const totalAlumniPages = Math.ceil(filteredAlumni.length / alumniPerPage);
  const paginatedAlumni = useMemo(() => {
    const start = (alumniPage - 1) * alumniPerPage;
    return filteredAlumni.slice(start, start + alumniPerPage);
  }, [filteredAlumni, alumniPage, alumniPerPage]);

  const graduationYears = useMemo(() => {
    const years = new Set(alumniList.map((a) => a.graduated_year).filter(Boolean));
    return Array.from(years).sort((a: any, b: any) => b - a);
  }, [alumniList]);
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const [systemConfig, setSystemConfig] = useState({ min: 1, max: 6 });
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [infoStudent, setInfoStudent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedModalStudent, setSelectedModalStudent] = useState<any>(null);

  const isSystemReady = React.useMemo(() => {
    if (classes.length === 0) return false;

    // Check if "utuh" (all grades from min to max range must exist)
    const existingGrades = new Set(
      classes.map((c) => {
        const match = c.name.match(/\d+/);
        return match ? parseInt(match[0]) : -1;
      }),
    );

    for (let i = systemConfig.min; i <= systemConfig.max; i++) {
      if (!existingGrades.has(i)) return false;
    }

    // Check if "terchecklist semuanya" (all classes in the list are selected)
    // To ensures cycle consistency across the entire school
    return selectedClassIds.length === classes.length;
  }, [classes, systemConfig, selectedClassIds]);

  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      const [classesData, studentsData, tenantData] = await Promise.all([getClasses(tenantId), getStudents(tenantId), getTenant(tenantId)]);

      const enrichedClasses = classesData.map((c) => {
        return {
          ...c,
          student_count: studentsData.filter((s) => s.class_id === c.id).length,
        };
      });

      setClasses(enrichedClasses);
      setAllStudents(studentsData);

      // Sync System Config from Database or Local Storage Fallback
      if (tenantData && (tenantData as any).cycle_config) {
        const cfg = (tenantData as any).cycle_config;
        setSystemConfig({
          min: cfg.min ?? 1,
          max: cfg.max ?? 6,
        });
        // Load alumni list from cycle_config
        if (cfg.alumni && Array.isArray(cfg.alumni)) {
          setAlumniList(cfg.alumni);
        }
      } else {
        const localData = localStorage.getItem(`qurma_cycle_${tenantId}`);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setSystemConfig({
              min: parsed.min ?? 1,
              max: parsed.max ?? 6,
            });
            if (parsed.alumni && Array.isArray(parsed.alumni)) {
              setAlumniList(parsed.alumni);
            }
          } catch (e) {
            console.error("Failed to parse local cycle data");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch class data:", error);
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat memuat data kelas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      // Fetch current tenant to preserve other curriculum target keys
      const tenant = await getTenant(tenantId);
      const existingConfig = (tenant as any)?.cycle_config || {};

      const currentMin = existingConfig.min ?? 1;
      const currentMax = existingConfig.max ?? 6;

      if (currentMin === systemConfig.min && currentMax === systemConfig.max) {
        addNotification({ type: "info", title: "Tidak Ada Perubahan", message: "Rentang kelas tidak mengalami perubahan." });
        setIsEditingConfig(false);
        setIsSavingConfig(false);
        return;
      }

      const updatedConfig = {
        ...existingConfig,
        ...systemConfig,
      };

      await updateTenant(
        tenantId,
        {
          cycle_config: updatedConfig,
        },
        user,
      );

      // Also save to localStorage as a robust immediate fallback
      localStorage.setItem(`qurma_cycle_${tenantId}`, JSON.stringify(updatedConfig));

      addNotification({ type: "success", title: "Tersimpan", message: "Pengaturan rentang kelas telah disimpan." });
      setIsEditingConfig(false);
    } catch (error) {
      console.error("DB Save failed, using local storage only:", error);
      localStorage.setItem(`qurma_cycle_${tenantId}`, JSON.stringify(systemConfig));
      addNotification({
        type: "info",
        title: "Tersimpan Lokal",
        message: "Pengaturan disimpan di browser ini (Gagal simpan ke database).",
      });
      setIsEditingConfig(false);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateOrUpdate = async (data: { names: string[] }) => {
    try {
      if (isEditMode && selectedClass) {
        await updateClass(selectedClass.id, { name: data.names[0] }, user);
        addNotification({ type: "success", title: "Berhasil", message: `Kelas ${data.names[0]} telah diperbarui.` });
      } else {
        // Create multiple classes
        const promises = data.names.map((name) => createClass({ name, tenant_id: tenantId }, user));
        await Promise.all(promises);
        addNotification({
          type: "success",
          title: "Berhasil",
          message: `${data.names.length} kelas baru telah dibuat.`,
        });
      }
      await fetchData();
      setIsFormModalOpen(false);
    } catch (error: any) {
      console.error("Save class error:", error);
      throw error; // Let the modal catch and display inline error
    }
  };

  const handleDelete = (cls: Class) => {
    setDeleteTarget(cls);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await deleteClass(deleteTarget.id, deleteTarget.name, user);
      addNotification({ type: "success", title: "Berhasil", message: `Kelas ${deleteTarget.name} berhasil dihapus.` });
      await fetchData();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      addNotification({ type: "error", title: "Gagal", message: error.message || "Gagal menghapus kelas." });
    }
  };

  const openCreateModal = () => {
    setSelectedClass(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const viewStudents = (cls: Class) => {
    setSelectedClass(cls);
    setTargetClassId("");
    setIsStudentsModalOpen(true);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
  };

  const toggleSelectAll = (studentsInClass: Student[]) => {
    const classStudentIds = studentsInClass.map((s) => s.id);
    const isAllSelected = classStudentIds.every((id) => selectedStudentIds.includes(id));

    if (isAllSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !classStudentIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => [...new Set([...prev, ...classStudentIds])]);
    }
  };

  const handleMoveStudents = async () => {
    if (!targetClassId || selectedStudentIds.length === 0) {
      addNotification({ type: "error", title: "Peringatan", message: "Pilih santri dan kelas tujuan terlebih dahulu." });
      return;
    }

    setIsMoving(true);
    try {
      for (const id of selectedStudentIds) {
        await updateStudent({ id, class_id: targetClassId }, user);
      }

      addNotification({
        type: "success",
        title: "Berhasil",
        message: `${selectedStudentIds.length} santri berhasil dipindahkan kelas.`,
      });

      await fetchData(false); // don't trigger full loading during refetch
      setSelectedStudentIds([]);
      setTargetClassId("");
      setIsStudentsModalOpen(false);
    } catch (error: any) {
      addNotification({ type: "error", title: "Gagal", message: `Gagal memindahkan santri: ${error?.message || "Koneksi terputus."}` });
    } finally {
      setIsMoving(false);
    }
  };

  const toggleClassSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUnselecting = selectedClassIds.includes(id);
    const classStudentIds = allStudents.filter((s) => s.class_id === id).map((s) => s.id);

    // Update Class Selection
    setSelectedClassIds((prev) => (isUnselecting ? prev.filter((cid) => cid !== id) : [...prev, id]));

    // Sync Student Selection
    setSelectedStudentIds((prev) => {
      if (isUnselecting) {
        return prev.filter((sid) => !classStudentIds.includes(sid));
      } else {
        return [...new Set([...prev, ...classStudentIds])];
      }
    });
  };

  const toggleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
      setSelectedStudentIds([]);
    } else {
      const allIds = classes.map((c) => c.id);
      setSelectedClassIds(allIds);
      setSelectedStudentIds(allStudents.filter((s) => s.class_id && allIds.includes(s.class_id)).map((s) => s.id));
    }
  };

  const toggleAlumniSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAlumniIds((prev) => (prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]));
  };

  const toggleSelectAllAlumni = () => {
    if (selectedAlumniIds.length === paginatedAlumni.length) {
      setSelectedAlumniIds([]);
    } else {
      setSelectedAlumniIds(paginatedAlumni.map((a) => a.id));
    }
  };

  const handleDeleteSelectedAlumni = async () => {
    if (selectedAlumniIds.length === 0) return;
    try {
      const tenantCurrent = await getTenant(tenantId);
      const existingConfig = (tenantCurrent as any)?.cycle_config || {};
      const existingAlumni: any[] = existingConfig.alumni || [];
      const newAlumniList = existingAlumni.filter((a: any) => !selectedAlumniIds.includes(a.id));

      await updateTenant(
        tenantId,
        {
          cycle_config: { ...existingConfig, alumni: newAlumniList },
        },
        user,
      );

      setAlumniList(newAlumniList);
      setSelectedAlumniIds([]);
      setIsAlumniDeleteModalOpen(false);

      const newTotalPages = Math.ceil(newAlumniList.length / alumniPerPage);
      if (alumniPage > newTotalPages && newTotalPages > 0) {
        setAlumniPage(newTotalPages);
      }

      addNotification({ type: "success", title: "Berhasil", message: `${selectedAlumniIds.length} data alumni berhasil dihapus.` });
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Terjadi kesalahan saat menghapus data alumni." });
    }
  };

  const handleGenerateStructure = async () => {
    let created = 0;
    let deleted = 0;
    try {
      // 1. Identify and Delete Classes outside the current range
      const classesToDelete = classes.filter((c) => {
        const match = c.name.match(/\d+/);
        if (!match) return false; // Keep non-numeric classes
        const grade = parseInt(match[0]);
        return grade < systemConfig.min || grade > systemConfig.max;
      });

      for (const cls of classesToDelete) {
        // Unassign students first
        const classStudents = allStudents.filter((s) => s.class_id === cls.id);
        for (const student of classStudents) {
          await updateStudent({ id: student.id, class_id: null as any }, user);
        }
        await deleteClass(cls.id, cls.name, user);
        deleted++;
      }

      // 2. Create missing classes within range (default sub-class 'A')
      for (let i = systemConfig.min; i <= systemConfig.max; i++) {
        const hasAnySubClass = classes
          .filter((c) => !classesToDelete.some((del) => del.id === c.id))
          .some((c) => {
            const match = c.name.match(/\d+/);
            return match && parseInt(match[0]) === i;
          });

        if (!hasAnySubClass) {
          const name = `${i}`;
          await createClass({ name, tenant_id: tenantId }, user);
          created++;
        }
      }

      await fetchData(false);
      addNotification({
        type: "success",
        title: "Sinkronisasi Selesai",
        message: `Hasil: ${created} kelas baru dibuat, ${deleted} kelas lama dihapus.`,
      });
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Gagal sinkronisasi struktur kelas." });
    }
  };

  const handlePreBulkPromote = async () => {
    setIsPromoting(true);
    setPromoteAction("proses");
    let hasGraduating = false;
    const classesToPromote = classes
      .filter((c) => selectedClassIds.includes(c.id))
      .map((c) => {
        const match = c.name.match(/\d+/);
        return { ...c, grade: match ? parseInt(match[0]) : 0 };
      });

    for (const cls of classesToPromote) {
      if (cls.grade >= systemConfig.max) {
        const studentsInClass = allStudents.filter((s) => s.class_id === cls.id);
        const passedStudents = studentsInClass.filter((s) => selectedStudentIds.includes(s.id));
        if (passedStudents.length > 0) hasGraduating = true;
      }
    }

    if (hasGraduating) {
      setIsGraduationConfirmOpen(true);
      setIsPromoting(false);
      setPromoteAction(null);
    } else {
      await handleBulkPromote(false);
    }
  };

  const handleBulkPromote = async (deleteGraduates: boolean = false) => {
    setIsPromoting(true);
    setPromoteAction(deleteGraduates ? "hapus" : "lulus");
    if (selectedClassIds.length === 0) return;

    let promotedStudentCount = 0;
    let graduatedStudentCount = 0;
    let createdClassCount = 0;
    let stayingBackCount = 0;
    let processedClassCount = 0;

    try {
      const classesToPromote = classes
        .filter((c) => selectedClassIds.includes(c.id))
        .map((c) => {
          const match = c.name.match(/\d+/);
          return { ...c, grade: match ? parseInt(match[0]) : 0 };
        })
        .sort((a, b) => b.grade - a.grade); // Sort DESCENDING to avoid collisions

      // Collect graduating students before the loop for alumni snapshot
      const graduatingStudentSnapshots: any[] = [];
      if (!deleteGraduates) {
        for (const cls of classesToPromote) {
          if (cls.grade >= systemConfig.max) {
            const studentsInClass = allStudents.filter((s) => s.class_id === cls.id);
            for (const s of studentsInClass) {
              // ONLY include students who are checked (passing/graduating)
              if (selectedStudentIds.includes(s.id)) {
                let assignment_history: any[] = [];
                try {
                  assignment_history = await getStudentAssignmentHistory(s.id);
                } catch (e) {
                  console.error("Failed to fetch assignment history for alumni snapshot", e);
                }
                graduatingStudentSnapshots.push({
                  id: s.id,
                  full_name: s.full_name,
                  nis: s.nis || "-",
                  gender: s.gender || "-",
                  last_class: cls.name,
                  graduated_at: new Date().toISOString().split("T")[0],
                  graduated_year: new Date().getFullYear(),
                  nik: s.nik || "-",
                  father_name: s.father_name || "-",
                  father_phone: s.father_phone || "-",
                  mother_name: s.mother_name || "-",
                  mother_phone: s.mother_phone || "-",
                  address: s.address || "-",
                  rt_rw: s.rt_rw || "-",
                  village: s.village || "-",
                  district: s.district || "-",
                  city: s.city || "-",
                  province: s.province || "-",
                  assignment_history: assignment_history,
                });
              }
            }
          }
        }
      }

      // Save graduating students to alumni list in cycle_config
      if (graduatingStudentSnapshots.length > 0) {
        const tenantCurrent = await getTenant(tenantId);
        const existingConfig = (tenantCurrent as any)?.cycle_config || {};
        const existingAlumni: any[] = existingConfig.alumni || [];
        const updatedAlumni = [...existingAlumni, ...graduatingStudentSnapshots];
        await updateTenant(
          tenantId,
          {
            cycle_config: { ...existingConfig, alumni: updatedAlumni },
          },
          user,
        );
        setAlumniList(updatedAlumni);
      }

      for (const cls of classesToPromote) {
        if (cls.grade === 0) continue;
        processedClassCount++;

        const studentsInClass = allStudents.filter((s) => s.class_id === cls.id);
        const passedStudents = studentsInClass.filter((s) => selectedStudentIds.includes(s.id));
        const stayedStudents = studentsInClass.filter((s) => !selectedStudentIds.includes(s.id));

        stayingBackCount += stayedStudents.length;

        if (cls.grade >= systemConfig.max) {
          // Graduation Logic
          for (const student of passedStudents) {
            await deleteStudent(student.id, student.full_name || "Unknown", user);
            graduatedStudentCount++;
          }

          // If no one stayed back, the class is fully empty and can be deleted
          if (stayedStudents.length === 0) {
            await deleteClass(cls.id, cls.name, user);
          }
        } else {
          // Regular Promotion: Move students instead of renaming class
          const nextGrade = cls.grade + 1;
          const newName = cls.name.replace(cls.grade.toString(), nextGrade.toString());

          // Check if target class exists, if not create it
          let currentClasses = await getClasses(tenantId);
          let targetClass = currentClasses.find((ex) => ex.name?.toUpperCase() === newName?.toUpperCase());

          if (!targetClass) {
            targetClass = await createClass({ name: newName, tenant_id: tenantId }, user);
            createdClassCount++;
          }

          // Move passed students to the new target class
          for (const student of passedStudents) {
            await updateStudent({ id: student.id, class_id: targetClass.id }, user);
            promotedStudentCount++;
          }

          // If no one stayed back, this old class is now empty and can be deleted
          if (stayedStudents.length === 0) {
            await deleteClass(cls.id, cls.name, user);
          }
        }
      }

      // Final Auto-Refill Logic: Ensure min grade exists for new intake
      const defaultStartName = `${systemConfig.min}`;
      const finalClasses = await getClasses(tenantId);
      if (!finalClasses.some((ex) => ex.name?.toUpperCase() === defaultStartName)) {
        await createClass({ name: defaultStartName, tenant_id: tenantId }, user);
        createdClassCount++;
      }

      addNotification({
        type: "success",
        title: "Siklus Kelas Selesai",
        message: `${processedClassCount} Kelas Diproses: ${promotedStudentCount} Santri Naik Tingkat, ${graduatedStudentCount} Santri Lulus. ${stayingBackCount > 0 ? stayingBackCount + " Santri Tinggal Kelas." : ""}`,
      });
      await fetchData(false);
      setShowPromoteModal(false);
      setIsGraduationConfirmOpen(false);
      setIsPromoting(false);
      setPromoteAction(null);
      setSelectedStudentIds([]);
      setSelectedClassIds([]);
    } catch (error: any) {
      console.error("Promote Error:", error);
      addNotification({
        type: "error",
        title: "Gagal",
        message: `Gagal: ${error.message || "Cek koneksi database atau relasi data."}`,
      });
    } finally {
      setIsPromoting(false);
      setPromoteAction(null);
    }
  };

  const handleBulkDelete = async () => {
    let deletedCount = 0;
    try {
      for (const id of selectedClassIds) {
        const cls = classes.find((c) => c.id === id);
        if (!cls) continue;

        // Unassign students from this specific class
        const classStudents = allStudents.filter((s) => s.class_id === id);
        for (const student of classStudents) {
          await updateStudent({ id: student.id, class_id: null as any }, user);
        }

        // Delete the class
        await deleteClass(id, cls.name, user);
        deletedCount++;
      }

      addNotification({
        type: "success",
        title: "Hapus Massal Berhasil",
        message: `${deletedCount} kelas telah dihapus dari sistem.`,
      });
      await fetchData();
      setSelectedClassIds([]);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Gagal",
        message: `Gagal menghapus beberapa kelas: ${error.message || "Cek koneksi database."}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs removed */}

      <div className={activeTab === "classes" ? "block" : "hidden"}>
        <div className="space-y-6">
          {/* Unified Action Bar */}
          <div className="flex flex-col w-full gap-3 py-3 bg-white shrink-0 z-40 sticky top-0 lg:static lg:py-0 mb-4 lg:mb-8">
            {/* Baris Pertama */}
            <div className="flex flex-row flex-wrap items-center w-full gap-2">
              {/* Rentang Group */}
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none flex items-center justify-between min-w-20 bg-white px-3 md:px-4 h-10 rounded-xl border-2 border-slate-300 shadow-none gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Mulai</p>
                  {isEditingConfig ? (
                    <input
                      type="number"
                      min={1}
                      max={systemConfig.max - 1}
                      className="w-10 h-6 text-center text-[10px] font-black bg-jade-50 text-jade-600 rounded-md outline-none focus:ring-2 focus:ring-jade-500 shrink-0"
                      value={systemConfig.min}
                      onChange={(e) => setSystemConfig({ ...systemConfig, min: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <p className="text-[10px] font-black text-jade-600 uppercase tracking-widest whitespace-nowrap">KELAS {systemConfig.min}</p>
                  )}
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-0.5 shrink-0 hidden sm:block" />

                <div className="flex-1 sm:flex-none flex items-center justify-between min-w-20 bg-white px-3 md:px-4 h-10 rounded-xl border-2 border-slate-300 shadow-none gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sampai</p>
                  {isEditingConfig ? (
                    <input
                      type="number"
                      min={systemConfig.min + 1}
                      max={12}
                      className="w-10 h-6 text-center text-[10px] font-black bg-rose-50 text-rose-600 rounded-md outline-none focus:ring-2 focus:ring-rose-500 shrink-0"
                      value={systemConfig.max}
                      onChange={(e) => setSystemConfig({ ...systemConfig, max: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest whitespace-nowrap">KELAS {systemConfig.max}</p>
                  )}
                </div>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1 shrink-0" />

              {!isReadOnly && (
                <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                  <button
                    onClick={() => {
                      if (isEditingConfig) {
                        if (systemConfig.min < 1) {
                          addNotification({ type: "error", title: "Input Tidak Valid", message: "Mulai Dari minimal kelas 1" });
                          return;
                        }
                        if (systemConfig.max > 12) {
                          addNotification({ type: "error", title: "Input Tidak Valid", message: "Sampai Kelas maksimal kelas 12" });
                          return;
                        }
                        if (systemConfig.min >= systemConfig.max) {
                          addNotification({ type: "error", title: "Rentang Salah", message: "Kelas mulai harus lebih rendah dari kelas akhir" });
                          return;
                        }
                        handleSaveConfig();
                      } else {
                        setIsEditingConfig(true);
                      }
                    }}
                    disabled={isSavingConfig}
                    className={`h-10 flex-1 sm:flex-none min-w-35 flex items-center justify-center px-4 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap ${
                      isEditingConfig ? "border-jade-600 bg-jade-600 text-white shadow-none" : "border-slate-300 bg-white text-slate-500 hover:text-slate-600 hover:bg-slate-50 shadow-none"
                    }`}
                  >
                    {isSavingConfig ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isEditingConfig ? "SIMPAN RENTANG" : "UBAH RENTANG"}
                  </button>

                  <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="h-10 flex-1 sm:flex-none flex items-center justify-center px-4 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-400 bg-jade-50 text-jade-700 hover:bg-jade-100 shadow-none transition-all active:scale-95 gap-2 whitespace-nowrap"
                  >
                    <Wand2 className="w-4 h-4" />
                    GENERATE
                  </button>
                </div>
              )}

              {!isReadOnly && (
                <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto mt-1 md:mt-0">
                  <button
                    onClick={openCreateModal}
                    className="w-33.75 h-10 flex-none px-3 bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all flex items-center justify-center gap-2 group shadow-none"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">TAMBAH KELAS</span>
                  </button>
                </div>
              )}
            </div>

            {/* Baris Kedua */}
            {!isReadOnly && (
              <div className="flex flex-row items-center w-full gap-2 flex-nowrap overflow-x-auto pb-1 no-scrollbar">
                <label className="flex items-center justify-center rounded-xl border-2 border-slate-300 cursor-pointer h-10 w-10 shrink-0 select-none group hover:opacity-80 transition-all">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={classes.length > 0 && selectedClassIds.length === classes.length}
                      onChange={toggleSelectAllClasses}
                      className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 checked:bg-jade-500 checked:border-jade-500 transition-colors cursor-pointer"
                    />
                    <Check className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                  </div>
                </label>

                {selectedClassIds.length > 0 && (
                  <>
                    <button
                      onClick={() => isSystemReady && handlePreBulkPromote()}
                      disabled={selectedClassIds.length === 0 || !isSystemReady || isPromoting}
                      className={`h-10 flex items-center px-2 sm:px-4 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                        selectedClassIds.length > 0 && isSystemReady ? "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 shadow-none" : "border-slate-300 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                      }`}
                      title={!isSystemReady ? "Checklist semua kelas dan pastikan rentang kelas lengkap untuk menjalankan siklus" : ""}
                    >
                      {isPromoting ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-white rounded-full animate-spin mr-1 sm:mr-1.5" />
                      ) : isSystemReady ? (
                        <TrendingUp className="w-4 h-4 mr-1.5 animate-pulse hidden sm:block" />
                      ) : (
                        <Lock className="w-4 h-4 mr-1.5 hidden sm:block" />
                      )}
                      {isPromoting ? "PROSES..." : `Siklus (${selectedClassIds.length})`}
                    </button>

                    <button
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="h-10 flex items-center px-2 sm:px-4 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-red-400 bg-red-50 text-red-700 hover:bg-red-100 shadow-none transition-all active:scale-95 whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5 hidden sm:block" />
                      Hapus ({selectedClassIds.length})
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleTabChange("alumni")}
                  className="w-33.75 h-10 ml-auto flex-none px-3 bg-jade-50 border-2 border-jade-300 text-jade-700 rounded-xl hover:bg-jade-100 transition-all flex items-center justify-center gap-2 group shadow-none shrink-0"
                >
                  <GraduationCap className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">DATA ALUMNI</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes
              .sort((a, b) => {
                const numA = parseInt(a.name) || 0;
                const numB = parseInt(b.name) || 0;
                return numA - numB;
              })
              .map((cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <div key={cls.id} className={`bg-white rounded-xl shadow-none border-2 overflow-hidden flex flex-col hover:border-jade-400 transition-all ${isSelected ? "border-jade-500 shadow-jade-50" : "border-slate-300"}`}>
                    {/* Header */}
                    <div className="px-5 py-4 bg-white border-b border-slate-100 flex justify-between items-center mb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-jade-50 text-jade-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-jade-100 shrink-0" onClick={() => viewStudents(cls)}>
                          <School className="w-5 h-5" />
                        </div>
                        <div className="h-10 flex flex-col justify-center">
                          <h3 className="text-lg font-black text-slate-800 tracking-tight cursor-pointer hover:text-jade-600 leading-none mb-1.5" onClick={() => viewStudents(cls)}>
                            KELAS {cls.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">{cls.student_count || 0} Santri Terdaftar</p>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <div className="h-10 flex flex-col items-end justify-between py-0.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(cls);
                              }}
                              className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleClassSelection(cls.id);
                              }}
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? "bg-jade-600 border-jade-600 text-white shadow-sm scale-110" : "bg-white border-slate-300 text-jade-600 hover:border-jade-400"}`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                          <div className="flex items-end">
                            <span className={`text-[9px] font-black text-jade-600 tracking-widest leading-none transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none select-none"}`}>
                              {allStudents.filter((s) => s.class_id === cls.id && selectedStudentIds.includes(s.id)).length}/{cls.student_count || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Insights */}
                    <div className="px-5 py-3 bg-slate-50/30 border-t border-slate-100 mt-auto flex justify-between items-center cursor-pointer hover:bg-slate-50 group" onClick={() => viewStudents(cls)}>
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 overflow-hidden">
                            <Users className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-jade-600 transition-colors">
                        Detail Kelas <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}

            {classes.length === 0 && !loading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <School className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Kosong</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Belum ada data kelas</p>
                {
                  <button onClick={openCreateModal} className="mt-4 text-[10px] font-black text-jade-600 hover:text-jade-700 uppercase tracking-widest">
                    + Tambah Sekarang
                  </button>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "alumni" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shrink-0 z-70 sticky top-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleTabChange("classes")}
                className="w-10 h-10 bg-white border-2 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 rounded-xl flex items-center justify-center shrink-0 transition-all"
                title="Kembali ke Manajemen Kelas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Daftar Alumni</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total {filteredAlumni.length} Santri Lulus</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedAlumniIds.length > 0 && (
                <button
                  onClick={() => setIsAlumniDeleteModalOpen(true)}
                  className="h-10 flex items-center px-4 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 shadow-none transition-all active:scale-95 gap-2 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-0.5" />
                  <span className="hidden sm:inline">Hapus ({selectedAlumniIds.length})</span>
                  <span className="sm:hidden">{selectedAlumniIds.length}</span>
                </button>
              )}
              <div className="relative flex-1 sm:w-64 group h-10 min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-jade-500 transition-colors" />
                <input
                  type="text"
                  placeholder="CARI NAMA / NIS..."
                  value={alumniSearch}
                  onChange={(e) => setAlumniSearch(e.target.value)}
                  className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-500 transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 lg:flex-none">
                <div
                  className="relative h-10 flex-1 lg:flex-none flex items-center bg-white border-2 border-slate-300 rounded-xl shadow-none px-4 min-w-36 cursor-pointer focus-within:border-jade-500 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/year"
                  onClick={() => setShowAlumniYearDropdown(!showAlumniYearDropdown)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pointer-events-none truncate pr-4">{alumniSortYear === "all" ? "SEMUA TAHUN" : alumniSortYear}</span>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover/year:text-jade-500 transition-all ${showAlumniYearDropdown ? "rotate-180 text-jade-500" : ""}`}
                    />
                  </div>

                  {showAlumniYearDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAlumniYearDropdown(false);
                        }}
                      />
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                        <div
                          className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${alumniSortYear === "all" ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAlumniSortYear("all");
                            setShowAlumniYearDropdown(false);
                          }}
                        >
                          SEMUA TAHUN
                        </div>
                        {graduationYears.map((yr: any) => (
                          <div
                            key={yr}
                            className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${alumniSortYear === yr.toString() ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAlumniSortYear(yr.toString());
                              setShowAlumniYearDropdown(false);
                            }}
                          >
                            {yr}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-xl border-2 border-slate-300 overflow-visible flex flex-col shadow-none">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40 bg-white">
                  <tr>
                    <th className="hidden md:table-cell sticky left-0 z-60 px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-black w-10 min-w-10 bg-slate-300">
                      <div className="flex items-center justify-center">
                        <div
                          onClick={toggleSelectAllAlumni}
                          className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                            paginatedAlumni.length > 0 && selectedAlumniIds.length === paginatedAlumni.length ? "bg-jade-500 border-jade-500" : "bg-white border-slate-400 hover:border-jade-400"
                          }`}
                        >
                          {paginatedAlumni.length > 0 && selectedAlumniIds.length === paginatedAlumni.length && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                    </th>
                    <th className="hidden md:table-cell sticky left-10 z-60 px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-black w-12 min-w-12 bg-slate-300">NO</th>
                    <th className="sticky left-0 md:left-22 z-60 px-4 md:px-6 py-4 text-left text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-l border-black w-27.5 md:w-auto min-27.5 md:min-w-0 bg-slate-300">
                      SANTRI
                    </th>
                    <th className="px-4 py-4 text-left text-[9.5px] font-black text-amber-600 uppercase tracking-widest border-t border-b border-r border-amber-600 bg-amber-50 w-40">NIS</th>
                    <th className="px-6 py-4 text-center text-emerald-600 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-emerald-600 bg-emerald-50 min-30">GENDER</th>
                    <th className="px-4 py-4 text-left text-[9.5px] font-black text-blue-600 uppercase tracking-widest border-t border-b border-r border-blue-600 bg-blue-50 w-44 whitespace-nowrap">KELAS TERAKHIR</th>
                    <th className="px-4 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-black bg-slate-300 w-28 whitespace-nowrap">TAHUN LULUS</th>
                    <th className="px-4 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-black bg-slate-300 w-28 whitespace-nowrap">AKSI</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedAlumni.length > 0 ? (
                    paginatedAlumni.map((alumnus: any, index: number) => (
                      <tr key={`${alumnus.id}-${index}`} className="group transition-colors hover:bg-slate-50/30">
                        <td className="hidden md:table-cell sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r border-b rounded-bl-xl border-slate-100 z-20 uppercase transition-colors">
                          <div className="flex items-center justify-center">
                            <div
                              onClick={(e) => toggleAlumniSelection(alumnus.id, e)}
                              className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                selectedAlumniIds.includes(alumnus.id) ? "bg-jade-500 border-jade-500" : "bg-white border-slate-300 group-hover:border-jade-400"
                              }`}
                            >
                              {selectedAlumniIds.includes(alumnus.id) && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell sticky left-10 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r border-b border-slate-100 z-20 uppercase transition-colors">
                          {(alumniPage - 1) * alumniPerPage + index + 1}
                        </td>
                        <td className="sticky left-0 md:left-22 bg-white px-3 md:px-6 py-4 border-r border-b border-slate-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div className="font-bold text-[10px] md:text-[11px] text-slate-800 truncate max-20 md:max-w-none capitalize" title={alumnus.full_name}>
                            {alumnus.full_name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap border-r border-b border-slate-100">
                          {alumnus.nis ? (
                            <span className="font-mono font-black text-[10.5px] text-amber-700 tracking-tight">{alumnus.nis}</span>
                          ) : (
                            <span className="text-slate-300 font-black text-[9px] uppercase tracking-widest leading-none">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-b border-slate-100 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${alumnus.gender === "L" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-purple-100 text-purple-700 border-purple-200"}`}
                          >
                            <span className="md:hidden">{alumnus.gender === "L" ? "L" : "P"}</span>
                            <span className="hidden md:inline">{alumnus.gender === "L" ? "LAKI-LAKI" : "PEREMPUAN"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap border-r border-b border-slate-100">
                          <span className="font-black text-[10.5px] text-slate-700 tracking-tight uppercase">Kelas {alumnus.last_class}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center border-r border-b border-slate-100">
                          <span className="font-black text-[10.5px] text-slate-700 tracking-tight">{alumnus.graduated_year}</span>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-center border-b rounded-br-xl border-slate-100 transition-colors">
                          <div className="flex justify-center gap-1 md:gap-2">
                            <button onClick={() => setInfoStudent(alumnus)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none" title="Detail Informasi Ortu">
                              <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedModalStudent(alumnus);
                                setIsHistoryModalOpen(true);
                              }}
                              className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none"
                              title="Riwayat Pengampu"
                            >
                              <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center border-b border-slate-100 rounded-b-xl">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                            <GraduationCap className="w-8 h-8 text-slate-200" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Data Masih Kosong</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Belum ada data alumni di sistem.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalAlumniPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-xl">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div
                      onClick={() => setShowAlumniPaginationDropdown(!showAlumniPaginationDropdown)}
                      className="bg-white border-2 border-slate-300 rounded-lg px-2 md:px-3 py-1 flex items-center justify-between gap-1.5 md:gap-2 text-[10px] font-black text-slate-700 outline-none hover:border-slate-400 cursor-pointer shadow-none transition-all select-none min-w-12.5 md:min-w-15"
                    >
                      <span>{alumniPerPage}</span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showAlumniPaginationDropdown ? "rotate-180 text-jade-500" : ""}`} />
                    </div>

                    {showAlumniPaginationDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAlumniPaginationDropdown(false)} />
                        <div className="absolute bottom-[calc(100%+4px)] left-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-50 py-1 min-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                          {[10, 25, 50, 100].map((val) => (
                            <div
                              key={val}
                              className={`px-3 py-2 text-[10px] font-black cursor-pointer transition-colors text-center ${alumniPerPage === val ? "bg-jade-50 text-jade-600" : "text-slate-600 hover:bg-slate-50"}`}
                              onClick={() => {
                                setAlumniPerPage(val);
                                setAlumniPage(1);
                                setShowAlumniPaginationDropdown(false);
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
                    <span className="hidden sm:inline">DATA</span> {(alumniPage - 1) * alumniPerPage + 1}-{Math.min(alumniPage * alumniPerPage, filteredAlumni.length)} <span className="hidden sm:inline text-slate-300">/</span>{" "}
                    <span className="text-amber-500 ml-0.5">{filteredAlumni.length}</span>
                  </p>
                </div>

                <div className="flex items-center gap-0.5 md:gap-1">
                  <button
                    disabled={alumniPage === 1}
                    onClick={() => setAlumniPage((prev) => Math.max(1, prev - 1))}
                    className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${alumniPage === 1 ? "text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
                  </button>

                  <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                    {[...Array(totalAlumniPages)].map((_, i) => {
                      const pNum = i + 1;
                      if (totalAlumniPages > 5) {
                        if (pNum !== 1 && pNum !== totalAlumniPages && Math.abs(pNum - alumniPage) > 1) {
                          if (pNum === 2 || pNum === totalAlumniPages - 1)
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
                          onClick={() => setAlumniPage(pNum)}
                          className={`w-7 h-7 md:w-9 md:h-9 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${alumniPage === pNum ? "bg-jade-600 text-white shadow-lg shadow-jade-100 border-2 border-jade-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent"}`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={alumniPage === totalAlumniPages}
                    onClick={() => setAlumniPage((prev) => Math.min(totalAlumniPages, prev + 1))}
                    className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${alumniPage === totalAlumniPages ? "text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ClassFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSubmit={handleCreateOrUpdate} initialData={isEditMode ? selectedClass : null} />

      {/* Roster Modal */}
      {isStudentsModalOpen && selectedClass && (
        <div className="fixed inset-0 z-160 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16">
          <div className="bg-white rounded-xl shadow-none w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative">
            {/* Modal Header */}
            <div className="px-5 py-2.5 border-b border-slate-50 rounded-xl flex justify-between items-center gap-2 bg-white shrink-0">
              <div className="min-w-0">
                <h3 className="text-[12px] sm:text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5 sm:gap-2 uppercase leading-none mb-0.5 truncate">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-jade-600 shrink-0" />
                  <span className="truncate">Daftar Santri Kelas {selectedClass.name}</span>
                </h3>
                <p className="text-[7px] sm:text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">Total {allStudents.filter((s) => s.class_id === selectedClass.id).length} Santri Di Kelas Ini</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {!isReadOnly &&
                  allStudents.filter((s) => s.class_id === selectedClass.id).length > 0 &&
                  (() => {
                    const classStudentIds = allStudents.filter((s) => s.class_id === selectedClass.id).map((s) => s.id);
                    const isAllSelected = classStudentIds.every((id) => selectedStudentIds.includes(id));
                    return (
                      <button
                        onClick={() => toggleSelectAll(allStudents.filter((s) => s.class_id === selectedClass.id))}
                        className="text-[8px] sm:text-[9px] font-black text-jade-600 uppercase tracking-widest bg-jade-50 border-2 border-jade-100 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-jade-100 transition-all active:scale-95 whitespace-nowrap shrink-0"
                      >
                        {isAllSelected ? "LEPAS SEMUA" : "PILIH SEMUA"}
                      </button>
                    );
                  })()}
                <button onClick={() => setIsStudentsModalOpen(false)} className="p-1.5 text-slate-500 bg-slate-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all sm:ml-1 shrink-0">
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Search/Filter placeholder (Optional, but keeps high density) */}
            <div className="px-5 py-3 bg-white border-b border-slate-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="CARI NAMA SANTRI..."
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-9 py-2 text-[11px] font-bold text-slate-600 outline-none focus:border-jade-400 transition-all placeholder:text-slate-300"
                  onChange={(e) => {
                    /* Add local filter if needed */
                  }}
                />
                <Users className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Student List Content */}
            <div className="p-4 overflow-y-auto flex-1 scrollbar-hide space-y-2">
              {allStudents
                .filter((s) => s.class_id === selectedClass.id)
                .map((student, idx) => (
                  <div
                    key={student.id}
                    onClick={() => !isReadOnly && toggleStudentSelection(student.id)}
                    className={`flex items-center justify-between p-3.5 rounded-[20px] border transition-all select-none ${!isReadOnly ? "cursor-pointer" : "cursor-default"} group ${selectedStudentIds.includes(student.id) ? "border-jade-200 bg-jade-50/30 shadow-sm" : "border-slate-100/50 bg-[#FBFDFE] hover:bg-white hover:shadow-md hover:border-slate-200"}`}
                  >
                    <div className="flex items-center gap-3.5">
                      {!isReadOnly && (
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudentIds.includes(student.id) ? "bg-jade-600 border-jade-600 text-white shadow-sm scale-110" : "border-slate-200 bg-white group-hover:border-jade-400"}`}
                        >
                          {selectedStudentIds.includes(student.id) && <Check className="w-3.5 h-3.5" />}
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] font-black text-slate-800 capitalize leading-tight mb-0.5">{student.full_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[8px] text-slate-400 font-black tracking-widest">{student.nis || "TANPA NIS"}</p>
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          <div className={`text-[8px] font-black uppercase tracking-widest ${student.gender === "L" ? "text-jade-400" : "text-pink-400"}`}>{student.gender === "L" ? "Putra" : "Putri"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {allStudents.filter((s) => s.class_id === selectedClass.id).length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <GraduationCap className="w-8 h-8 text-slate-200" />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Kosong</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Belum ada santri di kelas ini.</p>
                </div>
              )}
            </div>


          </div>
        </div>
      )}

      {/* Promotion Confirmation Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16">
          <div className="bg-white rounded-xl shadow-none max-w-sm w-full h-90 flex flex-col overflow-hidden relative border-2 border-slate-300 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-2.5 border-b border-slate-50 rounded-xl flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 leading-none mb-0.5 uppercase">Siklus Kenaikan Kelas</h3>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{selectedClassIds.length} Kelas Dipilih</p>
                </div>
              </div>
              <button onClick={() => setShowPromoteModal(false)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1">
              {/* Rules */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Aturan Proses</p>
                <div className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-[14px] border border-emerald-100">
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 rounded-md px-1.5 py-0.5 shrink-0 mt-0.5">01</span>
                  <p className="text-[10px] font-bold text-emerald-800 leading-snug">
                    <span className="font-black">Naik Tingkat:</span> Angka nama kelas bertambah <span className="font-black text-slate-800">+1</span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-[14px] border border-amber-100">
                  <span className="text-[9px] font-black text-amber-600 bg-amber-100 rounded-md px-1.5 py-0.5 shrink-0 mt-0.5">02</span>
                  <p className="text-[10px] font-bold text-amber-800 leading-snug">
                    <span className="font-black">Kelulusan:</span> Jika mencapai Kelas <span className="font-black text-slate-800">{systemConfig.max}</span>, kelas dihapus dan terlahir kembali sebagai Kelas{" "}
                    <span className="font-black text-jade-600">{systemConfig.min}</span>
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-100 rounded-[14px] p-3 flex gap-2.5 items-start">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 leading-snug">
                  <span className="font-black">Peringatan:</span> Proses "Kelulusan" akan <span className="font-black">MENGHAPUS</span> card kelas. Pastikan data santri kelas {systemConfig.max} sudah diproses.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1 mt-auto">
                <button
                  onClick={() => setShowPromoteModal(false)}
                  disabled={isPromoting}
                  className="flex-1 h-10 lg:h-11 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border-2 border-slate-300 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                >
                  BATAL
                </button>
                <button
                  onClick={() => handlePreBulkPromote()}
                  disabled={isPromoting}
                  className="flex-2 h-10 lg:h-11 rounded-xl text-[10px] font-black text-orange-500 uppercase tracking-widest bg-white hover:bg-orange-50 shadow-none border-2 border-orange-500 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isPromoting ? <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" /> : <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  {isPromoting ? "MEMPROSES..." : "PROSES SEKARANG"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graduation Confirm Modal */}
      {isGraduationConfirmOpen && (
        <div className="fixed inset-0 z-210 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16">
          <div className="bg-white rounded-xl shadow-none max-w-sm w-full h-90 flex flex-col overflow-hidden relative border-2 border-slate-300 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-2.5 border-b border-slate-50 rounded-xl flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border-2 border-slate-100 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">Hapus Data Lulusan?</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1 opacity-70">Konfirmasi Sistem</p>
                </div>
              </div>
              <button onClick={() => setIsGraduationConfirmOpen(false)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="overflow-y-auto flex-1 text-[11px] font-bold text-slate-500 leading-normal text-left custom-scrollbar">
                <span className="text-red-600 font-black block mb-2">PERINGATAN: Terdapat santri di kelas tertinggi yang akan lulus.</span>
                Apakah Anda ingin <span className="font-black text-slate-800">MENGHAPUS</span> data santri tersebut secara permanen dari sistem?
                <br />
                <br />
                Jika <span className="font-black text-jade-600">TIDAK</span>, data santri hanya akan dikosongkan dari kelasnya dan menjadi alumni.
              </div>

              <div className="flex flex-col gap-2 pt-2 mt-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkPromote(true)}
                    disabled={isPromoting}
                    className="flex-1 h-10 lg:h-11 font-black text-[9px] uppercase tracking-widest rounded-xl bg-white text-red-600 hover:bg-red-50 border-2 border-red-500 shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 group px-1"
                  >
                    {promoteAction === "hapus" ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin shrink-0" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
                    )}
                    <span className="truncate">YA, HAPUS</span>
                  </button>
                  <button
                    onClick={() => handleBulkPromote(false)}
                    disabled={isPromoting}
                    className="flex-1 h-10 lg:h-11 font-black text-[9px] uppercase tracking-widest rounded-xl bg-white text-jade-600 hover:bg-jade-50 border-2 border-jade-500 shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 group px-1"
                  >
                    {promoteAction === "lulus" ? (
                      <div className="w-3.5 h-3.5 border-2 border-jade-200 border-t-jade-600 rounded-full animate-spin shrink-0" />
                    ) : (
                      <GraduationCap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
                    )}
                    <span className="truncate">LULUSKAN SAJA</span>
                  </button>
                </div>
                <button
                  onClick={() => setIsGraduationConfirmOpen(false)}
                  disabled={isPromoting}
                  className="w-full h-9 font-black text-[10px] uppercase tracking-widest rounded-xl bg-white text-slate-400 hover:bg-slate-50 border-2 border-slate-300 shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                  BATAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        centerOnScreen={false}
        title="Hapus Kelas?"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        confirmLabel="YA, HAPUS"
        message={
          <span>
            Hapus Kelas <span className="font-bold text-slate-800">{deleteTarget?.name}</span>?
            {deleteTarget && allStudents.filter((s) => s.class_id === deleteTarget.id).length > 0 && (
              <span className="text-red-600 font-bold mt-2 block text-[10px]">Peringatan: Ada {allStudents.filter((s) => s.class_id === deleteTarget.id).length} santri di kelas ini!</span>
            )}
          </span>
        }
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        centerOnScreen={false}
        title="Hapus Massal?"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        confirmLabel="YA, HAPUS SEMUA"
        message={
          <span>
            Hapus <span className="font-bold text-slate-800">{selectedClassIds.length} kelas</span> dipilih?
            {allStudents.filter((s) => s.class_id && selectedClassIds.includes(s.class_id)).length > 0 && (
              <span className="text-red-600 font-bold mt-2 block text-[10px]">Peringatan: Ada total {allStudents.filter((s) => s.class_id && selectedClassIds.includes(s.class_id)).length} santri!</span>
            )}
          </span>
        }
      />

      <ConfirmModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onConfirm={handleGenerateStructure}
        centerOnScreen={false}
        title="Sinkronkan Struktur?"
        icon={<Wand2 className="w-8 h-8" />}
        variant="primary"
        confirmLabel="SINKRONKAN SEKARANG"
        message={
          <div className="text-left space-y-3">
            <p>
              Sistem akan menyesuaikan rentang{" "}
              <strong>
                {systemConfig.min} - {systemConfig.max}
              </strong>
              :
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Dibuat otomatis: {systemConfig.min} s/d {systemConfig.max}.
              </li>
              <li>
                <span className="text-red-600 font-bold">Hapus otomatis</span> kelas di luar rentang.
              </li>
            </ul>
          </div>
        }
      />

      {/* Alumni Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isAlumniDeleteModalOpen}
        onClose={() => setIsAlumniDeleteModalOpen(false)}
        onConfirm={handleDeleteSelectedAlumni}
        centerOnScreen={false}
        title="Hapus Data Alumni?"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        confirmLabel="YA, HAPUS"
        message={
          <span>
            Hapus <span className="font-bold text-slate-800">{selectedAlumniIds.length} data alumni</span> yang dipilih?
            <span className="text-red-600 font-bold mt-2 block text-[10px]">Data yang dihapus tidak dapat dikembalikan.</span>
          </span>
        }
      />
      {infoStudent && <InfoModal student={infoStudent} onClose={() => setInfoStudent(null)} />}
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} student={selectedModalStudent} />
    </div>
  );
};
