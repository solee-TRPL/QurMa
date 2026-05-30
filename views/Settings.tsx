
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole, Tenant } from '../types';
import { Button } from '../components/ui/Button';
import { User, Lock, Building, Upload, Shield, Settings2, Clock, Check, ChevronDown, Calendar, RefreshCw } from 'lucide-react';
import { updateUser, uploadAvatar, updateTenant, uploadLogo, getStudentById, updateStudent, getStudents } from '../services/dataService';
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
    nik: user.nik || '',
    // Student specific fields
    father_name: '',
    mother_name: '',
    father_phone: '',
    mother_phone: '',
    address: '',
    village: '',
    district: '',
    city: '',
    province: '',
    provinceId: '',
    regencyId: '',
    districtId: '',
    villageId: ''
  });

  const [regions, setRegions] = useState<{
    provinces: {id: string, name: string}[],
    regencies: {id: string, name: string}[],
    districts: {id: string, name: string}[],
    villages: {id: string, name: string}[]
  }>({ provinces: [], regencies: [], districts: [], villages: [] });

  const fetchProvinces = async () => {
    try {
        const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const data = await res.json();
        setRegions(prev => ({ ...prev, provinces: data }));
    } catch (e) { console.error(e); }
  };

  const onProvinceChange = async (provId: string, provName: string) => {
    setProfileForm(prev => ({ ...prev, provinceId: provId, province: provName, regencyId: '', districtId: '', villageId: '', city: '', district: '', village: '' }));
    try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
        const data = await res.json();
        setRegions(prev => ({ ...prev, regencies: data, districts: [], villages: [] }));
    } catch (e) { console.error(e); }
  };

  const onRegencyChange = async (regId: string, regName: string) => {
    const cleanedCity = regName.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, '').trim();
    setProfileForm(prev => ({ ...prev, regencyId: regId, districtId: '', villageId: '', city: cleanedCity, district: '', village: '' }));
    try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regId}.json`);
        const data = await res.json();
        setRegions(prev => ({ ...prev, districts: data, villages: [] }));
    } catch (e) { console.error(e); }
  };

  const onDistrictChange = async (distId: string, distName: string) => {
    setProfileForm(prev => ({ ...prev, districtId: distId, villageId: '', district: distName, village: '' }));
    try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${distId}.json`);
        const data = await res.json();
        setRegions(prev => ({ ...prev, villages: data }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
        fetchProvinces();
    }
  }, [activeTab]);

  useEffect(() => {
    if (regions.provinces.length > 0 && profileForm.province && !profileForm.provinceId) {
        const found = regions.provinces.find(p => p.name.toUpperCase() === profileForm.province.toUpperCase());
        if (found) {
            onProvinceChange(found.id, found.name);
        }
    }
  }, [regions.provinces, profileForm.province, profileForm.provinceId]);

  useEffect(() => {
    if (regions.regencies.length > 0 && profileForm.city && !profileForm.regencyId) {
        const cityToMatch = profileForm.city.toUpperCase();
        const found = regions.regencies.find(r => r.name.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, '').trim().toUpperCase() === cityToMatch);
        if (found) {
            const cleanedName = found.name.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, '').trim();
            onRegencyChange(found.id, cleanedName);
        }
    }
  }, [regions.regencies, profileForm.city, profileForm.regencyId]);

  useEffect(() => {
    if (regions.districts.length > 0 && profileForm.district && !profileForm.districtId) {
        const found = regions.districts.find(d => d.name.toUpperCase() === profileForm.district.toUpperCase());
        if (found) {
            onDistrictChange(found.id, found.name);
        }
    }
  }, [regions.districts, profileForm.district, profileForm.districtId]);

  useEffect(() => {
    if (regions.villages.length > 0 && profileForm.village && !profileForm.villageId) {
        const found = regions.villages.find(v => v.name.toUpperCase() === profileForm.village.toUpperCase());
        if (found) {
            setProfileForm(prev => ({ ...prev, villageId: found.id, village: found.name }));
        }
    }
  }, [regions.villages, profileForm.village, profileForm.villageId]);

  // Update state to include oldPassword
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [tenantForm, setTenantForm] = useState({ name: '' });
  const [systemForm, setSystemForm] = useState<{
    academicYearStartMonth: number;
    activeDays: number[];
    activePeriods: { startDate: string; endDate: string; }[];
  }>({ 
    academicYearStartMonth: 6, // Default July (0-indexed)
    activeDays: [1, 2, 3, 4, 5], // Default Mon-Fri
    activePeriods: [{ startDate: '', endDate: '' }]
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  
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
                    village: student?.village || '',
                    district: student?.district || '',
                    city: student?.city || '',
                    province: student?.province || '',
                    provinceId: '',
                    regencyId: '',
                    districtId: '',
                    villageId: ''
                }));
                return;
            }
        }
        setProfileForm(prev => ({
            ...prev,
            fullName: user.full_name,
            phone: user.whatsapp_number || '',
            role: user.role,
            nik: user.nik || ''
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
          setTenantForm({ name: tenant.name || '' });
          if (tenant.cycle_config) {
              const loadedPeriods = tenant.cycle_config.activePeriods && tenant.cycle_config.activePeriods.length > 0 
                ? tenant.cycle_config.activePeriods 
                : [{ startDate: '', endDate: '' }];
                
              setSystemForm({
                  academicYearStartMonth: tenant.cycle_config.academicYearStartMonth ?? 6,
                  activeDays: tenant.cycle_config.activeDays ?? [1, 2, 3, 4, 5],
                  activePeriods: loadedPeriods
              });
          }
      }
  }, [tenant]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    try {
        // 1. Update User Table (Auth User) - REMOVE role from update as it's restricted
        const updatedUser = await updateUser({
            id: user.id,
            full_name: profileForm.fullName,
            whatsapp_number: profileForm.phone,
            ...(user.role === UserRole.TEACHER ? { nik: profileForm.nik } : {}),
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
        setIsSavingProfile(false);
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

    setIsSavingSecurity(true);
    
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
        setIsSavingSecurity(false);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tenant) return;
      setIsSavingTenant(true);

      try {
        const updatedTenant = await updateTenant(tenant.id, { name: tenantForm.name }, user);
        if (onTenantUpdate) {
            onTenantUpdate(updatedTenant);
        }
        addNotification({ type: 'success', title: 'Berhasil', message: 'Pengaturan sekolah telah disimpan.' });
      } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan nama sekolah.' });
      } finally {
        setIsSavingTenant(false);
      }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSavingSystem(true);

    try {
        const updatedTenant = await updateTenant(tenant.id, { 
            cycle_config: { 
                ...tenant.cycle_config,
                academicYearStartMonth: systemForm.academicYearStartMonth,
                activeDays: systemForm.activeDays,
                activePeriods: systemForm.activePeriods
            } 
        }, user);
        if (onTenantUpdate) {
            onTenantUpdate(updatedTenant);
        }
        addNotification({ type: 'success', title: 'Berhasil', message: 'Pengaturan sistem telah diperbarui.' });
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal menyimpan pengaturan sistem.' });
    } finally {
        setIsSavingSystem(false);
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
    { id: 1, label: 'Senin' }, { id: 2, label: 'Selasa' }, { id: 3, label: 'Rabu' },
    { id: 4, label: 'Kamis' }, { id: 5, label: 'Jumat' }, { id: 6, label: 'Sabtu' }, { id: 0, label: 'Minggu' }
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto pb-2 overflow-hidden">
      {/* Control Strip TABS - Optimized for Mobile */}
      <div className="flex justify-start mb-4 lg:mb-6 shrink-0 px-2 lg:px-0">
        <div className="flex items-center gap-0.5 lg:gap-1 p-0.5 lg:p-1 bg-slate-100/50 border-2 border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden">
          <button 
            onClick={() => handleTabChange('profile')}
            className={`flex-1 px-2 lg:px-6 py-1.5 lg:py-2 text-[8.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-xl border-2 transition-all ${activeTab === 'profile' ? 'border-slate-300 bg-white text-jade-600' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            <div className="flex items-center justify-center gap-1 lg:gap-1.5">
                <User className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                Profil
            </div>
          </button>
          <button 
            onClick={() => handleTabChange('security')}
            className={`flex-1 px-2 lg:px-6 py-1.5 lg:py-2 text-[8.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-xl border-2 transition-all ${activeTab === 'security' ? 'border-slate-300 bg-white text-jade-600' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
          >
            <div className="flex items-center justify-center gap-1 lg:gap-1.5">
                <Shield className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                Keamanan
            </div>
          </button>
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => handleTabChange('tenant')}
              className={`flex-1 px-2 lg:px-6 py-1.5 lg:py-2 text-[8.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-xl border-2 transition-all ${activeTab === 'tenant' ? 'border-slate-300 bg-white text-jade-600' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
            >
              <div className="flex items-center justify-center gap-1 lg:gap-1.5">
                  <Building className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                  Sekolah
              </div>
            </button>
          )}
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => handleTabChange('system')}
              className={`flex-1 px-2 lg:px-6 py-1.5 lg:py-2 text-[8.5px] lg:text-[11px] font-black uppercase tracking-tight rounded-xl border-2 transition-all ${activeTab === 'system' ? 'border-slate-300 bg-white text-jade-600' : 'border-transparent text-slate-400 hover:text-slate-500 hover:bg-white/50'}`}
            >
              <div className="flex items-center justify-center gap-1 lg:gap-1.5">
                  <Settings2 className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                  Sistem
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-0">
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col min-h-0 gap-4">
                    <div className="max-w-2xl flex flex-row items-center gap-4 lg:gap-6 shrink-0">
                        <div className="relative group shrink-0">
                            <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white rounded-xl lg:rounded-xl flex items-center justify-center text-slate-300 text-xl lg:text-2xl font-black border-2 border-slate-300 overflow-hidden group-hover:scale-95 transition-transform duration-500">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.full_name.charAt(0)}</span>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-1.5 lg:p-2 bg-jade-600 text-white rounded-xl shadow-none hover:bg-jade-700 transition-all active:scale-90"
                            >
                                <Upload className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5" />
                            </button>
                        </div>
                        <div className="text-left py-1 flex-1">
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                            <h3 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate max-w-50 lg:max-w-none">{user.full_name}</h3>
                            <p className="text-[9px] lg:text-[11px] font-black text-jade-600 mt-1 uppercase tracking-widest leading-none px-2 lg:py-1.5 bg-jade-50 border border-jade-100/50 rounded-xl w-fit">
                                {user.role === UserRole.ADMIN ? 'Admin' : 
                                 user.role === UserRole.TEACHER ? 'Ustadz' :
                                 user.role === UserRole.SANTRI ? 'Santri' :
                                 user.role === UserRole.SUPERVISOR ? 'Supervisor' :
                                 user.role === UserRole.SUPERADMIN ? 'Superadmin' : user.role}
                            </p>
                        </div>
                    </div>

                    <div className="max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4 lg:gap-y-4 pt-3 lg:pt-4 border-t border-slate-100 overflow-y-auto lg:overflow-visible pr-1 custom-scrollbar">
                        <div className="space-y-1.5">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <input 
                                type="text" 
                                value={profileForm.fullName} 
                                onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} 
                                className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-none focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Locked)</label>
                            <input 
                                type="email" 
                                disabled 
                                value={user.email} 
                                className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50 border-2 border-slate-300 text-slate-400 rounded-xl cursor-not-allowed text-[10px] lg:text-[11px] font-black uppercase tracking-widest outline-none opacity-80" 
                            />
                        </div>
                        {user.role !== UserRole.SANTRI && (
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                                <input 
                                    type="tel" 
                                    value={profileForm.phone} 
                                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-none focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
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
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50 border-2 border-slate-300 text-slate-400 rounded-xl cursor-not-allowed text-[10px] lg:text-[11px] font-black uppercase tracking-widest outline-none appearance-none"
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

                        {/* NIK & NIP — khusus Teacher */}
                        {user.role === UserRole.TEACHER && (
                            <>
                                {/* NIK — editable oleh teacher */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK <span className="normal-case font-medium text-slate-300">(Nomor Induk Kependudukan)</span></label>
                                    <input 
                                        type="text"
                                        maxLength={16}
                                        value={profileForm.nik}
                                        onChange={e => setProfileForm({...profileForm, nik: e.target.value.replace(/\D/g, '')})}
                                        placeholder="16 digit NIK..."
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-none focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300"
                                    />
                                </div>
                                {/* NIP — readonly, style seperti Role Utama */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">NIP <span className="normal-case font-medium text-slate-300">(Nomor Induk Pegawai)</span></label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            readOnly
                                            disabled
                                            value={user.nip || '-'} 
                                            className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-slate-50 border-2 border-slate-300 text-slate-400 rounded-xl cursor-not-allowed text-[10px] lg:text-[11px] font-black uppercase tracking-widest outline-none appearance-none opacity-100"
                                        />
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-300" />
                                    </div>
                                </div>
                            </>
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
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Ibu</label>
                                    <input 
                                        type="text" 
                                        value={profileForm.mother_name} 
                                        onChange={e => setProfileForm({...profileForm, mother_name: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Ayah</label>
                                    <input 
                                        type="tel" 
                                        value={profileForm.father_phone} 
                                        onChange={e => setProfileForm({...profileForm, father_phone: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Ibu</label>
                                    <input 
                                        type="tel" 
                                        value={profileForm.mother_phone} 
                                        onChange={e => setProfileForm({...profileForm, mother_phone: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Provinsi</label>
                                    <div className="relative">
                                        <select 
                                            value={profileForm.provinceId} 
                                            onChange={e => {
                                                const name = regions.provinces.find(p => p.id === e.target.value)?.name || '';
                                                onProvinceChange(e.target.value, name);
                                            }} 
                                            className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black tracking-widest text-slate-700 outline-none appearance-none"
                                        >
                                            <option value="">{profileForm.province || 'PILIH PROVINSI'}</option>
                                            {regions.provinces.map(prov => (
                                                <option key={prov.id} value={prov.id}>{prov.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kota / Kabupaten</label>
                                    <div className="relative">
                                        <select 
                                            disabled={!profileForm.provinceId}
                                            value={profileForm.regencyId} 
                                            onChange={e => {
                                                const name = regions.regencies.find(r => r.id === e.target.value)?.name || '';
                                                onRegencyChange(e.target.value, name);
                                            }} 
                                            className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black tracking-widest text-slate-700 outline-none appearance-none disabled:opacity-50"
                                        >
                                            <option value="">{profileForm.city || 'PILIH KOTA/KABUPATEN'}</option>
                                            {regions.regencies.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name.replace(/^(KABUPATEN|KOTA|KAB\.|KAB)\s+/i, '').trim()}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                                    <div className="relative">
                                        <select 
                                            disabled={!profileForm.regencyId}
                                            value={profileForm.districtId} 
                                            onChange={e => {
                                                const name = regions.districts.find(d => d.id === e.target.value)?.name || '';
                                                onDistrictChange(e.target.value, name);
                                            }} 
                                            className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black tracking-widest text-slate-700 outline-none appearance-none disabled:opacity-50"
                                        >
                                            <option value="">{profileForm.district || 'PILIH KECAMATAN'}</option>
                                            {regions.districts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelurahan / Desa</label>
                                    <div className="relative">
                                        <select 
                                            disabled={!profileForm.districtId}
                                            value={profileForm.villageId} 
                                            onChange={e => {
                                                const name = regions.villages.find(v => v.id === e.target.value)?.name || '';
                                                setProfileForm({...profileForm, villageId: e.target.value, village: name});
                                            }} 
                                            className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none disabled:opacity-50"
                                        >
                                            <option value="">{profileForm.village || 'PILIH KELURAHAN/DESA'}</option>
                                            {regions.villages.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                                    <textarea 
                                        value={profileForm.address} 
                                        placeholder="Nama jalan, nomor rumah, dusun, rt/rw, dsb."
                                        onChange={e => setProfileForm({...profileForm, address: e.target.value})} 
                                        className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none min-h-20 placeholder:font-black placeholder:text-slate-300" 
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                        <button 
                          type="submit"
                          disabled={isSavingProfile}
                          className="h-10 w-full lg:w-auto flex items-center justify-center gap-2 px-6 lg:px-10 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isSavingProfile ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Menyimpan</> : 'Update Profil'}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'security' && (
                <form onSubmit={handleSaveSecurity} className="flex-1 flex flex-col min-h-0 gap-4">
                    <div className="max-w-2xl flex flex-col gap-4 overflow-y-auto lg:overflow-visible pr-1 custom-scrollbar">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Keamanan</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Kelola kata sandi dan akses akun</p>
                        </div>
                        
                        <div className="space-y-1.5 pt-1">
                            <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Saat Ini</label>
                            <div className="relative">
                                <Lock className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-3.5 lg:w-4 h-3.5 lg:h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    required 
                                    value={passwordForm.oldPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} 
                                    className="w-full pl-10 lg:pl-12 pr-4 lg:pr-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-none focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-2">
                            <div className="space-y-1.5">
                                <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6} 
                                    value={passwordForm.newPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-none focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
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
                                    className="w-full px-4 lg:px-5 py-2 lg:py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-none focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400 transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none placeholder:font-black placeholder:text-slate-300" 
                                />
                            </div>
                        </div>
                        
                        <div className="bg-jade-50/50 py-2 lg:py-2 px-4 lg:px-4 rounded-xl border border-jade-100/50 flex gap-3 lg:gap-4">
                             <div>
                                <h4 className="text-[9px] lg:text-[10px] font-black text-jade-900 tracking-tight uppercase">Proteksi Maksimal</h4>
                                <p className="text-[8.5px] lg:text-[10px] font-bold text-jade-700/70 mt-0.5 leading-relaxed">Kombinasikan simbol, angka, dan huruf kapital.</p>
                             </div>
                        </div>
                    </div>

                    <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                        <button 
                          type="submit"
                          disabled={isSavingSecurity}
                          className="h-10 w-full lg:w-auto flex items-center justify-center gap-2 px-6 lg:px-10 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isSavingSecurity ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Menyimpan</> : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'tenant' && (
                <form onSubmit={handleSaveTenant} className="flex-1 flex flex-col min-h-0 gap-4">
                    <section className="max-w-2xl flex flex-col gap-4 overflow-y-auto lg:overflow-visible pr-1 custom-scrollbar">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Sekolah</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Identitas lembaga pendidikan</p>
                        </div>
                        
                        <div className="flex flex-row items-center gap-4 lg:gap-6 shrink-0">
                            <div className="relative group shrink-0">
                                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-xl flex items-center justify-center text-slate-300 text-xl lg:text-3xl font-black border-2 border-slate-300 overflow-hidden group-hover:scale-95 transition-transform duration-500">
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
                                        className="absolute -bottom-1 -right-1 p-1.5 lg:p-2 bg-emerald-600 text-white rounded-xl shadow-none hover:bg-emerald-700 transition-all active:scale-90"
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
                                className={`w-full px-4 lg:px-5 py-2 lg:py-2.5 ${isReadOnly ? 'bg-slate-50 border-2 border-slate-200 text-slate-400' : 'bg-white border-2 border-slate-300 focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400'} rounded-xl transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none`} 
                            />
                        </div>
                    </section>
                    {!isReadOnly && (
                        <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                            <button 
                              type="submit"
                              disabled={isSavingTenant}
                              className="h-10 w-full lg:w-auto flex items-center justify-center gap-2 px-6 lg:px-10 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {isSavingTenant ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Menyimpan</> : 'Simpan Setting'}
                            </button>
                        </div>
                    )}
                </form>
            )}

            {activeTab === 'system' && (
                <form onSubmit={handleSaveSystem} className="flex-1 flex flex-col min-h-0 gap-4">
                    <section className="max-w-2xl flex flex-col gap-4">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Sistem Akademik</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Konfigurasi tahun ajaran & semester</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-end gap-2 lg:gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai Tahun Ajaran</label>
                                    <div className="relative">
                                        <select 
                                            disabled={isReadOnly}
                                            value={systemForm.academicYearStartMonth} 
                                            onChange={e => setSystemForm({...systemForm, academicYearStartMonth: parseInt(e.target.value)})} 
                                            className={`w-full px-4 lg:px-5 py-2 lg:py-2.5 ${isReadOnly ? 'bg-slate-50 border-2 border-slate-200 text-slate-400' : 'bg-white border-2 border-slate-300 focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400'} rounded-xl transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none`}
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
                                <div className="flex-1"></div>
                                {!isReadOnly && <div className="w-8.5 lg:w-9.5 shrink-0"></div>}
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-2">
                                <div className="flex items-center justify-between pb-2">
                                    <label className="text-[9px] lg:text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Masa Aktif Tahun Ajaran</label>
                                </div>
                                
                                {systemForm.activePeriods.length === 0 ? (
                                    <p className="text-[10px] lg:text-[11px] font-medium text-slate-400 italic px-2 py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
                                        Belum ada masa aktif yang diatur. Tahun ajaran akan dianggap non-aktif.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {systemForm.activePeriods.map((period, idx) => (
                                            <div key={idx} className="flex items-end gap-2 lg:gap-3">
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-[8.5px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai Periode {idx + 1}</label>
                                                    <input 
                                                        type="date"
                                                        disabled={isReadOnly}
                                                        value={period.startDate} 
                                                        onChange={e => {
                                                            const newPeriods = [...systemForm.activePeriods];
                                                            newPeriods[idx] = { ...newPeriods[idx], startDate: e.target.value };
                                                            setSystemForm({...systemForm, activePeriods: newPeriods});
                                                        }} 
                                                        className={`w-full px-3 lg:px-4 py-1.5 lg:py-2 ${isReadOnly ? 'bg-slate-100 border-2 border-slate-200 text-slate-400' : 'bg-white border-2 border-slate-300 focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400'} rounded-xl transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none h-8.5 lg:h-9.5`}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-[8.5px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Selesai Periode {idx + 1}</label>
                                                    <input 
                                                        type="date"
                                                        disabled={isReadOnly}
                                                        value={period.endDate} 
                                                        onChange={e => {
                                                            const newPeriods = [...systemForm.activePeriods];
                                                            newPeriods[idx] = { ...newPeriods[idx], endDate: e.target.value };
                                                            setSystemForm({...systemForm, activePeriods: newPeriods});
                                                        }} 
                                                        className={`w-full px-3 lg:px-4 py-1.5 lg:py-2 ${isReadOnly ? 'bg-slate-100 border-2 border-slate-200 text-slate-400' : 'bg-white border-2 border-slate-300 focus:ring-4 focus:ring-jade-50/50 focus:border-jade-400'} rounded-xl transition-all text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none h-8.5 lg:h-9.5`}
                                                    />
                                                </div>
                                                {!isReadOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSystemForm(prev => ({
                                                            ...prev,
                                                            activePeriods: prev.activePeriods.filter((_, i) => i !== idx)
                                                        }))}
                                                        className="w-8.5 lg:w-9.5 h-8.5 lg:h-9.5 border-2 border-slate-300 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-red-500 transition-colors shrink-0"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {!isReadOnly && (
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSystemForm(prev => ({
                                                ...prev,
                                                activePeriods: [...prev.activePeriods, { startDate: '', endDate: '' }]
                                            }))}
                                            className="w-full lg:w-auto h-10 px-6 lg:px-10 bg-white border-2 border-jade-500 text-jade-600 rounded-xl hover:bg-jade-50 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-none"
                                        >
                                            + Tambah Periode
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                <div className="bg-white rounded-sm border-2 border-slate-400 overflow-hidden">
                                    <table className="min-w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-300">
                                            <th className="px-4 py-2.5 text-left text-[9px] font-black text-slate-800 uppercase tracking-[0.2em] border-b border-r border-slate-200">Semester 1</th>
                                            <th className="px-4 py-2.5 text-left text-[9px] font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-200">Semester 2</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-4 py-3.5 text-[11px] font-black text-jade-700 bg-white border-r border-slate-100 uppercase tracking-tight">
                                                {getSemesterInfo(systemForm.academicYearStartMonth).s1}
                                            </td>
                                            <td className="px-4 py-3.5 text-[11px] font-black text-emerald-700 bg-white uppercase tracking-tight">
                                                {getSemesterInfo(systemForm.academicYearStartMonth).s2}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Hari Kerja Pekanan Section */}
                    <section className="max-w-2xl flex flex-col gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1 shrink-0">
                             <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-tight">Hari Kerja Pekanan</h3>
                             <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 lg:pb-2">Tentukan hari aktif setoran hafalan</p>
                        </div>

                        <div className="flex flex-row items-center gap-1 lg:gap-2 overflow-hidden">
                            {days.map((day) => {
                                const isActive = systemForm.activeDays.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => toggleDay(day.id)}
                                        className={`flex-1 px-1 lg:px-2 py-2 lg:py-2.5 rounded-xl text-[8.5px] lg:text-[9.5px] font-black uppercase tracking-widest border-2 transition-all h-9 lg:h-auto flex items-center justify-center ${
                                            isActive 
                                                ? 'bg-jade-600 border-jade-600 text-white' 
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-jade-200'
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight italic opacity-60">
                            * Hari yang tidak dipilih tidak akan muncul di monitoring & input hafalan.
                        </p>
                    </section>

                    {!isReadOnly && (
                        <div className="pt-2 lg:pt-2 flex justify-start shrink-0">
                            <button 
                              type="submit"
                              disabled={isSavingSystem}
                              className="h-10 w-full lg:w-auto flex items-center justify-center gap-2 px-6 lg:px-10 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-jade-600 bg-jade-600 text-white shadow-none hover:bg-jade-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {isSavingSystem ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/> Menyimpan</> : 'Simpan Konfigurasi'}
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
