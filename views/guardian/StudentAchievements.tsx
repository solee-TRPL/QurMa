import React, { useState, useEffect } from "react";
import { UserProfile, Student, Achievement } from "../../types";
import { getStudents, getAchievements } from "../../services/dataService";
import { Award, Trophy, Star, Calendar, ChevronRight, Medal } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";

export const StudentAchievements: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allStudents = await getStudents(user.tenant_id!);
        const myStudent = allStudents.find((s) => s.parent_id === user.id) || allStudents.find((s) => s.id === user.id);
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

  if (loading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-32px p-6 border border-slate-100 shadow-sm">
            <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );

  if (!student || achievements.length === 0)
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <EmptyState message="Belum Ada Pencapaian" description="Terus bersemangat dalam menghafal untuk mendapatkan apresiasi dan penghargaan." icon="award" />
      </div>
    );

  return (
    <div className="animate-fade-in pb-10">
      {/* <div className="flex flex-col mb-6 px-4 lg:px-8">
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-1">Daftar Pencapaian & Penghargaan</h3>
                <div className="h-0.5 w-12 bg-amber-500 rounded-full" />
            </div> */}

      <div className="grid grid-cols-1 gap-2">
        {achievements.map((ach, idx) => (
          <div key={ach.id} className="group relative z-10 hover:z-50 flex flex-col bg-white p-3.5 rounded-xl border border-slate-200 transition-all hover:shadow-sm hover:border-slate-300">
            <div className="flex justify-between items-start mb-2 relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-amber-500 border border-slate-200">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[9.5px] font-black text-slate-700 uppercase tracking-tight leading-none">Pencapaian Baru</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mr-2">
                  <Calendar className="w-2.5 h-2.5 opacity-60" />
                  {new Date(ach.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-1.5 lg:gap-2 pt-2 border-t border-slate-50">
              <span className="shrink-0 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border lg:mt-0.5 bg-amber-50 text-amber-600 border-amber-100 w-max">PENGHARGAAN</span>
              <p className="text-[10px] font-black text-slate-700 leading-snug tracking-tight uppercase lg:px-0.5 lg:pt-0.5 flex-1">{ach.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
