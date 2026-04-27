import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Student, MemorizationRecord, MemorizationType, Halaqah, WeeklyTarget } from '../../types';
import { getStudents, getTenantRecords, getHalaqahs, getUsers, getTenant, updateTenant, getWeeklyTargetsInRange } from '../../services/dataService';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { BookOpen, Calendar, Search, ChevronDown, Activity, Users, User, ArrowRight, TrendingUp, ChevronRight, Target, Plus, Trash2, HelpCircle, X, Save, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tenant } from '../../types';

// --- Sub Component: Manage Target Info Modal ---
interface ManageTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
    onSave: (info: { label: string; value: string }[]) => Promise<void>;
}

const ManageTargetInfoModal: React.FC<ManageTargetModalProps> = ({ isOpen, onClose, tenant, onSave }) => {
    const [infoList, setInfoList] = useState<{ label: string; value: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; index: number | null }>({ show: false, index: null });

    useEffect(() => {
        if (isOpen && tenant?.curriculum_config?.target_info) {
            setInfoList(tenant.curriculum_config.target_info);
        } else if (isOpen) {
            // Default if empty
            setInfoList([
                { label: 'Kelas 1 - 2', value: '3 Baris' },
                { label: 'Kelas 3 - 4', value: '5 Baris' },
                { label: 'Kelas 5 - 6', value: '7 Baris' }
            ]);
        }
    }, [isOpen, tenant]);

    if (!isOpen) return null;

    const handleAddItem = () => {
        setInfoList([...infoList, { label: '', value: '' }]);
    };

    const handleConfirmDelete = (index: number) => {
        setDeleteConfirm({ show: true, index });
    };

    const executeDelete = () => {
        if (deleteConfirm.index !== null) {
            setInfoList(infoList.filter((_, i) => i !== deleteConfirm.index));
        }
        setDeleteConfirm({ show: false, index: null });
    };

    const handleUpdateItem = (index: number, field: 'label' | 'value', value: string) => {
        const newList = [...infoList];
        newList[index][field] = value;
        setInfoList(newList);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await onSave(infoList);
            onClose();
        } catch (error) {
            console.error("Error saving target info:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 lg:pl-64 pt-16"
            onClick={onClose}
        >
            <div 
                className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                             <Target className="w-4 h-4 text-indigo-500" />
                             Target Hafalan
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acuan Standar Hafalan Santri</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto scrollbar-hide space-y-4">
                    <div className="space-y-3">
                        {infoList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Keterangan</label>
                                    <input 
                                        type="text" 
                                        value={item.label}
                                        onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                                        placeholder="Penerima Target..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10.5px] font-black text-slate-800 focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target</label>
                                    <input 
                                        type="text" 
                                        value={item.value}
                                        onChange={(e) => handleUpdateItem(idx, 'value', e.target.value)}
                                        placeholder="Target..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10.5px] font-black text-slate-800 focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleConfirmDelete(idx)}
                                    className="mt-5 p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-rose-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleAddItem}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Tambah Baris Target</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex items-center gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 rounded-xl transition-all active:scale-95"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[1.5] py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Simpan Perubahan</span>
                    </button>
                </div>

                {/* INNER CUSTOM CONFIRM OVERLAY */}
                {deleteConfirm.show && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50 relative">
                            <button 
                                onClick={() => setDeleteConfirm({ show: false, index: null })}
                                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-300" />
                            </button>

                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-rose-50 rounded-[22px] flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-sm border border-rose-100/50">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest leading-normal mb-2">Hapus Target?</h3>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide opacity-80">
                                    Hapus target <span className="text-slate-800">{infoList[deleteConfirm.index!]?.label || 'ini'}</span>?
                                </p>
                                <p className="text-[9px] font-black text-rose-500 mt-4 uppercase tracking-[0.05em]">
                                    Data yang dihapus tidak dapat dipulihkan.
                                </p>
                            </div>
                            
                            <div className="px-6 pb-8 flex items-center gap-2">
                                <button 
                                    onClick={() => setDeleteConfirm({ show: false, index: null })}
                                    className="flex-1 py-3.5 bg-white text-slate-400 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={executeDelete}
                                    className="flex-[1.5] py-3.5 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95 outline-none"
                                >
                                    Ya, Hapus Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const MonitorHafalan: React.FC<{ user: UserProfile, tenantId: string }> = ({ user, tenantId }) => {
    // 1. State for Date Range (Default: Last 30 days)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState<Student[]>([]);
    const [halaqahs, setHalaqahs] = useState<Halaqah[]>([]);
    const [teachers, setTeachers] = useState<UserProfile[]>([]);
    const [records, setRecords] = useState<MemorizationRecord[]>([]);
    const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'nis' | 'sabaq' | 'sabqi' | 'manzil'>('nis');
    const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>("all");
    const [showNisMobile, setShowNisMobile] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [selectedMonth, setSelectedMonth] = useState<string>("custom");

    const monthOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        return monthNames.map((name, index) => {
            const m = String(index + 1).padStart(2, '0');
            return { value: `${currentYear}-${m}`, label: name.toUpperCase() };
        });
    }, []);

    useEffect(() => {
        if (tenantId) {
            fetchData();
        }
    }, [tenantId, startDate, endDate]);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedHalaqahId, sortBy]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allStudents, allHalaqahs, allUsers, currentTenant] = await Promise.all([
                getStudents(tenantId),
                getHalaqahs(tenantId),
                getUsers(tenantId),
                getTenant(tenantId)
            ]);
            
            setStudents(allStudents);
            
            const enrichedHalaqahs = allHalaqahs.map(h => {
                const teacher = allUsers.find(u => u.id === h.teacher_id);
                return { ...h, teacher_name: teacher?.full_name || '-' };
            });
            setHalaqahs(enrichedHalaqahs);
            setTeachers(allUsers);
            setTenant(currentTenant);
            
            if (allStudents.length > 0) {
                const studentIds = allStudents.map(s => s.id);
                const [recs, targets] = await Promise.all([
                    getTenantRecords(studentIds, startDate, endDate),
                    getWeeklyTargetsInRange(studentIds, startDate, endDate)
                ]);
                setRecords(recs);
                setWeeklyTargets(targets);
            }
        } catch (error) {
            console.error("[MonitorHafalan] Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTargetInfo = async (infoList: { label: string; value: string }[]) => {
        if (!tenantId || !user) return;
        try {
            const updates = {
                curriculum_config: {
                    ...(tenant?.curriculum_config || {}),
                    target_info: infoList
                }
            };
            const updatedTenant = await updateTenant(tenantId, updates, user);
            setTenant(updatedTenant);
        } catch (error) {
            console.error("Failed to save target info:", error);
            throw error;
        }
    };

    // 2. Data Aggregation per Student
    const studentStats = students.map(student => {
        const studentRecords = records.filter(r => r.student_id === student.id);
        const halaqah = halaqahs.find(h => h.id === student.halaqah_id);
        const currentTeacherId = halaqah?.teacher_id;
        const pengampu = teachers.find(t => t.id === currentTeacherId);
        
        let sabaqBaris = 0;
        
        // Get the latest weekly target to get Juz info
        const studentTargets = weeklyTargets.filter(t => t.student_id === student.id);
        const latestTarget = studentTargets.length > 0 ? studentTargets[0] : null; // Sorted by week_start DESC in service
        const totalJuz = latestTarget?.target_data?.current_juz ? `${latestTarget.target_data.current_juz} Juz` : '-';

        studentRecords.forEach(r => {
            const amount = Number(r.ayat_end || r.jumlah || 0);
            if (r.type === MemorizationType.SABAQ) sabaqBaris += amount;
        });

        return {
            ...student,
            halaqahName: halaqah?.name || 'Belum Ada',
            teacherName: pengampu?.full_name || halaqah?.teacher_name || '-',
            teacherId: currentTeacherId || 'none',
            sabaqBaris,
            totalJuz
        };
    });

    const filteredAndSortedStats = studentStats
        .filter(s => {
            const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 s.nis?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesHalaqah = selectedHalaqahId === "all" || s.halaqah_id === selectedHalaqahId;
            return matchesSearch && matchesHalaqah;
        })
        .sort((a, b) => {
            if (sortBy === 'sabaq') return b.sabaqBaris - a.sabaqBaris;
            return (a.nis || '').localeCompare(b.nis || '');
        });

    const totalPages = Math.ceil(filteredAndSortedStats.length / itemsPerPage);
    const paginatedStats = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedStats.slice(start, start + itemsPerPage);
    }, [filteredAndSortedStats, currentPage, itemsPerPage]);

    return (
        <div className="flex flex-col gap-3 md:gap-6 animate-fade-in pb-12">
            {/* Premium Two-Row Filter Bar */}
            <div className="flex flex-col gap-3 mb-4 md:mb-6 animate-in slide-in-from-top-4 duration-500 sticky top-0 z-[100]">
                {/* ROW 1: PRIMARY FILTERS */}
                <div className="flex flex-col lg:flex-row items-center gap-2 p-2 lg:p-1.5 bg-white/80 rounded-[28px] lg:rounded-[40px] border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full h-auto lg:h-[60px] backdrop-blur-sm relative z-30">
                    {/* Section 1: Search Input */}
                    <div className="relative w-full lg:flex-[1.5] lg:min-w-[140px] group h-10 lg:h-11">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="CARI SANTRI..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full pl-11 pr-4 bg-white border border-slate-50 rounded-full focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-400 transition-all text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 outline-none shadow-sm"
                        />
                    </div>

                    {/* Section 2: Selectors Group */}
                    <div className="flex flex-row items-center gap-1.5 lg:gap-2 w-full lg:w-auto h-10 lg:h-11">
                        {/* Combined Halaqah / Teacher Box */}
                        <div className="relative flex-[1.5] lg:flex-none h-full lg:min-w-[200px] bg-white border border-slate-50 rounded-[18px] lg:rounded-2xl shadow-sm hover:border-indigo-200 transition-all px-3 lg:px-4 flex items-center group/select">
                            <select 
                                value={selectedHalaqahId}
                                onChange={(e) => setSelectedHalaqahId(e.target.value)}
                                className="w-full bg-transparent text-[9px] lg:text-[10px] font-black text-slate-700 uppercase tracking-widest focus:outline-none appearance-none cursor-pointer pr-4 truncate"
                            >
                                <option value="all">HALAQOH / PENGAMPU</option>
                                {halaqahs.map(h => (
                                    <option key={h.id} value={h.id}>{h.name.toUpperCase()} / {h.teacher_name?.toUpperCase() || '-'}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-300 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                        </div>

                        {/* Ranking Box */}
                        <div className="relative flex-1 lg:flex-none h-full lg:min-w-[120px] bg-white border border-slate-50 rounded-[18px] lg:rounded-2xl shadow-sm hover:border-indigo-200 transition-all px-3 lg:px-4 flex items-center group/select">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full bg-transparent text-[9px] lg:text-[10px] font-black text-slate-700 uppercase tracking-widest focus:outline-none appearance-none cursor-pointer pr-4 truncate"
                            >
                                <option value="nis">URUTAN</option>
                                <option value="sabaq">SABAQ</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-300 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                        </div>

                        {/* Manage Target Button */}
                        <button 
                            onClick={() => setIsManageModalOpen(true)}
                            className="h-full w-10 lg:w-11 bg-indigo-600 border border-indigo-600 rounded-[18px] lg:rounded-2xl text-white hover:bg-indigo-700 transition-all flex items-center justify-center group shrink-0 shadow-lg shadow-indigo-100/50"
                            title="Kelola Target"
                        >
                            <Target className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* ROW 2: TIME FILTERS */}
                <div className="flex flex-row items-center justify-between p-1.5 bg-slate-50/50 rounded-full border border-slate-100 shadow-sm w-full h-[56px] backdrop-blur-sm relative z-20">
                    {/* Month Quick Selector */}
                    <div className="relative flex-none h-8 lg:h-10 min-w-[100px] lg:min-w-[160px] bg-white border border-slate-200/60 rounded-xl shadow-sm hover:border-indigo-200 transition-all px-1.5 lg:px-4 flex items-center group/month">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 mr-2 shrink-0" />
                        <select 
                            value={selectedMonth}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedMonth(val);
                                if (val !== 'custom') {
                                    const [y, m] = val.split('-').map(Number);
                                    const firstDay = new Date(y, m - 1, 1);
                                    const lastDay = new Date(y, m, 0);
                                    setStartDate(firstDay.toISOString().split('T')[0]);
                                    setEndDate(lastDay.toISOString().split('T')[0]);
                                }
                            }}
                            className="w-full bg-transparent text-[9.5px] font-black text-slate-700 uppercase tracking-widest focus:outline-none appearance-none cursor-pointer pr-4 truncate"
                        >
                            <option value="custom">BULAN</option>
                            {monthOptions.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none group-hover/month:text-indigo-400 transition-colors" />
                    </div>

                    {/* Date Range Group */}
                    <div className="flex items-center gap-1 bg-white/50 border border-slate-200/60 rounded-xl px-1 py-0.5 shadow-sm shrink-0">
                        <div className="h-7 lg:h-9 px-1.5 lg:px-3 bg-white border border-slate-100 rounded-lg flex items-center hover:border-indigo-200 transition-all">
                            <CustomDatePicker 
                                value={startDate} 
                                align="right"
                                onChange={(val) => {
                                    setStartDate(val);
                                    setSelectedMonth("custom");
                                }} 
                            />
                        </div>
                        
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                        <div className="h-7 lg:h-9 px-1.5 lg:px-3 bg-white border border-slate-100 rounded-lg flex items-center hover:border-indigo-200 transition-all">
                            <CustomDatePicker 
                                value={endDate} 
                                align="right"
                                onChange={(val) => {
                                    setEndDate(val);
                                    setSelectedMonth("custom");
                                }} 
                            />
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-white border border-slate-200/60 rounded-full shadow-sm">
                         <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Periode:</span>
                         <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                            {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                    </div>
                </div>
            </div>


            <div className="bg-white shadow-sm border-2 border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
                {/* Table Section */}
                <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-40 bg-white shadow-sm">
                            <tr>
                                <th rowSpan={2} className="w-[30px] md:w-[45px] sticky left-0 bg-white z-50 px-1 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100">NO</th>
                                <th rowSpan={2} className={`${showNisMobile ? 'table-cell' : 'hidden'} md:table-cell w-[65px] md:w-[100px] min-w-[65px] md:min-w-[100px] sticky left-[30px] md:left-[45px] bg-white z-50 px-1 md:px-3 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100`}>NIS</th>
                                <th rowSpan={2} className={`w-auto md:w-[180px] sticky ${showNisMobile ? 'left-[95px]' : 'left-[30px]'} md:left-[145px] bg-white z-50 px-2 md:px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-left border-b-2 border-r-2 border-slate-100`}>NAMA SANTRI</th>
                                <th rowSpan={2} className="hidden md:table-cell px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[240px]">HALAQOH ( <span className='text-indigo-600'>PENGAMPU</span> )</th>
                                <th colSpan={2} className="px-4 py-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest text-center border-b-2 border-slate-100 bg-indigo-50/50">STATISTIK SETORAN</th>
                            </tr>
                            <tr className="bg-white">
                                <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-r-2 border-slate-100 bg-white w-[85px] md:min-w-[100px]">SABAQ</th>
                                <th className="px-2 py-3 text-[8.5px] font-black text-slate-500 uppercase text-center border-b-2 border-slate-100 bg-white w-[90px] md:min-w-[120px]">TOTAL JUZ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="sticky left-0 bg-white border-r-2 border-b border-slate-100 w-[30px] md:w-[45px]"><Skeleton className="h-4 w-4 mx-auto" /></td>
                                        <td className={`${showNisMobile ? 'table-cell' : 'hidden'} md:table-cell sticky left-[30px] md:left-[45px] bg-white border-r-2 border-b border-slate-100 w-[65px] md:w-[100px]`}><Skeleton className="h-4 w-12 mx-auto" /></td>
                                        <td className={`sticky ${showNisMobile ? 'left-[95px]' : 'left-[30px]'} md:left-[145px] bg-white border-r-2 border-b border-slate-100 w-auto md:w-[180px]`}><Skeleton className="h-4 w-24" /></td>
                                        <td className="hidden md:table-cell px-4 py-4 border-r-2 border-b border-slate-100"><Skeleton className="h-4 w-40 mx-auto" /></td>
                                        <td className="px-4 py-4 border-r-2 border-b border-slate-100"><Skeleton className="h-4 w-10 mx-auto" /></td>
                                        <td className="px-4 py-4 border-b border-slate-100"><Skeleton className="h-4 w-10 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : paginatedStats.length > 0 ? (
                                paginatedStats.map((stat, index) => (
                                    <tr key={stat.id} className="group transition-colors hover:bg-slate-50/30">
                                        <td className="sticky left-0 bg-white px-1 py-4 text-[10px] md:text-[10.5px] font-black text-slate-400 text-center border-r-2 border-b border-slate-100 z-20 group-hover:bg-slate-50 transition-colors uppercase w-[30px] md:w-[45px]">
                                            {String((currentPage - 1) * itemsPerPage + index + 1)}
                                        </td>
                                        <td className={`${showNisMobile ? 'table-cell' : 'hidden'} md:table-cell sticky left-[30px] md:left-[45px] bg-white px-1 md:px-3 py-4 text-[9.5px] md:text-[10.5px] font-black text-slate-500 text-center border-r-2 border-b border-slate-100 z-20 group-hover:bg-slate-50 transition-colors tracking-tighter w-[65px] md:w-[100px]`}>
                                            {stat.nis || '-'}
                                        </td>
                                        <td className={`sticky ${showNisMobile ? 'left-[95px]' : 'left-[30px]'} md:left-[145px] bg-white px-2 py-4 text-[10.5px] md:text-[11px] font-bold text-slate-800 border-r-2 border-b border-slate-100 z-20 group-hover:bg-slate-50 transition-colors truncate w-auto md:w-[180px]`}>
                                            <span className="capitalize" title={stat.full_name}>{stat.full_name}</span>
                                        </td>
                                        <td className="hidden md:table-cell px-4 py-4 text-[10px] font-black text-slate-600 text-start border-r-2 border-b border-slate-100 uppercase tracking-tight whitespace-nowrap min-w-[240px]">
                                            <span className="text-slate-800">{stat.halaqahName}</span>
                                            <span className="mx-1 text-slate-300 font-bold">(</span>
                                            <span className="text-indigo-600 font-black">{stat.teacherName}</span>
                                            <span className="mx-1 text-slate-300 font-bold">)</span>
                                        </td>
                                        <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100 bg-indigo-50/5">
                                            <span className={`text-[11px] font-black ${stat.sabaqBaris > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                {stat.sabaqBaris > 0 ? `${stat.sabaqBaris} Baris` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center border-b border-slate-100 bg-amber-50/5">
                                            <span className={`text-[10.5px] font-bold ${stat.totalJuz !== '-' ? 'text-amber-600' : 'text-slate-300'} tracking-tight`}>
                                                {stat.totalJuz}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-24 text-center border-b border-slate-100">
                                        <div className="flex flex-col items-center opacity-30">
                                            <Activity className="w-12 h-12 text-slate-400 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tidak ada data setoran ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {!loading && filteredAndSortedStats.length > 0 && (
                    <div className="bg-[#F8FAFC] border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-3xl">
                        <div className="flex items-center gap-2">
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white border-2 border-slate-50 rounded-xl px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-sm transition-all"
                            >
                                {[10, 25, 50, 100].map(val => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                            </select>
                            <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                <span className="hidden sm:inline">DATA</span> {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, filteredAndSortedStats.length)} <span className="hidden sm:inline text-slate-300">/</span> <span className="text-primary-600 ml-0.5">{filteredAndSortedStats.length}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-0.5 md:gap-1">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
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
                                            className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border-2 border-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className={`p-1.5 md:p-2 rounded-xl border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-200 border-slate-50 cursor-not-allowed' : 'text-slate-600 border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-200 shadow-sm'}`}
                            >
                                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MANAGE MODAL */}
            <ManageTargetInfoModal 
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                tenant={tenant}
                onSave={handleSaveTargetInfo}
            />
        </div>
    );
};
