
import React, { useEffect, useState } from 'react';
import { getAllTenants, createTenant, updateTenant, createUser, getTenantAdmin, updateUser, sendPasswordReset } from '../../services/dataService';
import { Tenant, UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Building, X, Save, Edit, User, Lock, Mail, Tag, UserCog, Send, Phone, Shield, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

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
    password: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, plan: initialData.plan, code: initialData.code || '' });
      // Reset admin data on edit mode (not used)
      setAdminData({ full_name: '', email: '', password: '' });
    } else {
      setFormData({ name: '', plan: 'basic', code: defaultCode || '' });
      setAdminData({ full_name: '', email: '', password: '' });
    }
  }, [initialData, isOpen, defaultCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine data. If initialData exists (Edit), we ignore adminData.
    // If it's new, we pass adminData along.
    await onSubmit({ 
        tenant: { ...formData, id: initialData?.id },
        admin: initialData ? null : adminData
    });
    
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden border-2 border-slate-50 transform animate-scale-in flex flex-col max-h-[90vh]">
        <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Building className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-800 uppercase text-[13px] tracking-tight">{initialData ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Section 1: Tenant Details */}
            <div className="space-y-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    Data Institusi
                </h4>
                <div className="space-y-4">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">Nama Sekolah</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50/50 border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all" placeholder="Contoh: Pesantren Darul Ilmi" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">ID Sekolah (Otomatis)</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    type="text" 
                                    value={formData.code} 
                                    onChange={e => setFormData({ ...formData, code: e.target.value })} 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50/30 border border-slate-100 rounded-2xl text-slate-500 font-bold text-sm outline-none font-mono focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 transition-all" 
                                    placeholder="0001" 
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">Paket Langganan</label>
                            <select value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value as Tenant['plan'] })} className="w-full px-4 py-3 bg-slate-50/50 border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all appearance-none cursor-pointer">
                                <option value="basic">Basic</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Admin Details (Only when creating new) */}
            {!initialData && (
                <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border-2 border-slate-100 group">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        Informasi Login Admin
                    </h4>
                    <div className="space-y-4">
                        <div className="group/field">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Nama Lengkap Admin</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/field:text-indigo-600" />
                                <input required type="text" value={adminData.full_name} onChange={e => setAdminData({ ...adminData, full_name: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all" placeholder="Admin Abdullah" />
                            </div>
                        </div>
                        <div className="group/field">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Email Login Utama</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/field:text-indigo-600" />
                                <input required type="email" value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all" placeholder="admin@sekolah.com" />
                            </div>
                        </div>
                        <div className="group/field">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1.5 ml-1 group-focus-within/field:text-indigo-600 transition-colors">Password Default</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/field:text-indigo-600" />
                                <input required minLength={6} type="text" value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all font-mono" placeholder="Min. 6 Karakter" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-slate-100 bg-white text-slate-400 hover:bg-slate-50 transition-all">
                    Batal
                </button>
                <button type="submit" className="flex-[2] py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100/50 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    {initialData ? 'Simpan Perubahan' : 'Buat Sekolah & Admin'}
                </button>
            </div>
            </form>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border-2 border-slate-50 flex flex-col max-h-[90vh] transform animate-scale-in">
                <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                            <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase text-[13px] tracking-tight">Kelola Admin</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[180px]">{tenant?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X className="w-5 h-5"/></button>
                </div>

                <div className="overflow-y-auto">
                    {isLoading ? (
                        <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat data admin...</p>
                        </div>
                    ) : adminProfile ? (
                        <>
                            {/* Profile Section */}
                            <div className="p-8 space-y-6">
                                <form onSubmit={handleUpdateProfile} className="space-y-5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                        Informasi Profil Aktif
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">Nama Lengkap</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600" />
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={form.full_name} 
                                                    onChange={e => setForm({...form, full_name: e.target.value})} 
                                                    className="w-full pl-11 pr-4 py-3 border-2 border-transparent bg-slate-50/50 rounded-2xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all" 
                                                    placeholder="Nama Lengkap Admin"
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">Nomor WA / Kontak</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600" />
                                                <input 
                                                    type="tel" 
                                                    value={form.whatsapp_number} 
                                                    onChange={e => setForm({...form, whatsapp_number: e.target.value})} 
                                                    className="w-full pl-11 pr-4 py-3 border-2 border-transparent bg-slate-50/50 rounded-2xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all" 
                                                    placeholder="Nomor WhatsApp" 
                                                />
                                            </div>
                                        </div>
                                        <div className="group opacity-70">
                                            <label className="block text-[10px] font-black text-slate-300 uppercase mb-1.5 ml-1">Email (Akun Login)</label>
                                            <div className="relative cursor-not-allowed">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input 
                                                    type="email" 
                                                    disabled 
                                                    value={adminProfile.email} 
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-100 text-slate-400 rounded-2xl text-sm font-bold border-2 border-transparent" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" className="w-full py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100/50 transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <Save className="w-4 h-4" />
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Security Section */}
                            <div className="bg-slate-50/50 p-8 pt-0 border-t border-slate-50">
                                <div className="mt-8 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                        Keamanan Akun
                                    </h4>
                                    <div className="bg-white p-5 rounded-2xl border-2 border-slate-50 shadow-sm space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shrink-0">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-bold text-slate-800">Reset Password</p>
                                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
                                                    Kirim instruksi reset password melalui email admin yang terdaftar.
                                                </p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={handleResetPassword} className="w-full py-2.5 px-4 font-black text-[10px] uppercase tracking-tight rounded-xl border-2 border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <Send className="w-3.5 h-3.5" />
                                            Kirim Link Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                            <div className="bg-slate-50 w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 text-slate-200 border-2 border-slate-50 shadow-inner">
                                <User className="w-12 h-12" />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Belum Ada Admin</h4>
                            <p className="text-[11px] text-slate-400 font-bold mt-2 mb-8 max-w-[240px] leading-relaxed">
                                Institusi ini belum memiliki administrator terdaftar di database.
                            </p>
                            <button onClick={onClose} className="w-full py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-slate-100 bg-white text-slate-400 hover:bg-slate-50 transition-all">Tutup</button>
                        </div>
                    )}
                </div>
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
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
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
    setGlobalLoading(true);
    try {
      if (selectedTenant) {
        // Edit Mode: Only update tenant
        await updateTenant(selectedTenant.id, { name: data.tenant.name, plan: data.tenant.plan, code: data.tenant.code }, user);
        addNotification({ type: 'success', title: 'Berhasil', message: 'Data sekolah telah diperbarui.' });
      } else {
        // Create Mode: Create Tenant THEN Create Admin
        const newTenant = await createTenant({ name: data.tenant.name!, plan: data.tenant.plan!, code: data.tenant.code }, user);
        
        // Create the Admin User linked to this new tenant
        if (data.admin && data.admin.email && data.admin.password) {
            try {
                await createUser({
                    email: data.admin.email,
                    password: data.admin.password,
                    full_name: data.admin.full_name,
                    role: UserRole.ADMIN,
                    tenant_id: newTenant.id,
                    whatsapp_number: ''
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
                <th className="w-[35%] px-6 py-4 text-left border-r border-slate-50">Nama Sekolah</th>
                <th className="w-[15%] px-6 py-4 text-center border-r border-slate-50">Paket</th>
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
                  <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                          tenant.plan === 'enterprise' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          tenant.plan === 'pro' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                          {tenant.plan}
                      </span>
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

      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        tenant={selectedTenant}
        currentUser={user}
      />
    </div>
  );
};
