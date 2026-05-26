
import React, { useEffect, useState, useMemo } from 'react';
import { getHalaqahs, getStudentsByHalaqah, createHalaqah, updateHalaqah, getUsers, getStudents } from '../../services/dataService';
import { Halaqah, Student, UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Users, User, X, ChevronRight, Save, Edit, Trash2, BookOpen, Search, RefreshCw, Download, Upload, Database } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

// --- Components ---

interface HalaqahFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string, teacher_id: string }) => Promise<void>;
  teachers: UserProfile[];
  initialData?: Halaqah | null;
}

export const HalaqahFormModal: React.FC<HalaqahFormModalProps> = ({ isOpen, onClose, onSubmit, teachers, initialData }) => {
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setName(initialData.name);
            setTeacherId(initialData.teacher_id || '');
        } else {
            setName('');
            setTeacherId('');
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return; 

    await onSubmit({ name, teacher_id: teacherId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-800 lg:pl-64 pt-16">
      <div className="bg-white rounded-xl shadow-none w-full max-w-sm overflow-hidden border-2 border-slate-300 flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="px-5 py-2.5 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 uppercase">
              {initialData ? 'Edit Halaqah' : 'Halaqah Baru'}
            </h3>
            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Manajemen Kelompok</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Halaqah</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl bg-white text-[13px] font-bold text-slate-800 outline-none focus:border-jade-400 transition-all placeholder:text-slate-300"
              placeholder="CONTOH: ABU BAKAR"
            />
          </div>

          <div className="space-y-1">
             <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Ustadz Pengampu</label>
             <div className="relative">
               <select
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl bg-white text-[13px] font-bold text-slate-800 outline-none appearance-none cursor-pointer focus:border-jade-400 transition-all capitalize"
               >
                  <option value="">Pilih Ustadz</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} className="capitalize">{t.full_name}</option>
                  ))}
               </select>
               <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                 <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
               </div>
             </div>
          </div>

          <div className="pt-2 flex gap-3 shrink-0">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-300 text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
            >
              BATAL
            </button>
            <button 
                type="submit"
                className="flex-2 flex items-center justify-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 mr-2" />
              {initialData ? 'SIMPAN' : 'BUAT HALAQAH'}
            </button>
          </div>
        </form>
      </div>
    </div>

  );
};

interface HalaqahDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  halaqah: Halaqah | null;
  onEdit: () => void;
  isReadOnly?: boolean;
}

