
import React, { useEffect, useState } from 'react';
import { getExamSchedules, getStudents } from '../../services/dataService';
import { ExamSchedule, MemorizationStatus, UserProfile } from '../../types';
import { AlertCircle, Award, Calendar, CheckCircle, Clock, FileText, User, Search, X, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

// --- Local Modal for Exam History ---
const ExamHistoryModal: React.FC<{ isOpen: boolean; onClose: () => void; exams: ExamSchedule[] }> = ({ isOpen, onClose, exams }) => {
    if (!isOpen) return null;

    const getVerdictBadge = (verdict?: MemorizationStatus) => {
        if (!verdict) return <span className="text-slate-400 text-[10px] italic">Belum dinilai</span>;
        switch(verdict) {
            case MemorizationStatus.LANCAR: return <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">Lancar</span>;
            case MemorizationStatus.TIDAK_LANCAR: return <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">Tidak Lancar</span>;
            case MemorizationStatus.TIDAK_SETOR: return <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">Tidak Setor</span>;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-primary-600" />
                        Semua Hasil Ujian
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-4">
                    {exams.map(exam => (
                        <div key={exam.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:border-primary-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{exam.title}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {new Date(exam.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                {exam.status === 'completed' && exam.score !== undefined ? (
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-800">{exam.score}</div>
                                        {getVerdictBadge(exam.verdict)}
                                    </div>
                                ) : (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">Akan Datang</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3 mt-3">
                                <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {exam.examiner_name}</span>
                                {exam.notes && <span className="text-slate-400 italic">• "{exam.notes}"</span>}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-right shrink-0">
                    <Button variant="secondary" onClick={onClose}>Tutup</Button>
                </div>
            </div>
        </div>
    );
};

export const StudentExamResults: React.FC<{ user?: UserProfile }> = ({ user }) => {
    const [exams, setExams] = useState<ExamSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchExams = async () => {
            setLoading(true);
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const allStudents = await getStudents(user.tenant_id);
                const myStudent = allStudents.find(s => s.parent_id === user.id);

                if (myStudent) {
                    setStudentName(myStudent.full_name);
                    const data = await getExamSchedules(myStudent.id);
                    const sorted = data.sort((a, b) => {
                        // Priority: Upcoming soonest, then Completed most recent
                        if (a.status !== 'completed' && b.status === 'completed') return -1;
                        if (a.status === 'completed' && b.status !== 'completed') return 1;
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    });
                    setExams(sorted);
                } else {
                    setExams([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [user]);

    const displayedExams = exams.slice(0, 3);
    const hasMoreExams = exams.length > 3;

    const getCompactVerdict = (verdict?: MemorizationStatus) => {
        if (!verdict) return null;
        switch(verdict) {
            case MemorizationStatus.LANCAR: return <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Lancar</span>;
            case MemorizationStatus.TIDAK_LANCAR: return <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">Tidak Lancar</span>;
            case MemorizationStatus.TIDAK_SETOR: return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Tidak Setor</span>;
            default: return null;
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat data ujian...</div>;

    if (!studentName && !loading && exams.length === 0) {
        return (
             <div className="h-[calc(100vh-140px)] flex items-center justify-center animate-fade-in">
                <EmptyState 
                    message="Tidak ada santri terhubung." 
                    description="Silakan hubungi admin sekolah untuk menautkan akun Anda dengan data santri."
                    icon="user"
                />
             </div>
        );
    }

    return (
        <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -z-10" />
            
            <div className="bg-white/40 backdrop-blur-md p-10 rounded-[32px] border border-white/20 shadow-xl shadow-indigo-100/20 text-center max-w-sm relative z-10 transition-all hover:scale-[1.02] duration-500">
                <div className="w-20 h-20 bg-indigo-600 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200 animate-bounce-slow">
                    <Award className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em] mb-3">Nilai Ujian</h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-[2.5px] w-6 bg-indigo-100 rounded-full" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Segera Hadir</p>
                    <div className="h-[2.5px] w-6 bg-indigo-100 rounded-full" />
                </div>
                
                <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                    Fitur evaluasi hasil ujian kumulatif sedang dalam tahap sinkronisasi data kurikulum.
                </p>
                
                <div className="mt-8 flex justify-center">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                <User className="w-4 h-4 text-slate-300" />
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center">
                            <span className="text-[8px] font-black text-indigo-600">+99</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
                QurMa Administrative Intelligence
            </p>
        </div>
    );
};
