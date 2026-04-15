
import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getUsers, getStudents, getHalaqahs, getClasses, createUser, createStudent, updateStudent, deleteStudent, updateUser } from '../../services/dataService';
import { UserProfile, UserRole, Student, Halaqah, Class } from '../../types';
import { 
  Mail, 
  Phone, 
  Search, 
  GraduationCap, 
  MessageCircle, 
  ArrowUpRight, 
  UserPlus, 
  Filter,
  Download,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  School,
  Edit,
  Trash2,
  X,
  Upload,
  FileDown,
  Info,
  ChevronRight,
  Database,
  RefreshCw,
  Users,
  Check,
  Lock
} from 'lucide-react';
import { useNotification } from '../../lib/NotificationContext';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

// --- Types for Joined Data ---
interface StudentRekap extends Student {
    parent_name?: string;
    parent_email?: string;
    parent_whatsapp?: string;
    halaqah_name?: string;
    halaqah_teacher_name?: string;
    class_name?: string;
}

// --- PERSISTENT CACHE ---
// Stores data in memory outside the component lifecycle to eliminate flicker during navigation
let studentCache: StudentRekap[] | null = null;
let halaqahCache: Halaqah[] | null = null;
let classCache: Class[] | null = null;

export const StudentManagement: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user: currentUser }) => {
  const isReadOnly = currentUser.role === UserRole.SUPERVISOR;
  const [rekapData, setRekapData] = useState<StudentRekap[]>(studentCache || []);
  const [halaqahs, setHalaqahs] = useState<Halaqah[]>(halaqahCache || []);
  const [classes, setClasses] = useState<Class[]>(classCache || []);
  const [loading, setLoading] = useState(!studentCache);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRekap | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRekap | null>(null);
  const [editingHalaqahId, setEditingHalaqahId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[] });
  
  // Filter states
  const [filterGender, setFilterGender] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterHalaqah, setFilterHalaqah] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    nis: '',
    gender: 'L' as 'L' | 'P',
    classId: '',
    halaqahId: '',
    parentName: '',
    parentEmail: '',
    parentWhatsapp: ''
  });

  const resetForm = () => {
    setFormData({
        studentName: '', nis: '', gender: 'L', classId: '', halaqahId: '',
        parentName: '', parentEmail: '', parentWhatsapp: ''
    });
    setFormErrors({});
    setIsEditMode(false);
    setSelectedStudent(null);
  };

  useEffect(() => {
    if (selectedStudent) {
        setFormData({
            studentName: selectedStudent.full_name,
            nis: selectedStudent.nis || '',
            gender: selectedStudent.gender || 'L',
            classId: selectedStudent.class_id || '',
            halaqahId: selectedStudent.halaqah_id || '',
            parentName: selectedStudent.parent_name || '',
            parentEmail: selectedStudent.parent_email || '',
            parentWhatsapp: selectedStudent.parent_whatsapp || ''
        });
    } else {
        resetForm();
    }
  }, [selectedStudent]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [infoStudent, setInfoStudent] = useState<StudentRekap | null>(null);

  const InfoModal = ({ student, onClose }: { student: StudentRekap, onClose: () => void }) => {
    return (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center lg:pl-64 lg:pt-20 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 text-slate-800"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                             <Info className="w-4 h-4 text-primary-600" />
                             Informasi Detail
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kontak Orang Tua / Wali</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 rounded-[20px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                            <Users className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nama Orang Tua</p>
                            <p className="text-sm font-bold text-slate-800 leading-none">{student.parent_name || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 rounded-[20px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                            <MessageCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">No. WhatsApp Ortu</p>
                            <p className="text-sm font-bold text-slate-700 leading-none">{student.parent_whatsapp || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 rounded-[20px] border border-slate-100/50 transition-all hover:bg-white hover:shadow-sm">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                            <Mail className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Akun Ortu</p>
                            <p className="text-sm font-bold text-slate-700 leading-none">{student.parent_email || '-'}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-full mt-2 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 shadow-sm"
                    >
                        Tutup Panel
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
        const [usersData, studentsData, halaqahData, classData] = await Promise.all([
            getUsers(tenantId),
            getStudents(tenantId),
            getHalaqahs(tenantId),
            getClasses(tenantId)
        ]);
        
        const sortedClasses = [...classData].sort((a, b) => {
            const aMatch = a.name.toUpperCase().match(/^(\d+)(.*)$/);
            const bMatch = b.name.toUpperCase().match(/^(\d+)(.*)$/);
            if (aMatch && bMatch) {
                const aNum = parseInt(aMatch[1]);
                const bNum = parseInt(bMatch[1]);
                if (aNum !== bNum) return aNum - bNum;
                return aMatch[2].localeCompare(bMatch[2]);
            }
            return a.name.localeCompare(b.name);
        });
        
        setHalaqahs(halaqahData);
        setClasses(sortedClasses);
        halaqahCache = halaqahData;
        classCache = sortedClasses;

        const parentMap = new Map(usersData.map(u => [u.id, u]));
        const hFullMap = new Map(halaqahData.map(h => {
             const teacher = usersData.find(u => u.id === h.teacher_id);
             return [h.id, { ...h, teacher_name: teacher?.full_name || '-' }];
        }));
        const classMap = new Map(classData.map(c => [c.id, c.name]));
        
        const joined: StudentRekap[] = studentsData.map(s => {
            const parent = s.parent_id ? parentMap.get(s.parent_id) : null;
            const hInfo = s.halaqah_id ? hFullMap.get(s.halaqah_id) : null;
            return {
                ...s,
                parent_name: parent?.full_name || '-',
                parent_email: parent?.email || '-',
                parent_whatsapp: parent?.whatsapp_number || '-',
                halaqah_name: hInfo?.name || '-',
                halaqah_teacher_name: hInfo?.teacher_name || '-',
                class_name: s.class_id ? classMap.get(s.class_id) : '-'
            };
        });
        
        setRekapData(joined);
        studentCache = joined;
    } catch (error) {
        console.error("Error fetching rekap data:", error);
        if (!isBackground) addNotification({ type: 'error', title: 'Gagal Memuat', message: 'Gagal mengambil data rekap santri.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(!!studentCache);
  }, [tenantId]);
  
  const filteredData = useMemo(() => {
    return rekapData.filter(s => {
      // Search logic
      const matchesSearch = !search || 
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.nis?.toLowerCase().includes(search.toLowerCase()) ||
        s.parent_name?.toLowerCase().includes(search.toLowerCase());

      // Gender logic
      const matchesGender = filterGender === 'all' || s.gender === filterGender;

      // Class logic
      const matchesClass = filterClass === 'all' || s.class_id === filterClass;

      // Halaqah logic
      const matchesHalaqah = filterHalaqah === 'all' || s.halaqah_id === filterHalaqah;

      return matchesSearch && matchesGender && matchesClass && matchesHalaqah;
    });
  }, [rekapData, search, filterGender, filterClass, filterHalaqah]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterGender, filterClass, filterHalaqah]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddOrEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!formData.studentName.trim()) errors.studentName = 'Nama santri wajib diisi.';
    if (!formData.parentName.trim()) errors.parentName = 'Nama orang tua wajib diisi.';
    if (!formData.parentEmail.trim()) errors.parentEmail = 'Email wajib diisi.';
    if (!formData.parentEmail.includes('@')) errors.parentEmail = 'Format email tidak valid.';
    
    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setIsSubmitting(true);
    try {
        if (isEditMode && selectedStudent) {
            // EDIT MODE
            // 1. Update Student
            await updateStudent({
                id: selectedStudent.id,
                full_name: formData.studentName,
                nis: formData.nis,
                gender: formData.gender,
                class_id: formData.classId || undefined,
                halaqah_id: formData.halaqahId || undefined
            }, currentUser);

            // 2. Update Parent (if exists)
            if (selectedStudent.parent_id) {
                await updateUser({
                    id: selectedStudent.parent_id,
                    full_name: formData.parentName,
                    whatsapp_number: formData.parentWhatsapp
                }, currentUser);
            }

            addNotification({ 
                type: 'success', 
                title: 'Berhasil', 
                message: `Data santri ${formData.studentName} berhasil diperbarui.` 
            });
        } else {
            // CREATE MODE
            // 1. Create Parent Account (User)
            const parentUser = await createUser({
                email: formData.parentEmail,
                password: 'santri123', // Password Sementara
                full_name: formData.parentName,
                role: UserRole.SANTRI,
                whatsapp_number: formData.parentWhatsapp,
                tenant_id: tenantId
            }, currentUser);

            // 2. Create Student Linked to Parent
            await createStudent({
                full_name: formData.studentName,
                nis: formData.nis,
                gender: formData.gender,
                class_id: formData.classId || undefined,
                halaqah_id: formData.halaqahId || undefined,
                parent_id: parentUser.id,
                tenant_id: tenantId
            }, currentUser);

            addNotification({ 
                type: 'success', 
                title: 'Berhasil', 
                message: `Data santri berhasil ditambahkan. Password sementaranya adalah: santri123` 
            });
        }
        
        setShowAddModal(false);
        resetForm();
        fetchData();
    } catch (error: any) {
        console.error("Add/Edit student detailed error:", error);
        // ... (remaining error handling)
        
        const errors: Record<string, string> = {};
        const msg = error.message?.toLowerCase() || "";

        // Check for specific error patterns
        if (msg.includes('email already exists') || msg.includes('profiles_email_key')) {
            errors.parentEmail = 'Email ini sudah terdaftar di sistem. Gunakan email lain.';
        } else if (msg.includes('duplicate key') && msg.includes('nis')) {
            errors.nis = 'NIS ini sudah digunakan oleh santri lain.';
        } else if (msg.includes('row-level security') || error.code === '42501') {
            addNotification({ 
                type: 'error', 
                title: 'Akses Ditolak (RLS)', 
                message: 'Kebijakan keamanan database menghalangi Anda menyimpan data ini. Pastikan Anda memiliki akses yang benar.' 
            });
        } else if (msg.includes('foreign key constraint')) {
            addNotification({ 
                type: 'error', 
                title: 'Kesalahan Relasi', 
                message: 'Gagal menghubungkan data (Kelas/Halaqah tidak ditemukan).' 
            });
        } else {
            addNotification({ 
                type: 'error', 
                title: 'Gagal Menambahkan', 
                message: `Pesan Error: ${error.message || 'Terjadi kesalahan sistem.'}` 
            });
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(prev => ({ ...prev, ...errors }));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatWhatsAppUrl = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === '-') return '#';
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.slice(1);
    return `https://wa.me/${cleanNumber}`;
  };

  const handleEdit = (student: StudentRekap) => {
    setIsEditMode(true);
    setSelectedStudent(student);
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setIsSubmitting(true);
    try {
        await deleteStudent(studentToDelete.id, studentToDelete.full_name, currentUser);
        // Note: For now we don't delete the parent user account automatically to prevent accidental data loss
        addNotification({ type: 'success', title: 'Berhasil', message: `Data santri ${studentToDelete.full_name} telah dihapus.` });
        fetchData();
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat menghapus data santri.' });
    } finally {
        setIsSubmitting(false);
        setStudentToDelete(null);
    }
  };

  const handleUpdateHalaqah = async (studentId: string, halaqahId: string) => {
    setIsSubmitting(true);
    try {
        await updateStudent({
            id: studentId,
            halaqah_id: halaqahId || undefined
        }, currentUser);
        
        // --- OPTIMISTIC LOCAL UPDATE (No Reload) ---
        setRekapData(prev => prev.map(s => {
            if (s.id === studentId) {
                const newH = halaqahs.find(h => h.id === halaqahId);
                return {
                    ...s,
                    halaqah_id: halaqahId,
                    halaqah_name: newH?.name || '-',
                    // We don't have user list here to get teacher name easily, 
                    // but we can try to find it from another student or just keep it simple
                    // Best way: halaqah data already has teacher name if we fetch correctly
                    // For now, let's just trigger a background fetch after local update
                };
            }
            return s;
        }));

        addNotification({ type: 'success', title: 'Berhasil', message: 'Halaqah santri berhasil diperbarui secara instan.' });
        // Fetch in background WITHOUT loading state to keep sync
        fetchData(true); 
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui halaqah. Silakan coba lagi.' });
    } finally {
        setIsSubmitting(false);
        setEditingHalaqahId(null);
    }
  };

  const handleUpdateClass = async (studentId: string, classId: string) => {
    setIsSubmitting(true);
    try {
        await updateStudent({
            id: studentId,
            class_id: classId || undefined
        }, currentUser);

        // --- OPTIMISTIC LOCAL UPDATE (No Reload) ---
        setRekapData(prev => prev.map(s => {
            if (s.id === studentId) {
                const newC = classes.find(c => c.id === classId);
                return {
                    ...s,
                    class_id: classId,
                    class_name: newC?.name || '-'
                };
            }
            return s;
        }));

        addNotification({ type: 'success', title: 'Berhasil', message: 'Kelas santri berhasil diperbarui secara instan.' });
        // Fetch in background WITHOUT loading state to keep sync
        fetchData(true);
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui kelas. Silakan coba lagi.' });
    } finally {
        setIsSubmitting(false);
        setEditingClassId(null);
    }
  };

  // --- EXCEL LOGIC ---

  const downloadTemplate = () => {
    // 1. Prepare Main Template Headers
    const headers = [
      'Nama Lengkap Santri', 
      'NIS', 
      'Jenis Kelamin (L/P)', 
      'Kelas', 
      'Halaqah', 
      'Nama Orang Tua', 
      'Email Orang Tua', 
      'WhatsApp Orang Tua',
      '', // Gap
      '', // Gap
      'DATA REFERENSI KELAS (SALIN DARI SINI)',
      'DATA REFERENSI HALAQAH (SALIN DARI SINI)'
    ];

    // 2. Initial Data Row (Example)
    // NIS (col 1) and WhatsApp (col 7) must be cell objects with type 's' (string)
    // to prevent Excel from treating long numerics as numbers (scientific notation)
    const exampleRow: any[] = [
      'Ahmad Abdullah',
      { v: '20240001', t: 's' },       // NIS as text
      'L',
      classes[0]?.name || '-',
      halaqahs[0]?.name || '-',
      'Abdullah Bin Zaid',
      'abdullah@gmail.com',
      { v: '08123456789', t: 's' },    // WhatsApp as text
      '', // Gap
      '', // Gap
      classes[0]?.name || '-',
      halaqahs[0]?.name || '-'
    ];

    const rows: any[][] = [headers, exampleRow];

    // 3. Fill Reference Lists (Rows 3 and onwards)
    const maxReferenceRows = Math.max(classes.length, halaqahs.length);
    for (let i = 1; i < maxReferenceRows; i++) {
        const row = new Array(12).fill('');
        row[10] = classes[i]?.name || '';
        row[11] = halaqahs[i]?.name || '';
        rows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Force NIS (col B = index 1) and WhatsApp (col H = index 7) columns to text format '@'
    // This prevents Excel from auto-converting long numbers to scientific notation
    const textColIndices = [1, 7];
    const totalRows = rows.length;
    for (const colIdx of textColIndices) {
        for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
            const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            if (!ws[cellAddr]) {
                // Create an empty text cell so format is defined even for blank rows
                ws[cellAddr] = { v: '', t: 's' };
            } else {
                ws[cellAddr].t = 's';
            }
            ws[cellAddr].z = '@'; // '@' = Text number format in Excel
        }
    }

    // Set Column Widths for readability
    ws['!cols'] = [
        { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, 
        { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 5 }, { wch: 5 },
        { wch: 35 }, { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import");
    XLSX.writeFile(wb, "Template_Import_Santri.xlsx");
    
    addNotification({ 
        type: 'success', 
        title: 'Unduh Selesai', 
        message: 'Silakan gunakan kolom DATA REFERENSI di sebelah kanan sebagai acuan.' 
    });
  };

  const downloadFullExport = () => {
    const data = filteredData.map((s, idx) => ({
        'No': idx + 1,
        'NIS': s.nis || '-',
        'Nama': s.full_name,
        'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        'Kelas': s.class_name || '-',
        'Pengampu': s.halaqah_teacher_name || '-',
        'Halaqoh': s.halaqah_name || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Santri");
    XLSX.writeFile(wb, `Data_Santri_${new Date().toISOString().split('T')[0]}.xlsx`);
    addNotification({ type: 'success', title: 'Export Berhasil', message: 'Seluruh data santri telah diexport ke Excel.' });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowImportModal(true);
    setImportProgress({ current: 0, total: 0, errors: [] });
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const rawData = XLSX.utils.sheet_to_json(ws) as any[];
            // Filter only rows that have a student name (ignore reference columns)
            const data = rawData.filter(row => row['Nama Lengkap Santri'] && row['Nama Lengkap Santri'].toString().trim() !== '');

            if (data.length === 0) {
                setImportProgress(prev => ({ ...prev, errors: ['File Excel kosong atau tidak ditemukan data santri yang valid.'] }));
                return;
            }

            setImportProgress(prev => ({ ...prev, total: data.length }));
            
            // 1. Fetch latest users to check for existing parents (siblings support)
            const latestUsers = await getUsers(tenantId);
            const userMap = new Map(latestUsers.map(u => [u.email.toLowerCase(), u.id]));
            
            const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c.id]));
            const halaqahMap = new Map(halaqahs.map(h => [h.name.toLowerCase(), h.id]));
            
            let successCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const studentName = row['Nama Lengkap Santri']?.toString().trim();
                const parentEmail = row['Email Orang Tua']?.toString().trim().toLowerCase();
                const parentName = row['Nama Orang Tua']?.toString().trim();

                // Skip empty rows or reference rows
                if (!studentName) continue;

                if (!parentEmail || !parentName) {
                    errors.push(`Baris ${i + 2} (${studentName}): Nama Orang Tua dan Email wajib diisi.`);
                    setImportProgress(prev => ({ ...prev, current: i + 1, errors: [...errors] }));
                    continue;
                }

                try {
                    let parentId = userMap.get(parentEmail);

                    // 1. Create Parent if not exists
                    if (!parentId) {
                        const parentUser = await createUser({
                            email: parentEmail,
                            password: 'santri123',
                            full_name: parentName,
                            role: UserRole.SANTRI,
                            whatsapp_number: String(row['WhatsApp Orang Tua'] || '-'),
                            tenant_id: tenantId
                        }, currentUser);
                        parentId = parentUser.id;
                        userMap.set(parentEmail, parentId);
                    }

                    // 2. Map Class/Halaqah
                    const classId = classMap.get(String(row['Kelas'] || '').toLowerCase());
                    const halaqahId = halaqahMap.get(String(row['Halaqah'] || '').toLowerCase());

                    // 3. Create Student
                    await createStudent({
                        full_name: studentName,
                        nis: String(row['NIS'] || ''),
                        gender: (row['Jenis Kelamin (L/P)'] === 'P' || row['Jenis Kelamin (L/P)'] === 'p') ? 'P' : 'L',
                        class_id: classId,
                        halaqah_id: halaqahId,
                        parent_id: parentId,
                        tenant_id: tenantId
                    }, currentUser);

                    successCount++;
                } catch (err: any) {
                    let msg = err.message || 'Gagal menyimpan.';
                    if (msg.toLowerCase().includes('duplicate key') && msg.includes('nis')) {
                        msg = "Gagal: NIS ini sudah digunakan oleh santri lain.";
                    }
                    errors.push(`Baris ${i + 2} (${studentName}): ${msg}`);
                }
                
                setImportProgress(prev => ({ ...prev, current: i + 1, errors: [...errors] }));
            }

            if (successCount > 0) {
                addNotification({ 
                    type: 'success', 
                    title: 'Import Selesai', 
                    message: `${successCount} data santri berhasil diimport.` 
                });
                fetchData();
            }
        } catch (err) {
            setImportProgress(prev => ({ ...prev, errors: ['Gagal membaca file Excel. Pastikan format benar.'] }));
        }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* UTILITY STRIP (TOP ACTIONS) */}
      <div className="bg-transparent rounded-none px-0 py-0 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
         <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:block"></h2>
          <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
            {!isReadOnly && (
                <>
                    <button 
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-50 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <FileDown className="w-3.5 h-3.5" /> Template
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImportExcel}
                        className="hidden" 
                        accept=".xlsx, .xls" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-emerald-50 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
                    >
                        <Upload className="w-3.5 h-3.5" /> Import
                    </button>
                </>
            )}
            <button 
                onClick={downloadFullExport}
                className="flex items-center gap-2 px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-50 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
                <Download className="w-3.5 h-3.5" /> Export
            </button>
            {!isReadOnly && (
                <>
                    <div className="w-px h-6 bg-slate-100 mx-1 hidden md:block" />
                    <button 
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="flex items-center gap-2 px-5 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-100 hover:bg-primary-700 hover:border-primary-700 transition-all active:scale-95 shrink-0"
                    >
                        <UserPlus className="w-3.5 h-3.5" /> TAMBAH SANTRI
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Stats Quick View Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                  <GraduationCap className="w-5 h-5"/>
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Santri</p>
                  <h4 className="text-xl font-black text-slate-800 leading-none">{rekapData.length}</h4>
              </div>
          </div>
          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                  <Database className="w-5 h-5"/>
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Akun Aktif</p>
                  <h4 className="text-xl font-black text-slate-800 leading-none">{rekapData.filter(s => s.parent_id).length}</h4>
              </div>
          </div>
          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-20 h-20 bg-blue-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                  <School className="w-5 h-5"/>
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Halaqah Aktif</p>
                  <h4 className="text-xl font-black text-slate-800 leading-none">{halaqahs.length}</h4>
              </div>
          </div>
          <div className="bg-white rounded-[22px] p-5 border-2 border-slate-50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-20 h-20 bg-orange-50/50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm relative z-10">
                  <AlertCircle className="w-5 h-5"/>
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Belum Ada NIS</p>
                  <h4 className="text-xl font-black text-slate-800 leading-none">{rekapData.filter(s => !s.nis).length}</h4>
              </div>
          </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center shrink-0">
        <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Cari NIS atau Nama Santri..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-[11px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-sm"
            />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Gender Filter */}
            <select 
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-50/50 bg-white min-w-[130px] cursor-pointer hover:border-slate-200 transition-all shadow-sm"
            >
                <option value="all">Semua Gender</option>
                <option value="L">Putra (L)</option>
                <option value="P">Putri (P)</option>
            </select>

            {/* Class Filter */}
            <select 
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-50/50 bg-white min-w-[150px] cursor-pointer hover:border-slate-200 transition-all shadow-sm"
            >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            {/* Halaqah Filter */}
            <select 
                value={filterHalaqah}
                onChange={(e) => setFilterHalaqah(e.target.value)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-50/50 bg-white min-w-[140px] cursor-pointer hover:border-slate-200 transition-all shadow-sm"
            >
                <option value="all">Semua Halaqah</option>
                {halaqahs.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                ))}
            </select>

            <button 
                disabled={!(filterGender !== 'all' || filterClass !== 'all' || filterHalaqah !== 'all' || search)}
                onClick={() => { setFilterGender('all'); setFilterClass('all'); setFilterHalaqah('all'); setSearch(''); }}
                className={`w-10 flex items-center justify-center transition-all rounded-xl border ${ (filterGender !== 'all' || filterClass !== 'all' || filterHalaqah !== 'all' || search) ? 'text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-100 cursor-pointer shadow-sm' : 'text-slate-300 border-slate-50 cursor-not-allowed'}`}
                title="Reset semua filter"
            >
                <RefreshCw className={`w-4 h-4 ${(filterGender !== 'all' || filterClass !== 'all' || filterHalaqah !== 'all' || search) ? 'animate-spin-once' : ''}`} />
            </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-transparent rounded-none flex flex-col border border-slate-100/50">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-40">
              <tr className="bg-slate-50/80 backdrop-blur-md">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 sticky left-0 z-[60] bg-slate-50 w-16">No</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 sticky left-16 z-[60] bg-slate-50 w-28">NIS</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 sticky left-[164px] z-[60] bg-slate-50 max-w-[150px]">Nama Santri</th>
                <th className="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 bg-slate-50/50 w-12">JK</th>
                <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 bg-slate-50/50 w-28">Kelas</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 bg-slate-50/50 max-w-[130px]">Pengampu</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200/60 bg-slate-50/50 max-w-[130px]">Halaqah</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 bg-slate-50/50 w-24">
                  {isReadOnly ? 'info' : 'aksi'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                  [...Array(5)].map((_, i) => (
                      <tr key={i}>
                          {[...Array(7)].map((_, j) => (
                              <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div></td>
                          ))}
                          {!isReadOnly && <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div></td>}
                      </tr>
                  ))
              ) : paginatedData.map((s, index) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-[10.5px] font-black text-slate-300 border-r border-slate-100/50 sticky left-0 z-30 bg-white group-hover:bg-slate-50 transition-colors">
                    {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100/50 sticky left-16 z-30 bg-white group-hover:bg-slate-50 transition-colors">
                    <span className="text-[10.5px] font-mono font-black text-slate-600 bg-slate-50 px-2 py-0.5 rounded tracking-tight">{s.nis || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100/50 sticky left-[164px] z-30 bg-white group-hover:bg-slate-50 transition-colors max-w-[150px]">
                    <span className="text-[10.5px] font-black text-slate-800 capitalize tracking-tight truncate block" title={s.full_name}>{s.full_name}</span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap border-r border-slate-100/50 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight border ${s.gender === 'L' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                        {s.gender === 'L' ? 'L' : 'P'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap border-r border-slate-100/50">
                    {editingClassId === s.id ? (
                        <select 
                            autoFocus
                            disabled={isSubmitting}
                            className="text-[10.5px] border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm w-full"
                            value={s.class_id || ''}
                            onChange={(e) => handleUpdateClass(s.id, e.target.value)}
                            onBlur={() => !isSubmitting && setEditingClassId(null)}
                        >
                            <option value="">Pilih Kelas</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    ) : (
                        <div 
                            onClick={() => !isReadOnly && setEditingClassId(s.id)}
                            className={`flex items-center gap-1.5 text-[10.5px] text-slate-600 bg-slate-50 px-2 py-1 rounded-full w-fit border border-slate-100 transition-all select-none group/c ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'}`}
                            title={isReadOnly ? "" : "Klik untuk ubah kelas cepat"}
                        >
                            <School className="w-3 h-3 text-slate-400 group-hover/c:text-primary-500" />
                            <span className="font-bold text-slate-800 group-hover/c:text-primary-800">{s.class_name || '-'}</span>
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100/50 max-w-[130px]">
                     <p className="text-[10.5px] font-bold text-slate-700 truncate" title={s.halaqah_teacher_name || '-'}>{s.halaqah_teacher_name || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100/50 max-w-[130px]">
                    {editingHalaqahId === s.id ? (
                        <select 
                            autoFocus
                            disabled={isSubmitting}
                            className="text-[10.5px] border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm w-full"
                            value={s.halaqah_id || ''}
                            onChange={(e) => handleUpdateHalaqah(s.id, e.target.value)}
                            onBlur={() => !isSubmitting && setEditingHalaqahId(null)}
                        >
                            <option value="">Pilih Halaqah</option>
                            {halaqahs.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    ) : (
                        <div 
                            onClick={() => !isReadOnly && setEditingHalaqahId(s.id)}
                            className={`flex items-center gap-1.5 text-[10.5px] text-slate-600 bg-slate-50 px-2 py-1 rounded-full w-fit border border-slate-100 transition-all select-none group/h ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}
                            title={isReadOnly ? "" : "Klik untuk ubah halaqah cepat"}
                        >
                            <Users className="w-3 h-3 text-slate-400 group-hover/h:text-emerald-500" />
                            <span className="font-bold text-slate-800 group-hover/h:text-emerald-800 truncate" style={{ maxWidth: '80px' }}>{s.halaqah_name || '-'}</span>
                        </div>
                    )}
                  </td>
                  {!isReadOnly ? (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1">
                            <button 
                                onClick={() => setInfoStudent(s)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Detail Informasi Ortu"
                            >
                                <Info className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => handleEdit(s)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit Data Santri"
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setStudentToDelete(s)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus Data Santri"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </td>
                  ) : (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                            onClick={() => setInfoStudent(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Detail Informasi Ortu"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredData.length > 0 && (
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
                        <span className="text-slate-500">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> Dari 
                        <span className="text-primary-600 ml-1">{filteredData.length}</span>
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

        {filteredData.length === 0 && !loading && (
             <div className="p-16 text-center bg-white">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border-2 border-slate-50/50">
                    <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Data Tidak Ditemukan</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
             </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center lg:pl-64 p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden border border-white flex flex-col max-h-[80vh]">
                  <div className="px-6 py-3 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-0.5">
                            {isEditMode ? 'Edit Santri' : 'Santri Baru'}
                        </h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Database Akademik</p>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddOrEditStudent} className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                          {/* Data Santri */}
                          <div className="space-y-3">
                              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1">Data Santri</h4>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                                  <input 
                                    required
                                    value={formData.studentName}
                                    onChange={e => {
                                        setFormData({...formData, studentName: e.target.value});
                                        if (formErrors.studentName) setFormErrors({...formErrors, studentName: ''});
                                    }}
                                    className={`w-full px-4 py-1.5 border-2 rounded-xl text-xs font-bold transition-all outline-none ${formErrors.studentName ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-indigo-400 focus:bg-white text-slate-800'}`}
                                  />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NIS</label>
                                      <input 
                                        value={formData.nis}
                                        onChange={e => {
                                            setFormData({...formData, nis: e.target.value});
                                            if (formErrors.nis) setFormErrors({...formErrors, nis: ''});
                                        }}
                                        className={`w-full px-4 py-1.5 border-2 rounded-xl text-xs font-bold transition-all outline-none ${formErrors.nis ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-indigo-400 focus:bg-white text-slate-800'}`}
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                      <div className="relative">
                                        <select 
                                            value={formData.gender}
                                            onChange={e => setFormData({...formData, gender: e.target.value as 'L' | 'P'})}
                                            className="w-full px-4 py-1.5 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                                        >
                                            <option value="L">L</option>
                                            <option value="P">P</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                                      </div>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                                      <div className="relative">
                                        <select 
                                            value={formData.classId}
                                            onChange={e => setFormData({...formData, classId: e.target.value})}
                                            className="w-full px-4 py-1.5 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                                        >
                                            <option value="">-</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                                      </div>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Halaqah</label>
                                      <div className="relative">
                                        <select 
                                            value={formData.halaqahId}
                                            onChange={e => setFormData({...formData, halaqahId: e.target.value})}
                                            className="w-full px-4 py-1.5 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all"
                                        >
                                            <option value="">-</option>
                                            {halaqahs.map(h => (
                                                <option key={h.id} value={h.id}>{h.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Data Orang Tua */}
                          <div className="space-y-3">
                              <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-1">Akses & Wali</h4>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Wali</label>
                                  <input 
                                    required
                                    value={formData.parentName}
                                    onChange={e => {
                                        setFormData({...formData, parentName: e.target.value});
                                        if (formErrors.parentName) setFormErrors({...formErrors, parentName: ''});
                                    }}
                                    className={`w-full px-4 py-1.5 border-2 rounded-xl text-xs font-bold transition-all outline-none ${formErrors.parentName ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-emerald-400 focus:bg-white text-slate-800'}`}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                  <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                    <input 
                                        required
                                        type="email"
                                        disabled={isEditMode}
                                        value={formData.parentEmail}
                                        onChange={e => {
                                            setFormData({...formData, parentEmail: e.target.value});
                                            if (formErrors.parentEmail) setFormErrors({...formErrors, parentEmail: ''});
                                        }}
                                        className={`w-full pl-9 pr-4 py-1.5 border-2 rounded-xl text-xs font-bold transition-all outline-none ${formErrors.parentEmail ? 'border-red-500 bg-red-50 focus:bg-white' : 'bg-slate-50/30 border-slate-100 focus:border-emerald-400 focus:bg-white text-slate-800'} ${isEditMode ? 'opacity-50 border-transparent' : ''}`}
                                    />
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                  <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                    <input 
                                        type="tel" 
                                        value={formData.parentWhatsapp}
                                        onChange={e => setFormData({...formData, parentWhatsapp: e.target.value})}
                                        className="w-full pl-9 pr-4 py-1.5 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-bold focus:border-emerald-400 focus:bg-white transition-all outline-none"
                                    />
                                  </div>
                              </div>
                              {!isEditMode && (
                                <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-50 flex gap-2">
                                    <Lock className="w-3 h-3 text-emerald-600 mt-0.5 ml-1" />
                                    <p className="text-[8px] text-emerald-700 font-bold leading-tight">
                                        Pass Sementara: <span className="text-emerald-600">santri123</span>
                                    </p>
                                </div>
                              )}
                          </div>
                      </div>

                      <div className="mt-4 flex gap-2 pt-3 border-t border-slate-50 shrink-0">
                          <button 
                            type="button" 
                            className="flex-1 px-4 py-2.5 font-black text-[9px] uppercase tracking-tight rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                            onClick={() => setShowAddModal(false)}
                          >
                              Batal
                          </button>
                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] flex items-center justify-center px-4 py-2.5 font-black text-[9px] uppercase tracking-tight rounded-xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                          >
                              {isSubmitting ? '...' : (isEditMode ? 'SIMPAN' : 'DAFTARKAN SANTRI')}
                          </button>
                      </div>
                  </form>

              </div>
          </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center lg:pl-64 lg:pt-20 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setShowImportModal(false)}
          >
              <div 
                className="bg-white rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden cursor-default border border-white/20 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="px-6 py-3.5 border-b border-slate-50 flex justify-between items-center bg-[#FCFDFE]">
                      <div>
                          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-500" />
                              Import Progress
                          </h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Memproses Data Santri</p>
                      </div>
                      <button 
                        onClick={() => setShowImportModal(false)} 
                        className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                          <X className="w-3.5 h-3.5" />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Memproses data...</span>
                              <span className="text-[10px] font-black text-slate-600 tabular-nums">
                                  {importProgress.current} / {importProgress.total}
                              </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${(importProgress.current / (importProgress.total || 1)) * 100}%` }}
                              />
                          </div>
                          <div className="flex justify-end">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                  {Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%
                              </span>
                          </div>
                      </div>

                      {/* Error Log */}
                      {importProgress.errors.length > 0 && (
                          <div className="bg-red-50 rounded-[16px] p-4 max-h-48 overflow-y-auto border border-red-100 scrollbar-hide">
                              <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 mb-2.5">
                                  <Info className="w-3.5 h-3.5" /> Log Kesalahan
                              </h4>
                              <ul className="space-y-1.5">
                                  {importProgress.errors.map((err, i) => (
                                      <li key={i} className="text-[10px] font-bold text-red-500 leading-tight">• {err}</li>
                                  ))}
                              </ul>
                          </div>
                      )}

                      {/* Done State */}
                      {importProgress.current === importProgress.total && importProgress.total > 0 && (
                          <div className="space-y-4">
                              <div className="bg-emerald-50 p-4 rounded-[16px] flex gap-3 items-center border border-emerald-100">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                                  <div>
                                      <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Proses Selesai</p>
                                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{importProgress.total - importProgress.errors.length} santri berhasil ditambahkan.</p>
                                  </div>
                              </div>
                              <button 
                                className="w-full py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 shadow-sm"
                                onClick={() => setShowImportModal(false)}
                              >
                                  Tutup Panel
                              </button>
                          </div>
                      )}

                      {/* Error-only State (no rows processed) */}
                      {importProgress.total === 0 && importProgress.errors.length > 0 && (
                          <button 
                            className="w-full py-3 border-2 border-red-100 bg-red-50 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:bg-red-100 transition-all active:scale-95"
                            onClick={() => setShowImportModal(false)}
                          >
                              Tutup
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}
      {/* Info Modal */}
      {infoStudent && (
          <InfoModal 
            student={infoStudent} 
            onClose={() => setInfoStudent(null)} 
          />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Data Santri?"
        variant="danger"
        confirmLabel="YA, HAPUS SANTRI"
        message={
            <span>
                Hapus santri <strong>{studentToDelete?.full_name}</strong>?
                {studentToDelete?.nis && (
                    <span className="text-slate-400 text-[9px] block mb-1 uppercase tracking-tighter">NIS: {studentToDelete.nis}</span>
                )}
                <span className="text-red-600 font-bold text-[10px] block mt-2">
                    Catatan: Akun orang tua tidak akan dihapus otomatis.
                </span>
            </span>
        }
      />
    </div>
  );
};

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);
