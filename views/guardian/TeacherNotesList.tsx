import React, { useState, useEffect } from "react";
import { UserProfile, Student, TeacherNote } from "../../types";
import { getStudents, getStudentNotes, replyStudentNote, deleteNoteReply, markNoteAsSeen } from "../../services/dataService";
import { MessageSquare, Calendar, User, Tag, ChevronRight, ChevronDown, Quote, Reply, Send, MessageCircle, CheckCircle2, Pencil, Trash2, AlertTriangle, X, Check } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useNotification } from "../../lib/NotificationContext";

export const TeacherNotesList: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [senderFilter, setSenderFilter] = useState("all");
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const { addNotification } = useNotification();

  const toggleExpand = (id: string) => {
    setExpandedNoteId((prev) => (prev === id ? null : id));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const allStudents = await getStudents(user.tenant_id!);
      const myStudent = allStudents.find((s) => s.parent_id === user.id) || allStudents.find((s) => s.id === user.id);
      if (myStudent) {
        setStudent(myStudent);
        const data = await getStudentNotes(myStudent.id);

        // Mark as seen automatically since Santri/Guardian views it in the list
        const readerString = `${myStudent.full_name} [santri]`;
        const updatedData = data.map((note) => {
          const seenArray = note.seen_by || [];
          if (!seenArray.includes(readerString)) {
            markNoteAsSeen(note.id, readerString, seenArray);
            return { ...note, seen_by: [...seenArray, readerString] };
          }
          return note;
        });

        setNotes(updatedData);
      }
    } catch (err) {
      console.error("Error fetching notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleReplySubmit = async (noteId: string) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await replyStudentNote(noteId, replyContent, user);
      addNotification({
        type: "success",
        title: "Balasan Terkirim",
        message: "Pesan balasan Anda telah berhasil dikirim ke ustadz.",
      });
      setReplyContent("");
      setReplyingTo(null);
      setExpandedNoteId(noteId);
      await fetchData();
    } catch (err) {
      addNotification({
        type: "error",
        title: "Gagal Mengirim",
        message: "Terjadi kesalahan saat mengirim balasan.",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditReply = (note: TeacherNote) => {
    setReplyContent(note.reply_content || "");
    setReplyingTo(note.id);
    setExpandedNoteId(note.id);
  };

  const handleDeleteReply = async (noteId: string) => {
    setDeletingReplyId(noteId);
    try {
      await deleteNoteReply(noteId, user);
      addNotification({
        type: "success",
        title: "Balasan Dihapus",
        message: "Balasan Anda telah berhasil dihapus.",
      });
      setExpandedNoteId(null);
      setConfirmDeleteId(null);
      await fetchData();
    } catch (err) {
      addNotification({
        type: "error",
        title: "Gagal Menghapus",
        message: "Terjadi kesalahan saat menghapus balasan.",
      });
    } finally {
      setDeletingReplyId(null);
    }
  };

  if (loading)
    return (
      <div className="space-y-4 animate-fade-in">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-32px p-6 border border-slate-100 shadow-sm">
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );

  if (notes.length === 0) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center animate-fade-in">
        <EmptyState message="Belum Ada Catatan" description="Pesan evaluasi, motivasi, atau informasi penting dari sekolah akan muncul di sini." icon="message" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Hapus Balasan?</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed mb-5">Balasan Anda akan dihapus secara permanen. Anda masih bisa membalas catatan ini kembali setelah dihapus.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                Batal
              </button>
              <button
                onClick={() => handleDeleteReply(confirmDeleteId)}
                disabled={!!deletingReplyId}
                className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {deletingReplyId ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="flex items-center justify-end mb-4 px-2">
          <div className="relative z-50">
            <button
              onClick={() => setShowSenderDropdown(!showSenderDropdown)}
              className="flex items-center justify-between bg-white border-2 border-slate-300 text-[8px] lg:text-[8.5px] font-black text-slate-600 rounded-xl px-3 h-9 lg:h-10 outline-none hover:border-jade-400 transition-all uppercase cursor-pointer min-w-40 tracking-widest"
            >
              <span className="truncate pr-4">
                {senderFilter === "all" ? "SEMUA PENGIRIM" : (() => {
                  if (senderFilter.includes("|")) {
                    const parts = senderFilter.split("|");
                    return `${parts[0].trim()} (${parts[1].trim()})`;
                  }
                  return senderFilter;
                })()}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSenderDropdown ? 'rotate-180 text-jade-500' : 'text-slate-400'}`} />
            </button>
            
            {/* Dropdown Menu */}
            {showSenderDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSenderDropdown(false)}></div>
                <div className="absolute right-0 top-full mt-1.5 w-full bg-white border-2 border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setSenderFilter("all");
                        setShowSenderDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[8.5px] font-black uppercase tracking-widest transition-colors truncate ${
                        senderFilter === "all" ? "bg-jade-50 text-jade-700" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      SEMUA PENGIRIM
                    </button>
                    {Array.from(new Set(notes.map((n) => n.teacher_name))).map((s) => {
                      let label = s;
                      if (s.includes("|")) {
                        const parts = s.split("|");
                        label = `${parts[0].trim()} (${parts[1].trim()})`;
                      }
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            setSenderFilter(s);
                            setShowSenderDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[8.5px] font-black uppercase tracking-widest transition-colors border-t border-slate-100 truncate ${
                            senderFilter === s ? "bg-jade-50 text-jade-700" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {notes
          .filter((note) => {
            if (senderFilter === "all") return true;
            return note.teacher_name === senderFilter;
          })
          .map((note) => {
            let roleStr = "Pembimbing";
            let displayName = note.teacher_name;
            let roleType = "teacher";

            if (displayName.includes("|")) {
              const parts = displayName.split("|");
              displayName = parts[0].trim();
              const r = parts[1].trim().toLowerCase();
              if (r === "admin" || r === "superadmin") {
                roleStr = "Admin";
                roleType = "admin";
              } else if (r === "supervisor") {
                roleStr = "Supervisor";
                roleType = "supervisor";
              } else {
                roleStr = "Pembimbing";
                roleType = "teacher";
              }
            } else {
              if (displayName.toLowerCase().includes("admin") || displayName.toLowerCase().includes("sekolah")) {
                roleStr = "Admin";
                roleType = "admin";
              }
            }

            const hasReply = !!note.reply_content;
            const isExpanded = expandedNoteId === note.id;
            const isEditingThis = replyingTo === note.id;

            return (
              <div
                key={note.id}
                className={`group relative z-10 hover:z-50 flex flex-col bg-white p-3.5 rounded-xl border border-slate-200 transition-all hover:shadow-sm hover:border-slate-300 ${hasReply && !isEditingThis ? "cursor-pointer" : ""}`}
                onClick={() => hasReply && !isEditingThis && toggleExpand(note.id)}
              >
                <div className="flex justify-between items-start mb-2 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-black text-slate-700 uppercase tracking-tight leading-none">Ustadz {displayName}</span>
                      <span className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 ${roleType === "admin" ? "text-purple-500" : roleType === "supervisor" ? "text-blue-500" : "text-emerald-500"}`}>{roleStr}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasReply && (
                      <div className="flex items-center gap-1 bg-jade-50 px-1.5 py-0.5 rounded border border-jade-100">
                        <CheckCircle2 className="w-3 h-3 text-jade-500" />
                        <span className="text-[7px] font-black text-jade-600 uppercase tracking-tight">Terbalas</span>
                      </div>
                    )}
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mr-2">
                      <Calendar className="w-2.5 h-2.5 opacity-60" />
                      {new Date(note.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start gap-1.5 lg:gap-2 pt-2 border-t border-slate-50">
                  <span
                    className={`w-max shrink-0 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border lg:mt-0.5 ${
                      note.category === "Motivasi"
                        ? "bg-jade-50 text-jade-600 border-jade-100"
                        : note.category === "Evaluasi"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : note.category === "Perilaku"
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {note.category || "Catatan"}
                  </span>
                  <div className="flex items-start gap-2 w-full lg:w-auto flex-1">
                    <p className="text-[10px] font-black text-slate-700 leading-snug tracking-tight uppercase lg:px-0.5 lg:pt-0.5 flex-1">{note.content}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!hasReply ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (replyingTo === note.id) {
                            setReplyingTo(null);
                            setReplyContent("");
                          } else {
                            setReplyingTo(note.id);
                            setReplyContent("");
                          }
                        }}
                        className={`p-1.5 mr-2 rounded-xl transition-all border ${replyingTo === note.id ? "bg-jade-600 text-white border-jade-600" : "bg-slate-50 text-slate-400 border-slate-200 hover:text-jade-600 hover:border-jade-200"}`}
                        title="Balas Catatan"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className={`p-1 rounded transition-all duration-300 border mr-2 ${isExpanded ? "bg-jade-50 border-jade-100" : "bg-slate-50 border-slate-100 group-hover:border-slate-200"}`}>
                        <ChevronDown className={`w-3.5 h-3.5 transition-colors ${isExpanded ? "rotate-180 text-jade-600" : "text-slate-500"}`} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Expanded Reply Section / Edit Form */}
                <div className={`grid transition-all duration-500 ease-in-out ${isExpanded || isEditingThis ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    {/* Static Reply View */}
                    <div className={`grid transition-all duration-300 ease-in-out ${!isEditingThis && hasReply ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="pl-4 bg-jade-50/20 py-3 rounded-r-xl border-l-2 border-jade-100/50 relative group/reply mt-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Reply className="w-3 h-3 text-jade-400 rotate-180 shrink-0" />
                                <span className="text-[8px] font-black text-jade-500 uppercase tracking-widest">Balasan Anda:</span>
                              </div>
                              <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-tight leading-relaxed">{note.reply_content}</p>
                              {note.replied_at && (
                                <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                                  {new Date(note.replied_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>

                            {/* Tombol Edit & Delete — muncul saat di-hover */}
                            <div className="flex items-center gap-1 group-hover/reply:opacity-100 transition-opacity shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleEditReply(note)} title="Edit Balasan" className="p-1.5 rounded-sm bg-jade-500 text-white hover:text-white hover:bg-jade-600 transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setConfirmDeleteId(note.id)} title="Hapus Balasan" className="p-1.5 rounded-sm bg-red-500 text-white hover:text-white hover:bg-red-600 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit / New Reply Form */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isEditingThis ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="w-full flex items-center bg-white border-2 border-slate-200 rounded-xl pl-4 pr-1.5 py-1 focus-within:border-jade-400 focus-within:ring-4 focus-within:ring-jade-50 transition-all hover:border-slate-300">
                            <input
                              autoFocus
                              type="text"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Tulis balasan Anda di sini..."
                              className="flex-1 text-[10px] font-bold text-slate-700 outline-none bg-transparent w-full placeholder:text-slate-400 placeholder:font-bold py-1.5 lg:py-2"
                            />
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                }}
                                title="Batal"
                                className="p-1.5 rounded-sm bg-red-500 text-white hover:bg-red-600 transition-all"
                              >
                                <X className="w-3.5 font-bold h-3.5" />
                              </button>
                              <button
                                disabled={!replyContent.trim() || submittingReply}
                                onClick={() => handleReplySubmit(note.id)}
                                title="Simpan"
                                className="p-1.5 rounded-sm bg-jade-500 text-white hover:bg-jade-600 disabled:opacity-50 transition-all group"
                              >
                                {submittingReply ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