export const HalaqahDetailModal: React.FC<HalaqahDetailModalProps> = ({ isOpen, onClose, halaqah, onEdit, isReadOnly }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && halaqah) {
      setIsLoading(true);
      getStudentsByHalaqah(halaqah.id).then((data) => {
        setStudents(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, halaqah]);

  if (!isOpen || !halaqah) return null;

  return (
    <div 
        className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800 lg:pl-64 pt-16"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-none w-full max-w-md overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-200 border-2 border-slate-300 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-2.5 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 flex items-center gap-2 uppercase">
              <span className="p-1.5 bg-jade-50 rounded-lg border border-jade-100"><BookOpen className="w-4 h-4 text-jade-600" /></span>
              Daftar Santri {halaqah.name}
            </h3>
            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none ml-10">
                Ustadz: <span className="text-jade-600 font-black">{halaqah.teacher_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-5 overflow-y-auto shrink-0 scrollbar-hide flex-1 flex flex-col ${(!isLoading && students.length === 0) ? 'justify-center' : ''}`} style={{ maxHeight: '235px', minHeight: '235px' }}>
          <div className="space-y-2.5 w-full">
            {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-jade-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest animate-pulse">Sinkronisasi Data...</p>
                </div>
            ) : students.length > 0 ? (
                students.map((student, idx) => (
                    <div key={student.id} className="flex items-center justify-between p-3.5 rounded-[20px] border border-slate-100 bg-[#FBFDFE] hover:bg-white hover:border-jade-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 text-[11px] font-black shadow-sm group-hover:border-jade-200 group-hover:bg-jade-50/30 transition-all">
                                {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 capitalize group-hover:text-jade-600 transition-all">{student.full_name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">NIS: {student.nis || '-'}</p>
                            </div>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-jade-50 group-hover:border-jade-100 group-hover:text-jade-600 transition-all shadow-sm">
                            SANTRI
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                        <Users className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Halaqah Masih Kosong</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Belum ada santri yang terdaftar di kelompok ini.</p>
                    </div>
                </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

// --- Main Page ---

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: { current: number; total: number; errors: string[] };
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, progress }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-500 lg:pl-64 pt-16">
            <div className="flex flex-col items-center justify-center max-w-md w-full px-6">
                {/* Branding Icon Container (Plek Ketiplek from GlobalLoader) */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-jade-600/80 animate-spin" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-1 rounded-full border border-slate-100/50"></div>
                    
                    <div className="relative w-14 h-14 bg-white border border-slate-100 rounded-[20px] flex items-center justify-center shadow-xl shadow-jade-900/5 ring-4 ring-jade-50/30">
                        <div className="w-9 h-9 bg-jade-600/10 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-jade-600" />
                        </div>
                    </div>
                </div>

                {/* Header Branding */}
                <div className="text-center mb-10 w-full">
                    <h1 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.5em] leading-none mb-3">
                        QURMA PLATFORM
                    </h1>
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-px bg-linear-to-r from-transparent to-slate-200 flex-1"></div>
                        <span className="text-[9px] font-black text-jade-500 uppercase tracking-[0.3em] whitespace-nowrap">
                            SINKRONISASI DATA
                        </span>
                        <div className="h-px bg-linear-to-l from-transparent to-slate-200 flex-1"></div>
                    </div>
                </div>

                {/* Progress Details Card */}
                <div className="w-full bg-white rounded-xl border-2 border-slate-300 p-8 shadow-none space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Progress</p>
                                <p className="text-[10px] font-black text-jade-600 uppercase">
                                    {progress.current === progress.total ? 'Sinkronisasi Selesai' : 'Memproses Data...'}
                                </p>
                            </div>
                            <span className="text-[11px] font-black text-slate-600 tabular-nums bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                {progress.current} / {progress.total}
                            </span>
                        </div>
                        <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100/50 p-0.5">
                            <div 
                                className="bg-linear-to-r from-jade-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    {progress.errors.length > 0 && (
                        <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-4 max-40 overflow-y-auto custom-scrollbar">
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <X className="w-3 h-3" /> {progress.errors.length} Kendala Ditemukan
                            </p>
                            <div className="space-y-2">
                                {progress.errors.map((err, i) => (
                                    <div key={i} className="text-[9.5px] font-bold text-rose-500 leading-relaxed flex gap-2">
                                        <span className="opacity-40 shrink-0">•</span> 
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {progress.current === progress.total && (
                        <button 
                            onClick={onClose}
                            className="w-full py-3.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                        >
                            SELESAI
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const HalaqahManagement: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [classes, setClasses] = useState<Halaqah[]>([]);
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();
  
  // Modals State
  const [selectedHalaqah, setSelectedHalaqah] = useState<Halaqah | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [halaqahToDelete, setHalaqahToDelete] = useState<Halaqah | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[] });

  const fetchData = async () => {
    setLoading(true);
    try {
        const [halaqahsData, usersData, studentsData] = await Promise.all([
            getHalaqahs(tenantId),
            getUsers(tenantId),
            getStudents(tenantId)
        ]);
        
        const enrichedHalaqahs = halaqahsData.map(h => {
            const teacher = usersData.find(u => u.id === h.teacher_id);
            return {
                ...h,
                teacher_name: teacher ? teacher.full_name : 'Belum ditentukan',
                student_count: studentsData.filter(s => s.halaqah_id === h.id).length
            };
        });
    
        setClasses(enrichedHalaqahs);
        setTeachers(usersData.filter(u => u.role === UserRole.TEACHER));
    } catch (error) {
        console.error("Failed to fetch halaqah data:", error);
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memuat data halaqah.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleExport = async () => {
    setGlobalLoading(true);
    try {
        const students = await getStudents(tenantId);
        const workbook = new ExcelJS.Workbook();
        
        // Define common styles
        const borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        const yellowFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE1' } };
        const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

        // --- SHEET 1: Data Santri ---
        const ws0 = workbook.addWorksheet("Data Santri");
        ws0.columns = [
            { header: "No.", key: "no", width: 8 },
            { header: "NIS", key: "nis", width: 15 },
            { header: "Nama Santri", key: "name", width: 40 },
            { header: "Jenis Kelamin", key: "gender", width: 15 },
            { header: "Pengampu", key: "teacher", width: 25 },
            { header: "Halaqah", key: "halaqah", width: 25 },
            { header: "Email Akses", key: "email", width: 25 },
            { header: "Nama Ayah", key: "father", width: 25 },
            { header: "Nama Ibu", key: "mother", width: 25 },
            { header: "HP Ayah", key: "hp_father", width: 20 },
            { header: "HP Ibu", key: "hp_mother", width: 20 },
            { header: "Alamat", key: "address", width: 40 },
            { header: "RT/RW", key: "rt_rw", width: 10 },
            { header: "Kel/Desa", key: "village", width: 20 },
            { header: "Kecamatan", key: "district", width: 20 },
            { header: "Kab/Kota", key: "city", width: 20 }
        ];

        ws0.getRow(1).eachCell(cell => {
            cell.fill = headerFill; cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = borderStyle;
        });

        // Sorted Students
        const sortedStudents = [...students].sort((a, b) => {
            const hA = classes.find(h => h.id === a.halaqah_id)?.name || '';
            const hB = classes.find(h => h.id === b.halaqah_id)?.name || '';
            const hComp = hA.localeCompare(hB);
            if (hComp !== 0) return hComp;
            return a.full_name.localeCompare(b.full_name);
        });

        sortedStudents.forEach((s, idx) => {
            const halaqahObj = classes.find(h => h.id === s.halaqah_id);
            const rowIdx = idx + 2;
            const r = ws0.addRow({
                no: idx + 1, nis: s.nis || '-', name: s.full_name,
                gender: s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
                teacher: { formula: `'Data Halaqah'!E${rowIdx}`, result: halaqahObj?.teacher_name || '-' },
                halaqah: { formula: `'Data Halaqah'!F${rowIdx}`, result: halaqahObj?.name || '-' },
                email: (s as any).parent_email || '-', father: (s as any).father_name || '-', mother: (s as any).mother_name || '-',
                hp_father: (s as any).father_phone || '-', hp_mother: (s as any).mother_phone || '-',
                address: (s as any).address || '-', rt_rw: (s as any).rt_rw || '-', village: (s as any).village || '-',
                district: (s as any).district || '-', city: ((s as any).city || '-').replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, '').trim()
            });
            r.eachCell((cell, colNumber) => {
                cell.border = borderStyle;
                if (colNumber <= 3) cell.fill = yellowFill;
                else if (colNumber === 6) cell.fill = greenFill;
            });
        });

        // --- SHEET 2: Data Halaqah ---
        const ws1 = workbook.addWorksheet("Data Halaqah");
        ws1.columns = [
            { header: "No.", key: "no", width: 8 },
            { header: "NIS", key: "nis", width: 15 },
            { header: "Nama Santri", key: "name", width: 40 },
            { header: "Jumlah Hafalan", key: "hafalan", width: 20 },
            { header: "Pengampu", key: "teacher", width: 25 },
            { header: "Halaqah", key: "halaqah", width: 25 },
            { header: "SyncKey", key: "sync", width: 5 }
        ];

        ws1.getRow(1).eachCell(cell => {
            cell.fill = headerFill;
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = borderStyle;
        });

        const halaqahNames = classes.map(h => h.name);
        const halaqahDropdown = `"${halaqahNames.join(',')}"`;

        // --- Referensi Data (Hidden) ---
        const wsRef = workbook.addWorksheet("Referensi_Data");
        wsRef.columns = [
            { header: "Halaqah", key: "halaqah", width: 25 },
            { header: "Pengampu", key: "teacher", width: 25 }
        ];
        classes.forEach(h => {
            wsRef.addRow({ halaqah: h.name, teacher: h.teacher_name || '-' });
        });
        wsRef.state = 'hidden';

        sortedStudents.forEach((s, idx) => {
            const halaqahObj = classes.find(h => h.id === s.halaqah_id);
            const hName = halaqahObj?.name || '-';
            const rowIdx = idx + 2;
            const r = ws1.addRow({
                no: idx + 1,
                nis: s.nis || '-',
                name: s.full_name,
                hafalan: `${s.current_juz || 0} Juz`,
                halaqah: hName,
                sync: { formula: `F${rowIdx}&"_"&COUNTIF($F$2:F${rowIdx}, F${rowIdx})` }
            });

            r.getCell(5).value = { formula: `IFERROR(VLOOKUP(F${rowIdx}, Referensi_Data!$A:$B, 2, FALSE), "-")` };

            r.getCell(1).fill = yellowFill; r.getCell(1).border = borderStyle;
            r.getCell(2).fill = yellowFill; r.getCell(2).border = borderStyle;
            r.getCell(3).fill = yellowFill; r.getCell(3).border = borderStyle;
            r.getCell(4).fill = yellowFill; r.getCell(4).border = borderStyle; 
            r.getCell(5).border = borderStyle; 
            r.getCell(6).fill = greenFill;  r.getCell(6).border = borderStyle; 
            r.getCell(6).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [halaqahDropdown]
            };
            r.getCell(7).border = borderStyle; 
        });
        ws1.getColumn(7).hidden = true;

        // --- SHEET 3: Rangkuman Halaqah ---
        const ws2 = workbook.addWorksheet("Rangkuman Halaqah");
        const BLOCKS_PER_ROW = 3;
        const COLUMNS_PER_BLOCK = 4;
        const FIXED_SLOTS = 15;

        const sortedHalaqahs = [...classes].sort((a, b) => a.name.localeCompare(b.name));

        const getExcelCol = (idx: number) => {
            let letter = '';
            while (idx >= 0) { letter = String.fromCharCode((idx % 26) + 65) + letter; idx = Math.floor(idx / 26) - 1; }
            return letter;
        };

        let currentBaseRow = 1;
        for (let i = 0; i < sortedHalaqahs.length; i += BLOCKS_PER_ROW) {
            const rowHalaqahs = sortedHalaqahs.slice(i, i + BLOCKS_PER_ROW);

            // Row 0: Labels (Halaqah)
            rowHalaqahs.forEach((h, idx) => {
                const colStart = idx * COLUMNS_PER_BLOCK;
                const c1 = ws2.getCell(currentBaseRow, colStart + 1);
                c1.value = ""; c1.font = { bold: true }; c1.border = borderStyle;
                const c2 = ws2.getCell(currentBaseRow, colStart + 2);
                c2.value = "Halaqah :"; c2.font = { bold: true }; c2.border = borderStyle;
                const c3 = ws2.getCell(currentBaseRow, colStart + 3);
                c3.value = h.name; c3.fill = greenFill; c3.border = borderStyle; c3.font = { bold: true };
            });

            // Row 1: Labels (Pengampu)
            rowHalaqahs.forEach((h, idx) => {
                const colStart = idx * COLUMNS_PER_BLOCK;
                const c1 = ws2.getCell(currentBaseRow + 1, colStart + 1);
                c1.value = ""; c1.border = borderStyle;
                const c2 = ws2.getCell(currentBaseRow + 1, colStart + 2);
                c2.value = "Pengampu :"; c2.font = { bold: true }; c2.border = borderStyle;
                const c3 = ws2.getCell(currentBaseRow + 1, colStart + 3);
                const hNameEscaped = h.name.replace(/"/g, '""');
                c3.value = { 
                    formula: `IFERROR(VLOOKUP("${hNameEscaped}", Referensi_Data!$A:$B, 2, FALSE), "-")`, 
                    result: h.teacher_name || '-' 
                };
                c3.fill = greenFill; c3.font = { bold: true }; c3.border = borderStyle;
            });

            // Row 2: Headers
            rowHalaqahs.forEach((h, idx) => {
                const colStart = idx * COLUMNS_PER_BLOCK;
                ["No.", "NIS", "Nama Santri"].forEach((text, tIdx) => {
                    const c = ws2.getCell(currentBaseRow + 2, colStart + 1 + tIdx);
                    c.value = text;
                    c.fill = headerFill; c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    c.border = borderStyle; c.alignment = { horizontal: 'center' };
                });
            });

            // Student Rows (15 Slots)
            for (let r = 0; r < FIXED_SLOTS; r++) {
                const excelRowIdx = currentBaseRow + 3 + r;
                rowHalaqahs.forEach((h, idx) => {
                    const colStart = idx * COLUMNS_PER_BLOCK;
                    const hNameEscaped = h.name.replace(/"/g, '""');
                    const targetKey = `"${hNameEscaped}_${r + 1}"`;

                    const hStudents = sortedStudents.filter(s => s.halaqah_id === h.id);
                    const s = hStudents[r];

                    const nisColLetter = getExcelCol(colStart + 1);
                    const cellNo = ws2.getCell(excelRowIdx, colStart + 1);
                    cellNo.value = { formula: `IF(${getExcelCol(colStart + 1)}${excelRowIdx}="", "", ${r + 1})`, result: s ? (r + 1) : undefined };
                    cellNo.border = borderStyle;

                    const cellNis = ws2.getCell(excelRowIdx, colStart + 2);
                    cellNis.value = { 
                        formula: `IFERROR(INDEX('Data Halaqah'!$B:$B, MATCH(${targetKey}, 'Data Halaqah'!$G:$G, 0)), "")`,
                        result: s ? (s.nis || "-") : undefined
                    };
                    cellNis.border = borderStyle;

                    const cellName = ws2.getCell(excelRowIdx, colStart + 3);
                    cellName.value = { 
                        formula: `IFERROR(INDEX('Data Halaqah'!$C:$C, MATCH(${targetKey}, 'Data Halaqah'!$G:$G, 0)), "")`,
                        result: s ? s.full_name : undefined
                    };
                    cellName.border = borderStyle;
                });
            }
            currentBaseRow += (FIXED_SLOTS + 5);
        }

        // Set column widths for WS2
        for (let j = 1; j <= BLOCKS_PER_ROW * COLUMNS_PER_BLOCK; j++) {
            const mod = (j - 1) % COLUMNS_PER_BLOCK;
            if (mod === 0) ws2.getColumn(j).width = 6;
            else if (mod === 1) ws2.getColumn(j).width = 15;
            else if (mod === 2) ws2.getColumn(j).width = 40;
            else ws2.getColumn(j).width = 4;
        }

        // Generate and Save File
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `Laporan_Halaqah_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);

        addNotification({ type: 'success', title: 'Ekspor Berhasil', message: 'Laporan halaqah dengan dropdown dan sinkronisasi otomatis telah siap.' });
    } catch (error) {
        console.error(error);
        addNotification({ type: 'error', title: 'Gagal', message: 'Terjadi kesalahan saat memproses ekspor.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportModalOpen(true);
    setImportProgress({ current: 0, total: 0, errors: [] });

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]]; // Process the first/active sheet
            const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

            if (!aoa || aoa.length === 0) {
                setImportProgress(prev => ({ ...prev, errors: ['File kosong.'] }));
                return;
            }

            const students = await getStudents(tenantId);
            // Normalize NIS: ensure it is a trimmed string for reliable matching
            const studentMap = new Map(students.filter(s => s.nis).map(s => [String(s.nis).trim(), s]));
            const halaqahMap = new Map(classes.map(h => [h.name.toLowerCase().trim(), h.id]));

            const nisAssignments = new Map<string, string>(); 
            const updateLogs: { student: Student, newHalaqahId: string | null }[] = [];
            const errors: string[] = [];
            const seenNisInExcel = new Set<string>();

            // Detect Format: 
            // Flat Format (Image 1): Header has "Halaqah" at Column index 3 (D), 4 (E) or 5 (F) after "Hafalan" & "Pengampu" added
            const isFlatFormat = String(aoa[0]?.[3] || '').toLowerCase().includes('halaqah') || 
                                 String(aoa[0]?.[4] || '').toLowerCase().includes('halaqah') ||
                                 String(aoa[0]?.[5] || '').toLowerCase().includes('halaqah');

            if (isFlatFormat) {
                // Determine column index for Halaqah
                let hColIdx = 3;
                if (String(aoa[0]?.[5] || '').toLowerCase().includes('halaqah')) hColIdx = 5;
                else if (String(aoa[0]?.[4] || '').toLowerCase().includes('halaqah')) hColIdx = 4;

                // --- STRATEGY A: Flat List (Sheet 1 style) ---
                for (let r = 1; r < aoa.length; r++) {
                    const row = aoa[r];
                    if (!row || row.length < 4) continue;

                    const nisInput = String(row[1] || '').trim();
                    const sNameInput = String(row[2] || '').trim();
                    const hNameInput = String(row[hColIdx] || '').trim();

                    if (!nisInput || nisInput === '-' || nisInput.toLowerCase() === 'nis') continue;

                    // Check for duplicate NIS in Excel
                    if (seenNisInExcel.has(nisInput)) {
                        errors.push(`Baris ${r+1}: NIS "${nisInput}" muncul lebih dari satu kali di file Excel. Setiap santri harus memiliki NIS unik.`);
                        continue;
                    }
                    seenNisInExcel.add(nisInput);

                    const halaqahId = halaqahMap.get(hNameInput.toLowerCase());
                    if (!halaqahId && hNameInput !== '-') {
                        errors.push(`Halaqah "${hNameInput}" di baris ${r+1} tidak ditemukan.`);
                        continue;
                    }

                    const student = studentMap.get(nisInput);
                    if (student) {
                        // Optional: Name mismatch check to help user debug
                        const dbName = student.full_name.toLowerCase().trim();
                        const excelName = sNameInput.toLowerCase().trim();
                        if (dbName !== excelName && excelName !== "" && excelName !== "-") {
                            errors.push(`Baris ${r+1}: NIS "${nisInput}" di sistem adalah "${student.full_name}", tapi di Excel adalah "${sNameInput}".`);
                        }

                        if (student.halaqah_id !== halaqahId) {
                            updateLogs.push({ student, newHalaqahId: halaqahId || null });
                        }
                    } else {
                        errors.push(`Santri "${sNameInput}" (NIS: ${nisInput}) tidak ditemukan di sistem.`);
                    }
                }
            } else {
                // --- STRATEGY B: Block/Grid Layout (Sheet 2 style) ---
                for (let r = 0; r < aoa.length; r++) {
                    const row = aoa[r];
                    if (!row) continue;

                    for (let c = 0; c < row.length; c++) {
                        const cellValue = String(row[c] || '').trim();
                        
                        if (cellValue === "Halaqah :") {
                            const hName = String(row[c + 1] || '').trim();
                            const halaqahId = halaqahMap.get(hName.toLowerCase());

                            if (!halaqahId) {
                                errors.push(`Halaqah "${hName}" di baris ${r+1} tidak ditemukan.`);
                                continue;
                            }

                            // Process students under this header
                            let studentRowIdx = r + 2;
                            while (aoa[studentRowIdx] && String(aoa[studentRowIdx][c] || '').trim() !== "" && String(aoa[studentRowIdx][c] || '').trim() !== "Halaqah :") {
                                const nisInput = String(aoa[studentRowIdx][c + 1] || '').trim();
                                const sNameInput = String(aoa[studentRowIdx][c + 2] || '').trim();

                                if (nisInput && nisInput !== '-' && nisInput !== 'NIS') {
                                    // Check for duplicate NIS in Excel
                                    if (seenNisInExcel.has(nisInput)) {
                                        errors.push(`Baris ${studentRowIdx+1}: NIS "${nisInput}" muncul ganda di file Excel.`);
                                        studentRowIdx++;
                                        continue;
                                    }
                                    seenNisInExcel.add(nisInput);

                                    if (nisAssignments.has(nisInput) && nisAssignments.get(nisInput) !== hName) {
                                        errors.push(`Santri "${sNameInput}" (NIS: ${nisInput}) terdaftar ganda: ${nisAssignments.get(nisInput)} dan ${hName}.`);
                                    } else {
                                        nisAssignments.set(nisInput, hName);
                                        const student = studentMap.get(nisInput);
                                        if (student) {
                                            // Name mismatch check
                                            const dbName = student.full_name.toLowerCase().trim();
                                            const excelName = sNameInput.toLowerCase().trim();
                                            if (dbName !== excelName && excelName !== "" && excelName !== "-") {
                                                errors.push(`Baris ${studentRowIdx+1}: NIS "${nisInput}" di sistem adalah "${student.full_name}", tapi di Excel "${sNameInput}".`);
                                            }

                                            if (student.halaqah_id !== halaqahId) {
                                                updateLogs.push({ student, newHalaqahId: halaqahId });
                                            }
                                        } else {
                                            errors.push(`Santri "${sNameInput}" (NIS: ${nisInput}) tidak ditemukan di sistem.`);
                                        }
                                    }
                                }
                                studentRowIdx++;
                            }
                        }
                    }
                }
            }

            if (errors.length > 0) {
                setImportProgress(prev => ({ ...prev, current: 100, total: 100, errors: [...prev.errors, ...errors] }));
                if (e.target) e.target.value = '';
                return;
            }

            setImportProgress({ current: 0, total: updateLogs.length, errors: [] });

            let successCount = 0;
            const { updateStudent } = await import('../../services/dataService');
            
            for (let i = 0; i < updateLogs.length; i++) {
                const { student, newHalaqahId } = updateLogs[i];
                try {
                    await updateStudent({ id: student.id, halaqah_id: newHalaqahId ?? undefined }, user);
                    successCount++;
                } catch (err) {
                    errors.push(`Gagal memindahkan ${student.full_name}.`);
                }
                setImportProgress(prev => ({ ...prev, current: i + 1, total: updateLogs.length }));
            }

            setImportProgress(prev => ({ ...prev, current: updateLogs.length, total: updateLogs.length, errors }));
            if (successCount > 0) {
                addNotification({ type: 'success', title: 'Berhasil', message: `${successCount} santri berhasil diperbarui.` });
                fetchData();
            } else if (updateLogs.length === 0 && errors.length === 0) {
                addNotification({ type: 'info', title: 'Informasi', message: 'Tidak ada perubahan data.' });
                setIsImportModalOpen(false);
            }
        } catch (error) {
            console.error("Import Error:", error);
            setImportProgress(prev => ({ ...prev, errors: ['Gagal memproses file Excel. Pastikan format sesuai.'] }));
        }
        if (e.target) e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleCreateOrUpdate = async (data: { name: string, teacher_id: string }) => {
    setGlobalLoading(true);
    try {
        // Prepare payload, ensuring teacher_id is null if empty string
        const payload = {
            ...data,
            teacher_id: data.teacher_id || null
        } as any;

        if (isEditMode && selectedHalaqah) {
            await updateHalaqah(selectedHalaqah.id, payload, user);
            addNotification({ type: 'success', title: 'Berhasil', message: `Halaqah ${data.name} telah diperbarui.` });
            setSelectedHalaqah(null);
        } else {
            await createHalaqah({ ...payload, tenant_id: tenantId }, user);
            addNotification({ type: 'success', title: 'Berhasil', message: `Halaqah baru "${data.name}" telah dibuat.` });
        }
        await fetchData();
    } catch (error) {
        console.error(error);
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan data halaqah.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!halaqahToDelete) return;
    
    setGlobalLoading(true);
    try {
        const { deleteHalaqah } = await import('../../services/dataService');
        await deleteHalaqah(halaqahToDelete.id, halaqahToDelete.name, user);
        
        addNotification({ 
            type: 'success', 
            title: 'Halaqah Dihapus', 
            message: `Halaqah ${halaqahToDelete.name} telah berhasil dihapus dari sistem.` 
        });
        
        await fetchData();
        setHalaqahToDelete(null);
    } catch (error: any) {
        console.error("Delete halaqah error:", error);
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('foreign key') || msg.includes('referenced')) {
            addNotification({ type: 'error', title: 'Tidak Dapat Dihapus', message: 'Halaqah ini masih memiliki santri. Pindahkan santri terlebih dahulu sebelum menghapus.' });
        } else {
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menghapus halaqah.' });
        }
    } finally {
        setGlobalLoading(false);
    }
  };

  const openCreateModal = () => {
      setSelectedHalaqah(null);
      setIsEditMode(false);
      setIsFormModalOpen(true);
      setIsDetailModalOpen(false);
  };

  const handleEditFromDetail = () => {
      setIsEditMode(true);
      setIsFormModalOpen(true);
      setIsDetailModalOpen(false);
  };
  
  const handleCardClick = (halaqah: Halaqah) => {
    setSelectedHalaqah(halaqah);
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  };

  const availableTeachersForModal = useMemo(() => {
    const assignedTeacherIds = new Set(classes.map(h => h.teacher_id).filter(Boolean));
    
    // When editing, the list should include all unassigned teachers PLUS the current teacher of the halaqah being edited.
    if (isEditMode && selectedHalaqah) {
      const unassignedTeachers = teachers.filter(t => !assignedTeacherIds.has(t.id));
      const currentTeacher = teachers.find(t => t.id === selectedHalaqah.teacher_id);
      
      if (currentTeacher && !unassignedTeachers.some(t => t.id === currentTeacher.id)) {
        return [...unassignedTeachers, currentTeacher];
      }
      return unassignedTeachers;
    }
    
    // When creating, just show unassigned teachers.
    return teachers.filter(t => !assignedTeacherIds.has(t.id));
  }, [classes, teachers, isEditMode, selectedHalaqah]);

  const filteredClasses = useMemo(() => {
    if (!search) return classes;
    const term = search.toLowerCase();
    return classes.filter(c => 
        c.name.toLowerCase().includes(term) || 
        (c.teacher_name && c.teacher_name.toLowerCase().includes(term))
    );
  }, [classes, search]);

  return (
    <div className="space-y-4">
      {/* Unified Control Bar */}
      <div className="flex flex-row flex-wrap items-center w-full gap-3 lg:gap-4 py-3 bg-white shrink-0 z-40 sticky top-0 border-b border-slate-100 lg:static lg:border-none lg:py-0">
        
        {/* 1. STATS (Desktop: 1, Mobile: 2) */}
        <div className="bg-white h-10 px-3 lg:px-4 border-2 border-slate-300 flex items-center justify-center lg:justify-start gap-3 lg:gap-4 rounded-xl shadow-none flex-1 lg:flex-none order-4 lg:order-1">
            <div className="flex items-center gap-1.5">
                <p className="text-[7.5px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">HALAQAH</p>
                <p className="text-[10.5px] lg:text-[11px] font-black text-slate-800 leading-none">{classes.length}</p>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div className="flex items-center gap-1.5">
                <p className="text-[7.5px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">SANTRI</p>
                <p className="text-[10.5px] lg:text-[11px] font-black text-slate-800 leading-none">{classes.reduce((acc, curr) => acc + (curr.student_count || 0), 0)}</p>
            </div>
        </div>

        {/* 2. SEARCH BAR (Desktop: 2, Mobile: 1) */}
        <div className="relative flex-1 group h-10 min-w-0 order-1 lg:order-2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-jade-500 transition-colors" />
            <input 
                type="text" 
                placeholder="CARI HALAQAH..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-500 transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
            />
        </div>

        {/* MOBILE BREAK (Forces row 2 on mobile) */}
        <div className="w-full lg:hidden order-2 h-0" />

        {/* 3. REFRESH BUTTON (Desktop: 3, Mobile: 2) */}
        <button 
            onClick={fetchData}
            disabled={loading}
            className="h-10 w-10 shrink-0 flex items-center justify-center border-2 border-slate-300 bg-white text-slate-400 hover:text-jade-600 hover:bg-slate-50 transition-all active:scale-95 rounded-xl shadow-none disabled:opacity-50 order-3 lg:order-3"
        >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* 4. IMPORT & EXPORT BUTTONS (Desktop: 4, Mobile: 2) */}
        {!isReadOnly && (
            <div className="h-10 flex items-center bg-white border-2 border-slate-300 rounded-xl p-1 gap-1 shadow-none px-2 order-3 lg:order-4">
                {classes.length === 0 && (
                    <>
                        <button 
                            onClick={handleExport}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Download Template"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 self-center" />
                    </>
                )}
                <label className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Impor Data Halaqah">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                </label>
            </div>
        )}

        {/* 5. TAMBAH HALAQAH (Desktop: 5, Mobile: 1) */}
        {!isReadOnly ? (
            <button 
                onClick={openCreateModal}
                className="h-10 flex-none flex items-center justify-center px-4 lg:px-6 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 gap-2 whitespace-nowrap order-1 lg:order-5"
            >
                <Plus className="w-4 h-4" /> <span>TAMBAH <span className="hidden sm:inline">HALAQAH</span></span>
            </button>
        ) : (
            <div className="h-10 flex-none flex items-center justify-center px-6 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 gap-2 whitespace-nowrap order-1 lg:order-5">
                <Users className="w-4 h-4" /> <span className="hidden sm:inline">VIEW ONLY</span><span className="sm:hidden">VIEW</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <div 
            key={cls.id} 
            onClick={() => handleCardClick(cls)}
            className="group relative bg-white border-2 border-slate-300 rounded-xl p-5 hover:border-jade-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full shadow-none"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              {/* Kiri: Nama Halaqah + Pengampu */}
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-1.5 text-base font-black text-slate-800 truncate tracking-tight uppercase leading-none">
                  <Users className="w-4 h-4 text-jade-600" />
                  {cls.name}
                </h3>
                <p className="flex items-center gap-1 text-[10px] font-black text-jade-600 tracking-tight capitalize truncate mt-1.5">
                  <User className="w-3 h-3" /> {cls.teacher_name}
                </p>
              </div>

              {/* Kanan: Jumlah Santri */}
              <div className="flex flex-col items-end shrink-0">
                <p className="text-2xl font-black text-jade-600 leading-none">{cls.student_count || 0}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Santri</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 mt-auto">
                <div className="flex items-center gap-2">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Peserta</p>
                        <p className="text-xs font-black text-slate-800 mt-1">{cls.student_count || 0} Santri</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isReadOnly && (
                    <>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          setIsEditMode(true); 
                          setSelectedHalaqah(cls); 
                          setIsFormModalOpen(true); 
                          setIsDetailModalOpen(false);
                        }}
                        className="p-2 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl transition-all border border-transparent hover:border-jade-100"
                        title="Edit Halaqah"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          setHalaqahToDelete(cls); 
                          setIsDetailModalOpen(false);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                        title="Hapus Halaqah"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div className="p-2 text-slate-300">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
            </div>

            {/* Accent Decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-jade-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 z-0" />
          </div>
        ))}
        
        {classes.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-32px flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <BookOpen className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Belum ada data halaqah</p>
                <button onClick={openCreateModal} className="mt-4 text-xs font-black text-jade-600 hover:text-jade-700">Tambah Sekarang</button>
            </div>
        )}
      </div>

      <HalaqahDetailModal 
        isOpen={isDetailModalOpen} 
        halaqah={selectedHalaqah} 
        onClose={() => {
          setIsDetailModalOpen(false);
          if (!isFormModalOpen) setSelectedHalaqah(null);
        }} 
        onEdit={handleEditFromDetail}
        isReadOnly={isReadOnly}
      />

      <HalaqahFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedHalaqah(null);
        }}
        onSubmit={handleCreateOrUpdate}
        teachers={availableTeachersForModal}
        initialData={isEditMode ? selectedHalaqah : null}
      />

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        progress={importProgress} 
      />

      <ConfirmModal
        isOpen={!!halaqahToDelete}
        onClose={() => setHalaqahToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Halaqah?"
        variant="danger"
        confirmLabel="YA, HAPUS HALAQAH"
        message={
            <span>
                Hapus halaqah <strong>{halaqahToDelete?.name}</strong>? 
                {halaqahToDelete && (halaqahToDelete.student_count ?? 0) > 0 && (
                    <span className="text-red-600 font-bold block mt-2 text-[10px]">
                        Peringatan: Ada {halaqahToDelete.student_count ?? 0} santri di kelompok ini!
                    </span>
                )}
            </span>
        }
      />
    </div>
  );
};
