
import React from 'react';
import { Activity, X } from 'lucide-react';
import { MemorizationRecord, Student, MemorizationStatus, MemorizationType } from '../../types';

interface RecentActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: MemorizationRecord[];
    students: Student[];
}

export const RecentActivityModal: React.FC<RecentActivityModalProps> = ({ isOpen, onClose, records, students }) => {
    if (!isOpen) return null;

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
                             <Activity className="w-4 h-4 text-jade-500" />
                             Semua Aktivitas Setoran
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Log aktivitas hafalan santri</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-white">
                    {records.length > 0 ? (
                        <div className="space-y-2">
                            {records.map(rec => {
                                const student = students.find(s => s.id === rec.student_id);
                                return (
                                    <div key={rec.id} className="flex items-start p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                                        <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 shrink-0 shadow-sm ${rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-500 ring-4 ring-emerald-50' : rec.status === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-500 ring-4 ring-amber-50' : 'bg-rose-500 ring-4 ring-rose-50'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{student?.full_name || 'Santri'}</p>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(rec.record_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                                                {(() => {
                                                    const rawStatus = String(rec.status || rec.keterangan || '').toUpperCase().replace(/_/g, ' ').trim();
                                                    const isTidakSetor = rawStatus.includes('SETOR') && (rawStatus.includes('TIDAK') || rawStatus.includes('BELUM'));
                                                    
                                                    if (isTidakSetor) return null;

                                                    return rec.type === MemorizationType.SABAQ ? `${rec.ayat_end} Baris` : 
                                                           rec.type === MemorizationType.SABQI ? `${rec.ayat_end} Halaman` : 
                                                           `${rec.surah_name || '-'} • ${rec.ayat_start}-${rec.ayat_end}`;
                                                })()}
                                            </p>
                                            <div className="flex items-center mt-1.5 gap-2">
                                                <span className="text-[7px] font-black bg-white px-1.5 py-0.5 rounded-md border border-slate-100 text-slate-400 uppercase tracking-widest shadow-sm">{rec.type}</span>
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-widest ${
                                                    rec.status === MemorizationStatus.LANCAR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    rec.status === MemorizationStatus.TIDAK_LANCAR ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {rec.status === MemorizationStatus.LANCAR ? 'Lancar' : 
                                                     rec.status === MemorizationStatus.TIDAK_LANCAR ? 'Tidak Lancar' : 
                                                     'Tidak Setor'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-400 uppercase tracking-widest text-[9px] font-black opacity-60">Belum ada aktivitas setoran.</div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
