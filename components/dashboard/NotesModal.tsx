
import React, { useState } from 'react';
import { MessageSquare, X, Calendar, User, Reply, Send, MessageCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { TeacherNote, UserProfile } from '../../types';
import { replyStudentNote } from '../../services/dataService';
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
                title: 'Balasan Terkirim',
                message: 'Pesan balasan Anda telah berhasil dikirim.'
            });
            setReplyContent('');
            setReplyingTo(null);
            setExpandedNoteId(noteId);
            if (onRefresh) onRefresh();
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

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-[9999] flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 shadow-primary-100/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <MessageSquare className="w-4 h-4 text-jade-500" />
                             Catatan Untuk Santri
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pesan dan evaluasi dari guru/admin</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-slate-50/20">
                    <div className="space-y-2">
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
                                    className={`flex flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${hasReply ? 'cursor-pointer' : ''}`}
                                    onClick={() => hasReply && toggleExpand(note.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-sm shrink-0 mt-0.5 ${
                                            note.category === 'Motivasi' ? 'bg-emerald-50 text-emerald-600' :
                                            note.category === 'Evaluasi' ? 'bg-amber-50 text-amber-600' :
                                            note.category === 'Perilaku' ? 'bg-rose-50 text-rose-600' :
                                            'bg-slate-50 text-slate-600'
                                        }`}>
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[6.5px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-lg border ${
                                                        note.category === 'Motivasi' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' :
                                                        note.category === 'Evaluasi' ? 'bg-amber-50/50 text-amber-600 border-amber-100' :
                                                        note.category === 'Perilaku' ? 'bg-rose-50/50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                        {note.category || 'Catatan'}
                                                    </span>
                                                    {hasReply && (
                                                        <div className="flex items-center gap-0.5 bg-jade-50 px-1 py-0.5 rounded-md border border-jade-100">
                                                            <CheckCircle2 className="w-2 h-2 text-jade-500" />
                                                            <span className="text-[6px] font-black text-jade-600 uppercase">Terbalas</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">
                                                        {note.date ? new Date(note.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                                    </span>
                                                    {!hasReply ? (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setReplyingTo(replyingTo === note.id ? null : note.id); }}
                                                            className={`p-1 rounded-lg transition-all ${replyingTo === note.id ? 'bg-jade-50 text-jade-600' : 'text-slate-300 hover:text-jade-500'}`}
                                                        >
                                                            <MessageCircle className="w-3 h-3" />
                                                        </button>
                                                    ) : (
                                                        <div className={`p-1 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-jade-50 rounded-lg' : ''}`}>
                                                            <ChevronDown className={`w-3.5 h-3.5 ${isExpanded ? 'text-jade-600' : 'text-slate-400'}`} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-normal mb-1">{note.content}</p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest opacity-60 italic">Dari: {note.teacher_name || 'Admin'}</p>
                                        </div>
                                    </div>

                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="pl-3 border-l-2 border-jade-100 bg-jade-50/20 py-1.5 rounded-r-xl">
                                                <span className="text-[7px] font-black text-jade-500 uppercase tracking-widest block mb-0.5">Balasan:</span>
                                                <p className="text-[9px] font-bold text-jade-700 italic opacity-80 leading-tight">"{note.reply_content}"</p>
                                            </div>
                                        </div>
                                    </div>

                                    {replyingTo === note.id && (
                                        <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                                            <textarea 
                                                autoFocus
                                                value={replyContent}
                                                onChange={e => setReplyContent(e.target.value)}
                                                placeholder="Balas catatan..."
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-jade-50 focus:border-jade-400 min-h-[60px] resize-none"
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setReplyingTo(null)} className="text-[8px] font-black text-slate-400 uppercase">Batal</button>
                                                <button 
                                                    disabled={!replyContent.trim() || submittingReply}
                                                    onClick={() => handleReplySubmit(note.id)}
                                                    className="bg-jade-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-sm shadow-jade-100"
                                                >
                                                    Kirim <Send className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
