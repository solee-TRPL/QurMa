
import React, { useEffect, useState, useMemo, useRef } from 'react';
import ExcelJS from "exceljs";
import { getGlobalAuditLogs, getAllTenants } from '../../services/dataService';
import { AuditLogEntry, Tenant } from '../../types';
import { Button } from '../../components/ui/Button';
import { Download, Filter, Search, ShieldCheck, User, ChevronDown, Check, Building, Calendar, Globe, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCcw } from 'lucide-react';

export const GlobalAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mounted, setMounted] = useState(false);

  const tenantDropdownRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setIsTenantDropdownOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const range: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  const handleExportExcel = async () => {
    if (processedLogs.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Global Audit Logs");

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
      { header: "Sekolah", key: "sekolah", width: 25 },
      { header: "Aktor", key: "aktor", width: 25 },
      { header: "Role", key: "role", width: 15 },
      { header: "Aksi", key: "aksi", width: 15 },
      { header: "Entitas", key: "entitas", width: 25 },
      { header: "Detail", key: "detail", width: 40 },
      { header: "IP Address", key: "ip", width: 15 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    processedLogs.forEach((log, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        timestamp: new Date(log.timestamp).toLocaleString("id-ID"),
        sekolah: log.tenant_name || 'System Internal',
        aktor: log.actor_name,
        role: log.actor_role,
        aksi: log.action,
        entitas: log.entity,
        detail: log.details,
        ip: log.ip_address
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
    a.download = `global-audit-logs-${date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-fade-in overflow-hidden pb-2">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-1.5 md:gap-2">
          {/* Search Area */}
          <div className="relative group h-10 w-full xl:flex-1 xl:min-w-50">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                  type="text" 
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-50/50 focus:border-emerald-500 transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
              />
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto flex-none">
              {/* School Filter */}
              <div className="relative group shrink-0 z-30 flex-1 xl:flex-none" ref={tenantDropdownRef}>
                  <Building className={`absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors pointer-events-none z-10 ${isTenantDropdownOpen ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                  <div 
                    onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
                    className={`w-full pl-8 lg:pl-10 pr-8 lg:pr-10 h-10 bg-white border-2 rounded-xl text-slate-700 font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer flex items-center transition-all shadow-none xl:w-50 truncate ${isTenantDropdownOpen ? 'border-emerald-400 ring-4 ring-emerald-50/50' : 'border-slate-300 hover:border-slate-400'}`}
                  >
                      <span className="truncate">
                        {selectedTenantId === 'all' ? 'SEMUA SEKOLAH' : selectedTenantId === 'null' ? 'SISTEM' : tenants.find(t => t.id === selectedTenantId)?.name || 'SEMUA SEKOLAH'}
                      </span>
                  </div>
                  <ChevronDown className={`absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-transform z-10 ${isTenantDropdownOpen ? 'text-emerald-500 rotate-180' : 'text-slate-400 group-hover:text-emerald-500'}`} />

              {isTenantDropdownOpen && (
                  <>
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-max bg-white border-2 border-slate-300 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                        <div 
                            className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${selectedTenantId === 'all' ? "text-emerald-600 bg-emerald-50" : "text-slate-600"}`}
                            onClick={() => { setSelectedTenantId('all'); setIsTenantDropdownOpen(false); }}
                        >
                            SEMUA
                        </div>
                        <div 
                            className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${selectedTenantId === 'null' ? "text-emerald-600 bg-emerald-50" : "text-slate-600"}`}
                            onClick={() => { setSelectedTenantId('null'); setIsTenantDropdownOpen(false); }}
                        >
                            SISTEM
                        </div>
                        {tenants.map(t => (
                            <div 
                                key={t.id}
                                className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-left hover:bg-slate-50 transition-colors uppercase ${selectedTenantId === t.id ? "text-emerald-600 bg-emerald-50" : "text-slate-600"}`}
                                onClick={() => { setSelectedTenantId(t.id); setIsTenantDropdownOpen(false); }}
                            >
                                {t.name}
                            </div>
                        ))}
                    </div>
                  </>
              )}
          </div>


              {/* Export */}
              <button 
                  onClick={handleExportExcel}
                  disabled={logs.length === 0}
                  className="h-10 px-4 bg-jade-600 text-white rounded-xl shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-jade-700 flex items-center justify-center shrink-0 whitespace-nowrap"
              >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Ekspor</span>
              </button>
          </div>

          {isSortMenuOpen && (
              <div ref={sortMenuRef}>
                  <div className="absolute right-2 top-full mt-2 w-48 bg-white rounded-3xl shadow-2xl border-2 border-slate-50 z-60 overflow-hidden animate-scale-in p-2">
                      <button onClick={() => { setSortOrder('newest'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-between transition-colors ${sortOrder === 'newest' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          Terbaru
                          {sortOrder === 'newest' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setSortOrder('oldest'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-between transition-colors ${sortOrder === 'oldest' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          Terlama
                          {sortOrder === 'oldest' && <Check className="w-3.5 h-3.5" />}
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* Table */}
      <div className="bg-white shadow-none border-2 border-slate-300 overflow-hidden flex flex-col rounded-b-xl flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full table-fixed divide-y divide-slate-100 border-separate border-spacing-0">
            <thead>
                <tr className="bg-slate-300">
                    <th className="hidden lg:table-cell w-8.75 min-8.75 lg:w-11.25 lg:min-11.25 sticky left-0 bg-slate-300 z-10 px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-l border-b border-slate-400">NO</th>
                    <th className="hidden lg:table-cell w-25 min-25 lg:w-37.5 lg:min-37.5 sticky lg:left-11.25 bg-slate-300 z-10 px-2 lg:px-4 py-4 text-left text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-l border-slate-400 whitespace-nowrap shadow-none">WAKTU</th>
                    <th className="w-24 min-24 lg:w-50 lg:min-50 sticky left-0 lg:left-48.75 bg-slate-300 z-10 px-2 lg:px-4 py-4 text-left text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-slate-400 shadow-none">AKTOR</th>
                    <th className="w-28 min-28 lg:w-45 lg:min-45 px-2 lg:px-4 py-4 text-left text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-slate-400 bg-slate-300">SEKOLAH</th>
                    <th className="w-18 min-18 lg:w-25 lg:min-25 px-2 lg:px-4 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-slate-400 bg-slate-300">AKSI</th>
                    <th className="w-44 min-44 lg:w-62.5 lg:min-62.5 px-2 lg:px-4 py-4 text-left text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-slate-400 bg-slate-300">DETAIL AKTIVITAS</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50 animate-fade-in" key={currentPage}>
                {paginatedLogs.map((log, index) => (
                <tr key={log.id} className="group transition-colors hover:bg-slate-50/30">
                    <td className="hidden lg:table-cell sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r border-b border-slate-100 z-10 transition-colors uppercase">
                        {String((currentPage - 1) * itemsPerPage + index + 1)}
                    </td>

                    <td className="hidden lg:table-cell lg:sticky lg:left-11.25 bg-white px-2 lg:px-4 py-4 border-r border-b border-slate-100 z-10 transition-colors">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-slate-800 leading-none">{mounted ? new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '--/--'}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">{mounted ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        </div>
                    </td>

                    <td className="sticky left-0 lg:left-48.75 bg-white px-2 lg:px-4 py-4 border-r border-b border-slate-100 z-10 transition-colors">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="text-[11.5px] font-black text-jade-600 leading-tight capitalize whitespace-normal wrap-break-words">{log.actor_name}</div>
                            <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 leading-none whitespace-normal wrap-break-words">{log.actor_role.replace('_', ' ')}</div>
                            <div className="text-[8px] font-black text-slate-500 sm:hidden">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </td>

                    <td className="px-2 lg:px-4 py-4 border-r border-b border-slate-100 uppercase">
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-700 lg:truncate whitespace-normal wrap-break-words leading-tight group-hover:text-jade-600 transition-colors">
                                {(log.tenant_name || 'System Internal').replace(/-/g, '\u2011').replace(/\//g, '/\u200B')}
                            </p>
                            {!log.tenant_id && <span className="text-[7px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 mt-1 inline-block">CORE ACCOUNT</span>}
                        </div>
                    </td>

                    <td className="px-2 lg:px-4 py-4 text-center border-r border-b border-slate-100">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tight rounded border shadow-sm ${getActionColor(log.action)}`}>
                            {log.action}
                        </span>
                    </td>

                    <td className="px-2 lg:px-4 py-4 border-b border-slate-100 align-top">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-slate-800 break-words leading-tight group-hover:text-jade-600 transition-colors">
                                {log.entity}
                            </span>
                            <p className="text-[10px] font-medium text-slate-500 leading-snug break-words" title={log.details}>
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
                <div className="w-20 h-20 bg-slate-50 rounded-32px border-2 border-slate-50 flex items-center justify-center text-slate-200 mb-6 shadow-inner">
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
            <div className="bg-slate-100 border-t-2 border-slate-300 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 lg:gap-4 rounded-b-lg">
                <div className="flex items-center gap-2 lg:gap-4">
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-white border-2 border-slate-300 rounded-xl px-2 md:px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50/50 cursor-pointer shadow-none transition-all h-8"
                    >
                        {[10, 25, 50, 100].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                    <div className="hidden lg:block w-px h-6 bg-slate-200" />
                    <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap leading-none">
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
                        className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-200 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
                    >
                        <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-0.5 lg:gap-1 px-1 lg:px-2">
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
                                    className={`w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 border-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-2 border-transparent'}`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-200 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
                    >
                        <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
