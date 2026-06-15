import React, { useEffect, useState } from "react";
import { Settings, Monitor, ShieldCheck, RefreshCcw } from "lucide-react";
import { getPlatformSettings, updatePlatformSettings } from "../../services/dataService";
import { PlatformSettings as PlatformSettingsType, UserProfile } from "../../types";
import { useLoading } from "../../lib/LoadingContext";
import { useNotification } from "../../lib/NotificationContext";
import { useAuth } from "../../lib/AuthContext";

export const PlatformSettings: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [settings, setSettings] = useState<Partial<PlatformSettingsType>>({
    public_registration_enabled: true,
  });
  const [initialSettings, setInitialSettings] = useState<Partial<PlatformSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();
  const { updatePlatformName } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsData = await getPlatformSettings();
      setSettings(settingsData);
      setInitialSettings(settingsData);
    } catch (error) {
      addNotification({ type: "error", title: "Gagal Memuat", message: "Tidak dapat memuat pengaturan platform." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [addNotification]);

  const handleInputChange = (key: keyof PlatformSettingsType, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const changedSettings: Partial<PlatformSettingsType> = {};
    Object.keys(settings).forEach((key) => {
      const k = key as keyof PlatformSettingsType;
      if (settings[k] !== initialSettings[k]) {
        changedSettings[k] = settings[k] as any;
      }
    });

    if (Object.keys(changedSettings).length === 0) {
      addNotification({ type: "info", title: "Info", message: "Tidak ada perubahan data yang perlu disimpan." });
      return;
    }

    setIsSaving(true);
    try {
      await updatePlatformSettings(changedSettings, user);
      setInitialSettings(settings);
      if (changedSettings.platform_name) {
        updatePlatformName(changedSettings.platform_name);
      }
      addNotification({ type: "success", title: "Berhasil", message: "Konfigurasi sistem telah diperbarui." });
    } catch (error) {
      console.error("Platform Settings Error:", error);
      addNotification({ type: "error", title: "Gagal Menyimpan", message: "Terjadi gangguan saat sinkronisasi pengaturan." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-jade-600 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Synchronizing Core Engine...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in overflow-hidden pb-0">
      <form onSubmit={handleSave} className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-2 sm:gap-5 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pr-0.5">
        {/* Left Column: Essential Branding */}
        <div className="lg:col-span-2 flex flex-col gap-2 sm:gap-5 lg:min-h-0 lg:overflow-y-auto lg:pr-2 custom-scrollbar shrink-0">
          <div className="bg-white p-3 sm:p-5 lg:p-6 rounded-xl border-2 border-slate-300 shadow-none flex flex-col gap-2.5 sm:gap-5">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-jade-50 flex items-center justify-center text-jade-600 border-2 border-jade-100 shrink-0">
                <Monitor className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-[11px] sm:text-[14px] font-black text-slate-800 uppercase tracking-tight">Identitas Ekosistem</h4>
                <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Branding Platform</p>
              </div>
            </div>

            <div className="group">
              <label className="block text-[7.5px] sm:text-[10px] font-black text-slate-400 uppercase mb-0.5 sm:mb-2 ml-1">Nama Platform</label>
              <input
                type="text"
                placeholder="Contoh: QurMa - Management Tahfidz Digital"
                value={settings.platform_name || ""}
                onChange={(e) => handleInputChange("platform_name", e.target.value)}
                className="w-full px-3 py-1.5 sm:px-5 sm:py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-[11px] sm:text-sm focus:border-jade-300 focus:ring-4 focus:ring-jade-50/30 outline-none transition-all shadow-none"
              />
              <p className="text-[7.5px] sm:text-[10px] text-slate-400 font-bold mt-1 sm:mt-3 leading-relaxed px-1">Nama ini akan muncul sebagai judul aplikasi, footer laporan, dan subject otomatis pada notifikasi email.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col gap-2 sm:gap-5 shrink-0">
          <div className="bg-white p-3 sm:p-5 lg:p-6 rounded-xl border-2 border-slate-300 shadow-none flex flex-col gap-2 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border-2 border-slate-200 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-[10.5px] sm:text-[12px] font-black text-slate-800 uppercase tracking-tight">Panel Kontrol</h4>
                <p className="text-[7px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Executive Dashboard</p>
              </div>
            </div>

            <div className="py-2 sm:py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 sm:w-20 sm:h-20 bg-jade-50 rounded-full flex items-center justify-center text-jade-600 mb-1.5 sm:mb-6 border-2 border-jade-100 border-dashed animate-pulse shrink-0">
                <Settings className="w-5 h-5 sm:w-10 sm:h-10" />
              </div>
              <p className="text-[8px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest max-45">Platform Sync Ready</p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 sm:py-3.5 px-4 sm:px-6 font-black text-[9px] sm:text-[11px] uppercase tracking-tight rounded-xl border-2 border-jade-400 bg-jade-50 text-jade-700 hover:bg-jade-100 shadow-none transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              <RefreshCcw className={`w-3 h-3 sm:w-4 sm:h-4 ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
