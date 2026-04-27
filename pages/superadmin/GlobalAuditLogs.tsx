
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
      <div className="flex flex-row items-center gap-1.5 lg:gap-4 bg-white/40 p-1.5 lg:p-2 rounded-2xl lg:rounded-[24px] border border-white/20 backdrop-blur-md overflow-x-auto no-scrollbar">
          {/* Search */}
          <div className="relative flex-[2] min-w-[120px] group">
              <Search className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                  type="text" 
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 lg:pl-12 pr-2 py-1.5 lg:py-3 bg-white border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl text-[10px] lg:text-[13px] font-bold outline-none h-8 lg:h-12 shadow-sm"
              />
          </div>

          {/* School Filter */}
          <div className="relative flex-1 min-w-[100px] group">
              <Building className="absolute left-2.5 lg:left-4 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 text-emerald-500" />
              <select 
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full pl-7 lg:pl-11 pr-7 lg:pr-10 py-1.5 lg:py-3 bg-white border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl text-[9px] lg:text-[12px] font-bold text-slate-700 shadow-sm outline-none cursor-pointer appearance-none truncate h-8 lg:h-12"
              >
                  <option value="all">SEMUA</option>
                  <option value="null">SISTEM</option>
                  {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2.5 lg:right-4 top-1/2 -translate-y-1/2 w-2.5 lg:w-4 h-2.5 lg:h-4 text-slate-300 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 lg:gap-3 shrink-0">
              {/* Sort */}
              <button 
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="flex items-center justify-center h-8 lg:h-12 px-2 lg:px-5 bg-white border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 shadow-sm hover:border-emerald-100 transition-all active:scale-95"
                  title="Urutkan"
              >
                  <Filter className="w-3.5 h-3.5 sm:mr-2" /> 
                  <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}</span>
              </button>

              {/* Export */}
              <button 
                  onClick={handleExportCSV}
                  className="flex items-center justify-center h-8 lg:h-12 px-2 lg:px-5 bg-emerald-50 border border-emerald-100 rounded-xl lg:rounded-2xl text-[9px] font-black uppercase tracking-widest text-emerald-700 shadow-sm hover:bg-emerald-100 transition-all active:scale-95"
                  title="Export CSV"
              >
                  <Download className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
              </button>

              {/* Status */}
              <div className="flex items-center justify-center h-8 lg:h-12 px-2 lg:px-4 bg-emerald-50/50 text-emerald-600 rounded-xl lg:rounded-2xl border border-emerald-100 lg:border-2 lg:border-slate-50 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 animate-pulse sm:mr-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Active</span>
              </div>
          </div>

          {isSortMenuOpen && (
              <>
                  <div className="fixed inset-0 z-50" onClick={() => setIsSortMenuOpen(false)}></div>
                  <div className="absolute right-2 top-full mt-2 w-48 bg-white rounded-[24px] shadow-2xl border-2 border-slate-50 z-[60] overflow-hidden animate-scale-in p-2">
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

      {/* Table */}
      <div className="bg-white shadow-sm border-2 border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full table-fixed divide-y divide-slate-100 border-separate border-spacing-0">
            <thead>
                <tr className="bg-white">
                    <th className="w-[35px] min-w-[35px] lg:w-[45px] lg:min-w-[45px] sticky left-0 bg-white z-[30] px-3 py-4 text-center text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100">NO</th>
                    <th className="w-[100px] min-w-[100px] lg:w-[150px] lg:min-w-[150px] sticky left-[35px] lg:left-[45px] bg-white z-[30] px-4 py-4 text-left text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100 whitespace-nowrap">WAKTU</th>
                    <th className="w-[150px] min-w-[150px] lg:w-[200px] lg:min-w-[200px] sticky left-[135px] lg:left-[195px] bg-white z-[30] px-4 py-4 text-left text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">AKTOR</th>
                    <th className="w-[180px] min-w-[180px] px-4 py-4 text-left text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100 bg-white">SEKOLAH</th>
                    <th className="w-[100px] min-w-[100px] px-4 py-4 text-center text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100 bg-white">AKSI</th>
                    <th className="w-[250px] min-w-[250px] px-4 py-4 text-left text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-slate-100 bg-white">DETAIL AKTIVITAS</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50" key={currentPage}>
                {paginatedLogs.map((log, index) => (
                <tr key={log.id} className="group transition-colors hover:bg-slate-50/30">
                    <td className="sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r-2 border-b border-slate-100 z-10 transition-colors uppercase">
                        {String((currentPage - 1) * itemsPerPage + index + 1)}
                    </td>

                    <td className="sticky left-[35px] lg:left-[45px] bg-white px-4 py-4 border-r-2 border-b border-slate-100 z-10 transition-colors">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-slate-800 leading-none">{new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </td>

                    <td className="sticky left-[135px] lg:left-[195px] bg-white px-4 py-4 border-r-2 border-b border-slate-200 z-10 transition-colors shadow-sm">
                        <div className="flex flex-col gap-1 truncate">
                            <div className="text-[11.5px] font-black text-indigo-600 truncate leading-tight capitalize">{log.actor_name}</div>
                            <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 leading-none">{log.actor_role.replace('_', ' ')}</div>
                        </div>
                    </td>

                    <td className="px-4 py-4 border-r-2 border-b border-slate-100 uppercase">
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-700 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                                {log.tenant_name || 'System Internal'}
                            </p>
                            {!log.tenant_id && <span className="text-[7px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 mt-1 inline-block">CORE ACCOUNT</span>}
                        </div>
                    </td>

                    <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tight rounded border shadow-sm ${getActionColor(log.action)}`}>
                            {log.action}
                        </span>
                    </td>

                    <td className="px-4 py-4 border-b border-slate-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black text-slate-800 truncate capitalize leading-tight group-hover:text-indigo-600 transition-colors">{log.entity}</span>
                            <p className="text-[10.5px] font-bold text-slate-500 leading-snug break-words" title={log.details}>
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
        {/* PAGINATION CONTROLS */}
        {!loading && processedLogs.length > 0 && (
            <div className="bg-[#F8FAFC] border-t border-slate-100 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border-2 border-slate-100 rounded-xl px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50/50 cursor-pointer shadow-sm transition-all"
                        >
                            {[10, 25, 50, 100].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap leading-none">
                        <span className="hidden sm:inline">DATA</span> 
                        <span className="text-slate-600 ml-1">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedLogs.length)}</span> 
                        <span className="hidden sm:inline text-slate-300 mx-1">/</span> 
                        <span className="text-emerald-600 font-bold ml-0.5">{processedLogs.length}</span>
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
                                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[10px] font-black">..</span>;
                                    return null;
                                }
                            }
                            
                            return (
                                <button 
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 border-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-2 border-transparent'}`}
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
      </div>
    </div>
  );
};
