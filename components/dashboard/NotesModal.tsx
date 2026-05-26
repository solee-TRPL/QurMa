
import React, { useState } from 'react';
import { MessageSquare, X, Calendar, User, Reply, Send, MessageCircle, CheckCircle2, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { TeacherNote, UserProfile } from '../../types';
import { replyStudentNote, deleteNoteReply } from '../../services/dataService';
import { useNotification } from '../../lib/NotificationContext';

interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    notes: TeacherNote[];
    user: UserProfile;
    onRefresh?: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, notes, user, onRefresh }) => {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const toggleExpand = (id: string) => {
        setExpandedNoteId(prev => prev === id ? null : id);
    };

    if (!isOpen) return null;

    const handleReplySubmit = async (noteId: string) => {
        if (!replyContent.trim()) return;
        setSubmittingReply(true);
        try {
            await replyStudentNote(noteId, replyContent, user);
            addNotification({
                type: 'success',
                title: 'Berhasil',
                message: 'Pesan balasan Anda telah berhasil disimpan.'
            });
            setReplyContent('');
            setReplyingTo(null);
            setExpandedNoteId(noteId);
            if (onRefresh) onRefresh();
        } catch (err) {
            addNotification({
                type: 'error',
                title: 'Gagal',
                message: 'Terjadi kesalahan saat menyimpan balasan.'
            });
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleDeleteReply = async (noteId: string) => {
        if (!window.confirm('Hapus balasan ini?')) return;
        setSubmittingReply(true);
        try {
            await deleteNoteReply(noteId, user);
            addNotification({
                type: 'success',
                title: 'Terhapus',
                message: 'Balasan Anda telah berhasil dihapus.'
            });
            if (onRefresh) onRefresh();
        } catch (err) {
            addNotification({
                type: 'error',
                title: 'Gagal Menghapus',
                message: 'Terjadi kesalahan saat menghapus balasan.'
            });
        } finally {
            setSubmittingReply(false);
        }
    };

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Standardized Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-[11px] font-black uppercase flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-jade-500" />
                                Catatan Untuk Santri
                            </h3>
                            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Pesan & evaluasi dari ustadz</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-slate-50/30">
                    <div className="space-y-2.5">
                        {notes.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
                                <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada catatan</p>
                            </div>
                        ) : notes.map((note) => {
                            const hasReply = !!note.reply_content;
                            const isExpanded = expandedNoteId === note.id;
                            
                            return (
                                <div 
                                    key={note.id} 
                                    className={`group relative z-10 hover:z-50 flex flex-col bg-white p-2.5 rounded-lg border border-slate-200 transition-all hover:shadow-sm hover:border-slate-300 ${hasReply ? 'cursor-pointer' : ''}`}
                                    onClick={() => hasReply && toggleExpand(note.id)}
                                >
                                    <div className="flex justify-between items-center mb-2 relative">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-1.5 py-0.5 text-[6px] font-black uppercase tracking-widest rounded border ${
                                                note.category === 'Motivasi' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                note.category === 'Evaluasi' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                note.category === 'Perilaku' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                                {note.category || 'Catatan'}
                                            </span>
                                            <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-0.5">
                                                <Calendar className="w-2 h-2 opacity-60" />
                                                {note.date ? new Date(note.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!hasReply ? (
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setReplyContent('');
                                                        setReplyingTo(replyingTo === note.id ? null : note.id); 
                                                    }}
                                                    className={`p-1 rounded transition-all border ${replyingTo === note.id ? 'bg-jade-600 text-white border-jade-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-jade-600 hover:border-jade-200'}`}
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                </button>
                                            ) : (
                                                <div className={`p-0.5 rounded transition-all duration-300 ${isExpanded ? 'rotate-180 bg-jade-50' : 'bg-slate-50'}`}>
                                                    <ChevronDown className={`w-3 h-3 ${isExpanded ? 'text-jade-600' : 'text-slate-400'}`} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p className="text-[8.5px] font-black text-slate-700 leading-snug tracking-tight uppercase mb-2 px-0.5">
                                        {note.content}
                                    </p>
                                    
                                    <div className="flex justify-between items-end mt-auto pt-1.5 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                <User className="w-2 h-2" />
                                            </div>
                                            <div className="flex flex-col">
                                                {(() => {
                                                    const displayName = note.teacher_name || 'Admin';
                                                    let name = displayName;
                                                    let role = '';
                                                    if (displayName.includes('|')) {
                                                        const parts = displayName.split('|');
                                                        name = parts[0].trim();
                                                        role = parts[1].trim();
                                                    }
                                                    return (
                                                        <>
                                                            <span className="text-[7.5px] font-bold text-slate-700 uppercase tracking-tight leading-none">{name}</span>
                                                            {role && <span className="text-[5.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{role}</span>}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {hasReply && (
                                            <div className="flex items-center gap-1 bg-jade-50 px-1 py-0.5 rounded border border-jade-100">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-jade-500" />
                                                <span className="text-[6px] font-black text-jade-600 uppercase tracking-tight">Dibalas</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Expanded Reply Section with Edit/Delete */}
                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="pl-3 border-l-2 border-jade-200 bg-jade-50/30 py-2 rounded-r-xl relative group/reply">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[7.5px] font-black text-jade-500 uppercase tracking-widest block">Balasan Anda:</span>
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReplyContent(note.reply_content || '');
                                                                setReplyingTo(note.id);
                                                            }}
                                                            className="p-1 hover:bg-jade-100 rounded text-jade-600 transition-colors"
                                                            title="Edit Balasan"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteReply(note.id);
                                                            }}
                                                            className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                                                            title="Hapus Balasan"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[9.5px] font-black text-jade-700 leading-tight">"{note.reply_content}"</p>
                                            </div>
                                        </div>
                                    </div>

                                    {replyingTo === note.id && (
                                        <div className="mt-2 animate-in slide-in-from-top-1 duration-200" onClick={e => e.stopPropagation()}>
                                            <textarea 
                                                autoFocus
                                                value={replyContent}
                                                onChange={e => setReplyContent(e.target.value)}
                                                placeholder="Tulis balasan..."
                                                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 outline-none focus:bg-white focus:border-jade-400 focus:ring-4 focus:ring-jade-50/50 min-17.5 resize-none"
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button 
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyContent('');
                                                    }} 
                                                    className="bg-red-600 px-3 py-1.5 text-[8.5px] font-black text-white uppercase tracking-widest transition-all"
                                                >
                                                    Batal
                                                </button>
                                                <button 
                                                    disabled={!replyContent.trim() || submittingReply}
                                                    onClick={() => handleReplySubmit(note.id)}
                                                    className="bg-jade-600 text-white px-4 py-1.5 rounded-lg text-[8.5px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-jade-100/50 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                                                >
                                                    {submittingReply ? 'Menyimpan...' : (note.reply_content ? 'Update' : 'Kirim')}
                                                    {!submittingReply && <Send className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
