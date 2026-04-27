
import React, { useEffect, useState } from 'react';
import { getClasses, createClass, updateClass, deleteClass, getStudents, updateStudent, getTenant, updateTenant } from '../../services/dataService';
import { Class, UserProfile, Student, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Users, School, X, ChevronRight, Save, Edit, Trash2, TrendingUp, AlertTriangle, GraduationCap, MessageCircle, Check, ArrowRight, RefreshCw, Wand2, Lock, Archive, Search, Medal, Calendar, UserCheck, ChevronDown } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

// --- Components ---

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { names: string[] }) => Promise<void>;
  initialData?: Class | null;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [className, setClassName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setError('');
        setClassName(initialData ? initialData.name : '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!className.trim()) {
        setError('Nama kelas wajib diisi.');
        return;
    }

    setIsSubmitting(true);
    try {
        await onSubmit({ names: [className.trim().toUpperCase()] });
    } catch (err: any) {
        setError(err.message || 'Gagal menyimpan data kelas.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-800">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xs overflow-hidden border border-white flex flex-col max-h-[80vh] relative">
        {/* Close Button UI */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {/* Header */}
        <div className="px-6 py-3 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-0.5">
              {initialData ? 'Edit Kelas' : 'Kelas Baru'}
            </h3>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Manajemen Kelas</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Input Nama Kelas</label>
                <input 
                    autoFocus
                    required
                    type="text" 
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-black text-slate-800 outline-none uppercase focus:border-indigo-400 focus:bg-white transition-all"
                    placeholder="7"
                />
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-[9px] font-bold">{error}</p>
                </div>
            )}

            <div className="flex gap-2 pt-2 shrink-0">
                <button 
                    type="button" 
                    className="flex-1 px-4 py-2.5 font-black text-[9px] uppercase tracking-tight rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all active:scale-95" 
                    onClick={onClose}
                >
                    Batal
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] flex items-center justify-center px-4 py-2.5 font-black text-[9px] uppercase tracking-tight rounded-xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? '...' : (initialData ? 'SIMPAN' : 'BUAT KELAS')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};


