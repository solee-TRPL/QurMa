
import React, { useEffect, useState } from 'react';
import { Settings, ChevronDown, Monitor, Globe, ShieldCheck, RefreshCcw } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings, getAllTenants } from '../../services/dataService';
import { PlatformSettings as PlatformSettingsType, Tenant, UserProfile } from '../../types';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

export const PlatformSettings: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [settings, setSettings] = useState<Partial<PlatformSettingsType>>({
    public_registration_enabled: true
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsData, tenantsData] = await Promise.all([
        getPlatformSettings(),
        getAllTenants(),
      ]);
      setSettings(settingsData);
      setTenants(tenantsData);
    } catch (error) {
      addNotification({ type: 'error', title: 'Gagal Memuat', message: 'Tidak dapat memuat pengaturan platform.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [addNotification]);
  
  const handleInputChange = (key: keyof PlatformSettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      await updatePlatformSettings(settings, user);
      addNotification({ type: 'success', title: 'Berhasil', message: 'Konfigurasi sistem telah diperbarui.' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Gagal Menyimpan', message: 'Terjadi gangguan saat sinkronisasi pengaturan.' });
    } finally {
      setGlobalLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Synchronizing Core Engine...</p>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in overflow-hidden">
      <form onSubmit={handleSave} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 overflow-hidden">
        
        {/* Left Column: Essential Branding */}
        <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Identitas Ekosistem</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Branding Platform</p>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nama Platform</label>
                    <input
                        type="text"
                        placeholder="Contoh: QurMa - Management Tahfidz Digital"
                        value={settings.platform_name || ''}
                        onChange={e => handleInputChange('platform_name', e.target.value)}
                        className="w-full px-5 py-3 bg-slate-50/50 border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all shadow-sm shadow-slate-200/50"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-3 leading-relaxed px-1">
                        Nama ini akan muncul sebagai judul aplikasi, footer laporan, dan subject otomatis pada notifikasi email.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm flex-1 flex flex-col gap-5 min-h-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Otonomi Registrasi</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Public Access Control</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl hover:bg-white hover:border-emerald-100 transition-all cursor-pointer group/toggle" onClick={() => handleInputChange('public_registration_enabled', !settings.public_registration_enabled)}>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">Pendaftaran Mandiri</span>
                            <span className="text-[10px] font-bold text-slate-400">Izinkan publik mendaftarkan diri otomatis</span>
                        </div>
                        <div className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all ${settings.public_registration_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${settings.public_registration_enabled ? 'translate-x-7' : 'translate-x-1'}`}/>
                        </div>
                    </div>

                    <div className={`transition-all ${!settings.public_registration_enabled ? 'opacity-30 pointer-events-none' : ''}`}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Institusi Default</label>
                        <div className="relative">
                            <select
                                value={settings.default_tenant_id || ''}
                                onChange={e => handleInputChange('default_tenant_id', e.target.value)}
                                disabled={!settings.public_registration_enabled}
                                className="w-full pl-5 pr-12 py-3.5 bg-slate-50/50 border-2 border-transparent rounded-2xl text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all appearance-none cursor-pointer shadow-sm shadow-slate-200/50"
                            >
                                <option value="">-- PILIH INSTITUSI TUJUAN REGISTRASI --</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed text-center">
                        Konfigurasi ini memengaruhi parameter perizinan login di seluruh ekosistem QurMa.
                    </p>
                </div>
            </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col gap-5">
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Panel Kontrol</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Executive Dashboard</p>
                    </div>
                </div>

                <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 border-2 border-indigo-100 border-dashed animate-pulse">
                        <Settings className="w-10 h-10" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[180px]">Platform Sync Ready</p>
                </div>

                <button 
                    type="submit"
                    className="w-full py-3.5 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Simpan Perubahan
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};
