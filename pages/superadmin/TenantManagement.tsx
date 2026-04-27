import React, { useEffect, useState } from 'react';
import { getAllTenants, createTenant, updateTenant, createUser, getTenantAdmin, updateUser, sendPasswordReset, deleteTenant, logAudit } from '../../services/dataService';
import { Tenant, UserProfile, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Building, X, Save, Edit, User, Lock, Mail, Tag, UserCog, Send, Phone, Shield, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, AlertTriangle, RotateCcw, AlertCircle } from 'lucide-react';
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
    const [form, setForm] = useState({ full_name: '', whatsapp_number: '', email: '', password: '' });
    const { addNotification } = useNotification();

    useEffect(() => {
        if (isOpen && tenant) {
            setIsLoading(true);
            getTenantAdmin(tenant.id).then(admin => {
                setAdminProfile(admin);
                if (admin) {
                    setForm({ 
                        full_name: admin.full_name, 
                        whatsapp_number: admin.whatsapp_number || '',
                        email: admin.email || '',
                        password: '' // Keep empty for security
                    });
                }
                setIsLoading(false);
            });
        }
    }, [isOpen, tenant]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (adminProfile) {
                // Update Existing
                await updateUser({ id: adminProfile.id, full_name: form.full_name, whatsapp_number: form.whatsapp_number }, currentUser);
                addNotification({ type: 'success', title: 'Berhasil', message: 'Profil admin telah diperbarui.' });
            } else {
                // Create New for this Tenant
                if (!tenant) return;
                await createUser({
                    email: form.email,
                    password: form.password,
                    full_name: form.full_name,
                    role: UserRole.ADMIN,
                    tenant_id: tenant.id,
                    whatsapp_number: form.whatsapp_number
                }, currentUser);
                addNotification({ type: 'success', title: 'Berhasil', message: `Admin baru untuk ${tenant.name} telah dibuat.` });
            }
            onClose();
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Gagal', message: error.message || 'Gagal menyimpan data admin.' });
        } finally {
            setIsLoading(false);
        }
    };

    const [showInitialPass, setShowInitialPass] = useState(false);
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

    const handleActualForceReset = async () => {
        if (!adminProfile) return;
        const initialPass = (adminProfile as any).initial_password;
        
        setIsLoading(true);
        try {
            const { forceResetPassword } = await import('../../services/data/userService');
            await forceResetPassword(adminProfile.id, initialPass!, currentUser);
            addNotification({ type: 'success', title: 'Berhasil Reset', message: `Password ${adminProfile.email} dipaksa kembali ke default.` });
            setShowInitialPass(false);
            setIsConfirmResetOpen(false);
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', title: 'Gagal', message: 'Gagal melakukan reset paksa.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreDefaultPassword = async () => {
        if (!adminProfile) return;
        
        // Visual feedback only - since we can't force the Auth password back 
        // without Service Role Key, we "expose" the initial password to the Superadmin
        setShowInitialPass(true);
        addNotification({ 
            type: 'info', 
            title: 'Password Ditemukan', 
            message: 'Gunakan password awal ini untuk login kembali.' 
        });

        await logAudit(currentUser, 'UPDATE', `Reset Password: ${adminProfile.email}`, `Melihat password awal untuk reset manual.`);
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

                            {/* Security Section - Reset to Initial Flow */}
                            <div className="pt-3 border-t border-slate-100">
                                <div className="bg-gradient-to-r from-emerald-50/50 to-slate-50/30 p-3 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 flex-shrink-0">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Cek Password Awal</p>
                                        <p className="text-[9px] text-slate-400 font-bold leading-none mt-1 uppercase tracking-tighter">Gunakan jika admin lupa password</p>
                                    </div>
                                    {showInitialPass ? (
                                        <div className="bg-white px-2 py-1.5 border-2 border-emerald-400 rounded-xl flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                            <div className="px-2 py-1 bg-emerald-50 rounded-lg">
                                                <span className="text-[10px] font-black text-emerald-600 font-mono tracking-[0.2em]">{(adminProfile as any).initial_password || '********'}</span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setIsConfirmResetOpen(true)}
                                                className="px-3 py-1.5 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                                            >
                                                RESET SEKARANG
                                            </button>

                                            <button onClick={() => setShowInitialPass(false)} className="p-1 hover:bg-slate-100 rounded-md transition-all ml-1">
                                                <X className="w-3 h-3 text-slate-400" />
                                            </button>

                                            <ConfirmModal 
                                                isOpen={isConfirmResetOpen}
                                                onClose={() => setIsConfirmResetOpen(false)}
                                                onConfirm={handleActualForceReset}
                                                title="Konfirmasi Reset Paksa"
                                                message={
                                                    <p>
                                                        RESET PAKSA? Akun akan dikembalikan ke password awal: <span className="font-mono font-black text-emerald-600">{(adminProfile as any)?.initial_password}</span>. 
                                                        Password saat ini tidak akan bisa digunakan lagi.
                                                    </p>
                                                }
                                                confirmLabel="YA, RESET SEKARANG"
                                                cancelLabel="BATAL"
                                                variant="warning"
                                                centerOnScreen={true}
                                            />
                                        </div>
                                    ) : (
                                        <button 
                                            type="button" 
                                            onClick={handleRestoreDefaultPassword} 
                                            className="px-4 py-2 font-black text-[9px] uppercase tracking-[0.1em] rounded-xl border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            CEK PASSWORD
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-6 space-y-6">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-tight leading-none">Admin Belum Ada</h4>
                                    <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-tighter">Sekolah ini belum memiliki akun administrator aktif.</p>
                                </div>
                            </div>

                            <form id="adminForm" onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-3 h-3 text-indigo-600" />
                                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Daftarkan Admin Baru</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">Nama Lengkap</label>
                                        <input 
                                            type="text" required value={form.full_name} 
                                            onChange={e => setForm({...form, full_name: e.target.value})} 
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] outline-none transition-all focus:bg-white" 
                                            placeholder="Nama Admin"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">WhatsApp</label>
                                        <input 
                                            type="tel" value={form.whatsapp_number} 
                                            onChange={e => setForm({...form, whatsapp_number: e.target.value})} 
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] outline-none transition-all focus:bg-white" 
                                            placeholder="0812..." 
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">Email</label>
                                        <input 
                                            type="email" required value={form.email} 
                                            onChange={e => setForm({...form, email: e.target.value})} 
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-[13px] outline-none transition-all focus:bg-white" 
                                            placeholder="email@gmail.com" 
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-indigo-600">Password</label>
                                        <input 
                                            type="text" required value={form.password} 
                                            onChange={e => setForm({...form, password: e.target.value})} 
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-black text-[13px] font-mono outline-none transition-all focus:bg-white" 
                                            placeholder="••••••••" 
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer */}
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
                        disabled={isLoading}
                        className="px-8 py-2.5 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3 flex-1 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {adminProfile ? 'SIMPAN PROFIL' : 'BUAT ADMIN BARU'}
                    </button>
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [nextTenantCode, setNextTenantCode] = useState('0001');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCode, setShowCode] = useState(false); // Toggle for 'Kode' column on mobile

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
        
        // Wait a small moment to ensure the tenant record is committed before auth trigger runs
        await new Promise(resolve => setTimeout(resolve, 800));

        // Create the Admin User linked to this new tenant
        if (data.admin && data.admin.email && data.admin.password) {
            try {
                // Ensure password is at least 6 characters
                const safeAdminPassword = data.admin.password.length >= 6 ? data.admin.password : `pass_${data.admin.password}`;
                
                await createUser({
                    email: data.admin.email,
                    password: safeAdminPassword,
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
      console.error("Tenant save error:", error);
      let msg = error.message || "Gagal menyimpan data sekolah.";
      
      // Map to friendly messages
      if (msg.toLowerCase().includes('duplicate key') && msg.includes('code')) {
          msg = "Kode / ID Sekolah ini sudah digunakan. Mohon gunakan kode lain.";
      } else if (msg.toLowerCase().includes('already registered')) {
          msg = "Email admin sudah terdaftar di sistem. Gunakan email berbeda.";
      } else if (error.code === '42501') {
          msg = "Izin ditolak (Sistem Keamanan). Mohon refresh halaman.";
      }

      addNotification({ 
          type: 'error', 
          title: 'Gagal Menyimpan', 
          message: msg 
      });
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
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Action Bar - Optimized for Mobile Density */}
      <div className="flex flex-row items-center gap-1.5 lg:gap-4 bg-white/40 p-1.5 lg:p-2 rounded-2xl lg:rounded-[24px] border border-white/20 backdrop-blur-md">
          <div className="relative flex-1 group">
              <Search className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 w-3.5 lg:w-4 h-3.5 lg:h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                  type="text"
                  placeholder="Cari sekolah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 lg:pl-12 pr-2 lg:pr-5 py-1.5 lg:py-3 text-[10px] lg:text-[13px] font-bold border border-slate-100 lg:border-2 lg:border-slate-50 rounded-xl lg:rounded-2xl focus:border-indigo-400 bg-white transition-all outline-none h-8 lg:h-12 shadow-sm"
              />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
              {/* Toggle Kode Column - Mobile Only */}
              <button 
                  onClick={() => setShowCode(!showCode)}
                  className={`flex items-center justify-center h-8 w-8 lg:hidden rounded-xl border transition-all active:scale-90 ${showCode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  title="Toggle Kolom Kode"
              >
                  <Tag className="w-3.5 h-3.5" />
              </button>

              <button 
                  onClick={openCreateModal}
                  className="px-3 lg:px-6 h-8 lg:h-12 font-black text-[9px] lg:text-[11px] uppercase tracking-tighter lg:tracking-widest rounded-xl lg:rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xl shadow-indigo-100/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 lg:gap-2"
              >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tambah Sekolah</span>
                  <span className="sm:hidden">SEKOLAH</span>
              </button>
          </div>
      </div>

      <div className="bg-white shadow-sm border-2 border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="min-w-full divide-y divide-slate-100 border-separate border-spacing-0">
            <thead>
              <tr className="bg-white">
                <th className="w-[40px] min-w-[40px] lg:w-[45px] lg:min-w-[45px] sticky left-0 bg-white z-[30] px-3 py-4 text-center text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100">NO</th>
                
                {/* Kode Column - Conditionally hidden on mobile */}
                <th className={`${showCode ? 'flex' : 'hidden'} lg:table-cell w-[80px] min-w-[80px] lg:w-[150px] lg:min-w-[150px] sticky left-[40px] lg:left-[45px] bg-white z-[30] px-4 py-4 text-left text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100`}>KODE</th>
                
                <th className={`w-[120px] min-w-[120px] lg:w-[auto] lg:min-w-[300px] sticky ${showCode ? 'left-[120px]' : 'left-[40px]'} lg:left-[195px] bg-white z-[30] px-4 py-4 text-left text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-all`}>NAMA SEKOLAH</th>
                <th className="px-6 py-4 text-center text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-r-2 border-slate-100 bg-white min-w-[120px]">REGISTRASI</th>
                <th className="px-6 py-4 text-center text-slate-500 font-black uppercase text-[9.5px] tracking-widest border-b-2 border-slate-100 bg-white">AKSI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50" key={currentPage}>
              {paginatedTenants.map((tenant, index) => (
                <tr key={tenant.id} className="group transition-colors hover:bg-slate-50/30">
                  <td className="sticky left-0 bg-white px-2 py-4 text-[10.5px] font-black text-slate-400 text-center border-r-2 border-b border-slate-100 z-10 transition-colors uppercase">
                      {String((currentPage - 1) * itemsPerPage + index + 1)}
                  </td>
                  
                  {/* Kode Cell - Conditionally hidden on mobile */}
                  <td className={`${showCode ? 'table-cell' : 'hidden'} lg:table-cell sticky left-[40px] lg:left-[45px] bg-white px-4 py-4 border-r-2 border-b border-slate-100 z-10 transition-colors`}>
                      <span className="px-2 py-1 bg-slate-100/50 border border-slate-100 rounded-lg font-mono text-[10px] text-slate-500 font-bold group-hover:bg-white transition-colors">
                        {tenant.code || '-'}
                      </span>
                  </td>
                  
                  <td className={`sticky ${showCode ? 'left-[120px]' : 'left-[40px]'} lg:left-[195px] bg-white px-4 py-4 border-r-2 border-b border-slate-100 z-10 transition-all`}>
                      <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors block break-words leading-tight">{tenant.name}</span>
                  </td>
                  <td className="px-6 py-4 border-r-2 border-b border-slate-100">
                    <span className="text-[11px] font-black text-slate-700 tracking-tight whitespace-nowrap">
                        {new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-100">
                    <div className="flex justify-center gap-2">
                        <button 
                            onClick={() => openAdminManager(tenant)} 
                            title="Kelola Admin Sekolah"
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-100 hover:bg-orange-50 transition-all active:scale-90 shadow-sm"
                        >
                            <UserCog className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => openEditModal(tenant)} 
                            title="Edit Sekolah"
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all active:scale-90 shadow-sm"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => confirmDelete(tenant)}
                            title="Hapus Sekolah"
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-90 shadow-sm"
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
        {/* PAGINATION CONTROLS */}
        {!loading && filteredTenants.length > 0 && (
            <div className="bg-[#F8FAFC] border-t border-slate-100 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border-2 border-slate-100 rounded-xl px-2 md:px-3 py-1 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50/50 cursor-pointer shadow-sm transition-all"
                        >
                            {[10, 25, 50, 100].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-slate-200" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none whitespace-nowrap">
                        <span className="hidden sm:inline">DATA</span> 
                        <span className="text-slate-600 ml-1">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTenants.length)}</span> 
                        <span className="hidden sm:inline text-slate-300 mx-1">/</span> 
                        <span className="text-indigo-600 font-bold ml-0.5">{filteredTenants.length}</span> <span className="hidden sm:inline">Sekolah</span>
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
                                    if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-300 text-[10px] font-black">..</span>;
                                    return null;
                                }
                            }
                            
                            return (
                                <button 
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === pNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border-2 border-indigo-600' : 'text-slate-400 hover:bg-slate-50 border-2 border-transparent'}`}
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
