import React, { useEffect, useState } from "react";
import { Calendar, X } from "lucide-react";
import { ExamSchedule } from "../../types";
import { getExamSchedules } from "../../services/dataService";

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export const ExamScheduleModal: React.FC<ExamModalProps> = ({ isOpen, onClose, studentId }) => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getExamSchedules(studentId).then((data) => {
        setSchedules(data);
        setLoading(false);
      });
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300" onClick={(e) => e.stopPropagation()}>
        {/* Standardized Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase flex items-center gap-2">
                Jadwal Ujian & Tasmi'
              </h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Agenda ujian & evaluasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-slate-50/30">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-[10px] font-black uppercase tracking-widest">Memuat...</p>
            </div>
          ) : schedules.length > 0 ? (
            <div className="space-y-2.5">
              {schedules.map((exam) => (
                <div key={exam.id} className="p-3.5 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-between group hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg border-2 border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-amber-600 leading-none">{new Date(exam.date).toLocaleDateString("id-ID", { day: "2-digit" })}</span>
                      <span className="text-[7px] font-black text-amber-400 uppercase leading-none mt-1">{new Date(exam.date).toLocaleDateString("id-ID", { month: "short" }).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{exam.title}</p>
                      <p className="text-[7.5px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">
                        {exam.location} • {exam.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border-2 ${
                      exam.status === "upcoming" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}
                  >
                    {exam.status === "upcoming" ? "UJIAN" : "SELESAI"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-300 uppercase tracking-widest text-[9px] font-black opacity-60">Belum ada jadwal.</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
