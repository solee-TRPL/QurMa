import React, { useEffect, useState, useMemo } from "react";
import { getAuditLogs, deleteAuditLog } from "../../services/dataService";
import { AuditLogEntry } from "../../types";
import { Download, Filter, Search, ShieldAlert, ShieldCheck, User, ChevronDown, Check, RefreshCw, ChevronRight, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import ExcelJS from "exceljs";

export const AuditLogs: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter States
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPaginationDropdown, setShowPaginationDropdown] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs(tenantId).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantId]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    try {
      await deleteAuditLog(logToDelete);
      setLogs((prev) => prev.filter((log) => log.id !== logToDelete));
      setIsDeleteModalOpen(false);
      setLogToDelete(null);
    } catch (error) {
      console.error("Gagal menghapus log:", error);
      alert("Gagal menghapus log. Silakan coba lagi.");
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 border-green-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOGIN":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter and Sort Logic
  const processedLogs = useMemo(() => {
    // 1. Filter by Search
    let result = logs.filter((log) => log.actor_name.toLowerCase().includes(search.toLowerCase()) || log.action.toLowerCase().includes(search.toLowerCase()) || log.entity.toLowerCase().includes(search.toLowerCase()));

    // 2. Sort by Date
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, search, sortOrder]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder]);

  const totalPages = Math.ceil(processedLogs.length / itemsPerPage);
  const paginatedLogs = processedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = async () => {
    if (processedLogs.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Audit Logs");

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const cellStyle: Partial<ExcelJS.Style> = {
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
      alignment: { horizontal: "left", vertical: "middle" },
    };

    worksheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Aktor", key: "aktor", width: 25 },
      { header: "Role", key: "role", width: 15 },
      { header: "Aksi", key: "aksi", width: 15 },
      { header: "Entitas", key: "entitas", width: 20 },
      { header: "Detail", key: "detail", width: 40 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    processedLogs.forEach((log, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        timestamp: new Date(log.timestamp).toLocaleString("id-ID"),
        aktor: log.actor_name,
        role: log.actor_role,
        aksi: log.action,
        entitas: log.entity,
        detail: log.details,
      });
      row.eachCell((cell) => {
        cell.style = cellStyle;
      });
      row.getCell("no").alignment = { horizontal: "center" };
      row.getCell("aksi").alignment = { horizontal: "center" };
    });

    const date = new Date().toISOString().slice(0, 10);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Unified Control Bar - 2 Rows for Mobile */}
      <div className="flex flex-col lg:flex-row w-full gap-2 bg-white sticky top-0 z-40 border-b border-slate-100 lg:border-none">
        {/* BARIS 1: Sort & Search */}
        <div className="flex flex-row items-center gap-2 w-full lg:flex-1">
          {/* 3. SORT FILTER */}
          <div className="flex-none flex items-center gap-2 md:gap-3 bg-white pt-3 md:pt-3 pb-2 md:pb-2 pr-2.5 pl-2.5 rounded-xl border-2 border-slate-300 shadow-none min-35 md:min-50 relative cursor-pointer" onClick={() => setShowSortDropdown(!showSortDropdown)}>
            <div className="flex-1 group/sel-time">
              <p className="text-[7.5px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Urutkan</p>
              <div>
                <div className="flex items-center justify-between w-full pr-1">
                  <span className="bg-transparent text-[8.5px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight truncate pointer-events-none">{sortOrder === "newest" ? "TERBARU" : "TERLAMA"}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 pointer-events-none group-hover/sel-time:text-jade-500 transition-all ${showSortDropdown ? "rotate-180 text-jade-500" : ""}`} />
                </div>

                {showSortDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSortDropdown(false);
                      }}
                    />
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-full bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { value: "newest", label: "TERBARU" },
                        { value: "oldest", label: "TERLAMA" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors ${sortOrder === opt.value ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSortOrder(opt.value as "newest" | "oldest");
                            setShowSortDropdown(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 1. SEARCH BAR */}
          <div className="relative flex-1 group h-10 lg:h-11">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-jade-500 transition-colors" />
            <input
              type="text"
              placeholder="CARI AUDIT LOG..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-500 transition-all text-[9.5px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
            />
          </div>
        </div>

        {/* BARIS 2: Refresh & CSV */}
        <div className="flex flex-row items-center gap-2 w-full lg:w-auto lg:flex-none">
          {/* 4. REFRESH (Left-aligned on mobile) */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="h-10 w-10 shrink-0 flex items-center justify-center border-2 border-slate-300 bg-white text-slate-400 hover:text-jade-600 hover:bg-slate-50 transition-all active:scale-95 rounded-xl shadow-none disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* 2. EXPORT EXCEL (Right-aligned / Fills space on mobile) */}
          <button
            onClick={handleExportExcel}
            className="h-10 flex-1 lg:flex-none px-3 md:px-4 bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all flex items-center justify-center gap-2 group shrink-0 shadow-none"
            title="Ekspor Excel"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest">EKSPOR</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-none border-2 border-slate-300 overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th className="hidden md:table-cell sticky left-0 z-20 px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-black w-11.25 min-11.25 bg-slate-300">NO</th>
                <th className="sticky left-0 md:left-11.25 z-20 px-1 md:px-4 py-4 text-center md:text-left text-[9px] md:text-[9.5px] whitespace-nowrap font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-l border-black w-11.25 md:w-27.5 min-w-11.25 md:min-w-27.5 bg-slate-300">
                  WAKTU
                </th>
                <th className="sticky left-11.25 md:left-38.75 z-20 px-2 md:px-6 py-4 text-center md:text-left text-[9px] md:text-[9.5px] font-black text-emerald-600 uppercase tracking-widest border-t border-b border-r border-emerald-600 w-18.75 md:w-37.5 min-w-18.75 md:min-w-37.5 whitespace-nowrap bg-emerald-50">
                  AKTOR
                </th>
                <th className="px-2 md:px-6 py-4 text-center md:text-left text-[9.5px] font-black text-amber-600 uppercase tracking-widest border-t border-b border-r border-amber-600 w-16 md:w-24 whitespace-nowrap bg-amber-50">AKSI</th>
                <th className="px-6 py-4 text-center md:text-left text-[9.5px] font-black text-blue-600 uppercase tracking-widest border-t border-b border-r border-blue-600 whitespace-nowrap min-75 bg-blue-50">ENTITAS & DETAIL</th>
                <th className="px-4 py-4 text-center text-[9.5px] font-black text-rose-600 uppercase tracking-widest border-t border-b border-r border-rose-600 w-24 bg-rose-50">OPSI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-300 transition-colors group">
                  <td className="hidden md:table-cell sticky left-0 z-20 bg-white group-hover:bg-slate-300 px-2 py-4 whitespace-nowrap text-[10.5px] font-black text-slate-400 border-r border-b border-slate-100 text-center uppercase transition-colors">
                    {String((currentPage - 1) * itemsPerPage + idx + 1)}
                  </td>
                  <td className="sticky left-0 md:left-11.25 z-20 bg-white group-hover:bg-slate-300 px-1 md:px-4 py-4 whitespace-nowrap text-[9.5px] md:text-[10.5px] text-slate-700 font-mono font-black border-r border-b border-slate-100 text-center md:text-left transition-colors">
                    <div className="flex flex-col items-center md:items-start leading-tight">
                      <span className="font-black text-slate-800 tracking-tighter truncate hidden md:block">
                        {mounted ? new Date(log.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----"}
                      </span>
                      <span className="font-black text-slate-800 tracking-tighter truncate block md:hidden">{mounted ? new Date(log.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }) : "--/--"}</span>
                      <span className="text-[8.5px] md:text-[9.5px] opacity-50">{mounted ? new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
                    </div>
                  </td>
                  <td className="sticky left-11.25 md:left-38.75 z-20 bg-white group-hover:bg-slate-300 px-2 md:px-6 py-4 whitespace-normal md:whitespace-nowrap border-r border-b border-slate-100 transition-colors">
                    <div className="flex flex-col w-full max-w-14.75] md:max-w-full">
                      <div className="text-[10px] md:text-[11px] font-black text-slate-800 capitalize tracking-tight leading-[1.1] md:leading-none mb-1 line-clamp-2 md:truncate w-full wrap-break-words">{log.actor_name}</div>
                      <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70 truncate w-full">{log.actor_role.toLowerCase() === "guardian" ? "Siswa" : log.actor_role.toLowerCase()}</div>
                    </div>
                  </td>
                  <td className="px-2 md:px-6 py-4 whitespace-nowrap border-r border-b border-slate-100 text-center md:text-left">
                    <span className={`px-2.5 py-1 inline-flex text-[8.5px] md:text-[9px] font-black uppercase tracking-tight rounded-md border ${getActionColor(log.action)} shadow-sm`}>{log.action}</span>
                  </td>
                  <td className="px-6 py-4 border-r border-b border-slate-100 min-75">
                    <div className="text-[11px] text-slate-800 font-black capitalize tracking-tight leading-tight mb-1">{log.entity}</div>
                    <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wide opacity-60 leading-tight line-clamp-2">{log.details}</div>
                  </td>
                  <td className="px-4 py-4 border-b border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setLogToDelete(log.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-md border shadow-sm bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                      title="Hapus Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && processedLogs.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-3xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  onClick={() => setShowPaginationDropdown(!showPaginationDropdown)}
                  className="bg-white border-2 border-slate-300 rounded-lg px-2 md:px-3 py-1 flex items-center justify-between gap-1.5 md:gap-2 text-[10px] font-black text-slate-700 outline-none hover:border-slate-400 cursor-pointer shadow-none transition-all select-none min-w-12.5 md:min-w-15"
                >
                  <span>{itemsPerPage}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showPaginationDropdown ? "rotate-180 text-jade-500" : ""}`} />
                </div>

                {showPaginationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPaginationDropdown(false)} />
                    <div className="absolute bottom-[calc(100%+4px)] left-0 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-99! py-1 min-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {[10, 25, 50, 100].map((val) => (
                        <div
                          key={val}
                          className={`px-3 py-2 text-[10px] font-black cursor-pointer transition-colors text-center ${itemsPerPage === val ? "bg-jade-50 text-jade-600" : "text-slate-600 hover:bg-slate-50"}`}
                          onClick={() => {
                            setItemsPerPage(val);
                            setCurrentPage(1);
                            setShowPaginationDropdown(false);
                          }}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                <span className="hidden sm:inline">DATA</span> {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedLogs.length)} <span className="hidden sm:inline text-slate-300">/</span>{" "}
                <span className="text-primary-600 ml-0.5">{processedLogs.length}</span>
              </p>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === 1 ? "text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
              </button>

              <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  if (totalPages > 5) {
                    if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                      if (pNum === 2 || pNum === totalPages - 1)
                        return (
                          <span key={pNum} className="text-slate-300 text-[8px] md:text-[10px] font-black">
                            ..
                          </span>
                        );
                      return null;
                    }
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? "bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent"}`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === totalPages ? "text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50" : "text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none"}`}
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        )}

        {processedLogs.length === 0 && !loading && (
          <div className="p-16 text-center bg-white">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Log Tidak Ditemukan</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteLog}
        centerOnScreen={false}
        title="Hapus Log?"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        confirmLabel="YA, HAPUS"
        message={
          <span>
            Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">log ini</span>?
            <span className="text-red-600 font-bold mt-2 block text-[10px]">Aksi ini tidak dapat dibatalkan.</span>
          </span>
        }
      />
    </div>
  );
};
