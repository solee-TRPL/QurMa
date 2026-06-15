import React from "react";
import { X } from "lucide-react";
import { Student, Halaqah, UserProfile } from "../../types";

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
  const pendingStudents = students.filter((s) => !doneSet.has(s.id));

  return (
    <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase text-slate-800">Belum Manzil Hari Ini</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Daftar santri yang belum setoran murojaah</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-slate-50/30">
          <div className="space-y-3">
            {pendingStudents.length > 0 ? (
              pendingStudents.map((student) => {
                const halaqah = halaqahs.find((h) => h.id === student.halaqah_id);
                const teacher = allUsers.find((u) => u.id === halaqah?.teacher_id);
                return (
                  <div key={student.id} className="bg-white p-3.5 rounded-xl border-2 border-slate-200 group hover:border-slate-300 transition-all shadow-none flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{student.full_name}</p>
                      </div>
                      <div className="flex items-center gap-2 pl-4">
                        <span className="text-[7.5px] font-black bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-500 uppercase tracking-widest">{halaqah?.name || "Tanpa Halaqah"}</span>
                        <span className="text-[7.5px] font-black text-jade-500 uppercase tracking-widest">{teacher?.full_name || "-"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Terakhir</p>
                      <div className="flex items-center shrink-0">
                        <span className="text-[7.5px] font-black bg-slate-50 text-slate-600 px-2 py-0.5 rounded border-2 border-slate-200 uppercase tracking-widest">
                          JUZ {student.current_juz}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 uppercase tracking-widest text-[9px] font-black opacity-60">Alhamdulillah, semua santri sudah setoran Manzil hari ini.</div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0 rounded-b-xl">
          <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border-2 border-slate-200 flex items-center justify-center">
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
