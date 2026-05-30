
import React, { useEffect, useState, useMemo } from 'react';
import { getAuditLogs } from '../../services/dataService';
import { AuditLogEntry } from '../../types';
import { Download, Filter, Search, ShieldAlert, ShieldCheck, User, ChevronDown, Check, RefreshCw, ChevronRight } from 'lucide-react';

export const AuditLogs: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs(tenantId).then(data => {
      setLogs(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [tenantId]);

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOGIN': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and Sort Logic
  const processedLogs = useMemo(() => {
    // 1. Filter by Search
    let result = logs.filter(log => 
        log.actor_name.toLowerCase().includes(search.toLowerCase()) || 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Sort by Date
    result.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, search, sortOrder]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder]);

  const totalPages = Math.ceil(processedLogs.length / itemsPerPage);
  const paginatedLogs = processedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    if (processedLogs.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }

    const headers = ['Timestamp', 'Aktor', 'Role', 'Aksi', 'Entitas', 'Detail'];
    
    // Escape commas and quotes in data
    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const rows = processedLogs.map(log => [
        escapeCSV(new Date(log.timestamp).toLocaleString('id-ID')),
        escapeCSV(log.actor_name),
        escapeCSV(log.actor_role),
        escapeCSV(log.action),
        escapeCSV(log.entity),
        escapeCSV(log.details)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `audit-logs-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Unified Control Bar - 2 Rows for Mobile */}
      <div className="flex flex-col lg:flex-row w-full gap-2 bg-white sticky top-0 z-20 border-b border-slate-100 lg:border-none">

          {/* BARIS 1: Sort & Search */}
          <div className="flex flex-row items-center gap-2 w-full lg:flex-1">
              {/* 3. SORT FILTER */}
              <div className="flex-none flex items-center gap-2 md:gap-3 bg-white pt-3 md:pt-3 pb-2 md:pb-2 pr-2.5 pl-2.5 rounded-xl border-2 border-slate-300 shadow-none min-35 md:min-50">
                  <div className="flex-1 relative group/sel-time">
                      <p className="text-[7.5px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Urutkan</p>
                      <div className="relative">
                          <select 
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                              className="w-full bg-transparent text-[8.5px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight focus:outline-none appearance-none cursor-pointer p-0 pr-5 relative z-10 truncate"
                          >
                              <option value="newest">TERBARU</option>
                              <option value="oldest">TERLAMA</option>
                          </select>
                          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/sel-time:text-jade-500 transition-colors" />
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
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* 2. EXPORT CSV (Right-aligned / Fills space on mobile) */}
              <button 
                  onClick={handleExportCSV}
                  className="h-10 flex-1 lg:flex-none flex items-center justify-center px-6 font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl bg-jade-600 text-white shadow-none hover:bg-jade-700 hover:scale-[1.02] transition-all active:scale-95 gap-2 whitespace-nowrap"
              >
                  <Download className="w-4 h-4" /> <span>CSV</span>
              </button>
          </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-none border-2 border-slate-300 overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white">
                <tr>
                    <th className="hidden md:table-cell sticky left-0 z-20 px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-r border-black w-11.25 min-11.25 bg-slate-300">NO</th>
                    <th className="sticky left-0 md:left-11.25 z-20 px-1.5 md:px-4 py-4 text-center md:text-left text-[9px] md:text-[9.5px] whitespace-nowrap font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-black w-13.75 md:w-27.5 min-13.75 md:min-27.5 bg-slate-300">WAKTU</th>
                    <th className="sticky left-13.75 md:left-38.75 z-20 px-2 md:px-6 py-4 text-left text-[9px] md:text-[9.5px] font-black text-emerald-600 uppercase tracking-widest border-t border-b border-r border-emerald-600 w-18.75 md:w-37.5 min-18.75 md:min-37.5 whitespace-nowrap bg-emerald-50">AKTOR</th>
                    <th className="px-6 py-4 text-left text-[9.5px] font-black text-amber-600 uppercase tracking-widest border-t border-b border-r border-amber-600 w-24 whitespace-nowrap bg-amber-50">AKSI</th>
                    <th className="px-6 py-4 text-left text-[9.5px] font-black text-blue-600 uppercase tracking-widest border-t border-b border-r border-blue-600 whitespace-nowrap min-75 bg-blue-50">ENTITAS & DETAIL</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
                {paginatedLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-300 transition-colors group">
                    <td className="hidden md:table-cell sticky left-0 z-20 bg-white group-hover:bg-slate-300 px-2 py-4 whitespace-nowrap text-[10.5px] font-black text-slate-400 border-r border-b border-slate-100 text-center uppercase transition-colors">
                        {String((currentPage - 1) * itemsPerPage + idx + 1)}
                    </td>
                    <td className="sticky left-0 md:left-11.25 z-20 bg-white group-hover:bg-slate-300 px-1.5 md:px-4 py-4 whitespace-nowrap text-[9.5px] md:text-[10.5px] text-slate-700 font-mono font-black border-r border-b border-slate-100 text-center md:text-left transition-colors">
                        <div className="flex flex-col items-center md:items-start leading-tight">
                            <span className="font-black text-slate-800 tracking-tighter truncate">{mounted ? new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--/--/----'}</span>
                            <span className="text-[8.5px] md:text-[9.5px] opacity-50">{mounted ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        </div>
                    </td>
                    <td className="sticky left-13.75 md:left-38.75 z-20 bg-white group-hover:bg-slate-300 px-2 md:px-6 py-4 whitespace-nowrap border-r border-b border-slate-100 transition-colors">
                        <div className="flex flex-col">
                            <div className="text-[10px] md:text-[11px] font-black text-slate-800 capitalize tracking-tight leading-none mb-1 truncate max-16.25 md:max-30">{log.actor_name}</div>
                            <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                                {log.actor_role.toLowerCase() === 'guardian' ? 'Siswa' : log.actor_role.toLowerCase()}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-b border-slate-100">
                        <span className={`px-2.5 py-1 inline-flex text-[9px] font-black uppercase tracking-tight rounded-md border ${getActionColor(log.action)} shadow-sm`}>
                            {log.action}
                        </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 min-75">
                        <div className="text-[11px] text-slate-800 font-black capitalize tracking-tight leading-tight mb-1">{log.entity}</div>
                        <div className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wide opacity-60 leading-tight line-clamp-2">{log.details}</div>
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
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-white border-2 border-slate-300 rounded-lg px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-none transition-all"
                    >
                        {[10, 25, 50, 100].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                    <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                        <span className="hidden sm:inline">DATA</span> {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, processedLogs.length)} <span className="hidden sm:inline text-slate-300">/</span> <span className="text-primary-600 ml-0.5">{processedLogs.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-0.5 md:gap-1">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
                    >
                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const pNum = i + 1;
                            if (totalPages > 5) {
                                if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[8px] md:text-[10px] font-black">..</span>;
                                    return null;
                                }
                            }
                            
                            return (
                                <button 
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`w-7 h-7 md:w-9 md:h-9 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
                    >
                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>
        )}

        {processedLogs.length === 0 && !loading && (
             <div className="p-16 text-center bg-white">
                <div className="w-20 h-20 bg-slate-50 rounded-32px flex items-center justify-center mx-auto mb-6 border-2 border-slate-50/50">
                    <ShieldAlert className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Log Tidak Ditemukan</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
             </div>
        )}
      </div>
    </div>
  );
};
