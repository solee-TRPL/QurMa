import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Student, MemorizationRecord, MemorizationType, Halaqah, WeeklyTarget, UserRole } from '../../types';
import { getStudents, getTenantRecords, getHalaqahs, getUsers, getTenant, updateTenant, getWeeklyTargetsInRange } from '../../services/dataService';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { BookOpen, Calendar, Search, ChevronDown, Activity, Users, User, ArrowRight, TrendingUp, ChevronRight, Target, Plus, Trash2, HelpCircle, X, Save, AlertTriangle, GraduationCap, Clock, Crosshair } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tenant } from '../../types';
import ExcelJS from 'exceljs';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';
import { Download } from 'lucide-react';

// --- Sub Component: Manage Target Info Modal ---
interface ManageTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
    onSave: (info: { label: string; value: string }[]) => Promise<void>;
    isReadOnly?: boolean;
}

const ManageTargetInfoModal: React.FC<ManageTargetModalProps> = ({ isOpen, onClose, tenant, onSave, isReadOnly = false }) => {
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
            className="fixed inset-0 z-999999 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 lg:pl-64 pt-16"
            onClick={onClose}
        >
            <div 
                className="relative bg-white rounded-[24px] md:rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white flex flex-col max-h-[90vh] md:max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-[11px] md:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                             <Crosshair className="w-3.5 h-3.5 md:w-4 md:h-4 text-jade-500" />
                             Target Hafalan
                        </h3>
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">Acuan Standar Hafalan Santri</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 overflow-y-auto scrollbar-hide space-y-3 md:space-y-4">
                    <div className="space-y-2.5 md:space-y-3">
                        {infoList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 md:gap-2 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex-1 space-y-0.5 md:space-y-1">
                                    <label className="text-[7.5px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Keterangan</label>
                                    <input 
                                        type="text" 
                                        value={item.label}
                                        onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                                        placeholder="Penerima..."
                                        disabled={isReadOnly}
                                        className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9.5px] md:text-[10.5px] font-black text-slate-800 transition-all outline-none ${isReadOnly ? 'opacity-70 cursor-not-allowed' : 'focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white'}`}
                                    />
                                </div>
                                <div className="flex-1 space-y-0.5 md:space-y-1">
                                    <label className="text-[7.5px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target</label>
                                    <input 
                                        type="text" 
                                        value={item.value}
                                        onChange={(e) => handleUpdateItem(idx, 'value', e.target.value)}
                                        placeholder="Target..."
                                        disabled={isReadOnly}
                                        className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9.5px] md:text-[10.5px] font-black text-slate-800 transition-all outline-none ${isReadOnly ? 'opacity-70 cursor-not-allowed' : 'focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white'}`}
                                    />
                                </div>
                                {!isReadOnly && (
                                    <button 
                                        onClick={() => handleConfirmDelete(idx)}
                                        className="mt-4 md:mt-5 p-2 md:p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-rose-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {!isReadOnly && (
                        <button 
                            onClick={handleAddItem}
                            className="hidden lg:flex w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-jade-500 hover:border-jade-200 hover:bg-jade-50/30 transition-all items-center justify-center gap-2 group"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Tambah Baris Target</span>
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex items-center gap-2 md:gap-3">
                    {isReadOnly ? (
                        <button 
                            onClick={onClose}
                            className="w-full py-3.5 bg-slate-800 text-white rounded-xl text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 shadow-xl shadow-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Tutup
                        </button>
                    ) : (
                        <>
                            {/* COMPACT ADD BUTTON (Mobile Only) */}
                            <button 
                                onClick={handleAddItem}
                                className="lg:hidden h-10 w-10 shrink-0 flex items-center justify-center bg-jade-50 text-jade-600 rounded-xl border border-jade-100 shadow-sm active:scale-90 transition-all"
                                title="Tambah Baris"
                            >
                                <Plus className="w-5 h-5" />
                            </button>

                            <button 
                                onClick={onClose}
                                className="flex-1 py-3 text-[8.5px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 rounded-xl transition-all active:scale-95 text-center"
                            >
                                Batal
                            </button>
                            
                            <button 
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 py-3 bg-jade-600 text-white rounded-xl text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.2em] hover:bg-jade-700 shadow-lg shadow-jade-100 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 min-w-[90px]"
                            >
                                {saving ? (
                                    <div className="w-3 h-3 md:w-3.5 md:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                )}
                                <span>Simpan</span>
                            </button>
                        </>
                    )}
                </div>

                {/* INNER CUSTOM CONFIRM OVERLAY */}
                {deleteConfirm.show && (
                    <div className="absolute inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 lg:backdrop-blur-sm animate-in fade-in duration-200 rounded-[24px] md:rounded-[28px]">
                        <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-[280px] md:max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50 relative">
                            <button 
                                onClick={() => setDeleteConfirm({ show: false, index: null })}
                                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-slate-300" />
                            </button>

                            <div className="p-6 md:p-8 text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 rounded-[20px] md:rounded-[22px] flex items-center justify-center mx-auto mb-4 md:mb-6 text-rose-500 shadow-sm border border-rose-100/50">
                                    <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <h3 className="text-[11px] md:text-[13px] font-black text-slate-800 uppercase tracking-widest leading-normal mb-1 md:mb-2">Hapus Target?</h3>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide opacity-80">
                                    Hapus target <span className="text-slate-800">{infoList[deleteConfirm.index!]?.label || 'ini'}</span>?
                                </p>
                                <p className="text-[8px] md:text-[9px] font-black text-rose-500 mt-3 md:mt-4 uppercase tracking-0.05em">
                                    Data tidak dapat dipulihkan.
                                </p>
                            </div>
                            
                            <div className="px-5 md:px-6 pb-6 md:pb-8 flex items-center gap-2">
                                <button 
                                    onClick={() => setDeleteConfirm({ show: false, index: null })}
                                    className="flex-1 py-3 bg-white text-slate-400 border border-slate-100 rounded-xl md:rounded-2xl text-[8.5px] md:text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={executeDelete}
                                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl md:rounded-2xl text-[8.5px] md:text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95 outline-none"
                                >
                                    Ya, Hapus
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
    const [selectedGender, setSelectedGender] = useState<string>("all");
    const [showNisMobile, setShowNisMobile] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { setLoading: setGlobalLoading } = useLoading();
    const { addNotification } = useNotification();

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
    }, [searchQuery, selectedHalaqahId, selectedGender, sortBy]);

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
            const matchesGender = selectedGender === "all" || s.gender === selectedGender;
            return matchesSearch && matchesHalaqah && matchesGender;
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

    const handleExport = async () => {
        setGlobalLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Monitor Hafalan');

            // Styling
            const headerStyle: Partial<ExcelJS.Style> = {
                font: { bold: true, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
                alignment: { horizontal: 'center' },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };

            const cellStyle: Partial<ExcelJS.Style> = {
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                },
                alignment: { horizontal: 'center' }
            };

            // Define columns
            worksheet.columns = [
                { header: 'No', key: 'no', width: 8 },
                { header: 'NIS', key: 'nis', width: 15 },
                { header: 'Nama Santri', key: 'name', width: 40 },
                { header: 'Gender', key: 'gender', width: 15 },
                { header: 'Halaqah', key: 'halaqah', width: 25 },
                { header: 'Pengampu', key: 'teacher', width: 25 },
                { header: 'Sabaq (Baris)', key: 'sabaq', width: 20 },
                { header: 'Total Hafalan', key: 'total', width: 20 }
            ];

            // Apply header style
            worksheet.getRow(1).eachCell((cell) => {
                cell.style = headerStyle;
            });

            // Add rows
            filteredAndSortedStats.forEach((stat, index) => {
                const row = worksheet.addRow({
                    no: index + 1,
                    nis: stat.nis || '-',
                    name: stat.full_name,
                    gender: stat.gender === 'L' ? 'Laki-laki' : (stat.gender === 'P' ? 'Perempuan' : '-'),
                    halaqah: stat.halaqahName,
                    teacher: stat.teacherName,
                    sabaq: stat.sabaqBaris,
                    total: stat.totalJuz
                });
                row.eachCell((cell) => {
                    cell.style = cellStyle;
                });
                row.getCell('name').alignment = { horizontal: 'left' };
                row.getCell('halaqah').alignment = { horizontal: 'left' };
                row.getCell('teacher').alignment = { horizontal: 'left' };
            });

            // Summary info at top
            worksheet.insertRow(1, []);
            worksheet.insertRow(1, [`LAPORAN MONITOR HAFALAN SANTRI (${startDate} s/d ${endDate})`]);
            worksheet.mergeCells('A1:H1');
            worksheet.getCell('A1').font = { bold: true, size: 14 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Monitor_Hafalan_${startDate}_to_${endDate}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            addNotification({ type: 'success', title: 'Berhasil', message: 'Laporan Monitor Hafalan berhasil diunduh.' });
        } catch (error) {
            console.error("Export error:", error);
            addNotification({ type: 'error', title: 'Gagal', message: 'Terjadi kesalahan saat mengekspor data.' });
        } finally {
            setGlobalLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 md:gap-3 animate-fade-in pb-12">
            {/* Premium Multi-Row Filter Bar */}
            <div className="flex flex-row flex-wrap items-center gap-2.5 md:gap-3 py-3 bg-white w-full sticky top-0 z-100 border-b border-slate-100 lg:border-none lg:static lg:py-0">
                
                {/* --- BARIS 1 (Mobile) / ROW 1 (Desktop) --- */}
                
                {/* 1. Halaqah Selector */}
                <div className="order-1 lg:order-1 flex-1 lg:flex-none flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 rounded-2xl border-2 border-slate-100 shadow-sm min-w-[200px] lg:min-w-[340px] h-10 lg:h-11">
                    <div className="p-1.5 bg-primary-500 rounded-lg text-white shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div className="flex-1 relative group/sel-unified min-w-0">
                        <p className="text-[7.5px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Halaqoh / Pengampu</p>
                        <div className="relative">
                            <select 
                                value={selectedHalaqahId}
                                onChange={(e) => setSelectedHalaqahId(e.target.value)}
                                className="w-full bg-transparent text-[8.5px] md:text-[10px] font-black text-slate-800 uppercase tracking-tight focus:outline-none appearance-none cursor-pointer p-0 pr-5 relative z-10 truncate"
                            >
                                <option value="all">SEMUA HALAQAH</option>
                                {halaqahs.map(h => (
                                    <option key={h.id} value={h.id}>{h.name.toUpperCase()} / {h.teacher_name?.toUpperCase() || '-'}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/sel-unified:text-primary-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* 2. Search Input */}
                <div className="order-2 lg:order-2 relative flex-1 lg:flex-1 group h-10 lg:h-11 min-w-[140px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-jade-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="CARI SANTRI..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full pl-10 pr-4 bg-slate-50/80 border border-slate-200/60 rounded-full focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-[9.5px] font-black uppercase tracking-widest placeholder:text-slate-300 outline-none shadow-inner"
                    />
                </div>

                {/* BREAK 1 (After Row 1 on Mobile) */}
                <div className="w-full lg:hidden order-2 h-0" />

                {/* --- BARIS 2 (Mobile) / ROW 2 (Desktop Hybrid) --- */}

                {/* 6. Month Selector - Order 3 on mobile */}
                <div className="order-3 lg:order-6 relative h-10 lg:h-11 flex-none w-[110px] lg:w-auto lg:min-w-[140px] flex items-center px-3 lg:px-4 bg-slate-50/80 border border-slate-200/60 rounded-full shadow-inner group/month transition-all">
                    <Calendar className="w-3.5 h-3.5 text-jade-500 mr-1.5 lg:mr-2 shrink-0" />
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
                        className="w-full bg-transparent text-[8.5px] lg:text-[9px] font-black text-slate-700 uppercase tracking-widest focus:outline-none appearance-none cursor-pointer pr-4 truncate"
                    >
                        <option value="custom">BULAN</option>
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/month:text-jade-500 transition-colors" />
                </div>

                {/* 7. Date Range Group - Order 4 on mobile */}
                <div className="order-4 lg:order-7 flex items-center gap-1 shrink-0 h-10 lg:h-11 flex-1 lg:flex-none">
                    <div className="h-full flex-1 lg:flex-none lg:min-w-[125px] flex justify-center items-center px-2 md:px-4 bg-slate-50/80 border border-slate-200/60 rounded-full shadow-inner transition-all">
                        <CustomDatePicker 
                            value={startDate} 
                            align="right"
                            onChange={(val) => {
                                setStartDate(val);
                                setSelectedMonth("custom");
                            }} 
                        />
                    </div>
                    
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />

                    <div className="h-full flex-1 lg:flex-none lg:min-w-[125px] flex justify-center items-center px-2 md:px-4 bg-slate-50/80 border border-slate-200/60 rounded-full shadow-inner transition-all">
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

                {/* BREAK 2 (After Row 2 on Mobile) */}
                <div className="w-full lg:hidden order-4 h-0" />

                {/* --- BARIS 3 (Mobile) / ROW 1 & 2 (Desktop Hybrid) --- */}

                {/* 3. Manage Target Button - Order 5 on mobile */}
                <button 
                    onClick={() => setIsManageModalOpen(true)}
                    className="order-5 lg:order-3 h-10 lg:h-11 w-10 lg:w-11 bg-jade-600 border border-jade-600 rounded-[18px] lg:rounded-2xl text-white hover:bg-jade-700 transition-all flex items-center justify-center group shrink-0 shadow-lg shadow-primary-100/50"
                    title="Kelola Target"
                >
                    <Crosshair className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                </button>

                {/* 4. Export Button - Order 6 on mobile */}
                <button 
                    onClick={handleExport}
                    className="order-6 lg:order-4 h-10 lg:h-11 px-3 md:px-4 bg-white border-2 border-jade-500 text-jade-600 rounded-[18px] lg:rounded-2xl hover:bg-jade-50 transition-all flex items-center justify-center gap-2 group shrink-0 shadow-sm"
                    title="Ekspor Excel"
                >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">EKSPOR</span>
                </button>

                {/* BREAK for Desktop (Row 1 Ends) */}
                <div className="hidden lg:block w-full lg:order-4 h-0" />

                {/* 5. Gender Selector - Order 7 on mobile */}
                <div className="order-7 lg:order-5 flex-1 lg:flex-none flex items-center justify-end lg:justify-start">
                    <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/60 px-3 py-2 rounded-full shadow-inner h-10 lg:h-11 group/gender min-w-[100px] lg:min-w-[120px]">
                        <User className="w-3.5 h-3.5 text-blue-500 mr-0.5 shrink-0" />
                        <div className="relative flex-1">
                            <select 
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                                className="w-full bg-transparent text-[8.5px] lg:text-[9px] font-black text-slate-700 uppercase tracking-widest focus:outline-none appearance-none cursor-pointer pr-4"
                            >
                                <option value="all">GENDER</option>
                                <option value="L">PUTRA</option>
                                <option value="P">PUTRI</option>
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover/gender:text-blue-500 transition-colors" />
                        </div>
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
                                <th rowSpan={2} className="hidden md:table-cell px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 bg-white min-w-[240px]">HALAQOH ( <span className='text-jade-600'>PENGAMPU</span> )</th>
                                <th colSpan={2} className="px-4 py-3 text-[9px] font-black text-jade-600 uppercase tracking-widest text-center border-b-2 border-slate-100 bg-jade-50/50">STATISTIK SETORAN</th>
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
                                            <span className="text-jade-600 font-black">{stat.teacherName}</span>
                                            <span className="mx-1 text-slate-300 font-bold">)</span>
                                        </td>
                                        <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100 bg-jade-50/5">
                                            <span className={`text-[11px] font-black ${stat.sabaqBaris > 0 ? 'text-jade-600' : 'text-slate-300'}`}>
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
                    <div className="bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-3xl">
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
                                            className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
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
                isReadOnly={user.role === UserRole.SUPERVISOR}
            />
        </div>
    );
};
