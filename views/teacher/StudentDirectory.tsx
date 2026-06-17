import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  getStudents,
  getStudentsByHalaqah,
  createStudent,
  getHalaqahs,
  createUser,
  createStudentNote,
  updateStudent,
  deleteStudent,
  updateUser,
  getUsers,
  getAchievements,
  createAchievement,
  deleteAchievement,
  updateAchievement,
  getStudentNotes,
  deleteStudentNote,
  updateStudentNote,
  getClasses,
  markNoteAsSeen,
} from "../../services/dataService";
import { Student, Halaqah, UserProfile, UserRole, Achievement, TeacherNote, Class, MemorizationStatus } from "../../types";
import { getTenantRecords } from "../../services/data/memorizationService";
import { CustomDatePicker } from "../../components/ui/CustomDatePicker";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import {
  Search,
  Plus,
  X,
  Save,
  MessageSquare,
  ChevronRight,
  User,
  Trash2,
  Edit3,
  Phone,
  Trophy,
  Calendar,
  Check,
  Trash,
  FileText,
  Quote,
  ChevronDown,
  Filter,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  Reply,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useLoading } from "../../lib/LoadingContext";
import { useNotification } from "../../lib/NotificationContext";

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onUpdate: (id: string, data: Partial<Student> & { guardian_name?: string; guardian_whatsapp?: string }) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
  tenantId: string;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ isOpen, onClose, student, onUpdate, onDelete, tenantId }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    current_juz: 0,
    guardian_name: "",
    guardian_whatsapp: "",
    guardian_email: "",
    father_name: "",
    mother_name: "",
    father_phone: "",
    mother_phone: "",
    address: "",
    rt_rw: "",
    village: "",
    district: "",
    city: "",
  });

  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        full_name: student.full_name,
        current_juz: student.current_juz || 30,
        guardian_name: "",
        guardian_whatsapp: "",
        guardian_email: "",
        father_name: student.father_name || "",
        mother_name: student.mother_name || "",
        father_phone: student.father_phone || "",
        mother_phone: student.mother_phone || "",
        address: student.address || "",
        rt_rw: (student as any).rt_rw || "",
        village: (student as any).village || "",
        district: (student as any).district || "",
        city: (student as any).city || "",
      });

      if (student.parent_id) {
        getUsers(tenantId)
          .then((users) => {
            if (Array.isArray(users)) {
              const guardian = users.find((u) => u.id === student.parent_id);
              if (guardian) {
                setFormData((prev) => ({
                  ...prev,
                  guardian_name: guardian.full_name,
                  guardian_whatsapp: guardian.whatsapp_number || "",
                  guardian_email: guardian.email || "",
                }));
              }
            }
          })
          .catch((err) => console.error("Failed to fetch guardian:", err));
      }
    }
  }, [student, isOpen, tenantId]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(student.id, { ...formData, current_juz: Number(formData.current_juz) });
  };

  const handleDelete = async () => {
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    await onDelete(student.id, student.full_name);
    setIsConfirmOpen(false);
  };

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800 lg:pl-64 lg:pt-16" onClick={onClose}>
      <div className="bg-white rounded-32px shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-jade-500" />
              Detail Santri
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Informasi lengkap profil santri</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-hidden">
          <div className="bg-slate-300 rounded-2xl p-4 border border-slate-100 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Profil Santri</label>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-jade-500 uppercase ml-1">Nama Lengkap</span>
                    <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-700 truncate shadow-sm">{formData.full_name}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-jade-500 uppercase ml-1">Hafalan (Juz)</span>
                    <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm">{formData.current_juz} Juz</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kontak Wali</label>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-blue-500 uppercase ml-1">Nama Wali</span>
                    <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-700 truncate shadow-sm">{formData.guardian_name || "-"}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-blue-500 uppercase ml-1">WhatsApp / Email</span>
                    <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-700 truncate shadow-sm">
                      {formData.guardian_whatsapp || formData.guardian_email ? `${formData.guardian_whatsapp} ${formData.guardian_email ? `| ${formData.guardian_email}` : ""}` : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100/50">
              <div className="space-y-2">
                <span className="text-[7px] font-black text-amber-500 uppercase ml-1">Orang Tua (Ayah / Ibu)</span>
                <div className="flex flex-col gap-1.5">
                  <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-700 truncate shadow-sm flex items-center justify-between">
                    <span>{formData.father_name || "-"}</span>
                    <span className="text-[8px] opacity-40">{formData.father_phone}</span>
                  </div>
                  <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-700 truncate shadow-sm flex items-center justify-between">
                    <span>{formData.mother_name || "-"}</span>
                    <span className="text-[8px] opacity-40">{formData.mother_phone}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[7px] font-black text-rose-500 uppercase ml-1">Alamat Domisili</span>
                <div className="px-3 py-2 bg-white border-2 border-slate-50 rounded-xl text-[10px] font-bold text-slate-600 leading-relaxed shadow-sm min-17 line-clamp-3">
                  {[
                    formData.address,
                    formData.rt_rw && formData.rt_rw !== "-" ? (formData.rt_rw.includes("/") ? `RT ${formData.rt_rw.split("/")[0].trim()} / RW ${formData.rt_rw.split("/")[1].trim()}` : `RT/RW ${formData.rt_rw}`) : "",
                    formData.village,
                    formData.district,
                    formData.city,
                  ]
                    .filter((val) => val && val !== "-")
                    .join(", ") || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Hapus Data Santri?"
          variant="danger"
          confirmLabel="YA, HAPUS PERMANEN"
          message={
            <span className="text-red-600">
              Hapus permanen santri <strong>{student?.full_name || "Santri"}</strong>?<span className="font-bold block mt-2 text-[10px]">Tindakan ini tidak dapat dibatalkan.</span>
            </span>
          }
        />
      </div>
    </div>
  );
};

