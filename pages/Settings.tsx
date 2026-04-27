
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole, Tenant } from '../types';
import { Button } from '../components/ui/Button';
import { User, Lock, Building, Upload, Shield } from 'lucide-react';
import { updateUser, uploadAvatar, updateTenant, uploadLogo } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { useLoading } from '../lib/LoadingContext';
import { useNotification } from '../lib/NotificationContext';
import { ImageCropModal } from '../components/ImageCropModal';

interface SettingsProps {
  user: UserProfile;
  tenant: Tenant | null;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
  onTenantUpdate?: (updatedTenant: Tenant) => void;
}

   type SettingsTab = 'profile' | 'security' | 'tenant';

export const Settings: React.FC<SettingsProps> = ({ user, tenant, onProfileUpdate, onTenantUpdate }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['profile', 'security', 'tenant'].includes(tabParam)) {
        return tabParam as SettingsTab;
      }
    }
    return 'profile';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['profile', 'security', 'tenant'].includes(tabParam)) {
        setActiveTab(tabParam as SettingsTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab: SettingsTab) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };
  const { setLoading } = useLoading();
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({ 
    fullName: user.full_name, 
    phone: user.whatsapp_number || '',
    role: user.role
  });
  // Update state to include oldPassword
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [tenantForm, setTenantForm] = useState({ name: '' });

  // Sync profile form when user prop changes (e.g. after upload or refresh)
  useEffect(() => {
    setProfileForm({
      fullName: user.full_name,
      phone: user.whatsapp_number || '',
      role: user.role
    });
  }, [user]);
  
  // States for Image Cropping
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'logo' | null>(null);

  useEffect(() => {
    if (tenant) {
      setTenantForm({ name: tenant.name });
    }
  }, [tenant]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const updatedUser = await updateUser({
            id: user.id,
            full_name: profileForm.fullName,
            whatsapp_number: profileForm.phone,
            role: profileForm.role
        }, user);

        if (onProfileUpdate) {
            onProfileUpdate(updatedUser);
        }
        addNotification({ type: 'success', title: 'Berhasil', message: 'Profil Anda telah diperbarui.' });
    } catch (error: any) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan profil. Coba lagi.' });
    } finally {
        setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropType('avatar');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenant) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropType('logo');
      setIsCropping(true);
    };
    reader.readAsDataURL(file);

    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropping(false);
    setLoading(true);

    try {
        const file = new File([croppedBlob], cropType === 'avatar' ? 'avatar.jpg' : 'logo.jpg', { type: 'image/jpeg' });
        
        if (cropType === 'avatar') {
            const publicUrl = await uploadAvatar(user.id, file);
            if (publicUrl) {
                const updatedUser = await updateUser({ 
            id: user.id, 
            avatar_url: publicUrl,
            role: profileForm.role 
        }, user);
                if (onProfileUpdate) onProfileUpdate(updatedUser);
                addNotification({ type: 'success', title: 'Berhasil', message: 'Foto profil telah diperbarui.' });
            }
        } else if (cropType === 'logo' && tenant) {
            const publicUrl = await uploadLogo(tenant.id, file);
            if (publicUrl) {
                const updatedTenant = await updateTenant(tenant.id, { logo_url: publicUrl }, user);
                if (onTenantUpdate) onTenantUpdate(updatedTenant);
                addNotification({ type: 'success', title: 'Berhasil', message: 'Logo sekolah telah diperbarui.' });
            }
        }
    } catch (error) {
        console.error("Failed to upload image:", error);
        addNotification({ type: 'error', title: 'Upload Gagal', message: 'Terjadi kesalahan saat mengunggah gambar.' });
    } finally {
        setLoading(false);
        setTempImage(null);
        setCropType(null);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Input Dasar
    if (!passwordForm.oldPassword) {
        addNotification({ type: 'error', title: 'Validasi Gagal', message: 'Mohon masukkan password lama Anda.' });
        return;
    }

    if (passwordForm.newPassword.length < 6) {
        addNotification({ type: 'error', title: 'Password Terlalu Pendek', message: 'Password baru harus minimal 6 karakter.' });
        return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        addNotification({ type: 'error', title: 'Password Tidak Cocok', message: 'Password baru dan konfirmasi tidak cocok.' });
        return;
    }

    setLoading(true);
    
    try {
        // 2. Verifikasi Password Lama (Re-Authentication)
        // Kita mencoba login dengan kredensial saat ini + password lama yang diinput.
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: passwordForm.oldPassword
        });

        if (signInError) {
            throw new Error("Password lama yang Anda masukkan salah.");
        }

        // 3. Jika Verifikasi Berhasil, Update Password
        const { error: updateError } = await supabase.auth.updateUser({
            password: passwordForm.newPassword
        });

        if (updateError) {
            throw updateError;
        }

        addNotification({ type: 'success', title: 'Berhasil', message: 'Password Anda telah diperbarui.' });
        // Reset form
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error: any) {
        console.error("Error updating password:", error);
        let friendlyMessage = 'Gagal mengubah password. Silakan coba lagi.';
        
        if (error.message) {
            const lowerCaseError = error.message.toLowerCase();
            if (lowerCaseError.includes('password lama')) {
                friendlyMessage = error.message;
            } else if (lowerCaseError.includes('must be different')) {
                friendlyMessage = 'Password baru tidak boleh sama dengan password lama.';
            } else if (lowerCaseError.includes('requires a recent login')) {
                friendlyMessage = 'Sesi Anda kedaluwarsa. Mohon logout dan login kembali.';
            } else {
                friendlyMessage = error.message;
            }
        }
        addNotification({ type: 'error', title: 'Gagal', message: friendlyMessage });
    } finally {
        setLoading(false);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tenant) return;
      setLoading(true);

      try {
        const updatedTenant = await updateTenant(tenant.id, { name: tenantForm.name }, user);
        if (onTenantUpdate) {
            onTenantUpdate(updatedTenant);
        }
        addNotification({ type: 'success', title: 'Berhasil', message: 'Pengaturan sekolah telah disimpan.' });
      } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan nama sekolah.' });
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in max-w-4xl mx-auto pb-2 overflow-hidden">
      {/* Control Strip TABS */}
      <div className="flex justify-start mb-5 lg:mb-6 shrink-0">
        <div className="flex items-center gap-1 p-0.5 lg:p-1 bg-slate-100/50 border border-slate-200/50 rounded-xl lg:rounded-[20px] w-full lg:w-fit shadow-sm">
          <button 
            onClick={() => handleTabChange('profile')}
            className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'profile' ? 'border-white bg-white text-indigo-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            <div className="flex items-center justify-center gap-1.5">
                <User className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                Profil
            </div>
          </button>
          <button 
            onClick={() => handleTabChange('security')}
            className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'security' ? 'border-white bg-white text-indigo-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                Keamanan
            </div>
          </button>
          {(user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && (
            <button 
              onClick={() => handleTabChange('tenant')}
              className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'tenant' ? 'border-white bg-white text-indigo-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                  <Building className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                  Sekolah
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-0">
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col min-h-0 space-y-3 lg:space-y-6">
                    <div className="flex flex-row items-center gap-4 lg:gap-6 shrink-0">
                        <div className="relative group shrink-0">
                            <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white rounded-2xl lg:rounded-[24px] flex items-center justify-center text-slate-300 text-xl lg:text-2xl font-black border border-slate-100 lg:border-2 lg:border-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.full_name.charAt(0)}</span>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-1.5 lg:p-2 bg-indigo-600 text-white rounded-lg lg:rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-90"
                            >
                                <Upload className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                            </button>
                        </div>
                        <div className="text-left py-1 flex-1">
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                            <h3 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate max-w-[200px] lg:max-w-none">{user.full_name}</h3>
                            <p className="text-[9px] lg:text-[11px] font-black text-indigo-600 mt-1 uppercase tracking-widest leading-none px-2 lg:py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-lg lg:rounded-xl w-fit">
                                {user.role === UserRole.ADMIN ? 'Admin' : 
                                 user.role === UserRole.TEACHER ? 'Ustadz' :
                                 user.role === UserRole.SANTRI ? 'Santri' :
                                 user.role === UserRole.SUPERVISOR ? 'Supervisor' :
                                 user.role === UserRole.SUPERADMIN ? 'Superadmin' : user.role}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 lg:gap-y-4 pt-3 lg:pt-4 border-t border-slate-100 overflow-y-auto lg:overflow-visible pr-1 custom-scrollbar">
                        <div className="space-y-1.5">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <input 
                                type="text" 
                                value={profileForm.fullName} 
                                onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} 
                                className="w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-white rounded-xl lg:rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Locked)</label>
                            <input 
                                type="email" 
                                disabled 
                                value={user.email} 
                                className="w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-slate-50/50 text-slate-400 rounded-xl lg:rounded-2xl cursor-not-allowed text-xs lg:text-sm font-bold opacity-70 outline-none" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                            <input 
                                type="tel" 
                                value={profileForm.phone} 
                                onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                                className="w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-white rounded-xl lg:rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                            />
                        </div>
                        {user.role !== UserRole.SANTRI && (
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Utama</label>
                                <div className="relative">
                                    <select 
                                        value={profileForm.role}
                                        onChange={e => setProfileForm({...profileForm, role: e.target.value as UserRole})}
                                        className="w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-slate-50 text-slate-400 rounded-xl lg:rounded-2xl cursor-not-allowed text-xs lg:text-sm font-bold outline-none appearance-none"
                                        disabled
                                    >
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        <option value={UserRole.TEACHER}>Ustadz</option>
                                        <option value={UserRole.SANTRI}>Santri</option>
                                        <option value={UserRole.SUPERVISOR}>Supervisor</option>
                                        <option value={UserRole.SUPERADMIN}>Superadmin</option>
                                    </select>
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-300" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                        <button 
                          type="submit"
                          className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            Update Profil
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'security' && (
                <form onSubmit={handleSaveSecurity} className="flex-1 flex flex-col min-h-0 space-y-4 lg:space-y-6">
                    <div className="max-w-2xl space-y-4 lg:space-y-6 overflow-y-auto lg:overflow-visible pr-1 custom-scrollbar">
                        <div className="space-y-1.5 max-w-md">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Saat Ini</label>
                            <div className="relative">
                                <Lock className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-3.5 lg:w-4 h-3.5 lg:h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    required 
                                    value={passwordForm.oldPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} 
                                    className="w-full pl-10 lg:pl-12 pr-4 lg:pr-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-white rounded-xl lg:rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6} 
                                    value={passwordForm.newPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                                    className="w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-white rounded-xl lg:rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    placeholder="Min 6 karakter"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6} 
                                    value={passwordForm.confirmPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                                    className="w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 bg-white rounded-xl lg:rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                />
                            </div>
                        </div>
                        
                        <div className="bg-indigo-50/50 p-3 lg:p-4 rounded-xl lg:rounded-[20px] border border-indigo-100/50 flex gap-3 lg:gap-4">
                             <div className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl shadow-sm h-fit shrink-0">
                                <Shield className="w-3 lg:w-4 h-3 lg:h-4 text-indigo-500" />
                             </div>
                             <div>
                                <h4 className="text-[9px] lg:text-[10px] font-black text-indigo-900 tracking-tight uppercase">Proteksi Maksimal</h4>
                                <p className="text-[8.5px] lg:text-[10px] font-bold text-indigo-700/70 mt-0.5 leading-relaxed">Kombinasikan simbol, angka, dan huruf kapital.</p>
                             </div>
                        </div>
                    </div>

                    <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                        <button 
                          type="submit"
                          className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'tenant' && (
                <form onSubmit={handleSaveTenant} className="flex-1 flex flex-col min-h-0 space-y-4 lg:space-y-8">
                    <section className="space-y-4 lg:space-y-6 overflow-y-auto lg:overflow-visible pr-1 custom-scrollbar">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Sekolah</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Identitas lembaga pendidikan</p>
                        </div>
                        
                        <div className="flex flex-row items-center gap-4 lg:gap-6 shrink-0">
                            <div className="relative group shrink-0">
                                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-2xl lg:rounded-[32px] flex items-center justify-center text-slate-300 text-xl lg:text-3xl font-black border border-slate-100 lg:border-2 lg:border-white shadow-lg lg:shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {tenant?.logo_url ? (
                                        <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building className="w-8 lg:w-12 h-8 lg:h-12 text-slate-200" />
                                    )}
                                </div>
                                 {!isReadOnly && (
                                    <button 
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 p-1.5 lg:p-2 bg-emerald-600 text-white rounded-lg lg:rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-90"
                                    >
                                        <Upload className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                                    </button>
                                 )}
                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/x-icon" style={{ display: 'none' }} />
                            </div>
                            <div className="space-y-1 flex-1 py-1">
                                <h4 className="text-sm lg:text-base font-black text-slate-800 leading-tight">Logo Institusi</h4>
                                <p className="text-[8.5px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Muncul di sidebar & favicon.</p>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-3 lg:pt-4 border-t border-slate-100">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Sekolah</label>
                            <input 
                                type="text" 
                                disabled={isReadOnly}
                                value={tenantForm.name} 
                                onChange={e => setTenantForm({...tenantForm, name: e.target.value})} 
                                className={`w-full px-4 lg:px-5 py-1.5 lg:py-2 border-2 border-slate-100 ${isReadOnly ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-800'} rounded-xl lg:rounded-2xl focus:ring-0 focus:border-indigo-400 shadow-sm transition-all text-xs lg:text-sm font-bold outline-none`} 
                            />
                        </div>
                    </section>
                    {!isReadOnly && (
                        <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                            <button 
                              type="submit"
                              className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-emerald-600 bg-emerald-600 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                            >
                                Simpan Setting
                            </button>
                        </div>
                    )}
                </form>
            )}
      </div>
      {isCropping && tempImage && (
        <ImageCropModal 
            image={tempImage} 
            onClose={() => {
                setIsCropping(false);
                setTempImage(null);
            }} 
            onCropComplete={handleCropComplete}
            aspect={cropType === 'logo' ? 1 : 1} 
        />
      )}
    </div>
  );
};
