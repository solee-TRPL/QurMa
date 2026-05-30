
import React from 'react';
import { Trophy, X, Calendar } from 'lucide-react';
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
            case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'orange': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'purple': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'pink': return 'bg-pink-50 text-pink-600 border-pink-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div 
            className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-[9999] flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
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
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                Semua Pencapaian
                            </h3>
                            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Daftar prestasi santri</p>
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
                        {achievements.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 mb-2">
                                    <Trophy className="w-4 h-4 text-slate-300" />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Belum ada pencapaian</p>
                            </div>
                        ) : achievements.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border-2 border-slate-200 group hover:border-slate-300 transition-all shadow-none">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10.5px] font-black text-slate-800 uppercase tracking-tight leading-tight">{item.title}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Calendar className="w-2.5 h-2.5" />
                                            <span className="text-[7.5px] font-black uppercase tracking-widest leading-none">
                                                {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'}).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
