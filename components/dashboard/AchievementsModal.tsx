
import React from 'react';
import { Trophy, X } from 'lucide-react';
import { Achievement } from '../../types';

interface AchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, achievements }) => {
    if (!isOpen) return null;

    const getColorClass = (color?: string) => {
        switch (color) {
            case 'emerald': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'orange': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'pink': return 'bg-pink-50 text-pink-600 border-pink-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
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
                             <Trophy className="w-4 h-4 text-amber-500" />
                             Semua Pencapaian
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Daftar prestasi santri</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh]">
                    <div className="space-y-2">
                        {achievements.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border-2 border-white shadow-sm shrink-0 ${getColorClass(item.color)}`}>
                                    {item.rank}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-tight">{item.title}</p>
                                    <p className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}</p>
                                </div>
                            </div>
                        ))}
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
