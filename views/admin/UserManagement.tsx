import React, { useEffect, useState, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser, forceResetPassword } from '../../services/dataService';
import { UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { UserPlus, User, Mail, Trash2, Edit, X, Save, AlertTriangle, RefreshCw, Phone, Search, Lock, ChevronRight, ChevronDown, Shield } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

// --- Components ---


interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: any) => Promise<void>; // Changed to any to accept password field
  onResetPassword?: (userId: string, targetPass: string) => Promise<void>; 
  initialData?: UserProfile | null;
  tenantId: string;
  existingUsers: UserProfile[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, onResetPassword, initialData, tenantId, existingUsers }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '' as any,
    password: '',
    whatsapp_number: '',
    nip: '',
    nik: ''
  });
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Sync state when opening for Edit vs Create
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          full_name: initialData.full_name,
          email: initialData.email,
          role: initialData.role,
          password: '',
          whatsapp_number: initialData.whatsapp_number || '',
          nip: initialData.nip || '',
          nik: initialData.nik || ''
        });
      } else {
        // Explicitly reset all fields saat modal Tambah dibuka
        setFormData({ full_name: '', email: '', role: '' as any, password: '', whatsapp_number: '', nip: '', nik: '' });
      }
      setEmailError('');
    }
  }, [isOpen, initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) return;
    
    // Construct payload
    const payload: any = { 
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        tenant_id: tenantId,
        whatsapp_number: formData.whatsapp_number,
        nip: formData.nip,
        nik: formData.nik
    };

    if (initialData) {
        // Update
        payload.id = initialData.id;
    } else {
        // Create
        // Use NIP as default password if role is teacher or supervisor
        const isStaff = formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR;
        payload.password = (isStaff && formData.nip) ? formData.nip : formData.password;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceReset = async () => {
    if (!initialData || !onResetPassword) return;
    setShowResetConfirm(true);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center lg:pl-64 p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in pt-16">
      <div className="bg-white rounded-xl shadow-none w-full max-w-md overflow-hidden border-2 border-slate-300 flex flex-col max-h-[75vh]">
        <div className="px-5 py-2.5 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5">{initialData ? 'Edit Profil' : 'Tambah Pengguna'}</h3>
            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Manajemen Akses</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-2.5 overflow-y-auto scrollbar-hide" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="group/field">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">Nama Lengkap</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                        <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[13px] focus:border-jade-400 outline-none transition-all placeholder:text-slate-300" placeholder="Nama lengkap..." />
                    </div>
                </div>
                <div className="group/field">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                        <input type="tel" value={formData.whatsapp_number} onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[13px] focus:border-jade-400 outline-none transition-all placeholder:text-slate-300" placeholder="0895..." />
                    </div>
                </div>
            </div>

          <div className="group/field">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                    <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={e => {
                            const newEmail = e.target.value;
                            setFormData({...formData, email: newEmail});
                            if (!initialData) {
                                const exists = existingUsers.some(u => u.email.toLowerCase() === newEmail.toLowerCase());
                                if (exists) setEmailError('Email sudah terdaftar. Gunakan email lain.');
                                else setEmailError('');
                            }
                        }}
                        autoComplete="off"
                        className={`w-full pl-9 pr-4 py-2 border-2 rounded-xl font-bold text-[13px] outline-none transition-all placeholder:text-slate-300 ${initialData ? 'bg-slate-50 border-slate-300 text-slate-400 cursor-not-allowed' : emailError ? 'border-red-500 bg-red-50 focus:border-red-500 focus:bg-white text-slate-800' : 'bg-white border-slate-300 focus:border-jade-400 text-slate-800'}`}
                        placeholder="email@sekolah.com"
                        disabled={!!initialData}
                    />
                </div>
                {emailError && <p className="mt-1 ml-1 text-[8.5px] font-bold text-red-500">{emailError}</p>}
            </div>

          <div className="group/field">
             <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">Role / Hak Akses</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className={`w-full pl-9 pr-9 py-2 border-2 border-slate-300 bg-white rounded-xl focus:border-jade-400 text-[13px] font-bold outline-none transition-all appearance-none cursor-pointer ${!formData.role ? 'text-slate-300' : 'text-slate-800'}`}
                >
                    {!formData.role && <option value="" disabled hidden>Pilih hak akses...</option>}
                    <option value={UserRole.TEACHER} className="text-slate-800">Ustadz / Guru</option>
                    <option value={UserRole.ADMIN} className="text-slate-800">Admin Sekolah</option>
                    <option value={UserRole.SUPERVISOR} className="text-slate-800">Supervisor</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
             </div>
          </div>

          {(formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR) && (
            <div className="group/field animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">NIP</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                    <input 
                        required={formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR}
                        type="text" 
                        value={formData.nip} 
                        onChange={e => setFormData({ ...formData, nip: e.target.value })} 
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[13px] focus:border-jade-400 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Nomor Induk Pegawai..." 
                    />
                </div>
                <p className="mt-1 ml-1 text-[8px] font-medium text-slate-400 italic">NIP akan digunakan sebagai password default.</p>
            </div>
          )}

          {formData.role === UserRole.TEACHER && (
            <div className="group/field animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">NIK <span className="text-slate-300 normal-case font-medium">(Nomor Induk Kependudukan)</span></label>
                <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                    <input 
                        type="text"
                        maxLength={16}
                        value={formData.nik} 
                        onChange={e => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })} 
                        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[13px] focus:border-jade-400 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="16 digit NIK..." 
                    />
                </div>
            </div>
          )}

          {!initialData && (
            <div className="group/field">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-jade-600">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-jade-600" />
                    <input 
                    required={!( (formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR) && formData.nip )}
                    readOnly={(formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR)}
                    type="password" 
                    value={(formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR) ? formData.nip : formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    autoComplete="new-password"
                    className={`w-full pl-9 pr-4 py-2 border-2 border-slate-300 rounded-xl font-bold text-[13px] outline-none transition-all placeholder:text-slate-300 ${(formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR) ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-jade-400'}`}
                    placeholder={(formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR) ? "Otomatis dari NIP" : "Minimal 6 karakter"}
                    />
                </div>
            </div>
          )}

          {initialData && (
             <div className="pt-1.5 border-t border-slate-100">
                <button
                    type="button"
                    onClick={handleForceReset}
                    disabled={isResetting}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-600 border-2 border-amber-100 hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Reset Password</span>
                </button>
             </div>
          )}

          <div className="pt-2 flex gap-3 shrink-0">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-300 text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-none"
            >
              BATAL
            </button>
            <button 
                type="submit"
                disabled={!!emailError || isSubmitting}
                className={`flex-2 flex items-center justify-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 shadow-none transition-all active:scale-95 ${(emailError || isSubmitting) ? 'border-slate-300 bg-slate-300 text-white cursor-not-allowed' : 'border-jade-600 bg-jade-600 text-white hover:bg-jade-700'}`}
            >
              {isSubmitting ? (
                 <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <Save className="w-4 h-4 mr-2" />
              )}
              {initialData ? 'SIMPAN PERUBAHAN' : 'TAMBAH USER'}
            </button>
          </div>
        </form>
        
        {/* Reset Password Confirmation */}
        {initialData && onResetPassword && (
            <ConfirmModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={async () => {
                    if (!initialData) return;
                    setIsResetting(true);
                    try {
                        const isStaff = formData.role === UserRole.TEACHER || formData.role === UserRole.SUPERVISOR;
                        const targetPass = (isStaff && formData.nip) ? formData.nip : 'password123';
                        await onResetPassword(initialData.id, targetPass); 
                    } finally {
                        setIsResetting(false);
                        setShowResetConfirm(false);
                    }
                }}
                title="Reset Password?"
                variant="warning"
                icon={Lock}
                confirmLabel="YA, RESET"
                centerOnScreen={false}
                message={
                    <span>
                        Reset password akun <span className="font-bold text-slate-800">{formData.full_name}</span> ke default?
                    </span>
                }
            />
        )}
      </div>
    </div>
  );
};

