
import React, { useEffect, useState, useMemo } from 'react';
import { getAuditLogs } from '../../services/dataService';
import { AuditLogEntry } from '../../types';
import { Button } from '../../components/ui/Button';
import { Download, Filter, Search, ShieldAlert, ShieldCheck, User, ChevronDown, Check, ChevronRight } from 'lucide-react';

export const AuditLogs: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    getAuditLogs(tenantId).then(data => {
      setLogs(data);
      setLoading(false);
    });
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

    const headers = ['Timestamp', 'Aktor', 'Role', 'Aksi', 'Entitas', 'Detail', 'IP Address'];
    
    // Escape commas and quotes in data
    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const rows = processedLogs.map(log => [
        escapeCSV(new Date(log.timestamp).toLocaleString('id-ID')),
        escapeCSV(log.actor_name),
        escapeCSV(log.actor_role),
        escapeCSV(log.action),
        escapeCSV(log.entity),
        escapeCSV(log.details),
        escapeCSV(log.ip_address)
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Cari User, Aksi, atau Entitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-xs font-bold border-2 border-slate-100 rounded-2xl focus:border-indigo-400 bg-transparent transition-all outline-none"
            />
        </div>

        <div className="flex items-center gap-2">
            <div className="relative">
                <button 
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="flex items-center px-4 py-2.5 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all gap-2 shadow-sm"
                >
                    <Filter className="w-3.5 h-3.5 mr-1" />
                    {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>
                
                {isFilterMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsFilterMenuOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Urutkan Waktu
                            </div>
                            <button
                                onClick={() => { setSortOrder('newest'); setIsFilterMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                            >
                                Terbaru
                                {sortOrder === 'newest' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </button>
                            <button
                                onClick={() => { setSortOrder('oldest'); setIsFilterMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                            >
                                Terlama
                                {sortOrder === 'oldest' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <button 
              onClick={handleExportCSV}
              className="flex items-center px-5 py-2.5 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100/30 transition-all active:scale-95 gap-2"
            >
                <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-[#F8FAFC] border-b border-slate-200">
                <tr>
                <th className="px-6 py-4 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60 w-16">No</th>
                <th className="px-6 py-4 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60">Timestamp</th>
                <th className="px-6 py-4 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60">Aktor</th>
                <th className="px-6 py-4 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60 w-24">Aksi</th>
                <th className="px-6 py-4 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60">Entitas & Detail</th>
                <th className="px-6 py-4 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight">IP Address</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
                {paginatedLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-[10.5px] font-black text-slate-300 border-r border-slate-100/50">
                        {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10.5px] text-slate-500 font-mono border-r border-slate-100/50">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100/50">
                        <div className="flex items-center">
                            <User className="w-3.5 h-3.5 mr-2 text-slate-300" />
                            <div>
                                <div className="text-[10.5px] font-black text-slate-800 capitalize tracking-tight">{log.actor_name}</div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-70">
                                    {log.actor_role.toLowerCase() === 'guardian' ? 'Siswa' : log.actor_role.toLowerCase()}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100/50">
                        <span className={`px-2 py-0.5 inline-flex text-[9px] font-black uppercase tracking-tight rounded-md border ${getActionColor(log.action)}`}>
                            {log.action}
                        </span>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-100/50">
                        <div className="text-[10.5px] text-slate-800 font-black capitalize tracking-tight">{log.entity}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60 leading-tight">{log.details}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10.5px] text-slate-400 font-mono font-bold tracking-tighter opacity-80">
                        {log.ip_address}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && processedLogs.length > 0 && (
            <div className="bg-[#F8FAFC] border-t border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tampilkan</span>
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border-2 border-slate-50 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-sm transition-all"
                        >
                            {[5, 10, 20].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Data / Hal</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <span className="text-slate-500">{(currentPage - 1) * itemsPerPage + 1}</span>-
                        <span className="text-slate-500">{Math.min(currentPage * itemsPerPage, processedLogs.length)}</span> Dari 
                        <span className="text-primary-600 ml-1">{processedLogs.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={`p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-1 px-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const pNum = i + 1;
                            if (totalPages > 5) {
                                if (pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[10px] font-black">...</span>;
                                    return null;
                                }
                            }
                            
                            return (
                                <button 
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 border-2 border-primary-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {processedLogs.length === 0 && !loading && (
             <div className="p-16 text-center bg-white">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border-2 border-slate-50/50">
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
