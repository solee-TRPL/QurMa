import React, { useState, useEffect } from "react";
import { X, History, RefreshCw, Calendar, Info, GraduationCap, Fingerprint, User, MessageCircle, Home } from "lucide-react";
import { getStudentAssignmentHistory, AssignmentHistory } from "../../services/dataService";
import { getPhysicalLocation } from "../../lib/quranUtils";

export const HistoryModal = ({ isOpen, onClose, student }: { isOpen: boolean; onClose: () => void; student: any | null }) => {
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      if (student.assignment_history) {
        setHistory(student.assignment_history);
        setLoading(false);
      } else {
        setLoading(true);
        getStudentAssignmentHistory(student.id)
          .then(setHistory)
          .finally(() => setLoading(false));
      }
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-9999 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-none w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
              <History className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">Riwayat Pengampu</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4 max-72.5 custom-scrollbar bg-slate-50/20">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-30">
              <RefreshCw className="w-10 h-10 animate-spin mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Memuat Riwayat...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <History className="w-12 h-12 mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Belum ada riwayat tercetak</p>
            </div>
          ) : (
            history.map((h, idx) => (
              <div key={h.id} className="relative pl-6 pb-2 last:pb-0 border-l-2 border-slate-300 ml-2">
                <div className="absolute -left-2.25 top-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-jade-400 z-10" />
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-jade-700 tracking-tight uppercase leading-none">{h.teacher_name}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(h.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-400">S/D</span>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-2.5 h-2.5 text-rose-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          {h.end_date ? new Date(h.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : (student?.status === "alumni" || student?.graduated_year ? "LULUS" : "SAAT INI")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="bg-rose-50 px-2 py-1.5 rounded-xl border border-rose-100 flex flex-col items-center justify-center min-w-12.5 shadow-sm">
                        <span className="text-[12px] font-black text-rose-600 leading-none">{h.total_absences || 0}</span>
                        <span className="text-[6px] font-black text-rose-400 uppercase tracking-widest mt-1">Ketidakhadiran</span>
                      </div>
                      <div className="bg-jade-50 px-2.5 py-1.5 rounded-xl border border-jade-100 flex flex-col items-center justify-center min-w-16 shadow-sm">
                        <div className="flex items-center gap-1.5 justify-center text-jade-700">
                          {(() => {
                            const lines = h.total_sabaq_lines || 0;
                            if (!lines) return <span className="text-[12px] font-black leading-none">0</span>;
                            const juz = Math.floor(lines / 300);
                            const rem = lines % 300;
                            const hal = Math.floor(rem / 15);
                            const brs = rem % 15;
                            return (
                              <>
                                {juz > 0 && (
                                  <span className="flex items-baseline gap-0.5">
                                    <span className="text-[12px] font-black leading-none">{juz}</span>
                                    <span className="text-[8px] font-bold opacity-70">Juz</span>
                                  </span>
                                )}
                                {hal > 0 && (
                                  <span className="flex items-baseline gap-0.5">
                                    <span className="text-[12px] font-black leading-none">{hal}</span>
                                    <span className="text-[8px] font-bold opacity-70">Hal</span>
                                  </span>
                                )}
                                {(brs > 0 || (juz === 0 && hal === 0)) && (
                                  <span className="flex items-baseline gap-0.5">
                                    <span className="text-[12px] font-black leading-none">{brs}</span>
                                    <span className="text-[8px] font-bold opacity-70">Baris</span>
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-[6px] font-black text-jade-400 uppercase tracking-widest mt-1">Total Sabaq</span>
                      </div>
                      <div className="bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100 flex flex-col items-center justify-center min-w-16 shadow-sm">
                        <div className="flex items-center gap-1.5 justify-center text-blue-700">
                          {(() => {
                            if (h.last_surah && h.last_ayat !== undefined) {
                              const loc = getPhysicalLocation(h.last_surah, h.last_ayat);
                              if (loc) {
                                return (
                                  <>
                                    <span className="flex items-baseline gap-1">
                                      <span className="text-[8px] font-bold opacity-70">Juz</span>
                                      <span className="text-[12px] font-black leading-none">{31 - loc.juz}</span>
                                    </span>
                                  </>
                                );
                              }
                            }
                            return <span className="text-[12px] font-black leading-none"></span>;
                          })()}
                        </div>
                        <span className="text-[6px] font-black text-blue-400 uppercase tracking-widest mt-1">Juz Saat Ini</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-50 text-center">
          <button onClick={onClose} className="text-[10px] font-black text-jade-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};

export const InfoModal = ({ student, onClose }: { student: any; onClose: () => void }) => {
    return (
      <div className="fixed top-16 lg:left-64 left-0 right-0 bottom-0 z-150 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-800" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-none w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">Informasi Detail</h3>
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Kontak Santri / Wali</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2.5 overflow-y-auto custom-scrollbar">
            {/* Section 1: Data Utama - Compact Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Nama</p>
                  <div className="relative group/name">
                    <p className="text-[11px] font-black text-slate-800 leading-none truncate cursor-help">{student.full_name !== "-" ? student.full_name : ""}</p>
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover/name:block z-10000 w-max max-50 bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      {student.full_name !== "-" ? student.full_name : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                  <Fingerprint className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NIS</p>
                  <p className="text-[11px] font-mono font-black text-slate-800 leading-none truncate uppercase tracking-tighter">{student.nis !== "-" ? student.nis : ""}</p>
                </div>
              </div>
            </div>

            {/* NIK */}
            <div className="p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                <Fingerprint className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NIK</p>
                <p className="text-[11px] font-mono font-black text-slate-800 leading-none truncate tracking-tighter">{student.nik !== "-" ? student.nik : ""}</p>
              </div>
            </div>

            {/* Section 2: Orang Tua */}
            <div className="grid grid-cols-1 gap-2">
              {/* BAPAK BOX */}
              <div className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Bapak</p>
                    <div className="relative group/bapak">
                      <p className="text-[11px] font-bold text-slate-800 leading-none truncate cursor-help">{student.father_name !== "-" ? student.father_name : ""}</p>
                      <div className="absolute left-0 bottom-full mb-1 hidden group-hover/bapak:block z-10000 w-max max-50 bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                        {student.father_name !== "-" ? student.father_name : ""}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                  <MessageCircle className="w-2.5 h-2.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-700 font-mono tracking-tighter">{student.father_phone !== "-" ? student.father_phone : ""}</span>
                </div>
              </div>

              {/* IBU BOX */}
              <div className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50/30 rounded-xl border-2 border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Ibu</p>
                    <div className="relative group/ibu">
                      <p className="text-[11px] font-bold text-slate-800 leading-none truncate cursor-help">{student.mother_name !== "-" ? student.mother_name : ""}</p>
                      <div className="absolute left-0 bottom-full mb-1 hidden group-hover/ibu:block z-10000 w-max max-50 bg-slate-800 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                        {student.mother_name !== "-" ? student.mother_name : ""}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                  <MessageCircle className="w-2.5 h-2.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-700 font-mono tracking-tighter">{student.mother_phone !== "-" ? student.mother_phone : ""}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Alamat */}
            <div className="flex items-start gap-3 p-3 bg-slate-50/30 rounded-xl border-2 border-slate-100 min-17.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-none border border-slate-100 shrink-0">
                <Home className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Alamat Lengkap</p>
                <p className="text-[10px] font-bold text-slate-600 leading-normal wrap-wrap-break-words uppercase">
                  {[
                    student.address,
                    student.rt_rw && student.rt_rw !== "-" ? (student.rt_rw.includes("/") ? `RT ${student.rt_rw.split("/")[0].trim()} / RW ${student.rt_rw.split("/")[1].trim()}` : `RT/RW ${student.rt_rw}`) : "",
                    student.village && student.village !== "-" ? `Kel. ${student.village}` : "",
                    student.district && student.district !== "-" ? `Kec. ${student.district}` : "",
                    student.city,
                    student.province,
                  ]
                    .filter((val) => val && val !== "-")
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

