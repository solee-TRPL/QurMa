import React, { useEffect, useState } from 'react';
import { getAllTenants, createTenant, updateTenant, createUser, getTenantAdmin, updateUser, sendPasswordReset, deleteTenant } from '../../services/dataService';
import { Tenant, UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Building, X, Save, Edit, User, Lock, Mail, Tag, UserCog, Send, Phone, Shield, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, AlertTriangle } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Tenant | null;
  defaultCode?: string; // New prop for auto-incremented code
}

const TenantFormModal: React.FC<TenantFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, defaultCode }) => {
  const [formData, setFormData] = useState<{ name: string; plan: Tenant['plan']; code: string }>({ name: '', plan: 'basic', code: '' });
  
  // State for new Admin (Only for Create Mode)
  const [adminData, setAdminData] = useState({
    full_name: '',
    email: '',
    password: '',
    whatsapp_number: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, plan: 'basic', code: initialData.code || '' });
    } else {
      setFormData({ name: '', plan: 'basic', code: defaultCode || '' });
      setAdminData({ full_name: '', email: '', password: '', whatsapp_number: '' });
    }
  }, [initialData, isOpen, defaultCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ 
        tenant: { ...formData, id: initialData?.id },
        admin: initialData ? null : adminData
    });
    onClose();
  };


  return (
    <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                <Building className="w-4 h-4" />
            </div>
            <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">
                    {initialData ? 'Perbarui Institusi' : 'Registrasi Sekolah Baru'}
                </h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2 opacity-70">
                    <Shield className="w-2.5 h-2.5 text-indigo-400" />
                    Multi-Tenant System
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"/>
          </button>
        </div>
        
        <div className="overflow-y-auto px-6 py-4 flex-1 custom-scrollbar">
            <form id="tenantForm" onSubmit={handleSubmit} className="space-y-4">
                {/* Section 1: Basic Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil Institusi</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 group">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">Nama Lengkap Sekolah</label>
                            <input 
                                required 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/20 outline-none transition-all placeholder:text-slate-300 shadow-sm" 
                                placeholder="Nama resmi..." 
                            />
                        </div>
                        <div className="group opacity-70">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Kode / ID Institusi</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                <input 
                                    disabled
                                    type="text" 
                                    value={formData.code} 
                                    className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 font-black text-[13px] outline-none font-mono cursor-not-allowed" 
                                    placeholder="0001" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Admin Details */}
                {!initialData && (
                    <div className="space-y-3 relative pt-2">
                        <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-indigo-400" />
                            <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Otoritas Admin</h4>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50/30 to-slate-50/30 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="group/field">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-indigo-600">Administrator</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-indigo-600" />
                                        <input required type="text" value={adminData.full_name} onChange={e => setAdminData({ ...adminData, full_name: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/20 outline-none transition-all" placeholder="Nama Admin" />
                                    </div>
                                </div>
                                <div className="group/field">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-indigo-600">WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-indigo-600" />
                                        <input required type="tel" value={adminData.whatsapp_number} onChange={e => setAdminData({ ...adminData, whatsapp_number: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/20 outline-none transition-all placeholder:text-slate-300" placeholder="08123456789" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="group/field">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-indigo-600">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-indigo-600" />
                                        <input required type="email" value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] focus:border-indigo-400 outline-none transition-all" placeholder="email@gmail.com" />
                                    </div>
                                </div>
                                <div className="group/field">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within/field:text-indigo-600">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-indigo-600" />
                                        <input required minLength={6} type="text" value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-black text-[13px] outline-none font-mono" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex-1"
            >
                Batalkan
            </button>
            <button 
                form="tenantForm"
                type="submit" 
                className="px-8 py-2.5 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 flex-1"
            >
                <Save className="w-4 h-4" />
                {initialData ? 'PERBARUI DATA' : 'BUAT SEKOLAH'}
            </button>
        </div>
      </div>
    </div>
  );
};

interface AdminManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
    currentUser: UserProfile;
}

const AdminManagerModal: React.FC<AdminManagerModalProps> = ({ isOpen, onClose, tenant, currentUser }) => {
    const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ full_name: '', whatsapp_number: '' });
    const { addNotification } = useNotification();

    useEffect(() => {
        if (isOpen && tenant) {
            setIsLoading(true);
            getTenantAdmin(tenant.id).then(admin => {
                setAdminProfile(admin);
                if (admin) {
                    setForm({ full_name: admin.full_name, whatsapp_number: admin.whatsapp_number || '' });
                }
                setIsLoading(false);
            });
        }
    }, [isOpen, tenant]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminProfile) return;
        setIsLoading(true);
        try {
            await updateUser({ id: adminProfile.id, ...form }, currentUser);
            addNotification({ type: 'success', title: 'Berhasil', message: 'Profil admin telah diperbarui.' });
            onClose();
        } catch (error) {
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui profil admin.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!adminProfile) return;
        if (!confirm(`Kirim email reset password ke ${adminProfile.email}?`)) return;
        
        setIsLoading(true);
        try {
            await sendPasswordReset(adminProfile.email, currentUser);
            addNotification({ type: 'success', title: 'Terkirim', message: 'Link reset password telah dikirim ke email admin.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal mengirim email reset password.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 lg:pl-64 pt-16"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative text-slate-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                            <UserCog className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">Otoritas Admin</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <Building className="w-2.5 h-2.5 text-indigo-400" />
                                {tenant?.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
                        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"/>
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {isLoading ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-sm"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi Data...</p>
                        </div>
                    ) : adminProfile ? (
                        <div className="px-6 py-4 space-y-6">
                            {/* Profile Section */}
                            <form id="adminForm" onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-indigo-600" />
                                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Profil Administrator</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">Nama Lengkap</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-600" />
                                            <input 
                                                type="text" 
                                                required 
                                                value={form.full_name} 
                                                onChange={e => setForm({...form, full_name: e.target.value})} 
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/20 outline-none transition-all" 
                                                placeholder="Nama Admin"
                                            />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-600" />
                                            <input 
                                                type="tel" 
                                                value={form.whatsapp_number} 
                                                onChange={e => setForm({...form, whatsapp_number: e.target.value})} 
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] focus:bg-white focus:border-indigo-400 outline-none transition-all" 
                                                placeholder="0812..." 
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 group opacity-60 scale-95 origin-left">
                                        <label className="block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 ml-1">Email Kredensial (Tetap)</label>
                                        <div className="relative cursor-not-allowed">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                            <input 
                                                type="email" 
                                                disabled 
                                                value={adminProfile.email} 
                                                className="w-full pl-9 pr-4 py-2 bg-slate-100/50 text-slate-400 rounded-xl text-[12px] font-bold border border-slate-200" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Security Section - Ultra Efficient Inline Layout */}
                            <div className="pt-3 border-t border-slate-100">
                                <div className="bg-gradient-to-r from-orange-50/50 to-slate-50/30 p-3 rounded-2xl border border-orange-100/50 flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-orange-500 shadow-sm border border-orange-100 flex-shrink-0">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Kirim Reset Password</p>
                                        <p className="text-[9px] text-slate-400 font-bold leading-none mt-1 uppercase tracking-tighter">Via Email Institusi</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleResetPassword} 
                                        className="px-4 py-2 font-black text-[9px] uppercase tracking-[0.1em] rounded-xl border border-orange-200 bg-white text-orange-600 hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                                    >
                                        <Send className="w-3 h-3" />
                                        RESET SEKARANG
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                            <div className="bg-slate-50 w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 text-slate-200 border border-slate-100 shadow-inner">
                                <User className="w-10 h-10" />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Kosong</h4>
                            <button 
                                onClick={onClose} 
                                className="px-8 py-2.5 font-black text-[9px] uppercase tracking-widest rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all"
                            >
                                Selesai
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {adminProfile && (
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2.5 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex-1"
                        >
                            TUTUP
                        </button>
                        <button 
                            form="adminForm"
                            type="submit" 
                            className="px-8 py-2.5 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 flex-1"
                        >
                            <Save className="w-4 h-4" />
                            SIMPAN PROFIL
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const TenantManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [nextTenantCode, setNextTenantCode] = useState('0001');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  const fetchTenants = () => {
    setLoading(true);
    getAllTenants().then(data => {
      setTenants(data);
      if (data.length > 0) {
        const lastCode = Math.max(...data.map(t => parseInt(t.code || '0', 10)).filter(n => !isNaN(n)));
        const nextCode = String(lastCode + 1).padStart(4, '0');
        setNextTenantCode(nextCode);
      } else {
        setNextTenantCode('0001');
      }
      setLoading(false);
    });
  };

  useEffect(fetchTenants, []);

  const filteredTenants = React.useMemo(() => {
    return tenants.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.code || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenants, searchQuery]);

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(start, start + itemsPerPage);
  }, [filteredTenants, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  const handleSave = async (data: { tenant: Partial<Tenant>, admin: any }) => {
    // Client-side uniqueness check
    const isCodeTaken = tenants.some(t => 
        t.code === data.tenant.code && 
        (!selectedTenant || t.id !== selectedTenant.id)
    );

    if (isCodeTaken) {
        addNotification({ 
            type: 'error', 
            title: 'Kode Sudah Digunakan', 
            message: `ID Sekolah "${data.tenant.code}" sudah terdaftar untuk sekolah lain. Gunakan kode yang berbeda.` 
        });
        return;
    }

    setGlobalLoading(true);
    try {
      if (selectedTenant) {
        // Edit Mode: Only update tenant
        await updateTenant(selectedTenant.id, { name: data.tenant.name, plan: 'basic', code: data.tenant.code }, user);
        addNotification({ type: 'success', title: 'Berhasil', message: 'Data sekolah telah diperbarui.' });
      } else {
        // Create Mode: Create Tenant THEN Create Admin
        const newTenant = await createTenant({ name: data.tenant.name!, plan: 'basic', code: data.tenant.code }, user);
        
        // Create the Admin User linked to this new tenant
        if (data.admin && data.admin.email && data.admin.password) {
            try {
                await createUser({
                    email: data.admin.email,
                    password: data.admin.password,
                    full_name: data.admin.full_name,
                    role: UserRole.ADMIN,
                    tenant_id: newTenant.id,
                    whatsapp_number: data.admin.whatsapp_number
                }, user);
                addNotification({ type: 'success', title: 'Berhasil', message: `Sekolah "${newTenant.name}" dan adminnya telah dibuat.` });
            } catch (adminError: any) {
                console.error("Failed to create admin user:", adminError);
                addNotification({ type: 'error', title: 'Admin Gagal Dibuat', message: `Sekolah berhasil dibuat, tetapi gagal membuat user admin: ${adminError.message}` });
            }
        }
      }
      fetchTenants();
    } catch (error: any) {
      console.error(error);
      addNotification({ type: 'error', title: 'Gagal', message: error.message || "Gagal menyimpan data sekolah." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;
    setGlobalLoading(true);
    try {
        await deleteTenant(tenantToDelete.id, user, tenantToDelete.name);
        addNotification({ type: 'success', title: 'Berhasil', message: 'Sekolah telah dihapus.' });
        fetchTenants();
    } catch (error: any) {
        addNotification({ type: 'error', title: 'Gagal', message: error.message || 'Gagal menghapus sekolah.' });
    } finally {
        setGlobalLoading(false);
        setIsDeleteModalOpen(false);
        setTenantToDelete(null);
    }
  };

  const openCreateModal = () => {
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const openAdminManager = (tenant: Tenant) => {
      setSelectedTenant(tenant);
      setIsAdminModalOpen(true);
  };

  const confirmDelete = (tenant: Tenant) => {
      setTenantToDelete(tenant);
      setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative group w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                  type="text"
                  placeholder="Cari sekolah atau kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-slate-50 rounded-2xl text-slate-700 font-bold text-[13px] outline-none focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/20 transition-all shadow-sm"
              />
          </div>

          <button 
              onClick={openCreateModal}
              className="w-full md:w-auto flex items-center justify-center px-6 py-2.5 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xl shadow-indigo-100/30 transition-all active:scale-95 gap-2"
          >
              <Plus className="w-4 h-4" />
              Tambah Sekolah Baru
          </button>
      </div>

      <div className="bg-white rounded-[28px] border-2 border-slate-50 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto min-h-0">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#FCFDFE]">
              <tr className="text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                <th className="w-[5%] px-6 py-4 text-left border-r border-slate-50">No.</th>
                <th className="w-[15%] px-6 py-4 text-left border-r border-slate-50">Kode / ID</th>
                <th className="w-[45%] px-6 py-4 text-left border-r border-slate-50">Nama Sekolah</th>
                <th className="w-[15%] px-6 py-4 text-center border-r border-slate-50">Registrasi</th>
                <th className="w-[15%] px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50" key={currentPage}>
              {paginatedTenants.map((tenant, index) => (
                <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group animate-fade-in">
                  <td className="px-6 py-4 border-r border-slate-50/50">
                      <span className="text-[11px] font-black text-slate-300">
                          {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                      </span>
                  </td>
                  <td className="px-6 py-4 border-r border-slate-50/50">
                      <span className="px-2 py-1 bg-slate-100/50 border border-slate-100 rounded-lg font-mono text-[10px] text-slate-500 font-bold group-hover:bg-white transition-colors">
                        {tenant.code || '-'}
                      </span>
                  </td>
                  <td className="px-6 py-4">
                      <span className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{tenant.name}</span>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-slate-50/50">
                    <span className="text-[12px] font-bold text-slate-600">
                        {new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => openAdminManager(tenant)} 
                            title="Kelola Admin Sekolah"
                            className="p-2 rounded-xl bg-orange-50/50 border border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition-all active:scale-90"
                        >
                            <UserCog className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => openEditModal(tenant)} 
                            title="Edit Sekolah"
                            className="p-2 rounded-xl bg-slate-50/50 border border-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-90"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => confirmDelete(tenant)}
                            title="Hapus Sekolah"
                            className="p-2 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-500 hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTenants.length === 0 && !loading && (
            <div className="p-16 text-center">
                <div className="flex flex-col items-center">
                    <Building className="w-12 h-12 text-slate-100 mb-4" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Data sekolah tidak ditemukan
                    </p>
                    <p className="text-[10px] text-slate-300 font-bold mt-2">Coba gunakan kata kunci pencarian lain</p>
                </div>
            </div>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && filteredTenants.length > 0 && (
            <div className="bg-white border-t border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tampilkan</span>
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:border-indigo-300 transition-all cursor-pointer"
                        >
                            {[5, 10, 25, 50].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-px h-4 bg-slate-100" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Total <span className="text-indigo-600">{filteredTenants.length}</span> Sekolah
                    </p>
                </div>

                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 mx-2">
                        {getVisiblePages().map((page, idx) => (
                            <React.Fragment key={idx}>
                                {page === '...' ? (
                                    <span className="text-slate-300 px-1">•••</span>
                                ) : (
                                    <button
                                        onClick={() => setCurrentPage(Number(page))}
                                        className={`min-w-[32px] h-8 rounded-xl text-[11px] font-black transition-all ${
                                            currentPage === page 
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                            : 'text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>

      <TenantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={selectedTenant}
        defaultCode={nextTenantCode}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Sekolah Permanen?"
        confirmLabel="YA, HAPUS SEKOLAH"
        variant="danger"
        message={
            <div className="space-y-3">
                <p>Apakah Anda yakin ingin menghapus <strong>{tenantToDelete?.name}</strong> dari platform secara permanen?</p>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-[10px] font-bold text-rose-600 leading-relaxed uppercase tracking-tight">
                        Peringatan: Seluruh data santri, guru, ustadz, dan rekaman hafalan yang berkaitan dengan sekolah ini akan ikut terpengaruh atau tidak dapat diakses.
                    </p>
                </div>
            </div>
        }
      />

      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        tenant={selectedTenant}
        currentUser={user}
      />
    </div>
  );
};
