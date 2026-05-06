
import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Student, Halaqah, UserProfile } from '../../types';

interface PendingManzilModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    doneIds: string[];
}

export const PendingManzilModal: React.FC<PendingManzilModalProps> = ({ isOpen, onClose, students, halaqahs, allUsers, doneIds }) => {
    if (!isOpen) return null;

    const doneSet = new Set(doneIds);
    const pendingStudents = students.filter(s => !doneSet.has(s.id));

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <AlertCircle className="w-4 h-4 text-rose-500" />
                             Belum Manzil Hari Ini
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Daftar santri yang belum setoran murojaah</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh]">
                    <div className="space-y-2">
                        {pendingStudents.length > 0 ? pendingStudents.map(student => {
                            const halaqah = halaqahs.find(h => h.id === student.halaqah_id);
                            const teacher = allUsers.find(u => u.id === halaqah?.teacher_id);
                            return (
                                <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xs font-black text-rose-500 uppercase border border-rose-100 group-hover:scale-110 transition-transform">
                                            {student.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{student.full_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {halaqah?.name || 'Tanpa Halaqah'}
                                                </span>
                                                <span className="text-[8px] font-black text-jade-400 uppercase tracking-widest flex items-center gap-0.5">
                                                    {teacher?.full_name || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">TERAKHIR</p>
                                        <p className="text-[10px] font-black text-slate-500">Juz {student.current_juz}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-16 text-center text-slate-400 uppercase tracking-widest text-[9px] font-black opacity-60">
                                Alhamdulillah, semua santri sudah setoran Manzil hari ini.
                            </div>
                        )}
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
