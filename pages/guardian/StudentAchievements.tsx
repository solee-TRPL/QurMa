
import React, { useState, useEffect } from 'react';
import { UserProfile, Student, Achievement } from '../../types';
import { getStudents, getAchievements } from '../../services/dataService';
import { 
    Award, 
    Trophy, 
    Star, 
    Calendar,
    ChevronRight,
    Medal,
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export const StudentAchievements: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const allStudents = await getStudents(user.tenant_id!);
                const myStudent = allStudents.find(s => s.parent_id === user.id) || allStudents.find(s => s.id === user.id);
                if (myStudent) {
                    setStudent(myStudent);
                    const data = await getAchievements(myStudent.id);
                    setAchievements(data);
                }
            } catch (err) {
                console.error("Error fetching achievements", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );

    if (!student || achievements.length === 0) return (
        <div className="h-[calc(100vh-200px)] flex items-center justify-center">
            <EmptyState 
                message="Belum Ada Pencapaian" 
                description="Terus bersemangat dalam menghafal untuk mendapatkan apresiasi dan penghargaan."
                icon="award"
            />
        </div>
    );

    return (
        <div className="animate-fade-in pb-10">
            {/* <div className="flex flex-col mb-6 px-4 lg:px-8">
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-1">Daftar Pencapaian & Penghargaan</h3>
                <div className="h-[2px] w-12 bg-amber-500 rounded-full" />
            </div> */}

            <div className="grid grid-cols-1 gap-2">
                {achievements.map((ach, idx) => (
                    <div key={ach.id} className="bg-white border border-slate-100 px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-4">
                                <h4 className="text-[11px] lg:text-[12px] font-black text-slate-800 tracking-tight leading-none uppercase flex items-center gap-2">
                                    <span className="text-amber-500">
                                        {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}
                                    </span>
                                    Pencapaian: {ach.title}
                                </h4>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none shrink-0 ">
                                    {new Date(ach.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-[10px] lg:text-[11px] font-bold text-amber-600/60 uppercase tracking-widest leading-relaxed flex items-center gap-2">
                                Peringkat #{ach.rank} — Apresiasi Atas Dedikasi Dalam Menghafal Al-Qur'an
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
