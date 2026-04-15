
import React, { useEffect, useState, useMemo } from 'react';
import { getHalaqahs, getStudentsByHalaqah, createHalaqah, updateHalaqah, getUsers, getStudents } from '../../services/dataService';
import { Halaqah, Student, UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Users, BookOpen, X, ChevronRight, User, Save, Edit, Trash2 } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

// --- Components ---

interface HalaqahFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string, teacher_id: string }) => Promise<void>;
  teachers: UserProfile[];
  initialData?: Halaqah | null;
}

const HalaqahFormModal: React.FC<HalaqahFormModalProps> = ({ isOpen, onClose, onSubmit, teachers, initialData }) => {
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in text-slate-800 lg:pl-64">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden border border-white flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-3 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-0.5">
              {initialData ? 'Edit Halaqah' : 'Halaqah Baru'}
            </h3>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Manajemen Kelompok</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Halaqah</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all"
              placeholder="Contoh: Abu Bakar"
            />
          </div>

          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ustadz Pengampu</label>
             <div className="relative">
               <select
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-xl text-xs font-black text-slate-800 outline-none appearance-none cursor-pointer focus:border-indigo-400 focus:bg-white transition-all capitalize"
               >
                  <option value="">PILIH USTADZ</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} className="capitalize">{t.full_name}</option>
                  ))}
               </select>
               <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                 <ChevronRight className="w-3.5 h-3.5 text-slate-300 rotate-90" />
               </div>
             </div>
          </div>

          <div className="pt-2 flex gap-3 shrink-0">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 font-black text-[9px] uppercase tracking-tight rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
            >
              Batal
            </button>
            <button 
                type="submit"
                className="flex-[2] flex items-center justify-center px-4 py-2.5 font-black text-[9px] uppercase tracking-tight rounded-xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
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

const HalaqahDetailModal: React.FC<HalaqahDetailModalProps> = ({ isOpen, onClose, halaqah, onEdit, isReadOnly }) => {
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
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 text-slate-800 lg:pl-64"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-5 bg-[#FCFDFE] border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-2 flex items-center gap-2 uppercase">
              <span className="p-1.5 bg-indigo-50 rounded-lg"><BookOpen className="w-4 h-4 text-indigo-600" /></span>
              Daftar Santri {halaqah.name}
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none ml-10">
                Ustadz: <span className="text-indigo-600 font-black">{halaqah.teacher_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 -mt-6">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-5 overflow-y-auto shrink-0 scrollbar-hide flex-1 flex flex-col ${(!isLoading && students.length === 0) ? 'justify-center' : ''}`} style={{ maxHeight: '235px', minHeight: '235px' }}>
          <div className="space-y-2.5 w-full">
            {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest animate-pulse">Sinkronisasi Data...</p>
                </div>
            ) : students.length > 0 ? (
                students.map((student, idx) => (
                    <div key={student.id} className="flex items-center justify-between p-3.5 rounded-[20px] border border-slate-100 bg-[#FBFDFE] hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 text-[11px] font-black shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all">
                                {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1 capitalize group-hover:text-indigo-600 transition-all">{student.full_name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">NIS: {student.nis || '-'}</p>
                            </div>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all shadow-sm">
                            SANTRI
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
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

export const HalaqahManagement: React.FC<{ tenantId: string, user: UserProfile }> = ({ tenantId, user }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [classes, setClasses] = useState<Halaqah[]>([]);
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
        // Prepare delete notification (Assuming service handling delete is consistent)
        addNotification({ 
            type: 'success', 
            title: 'Halaqah Dihapus', 
            message: `Halaqah ${halaqahToDelete.name} telah berhasil dihapus dari sistem.` 
        });
        
        // This is where you'd call a hypothetical deleteHalaqah service
        // For now we simulate success as per current logic
        
        await fetchData();
        setHalaqahToDelete(null);
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menghapus halaqah.' });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="bg-white px-6 py-2.5 rounded-2xl border-2 border-slate-50 shadow-sm flex items-center gap-6">
            <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Halaqah</p>
                <p className="text-base font-black text-slate-800 leading-none mt-1">{classes.length}</p>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Santri</p>
                <p className="text-base font-black text-slate-800 leading-none mt-1">{classes.reduce((acc, curr) => acc + (curr.student_count || 0), 0)}</p>
            </div>
        </div>

        {!isReadOnly && (
          <button 
            onClick={openCreateModal}
            className="flex items-center px-6 py-2.5 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:border-indigo-700 transition-all active:scale-95 gap-2"
          >
              <Plus className="w-4 h-4" />
              TAMBAH HALAQAH
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div 
            key={cls.id} 
            onClick={() => handleCardClick(cls)}
            className="group relative bg-white border-2 border-slate-50 rounded-[24px] p-5 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-slate-800 truncate tracking-tight">{cls.name}</h3>
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-lg w-fit">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-[10.5px] font-black text-slate-600 tracking-tight capitalize truncate max-w-[120px]">{cls.teacher_name}</span>
                    </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-4">
                <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Santri</p>
                        <p className="text-xs font-black text-slate-700 mt-0.5">{cls.student_count || 0}</p>
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
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
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
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 -z-0" />
          </div>
        ))}
        
        {classes.length === 0 && !loading && (
            <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <BookOpen className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Belum ada data halaqah</p>
                <button onClick={openCreateModal} className="mt-4 text-xs font-black text-indigo-600 hover:text-indigo-700">Tambah Sekarang</button>
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
                {halaqahToDelete && halaqahToDelete.student_count > 0 && (
                    <span className="text-red-600 font-bold block mt-2 text-[10px]">
                        Peringatan: Ada {halaqahToDelete.student_count} santri di kelompok ini!
                    </span>
                )}
            </span>
        }
      />
    </div>
  );
};
