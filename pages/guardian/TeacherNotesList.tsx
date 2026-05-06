
import React, { useState, useEffect } from 'react';
import { UserProfile, Student, TeacherNote } from '../../types';
import { getStudents, getStudentNotes, replyStudentNote } from '../../services/dataService';
import { 
    MessageSquare, 
    Calendar,
    User,
    Tag,
    ChevronRight,
    ChevronDown,
    Quote,
    Reply,
    Send,
    MessageCircle,
    CheckCircle2
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useNotification } from '../../lib/NotificationContext';

export const TeacherNotesList: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [notes, setNotes] = useState<TeacherNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const toggleExpand = (id: string) => {
        setExpandedNoteId(prev => prev === id ? null : id);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const allStudents = await getStudents(user.tenant_id!);
            const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents.find(s => s.id === user.id);
            if (myStudent) {
                setStudent(myStudent);
                const data = await getStudentNotes(myStudent.id);
                setNotes(data);
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
                type: 'success',
                title: 'Balasan Terkirim',
                message: 'Pesan balasan Anda telah berhasil dikirim ke ustadz.'
            });
            setReplyContent('');
            setReplyingTo(null);
            // Auto expand the new reply
            setExpandedNoteId(noteId);
            await fetchData();
        } catch (err) {
            addNotification({
                type: 'error',
                title: 'Gagal Mengirim',
                message: 'Terjadi kesalahan saat mengirim balasan.'
            });
        } finally {
            setSubmittingReply(false);
        }
    };

    if (loading) return (
        <div className="space-y-4 animate-fade-in">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <Skeleton className="h-4 w-1/4 mb-4" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            ))}
        </div>
    );

    if (notes.length === 0) {
        return (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center animate-fade-in">
                <EmptyState 
                    message="Belum Ada Catatan" 
                    description="Pesan evaluasi, motivasi, atau informasi penting dari sekolah akan muncul di sini."
                    icon="message"
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10">
            <div className="grid grid-cols-1 gap-2">
                {notes.map((note) => {
                    const isAdmin = note.teacher_name.toLowerCase().includes('admin') || note.teacher_name.toLowerCase().includes('sekolah');
                    const hasReply = !!note.reply_content;
                    const isExpanded = expandedNoteId === note.id;
                    
                    return (
                        <div 
                            key={note.id} 
                            className={`bg-white border border-slate-100 px-6 py-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${hasReply ? 'cursor-pointer' : ''}`}
                            onClick={() => hasReply && toggleExpand(note.id)}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-[11px] lg:text-[12px] font-black text-slate-800 tracking-tight leading-none uppercase">
                                            {isAdmin ? 'Sekolah' : 'Pembimbing'}: {note.teacher_name}
                                        </h4>
                                        {hasReply && (
                                            <div className="flex items-center gap-1 bg-jade-50 px-2 py-0.5 rounded-lg border border-jade-100 shadow-sm">
                                                <span className="text-[7px] font-black text-jade-600 uppercase tracking-tighter">Terbalas</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none shrink-0">
                                            {new Date(note.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        
                                        {!hasReply ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (replyingTo === note.id) {
                                                        setReplyingTo(null);
                                                    } else {
                                                        setReplyingTo(note.id);
                                                        setReplyContent('');
                                                    }
                                                }}
                                                className={`p-1.5 rounded-lg transition-all ${
                                                    replyingTo === note.id 
                                                    ? 'bg-jade-50 text-jade-600 ring-1 ring-jade-100' 
                                                    : 'text-slate-300 hover:bg-slate-50 hover:text-jade-500'
                                                }`}
                                                title="Balas Catatan"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <div className={`p-1.5 rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-jade-50 border-jade-100' : 'group-hover:border-slate-200'}`}>
                                                <ChevronDown className={`w-3.5 h-3.5 transition-colors ${isExpanded ? 'text-jade-600' : 'text-slate-500'}`} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    {note.content}
                                </p>

                                <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="pl-4 bg-jade-50/20 py-2 rounded-r-xl border-l-2 border-jade-100/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Reply className="w-3 h-3 text-jade-400 rotate-180" />
                                                <span className="text-[8px] font-black text-jade-500 uppercase tracking-widest">Balasan Anda:</span>
                                            </div>
                                            <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{note.reply_content}</p>
                                            {note.replied_at && (
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {new Date(note.replied_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {replyingTo === note.id && (
                                    <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                                        <div className="relative">
                                            <textarea 
                                                autoFocus
                                                value={replyContent}
                                                onChange={e => setReplyContent(e.target.value)}
                                                placeholder="Tulis balasan Anda di sini..."
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-jade-50 focus:border-jade-400 transition-all min-h-[80px] resize-none"
                                            />
                                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                <button 
                                                    onClick={() => setReplyingTo(null)}
                                                    className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    Batal
                                                </button>
                                                <button 
                                                    disabled={!replyContent.trim() || submittingReply}
                                                    onClick={() => handleReplySubmit(note.id)}
                                                    className="px-4 py-1.5 bg-jade-600 text-white rounded-lg shadow-md shadow-jade-100 hover:bg-jade-700 disabled:opacity-50 transition-all flex items-center gap-2 group active:scale-95"
                                                >
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Kirim</span>
                                                    <Send className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
