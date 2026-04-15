
import React, { useEffect, useState, useMemo } from 'react';
import { getGlobalAuditLogs, getAllTenants } from '../../services/dataService';
import { AuditLogEntry, Tenant } from '../../types';
import { Button } from '../../components/ui/Button';
import { Download, Filter, Search, ShieldCheck, User, ChevronDown, Check, Building, Calendar, Globe, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const GlobalAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsData, tenantsData] = await Promise.all([
                getGlobalAuditLogs(),
                getAllTenants()
            ]);
            setLogs(logsData);
            setTenants(tenantsData);
        } catch (error) {
            console.error("Failed to fetch global audit logs", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOGIN': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter and Sort Logic
  const processedLogs = useMemo(() => {
    let result = logs;

    // 1. Filter by Tenant
    if (selectedTenantId !== 'all') {
        result = result.filter(log => log.tenant_id === selectedTenantId);
    }

    // 2. Filter by Search
    result = result.filter(log => 
        log.actor_name.toLowerCase().includes(search.toLowerCase()) || 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        (log.tenant_name && log.tenant_name.toLowerCase().includes(search.toLowerCase()))
    );

    // 3. Sort by Date
    result.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, search, sortOrder, selectedTenantId]);

  const totalPages = Math.ceil(processedLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedLogs.slice(start, start + itemsPerPage);
  }, [processedLogs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTenantId, itemsPerPage]);

  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  const handleExportCSV = () => {
    if (processedLogs.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }

    const headers = ['Timestamp', 'Sekolah', 'Aktor', 'Role', 'Aksi', 'Entitas', 'Detail', 'IP Address'];
    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const rows = processedLogs.map(log => [
        escapeCSV(new Date(log.timestamp).toLocaleString('id-ID')),
        escapeCSV(log.tenant_name || 'N/A'),
        escapeCSV(log.actor_name),
        escapeCSV(log.actor_role),
        escapeCSV(log.action),
        escapeCSV(log.entity),
        escapeCSV(log.details),
        escapeCSV(log.ip_address)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `global-audit-logs-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Search & Export bar remains same or refined */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex-1 min-w-[300px] relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                  type="text" 
                  placeholder="Cari aktor, entitas, atau aktivitas global..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-5 py-3 bg-white border-2 border-slate-50 rounded-2xl text-[13px] font-bold text-slate-800 shadow-sm shadow-slate-200/50 focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50/30 outline-none transition-all"
              />
          </div>
          <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                  <button 
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm shadow-slate-200/50 hover:border-emerald-100 transition-all active:scale-95"
                  >
                      <Filter className="w-3.5 h-3.5" /> 
                      {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isSortMenuOpen && (
                      <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsSortMenuOpen(false)}></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-[24px] shadow-2xl border-2 border-slate-50 z-20 overflow-hidden animate-scale-in p-2">
                              <button onClick={() => { setSortOrder('newest'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-between transition-colors ${sortOrder === 'newest' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                  Terbaru
                                  {sortOrder === 'newest' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => { setSortOrder('oldest'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-between transition-colors ${sortOrder === 'oldest' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                  Terlama
                                  {sortOrder === 'oldest' && <Check className="w-3.5 h-3.5" />}
                              </button>
                          </div>
                      </>
                  )}
              </div>

              <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm shadow-emerald-100/50 hover:bg-emerald-100 transition-all active:scale-95"
              >
                  <Download className="w-3.5 h-3.5" /> Export Data
              </button>
          </div>
      </div>

      {/* Filter Bar - Modernized (No Card Background) */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
              <div className="relative group min-w-[300px]">
                  <select 
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full pl-5 pr-11 py-3 bg-white border-2 border-slate-50 rounded-2xl text-[12px] font-bold text-slate-700 shadow-sm shadow-slate-200/50 focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50/30 outline-none transition-all cursor-pointer appearance-none truncate"
                  >
                      <option value="all">🌐 Seluruh Institusi Platform</option>
                      <option value="null">🛡️ Sistem / Superadmin Internal</option>
                      {tenants.map(t => (
                          <option key={t.id} value={t.id}>🏫 {t.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              <div className="h-10 w-px bg-slate-100 hidden md:block" />
          </div>
          
          <div className="flex items-center gap-2.5 px-4 py-3 bg-white text-emerald-600 rounded-2xl border-2 border-slate-50 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Real-time Auditing Active</span>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[28px] border-2 border-slate-50 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-slate-100">
            <thead className="bg-[#F8FAFC]">
                <tr className="text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                    <th className="w-[5%] px-6 py-4 text-left border-r border-slate-200/60">No.</th>
                    <th className="w-[18%] px-6 py-4 text-left border-r border-slate-200/60 whitespace-nowrap">Waktu & Tanggal</th>
                    <th className="w-[18%] px-6 py-4 text-left border-r border-slate-200/60">Institusi / Sekolah</th>
                    <th className="w-[18%] px-6 py-4 text-left border-r border-slate-200/60">Aktor Pelaksana</th>
                    <th className="w-[12%] px-6 py-4 text-center border-r border-slate-200/60">Aksi</th>
                    <th className="w-[29%] px-6 py-4 text-left">Detail Aktivitas</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50" key={currentPage}>
                {paginatedLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group animate-fade-in">
                    {/* No */}
                    <td className="px-6 py-4 border-r border-slate-50/50">
                        <span className="text-[11px] font-black text-slate-300">
                            {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                        </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 border-r border-slate-50/50">
                        <span className="text-[12px] font-bold text-slate-800 group-hover:text-emerald-600 transition-colors flex items-center gap-2 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </span>
                    </td>

                    {/* Sekolah */}
                    <td className="px-6 py-4 border-r border-slate-50/50">
                         <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 truncate leading-tight group-hover:text-emerald-600 transition-colors">
                                {log.tenant_name || 'System Internal'}
                            </p>
                            {!log.tenant_id && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 mt-1 inline-block">Platform Core</span>}
                         </div>
                    </td>

                    {/* Aktor */}
                    <td className="px-6 py-4 border-r border-slate-50/50">
                        <div className="flex flex-col gap-0.5">
                            <div className="text-[12px] font-bold text-slate-800 break-words leading-tight">{log.actor_name}</div>
                            <div className="text-[9px] font-black uppercase tracking-tight text-slate-400 opacity-80">{log.actor_role.replace('_', ' ')}</div>
                        </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-center border-r border-slate-50/50">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-lg border shadow-sm ${getActionColor(log.action)}`}>
                            {log.action}
                        </span>
                    </td>

                    {/* Detail */}
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-bold text-slate-800 break-words capitalize leading-tight">{log.entity}</span>
                            <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed" title={log.details}>
                                {log.details}
                            </p>
                        </div>
                    </td>
                </tr>
              ))}
            </tbody>
            </table>
        </div>
        {processedLogs.length === 0 && !loading && (
            <div className="py-24 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] border-2 border-slate-50 flex items-center justify-center text-slate-200 mb-6 shadow-inner">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">
                    Log Aktivitas Kosong
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Platform belum mencatat aktivitas untuk filter ini.
                </p>
            </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && processedLogs.length > 0 && (
            <div className="bg-[#FCFDFE] border-t border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tampilkan</span>
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:border-emerald-300 transition-all cursor-pointer"
                        >
                            {[5, 10, 25, 50, 100].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Total <span className="text-emerald-600">{processedLogs.length}</span> Records
                    </p>
                </div>

                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 mx-2">
                        {getVisiblePages().map((page, idx) => (
                            <React.Fragment key={idx}>
                                {page === '...' ? (
                                    <span className="text-slate-300 px-1">•••</span>
                                ) : (
                                    <button
                                        onClick={() => setCurrentPage(Number(page))}
                                        className={`min-w-[32px] h-8 rounded-xl text-[11px] font-black transition-all ${
                                            currentPage === page 
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                            : 'text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