export const ClassManagement: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();
  
  // Modals State
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showAlumniView, setShowAlumniView] = useState(false);
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [alumniSearch, setAlumniSearch] = useState('');
  const [alumniSortYear, setAlumniSortYear] = useState<string>('all');
  const [alumniPage, setAlumniPage] = useState(1);
  const ALUMNI_PER_PAGE = 10;
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const [systemConfig, setSystemConfig] = useState({ min: 1, max: 6 });
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleUpdateSubClass = async (cls: Class) => {
    if (!editingValue.trim()) {
        setEditingClassId(null);
        return;
    }
    
    const gradeNum = cls.name.match(/\d+/)?.[0] || '';
    const newName = `${gradeNum}${editingValue.trim().toUpperCase()}`;
    
    if (newName === cls.name) {
        setEditingClassId(null);
        return;
    }

    // Check if new name exists (other than the one we're editing)
    if (classes.some(c => c.name === newName && c.id !== cls.id)) {
        addNotification({ type: 'error', title: 'Gagal', message: `Nama ${newName} sudah digunakan.` });
        setEditingClassId(null);
        return;
    }

    setGlobalLoading(true);
    try {
        await updateClass(cls.id, { name: newName }, user);
        addNotification({ type: 'success', title: 'Berhasil', message: 'Nama sub-kelas diperbarui.' });
        setEditingClassId(null);
        await fetchData();
    } catch (error: any) {
        addNotification({ type: 'error', title: 'Gagal', message: error.message || 'Gagal memperbarui nama.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newSubChar, setNewSubChar] = useState('');

  const handleAddSubClass = async (gradeNum: string) => {
    if (!newSubChar.trim()) return;
    const name = `${gradeNum}${newSubChar.trim().toUpperCase()}`;
    
    // Check if name already exists
    if (classes.some(c => c.name === name)) {
        addNotification({ type: 'error', title: 'Gagal', message: `Sub-kelas ${name} sudah ada.` });
        return;
    }

    setGlobalLoading(true);
    try {
        await createClass({ name, tenant_id: tenantId }, user);
        addNotification({ type: 'success', title: 'Berhasil', message: `Sub-kelas ${name} berhasil ditambahkan.` });
        setAddingSubTo(null);
        setNewSubChar('');
        await fetchData();
    } catch (error: any) {
        addNotification({ type: 'error', title: 'Gagal', message: error.message || 'Gagal membuat sub-kelas.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  // --- GROUPING LOGIC ---
  const groupedClasses = React.useMemo(() => {
    const groups: Record<string, Class[]> = {};
    classes.forEach(cls => {
        const match = cls.name.match(/\d+/);
        const groupKey = match ? `Kelas ${match[0]}` : 'Tanpa kelas';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(cls);
    });

    // Sort group keys numerically if possible
    return Object.fromEntries(
        Object.entries(groups).sort(([a], [b]) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        })
    );
  }, [classes]);

  const isSystemReady = React.useMemo(() => {
    if (classes.length === 0) return false;
    
    // Check if "utuh" (all grades from min to max range must exist)
    const existingGrades = new Set(classes.map(c => {
        const match = c.name.match(/\d+/);
        return match ? parseInt(match[0]) : -1;
    }));
    
    for (let i = systemConfig.min; i <= systemConfig.max; i++) {
        if (!existingGrades.has(i)) return false;
    }
    
    // Check if "terchecklist semuanya" (all classes in the list are selected)
    // To ensures cycle consistency across the entire school
    return selectedClassIds.length === classes.length;
  }, [classes, systemConfig, selectedClassIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (addingSubTo || editingClassId) {
            const target = event.target as HTMLElement;
            // If click not inside the input group and not inside a button that might be opening it
            if (!target.closest('.sub-class-input-zone')) {
                setAddingSubTo(null);
                setEditingClassId(null);
                setNewSubChar('');
            }
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [addingSubTo, editingClassId]);
  const fetchData = async () => {
    setLoading(true);
    try {
        const [classesData, studentsData, tenantData] = await Promise.all([
            getClasses(tenantId),
            getStudents(tenantId),
            getTenant(tenantId)
        ]);
        
        const enrichedClasses = classesData.map(c => {
            return {
                ...c,
                student_count: studentsData.filter(s => s.class_id === c.id).length
            };
        });
    
        setClasses(enrichedClasses);
        setAllStudents(studentsData);

        // Sync System Config from Database or Local Storage Fallback
        if (tenantData && (tenantData as any).cycle_config) {
            const cfg = (tenantData as any).cycle_config;
            setSystemConfig(cfg);
            // Load alumni list from cycle_config
            if (cfg.alumni && Array.isArray(cfg.alumni)) {
                setAlumniList(cfg.alumni);
            }
        } else {
            const localData = localStorage.getItem(`qurma_cycle_${tenantId}`);
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    setSystemConfig(parsed);
                    if (parsed.alumni && Array.isArray(parsed.alumni)) {
                        setAlumniList(parsed.alumni);
                    }
                } catch (e) {
                    console.error("Failed to parse local cycle data");
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch class data:", error);
        addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memuat data kelas.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleSaveConfig = async () => {
    setGlobalLoading(true);
    try {
        // Fetch current tenant to preserve other curriculum target keys
        const tenant = await getTenant(tenantId);
        const existingConfig = (tenant as any)?.cycle_config || {};

        const updatedConfig = {
            ...existingConfig,
            ...systemConfig
        };

        await updateTenant(tenantId, { 
            cycle_config: updatedConfig 
        }, user);
        
        // Also save to localStorage as a robust immediate fallback
        localStorage.setItem(`qurma_cycle_${tenantId}`, JSON.stringify(updatedConfig));
        
        addNotification({ type: 'success', title: 'Tersimpan', message: 'Pengaturan rentang kelas telah disimpan.' });
        setIsEditingConfig(false);
    } catch (error) {
        console.error("DB Save failed, using local storage only:", error);
        localStorage.setItem(`qurma_cycle_${tenantId}`, JSON.stringify(systemConfig));
        addNotification({ 
            type: 'info', 
            title: 'Tersimpan Lokal', 
            message: 'Pengaturan disimpan di browser ini (Gagal simpan ke database).' 
        });
        setIsEditingConfig(false);
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: { names: string[] }) => {
    try {
        if (isEditMode && selectedClass) {
            await updateClass(selectedClass.id, { name: data.names[0] }, user);
            addNotification({ type: 'success', title: 'Berhasil', message: `Kelas ${data.names[0]} telah diperbarui.` });
        } else {
            // Create multiple classes
            const promises = data.names.map(name => 
                createClass({ name, tenant_id: tenantId }, user)
            );
            await Promise.all(promises);
            addNotification({ 
                type: 'success', 
                title: 'Berhasil', 
                message: `${data.names.length} kelas baru telah dibuat.` 
            });
        }
        await fetchData();
        setIsFormModalOpen(false);
    } catch (error: any) {
        console.error("Save class error:", error);
        throw error; // Let the modal catch and display inline error
    }
  };

  const handleDelete = (cls: Class) => {
      setDeleteTarget(cls);
      setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setGlobalLoading(true);
    try {
        await deleteClass(deleteTarget.id, deleteTarget.name, user);
        addNotification({ type: 'success', title: 'Berhasil', message: `Kelas ${deleteTarget.name} berhasil dihapus.` });
        await fetchData();
        setIsDeleteModalOpen(false);
    } catch (error: any) {
        addNotification({ type: 'error', title: 'Gagal', message: error.message || 'Gagal menghapus kelas.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const openCreateModal = () => {
      setSelectedClass(null);
      setIsEditMode(false);
      setIsFormModalOpen(true);
  };

  const handleEdit = (cls: Class) => {
      setSelectedClass(cls);
      setIsEditMode(true);
      setIsFormModalOpen(true);
  };

  const viewStudents = (cls: Class) => {
    setSelectedClass(cls);
    setSelectedStudentIds([]);
    setTargetClassId('');
    setIsStudentsModalOpen(true);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
        prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (studentsInClass: Student[]) => {
      if (selectedStudentIds.length === studentsInClass.length) {
          setSelectedStudentIds([]);
      } else {
          setSelectedStudentIds(studentsInClass.map(s => s.id));
      }
  };

  const handleMoveStudents = async () => {
    if (!targetClassId || selectedStudentIds.length === 0) {
        addNotification({ type: 'error', title: 'Peringatan', message: 'Pilih santri dan kelas tujuan terlebih dahulu.' });
        return;
    }
    
    setGlobalLoading(true);
    try {
        const promises = selectedStudentIds.map(id => 
            updateStudent({ id, class_id: targetClassId }, user)
        );
        await Promise.all(promises);
        
        addNotification({ 
            type: 'success', 
            title: 'Berhasil', 
            message: `${selectedStudentIds.length} santri berhasil dipindahkan kelas.` 
        });
        
        await fetchData();
        setSelectedStudentIds([]);
        setTargetClassId('');
        setIsStudentsModalOpen(false);
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memindahkan santri.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const toggleClassSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUnselecting = selectedClassIds.includes(id);
    const classStudentIds = allStudents.filter(s => s.class_id === id).map(s => s.id);

    // Update Class Selection
    setSelectedClassIds(prev => 
        isUnselecting ? prev.filter(cid => cid !== id) : [...prev, id]
    );

    // Sync Student Selection
    setSelectedStudentIds(prev => {
        if (isUnselecting) {
            return prev.filter(sid => !classStudentIds.includes(sid));
        } else {
            return [...new Set([...prev, ...classStudentIds])];
        }
    });
  };

  const toggleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
        setSelectedClassIds([]);
        setSelectedStudentIds([]);
    } else {
        const allIds = classes.map(c => c.id);
        setSelectedClassIds(allIds);
        setSelectedStudentIds(allStudents.filter(s => s.class_id && allIds.includes(s.class_id)).map(s => s.id));
    }
  };
  
  

  const handleGenerateStructure = async () => {
    setGlobalLoading(true);
    let created = 0;
    let deleted = 0;
    try {
        // 1. Identify and Delete Classes outside the current range
        const classesToDelete = classes.filter(c => {
            const match = c.name.match(/\d+/);
            if (!match) return false; // Keep non-numeric classes
            const grade = parseInt(match[0]);
            return grade < systemConfig.min || grade > systemConfig.max;
        });

        for (const cls of classesToDelete) {
             // Unassign students first
             const classStudents = allStudents.filter(s => s.class_id === cls.id);
             for (const student of classStudents) {
                 await updateStudent({ id: student.id, class_id: null as any }, user);
             }
             await deleteClass(cls.id, cls.name, user);
             deleted++;
        }

        // 2. Create missing classes within range (default sub-class 'A')
        for (let i = systemConfig.min; i <= systemConfig.max; i++) {
            const hasAnySubClass = classes
                .filter(c => !classesToDelete.some(del => del.id === c.id))
                .some(c => {
                    const match = c.name.match(/\d+/);
                    return match && parseInt(match[0]) === i;
                });
            
            if (!hasAnySubClass) {
                const name = `${i}A`;
                await createClass({ name, tenant_id: tenantId }, user);
                created++;
            }
        }

        await fetchData();
        addNotification({ 
            type: 'success', 
            title: 'Sinkronisasi Selesai', 
            message: `Hasil: ${created} kelas baru dibuat, ${deleted} kelas lama dihapus.` 
        });
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal sinkronisasi struktur kelas.' });
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleBulkPromote = async () => {
    if (selectedClassIds.length === 0) return;
    
    setGlobalLoading(true);
    let promotedCount = 0;
    let graduatedCount = 0;
    let createdCount = 0;

    try {
        const classesToPromote = classes
            .filter(c => selectedClassIds.includes(c.id))
            .map(c => {
                const match = c.name.match(/\d+/);
                return { ...c, grade: match ? parseInt(match[0]) : 0 };
            })
            .sort((a, b) => b.grade - a.grade); // Sort DESCENDING to avoid collisions
        
        // Collect graduating students before the loop for alumni snapshot
        const graduatingStudentSnapshots: any[] = [];
        for (const cls of classesToPromote) {
            if (cls.grade >= systemConfig.max) {
                const studentsInClass = allStudents.filter(s => s.class_id === cls.id);
                studentsInClass.forEach(s => {
                    graduatingStudentSnapshots.push({
                        id: s.id,
                        full_name: s.full_name,
                        nis: s.nis || '-',
                        gender: s.gender || '-',
                        last_class: cls.name,
                        graduated_at: new Date().toISOString().split('T')[0],
                        graduated_year: new Date().getFullYear()
                    });
                });
            }
        }

        // Save graduating students to alumni list in cycle_config
        if (graduatingStudentSnapshots.length > 0) {
            const tenantCurrent = await getTenant(tenantId);
            const existingConfig = (tenantCurrent as any)?.cycle_config || {};
            const existingAlumni: any[] = existingConfig.alumni || [];
            const updatedAlumni = [...existingAlumni, ...graduatingStudentSnapshots];
            await updateTenant(tenantId, {
                cycle_config: { ...existingConfig, alumni: updatedAlumni }
            }, user);
            setAlumniList(updatedAlumni);
        }

        for (const cls of classesToPromote) {
            if (cls.grade === 0) continue;

            if (cls.grade >= systemConfig.max) {
                // Graduation Logic: FIRST, unassign all students from this class
                const studentsToUnassign = allStudents.filter(s => s.class_id === cls.id);
                for (const student of studentsToUnassign) {
                    // Soft-unassign students before class deletion
                    await updateStudent({ id: student.id, class_id: null as any }, user);
                }

                // THEN, delete the class
                await deleteClass(cls.id, cls.name, user);
                graduatedCount++;

                // Create New Min Grade Class (Always default to "A")
                const defaultStartName = `${systemConfig.min}A`;
                const currentClasses = await getClasses(tenantId);
                if (!currentClasses.some(ex => ex.name.toUpperCase() === defaultStartName)) {
                    await createClass({ name: defaultStartName, tenant_id: tenantId }, user);
                    createdCount++;
                }
            } else {
                // Regular Promotion
                const nextGrade = cls.grade + 1;
                const oldName = cls.name; // Keep name for refill check
                const newName = cls.name.replace(cls.grade.toString(), nextGrade.toString());
                
                await updateClass(cls.id, { name: newName }, user);
                promotedCount++;

                // Auto-Refill Logic: If the starting grade moves up, ensure a new default "A" class is created
                if (cls.grade === systemConfig.min) {
                    const defaultStartName = `${systemConfig.min}A`;
                    const currentClasses = await getClasses(tenantId);
                    if (!currentClasses.some(ex => ex.name.toUpperCase() === defaultStartName)) {
                        await createClass({ name: defaultStartName, tenant_id: tenantId }, user);
                        createdCount++;
                    }
                }
            }
        }
        
        addNotification({ 
            type: promotedCount > 0 || graduatedCount > 0 ? 'success' : 'info', 
            title: 'Siklus Kelas Selesai', 
            message: `Berhasil: ${promotedCount} naik, ${graduatedCount} lulus, ${createdCount} baru.` 
        });
        await fetchData();
        setShowPromoteModal(false);
        setSelectedClassIds([]);
    } catch (error: any) {
        console.error("Promote Error:", error);
        addNotification({ 
            type: 'error', 
            title: 'Gagal', 
            message: `Gagal: ${error.message || 'Cek koneksi database atau relasi data.'}` 
        });
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setGlobalLoading(true);
    let deletedCount = 0;
    try {
        for (const id of selectedClassIds) {
            const cls = classes.find(c => c.id === id);
            if (!cls) continue;

            // Unassign students from this specific class
            const classStudents = allStudents.filter(s => s.class_id === id);
            for (const student of classStudents) {
                await updateStudent({ id: student.id, class_id: null as any }, user);
            }

            // Delete the class
            await deleteClass(id, cls.name, user);
            deletedCount++;
        }
        
        addNotification({ 
            type: 'success', 
            title: 'Hapus Massal Berhasil', 
            message: `${deletedCount} kelas telah dihapus dari sistem.` 
        });
        await fetchData();
        setSelectedClassIds([]);
    } catch (error: any) {
        addNotification({ 
            type: 'error', 
            title: 'Gagal', 
            message: `Gagal menghapus beberapa kelas: ${error.message || 'Cek koneksi database.'}` 
        });
    } finally {
        setGlobalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Settings Panel */}
      <div className="transition-all">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 bg-slate-50/50 p-2 pr-6 rounded-2xl border-2 border-slate-100">
                  <div className="w-12 h-12 bg-white border-2 border-slate-100 shadow-sm rounded-xl flex items-center justify-center text-indigo-600">
                      <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight uppercase">Setting Lingkaran Sistem</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Siklus Kenaikan & Kelulusan</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-2xl border-2 border-slate-100">
                  <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-100 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mulai</p>
                          {isEditingConfig ? (
                              <input 
                                  type="number" 
                                  min={1}
                                  max={systemConfig.max - 1}
                                  className="w-8 h-6 text-center text-xs font-black bg-indigo-50 text-indigo-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={systemConfig.min}
                                  onChange={e => setSystemConfig({...systemConfig, min: parseInt(e.target.value) || 0})}
                              />
                          ) : (
                              <p className="text-xs font-black text-indigo-600">KELAS {systemConfig.min}</p>
                          )}
                      </div>

                      <ArrowRight className="w-3 h-3 text-slate-300" />

                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-100 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sampai</p>
                          {isEditingConfig ? (
                              <input 
                                  type="number" 
                                  min={systemConfig.min + 1}
                                  max={12}
                                  className="w-10 h-8 text-center text-xs font-black bg-rose-50 text-rose-600 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                  value={systemConfig.max}
                                  onChange={e => setSystemConfig({...systemConfig, max: parseInt(e.target.value) || 0})}
                              />
                          ) : (
                              <p className="text-xs font-black text-rose-600">KELAS {systemConfig.max}</p>
                          )}
                      </div>
                  </div>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                  <div className="flex gap-2">
                      {!isReadOnly && (
                        <>
                            <button 
                                onClick={() => {
                                    if (isEditingConfig) {
                                        if (systemConfig.min < 1) {
                                            addNotification({ type: 'error', title: 'Input Tidak Valid', message: 'Mulai Dari minimal kelas 1' });
                                            return;
                                        }
                                        if (systemConfig.max > 12) {
                                            addNotification({ type: 'error', title: 'Input Tidak Valid', message: 'Sampai Kelas maksimal kelas 12' });
                                            return;
                                        }
                                        if (systemConfig.min >= systemConfig.max) {
                                            addNotification({ type: 'error', title: 'Rentang Salah', message: 'Kelas mulai harus lebih rendah dari kelas akhir' });
                                            return;
                                        }
                                        handleSaveConfig();
                                    } else {
                                        setIsEditingConfig(true);
                                    }
                                }}
                                className={`flex items-center px-4 py-2 font-black text-xs rounded-xl border-2 transition-all active:scale-95 ${
                                    isEditingConfig 
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {isEditingConfig ? 'SIMPAN RENTANG' : 'UBAH RENTANG'}
                            </button>

                            <button 
                                onClick={() => setIsGenerateModalOpen(true)}
                                className="flex items-center px-4 py-2 font-black text-xs rounded-xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                GENERATE STRUKTUR
                            </button>
                        </>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Action Bar + Alumni button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-8">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Alumni Button (always visible, left side) */}
          <button
            onClick={() => setShowAlumniView(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 font-black text-[11px] uppercase tracking-widest rounded-2xl border-2 transition-all active:scale-95 ${
              showAlumniView
                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-400'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Alumni
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
              showAlumniView ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              {alumniList.length}
            </span>
          </button>

          {!showAlumniView && !isReadOnly && (
            <>
              <div className="w-px h-8 bg-slate-200 mx-1 shrink-0" />
              <div className="flex gap-1.5">
                <button 
                  onClick={() => isSystemReady && setShowPromoteModal(true)} 
                  disabled={selectedClassIds.length === 0 || !isSystemReady}
                  className={`flex items-center px-5 py-2.5 font-black text-sm rounded-2xl border-2 transition-all active:scale-95 whitespace-nowrap ${
                    selectedClassIds.length > 0 && isSystemReady 
                    ? "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 shadow-lg shadow-orange-100" 
                    : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                  }`}
                  title={selectedStudentIds.length === 0 ? "Pilih kelas terlebih dahulu" : (!isSystemReady ? "Checklist semua kelas dan pastikan rentang kelas lengkap untuk menjalankan siklus" : "")}
                >
                  {isSystemReady || selectedClassIds.length === 0 ? <TrendingUp className={`w-4 h-4 mr-2 ${selectedClassIds.length > 0 ? 'animate-pulse' : ''}`} /> : <Lock className="w-4 h-4 mr-2" />}
                  Jalankan Siklus ({selectedClassIds.length})
                </button>

                <button 
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  disabled={selectedClassIds.length === 0}
                  className={`flex items-center px-4 py-2 font-black text-sm rounded-2xl border-2 transition-all active:scale-95 whitespace-nowrap ${
                    selectedClassIds.length > 0
                    ? "border-red-400 bg-red-50 text-red-700 hover:bg-red-100 shadow-lg shadow-red-100" 
                    : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus ({selectedClassIds.length})
                </button>
              </div>

              <div className="w-px h-8 bg-slate-200 mx-1 shrink-0" />

              {classes.length > 0 && (
                <button 
                  onClick={toggleSelectAllClasses}
                  className="p-1.5 transition-all group shrink-0"
                  title="Pilih Semua Kelas"
                >
                  <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${selectedClassIds.length === classes.length ? 'bg-primary-600 border-primary-600 text-white shadow-sm' : 'bg-white border-slate-200 text-primary-600 group-hover:border-primary-400'}`}>
                    {selectedClassIds.length === classes.length ? <Check className="w-4 h-4" /> : <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 group-hover:bg-slate-200 transition-colors" />}
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {!showAlumniView && !isReadOnly && (
          <button 
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 font-black text-xs rounded-xl border-2 border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 hover:border-primary-700 transition-all active:scale-95 shrink-0"
          >
            TAMBAH KELAS
          </button>
        )}
      </div>
      {!showAlumniView && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedClasses).map(([groupKey, groupMembers]) => {
          const gradeNum = groupKey.match(/\d+/)?.[0] || '';
          const totalStudentsInGrade = groupMembers.reduce((sum, c) => sum + (c.student_count || 0), 0);
          const allSelected = groupMembers.every(m => selectedClassIds.includes(m.id));

          return (
            <div 
              key={groupKey} 
              className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col hover:shadow-md transition-all border-b-4 ${allSelected ? 'border-primary-500 shadow-primary-50' : 'border-slate-100 border-b-primary-500/20'}`}
            >
              {/* Group Header */}
              <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                          <School className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-slate-800 tracking-tight">{groupKey}</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              {totalStudentsInGrade} Santri Terdaftar
                          </p>
                      </div>
                  </div>
                   {!isReadOnly && (
                       <div 
                         onClick={() => {
                             const memberIds = groupMembers.map(m => m.id);
                             const groupStudentIds = allStudents.filter(s => s.class_id && memberIds.includes(s.class_id)).map(s => s.id);
                             
                             if (allSelected) {
                                 setSelectedClassIds(prev => prev.filter(id => !memberIds.includes(id)));
                                 setSelectedStudentIds(prev => prev.filter(id => !groupStudentIds.includes(id)));
                             } else {
                                 setSelectedClassIds(prev => [...new Set([...prev, ...memberIds])]);
                                 setSelectedStudentIds(prev => [...new Set([...prev, ...groupStudentIds])]);
                             }
                         }}
                         className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${allSelected ? 'bg-primary-600 border-primary-600 text-white shadow-sm scale-110' : 'bg-white border-slate-200 text-primary-600 hover:border-primary-400'}`}
                       >
                           {allSelected && <Check className="w-3.5 h-3.5" />}
                       </div>
                   )}
               </div>

              {/* Sub-Classes List Area (Vertical) */}
              <div className="p-5 flex flex-col gap-2 min-h-[100px] items-stretch">
                  {groupMembers.sort((a, b) => a.name.localeCompare(b.name)).map(cls => (
                      <div 
                          key={cls.id}
                          className="w-full group"
                      >
                          {editingClassId === cls.id ? (
                              <div className="flex items-center gap-1 animate-in zoom-in-95 w-full sub-class-input-zone">
                                  <input 
                                      autoFocus
                                      type="text" 
                                      maxLength={3}
                                      value={editingValue}
                                      onChange={e => setEditingValue(e.target.value)}
                                      onKeyDown={e => {
                                          if (e.key === 'Enter') handleUpdateSubClass(cls);
                                          if (e.key === 'Escape') setEditingClassId(null);
                                      }}
                                      className="w-full px-4 py-3 text-sm font-black border-2 border-primary-500 rounded-xl outline-none uppercase bg-white text-primary-600 shadow-lg shadow-primary-100"
                                  />
                                  <button 
                                    onClick={() => handleUpdateSubClass(cls)}
                                    className="p-3 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700 shrink-0 transition-transform active:scale-95"
                                  >
                                    <Save className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingClassId(null)}
                                    className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 shrink-0"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                              </div>
                          ) : (
                              <div 
                                  onClick={() => viewStudents(cls)}
                                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${selectedClassIds.includes(cls.id) ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-primary-400 hover:bg-white text-slate-700'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      <span className="text-sm font-black tracking-widest">{cls.name.replace(gradeNum, '') || cls.name}</span>
                                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-black ${selectedClassIds.includes(cls.id) ? 'bg-primary-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                          {cls.student_count || 0} Santri
                                      </div>
                                  </div>
                                  
                                  {!isReadOnly && (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setAddingSubTo(null);
                                                setEditingClassId(cls.id); 
                                                setEditingValue(cls.name.replace(gradeNum, ''));
                                            }} 
                                            className={`p-1.5 rounded-lg hover:bg-black/10 sub-class-input-zone ${selectedClassIds.includes(cls.id) ? 'text-white' : 'text-slate-400'}`}
                                          >
                                              <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDelete(cls); }} className={`p-1.5 rounded-lg hover:bg-red-500 hover:text-white ${selectedClassIds.includes(cls.id) ? 'text-white' : 'text-slate-400'}`}>
                                              <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                          <div onClick={(e) => { e.stopPropagation(); toggleClassSelection(cls.id); }} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selectedClassIds.includes(cls.id) ? 'bg-white text-primary-600 border-white scale-110 shadow-sm' : 'bg-white border-slate-200 text-primary-600 hover:border-primary-400'}`}>
                                              {selectedClassIds.includes(cls.id) && <Check className="w-3.5 h-3.5" />}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  ))}

                  {/* Inline Add Sub-Class (Full Width) */}
                  {!isReadOnly && (
                    addingSubTo === groupKey ? (
                        <div className="flex items-center gap-1 animate-in slide-in-from-top-2 w-full mt-1 sub-class-input-zone">
                            <input 
                                autoFocus
                                type="text" 
                                maxLength={3}
                                placeholder="Ketik Huruf (misal: B)..."
                                value={newSubChar}
                                onChange={e => setNewSubChar(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddSubClass(gradeNum);
                                    if (e.key === 'Escape') setAddingSubTo(null);
                                }}
                                className="w-full px-4 py-3 text-sm font-bold border-2 border-primary-500 rounded-xl outline-none uppercase bg-white shadow-inner"
                            />
                            <button 
                              onClick={() => handleAddSubClass(gradeNum)}
                              className="p-3 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700 shrink-0 transition-transform active:scale-95"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => { setAddingSubTo(null); setNewSubChar(''); }}
                              className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 shrink-0"
                            >
                              <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              setEditingClassId(null);
                              setAddingSubTo(groupKey);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-all group mt-1 sub-class-input-zone"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Tambah Sub Kelas</span>
                        </button>
                    )
                  )}
              </div>

              {/* Card Footer Insights */}
              <div className="px-5 py-3 bg-slate-50/30 border-t border-slate-100 mt-auto flex justify-between items-center">
                  <div className="flex -space-x-2">
                       {[0, 1, 2].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 overflow-hidden">
                               <Users className="w-3 h-3" />
                           </div>
                       ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      Detail Kelas <ChevronRight className="w-3 h-3" />
                  </span>
              </div>
            </div>
          );
        })}

        {classes.length === 0 && !loading && (
            <div className="col-span-full text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
                <School className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <h3 className="text-slate-600 font-bold mb-1">Belum Ada Data Kelas</h3>
                <p className="text-sm text-slate-400">Klik tombol "Tambah Kelas" untuk memulai struktur organisasi kelas.</p>
            </div>
        )}
      </div>}

      {/* Alumni Full-Page View */}
      {showAlumniView && (
        <div className="animate-in slide-in-from-top-4 duration-300 bg-white rounded-lg border border-amber-100 shadow-lg shadow-amber-50 overflow-hidden">
          {/* Alumni Header */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAlumniView(false)}
                className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-all active:scale-95"
                title="Kembali ke Manajemen Kelas"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <GraduationCap className="w-4 h-4 text-white/80" />
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Data Santri Alumni</h3>
                <p className="text-[8px] font-bold text-white/60 uppercase tracking-[0.15em] mt-0.5">
                  {alumniList.length} Alumni Terdaftar
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-2.5 border-b border-amber-100 flex flex-col sm:flex-row gap-2 bg-amber-50/30">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIS alumni..."
                value={alumniSearch}
                onChange={e => setAlumniSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[11px] font-bold bg-white border border-amber-100 rounded-xl outline-none focus:border-amber-400 transition-all"
              />
            </div>
            <select
              value={alumniSortYear}
              onChange={e => setAlumniSortYear(e.target.value)}
              className="px-3 py-2 text-[11px] font-bold bg-white border border-amber-100 rounded-xl outline-none focus:border-amber-400 transition-all text-slate-700"
            >
              <option value="all">Semua Angkatan</option>
              {[...new Set(alumniList.map(a => a.graduated_year).filter(Boolean))].sort((a,b)=>b-a).map(yr => (
                <option key={yr} value={yr.toString()}>Angkatan {yr}</option>
              ))}
            </select>
          </div>

          {/* Alumni Table */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-[#FCFDFE] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 w-[50px]">NO</th>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-left border-b-2 border-r-2 border-slate-100">NAMA SANTRI</th>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 w-24">NIS</th>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 w-20">JK</th>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 w-24">KELAS AKHIR</th>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-r-2 border-slate-100 w-28">TGL LULUS</th>
                  <th className="px-4 py-4 text-[9.5px] font-black text-slate-500 uppercase tracking-widest text-center border-b-2 border-slate-100 w-24">ANGKATAN</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(() => {
                  const filtered = alumniList
                    .filter(a => {
                      const matchSearch = alumniSearch === '' ||
                        a.full_name?.toLowerCase().includes(alumniSearch.toLowerCase()) ||
                        a.nis?.toLowerCase().includes(alumniSearch.toLowerCase());
                      const matchYear = alumniSortYear === 'all' || String(a.graduated_year) === alumniSortYear;
                      return matchSearch && matchYear;
                    })
                    .sort((a, b) => new Date(b.graduated_at || 0).getTime() - new Date(a.graduated_at || 0).getTime());

                  const totalPages = Math.max(1, Math.ceil(filtered.length / ALUMNI_PER_PAGE));
                  const safePage = Math.min(alumniPage, totalPages);
                  const paginated = filtered.slice((safePage - 1) * ALUMNI_PER_PAGE, safePage * ALUMNI_PER_PAGE);

                  if (filtered.length === 0) return (
                    <tr>
                      <td colSpan={7} className="py-24 text-center border-b border-slate-100">
                        <div className="opacity-20">
                            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {alumniList.length === 0 ? 'Belum ada data alumni' : 'Tidak ditemukan'}
                            </p>
                        </div>
                      </td>
                    </tr>
                  );

                  return paginated.map((alumni, idx) => (
                    <tr key={alumni.id + idx} className="group transition-colors hover:bg-slate-50/30">
                      <td className="px-4 py-4 text-[10.5px] font-black text-slate-400 text-center border-r-2 border-b border-slate-100 uppercase tracking-tighter">
                          {String((safePage - 1) * ALUMNI_PER_PAGE + idx + 1).padStart(2,'0')}
                      </td>
                      <td className="px-4 py-4 border-r-2 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                            <span className="text-[11px] font-black text-slate-400 group-hover:text-amber-600 transition-colors">
                              {alumni.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-800 leading-tight capitalize tracking-tight">{alumni.full_name}</p>
                            <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">ID: {alumni.id?.slice(-6) || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100">
                        <span className="text-[10.5px] font-mono font-black text-slate-600 bg-slate-50 px-2.5 py-1 rounded tracking-tight">{alumni.nis || '-'}</span>
                      </td>
                      <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100">
                        <span className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-tight border ${
                          alumni.gender === 'L' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                        }`}>
                          {alumni.gender === 'L' ? 'Putra' : alumni.gender === 'P' ? 'Putri' : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100">
                        <span className="px-3 py-1 bg-amber-50/50 text-amber-700 rounded-lg text-[10px] font-black border border-amber-100/50">
                          {alumni.last_class || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center border-r-2 border-b border-slate-100">
                        <span className="text-[10.5px] font-bold text-slate-500">
                          {alumni.graduated_at ? new Date(alumni.graduated_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center border-b border-slate-100">
                        <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10.5px] font-black border border-slate-100 shadow-sm">
                          {alumni.graduated_year || '-'}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(() => {
            const filtered = alumniList.filter(a => {
              const matchSearch = alumniSearch === '' ||
                a.full_name?.toLowerCase().includes(alumniSearch.toLowerCase()) ||
                a.nis?.toLowerCase().includes(alumniSearch.toLowerCase());
              const matchYear = alumniSortYear === 'all' || String(a.graduated_year) === alumniSortYear;
              return matchSearch && matchYear;
            });
            const totalPages = Math.max(1, Math.ceil(filtered.length / ALUMNI_PER_PAGE));
            const safePage = Math.min(alumniPage, totalPages);
            const startItem = filtered.length === 0 ? 0 : (safePage - 1) * ALUMNI_PER_PAGE + 1;
            const endItem = Math.min(safePage * ALUMNI_PER_PAGE, filtered.length);

            if (filtered.length <= ALUMNI_PER_PAGE) return null;

            return (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Menampilkan <span className="text-slate-600 font-black">{startItem}–{endItem}</span> dari <span className="text-slate-600 font-black">{filtered.length}</span> alumni
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAlumniPage(1)}
                    disabled={safePage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black border transition-all disabled:opacity-30 disabled:cursor-not-allowed border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600 active:scale-95"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setAlumniPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600 active:scale-95"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[9px] text-slate-300 font-bold">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setAlumniPage(p as number)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black border transition-all active:scale-95 ${
                            safePage === p
                              ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )
                  }

                  <button
                    onClick={() => setAlumniPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600 active:scale-95"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAlumniPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[9px] font-black border transition-all disabled:opacity-30 disabled:cursor-not-allowed border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-600 active:scale-95"
                  >
                    »
                  </button>
                </div>
              </div>
            );
          })()}
          {alumniList.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Medal className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Alumni</p>
                  <p className="text-sm font-black text-slate-800">{alumniList.length} Santri</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Angkatan</p>
                  <p className="text-sm font-black text-slate-800">
                    {new Set(alumniList.map(a => a.graduated_year).filter(Boolean)).size} Angkatan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Putra / Putri</p>
                  <p className="text-sm font-black text-slate-800">
                    {alumniList.filter(a => a.gender === 'L').length} / {alumniList.filter(a => a.gender === 'P').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ClassFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={isEditMode ? selectedClass : null}
      />

      {/* Roster Modal */}
      {isStudentsModalOpen && selectedClass && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-white/20 relative">
                  {/* Close Button UI */}
                  <button 
                    onClick={() => setIsStudentsModalOpen(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-20"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary-600" />
                            Daftar Santri {selectedClass.name}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Total {allStudents.filter(s => s.class_id === selectedClass.id).length} Santri Berada Di Kelas Ini
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isReadOnly && allStudents.filter(s => s.class_id === selectedClass.id).length > 0 && (
                            <button 
                                onClick={() => toggleSelectAll(allStudents.filter(s => s.class_id === selectedClass.id))}
                                className="text-[9px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-all active:scale-95"
                            >
                                {selectedStudentIds.length === allStudents.filter(s => s.class_id === selectedClass.id).length ? 'Lepas Semua' : 'Pilih Semua'}
                            </button>
                        )}
                        <button onClick={() => setIsStudentsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 invisible">
                            <X className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                  
                  {/* Search/Filter placeholder (Optional, but keeps high density) */}
                  <div className="px-5 py-3 bg-slate-50/30 border-b border-slate-50">
                      <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Cari nama santri di kelas ini..." 
                            className="w-full bg-white border border-slate-100 rounded-xl px-9 py-2 text-[11px] font-bold text-slate-600 outline-none focus:border-primary-400 transition-all"
                            onChange={(e) => {/* Add local filter if needed */}}
                          />
                          <Users className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                  </div>

                  {/* Student List Content */}
                  <div className="p-4 overflow-y-auto flex-1 scrollbar-hide space-y-2">
                      {allStudents.filter(s => s.class_id === selectedClass.id).map((student, idx) => (
                          <div 
                            key={student.id} 
                            onClick={() => !isReadOnly && toggleStudentSelection(student.id)}
                            className={`flex items-center justify-between p-3.5 rounded-[20px] border transition-all select-none ${!isReadOnly ? 'cursor-pointer' : 'cursor-default'} group ${selectedStudentIds.includes(student.id) ? 'border-primary-200 bg-primary-50/30 shadow-sm' : 'border-slate-100/50 bg-[#FBFDFE] hover:bg-white hover:shadow-md hover:border-slate-200'}`}
                          >
                              <div className="flex items-center gap-3.5">
                                  {!isReadOnly && (
                                     <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudentIds.includes(student.id) ? 'bg-primary-600 border-primary-600 text-white shadow-sm scale-110' : 'border-slate-200 bg-white group-hover:border-primary-400'}`}>
                                         {selectedStudentIds.includes(student.id) && <Check className="w-3.5 h-3.5" />}
                                     </div>
                                  )}
                                  <div>
                                      <p className="text-[11px] font-black text-slate-800 capitalize leading-tight mb-0.5">{student.full_name}</p>
                                      <div className="flex items-center gap-2">
                                          <p className="text-[8px] text-slate-400 font-black tracking-[0.1em]">{student.nis || 'TANPA NIS'}</p>
                                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                          <div className={`text-[8px] font-black uppercase tracking-widest ${student.gender === 'L' ? 'text-indigo-400' : 'text-pink-400'}`}>
                                              {student.gender === 'L' ? 'Putra' : 'Putri'}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {allStudents.filter(s => s.class_id === selectedClass.id).length === 0 && (
                          <div className="text-center py-16">
                              <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                  <GraduationCap className="w-8 h-8 text-slate-200" />
                              </div>
                              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Kosong</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Belum ada santri di kelas ini.</p>
                          </div>
                      )}
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-5 bg-[#FCFDFE] border-t border-slate-100">
                      {selectedStudentIds.length > 0 && !isReadOnly ? (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-[20px]">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                            {selectedStudentIds.length}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Santri Terpilih</span>
                                    </div>
                                    <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <select 
                                    className="w-full text-[10px] font-black text-slate-700 bg-white border-2 border-slate-100 rounded-xl px-3 py-2.5 focus:border-primary-400 outline-none transition-all shadow-sm"
                                    value={targetClassId}
                                    onChange={(e) => setTargetClassId(e.target.value)}
                                >
                                    <option value="">Pilih Kelas Tujuan...</option>
                                    {classes.filter(c => c.id !== selectedClass.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleMoveStudents}
                                disabled={!targetClassId}
                                className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 ${targetClassId ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                            >
                                <ArrowRight className="w-4 h-4" />
                                Pindahkan Sekarang
                            </button>
                        </div>
                      ) : (
                        <button 
                            onClick={() => setIsStudentsModalOpen(false)}
                            className="w-full py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 shadow-sm"
                        >
                            Tutup Panel
                        </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Promotion Confirmation Modal */}
      {showPromoteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center lg:pl-64 lg:pt-20 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[28px] shadow-2xl max-w-sm w-full overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-200">
                  
                  {/* Header */}
                  <div className="px-5 py-3.5 border-b border-slate-50 flex justify-between items-center bg-[#FCFDFE]">
                      <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                              <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                              <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none">Siklus Kenaikan Kelas</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                  {selectedClassIds.length} Kelas Dipilih
                              </p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setShowPromoteModal(false)}
                        className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4">
                      {/* Rules */}
                      <div className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Aturan Proses</p>
                          <div className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-[14px] border border-emerald-100">
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 rounded-md px-1.5 py-0.5 shrink-0 mt-0.5">01</span>
                              <p className="text-[10px] font-bold text-emerald-800 leading-snug">
                                  <span className="font-black">Naik Tingkat:</span> Angka nama kelas bertambah <span className="font-black text-slate-800">+1</span>
                              </p>
                          </div>
                          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-[14px] border border-amber-100">
                              <span className="text-[9px] font-black text-amber-600 bg-amber-100 rounded-md px-1.5 py-0.5 shrink-0 mt-0.5">02</span>
                              <p className="text-[10px] font-bold text-amber-800 leading-snug">
                                  <span className="font-black">Kelulusan:</span> Jika mencapai Kelas <span className="font-black text-slate-800">{systemConfig.max}</span>, kelas dihapus dan terlahir kembali sebagai Kelas <span className="font-black text-indigo-600">{systemConfig.min}</span>
                              </p>
                          </div>
                      </div>

                      {/* Warning */}
                      <div className="bg-amber-50 border border-amber-100 rounded-[14px] p-3 flex gap-2.5 items-start">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-amber-700 leading-snug">
                              <span className="font-black">Peringatan:</span> Proses "Kelulusan" akan <span className="font-black">MENGHAPUS</span> card kelas. Pastikan data santri kelas {systemConfig.max} sudah diproses.
                          </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2.5 pt-1">
                          <button 
                            onClick={() => setShowPromoteModal(false)}
                            className="flex-1 py-2.5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-2 border-slate-100 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-[0.98]"
                          >
                              Batal
                          </button>
                          <button 
                            onClick={handleBulkPromote}
                            className="flex-[2] py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.15em] bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 border-2 border-orange-500 transition-all active:scale-[0.98]"
                          >
                              Proses Sekarang
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        centerOnScreen={false}
        title="Hapus Kelas?"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        confirmLabel="YA, HAPUS"
        message={
            <span>
                Hapus <span className="font-bold text-slate-800">{deleteTarget?.name}</span>? 
                {deleteTarget && allStudents.filter(s => s.class_id === deleteTarget.id).length > 0 && (
                    <span className="text-red-600 font-bold mt-2 block text-[10px]">Peringatan: Ada {allStudents.filter(s => s.class_id === deleteTarget.id).length} santri di kelas ini!</span>
                )}
            </span>
        }
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        centerOnScreen={false}
        title="Hapus Massal?"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        confirmLabel="YA, HAPUS SEMUA"
        message={
            <span>
                Hapus <span className="font-bold text-slate-800">{selectedClassIds.length} kelas</span> dipilih?
                {allStudents.filter(s => s.class_id && selectedClassIds.includes(s.class_id)).length > 0 && (
                    <span className="text-red-600 font-bold mt-2 block text-[10px]">Peringatan: Ada total {allStudents.filter(s => s.class_id && selectedClassIds.includes(s.class_id)).length} santri!</span>
                )}
            </span>
        }
      />

      <ConfirmModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onConfirm={handleGenerateStructure}
        centerOnScreen={true}
        title="Sinkronkan Struktur?"
        icon={<Wand2 className="w-8 h-8" />}
        variant="primary"
        confirmLabel="SINKRONKAN SEKARANG"
        message={
            <div className="text-left space-y-3">
                <p>Sistem akan menyesuaikan rentang <strong>{systemConfig.min} - {systemConfig.max}</strong>:</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>Dibuat otomatis: {systemConfig.min}A s/d {systemConfig.max}A.</li>
                    <li><span className="text-red-600 font-bold">Hapus otomatis</span> kelas di luar rentang.</li>
                </ul>
            </div>
        }
      />
    </div>
  );
};
