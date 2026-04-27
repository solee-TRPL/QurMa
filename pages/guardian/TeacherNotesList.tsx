
import React, { useState, useEffect } from 'react';
import { UserProfile, Student, TeacherNote } from '../../types';
import { getStudents, getStudentNotes } from '../../services/dataService';
import { 
    MessageSquare, 
    Calendar,
    User,
    Tag,
    ChevronRight,
    Quote
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export const TeacherNotesList: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [notes, setNotes] = useState<TeacherNote[]>([]);
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
                    const data = await getStudentNotes(myStudent.id);
                    setNotes(data);
                }
            } catch (err) {
                console.error("Error fetching notes", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

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

        <div className="h-[calc(100vh-200px)] flex items-center justify-center">
            <EmptyState 
                message="Belum Ada Catatan" 
                description="Pesan evaluasi, motivasi, atau informasi penting dari sekolah akan muncul di sini."
                icon="message"
            />
        </div>

    return (
        <div className="animate-fade-in pb-10">
            {/* <div className="flex flex-col mb-8">
                <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest mb-1.5 flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                     Catatan Untuk Santri
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none opacity-60">
                    Kumpulan pesan resmi dari pembimbing serta administrator
                </p>
            </div> */}

            <div className="grid grid-cols-1 gap-2">
                {notes.map((note) => {
                    const isAdmin = note.teacher_name.toLowerCase().includes('admin') || note.teacher_name.toLowerCase().includes('sekolah');
                    
                    return (
                        <div key={note.id} className="bg-white border border-slate-100 px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-4">
                                    <h4 className="text-[11px] lg:text-[12px] font-black text-slate-800 tracking-tight leading-none uppercase">
                                        {isAdmin ? 'Sekolah' : 'Pembimbing'}: {note.teacher_name}
                                    </h4>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none shrink-0 ">
                                        {new Date(note.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    {note.content}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
