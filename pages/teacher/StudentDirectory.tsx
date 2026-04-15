
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getStudentsByHalaqah, createStudent, getHalaqahs, createUser, createStudentNote, updateStudent, deleteStudent, updateUser, getUsers, getAchievements, createAchievement, deleteAchievement, getStudentNotes, deleteStudentNote, getClasses } from '../../services/dataService';
import { Student, Halaqah, UserProfile, UserRole, Achievement, TeacherNote, Class } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Search, Plus, X, Save, MessageSquare, ChevronRight, User, Trash2, Edit3, Phone, Trophy, Calendar, Check, Trash, FileText, Quote, ChevronDown, Filter, AlertTriangle } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';


interface StudentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onUpdate: (id: string, data: Partial<Student> & { guardian_name?: string, guardian_whatsapp?: string }) => Promise<void>;
    onDelete: (id: string, name: string) => Promise<void>;
    tenantId: string;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ isOpen, onClose, student, onUpdate, onDelete, tenantId }) => {
    const [formData, setFormData] = useState({ full_name: '', current_juz: 30, guardian_name: '', guardian_whatsapp: '', guardian_email: '' });
    
    useEffect(() => {
        if (student && isOpen) {
            setFormData({ 
                full_name: student.full_name, 
                current_juz: student.current_juz || 30,
                guardian_name: '', 
                guardian_whatsapp: '',
                guardian_email: '' 
            });
            
            if (student.parent_id) {
                getUsers(tenantId).then(users => {
                    if (Array.isArray(users)) {
                        const guardian = users.find(u => u.id === student.parent_id);
                        if (guardian) {
                            setFormData(prev => ({ 
                                ...prev, 
                                guardian_name: guardian.full_name, 
                                guardian_whatsapp: guardian.whatsapp_number || '',
                                guardian_email: guardian.email || ''
                            }));
                        }
                    }
                }).catch(err => console.error("Failed to fetch guardian:", err));
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
        <div 
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 max-h-[90vh] relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <User className="w-4 h-4 text-indigo-500" />
                             Detail Santri
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Informasi lengkap profil santri</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Santri</label>
                            <input readOnly type="text" value={formData.full_name} className="w-full px-4 py-2.5 border-2 border-slate-50 bg-slate-50 rounded-xl transition-all text-xs font-bold text-slate-500 outline-none cursor-default" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Hafalan Saat Ini (Juz)</label>
                            <input readOnly type="number" value={formData.current_juz} className="w-full px-4 py-2.5 border-2 border-slate-50 bg-slate-50 rounded-xl transition-all text-xs font-bold text-slate-500 outline-none cursor-default" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <p className="text-[9.5px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 w-fit px-3 py-1 rounded-full border border-indigo-100/50">Data Orang Tua / Wali</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Wali</label>
                                <input readOnly type="text" value={formData.guardian_name} className="w-full px-4 py-2.5 border-2 border-slate-50 bg-slate-50 rounded-xl transition-all text-xs font-bold text-slate-500 outline-none cursor-default" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp Wali</label>
                                <input readOnly type="tel" value={formData.guardian_whatsapp} className="w-full px-4 py-2.5 border-2 border-slate-50 bg-slate-50 rounded-xl transition-all text-xs font-bold text-slate-500 outline-none cursor-default" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Orang Tua / Wali</label>
                                <input readOnly type="email" value={formData.guardian_email} className="w-full px-4 py-2.5 border-2 border-slate-50 bg-slate-50 rounded-xl transition-all text-xs font-bold text-slate-500 outline-none cursor-default" />
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
                            Hapus permanen santri <strong>{student?.full_name || 'Santri'}</strong>? 
                            <span className="font-bold block mt-2 text-[10px]">Tindakan ini tidak dapat dibatalkan.</span>
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
    const [title, setTitle] = useState('');
    const [achToDelete, setAchToDelete] = useState<{id: string, title: string} | null>(null);
    const { addNotification } = useNotification();
    
    useEffect(() => {
        if (student && isOpen) {
            getAchievements(student.id).then(res => {
                if (Array.isArray(res)) setAchievements(res);
            }).catch(() => setAchievements([]));
        }
    }, [student, isOpen]);

    if (!isOpen || !student) return null;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            await createAchievement({ title, student_id: student.id, date: new Date().toISOString(), rank: (achievements?.length || 0) + 1 }, user, student.full_name);
            onUpdate();
            setTitle('');
            getAchievements(student.id).then(res => {
                if (Array.isArray(res)) setAchievements(res);
            });
            addNotification({type: 'success', title: 'Berhasil', message: 'Pencapaian baru telah ditambahkan.'});
        } catch (error) {
            addNotification({type: 'error', title: 'Gagal', message: 'Tidak dapat menambahkan pencapaian.'});
        }
    };

    const handleDelete = async (id: string, achievementTitle: string) => {
        setAchToDelete({id, title: achievementTitle});
    };

    const confirmDelete = async () => {
        if (!achToDelete) return;
        try {
            await deleteAchievement(achToDelete.id, user, student.full_name, achToDelete.title);
            onUpdate();
            getAchievements(student.id).then(res => {
                if (Array.isArray(res)) setAchievements(res);
            });
            addNotification({type: 'success', title: 'Berhasil', message: 'Pencapaian telah dihapus.'});
        } catch (error) {
            addNotification({type: 'error', title: 'Gagal', message: 'Tidak dapat menghapus pencapaian.'});
        }
        setAchToDelete(null);
    };

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative" onClick={e => e.stopPropagation()}>
                {/* Close Button UI */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Pencapaian Santri</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">{student.full_name}</p>
                    </div>
                </div>
                <div className="p-5 overflow-y-auto space-y-2.5 max-h-[190px] custom-scrollbar bg-slate-50/20">
                    {achievements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <Trophy className="w-12 h-12 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada pencapaian</p>
                        </div>
                    ) : achievements.map(ach => (
                        <div key={ach.id} className="group relative flex justify-between items-center bg-slate-50/30 p-2.5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 ring-1 ring-transparent hover:ring-indigo-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100/50 shadow-sm transition-transform group-hover:scale-110">
                                    <Trophy className="w-3 h-3 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight leading-none">{ach.title}</p>
                                    <div className="flex items-center gap-1.5 mt-1 opacity-40">
                                        <Calendar className="w-2.5 h-2.5" />
                                        <span className="text-[7.5px] font-black uppercase tracking-widest">{ach.date ? new Date(ach.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(ach.id, ach.title)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAdd} className="p-5 border-t border-slate-100 bg-slate-50/30 flex gap-2.5">
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Tulis pencapaian baru..." 
                        className="w-full px-5 py-2.5 border-2 border-slate-50 bg-white rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-sm font-bold text-slate-800 outline-none" 
                    />
                    <button 
                        type="submit"
                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5"/>
                    </button>
                </form>
                <ConfirmModal
                    isOpen={!!achToDelete}
                    onClose={() => setAchToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Pencapaian?"
                    variant="danger"
                    confirmLabel="YA, HAPUS"
                    message={
                        <span>Apakah Anda yakin ingin menghapus pencapaian <strong>{achToDelete?.title}</strong>? <br/><br/> <span className="text-rose-500 font-bold italic text-[10px]">Tindakan ini tidak dapat dibatalkan.</span></span>
                    }
                />
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
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'Motivasi' | 'Evaluasi' | 'Perilaku' | 'Lainnya'>('Motivasi');
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const { addNotification } = useNotification();
    const categories: (typeof category)[] = ['Motivasi', 'Evaluasi', 'Perilaku', 'Lainnya'];

    useEffect(() => {
        if (student && isOpen) {
            getStudentNotes(student.id).then(res => {
                if (Array.isArray(res)) setNotes(res);
            }).catch(() => setNotes([]));
        }
    }, [student, isOpen]);

    if (!isOpen || !student) return null;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        try {
            await createStudentNote({ content, student_id: student.id, category, teacher_name: user.full_name, date: new Date().toISOString() }, user, student.full_name);
            onUpdate();
            setContent('');
            getStudentNotes(student.id).then(res => {
                if (Array.isArray(res)) setNotes(res);
            });
            addNotification({type: 'success', title: 'Berhasil', message: 'Catatan baru telah ditambahkan.'});
        } catch (error) {
            addNotification({type: 'error', title: 'Gagal', message: 'Tidak dapat menambahkan catatan.'});
        }
    };

    const handleDelete = async (id: string) => {
        setNoteToDelete(id);
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;
        try {
            await deleteStudentNote(noteToDelete, user, student.full_name);
            onUpdate();
            getStudentNotes(student.id).then(res => {
                if (Array.isArray(res)) setNotes(res);
            });
            addNotification({type: 'success', title: 'Berhasil', message: 'Catatan telah dihapus.'});
        } catch (error) {
            addNotification({type: 'error', title: 'Gagal', message: 'Tidak dapat menghapus catatan.'});
        }
        setNoteToDelete(null);
    };

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative" onClick={e => e.stopPropagation()}>
                {/* Close Button UI */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Catatan Ustadz</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">{student.full_name}</p>
                    </div>
                </div>
                <div className="p-5 overflow-y-auto space-y-3 max-h-[160px] custom-scrollbar bg-slate-50/20">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <MessageSquare className="w-12 h-12 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada catatan</p>
                        </div>
                    ) : notes.map(note => (
                        <div key={note.id} className="group relative flex flex-col bg-slate-50/30 p-2.5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 ring-1 ring-transparent hover:ring-indigo-50/50">
                            <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 text-[7.5px] font-black uppercase tracking-[0.1em] rounded-lg border shadow-sm ${
                                    note.category === 'Motivasi' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    note.category === 'Evaluasi' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    note.category === 'Perilaku' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {note.category}
                                </span>
                                <div className="flex items-center gap-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 opacity-60">
                                        <Calendar className="w-2.5 h-2.5" />
                                        {note.date ? new Date(note.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </p>
                                    <button 
                                        onClick={() => handleDelete(note.id)}
                                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash className="w-3 h-3"/>
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-slate-700 mt-2 leading-tight tracking-tight px-1 uppercase">{note.content}</p>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAdd} className="p-3 border-t border-slate-100 bg-slate-50/30 space-y-2.5">
                    <div className="flex items-center gap-3">
                        <label className="text-[7.5px] font-black text-indigo-400 uppercase tracking-[0.2em] w-12 shrink-0 ml-1">Catatan</label>
                        <input 
                            type="text"
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            placeholder="Tulis catatan harian..." 
                            className="flex-1 px-3.5 py-1.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 shadow-sm transition-all text-xs font-bold text-slate-800 outline-none h-9 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[9px]" 
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <label className="text-[7.5px] font-black text-indigo-400 uppercase tracking-[0.2em] w-12 shrink-0 ml-1">Kategori</label>
                        <div className="flex-1 flex bg-indigo-50/40 p-0.5 rounded-xl border border-indigo-100/30 overflow-x-auto no-scrollbar shadow-inner">
                            {categories.map((cat) => (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`flex-1 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-tight rounded-lg transition-all whitespace-nowrap ${
                                        category === cat
                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100'
                                            : 'text-slate-400 hover:text-indigo-400'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        <Save className="w-4 h-4 transition-transform group-hover:scale-110"/>
                        SIMPAN DATA
                    </button>
                </form>
                <ConfirmModal
                    isOpen={!!noteToDelete}
                    onClose={() => setNoteToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Catatan?"
                    variant="danger"
                    confirmLabel="YA, HAPUS"
                    message={
                        <span>Hapus catatan ustadz ini? <br/> <span className="text-red-600 font-bold text-[10px]">Tindakan ini bersifat permanen.</span></span>
                    }
                />
            </div>
        </div>
    );
};

// --- Main Page Component ---
export const StudentDirectory: React.FC<{ user: UserProfile; tenantId: string }> = ({ user, tenantId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [halaqah, setHalaqah] = useState<Halaqah | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Record<string, string>>({});
  
  // New Filters
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | string>('ALL');
  const [classList, setClassList] = useState<Class[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allHalaqahs, allClasses] = await Promise.all([
        getHalaqahs(tenantId),
        getClasses(tenantId)
      ]);
      
      const myHalaqah = allHalaqahs.find(h => h.teacher_id === user.id);
      setHalaqah(myHalaqah || null);

      const classMap: Record<string, string> = {};
      allClasses.forEach(c => { classMap[c.id] = c.name; });
      setClasses(classMap);
      setClassList(allClasses);

      if (myHalaqah) {
        const studentData = await getStudentsByHalaqah(myHalaqah.id);
        setStudents(studentData);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memuat data santri.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId, user.id]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
      const matchGender = genderFilter === 'ALL' || s.gender === genderFilter;
      const matchClass = classFilter === 'ALL' || s.class_id === classFilter;
      return matchSearch && matchGender && matchClass;
    });
  }, [students, search, genderFilter, classFilter]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  
  const handleUpdateStudent = async (id: string, data: Partial<Student> & { guardian_name?: string, guardian_whatsapp?: string }) => {
    setGlobalLoading(true);
    try {
        const studentToUpdate = students.find(s => s.id === id);
        if (!studentToUpdate) throw new Error("Student not found");
        
        await updateStudent({ id, full_name: data.full_name, current_juz: data.current_juz }, user);
        
        if (studentToUpdate.parent_id && (data.guardian_name || data.guardian_whatsapp)) {
            await updateUser({
                id: studentToUpdate.parent_id,
                full_name: data.guardian_name,
                whatsapp_number: data.guardian_whatsapp
            }, user);
        }
        
        addNotification({ type: 'success', title: 'Berhasil', message: 'Data santri telah diperbarui.' });
        await fetchData();
        setIsDetailModalOpen(false);
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memperbarui data santri.' });
    } finally {
        setGlobalLoading(false);
    }
  };
  
  const handleDeleteStudent = async (id: string, name: string) => {
    setGlobalLoading(true);
    try {
        await deleteStudent(id, name, user);
        addNotification({ type: 'success', title: 'Berhasil', message: `Santri ${name} telah dihapus.` });
        await fetchData();
        setIsDetailModalOpen(false);
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat menghapus santri.' });
    } finally {
        setGlobalLoading(false);
    }
  };
  
  const openModal = (modal: 'detail' | 'achievement' | 'notes', student?: Student) => {
    setSelectedStudent(student || null);
    if (modal === 'detail') setIsDetailModalOpen(true);
    if (modal === 'achievement') setIsAchievementModalOpen(true);
    if (modal === 'notes') setIsNotesModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Utility Strip - Synced with WeeklyTarget style */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/20 p-2 rounded-[24px] border border-white/20 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 w-full max-w-sm group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                      type="text" 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                      placeholder="Cari nama santri..." 
                      className="w-full pl-11 pr-4 py-2.5 text-xs font-black border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 transition-all placeholder:font-bold placeholder:text-slate-400 shadow-sm"
                  />
              </div>
          </div>
          
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
              {/* Filters Group */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 shadow-sm h-10 ring-1 ring-slate-100">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                      value={classFilter} 
                      onChange={e => setClassFilter(e.target.value)}
                      className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-transparent outline-none cursor-pointer pr-2 border-none ring-0"
                  >
                      <option value="ALL">SEMUA KELAS</option>
                      {classList.map(c => (
                          <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                      ))}
                  </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 shadow-sm h-10 ring-1 ring-slate-100">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                      value={genderFilter} 
                      onChange={e => setGenderFilter(e.target.value as any)}
                      className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-transparent outline-none cursor-pointer pr-2 border-none ring-0"
                  >
                       <option value="ALL">SEMUA GENDER</option>
                       <option value="L">PUTRA (L)</option>
                       <option value="P">PUTRI (P)</option>
                   </select>
              </div>

              <button 
                  onClick={() => fetchData()}
                  className="px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 shadow-sm h-10"
              >
                  REFRESH
              </button>
          </div>
      </div>

      <div className="bg-transparent rounded-none overflow-hidden border border-slate-200/60 flex flex-col">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-40">
                    <tr className="bg-white">
                        <th className="w-[50px] min-w-[50px] sticky left-0 bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100">No</th>
                        <th className="w-[100px] min-w-[100px] sticky left-[50px] bg-white z-50 px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100">NIS</th>
                        <th className={`w-[300px] min-w-[300px] sticky left-[150px] bg-white z-50 px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-b border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}>Nama Santri</th>
                        <th className="w-[110px] min-w-[110px] px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100 bg-white">Jenis Kelamin</th>
                        <th className="w-[100px] min-w-[100px] px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-r border-slate-100 bg-white">Kelas</th>
                        <th className="w-[140px] min-w-[140px] px-3 py-4 text-[10px] font-bold text-indigo-600 uppercase tracking-widest text-center border-b border-r border-slate-100 bg-indigo-50/30 whitespace-nowrap">Hafalan Saat Ini</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 bg-slate-50/30">Aksi</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedStudents.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-24 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data santri tidak ditemukan</p>
                            </td>
                        </tr>
                    ) : paginatedStudents.map((student, idx) => (
                        <tr key={student.id} className="group transition-colors hover:bg-slate-50/50 cursor-pointer" onClick={() => openModal('detail', student)}>
                            <td className="sticky left-0 bg-white group-hover:bg-slate-50/50 px-3 py-3 text-[11px] font-bold text-slate-400 text-center border-r border-slate-50 z-20">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                            <td className="sticky left-[50px] bg-white group-hover:bg-slate-50/50 px-3 py-3 text-[11px] font-bold text-slate-600 text-center border-r border-slate-50 z-20">{student.nis || '-'}</td>
                             <td className="sticky left-[150px] bg-white group-hover:bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-100 z-20 truncate">
                                <div className="flex items-center gap-2">
                                    {student.full_name}
                                    <Edit3 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </td>
                             <td className="px-3 py-3 text-[11px] font-bold text-slate-600 text-center border-r border-slate-100">
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] ${student.gender === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                     {student.gender === 'L' ? 'PUTRA' : student.gender === 'P' ? 'PUTRI' : '-'}
                                 </span>
                             </td>
                            <td className="px-3 py-3 text-[11px] font-bold text-slate-600 text-center border-r border-slate-100">{student.class_id ? classes[student.class_id] || '-' : '-'}</td>
                            
                            <td className="px-4 py-3 text-center border-r border-slate-50 bg-indigo-50/5">
                                <span className="text-[11px] font-black text-slate-800">
                                    {student.current_juz || 0} Juz 
                                </span>
                            </td>

                            <td className="px-4 py-3 text-center bg-slate-50/5">
                                <div className="flex justify-center gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openModal('notes', student); }} 
                                        className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all border border-slate-100 shadow-sm" 
                                        title="Catatan"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openModal('achievement', student); }} 
                                        className="p-2 text-amber-600 hover:bg-white rounded-lg transition-all border border-slate-100 shadow-sm" 
                                        title="Pencapaian"
                                    >
                                        <Trophy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {filteredStudents.length > itemsPerPage && (
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Menampilkan <span className="text-slate-600">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> Dari <span className="text-indigo-600">{filteredStudents.length}</span> Santri
                </p>
                <div className="flex gap-2">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                    >
                        Sebelumnya
                    </button>
                    <button 
                        disabled={currentPage * itemsPerPage >= filteredStudents.length}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                    >
                        Berikutnya
                    </button>
                </div>
            </div>
          )}
      </div>
      
      <StudentDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} student={selectedStudent} onUpdate={handleUpdateStudent} onDelete={handleDeleteStudent} tenantId={tenantId} />
      <AchievementModal isOpen={isAchievementModalOpen} onClose={() => setIsAchievementModalOpen(false)} student={selectedStudent} user={user} onUpdate={fetchData} />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} student={selectedStudent} user={user} onUpdate={fetchData} />
    </div>
  );
};
