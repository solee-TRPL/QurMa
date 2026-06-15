import React, { useEffect, useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import {
  getUsers,
  getStudents,
  getHalaqahs,
  getClasses,
  createUser,
  createStudent,
  updateStudent,
  deleteStudent,
  updateUser,
  forceResetPassword,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getStudentNotes,
  createStudentNote,
  deleteStudentNote,
  updateStudentNote,
  markNoteAsSeen,
  createHalaqah,
  updateHalaqah,
  deleteHalaqah,
  checkNisExistsGlobal,
  checkHasInitialSabaq,
} from "../../services/dataService";
import { UserProfile, UserRole, Student, Halaqah, Class, Achievement, TeacherNote } from "../../types";
import {
  Mail,
  Phone,
  Search,
  GraduationCap,
  MessageCircle,
  ArrowUpRight,
  UserPlus,
  Filter,
  Download,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  School,
  Edit,
  Edit3,
  Trash2,
  X,
  Upload,
  FileDown,
  Info,
  ChevronRight,
  Database,
  RefreshCw,
  Users,
  User,
  Home,
  Check,
  Lock,
  Eye,
  EyeOff,
  Trophy,
  Calendar,
  Trash,
  Plus,
  Save,
  MessageSquare,
  History,
  Timer,
  Fingerprint,
  AlertTriangle,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useNotification } from "../../lib/NotificationContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { getStudentAssignmentHistory, getAssignmentsByDateRange, AssignmentHistory } from "../../services/dataService";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import { HalaqahFormModal, HalaqahDetailModal } from "./HalaqahManagement";
import { getPhysicalLocation } from "../../lib/quranUtils";

// --- Types for Joined Data ---
interface StudentRekap extends Student {
  parent_name?: string;
  parent_email?: string;
  parent_whatsapp?: string;
  halaqah_name?: string;
  halaqah_teacher_name?: string;
  class_name?: string;
}

// --- PERSISTENT CACHE ---
// Stores data in memory outside the component lifecycle to eliminate flicker during navigation
let studentCache: StudentRekap[] | null = null;
let halaqahCache: Halaqah[] | null = null;
let classCache: Class[] | null = null;

// --- SHARED MODAL COMPONENTS ---

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  user: UserProfile;
  onUpdate: () => void;
}
const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose, student, user, onUpdate }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string>("emerald");
  const [achToDelete, setAchToDelete] = useState<{ id: string; title: string } | null>(null);
  const [editingAchId, setEditingAchId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (student && isOpen) {
      getAchievements(student.id)
        .then((res) => {
          if (Array.isArray(res)) setAchievements(res);
        })
        .catch(() => setAchievements([]));
      setTitle("");
      setColor("emerald");
      setEditingAchId(null);
      setAchToDelete(null);
    } else {
      setTitle("");
      setColor("emerald");
      setEditingAchId(null);
      setAchToDelete(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (editingAchId) {
        await updateAchievement(editingAchId, title, color, user, student.full_name);
        addNotification({ type: "success", title: "Berhasil", message: "Pencapaian telah diperbarui." });
        setEditingAchId(null);
      } else {
        await createAchievement(
          {
            title,
            student_id: student.id,
            date: new Date().toISOString(),
            color: color,
          },
          user,
          student.full_name,
        );
        addNotification({ type: "success", title: "Berhasil", message: "Pencapaian baru telah ditambahkan." });
      }
      onUpdate();
      setTitle("");
      setColor("emerald");
      getAchievements(student.id).then((res) => {
        if (Array.isArray(res)) setAchievements(res);
      });
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat memproses pencapaian." });
    }
  };

  const handleEditAch = (ach: Achievement) => {
    setEditingAchId(ach.id);
    setTitle(ach.title);
    setColor(ach.color || "emerald");
  };

  const cancelEdit = () => {
    setEditingAchId(null);
    setTitle("");
    setColor("emerald");
  };

  const handleDelete = async (id: string, achievementTitle: string) => {
    setAchToDelete({ id, title: achievementTitle });
  };

  const confirmDelete = async () => {
    if (!achToDelete) return;
    try {
      await deleteAchievement(achToDelete.id, user, student.full_name, achToDelete.title);
      onUpdate();
      getAchievements(student.id).then((res) => {
        if (Array.isArray(res)) setAchievements(res);
      });
      addNotification({ type: "success", title: "Berhasil", message: "Pencapaian telah dihapus." });
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat menghapus pencapaian." });
    }
    setAchToDelete(null);
  };

  return (
    <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase">Pencapaian Santri</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2.5 max-h-[60vh] scrollbar-hide bg-slate-50/30">
          {achievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <Trophy className="w-12 h-12 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada pencapaian</p>
            </div>
          ) : (
            achievements.map((ach) => (
              <div
                key={ach.id}
                className="group relative flex justify-between items-center bg-slate-50/30 p-2.5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-jade-100 ring-1 ring-transparent hover:ring-jade-50/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shrink-0 ${
                      ach.color === "emerald"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : ach.color === "blue"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : ach.color === "orange"
                            ? "bg-orange-50 text-orange-600 border-orange-100"
                            : ach.color === "purple"
                              ? "bg-purple-50 text-purple-600 border-purple-100"
                              : ach.color === "pink"
                                ? "bg-pink-50 text-pink-600 border-pink-100"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-tight leading-none truncate">{ach.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 opacity-40">
                      <Calendar className="w-2.5 h-2.5" />
                      <span className="text-[7.5px] font-black uppercase tracking-widest">{ach.date ? new Date(ach.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const isOwner = ach.teacher_name === user.full_name || user.role === "admin" || user.role === "superadmin" || !ach.teacher_name;
                  if (!isOwner) return null;
                  return (
                    <div className="flex gap-1 items-center">
                      <button onClick={() => handleEditAch(ach)} className="p-1.5 text-slate-500 hover:text-blue-500 rounded-lg transition-all group-hover:opacity-100">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ach.id, ach.title)} className="p-1.5 text-slate-500 hover:text-red-500 rounded-lg transition-all group-hover:opacity-100">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleAdd} className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pencapaian</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Hafal Juz 30"
                className="w-full px-4 py-2.5 border-2 border-slate-100 bg-white rounded-2xl focus:ring-0 focus:border-jade-400 shadow-sm transition-all text-[9px] uppercase font-bold text-slate-800 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Warna</label>
              <div className="flex flex-wrap gap-3 py-1.5 px-1">
                {["emerald", "blue", "orange", "purple", "pink"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${color === c ? `ring-2 ring-offset-1 ring-${c}-500 border-white bg-${c}-500` : `bg-${c}-400 border-transparent opacity-40 hover:opacity-100`} ${
                      c === "emerald" ? "bg-emerald-500" : c === "blue" ? "bg-blue-500" : c === "orange" ? "bg-orange-500" : c === "purple" ? "bg-purple-500" : "bg-pink-500"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0 mb-1">
              {editingAchId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-[9px] font-black tracking-[0.2em] uppercase flex items-center justify-center">
                  BATAL
                </button>
              )}
              <button type="submit" className="px-6 py-2 bg-jade-600 text-white rounded-xl hover:bg-jade-700 shadow-lg shadow-jade-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                {editingAchId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>
        <ConfirmModal
          isOpen={!!achToDelete}
          onClose={() => setAchToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Pencapaian?"
          variant="danger"
          confirmLabel="YA, HAPUS"
          message={
            <span>
              Apakah Anda yakin ingin menghapus pencapaian <strong>{achToDelete?.title}</strong>? <br />
              <br /> <span className="text-rose-500 font-bold italic text-[10px]">Tindakan ini tidak dapat dibatalkan.</span>
            </span>
          }
        />
      </div>
    </div>
  );
};

const HistoryModal = ({ isOpen, onClose, student }: { isOpen: boolean; onClose: () => void; student: Student | null }) => {
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      setLoading(true);
      getStudentAssignmentHistory(student.id)
        .then(setHistory)
        .finally(() => setLoading(false));
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-9999 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-none w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
              <History className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">Riwayat Pengampu</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4 max-72.5 custom-scrollbar bg-slate-50/20">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-30">
              <RefreshCw className="w-10 h-10 animate-spin mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Memuat Riwayat...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <History className="w-12 h-12 mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada riwayat tercetak</p>
            </div>
          ) : (
            history.map((h, idx) => (
              <div key={h.id} className="relative pl-6 pb-2 last:pb-0 border-l-2 border-slate-300 ml-2">
                <div className="absolute -left-2.25 top-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-jade-400 z-10" />
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-jade-700 tracking-tight uppercase leading-none">{h.teacher_name}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(h.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-400">S/D</span>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-2.5 h-2.5 text-rose-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          {h.end_date ? new Date(h.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "SAAT INI"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="bg-rose-50 px-2 py-1.5 rounded-xl border border-rose-100 flex flex-col items-center justify-center min-w-12.5 shadow-sm">
                        <span className="text-[12px] font-black text-rose-600 leading-none">{h.total_absences || 0}</span>
                        <span className="text-[6px] font-black text-rose-400 uppercase tracking-widest mt-1">Ketidakhadiran</span>
                      </div>
                      <div className="bg-jade-50 px-2.5 py-1.5 rounded-xl border border-jade-100 flex flex-col items-center justify-center min-w-16 shadow-sm">
                        <div className="flex items-center gap-1.5 justify-center text-jade-700">
                          {(() => {
                            const lines = h.total_sabaq_lines || 0;
                            if (!lines) return <span className="text-[12px] font-black leading-none">0</span>;
                            const juz = Math.floor(lines / 300);
                            const rem = lines % 300;
                            const hal = Math.floor(rem / 15);
                            const brs = rem % 15;
                            return (
                              <>
                                {juz > 0 && (
                                  <span className="flex items-baseline gap-0.5">
                                    <span className="text-[12px] font-black leading-none">{juz}</span>
                                    <span className="text-[8px] font-bold opacity-70">Juz</span>
                                  </span>
                                )}
                                {hal > 0 && (
                                  <span className="flex items-baseline gap-0.5">
                                    <span className="text-[12px] font-black leading-none">{hal}</span>
                                    <span className="text-[8px] font-bold opacity-70">Hal</span>
                                  </span>
                                )}
                                {(brs > 0 || (juz === 0 && hal === 0)) && (
                                  <span className="flex items-baseline gap-0.5">
                                    <span className="text-[12px] font-black leading-none">{brs}</span>
                                    <span className="text-[8px] font-bold opacity-70">Baris</span>
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-[6px] font-black text-jade-400 uppercase tracking-widest mt-1">Total Sabaq</span>
                      </div>
                      <div className="bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100 flex flex-col items-center justify-center min-w-16 shadow-sm">
                        <div className="flex items-center gap-1.5 justify-center text-blue-700">
                          {(() => {
                            if (h.last_surah && h.last_ayat !== undefined) {
                              const loc = getPhysicalLocation(h.last_surah, h.last_ayat);
                              if (loc) {
                                return (
                                  <>
                                    <span className="flex items-baseline gap-1">
                                      <span className="text-[8px] font-bold opacity-70">Juz</span>
                                      <span className="text-[12px] font-black leading-none">{31 - loc.juz}</span>
                                    </span>
                                  </>
                                );
                              }
                            }
                            return <span className="text-[12px] font-black leading-none">-</span>;
                          })()}
                        </div>
                        <span className="text-[6px] font-black text-blue-400 uppercase tracking-widest mt-1">Juz Saat Ini</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-50 text-center">
          <button onClick={onClose} className="text-[10px] font-black text-jade-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};

const GlobalTrackingModal = ({ isOpen, onClose, tenantId }: { isOpen: boolean; onClose: () => void; tenantId: string }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [results, setResults] = useState<any[]>([]);
  const [trackingSearch, setTrackingSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await getAssignmentsByDateRange(tenantId, startDate, endDate);
      setResults(data);
    } catch (e) {}
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-9999 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-none w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">Tracking Pengampu Global</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Audit Riwayat Pembimbing Berdasarkan Periode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-slate-50/30 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-end gap-0 md:gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 md:flex-none space-y-1">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai</label>
              <div className="h-9 md:min-w-25 lg:min-w-31.25 px-3 flex items-center justify-center bg-white border-2 border-slate-300 rounded-xl focus-within:border-jade-400 transition-all w-full">
                <CustomDatePicker value={startDate} align="center" onChange={setStartDate} />
              </div>
            </div>
            <div className="flex-1 md:flex-none space-y-1">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Hingga</label>
              <div className="h-9 md:min-w-25 lg:min-w-31.25 px-3 flex items-center justify-center bg-white border-2 border-slate-300 rounded-xl focus-within:border-jade-400 transition-all w-full">
                <CustomDatePicker value={endDate} align="center" onChange={setEndDate} />
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 flex-1">
            <div className="flex-1 space-y-1">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Nama / NIS</label>
              <div className="relative group h-9">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  className="w-full h-full pl-8 pr-3 bg-white border-2 border-slate-300 rounded-xl focus:ring-0 focus:border-jade-400 transition-all text-[13px] font-bold text-slate-800 placeholder:text-slate-300 outline-none shadow-none"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="h-9 w-9 bg-jade-600 text-white rounded-xl shadow-none hover:bg-jade-700 transition-all active:scale-95 flex items-center justify-center shrink-0 border-2 border-jade-600 mb-px"
              title="Lacak Data"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar scrollbar-hide ${results.length === 0 ? "flex flex-col items-center justify-center min-h-50" : ""}`}>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center opacity-30 my-auto">
              <Timer className="w-12 h-12 mb-2 text-slate-600" />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">Tentukan periode untuk tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results
                .filter((res) => res.student_name.toLowerCase().includes(trackingSearch.toLowerCase()) || (res.student_nis && res.student_nis.includes(trackingSearch)))
                .map((res, i) => (
                  <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{res.student_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">NIS: {res.student_nis}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-jade-600 uppercase tracking-widest leading-none mb-1">{res.teacher_name || "-"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{res.halaqah_name}</p>
                      </div>
                      <div className="w-px h-6 bg-slate-100 hidden md:block" />
                      <div className="flex flex-col items-end whitespace-nowrap">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          {new Date(res.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {res.end_date ? new Date(res.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "SAAT INI"}
                        </p>
                        <span className="text-[7px] font-black text-jade-300 uppercase tracking-widest mt-1">Rentang Tugas</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="px-8 py-3 bg-slate-300 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Daftar ini menunjukkan pembimbing yang aktif bertugas dalam periode yang dipilih.</p>
        </div>
      </div>
    </div>
  );
};

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  user: UserProfile;
  onUpdate: () => void;
}
const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, student, user, onUpdate }) => {
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"Motivasi" | "Evaluasi" | "Perilaku" | "Lainnya">("Motivasi");
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingReply, setViewingReply] = useState<string | null>(null);
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const { addNotification } = useNotification();
  const categories: (typeof category)[] = ["Motivasi", "Evaluasi", "Perilaku", "Lainnya"];

  const loadNotes = () => {
    if (!student) return;
    getStudentNotes(student.id)
      .then((res) => {
        if (Array.isArray(res)) {
          const roleName = user.role === "superadmin" ? "admin" : user.role;
          const readerString = `${user.full_name} [${roleName}]`;
          const updatedRes = res.map((note) => {
            const seenArray = note.seen_by || [];
            if (!seenArray.includes(readerString)) {
              markNoteAsSeen(note.id, readerString, seenArray);
              return { ...note, seen_by: [...seenArray, readerString] };
            }
            return note;
          });
          setNotes(updatedRes);
        }
      })
      .catch(() => setNotes([]));
  };

  useEffect(() => {
    if (student && isOpen) {
      loadNotes();
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      if (editingNoteId) {
        await updateStudentNote(editingNoteId, content, category, user, student.full_name);
        addNotification({ type: "success", title: "Berhasil", message: "Catatan telah diperbarui." });
        setEditingNoteId(null);
      } else {
        await createStudentNote({ content, student_id: student.id, category, teacher_name: `${user.full_name} | ${user.role}`, date: new Date().toISOString() }, user, student.full_name);
        addNotification({ type: "success", title: "Berhasil", message: "Catatan baru telah ditambahkan." });
      }
      onUpdate();
      setContent("");
      loadNotes();
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat memproses catatan." });
    }
  };

  const handleEditNote = (note: TeacherNote) => {
    setEditingNoteId(note.id);
    setContent(note.content);
    setCategory(note.category as any);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setContent("");
  };

  const handleDelete = async (id: string) => {
    setNoteToDelete(id);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await deleteStudentNote(noteToDelete, user, student.full_name);
      onUpdate();
      getStudentNotes(student.id).then((res) => {
        if (Array.isArray(res)) setNotes(res);
      });
      addNotification({ type: "success", title: "Berhasil", message: "Catatan telah dihapus." });
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat menghapus catatan." });
    }
    setNoteToDelete(null);
  };

  const uniqueSenders = Array.from(new Set(notes.map((n) => n.teacher_name.split("|")[0].trim())));
  const filteredNotes = notes.filter((n) => {
    if (senderFilter === "all") return true;
    if (senderFilter === "me") return n.teacher_name.split("|")[0].trim() === user.full_name;
    return n.teacher_name.split("|")[0].trim() === senderFilter;
  });

  return (
    <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-9999 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-none w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-jade-50 rounded-lg flex items-center justify-center border border-jade-100">
              <MessageSquare className="w-4 h-4 text-jade-600" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">
                {user.role === "admin" || user.role === "superadmin" ? "Catatan Admin" : user.role === "supervisor" ? "Catatan Supervisor" : "Catatan Ustadz"}
              </h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{student.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notes.length > 0 && (
              <select
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-[8px] font-black text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:border-jade-400 uppercase cursor-pointer max-w-28 truncate"
              >
                <option value="all">SEMUA PENGIRIM</option>
                <option value="me">ANDA</option>
                {uniqueSenders
                  .filter((s) => s !== user.full_name)
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto space-y-3 max-h-62.5 custom-scrollbar bg-slate-50/20">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada catatan</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                Catatan dari pengirim
                <br />
                tersebut tidak ditemukan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                let displayName = note.teacher_name;
                let roleName = "";
                if (displayName.includes("|")) {
                  const parts = displayName.split("|");
                  displayName = parts[0].trim();
                  roleName = parts[1].trim();
                }
                const isOwner = displayName === user.full_name || note.teacher_name === user.full_name || user.role === "admin" || user.role === "superadmin";

                return (
                  <div
                    key={note.id}
                    onClick={() => note.reply_content && setViewingReply(viewingReply === note.id ? null : note.id)}
                    className={`group relative z-10 hover:z-50 flex flex-col bg-white p-2.5 rounded-lg border border-slate-200 transition-all hover:shadow-sm hover:border-slate-300 ${note.reply_content ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex justify-between items-center mb-2 relative">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 text-[6px] font-black uppercase tracking-widest rounded border ${
                            note.category === "Motivasi"
                              ? "bg-jade-50 text-jade-600 border-jade-100"
                              : note.category === "Evaluasi"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : note.category === "Perilaku"
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {note.category}
                        </span>
                        <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-0.5">
                          <Calendar className="w-2 h-2 opacity-60" />
                          {note.date ? new Date(note.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isOwner && (
                          <div className="flex items-center gap-0.5">
                            <div className="relative group/info">
                              <button className="p-1 text-slate-400 hover:text-jade-500 rounded-md transition-all cursor-help" onClick={(e) => e.stopPropagation()}>
                                <Info className="w-3 h-3" />
                              </button>
                              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover/info:block bg-slate-800 text-white text-[8px] p-2.5 rounded-xl shadow-xl z-9999 w-max min-w-36 pointer-events-none animate-in fade-in zoom-in duration-200">
                                <div className="font-black tracking-widest text-slate-400 mb-2 border-b border-slate-600 pb-1.5 uppercase">Status Dilihat:</div>
                                {(() => {
                                  const authorName = note.teacher_name.split(" | ")[0].trim().toLowerCase();
                                  const filteredSeenBy =
                                    note.seen_by?.filter((seenStr) => {
                                      const readerName = seenStr.split(" [")[0].trim().toLowerCase();
                                      return readerName !== authorName && readerName !== note.teacher_name.toLowerCase();
                                    }) || [];

                                  return filteredSeenBy.length > 0 ? (
                                    <div className="flex flex-col gap-1.5">
                                      {filteredSeenBy.map((seenStr, i) => (
                                        <div key={i} className="flex justify-between items-center gap-6">
                                          <span className="uppercase font-bold tracking-widest text-slate-200">{seenStr}</span>
                                          <CheckCircle2 className="w-3 h-3 text-jade-400" />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-slate-400 text-[9px] uppercase tracking-widest text-center">Belum dilihat</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditNote(note);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-500 rounded-md transition-all"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(note.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-all"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[8.5px] font-black text-slate-700 leading-snug tracking-tight uppercase mb-2 px-0.5">{note.content}</p>

                    <div className="flex justify-between items-end mt-auto pt-1.5 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <User className="w-2 h-2" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tight leading-none">{isOwner ? "Anda" : displayName}</span>
                          {roleName && !isOwner && <span className="text-[5.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{roleName}</span>}
                        </div>
                      </div>
                      {note.reply_content && (
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 bg-jade-50 px-1 py-0.5 rounded border border-jade-100">
                            <CheckCircle2 className="w-2.5 h-2.5 text-jade-500" />
                            <span className="text-[6px] font-black text-jade-600 uppercase tracking-tight">Dibalas</span>
                          </div>
                          <div className={`p-0.5 rounded transition-all duration-300 ${viewingReply === note.id ? "rotate-180 bg-jade-50" : "bg-slate-50"}`}>
                            <ChevronDown className={`w-3 h-3 ${viewingReply === note.id ? "text-jade-600" : "text-slate-400"}`} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`grid transition-all duration-500 ease-in-out ${viewingReply === note.id ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="flex items-start gap-2 bg-jade-50/50 p-2.5 rounded-xl border border-jade-100">
                          <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-black text-jade-700 uppercase tracking-widest">Balasan Wali Santri</span>
                              <span className="text-[7.5px] font-bold text-jade-400/80">{note.replied_at ? new Date(note.replied_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
                            </div>
                            <p className="text-[8.5px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">{note.reply_content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <form onSubmit={handleAdd} className="p-3 border-t border-slate-100 bg-slate-50/30 space-y-2.5">
          <div className="flex items-center gap-3">
            <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em] w-12 shrink-0 ml-1">Catatan</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis catatan baru..."
              className="flex-1 px-3.5 border-2 border-slate-300 bg-white rounded-xl focus:ring-0 focus:border-jade-600 shadow-none transition-all text-[12px] font-bold text-slate-800 outline-none h-10 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[9px] placeholder:tracking-widest"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em] w-12 shrink-0 ml-1">Kategori</label>
            <div className="flex-1 flex bg-white p-1 rounded-xl border-2 border-slate-300 h-10 overflow-hidden shadow-none">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 px-2.5 text-[8.5px] font-black uppercase tracking-tight rounded-lg transition-all whitespace-nowrap ${
                    category === cat ? "bg-jade-600 text-white shadow-none" : "text-slate-400 hover:text-jade-600 hover:bg-jade-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 w-full mt-2">
            {editingNoteId && (
              <button type="button" onClick={cancelEdit} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-red-700 transition-all active:scale-[0.98]">
                BATAL EDIT
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-jade-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-jade-700 shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <Save className="w-4 h-4" />
              {editingNoteId ? "SIMPAN" : "SIMPAN DATA"}
            </button>
          </div>
        </form>
        <ConfirmModal
          isOpen={!!noteToDelete}
          onClose={() => setNoteToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Catatan?"
          variant="danger"
          confirmLabel="YA, HAPUS"
          message={
            <span>
              Hapus catatan ini? <br /> <span className="text-red-600 font-bold text-[10px]">Tindakan ini bersifat permanen.</span>
            </span>
          }
        />
      </div>
    </div>
  );
};

export const StudentManagement: React.FC<{ tenantId: string; user: UserProfile }> = ({ tenantId, user: currentUser }) => {
  const isReadOnly = currentUser.role === UserRole.SUPERVISOR;
  const [rekapData, setRekapData] = useState<StudentRekap[]>(studentCache || []);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(halaqahCache || []);
  const [classes, setClasses] = useState<Class[]>(classCache || []);
  const [activeTab, setActiveTab] = useState<"santri" | "halaqah">("santri");
  const [loading, setLoading] = useState(!studentCache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenderFormDropdown, setShowGenderFormDropdown] = useState(false);
  const [showHalaqahFormDropdown, setShowHalaqahFormDropdown] = useState(false);
  const [showClassFormDropdown, setShowClassFormDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showRegencyDropdown, setShowRegencyDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRekap | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRekap | null>(null);
  const [editingHalaqahId, setEditingHalaqahId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">("bottom");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[], summary: [] as string[] });
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNisMobile, setShowNisMobile] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isGlobalTrackingOpen, setIsGlobalTrackingOpen] = useState(false);
  const [selectedModalStudent, setSelectedModalStudent] = useState<Student | null>(null);

  const confirmResetPassword = async () => {
    if (!selectedStudent || !selectedStudent.parent_id || !selectedStudent.nis) {
      addNotification({ type: "warning", title: "Gagal", message: "Data tidak lengkap." });
      return;
    }

    setIsResetting(true);
    try {
      await forceResetPassword(selectedStudent.parent_id, selectedStudent.nis, currentUser);
      addNotification({
        type: "success",
        title: "Berhasil Reset",
        message: `Password akun ${selectedStudent.full_name} telah di-reset ke NIS: ${selectedStudent.nis}`,
      });
      setShowResetConfirm(false);
    } catch (error: any) {
      console.error("Reset failed:", error);
      addNotification({
        type: "error",
        title: "Gagal Reset",
        message: error.message || "Terjadi kesalahan sistem saat me-reset password.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Filter States
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [filterHalaqah, setFilterHalaqah] = useState("all");
  const [showHalaqahDropdown, setShowHalaqahDropdown] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPaginationDropdown, setShowPaginationDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    studentName: "",
    nis: "",
    nik: "",
    gender: "",
    classId: "",
    halaqahId: "",
    parentName: "",
    parentEmail: "",
    parentWhatsapp: "",
    fatherName: "",
    motherName: "",
    fatherPhone: "",
    motherPhone: "",
    address: "",
    rtRw: "",
    village: "",
    district: "",
    city: "",
    provinceId: "",
    regencyId: "",
    districtId: "",
    villageId: "",
  });

  // Regional Data States
  const [regions, setRegions] = useState<{
    provinces: { id: string; name: string }[];
    regencies: { id: string; name: string }[];
    districts: { id: string; name: string }[];
    villages: { id: string; name: string }[];
  }>({ provinces: [], regencies: [], districts: [], villages: [] });

  const fetchProvinces = async () => {
    try {
      const res = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
      const data = await res.json();
      setRegions((prev) => ({ ...prev, provinces: data }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllRegencies = async () => {
    // If we want ALL cities at once, it's better to fetch by province or a flat list if available.
    // emsifa doesn't have a direct /api/regencies.json but we can iterate provinces or use a different source.
    // For now, let's stick to Province -> Regency to keep it efficient, but we can combine them.
    if (regions.provinces.length === 0) await fetchProvinces();
  };

  const onProvinceChange = async (provId: string) => {
    setFormData((prev) => ({ ...prev, provinceId: provId, regencyId: "", districtId: "", villageId: "", city: "", district: "", village: "" }));
    if (!provId) {
      setRegions((prev) => ({ ...prev, regencies: [], districts: [], villages: [] }));
      return;
    }
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
      const data = await res.json();
      setRegions((prev) => ({ ...prev, regencies: data, districts: [], villages: [] }));
    } catch (e) {
      console.error(e);
    }
  };

  const onRegencyChange = async (regId: string, regName: string) => {
    const cleanedCity = regName.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, "").trim();
    setFormData((prev) => ({ ...prev, regencyId: regId, districtId: "", villageId: "", city: cleanedCity, district: "", village: "" }));
    if (!regId) {
      setRegions((prev) => ({ ...prev, districts: [], villages: [] }));
      return;
    }
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regId}.json`);
      const data = await res.json();
      setRegions((prev) => ({ ...prev, districts: data, villages: [] }));
    } catch (e) {
      console.error(e);
    }
  };

  const onDistrictChange = async (distId: string, distName: string) => {
    setFormData((prev) => ({ ...prev, districtId: distId, villageId: "", district: distName, village: "" }));
    if (!distId) {
      setRegions((prev) => ({ ...prev, villages: [] }));
      return;
    }
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${distId}.json`);
      const data = await res.json();
      setRegions((prev) => ({ ...prev, villages: data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      fetchProvinces();
      setShowGenderFormDropdown(false);
      setShowHalaqahFormDropdown(false);
      setShowClassFormDropdown(false);
      setShowProvinceDropdown(false);
      setShowRegencyDropdown(false);
      setShowDistrictDropdown(false);
      setShowVillageDropdown(false);
    }
  }, [showAddModal]);

  const resetForm = () => {
    setFormData({
      studentName: "",
      nis: "",
      nik: "",
      gender: "",
      classId: "",
      halaqahId: "",
      parentName: "",
      parentEmail: "",
      parentWhatsapp: "",
      fatherName: "",
      motherName: "",
      fatherPhone: "",
      motherPhone: "",
      address: "",
      rtRw: "",
      village: "",
      district: "",
      city: "",
      provinceId: "",
      regencyId: "",
      districtId: "",
      villageId: "",
    });
    setFormErrors({});
    setIsEditMode(false);
    setSelectedStudent(null);
    setShowGenderFormDropdown(false);
    setShowHalaqahFormDropdown(false);
    setShowClassFormDropdown(false);
    setShowProvinceDropdown(false);
    setShowRegencyDropdown(false);
    setShowDistrictDropdown(false);
    setShowVillageDropdown(false);
  };

  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        studentName: selectedStudent.full_name,
        nis: selectedStudent.nis || "",
        nik: selectedStudent.nik || "",
        gender: selectedStudent.gender || "",
        classId: selectedStudent.class_id || "",
        halaqahId: selectedStudent.halaqah_id || "",
        parentName: selectedStudent.parent_name || "",
        parentEmail: selectedStudent.parent_email || "",
        parentWhatsapp: selectedStudent.parent_whatsapp || "",
        fatherName: selectedStudent.father_name || "",
        motherName: selectedStudent.mother_name || "",
        fatherPhone: selectedStudent.father_phone || "",
        motherPhone: selectedStudent.mother_phone || "",
        address: selectedStudent.address || "",
        rtRw: selectedStudent.rt_rw || "",
        village: selectedStudent.village || "",
        district: selectedStudent.district || "",
        city: selectedStudent.city || "",
        provinceId: "",
        regencyId: "",
        districtId: "",
        villageId: "",
      });
    } else {
      resetForm();
    }
  }, [selectedStudent]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [infoStudent, setInfoStudent] = useState<StudentRekap | null>(null);

  const InfoModal = ({ student, onClose }: { student: StudentRekap; onClose: () => void }) => {
    return (
      <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-150 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-800" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-none w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">Informasi Detail</h3>
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Kontak Santri / Wali</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2.5 overflow-y-auto custom-scrollbar">
            {/* Section 1: Data Utama - Compact Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Nama</p>
                  <div className="relative group/name">
                    <p className="text-[11px] font-black text-slate-800 leading-none truncate cursor-help">{student.full_name || "-"}</p>
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover/name:block z-10000 w-max max-50 bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      {student.full_name}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                  <Fingerprint className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NIS</p>
                  <p className="text-[11px] font-mono font-black text-slate-800 leading-none truncate uppercase tracking-tighter">{student.nis || "-"}</p>
                </div>
              </div>
            </div>

            {/* NIK */}
            <div className="p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                <Fingerprint className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NIK</p>
                <p className="text-[11px] font-mono font-black text-slate-800 leading-none truncate tracking-tighter">{student.nik || "-"}</p>
              </div>
            </div>

            {/* Section 2: Orang Tua */}
            <div className="grid grid-cols-1 gap-2">
              {/* BAPAK BOX */}
              <div className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Bapak</p>
                    <div className="relative group/bapak">
                      <p className="text-[11px] font-bold text-slate-800 leading-none truncate cursor-help">{student.father_name || "-"}</p>
                      <div className="absolute left-0 bottom-full mb-1 hidden group-hover/bapak:block z-10000 w-max max-50 bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                        {student.father_name}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                  <MessageCircle className="w-2.5 h-2.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-700 font-mono tracking-tighter">{student.father_phone || "-"}</span>
                </div>
              </div>

              {/* IBU BOX */}
              <div className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Ibu</p>
                    <div className="relative group/ibu">
                      <p className="text-[11px] font-bold text-slate-800 leading-none truncate cursor-help">{student.mother_name || "-"}</p>
                      <div className="absolute left-0 bottom-full mb-1 hidden group-hover/ibu:block z-10000 w-max max-50 bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                        {student.mother_name}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                  <MessageCircle className="w-2.5 h-2.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-700 font-mono tracking-tighter">{student.mother_phone || "-"}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Alamat */}
            <div className="flex items-start gap-3 p-3 bg-slate-50/30 rounded-xl border-2 border-slate-100 min-17.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                <Home className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Alamat Lengkap</p>
                <p className="text-[10px] font-bold text-slate-600 leading-normal wrap-wrap-break-words uppercase">
                  {[
                    student.address,
                    student.rt_rw && student.rt_rw !== "-" ? (student.rt_rw.includes("/") ? `RT ${student.rt_rw.split("/")[0].trim()} / RW ${student.rt_rw.split("/")[1].trim()}` : `RT/RW ${student.rt_rw}`) : "",
                    student.village && student.village !== "-" ? `Kel. ${student.village}` : "",
                    student.district && student.district !== "-" ? `Kec. ${student.district}` : "",
                    student.city,
                    student.province,
                  ]
                    .filter((val) => val && val !== "-")
                    .join(", ") || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [halaqahToDelete, setHalaqahToDelete] = useState<Halaqah | null>(null);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);

  // --- Halaqah Management State ---
  const [isHalaqahFormOpen, setIsHalaqahFormOpen] = useState(false);
  const [isHalaqahDetailOpen, setIsHalaqahDetailOpen] = useState(false);
  const [selectedHalaqahData, setSelectedHalaqahData] = useState<Halaqah | null>(null);

  const availableTeachersForModal = useMemo(() => {
    const assignedTeacherIds = new Set(halaqahs.map((h) => h.teacher_id).filter(Boolean));
    if (selectedHalaqahData) {
      const unassignedTeachers = teachers.filter((t) => !assignedTeacherIds.has(t.id));
      const currentTeacher = teachers.find((t) => t.id === selectedHalaqahData.teacher_id);
      if (currentTeacher && !unassignedTeachers.some((t) => t.id === currentTeacher.id)) {
        return [...unassignedTeachers, currentTeacher];
      }
      return unassignedTeachers;
    }
    return teachers.filter((t) => !assignedTeacherIds.has(t.id));
  }, [halaqahs, teachers, selectedHalaqahData]);

  const handleCreateOrUpdateHalaqah = async (data: { name: string; teacher_id: string }) => {
    setLoading(true);
    try {
      const payload = { ...data, teacher_id: data.teacher_id || null } as any;
      if (selectedHalaqahData) {
        await updateHalaqah(selectedHalaqahData.id, payload, currentUser);
        addNotification({ type: "success", title: "Berhasil", message: `Halaqah diperbarui.` });
      } else {
        await createHalaqah({ ...payload, tenant_id: tenantId }, currentUser);
        addNotification({ type: "success", title: "Berhasil", message: `Halaqah baru dibuat.` });
      }
      await fetchData();
      setIsHalaqahFormOpen(false);
      setSelectedHalaqahData(null);
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Gagal menyimpan halaqah." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHalaqahConfirm = async () => {
    if (!halaqahToDelete) return;
    setLoading(true);
    try {
      await deleteHalaqah(halaqahToDelete.id, halaqahToDelete.name, currentUser);
      addNotification({ type: "success", title: "Berhasil", message: "Halaqah dihapus." });
      await fetchData();
    } catch (error: any) {
      addNotification({ type: "error", title: "Gagal", message: error.message || "Gagal menghapus." });
    } finally {
      setLoading(false);
      setHalaqahToDelete(null);
    }
  };

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    const startTime = Date.now();
    try {
      const [usersData, studentsData, halaqahData, classData] = await Promise.all([getUsers(tenantId), getStudents(tenantId), getHalaqahs(tenantId), getClasses(tenantId)]);

      const sortedClasses = [...classData].sort((a, b) => {
        const aMatch = a.name.toUpperCase().match(/^(\d+)(.*)$/);
        const bMatch = b.name.toUpperCase().match(/^(\d+)(.*)$/);
        if (aMatch && bMatch) {
          const aNum = parseInt(aMatch[1]);
          const bNum = parseInt(bMatch[1]);
          if (aNum !== bNum) return aNum - bNum;
          return aMatch[2].localeCompare(bMatch[2]);
        }
        return a.name.localeCompare(b.name);
      });

      const enrichedHalaqahs = halaqahData.map((h) => {
        const teacher = usersData.find((u) => u.id === h.teacher_id);
        return { ...h, teacher_name: teacher?.full_name || "-" };
      });

      const hFullMap = new Map(enrichedHalaqahs.map((h) => [h.id, h]));
      const classMap = new Map(classData.map((c) => [c.id, c.name]));

      setTeachers(usersData.filter((u) => u.role === UserRole.TEACHER));
      setHalaqahs(enrichedHalaqahs);
      setClasses(sortedClasses);
      halaqahCache = enrichedHalaqahs;
      classCache = sortedClasses;

      const parentMap = new Map(usersData.map((u) => [u.id, u]));

      const joined: StudentRekap[] = studentsData.map((s) => {
        const parent = s.parent_id ? parentMap.get(s.parent_id) : null;
        const hInfo = s.halaqah_id ? hFullMap.get(s.halaqah_id) : null;
        return {
          ...s,
          parent_name: parent?.full_name || "-",
          parent_email: parent?.email || "-",
          parent_whatsapp: parent?.whatsapp_number || "-",
          halaqah_name: hInfo?.name || "-",
          halaqah_teacher_name: hInfo?.teacher_name || "-",
          class_name: s.class_id ? classMap.get(s.class_id) : "-",
        };
      });

      setRekapData(joined);
      studentCache = joined;
    } catch (error) {
      console.error("Error fetching rekap data:", error);
      if (!isBackground) addNotification({ type: "error", title: "Gagal Memuat", message: "Gagal mengambil data rekap santri." });
    } finally {
      const elapsed = Date.now() - startTime;
      if (isBackground && elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(!!studentCache);
  }, [tenantId]);

  const filteredData = useMemo(() => {
    return rekapData.filter((s) => {
      // Search logic
      const matchesSearch = !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.nis?.toLowerCase().includes(search.toLowerCase()) || s.parent_name?.toLowerCase().includes(search.toLowerCase());

      // Gender logic
      const matchesGender = filterGender === "all" || s.gender === filterGender;

      // Halaqah logic
      const matchesHalaqah = filterHalaqah === "all" || s.halaqah_id === filterHalaqah;

      return matchesSearch && matchesGender && matchesHalaqah;
    });
  }, [rekapData, search, filterGender, filterHalaqah]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterGender, filterHalaqah]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const halaqahStats = useMemo(() => {
    return halaqahs
      .map((h) => ({
        id: h.id,
        name: h.name,
        teacher_name: h.teacher_name || "-",
        count: rekapData.filter((s) => s.halaqah_id === h.id).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [rekapData, halaqahs]);

  const handleAddOrEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!formData.studentName.trim()) errors.studentName = "Nama santri wajib diisi.";
    if (!formData.gender) errors.gender = "Gender wajib dipilih.";
    if (!isEditMode) {
      if (!formData.parentEmail.trim()) errors.parentEmail = "Email wajib diisi.";
      if (!formData.parentEmail.includes("@")) errors.parentEmail = "Format email tidak valid.";
    }

    setIsSubmitting(true);

    if (formData.nis && formData.nis.trim() !== "") {
      const isNisTaken = await checkNisExistsGlobal(formData.nis, isEditMode ? selectedStudent?.id : undefined);
      if (isNisTaken) {
        errors.nis = "NIS sudah terdaftar, silakan gunakan NIS yang lain.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);

      setTimeout(() => {
        const firstErrorKey = Object.keys(errors)[0];
        const errorElement = document.getElementById(`input-${firstErrorKey}`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus({ preventScroll: true });
        }
      }, 100);

      return;
    }
    try {
      if (isEditMode && selectedStudent) {
        // EDIT MODE
        // 1. Update Student
        await updateStudent(
          {
            id: selectedStudent.id,
            full_name: formData.studentName,
            nis: formData.nis,
            nik: formData.nik,
            gender: formData.gender,
            class_id: formData.classId || undefined,
            halaqah_id: formData.halaqahId || undefined,
            father_name: formData.fatherName,
            mother_name: formData.motherName,
            father_phone: formData.fatherPhone,
            mother_phone: formData.motherPhone,
            address: formData.address,
            rt_rw: formData.rtRw,
            village: formData.village,
            district: formData.district,
            city: formData.city,
          },
          currentUser,
        );

        // 2. Update Parent (if exists)
        if (selectedStudent.parent_id) {
          await updateUser(
            {
              id: selectedStudent.parent_id,
              full_name: formData.studentName, // Use student name as fallback
              whatsapp_number: formData.parentWhatsapp,
            },
            currentUser,
          );
        }

        addNotification({
          type: "success",
          title: "Berhasil",
          message: `Data santri ${formData.studentName} berhasil diperbarui.`,
        });
      } else {
        // CREATE MODE
        // 1. Create Parent Account (User)
        // Pastikan email selalu valid: gunakan email form, NIS, atau UUID sebagai fallback
        const safeNis = formData.nis && formData.nis.trim().length > 0 ? formData.nis.trim() : null;
        const safeEmail = formData.parentEmail?.trim() || (safeNis ? `${safeNis}@qurma.com` : `santri_${Date.now()}@qurma.com`);
        const safePassword = safeNis && safeNis.length >= 6 ? safeNis : `qurma_${Date.now().toString().slice(-6)}`;

        const parentUser = await createUser(
          {
            email: safeEmail,
            password: safePassword,
            full_name: formData.studentName,
            role: UserRole.SANTRI,
            whatsapp_number: formData.parentWhatsapp,
            tenant_id: tenantId,
          },
          currentUser,
        );

        // 2. Create Student Linked to Parent
        await createStudent(
          {
            full_name: formData.studentName,
            nis: formData.nis,
            nik: formData.nik,
            gender: formData.gender,
            class_id: formData.classId || undefined,
            halaqah_id: formData.halaqahId || undefined,
            parent_id: parentUser.id,
            tenant_id: tenantId,
            father_name: formData.fatherName,
            mother_name: formData.motherName,
            father_phone: formData.fatherPhone,
            mother_phone: formData.motherPhone,
            address: formData.address,
            rt_rw: formData.rtRw,
            village: formData.village,
            district: formData.district,
            city: formData.city,
          },
          currentUser,
        );

        addNotification({
          type: "success",
          title: "Berhasil",
          message: `Santri berhasil ditambahkan. Login: ${safeEmail} / ${safePassword}`,
        });
      }

      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Add/Edit student detailed error:", error);

      const errors: Record<string, string> = {};
      const msg = error.message?.toLowerCase() || "";

      // Robust Error Detection
      if (msg.includes("already registered") || msg.includes("email already exists") || msg.includes("profiles_email_key")) {
        errors.parentEmail = "Email ini sudah terdaftar di sistem. Gunakan email lain.";
        addNotification({ type: "warning", title: "Email Duplikat", message: "Email orang tua sudah digunakan akun lain." });
      } else if (msg.includes("duplicate key") && msg.includes("nis")) {
        errors.nis = "NIS ini sudah digunakan oleh santri lain.";
        addNotification({ type: "warning", title: "NIS Duplikat", message: "Nomor Induk Santri (NIS) sudah ada di database." });
      } else if (msg.includes("row-level security") || error.code === "42501") {
        addNotification({
          type: "error",
          title: "Akses Ditolak",
          message: "Kebijakan keamanan menghalangi penyimpanan data. Mohon hubungi Superadmin.",
        });
      } else if (msg.includes("foreign key constraint")) {
        addNotification({
          type: "error",
          title: "Gagal Menghubungkan",
          message: "Data Sekolah atau Kelas yang dipilih tidak ditemukan.",
        });
      } else {
        addNotification({
          type: "error",
          title: "Sistem Sibuk",
          message: `Detail: ${error.message || "Gagal menyimpan data ke database."}`,
        });
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...errors }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatWhatsAppUrl = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "-") return "#";
    let cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) cleanNumber = "62" + cleanNumber.slice(1);
    return `https://wa.me/${cleanNumber}`;
  };

  const handleEdit = (student: StudentRekap) => {
    setIsEditMode(true);
    setSelectedStudent(student);
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteStudent(studentToDelete.id, studentToDelete.full_name, currentUser);
      // Note: For now we don't delete the parent user account automatically to prevent accidental data loss
      addNotification({ type: "success", title: "Berhasil", message: `Data santri ${studentToDelete.full_name} telah dihapus.` });
      fetchData();
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat menghapus data santri." });
    } finally {
      setIsSubmitting(false);
      setStudentToDelete(null);
    }
  };

  const handleUpdateHalaqah = async (studentId: string, halaqahId: string) => {
    setIsSubmitting(true);
    try {
      await updateStudent(
        {
          id: studentId,
          halaqah_id: halaqahId || undefined,
        },
        currentUser,
      );

      // --- OPTIMISTIC LOCAL UPDATE (No Reload) ---
      setRekapData((prev) =>
        prev.map((s) => {
          if (s.id === studentId) {
            const newH = halaqahs.find((h) => h.id === halaqahId);
            return {
              ...s,
              halaqah_id: halaqahId,
              halaqah_name: newH?.name || "-",
              // We don't have user list here to get teacher name easily,
              // but we can try to find it from another student or just keep it simple
              // Best way: halaqah data already has teacher name if we fetch correctly
              // For now, let's just trigger a background fetch after local update
            };
          }
          return s;
        }),
      );

      addNotification({ type: "success", title: "Berhasil", message: "Halaqah santri berhasil diperbarui secara instan." });
      // Fetch in background WITHOUT loading state to keep sync
      fetchData(true);
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Gagal memperbarui halaqah. Silakan coba lagi." });
    } finally {
      setIsSubmitting(false);
      setEditingHalaqahId(null);
    }
  };

  const handleUpdateClass = async (studentId: string, classId: string) => {
    setIsSubmitting(true);
    try {
      await updateStudent(
        {
          id: studentId,
          class_id: classId || undefined,
        },
        currentUser,
      );

      // --- OPTIMISTIC LOCAL UPDATE (No Reload) ---
      setRekapData((prev) =>
        prev.map((s) => {
          if (s.id === studentId) {
            const newC = classes.find((c) => c.id === classId);
            return {
              ...s,
              class_id: classId,
              class_name: newC?.name || "-",
            };
          }
          return s;
        }),
      );

      addNotification({ type: "success", title: "Berhasil", message: "Kelas santri berhasil diperbarui secara instan." });
      // Fetch in background WITHOUT loading state to keep sync
      fetchData(true);
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Gagal memperbarui kelas. Silakan coba lagi." });
    } finally {
      setIsSubmitting(false);
      setEditingClassId(null);
    }
  };

  // --- EXCEL LOGIC ---



  const downloadFullExport = async () => {
    const workbook = new ExcelJS.Workbook();

    // Define common styles
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    const yellowFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFE1" } };
    const greenFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };

    // Fetch latest teachers to populate Data Ustadz
    const latestUsers = await getUsers(tenantId);
    const teachers = latestUsers.filter((u) => u.role === UserRole.TEACHER);

    // --- CREATE SHEETS IN SPECIFIC ORDER ---
    const ws0 = workbook.addWorksheet("Data Santri");
    const wsUstadz = workbook.addWorksheet("Data Ustadz");
    const wsHalaqah = workbook.addWorksheet("Data Halaqah");
    const ws1 = workbook.addWorksheet("Roster Halaqah");
    const ws2 = workbook.addWorksheet("Rangkuman Halaqah");

    // --- SHEET 1: Data Ustadz ---
    // --- SHEET 1: Data Ustadz ---
    wsUstadz.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "NIP", key: "nip", width: 20 },
      { header: "Nama Lengkap Ustadz", key: "name", width: 35 },
      { header: "Email Akses", key: "email", width: 30 },
      { header: "No. Handphone", key: "phone", width: 20 },
    ];
    wsUstadz.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    });
    teachers.forEach((t, idx) => {
      const row = wsUstadz.addRow({
        no: idx + 1,
        nik: t.nik || "",
        nip: t.nip || "",
        name: t.full_name,
        email: { formula: `IF(C${idx + 2}<>"", C${idx + 2} & "@qurma.com", "")`, result: t.email },
        phone: t.whatsapp_number || "",
      });
      row.eachCell((cell) => {
        cell.border = borderStyle;
        cell.fill = yellowFill;
      });
    });
    for (let i = teachers.length; i < 100; i++) {
      const row = wsUstadz.addRow({
        no: i + 1,
        email: { formula: `IF(C${i + 2}<>"", C${i + 2} & "@qurma.com", "")` },
      });
      for (let col = 1; col <= 6; col++) {
        const cell = row.getCell(col);
        cell.border = borderStyle;
        cell.fill = yellowFill;
      }
    }

    // --- Calculate Unassigned Teachers for Dropdown ---
    const assignedTeacherNamesExport = new Set(halaqahs.map((h) => h.teacher_name?.toLowerCase()).filter((n) => n));
    const uniqueTeacherNamesExport = Array.from(new Set(teachers.map((t) => t.full_name)));
    const unassignedTeacherNamesExport = uniqueTeacherNamesExport.filter((n) => !assignedTeacherNamesExport.has(n.toLowerCase()));
    const unassignedTeacherFormula = `Referensi_Data!$C$2:$C$${Math.max(2, unassignedTeacherNamesExport.length + 1)}`;

    // --- SHEET 2: Data Halaqah ---
    // --- SHEET 2: Data Halaqah ---
    wsHalaqah.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "Nama Halaqah", key: "name", width: 30 },
      { header: "Nama Pengampu", key: "teacher", width: 35 },
      { header: "Cek Dobel", key: "validation", width: 15 },
    ];
    wsHalaqah.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    });

    const sortedDataHalaqahs = [...halaqahs].sort((a, b) => {
      const aHasTeacher = a.teacher_name && a.teacher_name !== "-";
      const bHasTeacher = b.teacher_name && b.teacher_name !== "-";
      if (aHasTeacher && !bHasTeacher) return -1;
      if (!aHasTeacher && bHasTeacher) return 1;
      return a.name.localeCompare(b.name);
    });

    sortedDataHalaqahs.forEach((h, idx) => {
      const row = wsHalaqah.addRow({
        no: idx + 1,
        name: h.name,
        teacher: h.teacher_name === "-" ? "" : (h.teacher_name || ""),
        validation: { formula: `IF(C${idx + 2}="", "", IF(COUNTIF($C$2:$C$101, C${idx + 2})>1, "⚠️ DOBEL", "Aman"))` },
      });
      row.eachCell((cell, colNum) => {
        cell.border = borderStyle;
        cell.fill = yellowFill;
        if (colNum === 3) {
          cell.dataValidation = { type: "list", allowBlank: true, formulae: [unassignedTeacherFormula] };
          cell.fill = greenFill;
        }
      });
    });
    for (let i = halaqahs.length; i < 100; i++) {
      const row = wsHalaqah.addRow({ no: i + 1 });
      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        cell.border = borderStyle;
        cell.fill = yellowFill;
        if (col === 3) {
          cell.dataValidation = { type: "list", allowBlank: true, formulae: [unassignedTeacherFormula] };
          cell.fill = greenFill;
        } else if (col === 4) {
          cell.value = { formula: `IF(C${row.number}="", "", IF(COUNTIF($C$2:$C$101, C${row.number})>1, "⚠️ DOBEL", "Aman"))` };
        }
      }
    }

    // --- SHEET 3: Data Santri ---
    // --- SHEET 3: Data Santri ---
    ws0.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "NIS", key: "nis", width: 15 },
      { header: "NIK", key: "nik", width: 18 },
      { header: "Nama Santri", key: "name", width: 40 },
      { header: "Jenis Kelamin (L/P)", key: "gender", width: 20 },
      { header: "Halaqah", key: "halaqah", width: 25 },
      { header: "Kelas", key: "kelas", width: 15 },
      { header: "Jumlah Juz", key: "juz", width: 15 },
      { header: "Jumlah Halaman", key: "halaman", width: 15 },
      { header: "Email Akses Santri", key: "email", width: 30 },
      { header: "Nama Ayah", key: "father", width: 25 },
      { header: "Nama Ibu", key: "mother", width: 25 },
      { header: "HP Ayah", key: "hp_father", width: 20 },
      { header: "HP Ibu", key: "hp_mother", width: 20 },
      { header: "Alamat", key: "address", width: 40 },
      { header: "RT/RW", key: "rt_rw", width: 10 },
      { header: "Kel/Desa", key: "village", width: 20 },
      { header: "Kecamatan", key: "district", width: 20 },
      { header: "Kab/Kota", key: "city", width: 20 },
    ];

    ws0.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    });

    const sortedStudents = [...filteredData].sort((a, b) => {
      const hA = halaqahs.find((h) => h.id === a.halaqah_id)?.name || "";
      const hB = halaqahs.find((h) => h.id === b.halaqah_id)?.name || "";
      const hComp = hA.localeCompare(hB);
      if (hComp !== 0) return hComp;
      return a.full_name.localeCompare(b.full_name);
    });

    sortedStudents.forEach((s, idx) => {
      const halaqahObj = halaqahs.find((h) => h.id === s.halaqah_id);
      const rowIdx = idx + 2;
      const r = ws0.addRow({
        no: idx + 1,
        nis: s.nis || "",
        nik: s.nik || "",
        name: s.full_name,
        gender: s.gender === "L" ? "Laki-laki" : "Perempuan",
        halaqah: halaqahs.find((h) => h.id === s.halaqah_id)?.name || "",
        kelas: s.class_name || "",
        juz: s.current_juz || "",
        halaman: s.current_page || "",
        email: { formula: `IF(B${idx + 2}<>"", B${idx + 2} & "@qurma.com", "")`, result: s.parent_email || "" },
        father: s.father_name || "",
        mother: s.mother_name || "",
        hp_father: s.father_phone || "",
        hp_mother: s.mother_phone || "",
        address: s.address || "",
        rt_rw: s.rt_rw || "",
        village: s.village || "",
        district: s.district || "",
        city: (s.city || "").replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, "").trim(),
      });
      r.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        if (colNumber <= 3) cell.fill = yellowFill;
      });
    });

    let startIndex = sortedStudents.length;

    if (sortedStudents.length === 0) {
      const r = ws0.addRow({
        no: 1,
        nis: "123456789",
        nik: "12345678",
        name: "Abdullah",
        gender: "L",
        halaqah: "Ustman bin Affan",
        kelas: "1",
        juz: "",
        halaman: "",
        email: "123456789@qurma.com",
        father: "Abdullah",
        mother: "Fatimah",
        hp_father: "081234567890",
        hp_mother: "081234567891",
        address: "Jl. Pal Merah Utara II No.245",
        rt_rw: "09/16",
        village: "Palmerah",
        district: "Palmerah",
        city: "Jakarta Barat",
      });
      r.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        if (colNumber <= 3) cell.fill = yellowFill;
      });
      startIndex = 1;
    }

    for (let i = startIndex; i < 100; i++) {
      const r = ws0.addRow({
        no: i + 1,
        nis: "",
        nik: "",
        name: "",
        gender: "",
        halaqah: "",
        kelas: "",
        juz: "",
        halaman: "",
        email: { formula: `IF(B${i + 2}<>"", B${i + 2} & "@qurma.com", "")` },
        father: "",
        mother: "",
        hp_father: "",
        hp_mother: "",
        address: "",
        rt_rw: "",
        village: "",
        district: "",
        city: "",
      });
      r.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        if (colNumber <= 3) cell.fill = yellowFill;
      });
    }

    // --- SHEET 4: Roster Halaqah ---
    // --- SHEET 4: Roster Halaqah ---
    ws1.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "NIS", key: "nis", width: 15 },
      { header: "Nama Santri", key: "name", width: 40 },
      { header: "Pengampu", key: "teacher", width: 25 },
      { header: "Halaqah", key: "halaqah", width: 25 },
      { header: "SyncKey", key: "sync", width: 5 },
    ];

    ws1.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center" };
      cell.border = borderStyle;
    });

    const halaqahNames = halaqahs.map((h) => h.name);
    const halaqahDropdown = `"${halaqahNames.join(",")}"`;

    // --- Referensi Data (Hidden) ---
    const wsRef = workbook.addWorksheet("Referensi_Data");
    wsRef.columns = [
      { header: "Halaqah", key: "halaqah", width: 25 },
      { header: "Pengampu", key: "teacher", width: 25 },
      { header: "Ustadz Unassigned", key: "unassigned", width: 35 },
    ];
    halaqahs.forEach((h, idx) => {
      wsRef.getCell(idx + 2, 1).value = h.name;
      wsRef.getCell(idx + 2, 2).value = h.teacher_name === "-" ? "" : (h.teacher_name || "");
    });
    unassignedTeacherNamesExport.forEach((name, idx) => {
      wsRef.getCell(idx + 2, 3).value = name;
    });
    wsRef.state = "hidden";

    // Pre-calculate SyncKey per halaqah (tracks occurrence count per halaqah name)
    const syncKeyCounters: Record<string, number> = {};
    
    let ws1StartIndex = sortedStudents.length;

    if (sortedStudents.length === 0) {
      const hName = "Ustman bin Affan";
      const rowIdx = 2;
      const syncKeyValue = `${hName}_1`;

      const r = ws1.addRow({
        no: 1,
        nis: "123456789",
        name: "Abdullah",
        halaqah: hName,
        sync: { formula: `E${rowIdx}&"_"&COUNTIF($E$2:E${rowIdx},E${rowIdx})`, result: syncKeyValue },
      });

      r.getCell(4).value = { formula: `IFERROR(VLOOKUP(E${rowIdx},'Data Halaqah'!$B$2:$C$101,2,FALSE)&"","")`, result: "Abdullah" };

      for (let c = 1; c <= 6; c++) {
        r.getCell(c).border = borderStyle;
        if (c <= 3) r.getCell(c).fill = yellowFill;
        else if (c === 5) {
          r.getCell(c).fill = greenFill;
          r.getCell(c).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [halaqahDropdown],
          };
        }
      }
      ws1StartIndex = 1;
    }

    sortedStudents.forEach((s, idx) => {
      const halaqahObj = halaqahs.find((h) => h.id === s.halaqah_id);
      const hName = halaqahObj?.name || "";
      const rowIdx = idx + 2;

      // Track occurrence count for this halaqah
      syncKeyCounters[hName] = (syncKeyCounters[hName] || 0) + 1;
      const syncKeyValue = `${hName}_${syncKeyCounters[hName]}`;

      const r = ws1.addRow({
        no: idx + 1,
        nis: s.nis || "",
        name: s.full_name,
        halaqah: hName,
        sync: { formula: `E${rowIdx}&"_"&COUNTIF($E$2:E${rowIdx},E${rowIdx})`, result: syncKeyValue },
      });

      r.getCell(4).value = { formula: `IFERROR(VLOOKUP(E${rowIdx},'Data Halaqah'!$B$2:$C$101,2,FALSE)&"","")`, result: halaqahObj?.teacher_name || "" };

      r.getCell(1).fill = yellowFill;
      r.getCell(1).border = borderStyle;
      r.getCell(2).fill = yellowFill;
      r.getCell(2).border = borderStyle;
      r.getCell(3).fill = yellowFill;
      r.getCell(3).border = borderStyle;
      r.getCell(4).border = borderStyle;
      r.getCell(5).fill = greenFill;
      r.getCell(5).border = borderStyle;
      r.getCell(5).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [halaqahDropdown],
      };
      r.getCell(6).border = borderStyle;
    });
    for (let i = ws1StartIndex; i < 100; i++) {
      const rowIdx = i + 2;
      const r = ws1.addRow({
        sync: { formula: `E${rowIdx}&"_"&COUNTIF($E$2:E${rowIdx},E${rowIdx})` },
      });
      r.getCell(4).value = { formula: `IFERROR(VLOOKUP(E${rowIdx},'Data Halaqah'!$B$2:$C$101,2,FALSE),"")` };
      r.getCell(1).fill = yellowFill;
      r.getCell(1).border = borderStyle;
      r.getCell(2).fill = yellowFill;
      r.getCell(2).border = borderStyle;
      r.getCell(3).fill = yellowFill;
      r.getCell(3).border = borderStyle;
      r.getCell(4).border = borderStyle;
      r.getCell(5).fill = greenFill;
      r.getCell(5).border = borderStyle;
      r.getCell(5).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [halaqahDropdown],
      };
      r.getCell(6).border = borderStyle;
    }
    // Hide SyncKey column (col 6)
    ws1.getColumn(6).hidden = true;

    // --- SHEET 3: Rangkuman Halaqah ---
    // --- SHEET 5: Rangkuman Halaqah ---
    const BLOCKS_PER_ROW = 3;
    const COLUMNS_PER_BLOCK = 4;
    const FIXED_SLOTS = 15;

    const sortedHalaqahs = [...halaqahs].sort((a, b) => a.name.localeCompare(b.name));

    const getExcelCol = (idx: number) => {
      let letter = "";
      while (idx >= 0) {
        letter = String.fromCharCode((idx % 26) + 65) + letter;
        idx = Math.floor(idx / 26) - 1;
      }
      return letter;
    };

    let currentBaseRow = 1;
    for (let i = 0; i < sortedHalaqahs.length; i += BLOCKS_PER_ROW) {
      const rowHalaqahs = sortedHalaqahs.slice(i, i + BLOCKS_PER_ROW);

      // Row 0: Labels (Halaqah)
      rowHalaqahs.forEach((h, idx) => {
        const colStart = idx * COLUMNS_PER_BLOCK;
        const c1 = ws2.getCell(currentBaseRow, colStart + 1);
        c1.value = "";
        c1.font = { bold: true };
        c1.border = borderStyle;
        const c2 = ws2.getCell(currentBaseRow, colStart + 2);
        c2.value = "Halaqah :";
        c2.font = { bold: true };
        c2.border = borderStyle;
        const c3 = ws2.getCell(currentBaseRow, colStart + 3);
        c3.value = h.name;
        c3.fill = greenFill;
        c3.border = borderStyle;
        c3.font = { bold: true };
      });

      // Row 1: Labels (Pengampu)
      rowHalaqahs.forEach((h, idx) => {
        const colStart = idx * COLUMNS_PER_BLOCK;
        const c1 = ws2.getCell(currentBaseRow + 1, colStart + 1);
        c1.value = "";
        c1.border = borderStyle;
        const c2 = ws2.getCell(currentBaseRow + 1, colStart + 2);
        c2.value = "Pengampu :";
        c2.font = { bold: true };
        c2.border = borderStyle;
        const c3 = ws2.getCell(currentBaseRow + 1, colStart + 3);
        const hNameEscaped = h.name.replace(/"/g, '""');
        c3.value = {
          formula: `IFERROR(VLOOKUP("${hNameEscaped}", 'Data Halaqah'!$B$2:$C$101, 2, FALSE), "")`,
          result: h.teacher_name || "",
        };
        c3.fill = greenFill;
        c3.font = { bold: true };
        c3.border = borderStyle;
      });

      // Row 2: Headers
      rowHalaqahs.forEach((h, idx) => {
        const colStart = idx * COLUMNS_PER_BLOCK;
        ["No.", "NIS", "Nama Santri"].forEach((text, tIdx) => {
          const c = ws2.getCell(currentBaseRow + 2, colStart + 1 + tIdx);
          c.value = text;
          c.fill = headerFill;
          c.font = { color: { argb: "FFFFFFFF" }, bold: true };
          c.border = borderStyle;
          c.alignment = { horizontal: "center" };
        });
      });

      // Student Rows (15 Slots)
      for (let r = 0; r < FIXED_SLOTS; r++) {
        const excelRowIdx = currentBaseRow + 3 + r;
        rowHalaqahs.forEach((h, idx) => {
          const colStart = idx * COLUMNS_PER_BLOCK;
          const hNameEscaped = h.name.replace(/"/g, '""');
          const targetKey = `"${hNameEscaped}_${r + 1}"`;

          const hStudents = sortedStudents.filter((s) => s.halaqah_id === h.id);
          const s = hStudents[r];

          // NIS is col colStart+2, so use that letter for the IF formula
          const nisColLetter = getExcelCol(colStart + 1); // col B in each block (0-indexed: colStart+1)
          const cellNo = ws2.getCell(excelRowIdx, colStart + 1);
          cellNo.value = { formula: `IF(${getExcelCol(colStart + 1)}${excelRowIdx}="", "", ${r + 1})`, result: s ? r + 1 : undefined };
          cellNo.border = borderStyle;

          const cellNis = ws2.getCell(excelRowIdx, colStart + 2);
          cellNis.value = {
            formula: `IFERROR(INDEX('Roster Halaqah'!$B:$B, MATCH(${targetKey}, 'Roster Halaqah'!$H:$H, 0)), "")`,
            result: s ? s.nis || "" : undefined,
          };
          cellNis.border = borderStyle;

          const cellName = ws2.getCell(excelRowIdx, colStart + 3);
          cellName.value = {
            formula: `IFERROR(INDEX('Roster Halaqah'!$C:$C, MATCH(${targetKey}, 'Roster Halaqah'!$H:$H, 0)), "")`,
            result: s ? s.full_name : undefined,
          };
          cellName.border = borderStyle;
        });
      }
      currentBaseRow += FIXED_SLOTS + 5;
    }

    // Set column widths for WS2
    for (let j = 1; j <= BLOCKS_PER_ROW * COLUMNS_PER_BLOCK; j++) {
      const mod = (j - 1) % COLUMNS_PER_BLOCK;
      if (mod === 0) ws2.getColumn(j).width = 6;
      else if (mod === 1) ws2.getColumn(j).width = 15;
      else if (mod === 2) ws2.getColumn(j).width = 40;
      else ws2.getColumn(j).width = 4;
    }

    // Generate and Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileName = `Data_Santri_${new Date().toISOString().split("T")[0]}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);

    addNotification({ type: "success", title: "Export Berhasil", message: "Data santri dengan style premium telah siap." });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowImportModal(true);
    setImportProgress({ current: 0, total: 0, errors: [], summary: [] });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        let wsname: string | undefined = wb.SheetNames.find((n) => n === "Data Santri");
        if (!wsname) wsname = wb.SheetNames.find((n) => n.includes("Santri"));
        if (!wsname) wsname = wb.SheetNames[wb.SheetNames.length - 1]; // Fallback
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];
        // Filter only rows that have a student name (ignore reference columns)
        const data = rawData.filter((row) => {
          const name = row["Nama Lengkap Santri"] || row["Nama Santri"];
          return name && name.toString().trim() !== "";
        });

        // --- Tracking Metrics ---
        let newTeachersCount = 0;
        let newHalaqahsCount = 0;
        let newStudentsCount = 0;
        let transferredStudents: string[] = [];

        // --- PHASE 1: Import Ustadz ---
        let latestUsers = await getUsers(tenantId);
        let userMap = new Map(latestUsers.map((u) => [u.email.toLowerCase(), u.id]));
        let nipSet = new Set(latestUsers.filter((u) => u.nip).map((u) => u.nip!.toLowerCase()));

        if (wb.SheetNames.includes("Data Ustadz")) {
          const wsUstadz = wb.Sheets["Data Ustadz"];
          const ustadzData = XLSX.utils.sheet_to_json(wsUstadz) as any[];
          for (let i = 0; i < ustadzData.length; i++) {
            const row = ustadzData[i];
            const nik = row["NIK"]?.toString().trim() || "";
            const nip = row["NIP"]?.toString().trim() || "";
            const name = (row["Nama Lengkap Ustadz"] || row["Nama Ustadz"])?.toString().trim();
            let email = (row["Email Akses"] || row["Email"])?.toString().trim().toLowerCase();
            const phone = (row["No. Handphone"] || row["No. HP (Opsional)"] || row["No. HP"])?.toString().trim() || "-";

            if (!email && nip) {
              email = `${nip}@qurma.com`.toLowerCase();
            }
            if (!email && name) {
              const cleanName = name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
              email = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}@qurma.com`;
            }

            if (!name || name.includes("(CONTOH)") || !email) continue;

            if (nip && nipSet.has(nip.toLowerCase()) && !userMap.has(email)) {
              setImportProgress((prev) => ({
                ...prev,
                errors: [...prev.errors, `Gagal import Ustadz ${name}: NIP ${nip} sudah digunakan oleh Ustadz lain.`],
              }));
              continue;
            }

            if (!userMap.has(email)) {
              try {
                await new Promise((res) => setTimeout(res, 300));
                const newUser = await createUser(
                  {
                    email: email,
                    password: nip ? nip : "guru" + email.split("@")[0].substring(0, 4) + "123",
                    full_name: name,
                    role: UserRole.TEACHER,
                    whatsapp_number: phone,
                    nip: nip,
                    nik: nik,
                    tenant_id: tenantId,
                  },
                  currentUser,
                );
                userMap.set(email, newUser.id);
                if (nip) nipSet.add(nip.toLowerCase());
                newTeachersCount++;
              } catch (err: any) {
                console.error("Gagal membuat Ustadz", name, err);
              }
            } else {
              // Ustadz sudah ada — cek apakah NIK atau NIP berbeda, update jika perlu
              const existingTeacher = latestUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
              if (existingTeacher) {
                const isNikChanged = nik && nik !== "-" && nik !== (existingTeacher.nik || "").trim();
                const isNipChanged = nip && nip !== "-" && nip !== (existingTeacher.nip || "").trim();
                if (isNikChanged || isNipChanged) {
                  try {
                    await new Promise((res) => setTimeout(res, 300));
                    await updateUser(
                      {
                        id: existingTeacher.id,
                        ...(isNikChanged ? { nik } : {}),
                        ...(isNipChanged ? { nip } : {}),
                      },
                      currentUser,
                    );
                    if (isNikChanged) transferredStudents.push(`Ustadz ${name}: NIK diupdate → ${nik}`);
                    if (isNipChanged) transferredStudents.push(`Ustadz ${name}: NIP diupdate → ${nip}`);
                  } catch (err: any) {
                    console.error("Gagal update NIK/NIP Ustadz", name, err);
                  }
                }
              }
            }
          }
          latestUsers = await getUsers(tenantId);
        }

        // --- PHASE 2: Import Halaqah ---
        let currentHalaqahs = await getHalaqahs(tenantId);
        let halaqahMap = new Map(currentHalaqahs.map((h) => [h.name.toLowerCase().trim(), h.id]));

        if (wb.SheetNames.includes("Data Halaqah")) {
          const wsHalaqah = wb.Sheets["Data Halaqah"];
          const halaqahData = XLSX.utils.sheet_to_json(wsHalaqah) as any[];
          for (let i = 0; i < halaqahData.length; i++) {
            const row = halaqahData[i];
            const hName = row["Nama Halaqah"]?.toString().trim();
            const teacherName = row["Nama Pengampu"]?.toString().trim();

            if (!hName || hName.includes("(CONTOH)")) continue;

            if (!halaqahMap.has(hName.toLowerCase())) {
              try {
                let teacherId: string | undefined = undefined;
                if (teacherName && teacherName !== "-") {
                  const teacher = latestUsers.find((u) => u.role === UserRole.TEACHER && u.full_name.toLowerCase() === teacherName.toLowerCase());
                  if (teacher) teacherId = teacher.id;
                }

                await new Promise((res) => setTimeout(res, 300));
                const newHalaqah = await createHalaqah(
                  {
                    name: hName,
                    teacher_id: teacherId,
                    tenant_id: tenantId,
                  },
                  currentUser,
                );
                halaqahMap.set(hName.toLowerCase(), newHalaqah.id);
                newHalaqahsCount++;
              } catch (err: any) {
                console.error("Gagal membuat Halaqah", hName, err);
              }
            } else {
              try {
                const existingHalaqahId = halaqahMap.get(hName.toLowerCase());
                const existingHalaqah = currentHalaqahs.find((h) => h.id === existingHalaqahId);

                let excelTeacherId: string | undefined = undefined;
                if (teacherName && teacherName !== "-") {
                  const teacher = latestUsers.find((u) => u.role === UserRole.TEACHER && u.full_name.toLowerCase() === teacherName.toLowerCase());
                  if (teacher) excelTeacherId = teacher.id;
                }

                if (existingHalaqah && existingHalaqahId && existingHalaqah.teacher_id !== excelTeacherId) {
                  await new Promise((res) => setTimeout(res, 300));
                  await updateHalaqah(
                    existingHalaqahId,
                    {
                      name: hName,
                      teacher_id: excelTeacherId,
                      tenant_id: tenantId,
                    },
                    currentUser,
                  );
                }
              } catch (err: any) {
                console.error("Gagal mengupdate Halaqah", hName, err);
              }
            }
          }
        }

        // Try to read "Roster Halaqah" sheet to map NIS -> Halaqah if it exists
        const nisToHalaqahMap = new Map<string, { halaqah: string }>();
        if (wb.SheetNames.includes("Roster Halaqah")) {
          const wsRoster = wb.Sheets["Roster Halaqah"];
          const rosterData = XLSX.utils.sheet_to_json(wsRoster) as any[];
          rosterData.forEach((row) => {
            const rowNis = String(row["NIS"] || "").trim();
            const rowHalaqahName = String(row["Halaqah"] || "").trim();
            if (rowNis) {
              nisToHalaqahMap.set(rowNis, { halaqah: rowHalaqahName });
            }
          });
        }

        if (data.length === 0) {
          setImportProgress((prev) => ({ ...prev, errors: ["File Excel kosong atau tidak ditemukan data santri yang valid."] }));
          return;
        }

        setImportProgress((prev) => ({ ...prev, total: data.length }));

        const existingNis = new Set(rekapData.filter((s) => s.nis).map((s) => String(s.nis).trim()));
        const seenNisInExcel = new Set<string>();

        const classMap = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));

        const errors: string[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const studentName = (row["Nama Lengkap Santri"] || row["Nama Santri"])?.toString().trim();
          const nis = String(row["NIS"] || "").trim();
          const parentEmail = (row["Email Akses"] || row["Email Akses Santri"])?.toString().trim().toLowerCase() || (nis ? `${nis}@qurma.com`.toLowerCase() : "");
          const fatherName = row["Nama Ayah"]?.toString().trim();
          const motherName = row["Nama Ibu"]?.toString().trim();

          // Skip empty rows or reference rows
          if (!studentName) continue;

          if (!nis) {
            errors.push(`Baris ${i + 2} (${studentName}): NIS wajib diisi.`);
            setImportProgress((prev) => ({ ...prev, current: i + 1, errors: [...errors] }));
            continue;
          }

          // Check for duplicate NIS in current Excel
          if (seenNisInExcel.has(nis)) {
            errors.push(`Baris ${i + 2} (${studentName}): NIS "${nis}" muncul ganda di file Excel.`);
            setImportProgress((prev) => ({ ...prev, current: i + 1, errors: [...errors] }));
            continue;
          }
          seenNisInExcel.add(nis);

          // Map Halaqah and Kelas from Excel
          const rosterData = nisToHalaqahMap.get(nis);
          const excelHalaqahName = rosterData?.halaqah || String(row["Halaqah"] || "");
          const importedHalaqahId = halaqahMap.get(excelHalaqahName.toLowerCase());
          const excelClassName = String(row["Kelas"] || "");
          const importedClassId = classMap.get(excelClassName.toLowerCase());

          // Check for duplicate NIS in system
          const existingStudent = rekapData.find((s) => String(s.nis).trim() === nis);
          if (existingStudent) {
            const excelNik = String(row["NIK"] || "").trim();
            const isHalaqahChanged = excelHalaqahName && importedHalaqahId !== undefined && existingStudent.halaqah_id !== importedHalaqahId;
            const isClassChanged = excelClassName && importedClassId !== undefined && existingStudent.class_id !== importedClassId;
            const isNameChanged = studentName && studentName.trim().toLowerCase() !== (existingStudent.full_name || "").trim().toLowerCase();
            const isNikChanged = excelNik && excelNik !== "-" && excelNik !== (existingStudent.nik || "").trim();
            
            const excelJuz = parseInt(String(row["Jumlah Juz"] || "0").trim(), 10) || 0;
            const excelHal = parseInt(String(row["Jumlah Halaman"] || "0").trim(), 10) || 0;
            
            let isJuzChanged = false;
            let isHalChanged = false;

            if (excelJuz !== (existingStudent.current_juz || 0) || excelHal !== (existingStudent.current_page || 0)) {
              const hasInitialSabaq = await checkHasInitialSabaq(existingStudent.id);
              if (!hasInitialSabaq) {
                isJuzChanged = excelJuz !== (existingStudent.current_juz || 0);
                isHalChanged = excelHal !== (existingStudent.current_page || 0);
              }
            }

            if (isHalaqahChanged || isClassChanged || isNameChanged || isNikChanged || isJuzChanged || isHalChanged) {
              try {
                // Rate limit protection
                if (i > 0) await new Promise((res) => setTimeout(res, 300));

                await updateStudent(
                  {
                    id: existingStudent.id,
                    ...(isNameChanged ? { full_name: studentName } : {}),
                    ...(isHalaqahChanged ? { halaqah_id: importedHalaqahId } : {}),
                    ...(isClassChanged ? { class_id: importedClassId } : {}),
                    ...(isNikChanged ? { nik: excelNik } : {}),
                    ...(isJuzChanged ? { current_juz: excelJuz } : {}),
                    ...(isHalChanged ? { current_page: excelHal } : {}),
                  },
                  currentUser,
                );
                if (isNameChanged) transferredStudents.push(`Santri NIS ${nis}: Nama diupdate dari "${existingStudent.full_name}" → "${studentName}"`);
                if (isHalaqahChanged) transferredStudents.push(`Santri ${studentName} pindah ke ${excelHalaqahName}`);
                if (isClassChanged) transferredStudents.push(`Santri ${studentName} kelas diupdate ke ${excelClassName}`);
                if (isNikChanged) transferredStudents.push(`Santri NIS ${nis}: NIK diupdate → ${excelNik}`);
                if (isJuzChanged) transferredStudents.push(`Santri ${studentName}: Juz awal diupdate → ${excelJuz}`);
                if (isHalChanged) transferredStudents.push(`Santri ${studentName}: Halaman awal diupdate → ${excelHal}`);
              } catch (err: any) {
                errors.push(`Baris ${i + 2} (${studentName}): Gagal update data santri.`);
              }
            }

            setImportProgress((prev) => ({ ...prev, current: i + 1, errors: [...errors] }));
            continue;
          }

          if (!parentEmail) {
            errors.push(`Baris ${i + 2} (${studentName}): Email Santri wajib diisi.`);
            setImportProgress((prev) => ({ ...prev, current: i + 1, errors: [...errors] }));
            continue;
          }

          // --- STRICT NIS-EMAIL VALIDATION ---
          const expectedEmail = `${nis}@qurma.com`.toLowerCase();
          if (parentEmail !== expectedEmail) {
            errors.push(`Baris ${i + 2} (${studentName}): Email Santri (${parentEmail}) tidak sesuai dengan format NIS (${expectedEmail}).`);
            setImportProgress((prev) => ({ ...prev, current: i + 1, errors: [...errors] }));
            continue;
          }

          try {
            // --- RATE LIMIT PROTECTION ---
            // Add a small delay between accounts to avoid Supabase Auth rate limits
            if (i > 0) await new Promise((res) => setTimeout(res, 800));

            let parentId = userMap.get(parentEmail);

            // 1. Create Parent if not exists
            if (!parentId) {
              const parentUser = await createUser(
                {
                  email: parentEmail,
                  password: String(row["NIS"] || "santri123"),
                  full_name: studentName, // Default to student name as updated in UI
                  role: UserRole.SANTRI,
                  whatsapp_number: String(row["No. HP Ayah"] || row["HP Ayah"] || row["No. HP Ibu"] || row["HP Ibu"] || "-"),
                  tenant_id: tenantId,
                },
                currentUser,
              );
              parentId = parentUser.id;
              userMap.set(parentEmail, parentId);
            }

            // 2. Map Halaqah and Kelas
            const halaqahId = halaqahMap.get(String(row["Halaqah"] || "").toLowerCase());
            const kelasId = classMap.get(String(row["Kelas"] || "").toLowerCase());

            // 3. Create Student
            const genderVal = row["Jenis Kelamin (L/P)"] || row["Jenis Kelamin"];
            await createStudent(
              {
                full_name: studentName,
                nis: String(row["NIS"] || ""),
                nik: String(row["NIK"] || ""),
                gender: genderVal === "P" || genderVal === "p" || genderVal === "Perempuan" ? "P" : "L",
                halaqah_id: halaqahId,
                class_id: kelasId,
                parent_id: parentId,
                tenant_id: tenantId,
                father_name: fatherName,
                mother_name: motherName,
                father_phone: String(row["No. HP Ayah"] || row["HP Ayah"] || ""),
                mother_phone: String(row["No. HP Ibu"] || row["HP Ibu"] || ""),
                address: String(row["Alamat Lengkap"] || row["Alamat"] || ""),
                rt_rw: String(row["RT/RW"] || ""),
                village: String(row["Kel/Desa"] || ""),
                district: String(row["Kecamatan"] || ""),
                city: String(row["Kab/Kota"] || ""),
                current_juz: parseInt(String(row["Jumlah Juz"] || "0").trim(), 10) || 0,
                current_page: parseInt(String(row["Jumlah Halaman"] || "0").trim(), 10) || 0,
              },
              currentUser,
            );

            newStudentsCount++;
          } catch (err: any) {
            let msg = err.message || "Gagal menyimpan.";
            if (msg.toLowerCase().includes("duplicate key") && msg.includes("nis")) {
              msg = "Gagal: NIS ini sudah digunakan oleh santri lain.";
            }
            errors.push(`Baris ${i + 2} (${studentName}): ${msg}`);
          }

          setImportProgress((prev) => ({ ...prev, current: i + 1, errors: [...errors] }));
        }

        const totalChanges = newTeachersCount + newHalaqahsCount + newStudentsCount + transferredStudents.length;

        let finalSummary: string[] = [];
        if (totalChanges > 0) {
          if (newStudentsCount > 0) finalSummary.push(`• ${newStudentsCount} Santri Baru.`);
          if (newTeachersCount > 0) finalSummary.push(`• ${newTeachersCount} Pengampu Baru.`);
          if (newHalaqahsCount > 0) finalSummary.push(`• ${newHalaqahsCount} Halaqah Baru.`);
          if (transferredStudents.length > 0) {
            finalSummary.push(`• Perpindahan Halaqah:`);
            transferredStudents.forEach((t) => {
              finalSummary.push(`  - ${t}`);
            });
          }
        } else if (errors.length === 0) {
          finalSummary.push("Tidak ada data yang berubah (semua data sudah tersinkronisasi).");
        }

        setImportProgress((prev) => ({ ...prev, summary: finalSummary }));

        if (totalChanges > 0) {
          addNotification({
            type: "success",
            title: "Import Selesai",
            message: "Proses import berhasil dijalankan. Silakan cek ringkasan pada panel.",
          });
          fetchData();
        } else if (errors.length > 0) {
          addNotification({
            type: "error",
            title: "Import Selesai dengan Error",
            message: "Tidak ada data baru yang berhasil ditambahkan. Silakan cek detail error.",
          });
        } else {
          addNotification({
            type: "info",
            title: "Import Selesai",
            message: "Tidak ada data yang berubah (semua data sudah tersinkronisasi).",
          });
        }
      } catch (err) {
        setImportProgress((prev) => ({ ...prev, errors: ["Gagal membaca file Excel. Pastikan format benar."] }));
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
        <div className="flex items-start justify-between px-1 mb-2">
          <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Daftar Halaqah</h3>
          {!isReadOnly && (
            <button
              onClick={() => {
                setSelectedHalaqahData(null);
                setIsHalaqahFormOpen(true);
              }}
              className="h-10 flex items-center gap-2 px-4 font-black text-[10px] uppercase tracking-widest bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all active:scale-95 whitespace-nowrap"
            >
              Tambah Halaqah
            </button>
          )}
        </div>
        <div className="relative group/scroll">
          {!loading && halaqahs.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 snap-x snap-mandatory no-scrollbar scroll-smooth">
              {/* TOP TOTAL CARD */}
              <div
                className={`w-35 md:w-37.5 h-30.5 md:h-30 flex-none p-3 md:p-4 rounded-xl border-2 transition-all group overflow-hidden relative cursor-pointer snap-start flex flex-col justify-between ${filterHalaqah === "all" ? "bg-emerald-600 border-emerald-600 shadow-none scale-[1.02]" : "bg-white border-slate-300 shadow-none hover:border-emerald-400"}`}
                onClick={() => setFilterHalaqah("all")}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${filterHalaqah === "all" ? "bg-white/10" : "bg-slate-50"}`}></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-none ${filterHalaqah === "all" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"}`}>
                      <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <span className={`text-[13px] md:text-[15px] font-black tracking-tight ${filterHalaqah === "all" ? "text-white" : "text-emerald-600"}`}>{rekapData.length}</span>
                  </div>
                  <div className="flex flex-col justify-end h-full">
                    <h4 className={`text-[9px] md:text-[10px] font-black uppercase tracking-tighter truncate leading-tight ${filterHalaqah === "all" ? "text-white" : "text-slate-800"}`}>TOTAL SANTRI</h4>
                    <p className={`text-[7px] md:text-[8px] font-bold mt-0.5 md:mt-1 uppercase tracking-widest truncate ${filterHalaqah === "all" ? "text-white/70" : "text-slate-400"}`}>Seluruh Halaqah</p>
                  </div>
                </div>
              </div>

              {halaqahStats.map((stat) => (
                <div
                  key={stat.id}
                  className={`w-35 md:w-37.5 h-30.5 md:h-30 flex-none p-3 md:p-4 rounded-xl border-2 transition-all group overflow-hidden relative cursor-pointer snap-start flex flex-col justify-between ${filterHalaqah === stat.id ? "bg-jade-600 border-jade-600 shadow-none scale-[1.02]" : "bg-white border-slate-300 shadow-none hover:border-jade-400"}`}
                  onClick={() => setFilterHalaqah((prev) => (prev === stat.id ? "all" : stat.id))}
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${filterHalaqah === stat.id ? "bg-white/10" : "bg-slate-50"}`}></div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-none ${filterHalaqah === stat.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400"}`}>
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </div>
                      <span className={`text-[13px] md:text-[15px] font-black tracking-tight ${filterHalaqah === stat.id ? "text-white" : "text-jade-600"}`}>{stat.count}</span>
                    </div>
                    <div className="flex flex-col h-full justify-end relative">
                      <h4 className={`text-[9px] md:text-[10px] font-black uppercase tracking-tighter truncate leading-tight ${filterHalaqah === stat.id ? "text-white" : "text-slate-800"}`} title={stat.name}>
                        {stat.name}
                      </h4>
                      <p className={`text-[7px] md:text-[8px] font-bold mt-0.5 md:mt-1 uppercase tracking-widest truncate ${filterHalaqah === stat.id ? "text-white/70" : "text-slate-400"}`}>{stat.teacher_name}</p>

                      {!isReadOnly && (
                        <div className="flex justify-end items-center gap-1 md:gap-1.5 mt-1 md:mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHalaqahData(halaqahs.find((h) => h.id === stat.id) || null);
                              setIsHalaqahDetailOpen(true);
                            }}
                            className={`p-0.5 md:p-1 rounded-md border shadow-sm ${filterHalaqah === stat.id ? "bg-jade-500 border-jade-400 text-white hover:bg-jade-400" : "bg-white border-slate-200 text-slate-500 hover:text-jade-600 hover:border-jade-300"}`}
                            title="Detail Santri"
                          >
                            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHalaqahData(halaqahs.find((h) => h.id === stat.id) || null);
                              setIsHalaqahFormOpen(true);
                            }}
                            className={`p-0.5 md:p-1 rounded-md border shadow-sm ${filterHalaqah === stat.id ? "bg-jade-500 border-jade-400 text-white hover:bg-jade-400" : "bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300"}`}
                            title="Edit Halaqah"
                          >
                            <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHalaqahToDelete(halaqahs.find((h) => h.id === stat.id) || null);
                            }}
                            className={`p-0.5 md:p-1 rounded-md border shadow-sm ${filterHalaqah === stat.id ? "bg-jade-500 border-jade-400 text-white hover:bg-rose-400" : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300"}`}
                            title="Hapus Halaqah"
                          >
                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INDICATOR FOR MORE (Visible if more than few halaqahs) */}
          {!loading && halaqahs.length > 3 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-full bg-linear-to-l from-slate-50/50 to-transparent pointer-events-none flex items-center justify-end pr-1 opacity-0 group-hover/scroll:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4 text-slate-300 animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center w-full gap-1.5 md:gap-2 bg-white shrink-0 z-70 sticky top-0 border-b border-slate-100">
          {/* SEARCH */}
          <div className="relative group h-10 w-full xl:flex-1 xl:min-w-50">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-jade-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIS atau Nama Santri..."
              className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-500 transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
            />
          </div>

          {/* FILTERS & REFRESH */}
          <div className="flex items-center gap-2 w-full xl:w-auto flex-none">
            <div className="flex items-center gap-2 flex-1 xl:flex-none">
              <div
                className="relative h-10 flex-1 xl:flex-none flex items-center bg-white border-2 border-slate-300 rounded-xl shadow-none px-3 xl:w-28 cursor-pointer focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/gender"
                onClick={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 pointer-events-none truncate pr-4">{filterGender === "all" ? "GENDER" : filterGender === "L" ? "PUTRA" : "PUTRI"}</span>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/gender:text-jade-500 transition-all ${showGenderDropdown ? "rotate-180 text-jade-500" : ""}`} />
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
                          className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${filterGender === opt.value ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterGender(opt.value);
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

              <div
                className="relative h-10 flex-1 xl:flex-none flex items-center bg-white border-2 border-slate-300 rounded-xl shadow-none px-3 xl:w-36 cursor-pointer focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50/50 transition-all group/halaqah"
                onClick={() => setShowHalaqahDropdown(!showHalaqahDropdown)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 pointer-events-none truncate pr-4">
                    {filterHalaqah === "all" ? "Pilih Halaqah" : halaqahs.find((h) => h.id === filterHalaqah)?.name.toUpperCase() || "Pilih Halaqah"}
                  </span>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/halaqah:text-jade-500 transition-all ${showHalaqahDropdown ? "rotate-180 text-jade-500" : ""}`} />
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
                    <div className="absolute top-[calc(100%+4px)] -left-4.5 -right-4.5 bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                      <div
                        className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${filterHalaqah === "all" ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterHalaqah("all");
                          setShowHalaqahDropdown(false);
                        }}
                      >
                        PILIH HALAQAH
                      </div>
                      {halaqahs.map((h) => (
                        <div
                          key={h.id}
                          className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${filterHalaqah === h.id ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterHalaqah(h.id);
                            setShowHalaqahDropdown(false);
                          }}
                        >
                          {h.name.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={loading || isRefreshing}
              className={`h-10 w-10 flex-none flex items-center justify-center border-2 bg-white rounded-xl shadow-none transition-all duration-300 ${loading || isRefreshing ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-slate-300 text-slate-400 hover:text-jade-600 hover:border-jade-300 active:scale-95"}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${loading || isRefreshing ? "animate-spin" : ""}`} />
            </button>
            {!isReadOnly && (
              <button
                onClick={() => setShowNisMobile(!showNisMobile)}
                className={`xl:hidden h-10 w-10 flex-none flex items-center justify-center border-2 transition-all rounded-xl shadow-none ${showNisMobile ? "bg-jade-600 border-jade-600 text-white" : "bg-white border-slate-300 text-slate-400"}`}
              >
                {showNisMobile ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* ACTIONS */}
          {!isReadOnly && (
            <div className="flex flex-row items-center gap-2 flex-wrap sm:flex-nowrap xl:flex-none w-full xl:w-auto mt-2 xl:mt-0">
              <div className="flex items-center gap-2 flex-none justify-center">
                {rekapData.length === 0 && (
                  <button onClick={downloadFullExport} className="h-10 w-10 flex items-center justify-center border-2 border-slate-300 bg-white text-slate-400 hover:text-jade-600 rounded-xl shadow-none" title="Template">
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 flex items-center justify-center border-2 border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl shadow-none"
                  title="Import"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={downloadFullExport} className="h-10 w-10 flex items-center justify-center border-2 border-slate-300 bg-white text-slate-400 hover:text-jade-600 rounded-xl shadow-none" title="Export">
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:flex-none xl:flex-none">
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="h-10 flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 font-black text-[10px] uppercase tracking-widest bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all active:scale-95 whitespace-nowrap"
                >
                  <span>TAMBAH SANTRI</span>
                </button>
                <button
                  onClick={() => setIsGlobalTrackingOpen(true)}
                  className="h-10 flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 font-black text-[10px] uppercase tracking-widest bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all active:scale-95 whitespace-nowrap"
                >
                  <span>TRACKING</span>
                </button>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
        </div>

        <div className="bg-white rounded-b-xl shadow-none border-2 border-slate-300 flex flex-col overflow-hidden">
          <div className="relative z-20 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-40 bg-white">
                <tr>
                  <th className="hidden md:table-cell px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-black sticky left-0 z-60 bg-slate-300 w-10 md:w-12 min-w-10 md:min-w-12">
                    NO
                  </th>
                  <th
                    className={`px-1 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-black sticky left-0 md:left-12 z-60 bg-slate-300 w-20 md:w-22 min-w-20 md:min-w-22 ${!showNisMobile ? "hidden md:table-cell" : ""}`}
                  >
                    NIS
                  </th>
                  <th
                    className={`px-2 md:px-3 py-4 text-left text-[9.5px] whitespace-normal wrap-break-words leading-tight font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-l border-black sticky z-60 bg-slate-300 w-24 md:w-44 min-w-24 md:min-w-44 max-w-24 md:max-w-none ${!showNisMobile ? "left-0 md:left-34" : "left-20 md:left-34"}`}
                  >
                    NAMA SANTRI
                  </th>
                  <th className="px-2 py-4 text-center text-[9.5px] whitespace-nowrap font-black text-amber-600 uppercase tracking-widest border-t border-b border-r border-amber-600 bg-amber-50 w-28 min-w-28 max-w-28">GENDER</th>
                  <th className="px-3 py-4 text-left text-[9.5px] font-black text-emerald-600 uppercase tracking-widest border-t border-b border-r border-emerald-600 bg-emerald-50 w-24 min-w-24 max-w-24">PENGAMPU</th>
                  <th className="px-3 py-4 text-left text-[9.5px] font-black text-blue-600 uppercase tracking-widest border-t border-b border-r border-blue-600 bg-blue-50 w-28 min-w-28 max-w-28">HALAQAH</th>
                  <th className="px-3 py-4 text-center text-[9.5px] font-black text-rose-600 uppercase tracking-widest border-t border-b border-r border-rose-600 bg-rose-50 w-16 min-w-16 max-w-16">KELAS</th>
                  <th className={`px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-black bg-slate-300 ${isReadOnly ? "w-28" : "w-52.5 md:w-57.5"}`}>AKSI</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="hidden md:table-cell sticky left-0 z-10 bg-white border-r-2 border-b border-slate-100 w-10 md:w-12 min-w-10 md:min-w-12">
                          <Skeleton className="h-4 w-4 mx-auto" />
                        </td>
                        <td className={`sticky left-0 md:left-12 z-10 bg-white border-r-2 border-b border-slate-100 w-20 md:w-22 min-w-20 md:min-w-22 ${!showNisMobile ? "hidden md:table-cell" : ""}`}>
                          <Skeleton className="h-4 w-10 mx-auto" />
                        </td>
                        <td className={`sticky z-10 bg-white border-r-2 border-b border-slate-100 w-24 md:w-44 min-w-24 md:min-w-44 max-w-24 md:max-w-none ${!showNisMobile ? "left-0 md:left-34" : "left-20 md:left-34"}`}>
                          <Skeleton className="h-4 w-24" />
                        </td>
                        {[...Array(4)].map((_, j) => (
                          <td key={j} className="px-3 py-4 border-b border-r-2 border-slate-100">
                            <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                          </td>
                        ))}
                        <td className="px-3 py-4 border-b border-slate-100">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                        </td>
                      </tr>
                    ))
                  : paginatedData.map((s, index) => (
                      <tr key={s.id} className="group transition-colors hover:bg-slate-50/30">
                        <td className="hidden md:table-cell px-2 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 sticky left-0 z-19 bg-white transition-colors text-center w-10 md:w-12 min-w-10 md:min-w-12 uppercase font-black text-[10.5px] text-slate-400">
                          {String((currentPage - 1) * itemsPerPage + index + 1)}
                        </td>
                        <td
                          className={`px-1 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 sticky left-0 md:left-12 z-20 bg-white transition-colors text-center w-20 md:w-22 min-w-20 md:min-w-22 ${!showNisMobile ? "hidden md:table-cell" : ""}`}
                        >
                          <span className="text-[9.5px] md:text-[10.5px] font-mono font-black text-slate-700 bg-slate-50 px-1 py-0.5 rounded tracking-tighter">{s.nis || "-"}</span>
                        </td>
                        <td
                          className={`px-2 md:px-3 py-4 border-r-2 border-b border-slate-100 sticky z-20 bg-white transition-colors w-24 md:w-44 min-w-24 md:min-w-44 max-w-24 md:max-w-none ${!showNisMobile ? "left-0 md:left-34" : "left-20 md:left-34"}`}
                        >
                          <span className="text-[10.5px] md:text-[11px] font-bold text-slate-800 uppercase tracking-tight block w-full whitespace-normal wrap-break-words leading-tight md:whitespace-nowrap md:truncate" title={s.full_name}>
                            {s.full_name}
                          </span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 text-center w-28 min-w-28 max-w-28">
                          <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tight border ${s.gender === "L" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"}`}>
                            {s.gender === "L" ? "Putra" : "Putri"}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 w-24 min-w-24 max-w-24">
                          <p className="text-[10.5px] font-bold text-slate-700 truncate w-full" title={s.halaqah_teacher_name || "-"}>
                            {s.halaqah_teacher_name || "-"}
                          </p>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 w-28 min-w-28 max-w-28">
                          {editingHalaqahId === s.id ? (
                            <div className="relative z-100 w-full max-w-35">
                              <div className="relative h-7 flex items-center bg-white border border-jade-400 ring-2 ring-jade-50/50 rounded-lg shadow-none px-2 w-full cursor-pointer transition-all">
                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-800 pointer-events-none truncate pr-3 flex-1 text-left">{halaqahs.find((h) => h.id === s.halaqah_id)?.name || "PILIH HALAQAH"}</span>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-jade-500 pointer-events-none rotate-180 transition-all duration-200" />
                              </div>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isSubmitting) setEditingHalaqahId(null);
                                }}
                              />
                              <div
                                className={`absolute left-0 min-w-35 max-w-50 w-auto bg-white border border-slate-300 rounded-xl shadow-xl z-50 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in duration-200 ${dropdownPosition === "top" ? "bottom-[calc(100%+4px)] slide-in-from-bottom-2" : "top-[calc(100%+4px)] slide-in-from-top-2"}`}
                              >
                                <div
                                  className={`px-3 py-2 border-b border-slate-100 last:border-0 text-[9px] font-black tracking-tight cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!s.halaqah_id ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                                  onClick={() => handleUpdateHalaqah(s.id, "")}
                                >
                                  Pilih Halaqah
                                </div>
                                {halaqahs.map((h) => (
                                  <div
                                    key={h.id}
                                    className={`px-3 py-2 border-b border-slate-100 last:border-0 text-[9px] font-black tracking-tight cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${s.halaqah_id === h.id ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                                    onClick={() => handleUpdateHalaqah(s.id, h.id)}
                                  >
                                    {h.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p
                              onClick={(e) => {
                                if (isReadOnly) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const container = e.currentTarget.closest(".overflow-x-auto");
                                const spaceBelowWindow = window.innerHeight - rect.bottom;
                                const spaceBelowContainer = container ? container.getBoundingClientRect().bottom - rect.bottom : Infinity;
                                const spaceBelow = Math.min(spaceBelowWindow, spaceBelowContainer);

                                if (spaceBelow < 240 && rect.top > 240) {
                                  setDropdownPosition("top");
                                } else {
                                  setDropdownPosition("bottom");
                                }
                                setEditingHalaqahId(s.id);
                              }}
                              className={`text-[10.5px] font-bold text-slate-700 truncate transition-colors w-full ${isReadOnly ? "cursor-default" : "cursor-pointer hover:text-emerald-600"}`}
                              title={isReadOnly ? "" : "Klik untuk ubah halaqah cepat"}
                            >
                              {s.halaqah_name || "-"}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 w-16 min-w-16 max-w-16">
                          {editingClassId === s.id ? (
                            <div className="relative z-100 w-full max-w-35">
                              <div className="relative h-7 flex items-center bg-white border border-rose-400 ring-2 ring-rose-50/50 rounded-lg shadow-none px-2 w-full cursor-pointer transition-all">
                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-800 pointer-events-none truncate pr-3 flex-1 text-center">{classes.find((c) => c.id === s.class_id)?.name ? classes.find((c) => c.id === s.class_id)?.name : "PILIH"}</span>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-rose-500 pointer-events-none rotate-180 transition-all duration-200" />
                              </div>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isSubmitting) setEditingClassId(null);
                                }}
                              />
                              <div
                                className={`absolute left-1/2 -translate-x-1/2 min-w-35 max-w-50 w-auto bg-white border border-slate-300 rounded-xl shadow-xl z-50 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in duration-200 ${dropdownPosition === "top" ? "bottom-[calc(100%+4px)] slide-in-from-bottom-2" : "top-[calc(100%+4px)] slide-in-from-top-2"}`}
                              >
                                <div
                                  className={`px-3 py-2 border-b border-slate-100 last:border-0 text-[9px] font-black tracking-tight cursor-pointer text-center hover:bg-slate-50 transition-colors uppercase ${!s.class_id ? "text-rose-600 bg-rose-50" : "text-slate-600"}`}
                                  onClick={() => handleUpdateClass(s.id, "")}
                                >
                                  Pilih
                                </div>
                                {classes.map((c) => (
                                  <div
                                    key={c.id}
                                    className={`px-3 py-2 border-b border-slate-100 last:border-0 text-[9px] font-black tracking-tight cursor-pointer text-center hover:bg-slate-50 transition-colors uppercase ${s.class_id === c.id ? "text-rose-600 bg-rose-50" : "text-slate-600"}`}
                                    onClick={() => handleUpdateClass(s.id, c.id)}
                                  >
                                    {c.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p
                              onClick={(e) => {
                                if (isReadOnly) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const container = e.currentTarget.closest(".overflow-x-auto");
                                const spaceBelowWindow = window.innerHeight - rect.bottom;
                                const spaceBelowContainer = container ? container.getBoundingClientRect().bottom - rect.bottom : Infinity;
                                const spaceBelow = Math.min(spaceBelowWindow, spaceBelowContainer);

                                if (spaceBelow < 240 && rect.top > 240) {
                                  setDropdownPosition("top");
                                } else {
                                  setDropdownPosition("bottom");
                                }
                                setEditingClassId(s.id);
                              }}
                              className={`text-[10.5px] font-bold text-slate-700 text-center truncate transition-colors w-full ${isReadOnly ? "cursor-default" : "cursor-pointer hover:text-rose-600"}`}
                              title={isReadOnly ? "" : "Klik untuk ubah kelas cepat"}
                            >
                              {s.class_name ? s.class_name : "-"}
                            </p>
                          )}
                        </td>
                        {!isReadOnly ? (
                          <td className="px-2 md:px-6 py-4 whitespace-nowrap text-center border-b border-slate-100 rounded-br-xl transition-colors">
                            <div className="flex justify-center gap-1 md:gap-2">
                              <button onClick={() => setInfoStudent(s)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none" title="Detail Informasi Ortu">
                                <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedModalStudent(s);
                                  setIsNotesModalOpen(true);
                                }}
                                className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none"
                                title="Catatan Admin untuk Santri"
                              >
                                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedModalStudent(s);
                                  setIsAchievementModalOpen(true);
                                }}
                                className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none"
                                title="Pencapaian Santri"
                              >
                                <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedModalStudent(s);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none"
                                title="Riwayat Pengampu"
                              >
                                <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button onClick={() => handleEdit(s)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none" title="Edit Data Santri">
                                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button
                                onClick={() => setStudentToDelete(s)}
                                className="p-1.5 md:p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border-2 border-slate-300 shadow-none transition-all"
                                title="Hapus Data Santri"
                              >
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            </div>
                          </td>
                        ) : (
                          <td className="px-2 md:px-6 py-4 whitespace-nowrap text-center border-b border-slate-100 rounded-br-xl transition-colors">
                            <div className="flex justify-center gap-1 md:gap-2">
                              <button onClick={() => setInfoStudent(s)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none" title="Detail Informasi Ortu">
                                <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedModalStudent(s);
                                  setIsNotesModalOpen(true);
                                }}
                                className="p-1.5 md:p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 shadow-none"
                                title="Catatan Admin untuk Santri"
                              >
                                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {!loading && filteredData.length > 0 && (
            <div className="relative z-10 bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-3xl">
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
                      <div className="absolute bottom-[calc(100%+4px)] left-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-20 py-1 min-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                  <span className="hidden sm:inline">DATA</span> {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} <span className="hidden sm:inline text-slate-300">/</span>{" "}
                  <span className="text-primary-600 ml-0.5">{filteredData.length}</span>
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

          {filteredData.length === 0 && !loading && (
            <div className="p-16 text-center bg-white">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Data Tidak Ditemukan</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed top-16 left-0 right-0 bottom-0 z-120 flex items-center justify-center lg:pl-64 p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-none overflow-y-auto scrollbar-hide border-2 border-slate-300 flex flex-col max-h-[75vh] relative">
              <div className="px-5 py-2.5 border-b border-slate-50 rounded-t-xl flex justify-between items-center bg-white shrink-0 sticky top-0 z-40">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 uppercase">{isEditMode ? "Edit Data Santri" : "Pendaftaran Santri Baru"}</h3>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Formulir Pendaftaran & Akademik</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form id="studentForm" onSubmit={handleAddOrEditStudent} className="flex-1 p-6 space-y-4 relative">
                {/* Section 1: Data Santri */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <h4 className="text-[9px] font-black text-jade-600 uppercase tracking-widest shrink-0">Data Santri</h4>
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <input
                        id="input-studentName"
                        required
                        value={formData.studentName}
                        onChange={(e) => {
                          setFormData({ ...formData, studentName: e.target.value });
                          if (formErrors.studentName) setFormErrors({ ...formErrors, studentName: "" });
                        }}
                        className={`w-full h-10.5 px-4 py-2 border-2 rounded-xl text-[13px] font-bold transition-all outline-none placeholder:text-slate-300 ${formErrors.studentName ? "border-red-500 bg-red-50 focus:bg-white" : "bg-white border-slate-300 focus:border-jade-400 focus:bg-white text-slate-800 shadow-none"}`}
                        placeholder="Nama lengkap santri..."
                      />
                      {formErrors.studentName && <p className="text-[8px] text-red-500 font-bold mt-0.5 ml-1">{formErrors.studentName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NIS</label>
                      <input
                        id="input-nis"
                        type="number"
                        value={formData.nis}
                        onChange={(e) => {
                          const newNis = e.target.value;
                          setFormData({
                            ...formData,
                            nis: newNis,
                            parentEmail: isEditMode ? formData.parentEmail : newNis ? `${newNis}@qurma.com` : "",
                          });
                          if (formErrors.nis) setFormErrors({ ...formErrors, nis: "" });
                        }}
                        className={`w-full h-10.5 px-4 py-2 border-2 rounded-xl text-[13px] font-bold transition-all outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${formErrors.nis ? "border-red-500 bg-red-50 focus:bg-white" : "bg-white border-slate-300 focus:border-jade-400 focus:bg-white text-slate-800 shadow-none"}`}
                        placeholder="NIS santri..."
                      />
                      {formErrors.nis && <p className="text-[8px] text-red-500 font-bold mt-0.5 ml-1">{formErrors.nis}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK</label>
                      <input
                        id="input-nik"
                        type="text"
                        maxLength={16}
                        value={formData.nik}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setFormData({ ...formData, nik: val });
                        }}
                        className="w-full h-10.5 px-4 py-2 border-2 rounded-xl text-[13px] font-bold transition-all outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white border-slate-300 focus:border-jade-400 focus:bg-white text-slate-800 shadow-none font-mono"
                        placeholder="16 digit NIK..."
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                      <div className="relative">
                        <div
                          id="input-gender"
                          onClick={() => {
                            setShowGenderFormDropdown(!showGenderFormDropdown);
                            setShowHalaqahFormDropdown(false);
                            setShowClassFormDropdown(false);
                            setShowProvinceDropdown(false);
                            setShowRegencyDropdown(false);
                            setShowDistrictDropdown(false);
                            setShowVillageDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl text-[13px] font-bold outline-none transition-all cursor-pointer flex items-center justify-between h-10.5 select-none ${formErrors.gender ? "border-red-500 bg-red-50" : showGenderFormDropdown ? "border-jade-400 ring-4 ring-jade-50/50 bg-white" : "border-slate-300 bg-white"}`}
                        >
                          <span className={`block truncate pr-2 ${!formData.gender ? "text-slate-300" : "text-slate-800"}`}>{formData.gender === "L" ? "Putra" : formData.gender === "P" ? "Putri" : "Pilih Gender"}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showGenderFormDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showGenderFormDropdown && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              {[
                                { value: "L", label: "Putra" },
                                { value: "P", label: "Putri" },
                              ].map((opt) => (
                                <div
                                  key={opt.value}
                                  className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors ${formData.gender === opt.value ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({ ...formData, gender: opt.value as "L" | "P" });
                                    if (formErrors.gender) setFormErrors({ ...formErrors, gender: "" });
                                    setShowGenderFormDropdown(false);
                                  }}
                                >
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {formErrors.gender && <p className="text-[8px] text-red-500 font-bold mt-0.5 ml-1">{formErrors.gender}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Halaqah</label>
                      <div className="relative">
                        <div
                          onClick={() => {
                            setShowHalaqahFormDropdown(!showHalaqahFormDropdown);
                            setShowGenderFormDropdown(false);
                            setShowClassFormDropdown(false);
                            setShowProvinceDropdown(false);
                            setShowRegencyDropdown(false);
                            setShowDistrictDropdown(false);
                            setShowVillageDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl bg-white text-[13px] font-bold outline-none transition-all cursor-pointer flex items-center justify-between h-10.5 select-none ${showHalaqahFormDropdown ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-300"}`}
                        >
                          <span className={`block truncate pr-2 ${!formData.halaqahId ? "text-slate-300" : "text-slate-800"}`}>{halaqahs.find((h) => h.id === formData.halaqahId)?.name || "Pilih Halaqah"}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showHalaqahFormDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showHalaqahFormDropdown && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              <div
                                className={`px-4 py-2 border-b border-slate-100 last:border-0 text-[11px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!formData.halaqahId ? "text-jade-600 bg-jade-50" : "text-slate-400"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, halaqahId: "" });
                                  setShowHalaqahFormDropdown(false);
                                }}
                              >
                                Pilih Halaqah
                              </div>
                              {halaqahs.map((h) => (
                                <div
                                  key={h.id}
                                  className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${formData.halaqahId === h.id ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({ ...formData, halaqahId: h.id });
                                    setShowHalaqahFormDropdown(false);
                                  }}
                                >
                                  {h.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                      <div className="relative">
                        <div
                          onClick={() => {
                            setShowClassFormDropdown(!showClassFormDropdown);
                            setShowGenderFormDropdown(false);
                            setShowHalaqahFormDropdown(false);
                            setShowProvinceDropdown(false);
                            setShowRegencyDropdown(false);
                            setShowDistrictDropdown(false);
                            setShowVillageDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl bg-white text-[13px] font-bold outline-none transition-all cursor-pointer flex items-center justify-between h-10.5 select-none ${showClassFormDropdown ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-300"}`}
                        >
                          <span className={`block truncate pr-2 ${!formData.classId ? "text-slate-300" : "text-slate-800"}`}>{classes.find((c) => c.id === formData.classId)?.name || "Pilih Kelas"}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showClassFormDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showClassFormDropdown && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              <div
                                className={`px-4 py-2 border-b border-slate-100 last:border-0 text-[11px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!formData.classId ? "text-jade-600 bg-jade-50" : "text-slate-400"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, classId: "" });
                                  setShowClassFormDropdown(false);
                                }}
                              >
                                Pilih Kelas
                              </div>
                              {classes.map((c) => (
                                <div
                                  key={c.id}
                                  className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${formData.classId === c.id ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({ ...formData, classId: c.id });
                                    setShowClassFormDropdown(false);
                                  }}
                                >
                                  {c.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Akses */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest shrink-0">Akses Wali</h4>
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <input
                          id="input-parentEmail"
                          readOnly
                          type="email"
                          value={formData.parentEmail}
                          className={`w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-xl text-[13px] font-bold transition-all outline-none bg-slate-50 text-slate-400 cursor-not-allowed`}
                          placeholder="-"
                        />
                      </div>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">Email otomatis: NIS@qurma.com</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Sementara</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <input readOnly type="text" value={formData.nis || "-"} className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-400 outline-none cursor-not-allowed" />
                      </div>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1">Password otomatis: {formData.nis || "NIS"}</p>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div></div>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={isResetting || !formData.nis}
                        className="w-full flex items-center justify-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-600 shadow-none hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? "animate-spin" : ""}`} />
                        RESET PASSWORD KE NIS
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 3: Keluarga */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <h4 className="text-[9px] font-black text-jade-600 uppercase tracking-widest shrink-0">Data Orang Tua dan Alamat</h4>
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ayah</label>
                      <input
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="Nama Lengkap Ayah..."
                        className="w-full px-4 py-2 border-2 border-slate-300 bg-white rounded-xl text-[13px] font-bold focus:border-jade-400 transition-all outline-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ibu</label>
                      <input
                        value={formData.motherName}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        placeholder="Nama Lengkap Ibu..."
                        className="w-full px-4 py-2 border-2 border-slate-300 bg-white rounded-xl text-[13px] font-bold focus:border-jade-400 transition-all outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telp Ayah</label>
                      <input
                        type="number"
                        value={formData.fatherPhone}
                        onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                        placeholder="0895..."
                        className="w-full px-4 py-2 border-2 border-slate-300 bg-white rounded-xl text-[13px] font-bold focus:border-jade-400 transition-all outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telp Ibu</label>
                      <input
                        type="number"
                        value={formData.motherPhone}
                        onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                        placeholder="0895..."
                        className="w-full px-4 py-2 border-2 border-slate-300 bg-white rounded-xl text-[13px] font-bold focus:border-jade-400 transition-all outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Provinsi</label>
                      <div className="relative">
                        <div
                          onClick={() => {
                            setShowProvinceDropdown(!showProvinceDropdown);
                            setShowGenderFormDropdown(false);
                            setShowHalaqahFormDropdown(false);
                            setShowRegencyDropdown(false);
                            setShowDistrictDropdown(false);
                            setShowVillageDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl bg-white text-[13px] font-bold outline-none transition-all cursor-pointer flex items-center justify-between h-10.5 select-none ${showProvinceDropdown ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-300"}`}
                        >
                          <span className={`block truncate pr-2 flex-1 min-w-0 text-left ${!formData.provinceId ? "text-slate-300" : "text-slate-800"}`}>
                            {regions.provinces.find((p) => p.id === formData.provinceId)?.name || "Pilih Provinsi"}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ${showProvinceDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showProvinceDropdown && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              <div
                                className={`px-4 py-2 border-b border-slate-100 last:border-0 text-[11px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!formData.provinceId ? "text-jade-600 bg-jade-50" : "text-slate-400"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onProvinceChange("");
                                  setShowProvinceDropdown(false);
                                }}
                              >
                                Pilih Provinsi
                              </div>
                              {regions.provinces.map((p) => (
                                <div
                                  key={p.id}
                                  className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors ${formData.provinceId === p.id ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onProvinceChange(p.id);
                                    setShowProvinceDropdown(false);
                                  }}
                                >
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kab / Kota</label>
                      <div className="relative">
                        <div
                          onClick={() => {
                            if (!formData.provinceId) return;
                            setShowRegencyDropdown(!showRegencyDropdown);
                            setShowGenderFormDropdown(false);
                            setShowHalaqahFormDropdown(false);
                            setShowProvinceDropdown(false);
                            setShowDistrictDropdown(false);
                            setShowVillageDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl bg-white text-[13px] font-bold outline-none transition-all flex items-center justify-between h-10.5 select-none ${!formData.provinceId ? "opacity-50 cursor-not-allowed border-slate-200" : "cursor-pointer"} ${showRegencyDropdown ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-300"}`}
                        >
                          <span className={`block truncate pr-2 flex-1 min-w-0 text-left ${!formData.regencyId ? "text-slate-300" : "text-slate-800"}`}>
                            {regions.regencies
                              .find((r) => r.id === formData.regencyId)
                              ?.name.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, "")
                              .trim() || "Pilih Kota"}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ${showRegencyDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showRegencyDropdown && formData.provinceId && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              <div
                                className={`px-4 py-2 border-b border-slate-100 last:border-0 text-[11px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!formData.regencyId ? "text-jade-600 bg-jade-50" : "text-slate-400"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRegencyChange("", "");
                                  setShowRegencyDropdown(false);
                                }}
                              >
                                Pilih Kota
                              </div>
                              {regions.regencies.map((r) => {
                                const cleanName = r.name.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, "").trim();
                                return (
                                  <div
                                    key={r.id}
                                    className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors ${formData.regencyId === r.id ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRegencyChange(r.id, cleanName);
                                      setShowRegencyDropdown(false);
                                    }}
                                  >
                                    {cleanName}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                      <div className="relative">
                        <div
                          onClick={() => {
                            if (!formData.regencyId) return;
                            setShowDistrictDropdown(!showDistrictDropdown);
                            setShowGenderFormDropdown(false);
                            setShowHalaqahFormDropdown(false);
                            setShowProvinceDropdown(false);
                            setShowRegencyDropdown(false);
                            setShowVillageDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl bg-white text-[13px] font-bold outline-none transition-all flex items-center justify-between h-10.5 select-none ${!formData.regencyId ? "opacity-50 cursor-not-allowed border-slate-200" : "cursor-pointer"} ${showDistrictDropdown ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-300"}`}
                        >
                          <span className={`block truncate pr-2 flex-1 min-w-0 text-left ${!formData.districtId ? "text-slate-300" : "text-slate-800"}`}>
                            {regions.districts.find((d) => d.id === formData.districtId)?.name || "Pilih Kecamatan"}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ${showDistrictDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showDistrictDropdown && formData.regencyId && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              <div
                                className={`px-4 py-2 border-b border-slate-100 last:border-0 text-[11px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!formData.districtId ? "text-jade-600 bg-jade-50" : "text-slate-400"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDistrictChange("", "");
                                  setShowDistrictDropdown(false);
                                }}
                              >
                                Pilih Kecamatan
                              </div>
                              {regions.districts.map((d) => (
                                <div
                                  key={d.id}
                                  className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors ${formData.districtId === d.id ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDistrictChange(d.id, d.name);
                                    setShowDistrictDropdown(false);
                                  }}
                                >
                                  {d.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 relative">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kel / Desa</label>
                      <div className="relative">
                        <div
                          onClick={() => {
                            if (!formData.districtId) return;
                            setShowVillageDropdown(!showVillageDropdown);
                            setShowGenderFormDropdown(false);
                            setShowHalaqahFormDropdown(false);
                            setShowProvinceDropdown(false);
                            setShowRegencyDropdown(false);
                            setShowDistrictDropdown(false);
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-xl bg-white text-[13px] font-bold outline-none transition-all flex items-center justify-between h-10.5 select-none ${!formData.districtId ? "opacity-50 cursor-not-allowed border-slate-200" : "cursor-pointer"} ${showVillageDropdown ? "border-jade-400 ring-4 ring-jade-50/50" : "border-slate-300"}`}
                        >
                          <span className={`block truncate pr-2 flex-1 min-w-0 text-left ${!formData.villageId ? "text-slate-300" : "text-slate-800"}`}>{regions.villages.find((v) => v.id === formData.villageId)?.name || "Pilih Desa"}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ${showVillageDropdown ? "rotate-180 text-jade-500" : ""}`} />
                        </div>

                        {showVillageDropdown && formData.districtId && (
                          <>
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-200 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                              <div
                                className={`px-4 py-2 border-b border-slate-100 last:border-0 text-[11px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${!formData.villageId ? "text-jade-600 bg-jade-50" : "text-slate-400"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, villageId: "", village: "" });
                                  setShowVillageDropdown(false);
                                }}
                              >
                                Pilih Desa
                              </div>
                              {regions.villages.map((v) => (
                                <div
                                  key={v.id}
                                  className={`px-4 py-2.5 border-b border-slate-100 last:border-0 text-[11px] font-bold cursor-pointer text-left hover:bg-slate-50 transition-colors ${formData.villageId === v.id ? "text-jade-600 bg-jade-50 font-black" : "text-slate-600"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({ ...formData, villageId: v.id, village: v.name });
                                    setShowVillageDropdown(false);
                                  }}
                                >
                                  {v.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">RT / RW</label>
                      <input
                        type="text"
                        value={formData.rtRw}
                        onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                        placeholder="00 / 00"
                        className="w-full px-4 py-2 border-2 border-slate-300 bg-white rounded-xl text-[13px] font-bold focus:border-jade-400 transition-all outline-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat (Jl, No, dsb)</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={1}
                        placeholder="Jl, No, dsb..."
                        className="w-full px-4 py-2 border-2 border-slate-300 bg-white rounded-xl text-[13px] font-bold focus:border-jade-400 transition-all outline-none resize-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </form>

              <div className="px-6 py-5 bg-white border-t rounded-b-xl border-slate-100 flex gap-3 shrink-0 sticky bottom-0 z-40">
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-300 text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-none"
                  onClick={() => setShowAddModal(false)}
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  form="studentForm"
                  disabled={isSubmitting}
                  className="flex-2 flex items-center justify-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "MEMPROSES..." : isEditMode ? "SIMPAN" : "DAFTARKAN"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed top-16 left-0 right-0 bottom-0 z-130 flex items-center justify-center lg:pl-64 p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-none overflow-hidden border-2 border-slate-300 flex flex-col animate-in zoom-in-95 duration-200 max-h-[75vh]">
              {/* Header */}
              <div className="px-5 py-2.5 border-b border-slate-50 rounded-xl flex justify-between items-center bg-white shrink-0">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 uppercase flex items-center gap-2">
                    <Database className="w-4 h-4 text-jade-600" />
                    Import Progress
                  </h3>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Memproses Data Santri</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${importProgress.current === importProgress.total && importProgress.total > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {importProgress.total > 0 && importProgress.current === importProgress.total ? "IMPORT SELESAI" : "MEMPROSES DATA..."}
                    </span>
                    <span className="text-[10px] font-black text-slate-600 tabular-nums">
                      {importProgress.current} / {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-100">
                    <div className="bg-jade-600 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(importProgress.current / (importProgress.total || 1)) * 100}%` }} />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%</span>
                  </div>
                </div>

                {/* Error Log */}
                {importProgress.errors.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 max-h-48 overflow-y-auto border-2 border-red-100 custom-scrollbar">
                    <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 mb-2.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Log Kesalahan
                    </h4>
                    <ul className="space-y-1.5">
                      {importProgress.errors.map((err, i) => (
                        <li key={i} className="text-[10px] font-bold text-red-500 leading-tight flex gap-2">
                          <span className="shrink-0">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Done State */}
                {importProgress.current === importProgress.total && importProgress.total > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-emerald-50/50 py-2.5 px-3 rounded-lg flex items-center gap-2.5 border border-emerald-100">
                      <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-2">Proses Selesai</p>
                        <div className="space-y-0.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                          {importProgress.summary && importProgress.summary.length > 0 ? (
                            importProgress.summary.map((s, i) => (
                              <p key={i} className={`text-[9px] font-bold ${s.includes("Tidak ada data") ? "text-slate-500" : "text-emerald-700"}`}>
                                {s}
                              </p>
                            ))
                          ) : (
                            <p className="text-[9px] font-bold text-emerald-600">{importProgress.total - importProgress.errors.length} data diproses.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      className="w-full py-2.5 bg-white border-2 border-slate-300 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95 shadow-none"
                      onClick={() => setShowImportModal(false)}
                    >
                      Tutup Panel
                    </button>
                  </div>
                )}

                {/* Error-only State (no rows processed) */}
                {importProgress.total === 0 && importProgress.errors.length > 0 && (
                  <button
                    className="w-full py-2.5 border-2 border-red-200 bg-red-50 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 shadow-none"
                    onClick={() => setShowImportModal(false)}
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {infoStudent && <InfoModal student={infoStudent} onClose={() => setInfoStudent(null)} />}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmResetPassword}
        title="Reset Password ke NIS?"
        variant="warning"
        confirmLabel="YA, RESET PASSWORD"
        message={
          <span>
            Paksa reset password akun <strong>{selectedStudent?.full_name}</strong> kembali ke NIS default (<strong>{selectedStudent?.nis}</strong>)?
            <span className="text-amber-600 font-bold text-[10px] block mt-2 uppercase tracking-wide">Siswa/Orang tua akan login menggunakan NIS sebagai password.</span>
          </span>
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Data Santri?"
        variant="danger"
        confirmLabel="YA, HAPUS SANTRI"
        message={
          <span>
            Hapus santri <strong>{studentToDelete?.full_name}</strong>?{studentToDelete?.nis && <span className="text-slate-400 text-[9px] block mb-1 uppercase tracking-tighter">NIS: {studentToDelete.nis}</span>}
            <span className="text-red-600 font-bold text-[10px] block mt-2">Catatan: Akun orang tua tidak akan dihapus otomatis.</span>
          </span>
        }
      />

      {/* SHARED COMPONENT MODALS */}
      <AchievementModal isOpen={isAchievementModalOpen} onClose={() => setIsAchievementModalOpen(false)} student={selectedModalStudent} user={currentUser} onUpdate={fetchData} />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} student={selectedModalStudent} user={currentUser} onUpdate={fetchData} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} student={selectedModalStudent} />
      <GlobalTrackingModal isOpen={isGlobalTrackingOpen} onClose={() => setIsGlobalTrackingOpen(false)} tenantId={tenantId} />

      {/* Halaqah Modals */}
      <HalaqahFormModal
        isOpen={isHalaqahFormOpen}
        onClose={() => {
          setIsHalaqahFormOpen(false);
          setSelectedHalaqahData(null);
        }}
        onSubmit={handleCreateOrUpdateHalaqah}
        teachers={availableTeachersForModal}
        initialData={selectedHalaqahData}
      />
      <HalaqahDetailModal
        isOpen={isHalaqahDetailOpen}
        onClose={() => setIsHalaqahDetailOpen(false)}
        halaqah={selectedHalaqahData}
        onEdit={() => {
          setIsHalaqahDetailOpen(false);
          setIsHalaqahFormOpen(true);
        }}
        isReadOnly={isReadOnly}
      />
      <ConfirmModal
        isOpen={!!halaqahToDelete}
        onClose={() => setHalaqahToDelete(null)}
        onConfirm={handleDeleteHalaqahConfirm}
        title="Hapus Halaqah?"
        variant="danger"
        confirmLabel="YA, HAPUS"
        message={`Hapus halaqah ${halaqahToDelete?.name}? Semua santri di dalamnya akan menjadi tanpa halaqah.`}
      />
    </div>
  );
};

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);
