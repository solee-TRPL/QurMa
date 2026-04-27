
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { Target, BookOpen, RefreshCw, Save, ChevronRight, Info } from 'lucide-react';
import { getClasses, getTenant, updateTenant } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../lib/NotificationContext';

type TargetTab = 'sabaq' | 'manzil' | 'sabqi';

export const TargetManagement: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [activeTab, setActiveTab] = useState<TargetTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['sabaq', 'manzil', 'sabqi'].includes(tabParam)) {
          return tabParam as TargetTab;
      }
    }
    return 'sabaq';
  });
  
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['sabaq', 'manzil', 'sabqi'].includes(tabParam)) {
        setActiveTab(tabParam as TargetTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab: TargetTab) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };

  const { addNotification } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number, field: string } | null>(null);
  const [sabqiEditMode, setSabqiEditMode] = useState<'value' | 'type'>('value');
  const [tempSabqiType, setTempSabqiType] = useState<string | null>(null);
  const [isSabaqMerged, setIsSabaqMerged] = useState(false);

  // --- Initial Data ---
  const recalculateSabaqTotals = (targets: any[]) => {
    let runningTotal = 0;
    return targets.map(t => {
      const numericTarget = typeof t.target === 'number' ? t.target : 0;
      runningTotal += numericTarget;
      // Round to 1 decimal place to avoid floating point artifacts (e.g., 0.1 + 0.2 = 0.3)
      const roundedTotal = Math.round(runningTotal * 10) / 10;
      return {
        ...t,
        total: typeof t.target === 'number' ? roundedTotal : null
      };
    });
  };

  const [sabaqTargets, setSabaqTargets] = useState<any[]>([]);

  useEffect(() => {
    const initTargets = async () => {
        try {
            const [classes, tenant] = await Promise.all([
                getClasses(tenantId),
                getTenant(tenantId)
            ]);

            // If DB already has config, use it first (Sabaq, Manzil, Sabqi are stored in cycle_config)
            if (tenant?.cycle_config) {
                const config = tenant.cycle_config;
                if (config.sabaq) {
                    setSabaqTargets(recalculateSabaqTotals(config.sabaq));
                }
                if (config.manzil) setManzilAcuan(config.manzil);
                if (config.sabqi) setSabqiAcuan(config.sabqi);
                
                // If we loaded from DB, we can stop here
                if (config.sabaq && config.sabaq.length > 0) return;
            }

            // Fallback generation if no DB data
            const levels = Array.from(new Set(classes.map(c => {
                const match = c.name.match(/^(\d+)/);
                return match ? parseInt(match[1]) : null;
            }).filter((l): l is number => l !== null))).sort((a,b) => a-b);

            const finalLevels = levels.length > 0 ? levels : [7, 8, 9, 10, 11, 12];
            const minLevel = Math.min(...finalLevels);

            const targets: any[] = [];
            finalLevels.forEach(lvl => {
                const diff = lvl - minLevel;
                
                // Semester 1
                const t1 = diff === 0 ? 'Kemampuan dan kelancaran membaca Qur’an' : 1;
                targets.push({ 
                    kelas: lvl, 
                    semester: 1, 
                    target: t1, 
                });

                // Semester 2
                const t2 = 1;
                targets.push({ 
                    kelas: lvl, 
                    semester: 2, 
                    target: t2, 
                });
            });
            setSabaqTargets(recalculateSabaqTotals(targets));
        } catch (error) {
            console.error("Error init targets:", error);
        }
    };
    initTargets();
  }, [tenantId]);

  const [manzilAcuan, setManzilAcuan] = useState([
    { id: 1, min: 1, max: 3, atm: 5 },
    { id: 2, min: 4, max: 7, atm: 10 },
    { id: 3, min: 8, max: 15, atm: 20 },
    { id: 4, min: 16, max: 30, atm: 40 },
  ]);

  const [sabqiAcuan, setSabqiAcuan] = useState([
    { id: 1, min: 1, max: 1, murajaah: 'Rabth' },
    { id: 2, min: 2, max: 5, murajaah: '1' },
    { id: 3, min: 6, max: 10, murajaah: '2' },
    { id: 4, min: 11, max: 15, murajaah: '3' },
    { id: 5, min: 16, max: 20, murajaah: '5' },
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // 1. Fetch current tenant to preserve other config keys (like min/max classes)
        const tenant = await getTenant(tenantId);
        const existingConfig = tenant?.cycle_config || {};

        // 2. Merge current target states into the existing config
        const updatedConfig = {
            ...existingConfig,
            sabaq: sabaqTargets,
            manzil: manzilAcuan,
            sabqi: sabqiAcuan
        };

        await updateTenant(tenantId, {
            cycle_config: updatedConfig
        }, user);

        addNotification({ 
            type: 'success', 
            title: 'Berhasil Disimpan', 
            message: 'Konfigurasi target telah diperbarui di database.' 
        });
    } catch (error: any) {
        addNotification({ 
            type: 'error', 
            title: 'Gagal Menyimpan', 
            message: error.message || 'Terjadi kesalahan saat menyimpan ke database.' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 border border-slate-100/50 rounded-[20px] w-fit shadow-sm">
          <button 
            onClick={() => handleTabChange('sabaq')}
            className={`px-6 py-2 text-[11px] font-black uppercase tracking-tight rounded-2xl border-2 transition-all ${activeTab === 'sabaq' ? 'border-white bg-white text-indigo-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            Acuan Sabaq
          </button>
          <button 
            onClick={() => handleTabChange('manzil')}
            className={`px-6 py-2 text-[11px] font-black uppercase tracking-tight rounded-2xl border-2 transition-all ${activeTab === 'manzil' ? 'border-white bg-white text-indigo-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            Acuan Manzil
          </button>
          <button 
            onClick={() => handleTabChange('sabqi')}
            className={`px-6 py-2 text-[11px] font-black uppercase tracking-tight rounded-2xl border-2 transition-all ${activeTab === 'sabqi' ? 'border-white bg-white text-indigo-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            Acuan Sabqi
          </button>
        </div>

        {!isReadOnly && (
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center px-6 py-2.5 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100/50 transition-all active:scale-95 gap-2"
            >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Konfigurasi
            </button>
        )}
      </div>      {/* Two Column Layout: Table (Left) and Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Content Area - Table (Left) */}
        <div className="lg:col-span-3">
            <div className="bg-white shadow-sm border-2 border-slate-200 overflow-hidden flex flex-col">
                {activeTab === 'sabaq' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 z-40 bg-white">
                                      <tr>
                                          <th className="px-6 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 w-20">KELAS</th>
                                          <th className="px-4 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 w-24">SEMESTER</th>
                                          <th className="px-6 py-4 text-center text-[9.5px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 bg-indigo-50/30 w-1/3">TARGET SABAQ (SEMESTER)</th>
                                          <th className="px-6 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-100 w-1/3">TARGET TOTAL</th>
                                      </tr>
                                  </thead>
                                <tbody className="bg-white">
                                    {sabaqTargets.map((st, i) => (
                                        <tr key={i} className="group transition-colors hover:bg-slate-50/30">
                                            {i % 2 === 0 && (
                                                <td rowSpan={2} className="px-4 py-4 whitespace-nowrap text-[15px] font-black text-slate-800 text-center border-r-2 border-b border-slate-100 bg-slate-50/20">
                                                    {st.kelas}
                                                </td>
                                            )}
                                            <td className="px-4 py-4 whitespace-nowrap text-[11px] font-black text-slate-600 text-center border-r-2 border-b border-slate-100 relative group/sem">
                                                {st.semester}
                                                {!isReadOnly && (
                                                    <button 
                                                      onClick={() => {
                                                          const NewD = [...sabaqTargets];
                                                          if (st.total === null) {
                                                              NewD[i].target = 1;
                                                          } else {
                                                              NewD[i].target = 'Kemampuan dan kelancaran membaca Qur’an';
                                                          }
                                                          
                                                          setSabaqTargets(recalculateSabaqTotals(NewD));
                                                      }}
                                                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white shadow-sm border border-slate-200 rounded-md text-slate-300 hover:text-indigo-600 opacity-0 group-hover/sem:opacity-100 transition-all z-10"
                                                      title={st.total === null ? "Ganti ke Mode Target" : "Ganti ke Mode Teks"}
                                                    >
                                                        <RefreshCw className={`w-2.5 h-2.5 ${st.total === null ? 'rotate-90' : ''} transition-transform`} />
                                                    </button>
                                                )}
                                            </td>

                                            {st.total === null ? (
                                                <td colSpan={2} className={`px-6 py-4 text-[10.5px] font-black text-slate-400 text-center bg-slate-50/5 border-b border-slate-100 uppercase tracking-widest ${!isReadOnly && 'cursor-pointer hover:bg-slate-50/50'} transition-all`} onClick={() => !isReadOnly && setEditingCell({ row: i, field: 'sabaq-target' })}>
                                                    {editingCell?.row === i && editingCell?.field === 'sabaq-target' ? (
                                                      <input 
                                                          autoFocus
                                                          type="text" 
                                                          value={st.target as string}
                                                          onChange={(e) => {
                                                              const NewD = [...sabaqTargets];
                                                              NewD[i].target = e.target.value;
                                                              setSabaqTargets(NewD);
                                                          }}
                                                          onBlur={() => setEditingCell(null)}
                                                          onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null); }}
                                                          className="w-full bg-white border-2 border-indigo-200 rounded-xl px-4 py-1.5 text-center font-black text-indigo-600 outline-none text-[10.5px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                                                      />
                                                    ) : (
                                                      st.target
                                                    )}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className={`px-6 py-4 text-[13px] text-indigo-700 font-black text-center ${!isReadOnly && 'cursor-pointer hover:bg-indigo-50/30'} transition-all border-r-2 border-b border-slate-100 bg-indigo-50/5`} onClick={() => !isReadOnly && setEditingCell({ row: i, field: 'sabaq-target' })}>
                                                        {editingCell?.row === i && editingCell?.field === 'sabaq-target' ? (
                                                            <div className="flex items-center justify-center gap-1 animate-in zoom-in-95 duration-100">
                                                              <input 
                                                                  autoFocus
                                                                  type="number" 
                                                                  step="0.1"
                                                                  value={st.target ?? ''}
                                                                      onChange={(e) => {
                                                                          const val = e.target.value;
                                                                          const sanitized = val.replace(/^0+(?=\d)/, '');
                                                                          const NewD = [...sabaqTargets];
                                                                          const numericVal = sanitized === '' ? 0 : parseFloat(sanitized);
                                                                          NewD[i].target = sanitized === '' ? '' : numericVal;
                                                                          
                                                                          setSabaqTargets(recalculateSabaqTotals(NewD));
                                                                      }}
                                                                      onBlur={() => {
                                                                          if (st.target === '') {
                                                                              const NewD = [...sabaqTargets];
                                                                              NewD[i].target = 0;
                                                                              setSabaqTargets(recalculateSabaqTotals(NewD));
                                                                          }
                                                                          setEditingCell(null);
                                                                      }}
                                                                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null); }}
                                                                  className="w-16 bg-white rounded-lg border-2 border-indigo-200 px-2 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                              />
                                                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Juz</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-1.5 group">
                                                                <span className="font-black text-indigo-700">{st.target}</span>
                                                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">JUZ</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-[13px] text-slate-500 font-black text-center whitespace-nowrap bg-slate-50/20 border-b border-slate-100">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className="font-black text-slate-600">{st.total && st.total > 0 ? st.total : (st.total === 0 ? 0 : '-')}</span>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{st.total !== null ? 'JUZ' : ''}</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'manzil' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 z-40 bg-white">
                                    <tr>
                                        <th className="px-4 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100 w-24">LEVEL</th>
                                        <th className="px-6 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100">JUMLAH HAFALAN</th>
                                        <th className="px-6 py-4 text-center text-[9.5px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-slate-100 bg-indigo-50/30">ACUAN TARGET MURAJA'AH (ATM/HARI)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {manzilAcuan.map((m, i) => (
                                        <tr key={i} className="group transition-colors hover:bg-slate-50/30">
                                            <td className="px-4 py-4 whitespace-nowrap text-[15px] font-black text-slate-800 text-center border-r-2 border-b border-slate-100 bg-slate-50/20 w-24">
                                                {m.id}
                                            </td>
                                            <td className={`px-6 py-4 text-[13px] text-slate-700 border-r-2 border-b border-slate-100 text-center transition-all ${!isReadOnly && 'cursor-pointer hover:bg-slate-50/50'}`} onClick={() => !isReadOnly && setEditingCell({ row: i, field: 'manzil-jumlah' })}>
                                                {editingCell?.row === i && editingCell?.field === 'manzil-jumlah' ? (
                                                  <div 
                                                    className="flex items-center justify-center gap-2 animate-in zoom-in-95 duration-100" 
                                                    onClick={e => e.stopPropagation()}
                                                    onBlur={e => {
                                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                            const newVal = [...manzilAcuan];
                                                            if (newVal[i].min > newVal[i].max) newVal[i].max = newVal[i].min;

                                                            // Cascade validation to prevent overlaps
                                                            for (let j = i + 1; j < newVal.length; j++) {
                                                                if (newVal[j].min <= newVal[j-1].max) {
                                                                    newVal[j].min = Math.min(30, newVal[j-1].max + 1);
                                                                    if (newVal[j].max < newVal[j].min) newVal[j].max = newVal[j].min;
                                                                }
                                                            }
                                                            for (let j = i - 1; j >= 0; j--) {
                                                                if (newVal[j].max >= newVal[j+1].min) {
                                                                    newVal[j].max = Math.max(1, newVal[j+1].min - 1);
                                                                    if (newVal[j].min > newVal[j].max) newVal[j].min = newVal[j].max;
                                                                }
                                                            }
                                                            setManzilAcuan(newVal);
                                                            setEditingCell(null);
                                                        }
                                                    }}
                                                  >
                                                    <input 
                                                        autoFocus
                                                        type="number" 
                                                        min="1"
                                                        max="30"
                                                        value={m.min}
                                                        onChange={e => {
                                                            const newVal = [...manzilAcuan];
                                                            const val = parseInt(e.target.value) || 0;
                                                            newVal[i].min = Math.min(30, val);
                                                            setManzilAcuan(newVal);
                                                        }}
                                                        onKeyDown={(e) => { 
                                                            if (e.key === 'Enter') {
                                                                const newVal = [...manzilAcuan];
                                                                if (newVal[i].min > newVal[i].max) newVal[i].max = newVal[i].min;
                                                                
                                                                for (let j = i + 1; j < newVal.length; j++) {
                                                                    if (newVal[j].min <= newVal[j-1].max) {
                                                                        newVal[j].min = Math.min(30, newVal[j-1].max + 1);
                                                                        if (newVal[j].max < newVal[j].min) newVal[j].max = newVal[j].min;
                                                                    }
                                                                }
                                                                for (let j = i - 1; j >= 0; j--) {
                                                                    if (newVal[j].max >= newVal[j+1].min) {
                                                                        newVal[j].max = Math.max(1, newVal[j+1].min - 1);
                                                                        if (newVal[j].min > newVal[j].max) newVal[j].min = newVal[j].max;
                                                                    }
                                                                }
                                                                setManzilAcuan(newVal);
                                                                setEditingCell(null);
                                                            }
                                                        }}
                                                        className="w-12 bg-white rounded-lg border-2 border-indigo-200 px-1 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                    />
                                                    <span className="text-slate-300 font-black">-</span>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        max="30"
                                                        value={m.max}
                                                        onChange={e => {
                                                            const newVal = [...manzilAcuan];
                                                            const val = parseInt(e.target.value) || 0;
                                                            newVal[i].max = Math.min(30, val);
                                                            setManzilAcuan(newVal);
                                                        }}
                                                        onKeyDown={(e) => { 
                                                            if (e.key === 'Enter') {
                                                                const newVal = [...manzilAcuan];
                                                                if (newVal[i].min > newVal[i].max) newVal[i].max = newVal[i].min;
                                                                
                                                                for (let j = i + 1; j < newVal.length; j++) {
                                                                    if (newVal[j].min <= newVal[j-1].max) {
                                                                        newVal[j].min = Math.min(30, newVal[j-1].max + 1);
                                                                        if (newVal[j].max < newVal[j].min) newVal[j].max = newVal[j].min;
                                                                    }
                                                                }
                                                                for (let j = i - 1; j >= 0; j--) {
                                                                    if (newVal[j].max >= newVal[j+1].min) {
                                                                        newVal[j].max = Math.max(1, newVal[j+1].min - 1);
                                                                        if (newVal[j].min > newVal[j].max) newVal[j].min = newVal[j].max;
                                                                    }
                                                                }
                                                                setManzilAcuan(newVal);
                                                                setEditingCell(null);
                                                            }
                                                        }}
                                                        className="w-12 bg-white rounded-lg border-2 border-indigo-200 px-1 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                    />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">JUZ</span>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center justify-center gap-1.5 group">
                                                    <span className="font-black text-slate-700">{m.min} - {m.max}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JUZ</span>
                                                  </div>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-[13px] text-indigo-700 font-black text-center transition-all border-b border-slate-100 bg-indigo-50/5 ${!isReadOnly && 'cursor-pointer hover:bg-indigo-50/30'}`} onClick={() => !isReadOnly && setEditingCell({ row: i, field: 'manzil-atm' })}>
                                                {editingCell?.row === i && editingCell?.field === 'manzil-atm' ? (
                                                  <div className="flex items-center justify-center gap-1.5 animate-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                                                    <input 
                                                        autoFocus
                                                        type="number" 
                                                        value={m.atm}
                                                        onChange={e => {
                                                            const newVal = [...manzilAcuan];
                                                            newVal[i].atm = parseInt(e.target.value) || 0;
                                                            setManzilAcuan(newVal);
                                                        }}
                                                        onBlur={() => setEditingCell(null)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null); }}
                                                        className="w-16 bg-white rounded-lg border-2 border-indigo-200 px-2 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                    />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">HLM</span>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center justify-center gap-2">
                                                      <span className="font-black text-indigo-700">{m.atm}</span>
                                                      <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">HALAMAN</span>
                                                  </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'sabqi' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 z-40 bg-white">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-[9.5px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-r-2 border-slate-100">JUMLAH HAFALAN BARU</th>
                                        <th className="px-6 py-4 text-center text-[9.5px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-slate-100 bg-indigo-50/30">TARGET MURAJA'AH SABQI</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {sabqiAcuan.map((s, i) => (
                                        <tr key={i} className="group transition-colors hover:bg-slate-50/30">
                                             <td className={`px-6 py-4 whitespace-nowrap text-[13px] font-black text-slate-700 border-r-2 border-b border-slate-100 transition-all text-center bg-slate-50/20 ${!isReadOnly && 'cursor-pointer hover:bg-slate-50/50'}`} onClick={() => !isReadOnly && setEditingCell({ row: i, field: 'sabqi-hafalan' })}>
                                                {editingCell?.row === i && editingCell?.field === 'sabqi-hafalan' ? (
                                                  <div 
                                                    className="flex items-center justify-center gap-2 animate-in zoom-in-95 duration-100" 
                                                    onClick={e => e.stopPropagation()}
                                                    onBlur={e => {
                                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                            const newVal = [...sabqiAcuan];
                                                            if (newVal[i].min > newVal[i].max) newVal[i].max = newVal[i].min;

                                                            // Cascade validation to prevent overlaps
                                                            for (let j = i + 1; j < newVal.length; j++) {
                                                                if (newVal[j].min <= newVal[j-1].max) {
                                                                    newVal[j].min = newVal[j-1].max + 1;
                                                                    if (newVal[j].max < newVal[j].min) newVal[j].max = newVal[j].min;
                                                                }
                                                            }
                                                            for (let j = i - 1; j >= 0; j--) {
                                                                if (newVal[j].max >= newVal[j+1].min) {
                                                                    newVal[j].max = Math.max(1, newVal[j+1].min - 1);
                                                                    if (newVal[j].min > newVal[j].max) newVal[j].min = newVal[j].max;
                                                                }
                                                            }
                                                            setSabqiAcuan(newVal);
                                                            setEditingCell(null);
                                                        }
                                                    }}
                                                  >
                                                    <input 
                                                        autoFocus
                                                        type="number" 
                                                        min="1"
                                                        value={s.min}
                                                        onChange={e => {
                                                            const newVal = [...sabqiAcuan];
                                                            const val = parseInt(e.target.value) || 0;
                                                            newVal[i].min = val;
                                                            setSabqiAcuan(newVal);
                                                        }}
                                                        onKeyDown={(e) => { 
                                                            if (e.key === 'Enter') {
                                                                const newVal = [...sabqiAcuan];
                                                                if (newVal[i].min > newVal[i].max) newVal[i].max = newVal[i].min;
                                                                
                                                                for (let j = i + 1; j < newVal.length; j++) {
                                                                    if (newVal[j].min <= newVal[j-1].max) {
                                                                        newVal[j].min = newVal[j-1].max + 1;
                                                                        if (newVal[j].max < newVal[j].min) newVal[j].max = newVal[j].min;
                                                                    }
                                                                }
                                                                for (let j = i - 1; j >= 0; j--) {
                                                                    if (newVal[j].max >= newVal[j+1].min) {
                                                                        newVal[j].max = Math.max(1, newVal[j+1].min - 1);
                                                                        if (newVal[j].min > newVal[j].max) newVal[j].min = newVal[j].max;
                                                                    }
                                                                }
                                                                setSabqiAcuan(newVal);
                                                                setEditingCell(null);
                                                            }
                                                        }}
                                                        className="w-12 bg-white rounded-lg border-2 border-indigo-200 px-1 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                    />
                                                    <span className="text-slate-300 font-black">-</span>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={s.max}
                                                        onChange={e => {
                                                            const newVal = [...sabqiAcuan];
                                                            const val = parseInt(e.target.value) || 0;
                                                            newVal[i].max = val;
                                                            setSabqiAcuan(newVal);
                                                        }}
                                                        onKeyDown={(e) => { 
                                                            if (e.key === 'Enter') {
                                                                const newVal = [...sabqiAcuan];
                                                                if (newVal[i].min > newVal[i].max) newVal[i].max = newVal[i].min;
                                                                
                                                                for (let j = i + 1; j < newVal.length; j++) {
                                                                    if (newVal[j].min <= newVal[j-1].max) {
                                                                        newVal[j].min = newVal[j-1].max + 1;
                                                                        if (newVal[j].max < newVal[j].min) newVal[j].max = newVal[j].min;
                                                                    }
                                                                }
                                                                for (let j = i - 1; j >= 0; j--) {
                                                                    if (newVal[j].max >= newVal[j+1].min) {
                                                                        newVal[j].max = Math.max(1, newVal[j+1].min - 1);
                                                                        if (newVal[j].min > newVal[j].max) newVal[j].min = newVal[j].max;
                                                                    }
                                                                }
                                                                setSabqiAcuan(newVal);
                                                                setEditingCell(null);
                                                            }
                                                        }}
                                                        className="w-12 bg-white rounded-lg border-2 border-indigo-200 px-1 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                    />
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">HLM</span>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center justify-center gap-1.5 group">
                                                    <span className="font-black text-slate-700">{s.min} - {s.max}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HLM</span>
                                                  </div>
                                                )}
                                             </td>
                                             <td 
                                                 className={`px-6 py-4 font-black text-center transition-all border-b border-slate-100 bg-indigo-50/5 ${!isReadOnly && 'cursor-pointer hover:bg-indigo-50/30'}`} 
                                                 onClick={() => {
                                                     if (isReadOnly) return;
                                                     setEditingCell({ row: i, field: 'sabqi-murajaah' });
                                                     setSabqiEditMode('value');
                                                      setTempSabqiType(s.murajaah);
                                                 }}
                                                 onDoubleClick={() => {
                                                     if (isReadOnly) return;
                                                     setEditingCell({ row: i, field: 'sabqi-murajaah' });
                                                     setSabqiEditMode('type');
                                                      setTempSabqiType(s.murajaah);
                                                 }}
                                             >
                                                 {editingCell?.row === i && editingCell?.field === 'sabqi-murajaah' ? (
                                                   <div onClick={e => e.stopPropagation()} className="flex items-center justify-center gap-2">
                                                     {sabqiEditMode === 'type' || tempSabqiType === 'Rabth' ? (
                                                       <div className="flex items-center gap-2 p-1 bg-white rounded-full shadow-lg border-2 border-indigo-100 animate-in zoom-in-95 duration-100 w-fit mx-auto">
                                                          <div className="flex p-0.5 bg-slate-100 rounded-full">
                                                              <button 
                                                                  onClick={() => setTempSabqiType('Rabth')}
                                                                  className={`px-3 py-1.5 text-[10px] font-black rounded-full transition-all ${tempSabqiType === 'Rabth' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                              >
                                                                  RABTH
                                                              </button>
                                                              <button 
                                                                  onClick={() => {
                                                                      if (tempSabqiType === 'Rabth' || !tempSabqiType) {
                                                                          setTempSabqiType('1');
                                                                      }
                                                                  }}
                                                                  className={`px-3 py-1.5 text-[10px] font-black rounded-full transition-all ${tempSabqiType && tempSabqiType !== 'Rabth' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                              >
                                                                  HALAMAN
                                                              </button>
                                                          </div>
                                                          <button 
                                                              onClick={() => {
                                                                  const newVal = [...sabqiAcuan];
                                                                  newVal[i].murajaah = tempSabqiType || s.murajaah;
                                                                  setSabqiAcuan(newVal);
                                                                  setEditingCell(null);
                                                              }}
                                                              className="px-4 py-2 text-[10px] font-black bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md whitespace-nowrap active:scale-95 transition-all"
                                                          >
                                                              OK
                                                          </button>
                                                       </div>
                                                     ) : (
                                                      <div className="flex items-center justify-center gap-1.5 animate-in zoom-in-95 duration-100">
                                                          <input 
                                                              autoFocus
                                                              type="number" 
                                                              min="1"
                                                              value={parseInt(s.murajaah) || 1}
                                                              onChange={e => {
                                                                  const newVal = [...sabqiAcuan];
                                                                  newVal[i].murajaah = e.target.value;
                                                                  setSabqiAcuan(newVal);
                                                              }}
                                                              onBlur={() => setEditingCell(null)}
                                                              onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null); }}
                                                              className="w-16 bg-white rounded-lg border-2 border-indigo-200 px-2 py-1 focus:ring-4 focus:ring-indigo-50 text-center font-black text-indigo-600 shadow-sm text-[13px] outline-none"
                                                          />
                                                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">HLM</span>
                                                      </div>
                                                     )}
                                                   </div>
                                                 ) : (
                                                  <div className="flex items-center justify-center text-indigo-700 font-extrabold text-[13px] tracking-tight">
                                                      <ChevronRight className="w-4 h-4 mr-1.5 text-indigo-300" />
                                                      {s.murajaah}
                                                      {s.murajaah !== 'Rabth' && <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1.5">HALAMAN</span>}
                                                  </div>
                                                 )}
                                             </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar Info - Important Box (Right) */}
        <div className="lg:col-span-1 space-y-4 sticky top-6">
            <div className="bg-indigo-600 rounded-[28px] p-6 shadow-xl shadow-indigo-100 border border-indigo-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner">
                        <Info className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">Penting</h4>
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] opacity-80">Penyesuaian Kurikulum</p>
                    </div>

                    <p className="text-[11px] text-white/90 font-bold leading-relaxed">
                        Data target ini akan menjadi standar acuan sistem dalam mengukur ketercapaian hafalan santri di Dashboard Guru dan Laporan Wali Santri.
                    </p>

                    <div className="pt-2 bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] text-white/80 font-bold italic leading-tight">
                        "Klik pada teks di dalam tabel untuk menyesuaikan angka target dengan kebijakan sekolah secara instan."
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[28px] p-5 border-2 border-slate-50 shadow-sm">
                 <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tip Navigasi</h5>
                 <div className="space-y-3">
                     <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                         <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                             <span className="text-[10px] font-black">1</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-600">Pilih tab acuan di bagian kiri atas halaman.</p>
                     </div>
                     <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors bg-slate-50/50 border border-slate-100">
                         <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                             <Save className="w-3 h-3" />
                         </div>
                         <p className="text-[10px] font-bold text-slate-600">Jangan lupa klik "Simpan Konfigurasi" untuk menerapkan perubahan permanen.</p>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
