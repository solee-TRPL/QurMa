
import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  deleteAchievement,
  getStudentNotes,
  createStudentNote,
  deleteStudentNote
} from '../../services/dataService';
import { UserProfile, UserRole, Student, Halaqah, Class, Achievement, TeacherNote } from '../../types';
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
  MessageSquare,
  Calendar,
  Trash,
  Plus,
  Save,
  Fingerprint,
  History,
  Timer
} from 'lucide-react';
import { useNotification } from '../../lib/NotificationContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { getStudentAssignmentHistory, getAssignmentsByDateRange, AssignmentHistory } from '../../services/dataService';

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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800 lg:pl-64" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20">
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
                            <button onClick={() => handleDelete(ach.id, ach.title)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
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
                    <button type="submit" className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
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

const HistoryModal = ({ isOpen, onClose, student }: { isOpen: boolean, onClose: () => void, student: Student | null }) => {
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800 lg:pl-64" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Riwayat Pengampu</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">{student.full_name}</p>
                    </div>
                </div>
                <div className="p-5 overflow-y-auto space-y-4 max-h-[400px] custom-scrollbar bg-slate-50/20">
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
                    ) : history.map((h, idx) => (
                        <div key={h.id} className="relative pl-6 pb-2 last:pb-0 border-l-2 border-slate-100 ml-2">
                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10" />
                             <div>
                                <p className="text-[12px] font-black text-indigo-700 tracking-tight uppercase leading-none">{h.teacher_name}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{h.halaqah_name}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <Calendar className="w-2.5 h-2.5 text-emerald-500" />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">{new Date(h.start_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-slate-300">S/D</span>
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <Calendar className="w-2.5 h-2.5 text-rose-500" />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">{h.end_date ? new Date(h.end_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'SAAT INI'}</span>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-50 text-center">
                    <button onClick={onClose} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Tutup Riwayat</button>
                </div>
            </div>
        </div>
    );
};

const GlobalTrackingModal = ({ isOpen, onClose, tenantId }: { isOpen: boolean, onClose: () => void, tenantId: string }) => {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await getAssignmentsByDateRange(tenantId, startDate, endDate);
            setResults(data);
        } catch(e) {}
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800 lg:pl-64" onClick={onClose}>
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all z-20">
                  <X className="w-5 h-5" />
                </button>
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Tracking Pengampu Global</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Audit Riwayat Pembimbing Berdasarkan Periode</p>
                    </div>
                </div>
                <div className="p-8 bg-slate-50/30 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai Dari</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-11 px-4 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-indigo-500 focus:ring-0 transition-all outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hingga</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-11 px-4 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-indigo-500 focus:ring-0 transition-all outline-none" />
                    </div>
                    <button onClick={handleSearch} disabled={loading} className="h-11 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        LACAK DATA
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {results.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30">
                            <Timer className="w-16 h-16 mb-4 text-slate-200" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Tentukan periode untuk tracking</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             {results.map((res, i) => (
                                 <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-md transition-all gap-4">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                                             <User className="w-5 h-5 text-indigo-600" />
                                         </div>
                                         <div>
                                             <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{res.student_name}</p>
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">NIS: {res.student_nis}</p>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-6">
                                         <div className="text-right">
                                             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{res.teacher_name || '-'}</p>
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{res.halaqah_name}</p>
                                         </div>
                                         <div className="w-px h-6 bg-slate-100 hidden md:block" />
                                         <div className="flex flex-col items-end whitespace-nowrap">
                                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{new Date(res.start_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - {res.end_date ? new Date(res.end_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : 'SAAT INI'}</p>
                                             <span className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mt-1">Rentang Tugas</span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 text-center">
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800 lg:pl-64" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight">Catatan Admin</h3>
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
                                    <button onClick={() => handleDelete(note.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
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
                            placeholder="Tulis catatan baru..." 
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
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
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
                        <span>Hapus catatan ini? <br/> <span className="text-red-600 font-bold text-[10px]">Tindakan ini bersifat permanen.</span></span>
                    }
                />
            </div>
        </div>
    );
};

export const StudentManagement: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user: currentUser }) => {
  const isReadOnly = currentUser.role === UserRole.SUPERVISOR;
  const [rekapData, setRekapData] = useState<StudentRekap[]>(studentCache || []);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(halaqahCache || []);
  const [classes, setClasses] = useState<Class[]>(classCache || []);
  const [loading, setLoading] = useState(!studentCache);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRekap | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRekap | null>(null);
  const [editingHalaqahId, setEditingHalaqahId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[] });
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNisMobile, setShowNisMobile] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isGlobalTrackingOpen, setIsGlobalTrackingOpen] = useState(false);
  const [selectedModalStudent, setSelectedModalStudent] = useState<Student | null>(null);

  const handleForceReset = async () => {
    if (!selectedStudent || !selectedStudent.parent_id || !selectedStudent.nis) {
        addNotification({ type: 'warning', title: 'Gagal', message: 'Data NIS atau ID Akun tidak lengkap untuk melakukan reset.' });
        return;
    }
    setShowResetConfirm(true);
  };
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterHalaqah, setFilterHalaqah] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    nis: '',
    gender: 'L' as 'L' | 'P',
    classId: '',
    halaqahId: '',
    parentName: '',
    parentEmail: '',
    parentWhatsapp: '',
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    address: '',
    rtRw: '',
    village: '',
    district: '',
    city: ''
  });

  const resetForm = () => {
    setFormData({
        studentName: '', nis: '', gender: 'L', classId: '', halaqahId: '',
        parentName: '', parentEmail: '', parentWhatsapp: '',
        fatherName: '', motherName: '', fatherPhone: '', motherPhone: '', 
        address: '', rtRw: '', village: '', district: '', city: ''
    });
    setFormErrors({});
    setIsEditMode(false);
    setSelectedStudent(null);
  };

  useEffect(() => {
    if (selectedStudent) {
        setFormData({
            studentName: selectedStudent.full_name,
            nis: selectedStudent.nis || '',
            gender: selectedStudent.gender || 'L',
            classId: selectedStudent.class_id || '',
            halaqahId: selectedStudent.halaqah_id || '',
            parentName: selectedStudent.parent_name || '',
            parentEmail: selectedStudent.parent_email || '',
            parentWhatsapp: selectedStudent.parent_whatsapp || '',
            fatherName: selectedStudent.father_name || '',
            motherName: selectedStudent.mother_name || '',
            fatherPhone: selectedStudent.father_phone || '',
            motherPhone: selectedStudent.mother_phone || '',
            address: selectedStudent.address || '',
            rtRw: selectedStudent.rt_rw || '',
            village: selectedStudent.village || '',
            district: selectedStudent.district || '',
            city: selectedStudent.city || ''
        });
    } else {
        resetForm();
    }
  }, [selectedStudent]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [infoStudent, setInfoStudent] = useState<StudentRekap | null>(null);

  const InfoModal = ({ student, onClose }: { student: StudentRekap, onClose: () => void }) => {
    return (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center lg:pl-64 lg:pt-16 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <Info className="w-4 h-4 text-primary-600" />
                             Informasi Detail
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kontak Santri / Wali</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                <div className="p-5 space-y-2.5">
                    {/* STUDENT INFO BOXES */}
                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-[18px] border border-indigo-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-indigo-100">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 leading-none">Nama Santri</p>
                            <p className="text-[13px] font-bold text-indigo-900 leading-none mt-1">{student.full_name || '-'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-[18px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                            <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Nomor Induk Santri (NIS)</p>
                            <p className="text-[13px] font-mono font-black text-slate-700 leading-none mt-1 uppercase tracking-tight">{student.nis || '-'}</p>
                        </div>
                    </div>

                    {/* BAPAK BOX */}
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-[18px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Bapak</p>
                                <p className="text-[11px] font-bold text-slate-800 leading-none mt-1 truncate">{student.father_name || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 shrink-0">
                             <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                             <span className="text-[10px] font-black text-emerald-700 font-mono tracking-tighter">{student.father_phone || '-'}</span>
                        </div>
                    </div>

                    {/* IBU BOX */}
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-[18px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
                                <User className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Ibu</p>
                                <p className="text-[11px] font-bold text-slate-800 leading-none mt-1 truncate">{student.mother_name || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-pink-50 px-2 py-1.5 rounded-lg border border-pink-100 shrink-0">
                             <MessageCircle className="w-2.5 h-2.5 text-pink-600" />
                             <span className="text-[10px] font-black text-pink-700 font-mono tracking-tighter">{student.mother_phone || '-'}</span>
                        </div>
                    </div>

                    {/* ADDRESS BOX */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-[18px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm min-h-[90px]">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
                            <Home className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Alamat Lengkap</p>
                            <p className="text-[10px] font-bold text-slate-600 leading-relaxed mt-2 break-words">
                                {[
                                    student.address, 
                                    student.rt_rw ? `RT/RW ${student.rt_rw}` : '', 
                                    student.village ? `Kel. ${student.village}` : '', 
                                    student.district ? `Kec. ${student.district}` : '', 
                                    student.city
                                ].filter(Boolean).join(', ') || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
        const [usersData, studentsData, halaqahData, classData] = await Promise.all([
            getUsers(tenantId),
            getStudents(tenantId),
            getHalaqahs(tenantId),
            getClasses(tenantId)
        ]);
        
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
        
        const enrichedHalaqahs = halaqahData.map(h => {
             const teacher = usersData.find(u => u.id === h.teacher_id);
             return { ...h, teacher_name: teacher?.full_name || '-' };
        });

        const hFullMap = new Map(enrichedHalaqahs.map(h => [h.id, h]));
        const classMap = new Map(classData.map(c => [c.id, c.name]));
        
        setHalaqahs(enrichedHalaqahs);
        halaqahCache = enrichedHalaqahs;
        classCache = sortedClasses;

        const parentMap = new Map(usersData.map(u => [u.id, u]));
        
        const joined: StudentRekap[] = studentsData.map(s => {
            const parent = s.parent_id ? parentMap.get(s.parent_id) : null;
            const hInfo = s.halaqah_id ? hFullMap.get(s.halaqah_id) : null;
            return {
                ...s,
                parent_name: parent?.full_name || '-',
                parent_email: parent?.email || '-',
                parent_whatsapp: parent?.whatsapp_number || '-',
                halaqah_name: hInfo?.name || '-',
                halaqah_teacher_name: hInfo?.teacher_name || '-',
                class_name: s.class_id ? classMap.get(s.class_id) : '-'
            };
        });
        
        setRekapData(joined);
        studentCache = joined;
    } catch (error) {
        console.error("Error fetching rekap data:", error);
        if (!isBackground) addNotification({ type: 'error', title: 'Gagal Memuat', message: 'Gagal mengambil data rekap santri.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(!!studentCache);
  }, [tenantId]);
  
  const filteredData = useMemo(() => {
    return rekapData.filter(s => {
      // Search logic
      const matchesSearch = !search || 
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.nis?.toLowerCase().includes(search.toLowerCase()) ||
        s.parent_name?.toLowerCase().includes(search.toLowerCase());

      // Gender logic
      const matchesGender = filterGender === 'all' || s.gender === filterGender;

      // Halaqah logic
      const matchesHalaqah = filterHalaqah === 'all' || s.halaqah_id === filterHalaqah;

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
    return halaqahs.map(h => ({
      id: h.id,
      name: h.name,
      teacher_name: h.teacher_name || '-',
      count: rekapData.filter(s => s.halaqah_id === h.id).length
    })).sort((a, b) => b.count - a.count);
  }, [rekapData, halaqahs]);

  const handleAddOrEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!formData.studentName.trim()) errors.studentName = 'Nama santri wajib diisi.';
    if (!formData.parentEmail.trim()) errors.parentEmail = 'Email wajib diisi.';
    if (!formData.parentEmail.includes('@')) errors.parentEmail = 'Format email tidak valid.';
    
    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setIsSubmitting(true);
    try {
        if (isEditMode && selectedStudent) {
            // EDIT MODE
            // 1. Update Student
            await updateStudent({
                id: selectedStudent.id,
                full_name: formData.studentName,
                nis: formData.nis,
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
                city: formData.city
            }, currentUser);

            // 2. Update Parent (if exists)
            if (selectedStudent.parent_id) {
                await updateUser({
                    id: selectedStudent.parent_id,
                    full_name: formData.studentName, // Use student name as fallback
                    whatsapp_number: formData.parentWhatsapp
                }, currentUser);
            }

            addNotification({ 
                type: 'success', 
                title: 'Berhasil', 
                message: `Data santri ${formData.studentName} berhasil diperbarui.` 
            });
        } else {
            // CREATE MODE
            // 1. Create Parent Account (User)
            // Pastikan email selalu valid: gunakan email form, NIS, atau UUID sebagai fallback
            const safeNis = formData.nis && formData.nis.trim().length > 0 ? formData.nis.trim() : null;
            const safeEmail = formData.parentEmail?.trim() 
                || (safeNis ? `${safeNis}@qurma.local` : `santri_${Date.now()}@qurma.local`);
            const safePassword = (safeNis && safeNis.length >= 6) 
                ? safeNis 
                : `qurma_${Date.now().toString().slice(-6)}`;
            
            const parentUser = await createUser({
                email: safeEmail,
                password: safePassword,
                full_name: formData.studentName,
                role: UserRole.SANTRI,
                whatsapp_number: formData.parentWhatsapp,
                tenant_id: tenantId
            }, currentUser);

            // 2. Create Student Linked to Parent
            await createStudent({
                full_name: formData.studentName,
                nis: formData.nis,
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
                city: formData.city
            }, currentUser);

            addNotification({ 
                type: 'success', 
                title: 'Berhasil', 
                message: `Santri berhasil ditambahkan. Login: ${safeEmail} / ${safePassword}` 
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
        if (msg.includes('already registered') || msg.includes('email already exists') || msg.includes('profiles_email_key')) {
            errors.parentEmail = 'Email ini sudah terdaftar di sistem. Gunakan email lain.';
            addNotification({ type: 'warning', title: 'Email Duplikat', message: 'Email orang tua sudah digunakan akun lain.' });
        } else if (msg.includes('duplicate key') && msg.includes('nis')) {
            errors.nis = 'NIS ini sudah digunakan oleh santri lain.';
            addNotification({ type: 'warning', title: 'NIS Duplikat', message: 'Nomor Induk Santri (NIS) sudah ada di database.' });
        } else if (msg.includes('row-level security') || error.code === '42501') {
            addNotification({ 
                type: 'error', 
                title: 'Akses Ditolak', 
                message: 'Kebijakan keamanan menghalangi penyimpanan data. Mohon hubungi Superadmin.' 
            });
        } else if (msg.includes('foreign key constraint')) {
            addNotification({ 
                type: 'error', 
                title: 'Gagal Menghubungkan', 
                message: 'Data Sekolah atau Kelas yang dipilih tidak ditemukan.' 
            });
        } else {
            addNotification({ 
                type: 'error', 
                title: 'Sistem Sibuk', 
                message: `Detail: ${error.message || 'Gagal menyimpan data ke database.'}` 
            });
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(prev => ({ ...prev, ...errors }));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatWhatsAppUrl = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === '-') return '#';
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.slice(1);
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
        addNotification({ type: 'success', title: 'Berhasil', message: `Data santri ${studentToDelete.full_name} telah dihapus.` });
        fetchData();
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat menghapus data santri.' });
    } finally {
        setIsSubmitting(false);
        setStudentToDelete(null);
    }
  };

  const handleUpdateHalaqah = async (studentId: string, halaqahId: string) => {
    setIsSubmitting(true);
    try {
        await updateStudent({
            id: studentId,
            halaqah_id: halaqahId || undefined
        }, currentUser);
        
        // --- OPTIMISTIC LOCAL UPDATE (No Reload) ---
        setRekapData(prev => prev.map(s => {
            if (s.id === studentId) {
                const newH = halaqahs.find(h => h.id === halaqahId);
                return {
                    ...s,
                    halaqah_id: halaqahId,
                    halaqah_name: newH?.name || '-',
                    // We don't have user list here to get teacher name easily, 
                    // but we can try to find it from another student or just keep it simple
                    // Best way: halaqah data already has teacher name if we fetch correctly
                    // For now, let's just trigger a background fetch after local update
                };
            }
            return s;
        }));

        addNotification({ type: 'success', title: 'Berhasil', message: 'Halaqah santri berhasil diperbarui secara instan.' });
        // Fetch in background WITHOUT loading state to keep sync
        fetchData(true); 
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui halaqah. Silakan coba lagi.' });
    } finally {
        setIsSubmitting(false);
        setEditingHalaqahId(null);
    }
  };

  const handleUpdateClass = async (studentId: string, classId: string) => {
    setIsSubmitting(true);
    try {
        await updateStudent({
            id: studentId,
            class_id: classId || undefined
        }, currentUser);

        // --- OPTIMISTIC LOCAL UPDATE (No Reload) ---
        setRekapData(prev => prev.map(s => {
            if (s.id === studentId) {
                const newC = classes.find(c => c.id === classId);
                return {
                    ...s,
                    class_id: classId,
                    class_name: newC?.name || '-'
                };
            }
            return s;
        }));

        addNotification({ type: 'success', title: 'Berhasil', message: 'Kelas santri berhasil diperbarui secara instan.' });
        // Fetch in background WITHOUT loading state to keep sync
        fetchData(true);
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui kelas. Silakan coba lagi.' });
    } finally {
        setIsSubmitting(false);
        setEditingClassId(null);
    }
  };

  // --- EXCEL LOGIC ---

  const downloadTemplate = () => {
    // 1. Prepare Main Template Headers
    const headers = [
      'Nama Lengkap Santri', 
      'NIS', 
      'Jenis Kelamin (L/P)', 
      'Halaqah', 
      'Email Akses Santri', 
      'Nama Ayah',
      'Nama Ibu',
      'No. HP Ayah',
      'No. HP Ibu',
      'Alamat Lengkap',
      'RT/RW',
      'Kel/Desa',
      'Kecamatan',
      'Kab/Kota',
      '', // Gap
      '', // Gap
      'DATA REFERENSI (SALIN DARI SINI)'
    ];

    const exampleNis = '20240001';
    // 2. Initial Data Row (Example)
    const exampleRow: any[] = [
      'Ahmad Abdullah',
      { v: exampleNis, t: 's' },       // NIS as text
      'L',
      halaqahs[0]?.name || '-',
      `${exampleNis}@qurma.com`,
      'Abdullah Syukri',
      'Aminah',
      { v: '08123456789', t: 's' },    // HP Ayah
      { v: '08987654321', t: 's' },    // HP Ibu
      'Jl. Bunga Melati No. 12',
      '001/005',
      'Tegal Sari',
      'Karang Barat',
      'Jakarta Timur',
      '', // Gap
      '', // Gap
      halaqahs[0]?.name || '-'
    ];

    const rows: any[][] = [headers, exampleRow];

    // 3. Fill Reference Lists (Rows 3 and onwards)
    const maxReferenceRows = Math.max(halaqahs.length, classes.length);
    for (let i = 1; i < maxReferenceRows; i++) {
        const row = new Array(17).fill('');
        row[16] = halaqahs[i]?.name || (classes[i-halaqahs.length]?.name ? `Kelas: ${classes[i-halaqahs.length].name}` : '');
        rows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Force NIS (col B = index 1) and WhatsApp (col G = index 6) columns to text format '@'
    const textColIndices = [1, 7, 8, 10]; // NIS, HP Ayah, HP Ibu, RT/RW
    const totalRows = rows.length;
    for (const colIdx of textColIndices) {
        for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
            const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            if (!ws[cellAddr]) {
                ws[cellAddr] = { v: '', t: 's' };
            } else {
                ws[cellAddr].t = 's';
            }
            ws[cellAddr].z = '@'; 
        }
    }

    // Set Column Widths for readability
    ws['!cols'] = [
        { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, 
        { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 5 }, { wch: 5 }, { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import");
    XLSX.writeFile(wb, "Template_Import_Santri.xlsx");
    
    addNotification({ 
        type: 'success', 
        title: 'Unduh Selesai', 
        message: 'Silakan gunakan kolom DATA REFERENSI di sebelah kanan sebagai acuan.' 
    });
  };

  const downloadFullExport = () => {
    const data = filteredData.map((s, idx) => ({
        'No': idx + 1,
        'NIS': s.nis || '-',
        'Nama': s.full_name,
        'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        'Pengampu': s.halaqah_teacher_name || '-',
        'Halaqoh': s.halaqah_name || '-',
        'Email Akses': s.parent_email || '-',
        'Nama Ayah': s.father_name || '-',
        'Nama Ibu': s.mother_name || '-',
        'HP Ayah': s.father_phone || '-',
        'HP Ibu': s.mother_phone || '-',
        'Alamat': s.address || '-',
        'RT/RW': s.rt_rw || '-',
        'Kel/Desa': s.village || '-',
        'Kecamatan': s.district || '-',
        'Kab/Kota': s.city || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Santri");
    XLSX.writeFile(wb, `Data_Santri_${new Date().toISOString().split('T')[0]}.xlsx`);
    addNotification({ type: 'success', title: 'Export Berhasil', message: 'Seluruh data santri telah diexport ke Excel.' });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowImportModal(true);
    setImportProgress({ current: 0, total: 0, errors: [] });
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const rawData = XLSX.utils.sheet_to_json(ws) as any[];
            // Filter only rows that have a student name (ignore reference columns)
            const data = rawData.filter(row => row['Nama Lengkap Santri'] && row['Nama Lengkap Santri'].toString().trim() !== '');

            if (data.length === 0) {
                setImportProgress(prev => ({ ...prev, errors: ['File Excel kosong atau tidak ditemukan data santri yang valid.'] }));
                return;
            }

            setImportProgress(prev => ({ ...prev, total: data.length }));
            
            // 1. Fetch latest users to check for existing parents (siblings support)
            const latestUsers = await getUsers(tenantId);
            const userMap = new Map(latestUsers.map(u => [u.email.toLowerCase(), u.id]));
            
            const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c.id]));
            const halaqahMap = new Map(halaqahs.map(h => [h.name.toLowerCase(), h.id]));
            
            let successCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const studentName = row['Nama Lengkap Santri']?.toString().trim();
                const parentEmail = row['Email Akses Santri']?.toString().trim().toLowerCase();
                const fatherName = row['Nama Ayah']?.toString().trim();
                const motherName = row['Nama Ibu']?.toString().trim();

                // Skip empty rows or reference rows
                if (!studentName) continue;

                if (!parentEmail) {
                    errors.push(`Baris ${i + 2} (${studentName}): Email Santri wajib diisi.`);
                    setImportProgress(prev => ({ ...prev, current: i + 1, errors: [...errors] }));
                    continue;
                }

                // --- STRICT NIS-EMAIL VALIDATION ---
                const nis = String(row['NIS'] || '').trim();
                const expectedEmail = `${nis}@qurma.com`.toLowerCase();
                if (parentEmail !== expectedEmail) {
                    errors.push(`Baris ${i + 2} (${studentName}): Email Santri (${parentEmail}) tidak sesuai dengan format NIS (${expectedEmail}).`);
                    setImportProgress(prev => ({ ...prev, current: i + 1, errors: [...errors] }));
                    continue;
                }

                try {
                    // --- RATE LIMIT PROTECTION ---
                    // Add a small delay between accounts to avoid Supabase Auth rate limits
                    if (i > 0) await new Promise(res => setTimeout(res, 800));

                    let parentId = userMap.get(parentEmail);

                    // 1. Create Parent if not exists
                    if (!parentId) {
                        const parentUser = await createUser({
                            email: parentEmail,
                            password: String(row['NIS'] || 'santri123'),
                            full_name: studentName, // Default to student name as updated in UI
                            role: UserRole.SANTRI,
                            whatsapp_number: String(row['No. HP Ayah'] || row['No. HP Ibu'] || '-'),
                            tenant_id: tenantId
                        }, currentUser);
                        parentId = parentUser.id;
                        userMap.set(parentEmail, parentId);
                    }

                    // 2. Map Halaqah
                    const halaqahId = halaqahMap.get(String(row['Halaqah'] || '').toLowerCase());

                    // 3. Create Student
                    await createStudent({
                        full_name: studentName,
                        nis: String(row['NIS'] || ''),
                        gender: (row['Jenis Kelamin (L/P)'] === 'P' || row['Jenis Kelamin (L/P)'] === 'p') ? 'P' : 'L',
                        halaqah_id: halaqahId,
                        parent_id: parentId,
                        tenant_id: tenantId,
                        father_name: fatherName,
                        mother_name: motherName,
                        father_phone: String(row['No. HP Ayah'] || ''),
                        mother_phone: String(row['No. HP Ibu'] || ''),
                        address: String(row['Alamat Lengkap'] || ''),
                        rt_rw: String(row['RT/RW'] || ''),
                        village: String(row['Kel/Desa'] || ''),
                        district: String(row['Kecamatan'] || ''),
                        city: String(row['Kab/Kota'] || '')
                    }, currentUser);

                    successCount++;
                } catch (err: any) {
                    let msg = err.message || 'Gagal menyimpan.';
                    if (msg.toLowerCase().includes('duplicate key') && msg.includes('nis')) {
                        msg = "Gagal: NIS ini sudah digunakan oleh santri lain.";
                    }
                    errors.push(`Baris ${i + 2} (${studentName}): ${msg}`);
                }
                
                setImportProgress(prev => ({ ...prev, current: i + 1, errors: [...errors] }));
            }

            if (successCount > 0) {
                addNotification({ 
                    type: 'success', 
                    title: 'Import Selesai', 
                    message: `${successCount} data santri berhasil diimport.` 
                });
                fetchData();
            }
        } catch (err) {
            setImportProgress(prev => ({ ...prev, errors: ['Gagal membaca file Excel. Pastikan format benar.'] }));
        }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="relative group/scroll">
        {!loading && halaqahs.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 snap-x snap-mandatory no-scrollbar scroll-smooth">
            {/* TOP TOTAL CARD */}
            <div 
              className={`min-w-[180px] md:min-w-[200px] flex-none p-4 rounded-[28px] border transition-all group overflow-hidden relative cursor-pointer snap-start ${filterHalaqah === 'all' ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100 scale-[1.02]' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100'}`}
              onClick={() => setFilterHalaqah('all')}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${filterHalaqah === 'all' ? 'bg-white/10' : 'bg-slate-50'}`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${filterHalaqah === 'all' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className={`text-[15px] font-black tracking-tight ${filterHalaqah === 'all' ? 'text-white' : 'text-emerald-600'}`}>{rekapData.length}</span>
                </div>
                <h4 className={`text-[10px] font-black uppercase tracking-tighter truncate leading-tight ${filterHalaqah === 'all' ? 'text-white' : 'text-slate-800'}`}>TOTAL SANTRI</h4>
                <p className={`text-[8px] font-bold mt-1 uppercase tracking-widest truncate ${filterHalaqah === 'all' ? 'text-white/70' : 'text-slate-400'}`}>Seluruh Halaqah</p>
              </div>
            </div>

            {halaqahStats.map(stat => (

            



              <div 
                key={stat.id} 
                className={`min-w-[180px] md:min-w-[200px] flex-none p-4 rounded-[28px] border transition-all group overflow-hidden relative cursor-pointer snap-start ${filterHalaqah === stat.id ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02]' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100'}`}
                onClick={() => setFilterHalaqah(prev => prev === stat.id ? 'all' : stat.id)}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${filterHalaqah === stat.id ? 'bg-white/10' : 'bg-slate-50'}`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${filterHalaqah === stat.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <span className={`text-[15px] font-black tracking-tight ${filterHalaqah === stat.id ? 'text-white' : 'text-indigo-600'}`}>{stat.count}</span>
                  </div>
                  <h4 className={`text-[10px] font-black uppercase tracking-tighter truncate leading-tight ${filterHalaqah === stat.id ? 'text-white' : 'text-slate-800'}`} title={stat.name}>{stat.name}</h4>
                  <p className={`text-[8px] font-bold mt-1 uppercase tracking-widest truncate ${filterHalaqah === stat.id ? 'text-white/70' : 'text-slate-400'}`}>{stat.teacher_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INDICATOR FOR MORE (Visible if more than few halaqahs) */}
        {!loading && halaqahs.length > 3 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-full bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none flex items-center justify-end pr-1 opacity-0 group-hover/scroll:opacity-100 transition-opacity">
             <ChevronRight className="w-4 h-4 text-slate-300 animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex flex-col w-full gap-3 p-3 bg-white rounded-[28px] lg:rounded-[40px] border border-slate-100 shadow-sm backdrop-blur-sm shrink-0 relative z-[70] sticky top-0">
        {/* ROW 1: Search & Action Buttons */}
        <div className="flex flex-row items-center gap-2 w-full overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {/* 1. SEARCH BAR */}
          <div className="relative flex-1 group h-10 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Cari NIS atau Nama Santri..." 
              className="w-full h-full pl-10 pr-4 bg-slate-50/50 border border-slate-100/50 rounded-full focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 focus:bg-white transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-inner"
            />
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 flex-none">
              {/* 2. TEMPLATE */}
              <button 
                  onClick={downloadTemplate}
                  className="h-10 flex items-center justify-center gap-1.5 px-3 font-black text-[9px] uppercase tracking-widest rounded-full border border-slate-100 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
              >
                  <FileDown className="w-3.5 h-3.5" /> <span className="hidden xl:inline">TEMPLATE</span>
              </button>

              {/* 3. IMPORT */}
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 flex items-center justify-center gap-1.5 px-3 font-black text-[9px] uppercase tracking-widest rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm shadow-emerald-50 transition-all active:scale-95 whitespace-nowrap border border-emerald-100/50"
              >
                  <Upload className="w-3.5 h-3.5" /> <span className="hidden xl:inline">IMPORT</span>
              </button>

              {/* 4. EXPORT */}
              <button 
                  onClick={downloadFullExport}
                  className="h-10 flex items-center justify-center gap-1.5 px-3 font-black text-[9px] uppercase tracking-widest rounded-full border border-slate-100 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
              >
                  <Download className="w-3.5 h-3.5" /> <span className="hidden xl:inline">EXPORT</span>
              </button>

              {/* 5. TAMBAH SANTRI */}
              <button 
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="h-10 flex items-center gap-2 px-5 font-black text-[10px] uppercase tracking-widest rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-100/50 hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" /> <span className="hidden xl:inline">TAMBAH SANTRI</span><span className="xl:hidden">TAMBAH</span>
              </button>

              {/* 6. AUDIT TRACKING */}
              <button 
                  onClick={() => setIsGlobalTrackingOpen(true)}
                  className="h-10 flex items-center justify-center gap-1.5 px-4 font-black text-[9px] uppercase tracking-widest rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-100/50 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap border-none"
              >
                  <Timer className="w-3.5 h-3.5" /> <span className="hidden xl:inline">AUDIT TRACKING</span><span className="xl:hidden">TRACK</span>
              </button>
            </div>
          )}
        </div>

        {/* ROW 2: Filters & Common Tools */}
        <div className="flex flex-row items-center gap-2 w-full pt-2 border-t border-slate-50 shrink-0">
          <div className="flex flex-row items-center gap-2 flex-1">
            {/* 7. GENDER FILTER */}
            <select 
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="h-9 flex-1 lg:flex-none text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 px-4 pr-8 outline-none focus:ring-4 focus:ring-slate-50 bg-slate-50/50 cursor-pointer hover:bg-white transition-all lg:min-w-[120px] rounded-full shadow-inner appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.75rem' }}
            >
                <option value="all">GENDER</option>
                <option value="L">PUTRA</option>
                <option value="P">PUTRI</option>
            </select>

            {/* 8. HALAQAH FILTER */}
            <select 
                value={filterHalaqah}
                onChange={(e) => setFilterHalaqah(e.target.value)}
                className="h-9 flex-1 lg:flex-none text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 px-4 pr-8 outline-none focus:ring-4 focus:ring-slate-50 bg-slate-50/50 cursor-pointer hover:bg-white transition-all lg:min-w-[140px] rounded-full shadow-inner appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.75rem' }}
            >
                <option value="all">HALAQAH</option>
                {halaqahs.map(h => (
                    <option key={h.id} value={h.id}>{h.name.toUpperCase()}</option>
                ))}
            </select>
          </div>

          {/* 9, 10. REFRESH & MOBILE TOOLS */}
          <div className="flex items-center gap-2 ml-auto">
            <button 
                onClick={() => fetchData()}
                disabled={loading}
                className="h-9 w-9 shrink-0 flex items-center justify-center border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all active:scale-95 rounded-full shadow-sm disabled:opacity-50"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={() => setShowNisMobile(!showNisMobile)}
                className={`lg:hidden h-9 w-9 shrink-0 flex items-center justify-center border transition-all active:scale-95 rounded-full shadow-sm ${showNisMobile ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}
                title={showNisMobile ? "Sembunyikan NIS" : "Tampilkan NIS"}
            >
                {showNisMobile ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
      </div>

    <div className="bg-white shadow-sm border-2 border-slate-200 flex flex-col overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-40 bg-white">
              <tr>
                <th className="px-2 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 sticky left-0 z-[60] bg-white w-[40px] md:w-[45px] min-w-[40px] md:min-w-[45px]">NO</th>
                <th className={`px-1 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 sticky left-[40px] md:left-[45px] z-[60] bg-white w-[65px] md:w-[100px] min-w-[65px] md:min-w-[100px] ${!showNisMobile ? 'hidden md:table-cell' : ''}`}>NIS</th>
                <th className={`px-2 md:px-3 py-4 text-left text-[9.5px] whitespace-nowrap font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 sticky z-[60] bg-white w-[115px] md:w-[140px] lg:w-auto ${!showNisMobile ? 'left-[40px] md:left-[145px]' : 'left-[105px] md:left-[145px]'}`}>NAMA SANTRI</th>
                <th className="px-3 py-4 text-center text-[9.5px] whitespace-nowrap font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-white w-32">JENIS KELAMIN</th>
                <th className="px-6 py-4 text-left text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-white max-w-[130px]">PENGAMPU</th>
                <th className="px-6 py-4 text-left text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-white max-w-[110px]">HALAQAH</th>
                <th className="px-4 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100 bg-white w-24">
                  {isReadOnly ? 'INFO' : 'AKSI'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                  [...Array(5)].map((_, i) => (
                      <tr key={i}>
                          <td className="sticky left-0 z-10 bg-white border-r-2 border-b border-slate-100 w-[40px] md:w-[45px]"><Skeleton className="h-4 w-4 mx-auto" /></td>
                          <td className={`sticky left-[40px] md:left-[45px] z-10 bg-white border-r-2 border-b border-slate-100 w-[65px] md:w-[100px] ${!showNisMobile ? 'hidden md:table-cell' : ''}`}><Skeleton className="h-4 w-10 mx-auto" /></td>
                          <td className={`sticky z-10 bg-white border-r-2 border-b border-slate-100 w-[115px] md:w-[140px] lg:w-auto ${!showNisMobile ? 'left-[40px] md:left-[145px]' : 'left-[105px] md:left-[145px]'}`}><Skeleton className="h-4 w-24" /></td>
                          {[...Array(3)].map((_, j) => (
                              <td key={j} className="px-4 py-4 border-b border-r-2 border-slate-100"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div></td>
                          ))}
                          <td className="px-4 py-4 border-b border-slate-100"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div></td>
                      </tr>
                  ))
                ) : paginatedData.map((s, index) => (
                  <tr key={s.id} className="group transition-colors hover:bg-slate-50/30">
                    <td className="px-2 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 sticky left-0 z-20 bg-white transition-colors text-center w-[40px] md:w-[45px] min-w-[40px] md:min-w-[45px] uppercase font-black text-[10.5px] text-slate-400">
                      {String((currentPage - 1) * itemsPerPage + index + 1)}
                    </td>
                    <td className={`px-1 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 sticky left-[40px] md:left-[45px] z-20 bg-white transition-colors text-center w-[65px] md:w-[100px] min-w-[65px] md:min-w-[100px] ${!showNisMobile ? 'hidden md:table-cell' : ''}`}>
                        <span className="text-[9.5px] md:text-[10.5px] font-mono font-black text-slate-700 bg-slate-50 px-1 py-0.5 rounded tracking-tighter">{s.nis || '-'}</span>
                    </td>
                    <td className={`px-2 md:px-4 py-4 border-r-2 border-b border-slate-100 sticky z-20 bg-white transition-colors w-[115px] md:w-[140px] ${!showNisMobile ? 'left-[40px] md:left-[145px]' : 'left-[105px] md:left-[145px]'}`}>
                      <span className="text-[10.5px] md:text-[11px] font-bold text-slate-800 capitalize tracking-tight whitespace-normal break-words block max-w-[90px] md:max-w-none" title={s.full_name}>{s.full_name}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 text-center">
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tight border ${s.gender === 'L' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                          {s.gender === 'L' ? 'Putra' : 'Putri'}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 max-w-[130px]">
                     <p className="text-[10.5px] font-bold text-slate-700 truncate" title={s.halaqah_teacher_name || '-'}>{s.halaqah_teacher_name || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r-2 border-b border-slate-100 max-w-[130px]">
                    {editingHalaqahId === s.id ? (
                        <select 
                            autoFocus
                            disabled={isSubmitting}
                            className="text-[10.5px] border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm w-full"
                            value={s.halaqah_id || ''}
                            onChange={(e) => handleUpdateHalaqah(s.id, e.target.value)}
                            onBlur={() => !isSubmitting && setEditingHalaqahId(null)}
                        >
                            <option value="">Pilih Halaqah</option>
                            {halaqahs.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    ) : (
                        <div 
                            onClick={() => !isReadOnly && setEditingHalaqahId(s.id)}
                            className={`flex items-center gap-1.5 text-[10.5px] text-slate-600 bg-slate-50 px-2 py-1 rounded-full w-fit border border-slate-100 transition-all select-none group/h ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}
                            title={isReadOnly ? "" : "Klik untuk ubah halaqah cepat"}
                        >
                            <Users className="w-3 h-3 text-slate-400 group-hover/h:text-emerald-500" />
                            <span className="font-bold text-slate-800 group-hover/h:text-emerald-800 truncate" style={{ maxWidth: '80px' }}>{s.halaqah_name || '-'}</span>
                        </div>
                    )}
                  </td>
                   {!isReadOnly ? (
                    <td className="px-6 py-4 whitespace-nowrap text-center border-b border-slate-100 transition-colors">
                        <div className="flex justify-center gap-2">
                             <button 
                                 onClick={() => setInfoStudent(s)}
                                 className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm"
                                 title="Detail Informasi Ortu"
                             >
                                 <Info className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => { setSelectedModalStudent(s); setIsNotesModalOpen(true); }} 
                                 className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm" 
                                 title="Catatan Admin untuk Santri"
                             >
                                 <MessageSquare className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => { setSelectedModalStudent(s); setIsAchievementModalOpen(true); }} 
                                 className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm" 
                                 title="Pencapaian Santri"
                             >
                                 <Trophy className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => { setSelectedModalStudent(s); setIsHistoryModalOpen(true); }} 
                                 className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm" 
                                 title="Riwayat Pengampu"
                             >
                                 <History className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => handleEdit(s)}
                                 className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm"
                                 title="Edit Data Santri"
                             >
                                 <Edit className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => setStudentToDelete(s)}
                                 className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-100 transition-all bg-white shadow-sm"
                                 title="Hapus Data Santri"
                             >
                                 <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                    </td>
                  ) : (
                    <td className="px-6 py-4 whitespace-nowrap text-center border-b border-slate-100 transition-colors">
                        <button 
                            onClick={() => setInfoStudent(s)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-100 transition-all bg-white shadow-sm"
                            title="Detail Informasi Ortu"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </td>
                  )}
                </tr>
                                 ))
                            }
                    </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredData.length > 0 && (
            <div className="bg-[#F8FAFC] border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-lg">
                <div className="flex items-center gap-2">
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-white border-2 border-slate-100 rounded-xl px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-sm transition-all"
                    >
                        {[10, 25, 50, 100].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                    <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                        <span className="hidden sm:inline">DATA</span> {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, filteredData.length)} <span className="hidden sm:inline text-slate-300">/</span> <span className="text-primary-600 ml-0.5">{filteredData.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-0.5 md:gap-1">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                    >
                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const pNum = i + 1;
                            if (totalPages > 5) {
                                if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[8px] md:text-[10px] font-black">..</span>;
                                    return null;
                                }
                            }
                            
                            return (
                                <button 
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 border-2 border-primary-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                    >
                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>
        )}

        {filteredData.length === 0 && !loading && (
             <div className="p-16 text-center bg-white">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border-2 border-slate-50/50">
                    <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Data Tidak Ditemukan</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
             </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center lg:pl-64 lg:pt-16 p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-white flex flex-col max-h-[80vh]">
                  <div className="px-6 py-4 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-sm md:text-base font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">
                            {isEditMode ? 'Edit Data Santri' : 'Pendaftaran Santri Baru'}
                        </h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Formulir Pendaftaran & Akademik</p>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group active:scale-90">
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddOrEditStudent} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                      {/* Section 1: Data Santri */}
                      <div className="space-y-4">
                          <div className="flex items-center gap-3">
                              <div className="h-px bg-slate-100 flex-1"></div>
                              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest shrink-0">1. Data Santri</h4>
                              <div className="h-px bg-slate-100 flex-1"></div>
                          </div>
                          
                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                              <input 
                                required
                                value={formData.studentName}
                                onChange={e => {
                                    setFormData({...formData, studentName: e.target.value});
                                    if (formErrors.studentName) setFormErrors({...formErrors, studentName: ''});
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-2xl text-xs font-bold transition-all outline-none ${formErrors.studentName ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-indigo-400 focus:bg-white text-slate-800'}`}
                              />
                              {formErrors.studentName && <p className="text-[8px] text-red-500 font-bold mt-0.5 ml-1">{formErrors.studentName}</p>}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NIS</label>
                                  <input 
                                    value={formData.nis}
                                    onChange={e => {
                                        const newNis = e.target.value;
                                        setFormData({
                                            ...formData, 
                                            nis: newNis,
                                            parentEmail: isEditMode ? formData.parentEmail : (newNis ? `${newNis}@qurma.com` : '')
                                        });
                                        if (formErrors.nis) setFormErrors({...formErrors, nis: ''});
                                    }}
                                    className={`w-full px-4 py-2 border-2 rounded-2xl text-xs font-bold transition-all outline-none ${formErrors.nis ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-indigo-400 focus:bg-white text-slate-800'}`}
                                  />
                                  {formErrors.nis && <p className="text-[8px] text-red-500 font-bold mt-0.5 ml-1">{formErrors.nis}</p>}
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                  <div className="relative">
                                    <select 
                                        value={formData.gender}
                                        onChange={e => setFormData({...formData, gender: e.target.value as 'L' | 'P'})}
                                        className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                                    >
                                        <option value="L">PUTRA (L)</option>
                                        <option value="P">PUTRI (P)</option>
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Halaqah</label>
                              <div className="relative">
                                <select 
                                    value={formData.halaqahId}
                                    onChange={e => setFormData({...formData, halaqahId: e.target.value})}
                                    className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                                >
                                    <option value="">-</option>
                                    {halaqahs.map(h => (
                                        <option key={h.id} value={h.id}>{h.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                              </div>
                          </div>
                      </div>

                      {/* Section 2: Akses */}
                      <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-3">
                              <div className="h-px bg-slate-100 flex-1"></div>
                              <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest shrink-0">2. Akses & Wali Utama</h4>
                              <div className="h-px bg-slate-100 flex-1"></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                    <input 
                                        required
                                        type="email"
                                        readOnly={!isEditMode}
                                        value={formData.parentEmail}
                                        onChange={e => {
                                            setFormData({...formData, parentEmail: e.target.value});
                                            if (formErrors.parentEmail) setFormErrors({...formErrors, parentEmail: ''});
                                        }}
                                        className={`w-full pl-9 pr-3 py-2 border-2 rounded-2xl text-xs font-bold transition-all outline-none ${formErrors.parentEmail ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-emerald-400 focus:bg-white text-slate-800'} ${!isEditMode ? '' : 'opacity-50 border-transparent cursor-not-allowed'}`}
                                    />
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Sementara</label>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                    <input 
                                        readOnly
                                        type="text" 
                                        value={formData.nis || '-'}
                                        className="w-full pl-9 pr-3 py-2 border-2 border-slate-100 bg-slate-50/50 rounded-2xl text-xs font-bold text-slate-400 outline-none cursor-default"
                                    />
                                  </div>
                              </div>
                          </div>

                          {!isEditMode && (
                            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50 flex gap-3 items-center">
                                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                                <p className="text-[9px] text-emerald-700 font-bold leading-tight">
                                    Akses Orang Tua menggunakan NIS sebagai Password Sementara: <span className="text-emerald-600 font-black tracking-widest bg-white px-1.5 py-0.5 rounded ml-1">{formData.nis || 'NIS'}</span>
                                </p>
                            </div>
                          )}

                          {isEditMode && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowResetConfirm(true)}
                                    disabled={isResetting || !formData.nis}
                                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">Reset Password ke NIS</span>
                                </button>
                            </div>
                          )}
                      </div>

                      {/* Section 3: Keluarga */}
                      <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-3">
                              <div className="h-px bg-slate-100 flex-1"></div>
                              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest shrink-0">3. Data Orang Tua dan Alamat</h4>
                              <div className="h-px bg-slate-100 flex-1"></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ayah</label>
                                  <input 
                                      value={formData.fatherName}
                                      onChange={e => setFormData({...formData, fatherName: e.target.value})}
                                      placeholder="Nama Ayah"
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ibu</label>
                                  <input 
                                      value={formData.motherName}
                                      onChange={e => setFormData({...formData, motherName: e.target.value})}
                                      placeholder="Nama Ibu"
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telp Ayah</label>
                                  <input 
                                      value={formData.fatherPhone}
                                      onChange={e => setFormData({...formData, fatherPhone: e.target.value})}
                                      placeholder="08..."
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telp Ibu</label>
                                  <input 
                                      value={formData.motherPhone}
                                      onChange={e => setFormData({...formData, motherPhone: e.target.value})}
                                      placeholder="08..."
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat (Jl, No, dsb)</label>
                              <textarea 
                                  value={formData.address}
                                  onChange={e => setFormData({...formData, address: e.target.value})}
                                  rows={2}
                                  className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none resize-none"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">RT / RW</label>
                                  <input 
                                      value={formData.rtRw}
                                      onChange={e => setFormData({...formData, rtRw: e.target.value})}
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kel / Desa</label>
                                  <input 
                                      value={formData.village}
                                      onChange={e => setFormData({...formData, village: e.target.value})}
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                                  <input 
                                      value={formData.district}
                                      onChange={e => setFormData({...formData, district: e.target.value})}
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kab / Kota</label>
                                  <input 
                                      value={formData.city}
                                      onChange={e => setFormData({...formData, city: e.target.value})}
                                      className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-2xl text-xs font-bold focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </form>

                  <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                      <button 
                        type="button" 
                        className="flex-1 px-4 py-3 font-black text-[10px] uppercase tracking-widest rounded-2xl border-2 border-white bg-white text-slate-400 hover:text-slate-600 shadow-sm transition-all active:scale-95"
                        onClick={() => setShowAddModal(false)}
                      >
                          Batal
                      </button>
                      <button 
                        onClick={() => (document.querySelector('form') as HTMLFormElement).requestSubmit()}
                        disabled={isSubmitting}
                        className="flex-[2] flex items-center justify-center px-4 py-3 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                          {isSubmitting ? 'MEMPROSES...' : (isEditMode ? 'SIMPAN PERUBAHAN' : 'DAFTARKAN SANTRI')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center lg:pl-64 lg:pt-16 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setShowImportModal(false)}
          >
              <div 
                className="bg-white rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden cursor-default border border-white/20 animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="px-6 py-3.5 border-b border-slate-50 flex justify-between items-center bg-[#FCFDFE]">
                      <div>
                          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-500" />
                              Import Progress
                          </h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Memproses Data Santri</p>
                      </div>
                      <button 
                        onClick={() => setShowImportModal(false)} 
                        className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                          <X className="w-3.5 h-3.5" />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Memproses data...</span>
                              <span className="text-[10px] font-black text-slate-600 tabular-nums">
                                  {importProgress.current} / {importProgress.total}
                              </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${(importProgress.current / (importProgress.total || 1)) * 100}%` }}
                              />
                          </div>
                          <div className="flex justify-end">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                  {Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%
                              </span>
                          </div>
                      </div>

                      {/* Error Log */}
                      {importProgress.errors.length > 0 && (
                          <div className="bg-red-50 rounded-[16px] p-4 max-h-48 overflow-y-auto border border-red-100 scrollbar-hide">
                              <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 mb-2.5">
                                  <Info className="w-3.5 h-3.5" /> Log Kesalahan
                              </h4>
                              <ul className="space-y-1.5">
                                  {importProgress.errors.map((err, i) => (
                                      <li key={i} className="text-[10px] font-bold text-red-500 leading-tight">• {err}</li>
                                  ))}
                              </ul>
                          </div>
                      )}

                      {/* Done State */}
                      {importProgress.current === importProgress.total && importProgress.total > 0 && (
                          <div className="space-y-4">
                              <div className="bg-emerald-50 p-4 rounded-[16px] flex gap-3 items-center border border-emerald-100">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                                  <div>
                                      <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Proses Selesai</p>
                                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{importProgress.total - importProgress.errors.length} santri berhasil ditambahkan.</p>
                                  </div>
                              </div>
                              <button 
                                className="w-full py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 shadow-sm"
                                onClick={() => setShowImportModal(false)}
                              >
                                  Tutup Panel
                              </button>
                          </div>
                      )}

                      {/* Error-only State (no rows processed) */}
                      {importProgress.total === 0 && importProgress.errors.length > 0 && (
                          <button 
                            className="w-full py-3 border-2 border-red-100 bg-red-50 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:bg-red-100 transition-all active:scale-95"
                            onClick={() => setShowImportModal(false)}
                          >
                              Tutup
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}
      {/* Info Modal */}
      {infoStudent && (
          <InfoModal 
            student={infoStudent} 
            onClose={() => setInfoStudent(null)} 
          />
      )}

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
                Hapus santri <strong>{studentToDelete?.full_name}</strong>?
                {studentToDelete?.nis && (
                    <span className="text-slate-400 text-[9px] block mb-1 uppercase tracking-tighter">NIS: {studentToDelete.nis}</span>
                )}
                <span className="text-red-600 font-bold text-[10px] block mt-2">
                    Catatan: Akun orang tua tidak akan dihapus otomatis.
                </span>
            </span>
        }
      />

      {/* SHARED COMPONENT MODALS */}
      <AchievementModal isOpen={isAchievementModalOpen} onClose={() => setIsAchievementModalOpen(false)} student={selectedModalStudent} user={currentUser} onUpdate={fetchData} />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} student={selectedModalStudent} user={currentUser} onUpdate={fetchData} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} student={selectedModalStudent} />
      <GlobalTrackingModal isOpen={isGlobalTrackingOpen} onClose={() => setIsGlobalTrackingOpen(false)} tenantId={tenantId} />
    </div>
  );
};

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);
