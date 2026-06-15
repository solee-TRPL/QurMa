import React from "react";
import { Activity, X } from "lucide-react";
import { MemorizationRecord, Student, MemorizationStatus, MemorizationType } from "../../types";

interface RecentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MemorizationRecord[];
  students: Student[];
}

export const RecentActivityModal: React.FC<RecentActivityModalProps> = ({ isOpen, onClose, records, students }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 bottom-0 left-0 lg:left-64 z-9999 flex items-center justify-center p-6 lg:p-14 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-2 border-slate-200" onClick={(e) => e.stopPropagation()}>
        {/* Standardized Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-[11px] font-black uppercase">Aktivitas Setoran</h3>
              <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Log riwayat hafalan terbaru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto scrollbar-hide max-h-[60vh] bg-slate-50/30">
          {records.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const filteredRecords = records.filter((rec) => {
                  const isValidStatus = rec.status === MemorizationStatus.LANCAR || rec.status === MemorizationStatus.TIDAK_LANCAR;
                  if (!isValidStatus) return false;

                  if (rec.type === MemorizationType.SABAQ || rec.type === MemorizationType.SABQI) {
                    return rec.ayat_end > 0;
                  }
                  return true;
                });

                const grouped = filteredRecords.reduce(
                  (acc, rec) => {
                    const dateStr = new Date(rec.record_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                    const key = `${rec.student_id}_${dateStr}`;
                    if (!acc[key]) acc[key] = { date: dateStr, student_id: rec.student_id, records: [] };
                    acc[key].records.push(rec);
                    return acc;
                  },
                  {} as Record<string, { date: string; student_id: string; records: typeof records }>,
                );

                return Object.values(grouped).map((group) => {
                  const student = students.find((s) => s.id === group.student_id);

                  // Determine overall status dot
                  const hasTidakSetor = group.records.some(
                    (r) =>
                      r.status === MemorizationStatus.TIDAK_SETOR ||
                      String(r.status || r.keterangan || "")
                        .toUpperCase()
                        .includes("TIDAK"),
                  );
                  const hasTidakLancar = group.records.some((r) => r.status === MemorizationStatus.TIDAK_LANCAR);
                  const dotColor = hasTidakSetor ? "bg-rose-500" : hasTidakLancar ? "bg-amber-500" : "bg-emerald-500";

                  return (
                    <div key={`${group.student_id}_${group.date}`} className="bg-white p-3.5 rounded-xl border-2 border-slate-200 group hover:border-slate-300 transition-all shadow-none">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{student?.full_name || "SANTRI"}</p>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{group.date}</span>
                      </div>

                      <div className="space-y-1.5">
                        {group.records.map((rec) => (
                          <div key={rec.id} className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex-1 min-20">
                              {(() => {
                                const rawStatus = String(rec.status || rec.keterangan || "")
                                  .toUpperCase()
                                  .replace(/_/g, " ")
                                  .trim();
                                const isTidakSetor = rawStatus.includes("SETOR") && (rawStatus.includes("TIDAK") || rawStatus.includes("BELUM"));

                                if (isTidakSetor) return "TIDAK SETOR";

                                return (() => {
                                  const amount = rec.ayat_end;
                                  const unit = rec.type === MemorizationType.SABAQ ? "BARIS" : rec.type === MemorizationType.SABQI ? "HALAMAN" : "";
                                  const surahPart = rec.surah_name ? `${rec.surah_name} : ${Math.min(rec.ayat_start, rec.ayat_end)}-${Math.max(rec.ayat_start, rec.ayat_end)}` : "";

                                  if (surahPart && unit)
                                    return (
                                      <div className="flex flex-wrap items-baseline gap-x-1.5 leading-relaxed">
                                        <span className="shrink-0">{surahPart}</span>
                                        <span className="whitespace-nowrap text-slate-400">
                                          ({amount} {unit})
                                        </span>
                                      </div>
                                    );
                                  if (surahPart) return surahPart;
                                  if (unit) return `${amount} ${unit}`;
                                  return "-";
                                })();
                              })()}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[7px] font-black bg-white px-1.5 py-0.5 rounded border-2 border-slate-200 text-slate-400 uppercase tracking-widest">{rec.type}</span>
                              <span
                                className={`text-[7px] font-black px-1.5 py-0.5 rounded border-2 uppercase tracking-widest ${
                                  rec.status === MemorizationStatus.LANCAR
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : rec.status === MemorizationStatus.TIDAK_LANCAR
                                      ? "bg-amber-50 text-amber-600 border-amber-200"
                                      : "bg-rose-50 text-rose-600 border-rose-200"
                                }`}
                              >
                                {rec.status === MemorizationStatus.LANCAR ? "LANCAR" : rec.status === MemorizationStatus.TIDAK_LANCAR ? "TIDAK LANCAR" : "TIDAK SETOR"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 uppercase tracking-[0.2em] text-[9px] font-black">Belum ada aktivitas</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 bg-white text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 border-2 border-slate-300">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