// --- Other Modals (Achievement, Notes) ---

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
    <>
    <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800" onClick={onClose}>
      <div className={`bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-200 ${!!achToDelete ? 'hidden' : ''}`} onClick={(e) => e.stopPropagation()}>
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
                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    <p className="text-[10.5px] font-black text-slate-700 uppercase tracking-tight leading-normal wrap-break-words whitespace-normal">{ach.title}</p>
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
                    <div className="flex gap-1 items-center shrink-0">
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
          <div className="flex items-center gap-3">
            <label className="text-[7.5px] font-black text-jade-400 uppercase tracking-[0.2em] w-24 shrink-0 ml-1">Nama Pencapaian</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Hafal Juz 30"
              className="flex-1 px-3.5 py-1.5 border border-slate-400 bg-white rounded-xl focus:ring-2 focus:ring-jade-100 focus:border-jade-400 transition-all text-[9px] uppercase font-bold text-slate-800 outline-none h-9 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[8px]"
            />
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
      </div>
    </div>
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
    </>
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
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const { addNotification } = useNotification();
  const categories: (typeof category)[] = ["Motivasi", "Evaluasi", "Perilaku", "Lainnya"];

  const loadNotes = () => {
    if (!student) return;
    getStudentNotes(student.id)
      .then((res) => {
        if (Array.isArray(res)) {
          const readerString = `${user.full_name} [ustadz]`;
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
    <>
    <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800" onClick={onClose}>
      <div className={`bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-200 ${!!noteToDelete ? 'hidden' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase">{user.role === "admin" || user.role === "superadmin" ? "Catatan Admin" : user.role === "supervisor" ? "Catatan Supervisor" : "Catatan Ustadz"}</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">{student.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notes.length > 0 && (
              <div className="relative" onClick={() => setShowSenderDropdown(!showSenderDropdown)}>
                <div className="bg-slate-50 border border-slate-200 text-[8px] font-black text-slate-600 rounded-lg px-2 py-1.5 outline-none hover:border-jade-400 uppercase cursor-pointer max-w-28 flex items-center justify-between gap-2">
                  <span className="truncate">
                    {senderFilter === "all" ? "SEMUA PENGIRIM" : senderFilter === "me" ? "ANDA" : senderFilter}
                  </span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${showSenderDropdown ? "rotate-180 text-jade-500" : ""}`} />
                </div>
                
                {showSenderDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowSenderDropdown(false); }} />
                    <div className="absolute top-[calc(100%+4px)] right-0 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-99! py-1 min-w-32 max-w-48 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <div 
                          className={`px-3 py-2 text-[9px] font-black uppercase cursor-pointer transition-colors ${senderFilter === "all" ? "text-jade-600 bg-jade-50" : "text-slate-600 hover:bg-slate-50"}`}
                          onClick={(e) => { e.stopPropagation(); setSenderFilter("all"); setShowSenderDropdown(false); }}
                        >
                          SEMUA PENGIRIM
                        </div>
                        <div 
                          className={`px-3 py-2 text-[9px] font-black uppercase cursor-pointer transition-colors ${senderFilter === "me" ? "text-jade-600 bg-jade-50" : "text-slate-600 hover:bg-slate-50"}`}
                          onClick={(e) => { e.stopPropagation(); setSenderFilter("me"); setShowSenderDropdown(false); }}
                        >
                          ANDA
                        </div>
                        {uniqueSenders.filter((s) => s !== user.full_name).map((s) => (
                          <div 
                            key={s} 
                            className={`px-3 py-2 text-[9px] font-black uppercase cursor-pointer transition-colors truncate ${senderFilter === s ? "text-jade-600 bg-jade-50" : "text-slate-600 hover:bg-slate-50"}`}
                            onClick={(e) => { e.stopPropagation(); setSenderFilter(s); setShowSenderDropdown(false); }}
                            title={s}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 max-h-62.5 scrollbar-hide bg-slate-50/30">
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
                const isOwner = displayName === user.full_name || note.teacher_name === user.full_name;

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
                        <div className="p-2.5 bg-jade-50/50 border border-jade-100 rounded-xl">
                          <p className="text-[7px] font-black text-jade-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Reply className="w-2.5 h-2.5 rotate-180" />
                            Balasan Wali Santri:
                          </p>
                          <p className="text-[9px] font-bold text-jade-700 leading-tight uppercase tracking-tight">{note.reply_content}</p>
                          {note.replied_at && (
                            <p className="text-[6.5px] font-black text-jade-300 mt-1 uppercase">
                              Dibalas pada: {new Date(note.replied_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
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
            <label className="text-[7.5px] font-black text-jade-400 uppercase tracking-[0.2em] w-12 shrink-0 ml-1">Catatan</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis catatan harian..."
              className="flex-1 px-3.5 py-1.5 border border-slate-400 bg-white rounded-xl focus:ring-2 focus:ring-jade-100 focus:border-jade-400 transition-all text-[9px] uppercase font-bold text-slate-800 outline-none h-9 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[8px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[7.5px] font-black text-jade-400 uppercase tracking-[0.2em] w-12 shrink-0 ml-1">Kategori</label>
            <div className="flex-1 flex bg-jade-50/40 p-1 rounded-xl border border-jade-200 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-tight rounded-lg transition-all whitespace-nowrap ${
                    category === cat ? "bg-white text-jade-600 shadow-sm ring-1 ring-jade-100" : "text-slate-400 hover:text-jade-400"
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
              className="flex-1 py-2.5 bg-jade-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-jade-700 shadow-lg shadow-primary-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
              {editingNoteId ? "SIMPAN" : "SIMPAN DATA"}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmModal
      isOpen={!!noteToDelete}
      onClose={() => setNoteToDelete(null)}
      onConfirm={confirmDelete}
      title="Hapus Catatan?"
      variant="danger"
      confirmLabel="YA, HAPUS"
      message={
        <span>
          Hapus catatan ustadz ini? <br /> <span className="text-red-600 font-bold text-[10px]">Tindakan ini bersifat permanen.</span>
        </span>
      }
    />
    </>
  );
};

// --- Main Page Component ---
export const StudentDirectory: React.FC<{ user: UserProfile; tenantId: string; mode?: "santri" | "hafalan" | "kehadiran" | "catatan" }> = ({ user, tenantId, mode = "santri" }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPaginationDropdown, setShowPaginationDropdown] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [myHalaqahs, setMyHalaqahs] = useState<Halaqah[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [typeFilter, setTypeFilter] = useState<string>("sabaq");
  const [showTypeFilterDropdown, setShowTypeFilterDropdown] = useState(false);
  const [studentStats, setStudentStats] = useState<Record<string, Record<string, number>>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    if (students.length === 0) return;
    setLoadingStats(true);
    try {
      const studentIds = students.map((s) => s.id);
      const records = await getTenantRecords(studentIds, startDate, endDate);

      const stats: Record<string, Record<string, number>> = {};

      // Initialize stats
      studentIds.forEach((id) => {
        stats[id] = {
          [MemorizationStatus.LANCAR]: 0,
          [MemorizationStatus.TIDAK_LANCAR]: 0,
          [MemorizationStatus.TIDAK_SETOR]: 0,
          [MemorizationStatus.SAKIT]: 0,
          [MemorizationStatus.IZIN]: 0,
          [MemorizationStatus.ALPA]: 0,
          sabaq_sum: 0,
          sabqi_sum: 0,
          manzil_sum: 0,
        };
      });

      records.forEach((rec) => {
        if (stats[rec.student_id]) {
          // Update status counts ONLY if it matches the typeFilter
          if (rec.status && (typeFilter === "all" || rec.type === typeFilter)) {
            stats[rec.student_id][rec.status] = (stats[rec.student_id][rec.status] || 0) + 1;
          }

          // ALWAYS update the volume sums regardless of typeFilter, using ayat_end
          if (rec.type === "sabaq" && rec.ayat_end && rec.status === MemorizationStatus.LANCAR) {
            stats[rec.student_id].sabaq_sum += rec.ayat_end;
          }
          if (rec.type === "sabqi" && rec.ayat_end && rec.status === MemorizationStatus.LANCAR) {
            stats[rec.student_id].sabqi_sum += rec.ayat_end;
          }
          if (rec.type === "manzil" && rec.ayat_end && rec.status === MemorizationStatus.LANCAR) {
            stats[rec.student_id].manzil_sum += rec.ayat_end;
          }
        }
      });

      setStudentStats(stats);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (students.length > 0) {
      fetchStats();
    }
  }, [students, startDate, endDate, typeFilter]);

  const fetchData = async () => {
    const tid = user.tenant_id;
    if (!tid || !user.id) return;
    setLoading(true);
    try {
      const [allHalaqahs, studentData] = await Promise.all([getHalaqahs(tid), getStudents(tid)]);

      const teacherHalaqahs = allHalaqahs.filter((h) => h.teacher_id === user.id);
      setMyHalaqahs(teacherHalaqahs);
      setStudents(studentData);

      if (teacherHalaqahs.length > 0) {
        setHalaqah(teacherHalaqahs[0]);
      } else {
        setHalaqah(null);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat memuat data santri." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId, user.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];

    const isAdminOrSupervisor = user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR;
    const myHalaqahIds = new Set(myHalaqahs.map((h) => h.id));

    return students.filter((s) => {
      if (!s) return false;

      // Role-based visibility
      const matchRole = isAdminOrSupervisor || (s.halaqah_id && myHalaqahIds.has(s.halaqah_id));
      if (!matchRole) return false;

      return true;
    });
  }, [students, user.role, myHalaqahs]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleUpdateStudent = async (id: string, data: Partial<Student> & { guardian_name?: string; guardian_whatsapp?: string }) => {
    setGlobalLoading(true);
    try {
      const studentToUpdate = students.find((s) => s.id === id);
      if (!studentToUpdate) throw new Error("Student not found");

      await updateStudent({ id, full_name: data.full_name, current_juz: data.current_juz }, user);

      if (studentToUpdate.parent_id && (data.guardian_name || data.guardian_whatsapp)) {
        await updateUser(
          {
            id: studentToUpdate.parent_id,
            full_name: data.guardian_name,
            whatsapp_number: data.guardian_whatsapp,
          },
          user,
        );
      }

      addNotification({ type: "success", title: "Berhasil", message: "Data santri telah diperbarui." });
      await fetchData();
      setIsDetailModalOpen(false);
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat memperbarui data santri." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    setGlobalLoading(true);
    try {
      await deleteStudent(id, name, user);
      addNotification({ type: "success", title: "Berhasil", message: `Santri ${name} telah dihapus.` });
      await fetchData();
      setIsDetailModalOpen(false);
    } catch (error) {
      addNotification({ type: "error", title: "Gagal", message: "Tidak dapat menghapus santri." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const openModal = (modal: "detail" | "achievement" | "notes", student?: Student) => {
    setSelectedStudent(student || null);
    if (modal === "detail") setIsDetailModalOpen(true);
    if (modal === "achievement") setIsAchievementModalOpen(true);
    if (modal === "notes") setIsNotesModalOpen(true);
  };
  return (
    <div className="space-y-6">
      {/* Date Filter Control Bar - Only for kehadiran or hafalan */}
      {(mode === "kehadiran" || mode === "hafalan") && (
        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-3 bg-white relative z-60">
          <div className="flex-1 space-y-1 lg:space-y-1.5">
            <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari Tanggal</label>
            <div className="h-8 lg:h-10 flex items-center bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-jade-400 transition-all">
              <CustomDatePicker 
                value={startDate} 
                onChange={(val) => {
                  setStartDate(val);
                  if (val >= endDate) {
                    const nextDay = new Date(val);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setEndDate(nextDay.toISOString().split("T")[0]);
                  }
                }} 
                align="none" 
                modalClassName="left-0 translate-x-0 lg:left-1/2 lg:-translate-x-1/2" 
                className="w-full h-full px-2 lg:px-3" 
              />
            </div>
          </div>
          <div className="flex-1 space-y-1 lg:space-y-1.5">
            <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sampai Tanggal</label>
            <div className="h-8 lg:h-10 flex items-center bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-jade-400 transition-all">
              <CustomDatePicker 
                value={endDate} 
                onChange={(val) => {
                  setEndDate(val);
                  if (val <= startDate) {
                    const prevDay = new Date(val);
                    prevDay.setDate(prevDay.getDate() - 1);
                    setStartDate(prevDay.toISOString().split("T")[0]);
                  }
                }} 
                align="none" 
                modalClassName="right-0 left-auto translate-x-0 lg:right-auto lg:left-1/2 lg:-translate-x-1/2" 
                className="w-full h-full px-2 lg:px-3" 
              />
            </div>
          </div>
          {mode === "kehadiran" && (
            <div className="col-span-2 lg:col-span-1 lg:flex-1 space-y-1 lg:space-y-1.5">
              <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Setoran</label>
              <div className="relative" onClick={() => setShowTypeFilterDropdown(!showTypeFilterDropdown)}>
                <div className="h-8 lg:h-10 w-full flex items-center justify-between bg-slate-50 border-2 border-slate-200 rounded-xl px-2 lg:px-3 hover:border-jade-400 transition-all cursor-pointer">
                  <span className="text-[10px] lg:text-[11px] font-bold text-slate-700 uppercase">
                    {typeFilter}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showTypeFilterDropdown ? "rotate-180 text-jade-500" : ""}`} />
                </div>

                {showTypeFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowTypeFilterDropdown(false); }} />
                    <div className="absolute top-[calc(100%+4px)] right-0 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-99! py-1 w-full overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {["sabaq", "sabqi", "manzil"].map((s) => (
                          <div
                            key={s}
                            className={`px-3 py-2 lg:py-2.5 text-[10px] lg:text-[11px] font-black uppercase cursor-pointer transition-colors ${typeFilter === s ? "text-jade-600 bg-jade-50" : "text-slate-600 hover:bg-slate-50"}`}
                            onClick={(e) => { e.stopPropagation(); setTypeFilter(s); setShowTypeFilterDropdown(false); }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-transparent border-2 border-t-0 border-slate-300 rounded-none overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-40">
              <tr className="bg-slate-300">
                <th className="hidden lg:table-cell w-12.5 min-w-12.5 max-w-12.5 sticky left-0 bg-slate-300 z-50 px-2 lg:px-3 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-l border-r border-black whitespace-nowrap">
                  No
                </th>
                <th className="hidden lg:table-cell w-25 min-w-25 max-w-25 sticky lg:left-12.5 bg-slate-300 z-50 px-3 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-t border-b border-black whitespace-nowrap">
                  NIS
                </th>
                <th
                  className={`w-23.75 min-w-23.75 max-w-23.75 lg:w-75 lg:min-w-75 lg:max-w-75 sticky left-0 lg:left-37.5 bg-slate-300 z-50 px-2 lg:px-4 py-3 lg:py-4 text-[9px] lg:text-[10px] font-black text-slate-800 uppercase tracking-widest text-left border-t border-b border-r border-l border-black shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap`}
                >
                  Nama Santri
                </th>
                {mode === "hafalan" && (
                  <>
                    <th className="w-full min-w-30 px-3 py-4 text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center border-t border-b border-r border-emerald-700 bg-emerald-50 whitespace-nowrap">Hafalan Saat Ini</th>
                    <th className="w-full min-w-25 px-3 py-4 text-[10px] font-black text-teal-700 uppercase tracking-widest text-center border-t border-b border-r border-teal-700 bg-teal-50 whitespace-nowrap">Total Sabaq</th>
                    <th className="w-full min-w-25 px-3 py-4 text-[10px] font-black text-sky-700 uppercase tracking-widest text-center border-t border-b border-r border-sky-700 bg-sky-50 whitespace-nowrap">Total Sabqi</th>
                    <th className="w-full min-w-25 px-3 py-4 text-[10px] font-black text-indigo-700 uppercase tracking-widest text-center border-t border-b border-r border-indigo-700 bg-indigo-50 whitespace-nowrap">Total Manzil</th>
                  </>
                )}
                {mode === "kehadiran" && (
                  <>
                    <th className="w-full min-w-20 px-3 py-4 text-[10px] font-black text-jade-700 uppercase tracking-widest text-center border-t border-b border-r border-jade-700 bg-jade-50 whitespace-nowrap">Lancar</th>
                    <th className="w-full min-w-20 px-3 py-4 text-[10px] font-black text-orange-700 uppercase tracking-widest text-center border-t border-b border-r border-orange-700 bg-orange-50 whitespace-nowrap">Tidak Lancar</th>
                    <th className="w-full min-w-20 px-3 py-4 text-[10px] font-black text-red-700 uppercase tracking-widest text-center border-t border-b border-r border-red-700 bg-red-50 whitespace-nowrap">Tidak Setor</th>
                    <th className="w-full min-w-20 px-3 py-4 text-[10px] font-black text-amber-700 uppercase tracking-widest text-center border-t border-b border-r border-amber-700 bg-amber-50 whitespace-nowrap">Sakit</th>
                    <th className="w-full min-w-20 px-3 py-4 text-[10px] font-black text-blue-700 uppercase tracking-widest text-center border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap">Izin</th>
                    <th className="w-full min-w-20 px-3 py-4 text-[10px] font-black text-rose-700 uppercase tracking-widest text-center border-t border-b border-r border-rose-700 bg-rose-50 whitespace-nowrap">Alpa</th>
                  </>
                )}
                {mode === "catatan" && (
                  <th className="w-full min-w-35 px-4 py-3 text-[10px] font-black text-blue-700 uppercase tracking-widest text-center border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap">Catatan & Pencapaian</th>
                )}
                {mode === "santri" && (
                  <>
                    <th className="w-37.5 min-w-37.5 max-w-37.5 px-4 py-3 text-[10px] font-black text-blue-700 uppercase tracking-widest text-center border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap">Nama Ayah</th>
                    <th className="w-37.5 min-w-37.5 max-w-37.5 px-4 py-3 text-[10px] font-black text-blue-700 uppercase tracking-widest text-center border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap">Nama Ibu</th>
                    <th className="w-full min-w-50 px-4 py-3 text-[10px] font-black text-blue-700 uppercase tracking-widest text-start border-t border-b border-r border-blue-700 bg-blue-50 whitespace-nowrap">Alamat Domisili</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-4 border-jade-100 border-t-jade-500 rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-24 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data santri tidak ditemukan</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => (
                  <tr key={student.id} className="group transition-colors hover:bg-emerald-50/40">
                    <td className="hidden lg:table-cell w-12.5 min-w-12.5 max-w-12.5 sticky left-0 bg-white group-hover:bg-emerald-50 px-2 lg:px-3 py-3 text-[11px] font-bold text-slate-400 text-center border-r border-b border-slate-200 z-20 transition-colors">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="hidden lg:table-cell w-25 min-w-25 max-w-25 sticky lg:left-12.5 bg-white group-hover:bg-emerald-50 px-3 py-3 text-center border-r border-b border-slate-200 z-20 transition-colors truncate">
                      <span className="text-[10.5px] font-mono font-black text-slate-600 bg-slate-50 group-hover:bg-emerald-50/50 group-hover:text-emerald-700 transition-colors px-2.5 py-1 rounded tracking-tight">{student.nis || "-"}</span>
                    </td>
                    <td
                      className={`w-23.75 min-w-23.75 max-w-23.75 lg:w-75 lg:min-w-75 lg:max-w-75 sticky left-0 lg:left-37.5 bg-white group-hover:bg-emerald-50 px-2 lg:px-4 py-3 lg:py-4 text-[9.5px] lg:text-xs font-bold text-slate-800 border-r border-b border-slate-200 z-20 transition-all duration-300 whitespace-normal leading-tight wrap-break-words shadow-[2px_0_5px_rgba(0,0,0,0.05)]`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="whitespace-normal lg:truncate leading-tight wrap-break-words lg:whitespace-nowrap">{student.full_name}</span>
                      </div>
                    </td>
                    {mode === "hafalan" && (
                      <>
                        <td className="px-4 py-3 text-center border-r border-b border-slate-200 bg-emerald-50/10 group-hover:bg-emerald-50">
                          <span className="text-[11px] font-black text-slate-800">
                            {(() => {
                              const juz = student.current_juz || 0;
                              const page = student.current_page || 0;
                              if (juz === 0 && page === 0) return "-";
                              const parts: string[] = [];
                              if (juz > 0) parts.push(`${juz} Juz`);
                              if (page > 0) parts.push(`${page} Halaman`);
                              return parts.join(" ");
                            })()}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-teal-600 text-center border-rborder-b border-slate-200 bg-teal-50/10 group-hover:bg-emerald-50 whitespace-nowrap">
                          {loadingStats ? (
                            <span className="text-[8px] text-slate-400 animate-pulse">...</span>
                          ) : (
                            (() => {
                              const totalLines = studentStats[student.id]?.sabaq_sum || 0;
                              const totalPages = Math.floor(totalLines / 15);
                              const lines = totalLines % 15;
                              const juz = Math.floor(totalPages / 20);
                              const pages = totalPages % 20;

                              const parts: string[] = [];
                              if (juz > 0) parts.push(`${juz} Juz`);
                              if (pages > 0) parts.push(`${pages} Hal`);
                              if (lines > 0) parts.push(`${lines} Baris`);

                              return parts.length > 0 ? parts.join(" ") : "-";
                            })()
                          )}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-sky-600 text-center border-r border-b border-slate-200 bg-sky-50/10 group-hover:bg-emerald-50 whitespace-nowrap">
                          {loadingStats ? (
                            <span className="text-[8px] text-slate-400 animate-pulse">...</span>
                          ) : (
                            (() => {
                              const totalPages = studentStats[student.id]?.sabqi_sum || 0;
                              const juz = Math.floor(totalPages / 20);
                              const pages = totalPages % 20;

                              const parts: string[] = [];
                              if (juz > 0) parts.push(`${juz} Juz`);
                              if (pages > 0) parts.push(`${pages} Hal`);

                              return parts.length > 0 ? parts.join(" ") : "-";
                            })()
                          )}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-indigo-600 text-center border-r border-b border-slate-200 bg-indigo-50/10 group-hover:bg-emerald-50 whitespace-nowrap">
                          {loadingStats ? (
                            <span className="text-[8px] text-slate-400 animate-pulse">...</span>
                          ) : (
                            (() => {
                              const totalPages = studentStats[student.id]?.manzil_sum || 0;
                              const juz = Math.floor(totalPages / 20);
                              const pages = totalPages % 20;

                              const parts: string[] = [];
                              if (juz > 0) parts.push(`${juz} Juz`);
                              if (pages > 0) parts.push(`${pages} Hal`);

                              return parts.length > 0 ? parts.join(" ") : "-";
                            })()
                          )}
                        </td>
                      </>
                    )}
                    {mode === "kehadiran" && (
                      <>
                        <td className="px-3 py-3 text-[11px] font-black text-jade-600 text-center border-r border-b border-slate-200 bg-jade-50/5 group-hover:bg-emerald-50">
                          {loadingStats ? <span className="text-[8px] text-slate-400 animate-pulse">...</span> : studentStats[student.id]?.[MemorizationStatus.LANCAR] || 0}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-orange-600 text-center border-r border-b border-slate-200 bg-orange-50/10 group-hover:bg-emerald-50">
                          {loadingStats ? <span className="text-[8px] text-slate-400 animate-pulse">...</span> : studentStats[student.id]?.[MemorizationStatus.TIDAK_LANCAR] || 0}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-red-600 text-center border-r border-b border-slate-200 bg-red-50/10 group-hover:bg-emerald-50">
                          {loadingStats ? <span className="text-[8px] text-slate-400 animate-pulse">...</span> : studentStats[student.id]?.[MemorizationStatus.TIDAK_SETOR] || 0}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-amber-600 text-center border-r border-b border-slate-200 bg-amber-50/10 group-hover:bg-emerald-50">
                          {loadingStats ? <span className="text-[8px] text-slate-400 animate-pulse">...</span> : studentStats[student.id]?.[MemorizationStatus.SAKIT] || 0}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-blue-600 text-center border-r border-b border-slate-200 bg-blue-50/10 group-hover:bg-emerald-50">
                          {loadingStats ? <span className="text-[8px] text-slate-400 animate-pulse">...</span> : studentStats[student.id]?.[MemorizationStatus.IZIN] || 0}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-black text-rose-600 text-center border-r border-b border-slate-200 bg-rose-50/10 group-hover:bg-emerald-50">
                          {loadingStats ? <span className="text-[8px] text-slate-400 animate-pulse">...</span> : studentStats[student.id]?.[MemorizationStatus.ALPA] || 0}
                        </td>
                      </>
                    )}
                    {mode === "catatan" && (
                      <td className="px-4 py-3 text-center bg-slate-50/5 border-b border-slate-200 group-hover:bg-emerald-50">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("notes", student);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-jade-700 hover:text-jade-800 bg-jade-50 hover:bg-jade-100 rounded-xl border border-jade-200 hover:border-jade-300 transition-all shadow-sm active:scale-95"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Catatan
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("achievement", student);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 hover:border-amber-300 transition-all shadow-sm active:scale-95"
                          >
                            <Trophy className="w-3 h-3" />
                            Pencapaian
                          </button>
                        </div>
                      </td>
                    )}
                    {mode === "santri" && (
                      <>
                        <td className="w-37.5 min-37.5 max-37.5 px-4 py-3 text-center bg-slate-50/5 border-b border-slate-200 group-hover:bg-emerald-50 leading-tight">
                          <div className="text-[11px] font-bold text-slate-700 whitespace-normal">{student.father_name || "-"}</div>
                          {student.father_phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(student.father_phone!);
                                addNotification({ type: "success", title: "Berhasil", message: `Nomor disalin.` });
                              }}
                              className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline cursor-pointer mt-0.5 block mx-auto"
                              title="Salin nomor"
                            >
                              ({student.father_phone})
                            </button>
                          )}
                        </td>
                        <td className="w-37.5 min-37.5 max-37.5 px-4 py-3 text-center bg-slate-50/5 border-b border-slate-200 group-hover:bg-emerald-50 leading-tight">
                          <div className="text-[11px] font-bold text-slate-700 whitespace-normal">{student.mother_name || "-"}</div>
                          {student.mother_phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(student.mother_phone!);
                                addNotification({ type: "success", title: "Berhasil", message: `Nomor disalin.` });
                              }}
                              className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline cursor-pointer mt-0.5 block mx-auto"
                              title="Salin nomor"
                            >
                              ({student.mother_phone})
                            </button>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-start bg-slate-50/5 border-b border-slate-200 group-hover:bg-emerald-50 truncate max-50"
                          title={[student.address, student.village, student.district, student.city].filter((val) => val && val !== "-").join(", ") || "-"}
                        >
                          <span className="text-[11px] font-bold text-slate-700">{[student.address, student.village, student.district, student.city].filter((val) => val && val !== "-").join(", ") || "-"}</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {filteredStudents.length > 0 && (
          <div className="bg-slate-100 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  onClick={() => setShowPaginationDropdown(!showPaginationDropdown)}
                  className="bg-white border-2 border-slate-50 rounded-xl px-2 md:px-3 py-1 flex items-center justify-between gap-1.5 md:gap-2 text-[10px] font-black text-slate-700 outline-none hover:border-slate-200 cursor-pointer shadow-none transition-all select-none min-w-12.5 md:min-w-15"
                >
                  <span>{itemsPerPage}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showPaginationDropdown ? "rotate-180 text-jade-500" : ""}`} />
                </div>

                {showPaginationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPaginationDropdown(false)} />
                    <div className="absolute bottom-[calc(100%+4px)] left-0 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-99! py-1 min-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                <span className="hidden sm:inline">DATA</span> {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStudents.length)} <span className="hidden sm:inline text-slate-300">/</span>{" "}
                <span className="text-jade-600 ml-0.5">{filteredStudents.length}</span>
              </p>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? "text-slate-400 border-slate-200 bg-slate-300 cursor-not-allowed opacity-60" : "text-slate-600 border-slate-50 bg-white hover:border-slate-200"}`}
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
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? "bg-jade-600 text-white shadow-lg shadow-jade-100 border-2 border-jade-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent"}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages || totalPages === 0 ? "text-slate-400 border-slate-200 bg-slate-300 cursor-not-allowed opacity-60" : "text-slate-600 border-slate-50 bg-white hover:border-slate-200"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AchievementModal isOpen={isAchievementModalOpen} onClose={() => setIsAchievementModalOpen(false)} student={selectedStudent} user={user} onUpdate={fetchData} />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} student={selectedStudent} user={user} onUpdate={fetchData} />
    </div>
  );
};
