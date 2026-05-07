
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole, Tenant } from '../types';
import { Button } from '../components/ui/Button';
import { User, Lock, Building, Upload, Shield, Settings2, Clock, Check, ChevronDown, Calendar } from 'lucide-react';
import { updateUser, uploadAvatar, updateTenant, uploadLogo, getStudentById, updateStudent, getStudents } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { useLoading } from '../lib/LoadingContext';
import { useNotification } from '../lib/NotificationContext';
import { ImageCropModal } from '../components/ImageCropModal';
import { provinces, provinceCities, indonesianLocations } from '../lib/locations';

interface SettingsProps {
  user: UserProfile;
  tenant: Tenant | null;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
  onTenantUpdate?: (updatedTenant: Tenant) => void;
}

   type SettingsTab = 'profile' | 'security' | 'tenant' | 'system';

export const Settings: React.FC<SettingsProps> = ({ user, tenant, onProfileUpdate, onTenantUpdate }) => {
  const isReadOnly = user.role === UserRole.SUPERVISOR;
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['profile', 'security', 'tenant', 'system'].includes(tabParam)) {
        return tabParam as SettingsTab;
      }
    }
    return 'profile';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['profile', 'security', 'tenant', 'system'].includes(tabParam)) {
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
    role: user.role,
    // Student specific fields
    father_name: '',
    mother_name: '',
    father_phone: '',
    mother_phone: '',
    address: '',
    rt_rw: '',
    village: '',
    district: '',
    city: '',
    province: ''
  });


  // Update state to include oldPassword
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [tenantForm, setTenantForm] = useState({ name: '' });
  const [systemForm, setSystemForm] = useState({ 
    academicYearStartMonth: 6, // Default July (0-indexed)
    activeDays: [1, 2, 3, 4, 5] // Default Mon-Fri
  });

  // Sync profile form when user prop changes (e.g. after upload or refresh)
  useEffect(() => {
    const fetchStudentData = async () => {
        if (user.role === UserRole.SANTRI) {
            let student = await getStudentById(user.id);
            
            // If not found by direct ID match, it might be a guardian-linked student account
            if (!student && user.tenant_id) {
                const allStudents = await getStudents(user.tenant_id);
                student = allStudents.find(s => s.parent_id === user.id) || null;
            }

            if (student) {
                setProfileForm(prev => ({
                    ...prev,
                    fullName: user.full_name,
                    phone: user.whatsapp_number || '',
                    role: user.role,
                    father_name: student?.father_name || '',
                    mother_name: student?.mother_name || '',
                    father_phone: student?.father_phone || '',
                    mother_phone: student?.mother_phone || '',
                    address: student?.address || '',
                    rt_rw: student?.rt_rw || '',
                    village: student?.village || '',
                    district: student?.district || '',
                    city: student?.city || '',
                    province: student?.province || ''
                }));
                return;
            }
        }
        setProfileForm(prev => ({
            ...prev,
            fullName: user.full_name,
            phone: user.whatsapp_number || '',
            role: user.role
        }));
    };
    fetchStudentData();
  }, [user]);
  
  // States for Image Cropping
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'logo' | null>(null);

  useEffect(() => {
    if (tenant) {
      setTenantForm({ name: tenant.name });
      setSystemForm({
        academicYearStartMonth: tenant.cycle_config?.academicYearStartMonth ?? 6,
        activeDays: tenant.cycle_config?.activeDays ?? [1, 2, 3, 4, 5]
      });
    }
  }, [tenant]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        // 1. Update User Table (Auth User) - REMOVE role from update as it's restricted
        const updatedUser = await updateUser({
            id: user.id,
            full_name: profileForm.fullName,
            whatsapp_number: profileForm.phone,
            // role: profileForm.role // Do NOT update role here, it's usually restricted by RLS
        }, user);

        // 2. Update Student Table if Role is SANTRI
        if (user.role === UserRole.SANTRI) {
            // Find the student ID to update (might be different from user.id if linked via parent_id)
            let studentIdToUpdate: string | null = null;
            const directStudent = await getStudentById(user.id);
            
            if (directStudent) {
                studentIdToUpdate = directStudent.id;
            } else if (user.tenant_id) {
                const allStudents = await getStudents(user.tenant_id);
                const linkedStudent = allStudents.find(s => s.parent_id === user.id);
                if (linkedStudent) studentIdToUpdate = linkedStudent.id;
            }

            if (studentIdToUpdate) {
                await updateStudent({
                    id: studentIdToUpdate,
                    full_name: profileForm.fullName,
                    father_name: profileForm.father_name,
                    mother_name: profileForm.mother_name,
                    father_phone: profileForm.father_phone,
                    mother_phone: profileForm.mother_phone,
                    address: profileForm.address,
                    rt_rw: profileForm.rt_rw,
                    village: profileForm.village,
                    district: profileForm.district,
                    city: profileForm.city,
                    province: profileForm.province
                }, user);
            }
        }

        if (onProfileUpdate) {
            onProfileUpdate(updatedUser);
        }
        addNotification({ type: 'success', title: 'Berhasil', message: 'Profil Anda telah diperbarui.' });
    } catch (error: any) {
        console.error("Save Profile Error:", error);
        addNotification({ 
            type: 'error', 
            title: 'Gagal', 
            message: error?.message || 'Gagal menyimpan profil. Coba lagi.' 
        });
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
    } catch (error: any) {
        console.error("Failed to upload image:", error);
        addNotification({ type: 'error', title: 'Upload Gagal', message: error?.message || 'Terjadi kesalahan saat mengunggah gambar.' });
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

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);

    try {
        const updatedTenant = await updateTenant(tenant.id, { 
            cycle_config: { 
                ...tenant.cycle_config,
                academicYearStartMonth: systemForm.academicYearStartMonth,
                activeDays: systemForm.activeDays
            } 
        }, user);
        if (onTenantUpdate) {
            onTenantUpdate(updatedTenant);
        }
        addNotification({ type: 'success', title: 'Berhasil', message: 'Pengaturan sistem telah diperbarui.' });
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan pengaturan sistem.' });
    } finally {
        setLoading(false);
    }
  };

  const getSemesterInfo = (startMonth: number) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const s1Start = months[startMonth];
    const s1End = months[(startMonth + 5) % 12];
    const s2Start = months[(startMonth + 6) % 12];
    const s2End = months[(startMonth + 11) % 12];

    return {
        s1: `${s1Start} - ${s1End}`,
        s2: `${s2Start} - ${s2End}`
    };
  };

  const toggleDay = (day: number) => {
    setSystemForm(prev => {
        const activeDays = prev.activeDays.includes(day) 
            ? prev.activeDays.filter(d => d !== day)
            : [...prev.activeDays, day].sort();
        return { ...prev, activeDays };
    });
  };

  const days = [
    { id: 1, label: 'Sen' }, { id: 2, label: 'Sel' }, { id: 3, label: 'Rab' },
    { id: 4, label: 'Kam' }, { id: 5, label: 'Jum' }, { id: 6, label: 'Sab' }, { id: 0, label: 'Min' }
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in max-w-4xl mx-auto pb-2 overflow-hidden">
      {/* Control Strip TABS */}
      <div className="flex justify-start mb-5 lg:mb-6 shrink-0">
        <div className="flex items-center gap-1 p-0.5 lg:p-1 bg-slate-100/50 border border-slate-200/50 rounded-xl lg:rounded-[20px] w-full lg:w-fit shadow-sm">
          <button 
            onClick={() => handleTabChange('profile')}
            className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'profile' ? 'border-white bg-white text-jade-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            <div className="flex items-center justify-center gap-1.5">
                <User className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                Profil
            </div>
          </button>
          <button 
            onClick={() => handleTabChange('security')}
            className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'security' ? 'border-white bg-white text-jade-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                Keamanan
            </div>
          </button>
          {(user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && (
            <button 
              onClick={() => handleTabChange('tenant')}
              className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'tenant' ? 'border-white bg-white text-jade-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                  <Building className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                  Sekolah
              </div>
            </button>
          )}
          {(user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && (
            <button 
              onClick={() => handleTabChange('system')}
              className={`flex-1 lg:flex-none px-3 lg:px-6 py-1.5 lg:py-2 text-[9.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-lg lg:rounded-2xl border-2 transition-all ${activeTab === 'system' ? 'border-white bg-white text-jade-600 shadow-md' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                  <Settings2 className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                  Sistem
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
                            <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white rounded-2xl lg:rounded-[24px] flex items-center justify-center text-slate-300 text-xl lg:text-2xl font-black border border-slate-200 lg:border-2 lg:border-slate-300 overflow-hidden group-hover:scale-95 transition-transform duration-500">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.full_name.charAt(0)}</span>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-1.5 lg:p-2 bg-jade-600 text-white rounded-lg lg:rounded-xl shadow-lg shadow-primary-200 hover:bg-jade-700 transition-all active:scale-90"
                            >
                                <Upload className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                            </button>
                        </div>
                        <div className="text-left py-1 flex-1">
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                            <h3 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate max-w-[200px] lg:max-w-none">{user.full_name}</h3>
                            <p className="text-[9px] lg:text-[11px] font-black text-jade-600 mt-1 uppercase tracking-widest leading-none px-2 lg:py-1.5 bg-jade-50 border border-jade-100/50 rounded-lg lg:rounded-xl w-fit">
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
                                className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Locked)</label>
                            <input 
                                type="email" 
                                disabled 
                                value={user.email} 
                                className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-100/50 border border-slate-200/60 text-slate-400 rounded-xl lg:rounded-2xl cursor-not-allowed text-xs lg:text-sm font-bold opacity-70 outline-none" 
                            />
                        </div>
                        {user.role !== UserRole.SANTRI && (
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                                <input 
                                    type="tel" 
                                    value={profileForm.phone} 
                                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                />
                            </div>
                        )}
                        {user.role !== UserRole.SANTRI && (
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Utama</label>
                                <div className="relative">
                                    <select 
                                        value={profileForm.role}
                                        onChange={e => setProfileForm({...profileForm, role: e.target.value as UserRole})}
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-100/50 border border-slate-200/60 text-slate-400 rounded-xl lg:rounded-2xl cursor-not-allowed text-xs lg:text-sm font-bold outline-none appearance-none"
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

                        {/* Additional Fields for SANTRI */}
                        {user.role === UserRole.SANTRI && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ayah</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.father_name} 
                                        onChange={e => setProfileForm({...profileForm, father_name: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ibu</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.mother_name} 
                                        onChange={e => setProfileForm({...profileForm, mother_name: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Ayah</label>
                                    <input 
                                        type="tel" 
                                        value={profileForm.father_phone} 
                                        onChange={e => setProfileForm({...profileForm, father_phone: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Ibu</label>
                                    <input 
                                        type="tel" 
                                        value={profileForm.mother_phone} 
                                        onChange={e => setProfileForm({...profileForm, mother_phone: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Provinsi</label>
                                    <div className="relative">
                                        <select 
                                            value={profileForm.province} 
                                            onChange={e => setProfileForm({...profileForm, province: e.target.value, city: '', district: '', village: ''})} 
                                            className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none appearance-none"
                                        >
                                            <option value="">PILIH PROVINSI</option>
                                            {provinces.map(prov => (
                                                <option key={prov} value={prov}>{prov}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kota / Kabupaten</label>
                                    <div className="relative">
                                        {profileForm.province ? (
                                            <>
                                                <select 
                                                    value={profileForm.city} 
                                                    onChange={e => setProfileForm({...profileForm, city: e.target.value, district: '', village: ''})} 
                                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none appearance-none"
                                                >
                                                    <option value="">PILIH KOTA/KABUPATEN</option>
                                                    {(provinceCities[profileForm.province] || []).map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                    <option value="LAINNYA">LAINNYA (INPUT MANUAL)</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </>
                                        ) : (
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    disabled
                                                    placeholder="Pilih Provinsi Terlebih Dahulu"
                                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl text-slate-400 outline-none opacity-50 text-xs lg:text-sm font-bold" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                                    <div className="relative">
                                        {profileForm.province && profileForm.city && indonesianLocations[profileForm.province]?.[profileForm.city] && profileForm.district !== 'LAINNYA_MANUAL' ? (
                                            <>
                                                <select 
                                                    value={profileForm.district} 
                                                    onChange={e => setProfileForm({...profileForm, district: e.target.value, village: ''})} 
                                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none appearance-none"
                                                >
                                                    <option value="">PILIH KECAMATAN</option>
                                                    {Object.keys(indonesianLocations[profileForm.province][profileForm.city]).map(dist => (
                                                        <option key={dist} value={dist}>{dist}</option>
                                                    ))}
                                                    <option value="LAINNYA_MANUAL">LAINNYA (INPUT MANUAL)</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </>
                                        ) : (
                                            <div className="relative group">
                                                <input 
                                                    type="text" 
                                                    value={profileForm.district === 'LAINNYA_MANUAL' ? '' : profileForm.district} 
                                                    disabled={!profileForm.city}
                                                    placeholder={profileForm.city ? "Input Kecamatan" : "Pilih Kota Terlebih Dahulu"}
                                                    onChange={e => setProfileForm({...profileForm, district: e.target.value.toUpperCase()})} 
                                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none disabled:opacity-50" 
                                                />
                                                {profileForm.district !== '' && profileForm.province && indonesianLocations[profileForm.province]?.[profileForm.city] && (
                                                    <button 
                                                        onClick={() => setProfileForm({...profileForm, district: ''})}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-jade-600 uppercase tracking-tighter hover:text-jade-700 transition-colors"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelurahan / Desa</label>
                                    <div className="relative">
                                        {profileForm.province && profileForm.city && profileForm.district && indonesianLocations[profileForm.province]?.[profileForm.city]?.[profileForm.district] && profileForm.village !== 'LAINNYA_MANUAL' ? (
                                            <>
                                                <select 
                                                    value={profileForm.village} 
                                                    onChange={e => setProfileForm({...profileForm, village: e.target.value})} 
                                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none appearance-none"
                                                >
                                                    <option value="">PILIH KELURAHAN/DESA</option>
                                                    {indonesianLocations[profileForm.province][profileForm.city][profileForm.district].map(vill => (
                                                        <option key={vill} value={vill}>{vill}</option>
                                                    ))}
                                                    <option value="LAINNYA_MANUAL">LAINNYA (INPUT MANUAL)</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </>
                                        ) : (
                                            <div className="relative group">
                                                <input 
                                                    type="text" 
                                                    value={profileForm.village === 'LAINNYA_MANUAL' ? '' : profileForm.village} 
                                                    disabled={!profileForm.district}
                                                    placeholder={profileForm.district ? "Input Kelurahan/Desa" : "Pilih Kecamatan Terlebih Dahulu"}
                                                    onChange={e => setProfileForm({...profileForm, village: e.target.value.toUpperCase()})} 
                                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none disabled:opacity-50" 
                                                />
                                                {profileForm.village !== '' && profileForm.province && profileForm.city && profileForm.district && indonesianLocations[profileForm.province]?.[profileForm.city]?.[profileForm.district] && (
                                                    <button 
                                                        onClick={() => setProfileForm({...profileForm, village: ''})}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-jade-600 uppercase tracking-tighter hover:text-jade-700 transition-colors"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">RT / RW</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.rt_rw} 
                                        placeholder="Contoh: 001/002"
                                        onChange={e => setProfileForm({...profileForm, rt_rw: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                                    <textarea 
                                        value={profileForm.address} 
                                        placeholder="Nama jalan, nomor rumah, dsb."
                                        onChange={e => setProfileForm({...profileForm, address: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none min-h-[80px]" 
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                        <button 
                          type="submit"
                          className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-jade-600 bg-jade-600 text-white hover:bg-jade-700 transition-all active:scale-95"
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
                                    className="w-full pl-10 lg:pl-12 pr-4 lg:pr-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
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
                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
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
                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl lg:rounded-2xl shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none" 
                                />
                            </div>
                        </div>
                        
                        <div className="bg-jade-50/50 p-3 lg:p-4 rounded-xl lg:rounded-[20px] border border-jade-100/50 flex gap-3 lg:gap-4">
                             <div className="p-1.5 lg:p-2 bg-white rounded-lg lg:rounded-xl shadow-sm h-fit shrink-0">
                                <Shield className="w-3 lg:w-4 h-3 lg:h-4 text-jade-500" />
                             </div>
                             <div>
                                <h4 className="text-[9px] lg:text-[10px] font-black text-jade-900 tracking-tight uppercase">Proteksi Maksimal</h4>
                                <p className="text-[8.5px] lg:text-[10px] font-bold text-jade-700/70 mt-0.5 leading-relaxed">Kombinasikan simbol, angka, dan huruf kapital.</p>
                             </div>
                        </div>
                    </div>

                    <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                        <button 
                          type="submit"
                          className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-jade-600 bg-jade-600 text-white hover:bg-jade-700 transition-all active:scale-95"
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
                                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-2xl lg:rounded-[32px] flex items-center justify-center text-slate-300 text-xl lg:text-3xl font-black border border-slate-100 lg:border-2 lg:border-slate-300 overflow-hidden group-hover:scale-95 transition-transform duration-500">
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
                                className={`w-full px-4 lg:px-5 py-2 lg:py-2.5 ${isReadOnly ? 'bg-slate-100/50 border-slate-200/60 text-slate-400' : 'bg-slate-50/80 border-slate-200/60 shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white'} rounded-xl lg:rounded-2xl transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none`} 
                            />
                        </div>
                    </section>
                    {!isReadOnly && (
                        <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                            <button 
                              type="submit"
                              className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95"
                            >
                                Simpan Setting
                            </button>
                        </div>
                    )}
                </form>
            )}

            {activeTab === 'system' && (
                <form onSubmit={handleSaveSystem} className="flex-1 flex flex-col min-h-0 space-y-4 lg:space-y-8">
                    {/* Awal Tahun Ajaran Section */}
                    <section className="space-y-4 lg:space-y-6">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Sistem Akademik</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Konfigurasi tahun ajaran & semester</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai Tahun Ajaran</label>
                                <div className="relative">
                                    <select 
                                        disabled={isReadOnly}
                                        value={systemForm.academicYearStartMonth} 
                                        onChange={e => setSystemForm({...systemForm, academicYearStartMonth: parseInt(e.target.value)})} 
                                        className={`w-full px-4 lg:px-5 py-2 lg:py-2.5 ${isReadOnly ? 'bg-slate-100/50 border-slate-200/60 text-slate-400' : 'bg-slate-50/80 border-slate-200/60 shadow-inner focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 focus:bg-white'} rounded-xl lg:rounded-2xl transition-all text-xs lg:text-sm font-bold text-slate-800 outline-none appearance-none`}
                                    >
                                        <option value={0}>JANUARI</option>
                                        <option value={1}>FEBRUARI</option>
                                        <option value={2}>MARET</option>
                                        <option value={3}>APRIL</option>
                                        <option value={4}>MEI</option>
                                        <option value={5}>JUNI</option>
                                        <option value={6}>JULI</option>
                                        <option value={7}>AGUSTUS</option>
                                        <option value={8}>SEPTEMBER</option>
                                        <option value={9}>OKTOBER</option>
                                        <option value={10}>NOVEMBER</option>
                                        <option value={11}>DESEMBER</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 rounded-xl border-2 border-slate-100 p-4 lg:p-5 space-y-3 shadow-sm">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                    <div className="w-1 h-1 rounded-full bg-jade-500" />
                                    Hasil Pembagian Semester
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between group">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Semester 1</span>
                                        <span className="text-[11px] lg:text-xs font-black text-jade-700 bg-jade-50 px-3 py-1 rounded-lg border border-jade-100">{getSemesterInfo(systemForm.academicYearStartMonth).s1}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Semester 2</span>
                                        <span className="text-[11px] lg:text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{getSemesterInfo(systemForm.academicYearStartMonth).s2}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Hari Kerja Pekanan Section */}
                    <section className="space-y-4 lg:space-y-6 pt-2 border-t border-slate-100">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Hari Kerja Pekanan</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Tentukan hari aktif setoran hafalan</p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:gap-3">
                            {days.map((day) => {
                                const isActive = systemForm.activeDays.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => toggleDay(day.id)}
                                        className={`px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl text-[10px] lg:text-[11px] font-black uppercase tracking-tight border-2 transition-all ${
                                            isActive 
                                                ? 'bg-jade-600 border-jade-600 text-white shadow-md' 
                                                : 'bg-white border-slate-400 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic opacity-60">
                            * Hari yang tidak dipilih tidak akan muncul di monitoring & input hafalan.
                        </p>
                    </section>

                    {!isReadOnly && (
                        <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                            <button 
                              type="submit"
                              className="w-full lg:w-auto flex items-center justify-center px-10 py-2.5 lg:py-3 font-black text-[10px] lg:text-xs uppercase tracking-widest lg:tracking-tight rounded-xl lg:rounded-2xl border-2 border-jade-600 bg-jade-600 text-white hover:bg-jade-700 transition-all active:scale-95 shadow-lg shadow-jade-100"
                            >
                                Simpan Konfigurasi
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