// --- Main Page Component ---
export const UserManagement: React.FC<{ tenantId: string; user: UserProfile }> = ({ tenantId, user }) => {
    const isReadOnly = user.role === UserRole.SUPERVISOR;
    const canEditDelete = !isReadOnly;
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const { setLoading: setGlobalLoading } = useLoading();
    const { addNotification } = useNotification();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
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
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId]);
    
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                                 u.email.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    // Reset current page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const handleCreateOrUpdate = async (userData: any) => {
        try {
            if (selectedUser) {
                await updateUser(userData, user);
                addNotification({ type: 'success', title: 'Berhasil', message: `Data user ${userData.full_name} telah diperbarui.` });
            } else {
                await createUser(userData, user);
                addNotification({ type: 'success', title: 'Berhasil', message: `User baru ${userData.full_name} telah dibuat.` });
            }
            await fetchData(true);
        } catch (error: any) {
            console.error("User creation error:", error);
            let msg = error.message || "Gagal menyimpan data.";
            
            // Intelligent error mapping
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('duplicate key')) {
                msg = "Email sudah digunakan oleh akun lain. Gunakan email berbeda.";
            } else if (msg.toLowerCase().includes('weak password') || msg.toLowerCase().includes('at least 6 characters')) {
                msg = "Password terlalu lemah. Gunakan minimal 6 karakter.";
            } else if (msg.toLowerCase().includes('invalid email')) {
                msg = "Format email tidak valid. Pastikan penulisan benar.";
            } else if (msg.toLowerCase().includes('rate limit')) {
                msg = "Terlalu banyak mencoba. Silakan tunggu beberapa menit.";
            } else if (msg.toLowerCase().includes('database error')) {
                msg = "Terjadi gangguan pada database sekolah. Silakan hubungi pusat.";
            }
            
            addNotification({ 
                type: 'error', 
                title: 'Gagal Menyimpan', 
                message: msg 
            });
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
            {/* Unified Control Bar */}
            <div className="flex flex-col lg:flex-row w-full gap-2 bg-white shrink-0 z-40 sticky top-0">
                <div className="flex flex-row items-center gap-2 w-full lg:contents">
                    {/* 1. SEARCH BAR */}
                    <div className="relative flex-1 group h-10 min-w-0">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-jade-500 transition-colors" />
                        <input 
                            type="text" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Cari User..." 
                            className="w-full h-full pl-10 pr-4 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-500 transition-all text-[10px] font-black uppercase tracking-tight placeholder:font-black placeholder:text-slate-300 outline-none shadow-none"
                        />
                    </div>

                    {/* 2. TAMBAH USER */}
                    {!isReadOnly && (
                        <button 
                            onClick={openCreateModal}
                            className="h-10 flex items-center justify-center gap-2 px-6 font-black text-[10px] uppercase tracking-widest rounded-xl bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 shrink-0 whitespace-nowrap"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">TAMBAH USER</span>
                            <span className="lg:hidden">TAMBAH</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-row items-center gap-2 w-full lg:w-auto shrink-0">
                    {/* 3. ROLE FILTER */}
                    <div className="flex items-center gap-2 flex-1 lg:flex-none">
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-10 flex-1 lg:flex-none text-[9px] font-black uppercase tracking-widest text-slate-500 border-2 border-slate-300 px-3 pr-8 outline-none focus:ring-4 focus:ring-slate-50 bg-white cursor-pointer hover:border-jade-300 transition-all lg:min-30 rounded-xl shadow-none appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.75rem' }}
                        >
                            <option value="all">SEMUA ROLE</option>
                            <option value={UserRole.ADMIN}>ADMIN</option>
                            <option value={UserRole.TEACHER}>GURU</option>
                            <option value={UserRole.SUPERVISOR}>SUPERVISOR</option>
                        </select>
                    </div>

                    {/* 4. REFRESH */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchData()}
                            disabled={loading}
                            className="h-10 w-10 shrink-0 flex items-center justify-center border-2 border-slate-300 bg-white text-slate-400 hover:text-jade-600 hover:bg-slate-50 transition-all active:scale-95 rounded-xl shadow-none disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-b-xl border-2 border-slate-300 overflow-hidden flex flex-col shadow-none">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="min-w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-40 bg-white">
                            <tr>
                                <th className="hidden md:table-cell sticky left-0 z-60 px-2 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-l border-r border-black w-11.25 min-11.25 bg-slate-300">NO</th>
                                <th className="sticky left-0 md:left-11.25 z-60 px-4 md:px-6 py-4 text-left text-slate-800 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-black w-27.5 md:w-auto min-27.5 md:min-w-0 bg-slate-300">USER & EMAIL</th>
                                <th className="px-6 py-4 text-center text-emerald-600 font-black uppercase text-[9.5px] tracking-widest border-t border-b border-r border-emerald-600 bg-emerald-50 min-30">ROLE</th>
                                <th className="px-4 py-4 text-left text-[9.5px] font-black text-blue-600 uppercase tracking-widest border-t border-b border-r border-blue-600 bg-blue-50 w-44">WHATSAPP</th>
                                {canEditDelete && <th className="px-4 py-4 text-center text-[9.5px] font-black text-slate-800 uppercase tracking-widest border-t border-b border-r border-black bg-slate-300 w-24">AKSI</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="hidden md:table-cell sticky left-0 z-10 bg-white border-r border-b border-slate-100 w-11.25"><Skeleton className="h-4 w-4 mx-auto" /></td>
                                        <td className="sticky left-0 md:left-11.25 z-10 bg-white border-r border-b border-slate-100 w-27.5 md:w-auto"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4 border-r border-b border-slate-100"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-4 py-4 border-b border-r border-slate-100"><Skeleton className="h-4 w-24" /></td>
                                        {canEditDelete && <td className="px-4 py-4 border-b border-slate-100"><div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div></td>}
                                    </tr>
                                ))
                            ) : paginatedData.map((u, index) => (
                                <tr key={u.id} className="group transition-colors hover:bg-slate-50/30">
                                    <td className="hidden md:table-cell sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r border-b border-slate-100 z-20 uppercase transition-colors">
                                        {String((currentPage - 1) * itemsPerPage + index + 1)}
                                    </td>
                                    <td className="sticky left-0 md:left-11.25 bg-white px-3 md:px-6 py-4 border-r border-b border-slate-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="font-bold text-[10px] md:text-[11px] text-slate-800 truncate max-20 md:max-w-none" title={u.full_name}>{u.full_name}</div>
                                        <div className="font-medium text-[9px] md:text-[10px] text-slate-400 truncate max-20 md:max-w-none" title={u.email}>{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4 border-r border-b border-slate-100 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(u.role)} shadow-sm`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap border-r border-b border-slate-100">
                                        {u.whatsapp_number ? (
                                            <span className="font-black text-[10.5px] text-slate-700 tracking-tight">{u.whatsapp_number}</span>
                                        ) : (
                                            <span className="text-slate-300 font-black text-[9px] uppercase tracking-widest leading-none">-</span>
                                        )}
                                    </td>
                                    {canEditDelete && (
                                        <td className="px-4 py-4 whitespace-nowrap text-center border-b border-slate-100">
                                            {u.role !== UserRole.ADMIN ? (
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openEditModal(u)} className="p-2.5 text-slate-400 hover:text-jade-600 hover:bg-jade-50 rounded-xl border-2 border-slate-300 hover:border-jade-100 transition-all bg-white shadow-none" title="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setUserToDelete(u)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border-2 border-slate-300 hover:border-red-100 transition-all bg-white shadow-none" title="Hapus">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 font-black text-[9px] uppercase tracking-widest leading-none">-</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                            }
                        </tbody>
                    </table>
                </div>
                
                {/* PAGINATION CONTROLS */}
                {!loading && filteredUsers.length > 0 && (
                    <div className="bg-slate-50 border-t border-slate-100 px-3 md:px-6 py-3 flex flex-row justify-between items-center gap-2 rounded-b-3xl">
                        <div className="flex items-center gap-2">
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white border-2 border-slate-300 rounded-lg px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-primary-50/50 cursor-pointer shadow-none transition-all"
                            >
                                {[10, 25, 50, 100].map(val => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                            </select>
                            <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                <span className="hidden sm:inline">DATA</span> {((currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} <span className="hidden sm:inline text-slate-300">/</span> <span className="text-primary-600 ml-0.5">{filteredUsers.length}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-0.5 md:gap-1">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === 1 ? 'text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
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
                                            className={`w-7 h-7 md:w-9 md:h-9 rounded-lg text-[9px] md:text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-jade-600 text-white shadow-lg shadow-primary-100 border-2 border-jade-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-transparent'}`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className={`p-1.5 md:p-2 rounded-lg border-2 transition-all active:scale-90 ${currentPage === totalPages ? 'text-slate-400 border-slate-300 bg-slate-50/80 cursor-not-allowed opacity-50' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-none'}`}
                            >
                                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {filteredUsers.length === 0 && !loading && (
                     <div className="p-16 text-center bg-white">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Data Tidak Ditemukan</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gunakan kata kunci atau filter yang berbeda</p>
                     </div>
                )}
            </div>

            <UserFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSubmit={handleCreateOrUpdate}
                onResetPassword={async (id, pass) => {
                    await forceResetPassword(id, pass, user);
                    addNotification({ type: 'success', title: 'Reset Berhasil', message: 'Password telah dikembalikan ke NIP.' });
                }}
                initialData={selectedUser}
                tenantId={tenantId}
                existingUsers={users}
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

