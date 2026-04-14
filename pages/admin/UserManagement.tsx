import React, { useEffect, useState, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/dataService';
import { UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Mail, Trash2, Edit, X, Save, AlertTriangle, ChevronDown, Phone, Search, Lock, ChevronRight } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

// --- Components ---


interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: any) => Promise<void>; // Changed to any to accept password field
  initialData?: UserProfile | null;
  tenantId: string;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, tenantId }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: UserRole.TEACHER,
    password: '',
    whatsapp_number: ''
  });

  // Sync state when opening for Edit vs Create
  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name,
        email: initialData.email,
        role: initialData.role,
        password: '', // Keep empty for edit
        whatsapp_number: initialData.whatsapp_number || ''
      });
    } else {
      setFormData({ full_name: '', email: '', role: UserRole.TEACHER, password: '', whatsapp_number: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct payload
    const payload: any = { 
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        tenant_id: tenantId,
        whatsapp_number: formData.whatsapp_number
    };

    if (initialData) {
        // Update
        payload.id = initialData.id;
        // Note: Password update is skipped in Edit mode for this implementation
    } else {
        // Create
        payload.password = formData.password;
    }
    
    await onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center lg:pl-64 lg:pt-20 lg:pb-20 p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-white flex flex-col max-h-[80vh]">
        <div className="px-6 py-3 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-0.5">{initialData ? 'Edit Profil' : 'Tambah Pengguna'}</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Manajemen Akses</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
            <input 
                required
                type="text" 
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-xl focus:ring-0 focus:border-indigo-400 focus:bg-white transition-all text-xs font-bold text-slate-800 outline-none placeholder:text-slate-300"
                placeholder="Contoh: Ustadz Abdullah"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 border-2 border-slate-100 rounded-xl focus:ring-0 transition-all text-xs font-bold outline-none placeholder:text-slate-300 ${initialData ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-transparent' : 'bg-slate-50/30 focus:border-indigo-400 focus:bg-white text-slate-800'}`}
                        placeholder="email@sekolah.com"
                        disabled={!!initialData}
                    />
                </div>
            </div>
            
            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input 
                    type="tel" 
                    value={formData.whatsapp_number}
                    onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border-2 border-slate-100 bg-slate-50/30 rounded-xl focus:ring-0 focus:border-indigo-400 focus:bg-white transition-all text-xs font-bold text-slate-800 outline-none placeholder:text-slate-300"
                    placeholder="08123"
                    />
                </div>
            </div>
          </div>



          {!initialData && (
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Sementara</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                    required
                    type="text" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 bg-slate-50/30 rounded-xl focus:ring-0 focus:border-indigo-400 focus:bg-white transition-all text-xs font-bold text-slate-800 outline-none font-mono placeholder:text-slate-300"
                    placeholder="Min 6 Karakter"
                    />
                </div>
            </div>
          )}

          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role / Hak Akses</label>
             <div className="relative">
                <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full pl-4 pr-10 py-2.5 border-2 border-slate-100 bg-slate-50/30 rounded-xl focus:ring-0 focus:border-indigo-400 focus:bg-white text-xs font-black text-slate-800 appearance-none cursor-pointer transition-all outline-none"
                >
                    <option value={UserRole.TEACHER}>USTADZ / GURU</option>
                    <option value={UserRole.ADMIN}>ADMIN SEKOLAH</option>
                    <option value={UserRole.SUPERVISOR}>SUPERVISOR</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
             </div>
          </div>

          <div className="pt-2 flex gap-3 shrink-0">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 font-black text-[10px] uppercase tracking-tight rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
            >
              Batal
            </button>
            <button 
                type="submit"
                className="flex-[2] flex items-center justify-center px-4 py-2.5 font-black text-[10px] uppercase tracking-tight rounded-xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 mr-2" />
              {initialData ? 'SIMPAN' : 'BUAT USER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export const UserManagement: React.FC<{ tenantId: string; user: UserProfile }> = ({ tenantId, user }) => {
    const isReadOnly = user.role === UserRole.SUPERVISOR;
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { setLoading: setGlobalLoading } = useLoading();
    const { addNotification } = useNotification();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersData = await getUsers(tenantId);
            setUsers(usersData.filter(u => 
                u.role === UserRole.ADMIN || 
                u.role === UserRole.TEACHER ||
                u.role === UserRole.SUPERVISOR
            ));
        } catch (error) {
            console.error("Error fetching user data:", error);
            addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memuat data pengguna.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId]);
    
    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    // Reset current page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const handleCreateOrUpdate = async (userData: any) => {
        setGlobalLoading(true);
        try {
            if (selectedUser) {
                await updateUser(userData, user);
                addNotification({ type: 'success', title: 'Berhasil', message: `Data user ${userData.full_name} telah diperbarui.` });
            } else {
                await createUser(userData, user);
                addNotification({ type: 'success', title: 'Berhasil', message: `User baru ${userData.full_name} telah dibuat.` });
            }
            await fetchData();
        } catch (error: any) {
            let msg = error.message || "Gagal menyimpan data.";
            if (msg.includes('duplicate key value violates unique constraint "profiles_email_key"')) {
                msg = "Email ini sudah terdaftar. Gunakan email lain.";
            }
            addNotification({ type: 'error', title: 'Gagal', message: msg });
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setGlobalLoading(true);
        try {
            await deleteUser(userToDelete.id, userToDelete.full_name, user);
            addNotification({ type: 'success', title: 'Berhasil', message: `User ${userToDelete.full_name} telah dihapus.` });
            await fetchData();
        } catch (error) {
            addNotification({ type: 'error', title: 'Gagal', message: `Tidak dapat menghapus user ${userToDelete.full_name}.` });
        } finally {
            setGlobalLoading(false);
        }
    };

    const openEditModal = (userToEdit: UserProfile) => {
        setSelectedUser(userToEdit);
        setIsFormOpen(true);
    };

    const openCreateModal = () => {
        setSelectedUser(null);
        setIsFormOpen(true);
    };
    
    const getRoleBadge = (role: UserRole) => {
        switch(role) {
            case UserRole.ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
            case UserRole.TEACHER: return 'bg-green-100 text-green-700 border-green-200';
            case UserRole.SANTRI: return 'bg-blue-100 text-blue-700 border-blue-200';
            case UserRole.SUPERVISOR: return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Cari nama atau email..." 
                        className="w-full pl-11 pr-4 py-2.5 text-xs font-black border border-slate-200 rounded-full focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 transition-all placeholder:font-bold placeholder:text-slate-400"
                    />
                </div>
                {!isReadOnly && (
                    <button 
                        onClick={openCreateModal}
                        className="flex items-center px-4 py-2 font-black text-xs rounded-xl border-2 border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 hover:border-primary-700 transition-all active:scale-95 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        TAMBAH USER
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-slate-50 overflow-x-auto flex flex-col">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60 w-16">No</th>
                            <th className="px-4 py-3 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60">Nama Lengkap</th>
                            <th className="px-4 py-3 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60 w-32">Role</th>
                            <th className="px-4 py-3 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60">Email</th>
                            <th className="px-4 py-3 text-left text-[10.5px] font-black text-slate-500 uppercase tracking-tight border-r border-slate-200/60 w-44">WhatsApp</th>
                            {!isReadOnly && <th className="px-4 py-3 text-center text-[10.5px] font-black text-slate-500 uppercase tracking-tight w-24">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td className="px-4 py-2.5 border-r border-slate-100/50"><Skeleton className="h-4 w-4 mx-auto" /></td>
                                    <td className="px-4 py-2.5 border-r border-slate-100/50"><Skeleton className="h-4 w-32" /></td>
                                    <td className="px-4 py-2.5 border-r border-slate-100/50"><Skeleton className="h-6 w-20" /></td>
                                    <td className="px-4 py-2.5 border-r border-slate-100/50"><Skeleton className="h-4 w-40" /></td>
                                    <td className="px-4 py-2.5 border-r border-slate-100/50"><Skeleton className="h-4 w-32" /></td>
                                    {!isReadOnly && <td className="px-4 py-2.5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>}
                                </tr>
                            ))
                        ) : paginatedData.map((u, idx) => (
                             <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-2.5 whitespace-nowrap text-[10.5px] font-black text-slate-300 border-r border-slate-100/50">
                                    {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0')}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap border-r border-slate-100/50">
                                    <p className="text-[10.5px] font-black text-slate-800 capitalize tracking-tight">{u.full_name}</p>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[10.5px] border-r border-slate-100/50">
                                    <span className={`px-2 py-0.5 inline-flex text-[9px] font-black uppercase tracking-tight rounded-md border ${getRoleBadge(u.role)}`}>
                                        {u.role === UserRole.TEACHER && 'Ustadz'}
                                        {u.role === UserRole.ADMIN && 'Admin'}
                                        {u.role === UserRole.SANTRI && 'Santri'}
                                        {u.role === UserRole.SUPERVISOR && 'Supervisor'}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[10.5px] text-slate-500 border-r border-slate-100/50">
                                    <span className="font-bold text-[10.5px] tracking-tight">{u.email}</span>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[10.5px] text-slate-500 border-r border-slate-100/50">
                                    {u.whatsapp_number ? (
                                        <span className="font-bold text-[10.5px] tracking-tight">{u.whatsapp_number}</span>
                                    ) : (
                                        <span className="text-slate-300 font-black text-[9px] uppercase">N/A</span>
                                    )}
                                </td>
                                {!isReadOnly && (
                                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(u)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setUserToDelete(u)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* PAGINATION CONTROLS */}
                {!loading && filteredUsers.length > 0 && (
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
                            <div className="w-px h-6 bg-slate-200 hidden md:block" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                <span className="text-slate-500">{(currentPage - 1) * itemsPerPage + 1}</span>-
                                <span className="text-slate-500">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> Dari 
                                <span className="text-primary-600 ml-1">{filteredUsers.length}</span>
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

                {filteredUsers.length === 0 && !loading && (
                     <div className="p-16 text-center bg-white">
                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border-2 border-slate-50/50">
                            <Search className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Data Tidak Ditemukan</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
                     </div>
                )}
            </div>

            <UserFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSubmit={handleCreateOrUpdate}
                initialData={selectedUser}
                tenantId={tenantId}
            />

            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDelete}
                title="Hapus Pengguna?"
                confirmLabel="YA, HAPUS USER"
                variant="danger"
                message={
                    <span>
                        Hapus akun <strong>{userToDelete?.full_name}</strong>? 
                        <span className="text-red-600 font-bold block mt-2 text-[10px]">Seluruh akses pengguna akan dicabut secara permanen.</span>
                    </span>
                }
            />
        </div>
    );
};
