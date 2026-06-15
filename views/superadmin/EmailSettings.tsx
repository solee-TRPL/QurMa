
import React, { useEffect, useState } from 'react';
import { Mail, Send, PlayCircle, ChevronDown, Monitor, Sparkles, X } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings } from '../../services/dataService';
import { PlatformSettings, UserProfile } from '../../types';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

const DEFAULT_WELCOME_SUBJECT = 'Selamat Datang di Platform QurMa';
const DEFAULT_WELCOME_BODY = `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Ahlan wa sahlan! Selamat datang {{user_name}} di platform QurMa.

Akun Anda telah berhasil terdaftar sebagai santri. Anda sekarang dapat mengakses dashboard untuk mengelola program tahfidz, memantau riwayat hafalan santri, serta melihat laporan capaian harian.

Semoga Allah Subhanahu Wa Ta'ala memberikan kemudahan dan keberkahan dalam perjalanan menghafal Al-Qur'an ini.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,
Tim Administrasi QurMa`;

const DEFAULT_RESET_SUBJECT = 'Atur Ulang Kata Sandi Akun QurMa Anda';
const DEFAULT_RESET_BODY = `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. {{user_name}},

Kami menerima permintaan untuk mengatur ulang kata sandi akun QurMa Anda. Silakan klik tautan di bawah ini untuk melanjutkan proses pemulihan akses akun:

{{reset_link}}

Tautan di atas hanya berlaku selama 24 jam demi keamanan akun Anda. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dan kata sandi Anda akan tetap aman.

Wassalamu'alaikum Warahmatullahi Wabarakatuh,
Tim Keamanan QurMa`;

export const EmailSettings: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [settings, setSettings] = useState<Partial<PlatformSettings>>({});
  const [initialSettings, setInitialSettings] = useState<Partial<PlatformSettings>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'welcome' | 'reset'>('welcome');
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<{
    subject: string;
    body: string;
    recipient: string;
  }>({ subject: '', body: '', recipient: '' });

  useEffect(() => {
    setLoading(true);
    getPlatformSettings()
      .then(data => {
          const populatedData = {
              ...data,
              welcome_email_subject: data.welcome_email_subject || DEFAULT_WELCOME_SUBJECT,
              welcome_email_body: data.welcome_email_body || DEFAULT_WELCOME_BODY,
              reset_password_subject: data.reset_password_subject || DEFAULT_RESET_SUBJECT,
              reset_password_body: data.reset_password_body || DEFAULT_RESET_BODY
          };
          setSettings(populatedData);
          setInitialSettings(populatedData);
      })
      .catch(() => addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memuat template email.' }))
      .finally(() => setLoading(false));
  }, [addNotification]);

  const handleInputChange = (key: keyof PlatformSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const changedSettings: Partial<PlatformSettings> = {};
    Object.keys(settings).forEach(key => {
        const k = key as keyof PlatformSettings;
        if (settings[k] !== initialSettings[k]) {
            changedSettings[k] = settings[k] as any;
        }
    });

    if (Object.keys(changedSettings).length === 0) {
        addNotification({ type: 'info', title: 'Info', message: 'Tidak ada perubahan data yang perlu disimpan.' });
        return;
    }

    setIsSaving(true);
    try {
      await updatePlatformSettings(changedSettings, user);
      setInitialSettings(settings);
      addNotification({ type: 'success', title: 'Berhasil', message: 'Template email telah disimpan.' });
    } catch (error) {
      console.error("Email Settings Error:", error);
      addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat menyimpan template email.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSimulation = () => {
    const subjectTemplate = activeTab === 'welcome' ? settings.welcome_email_subject : settings.reset_password_subject;
    const bodyTemplate = activeTab === 'welcome' ? settings.welcome_email_body : settings.reset_password_body;

    if (!subjectTemplate || !bodyTemplate) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Subject atau Body tidak boleh kosong.' });
        return;
    }

    setSimulationData({
      subject: subjectTemplate,
      body: bodyTemplate,
      recipient: 'budi@contoh.com'
    });
    setIsSimulationOpen(true);
    addNotification({ type: 'success', title: 'Simulasi Disiapkan', message: 'Membuka modal preview simulasi email.' });
  };

  const placeholders = {
    welcome: ['{{user_name}}'],
    reset: ['{{user_name}}', '{{reset_link}}']
  };

  if (loading) {
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-jade-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Templates...</p>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in overflow-hidden pb-0">
      <form onSubmit={handleSave} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pr-0.5">
        
        {/* Left Column: Template Editor */}
        <div className="lg:col-span-2 flex flex-col gap-5 lg:min-h-0 lg:overflow-hidden shrink-0">
            <div className="bg-white rounded-xl border-2 border-slate-300 shadow-none flex flex-col lg:min-h-0 lg:overflow-hidden lg:flex-1">
                {/* Navigation Tabs */}
                <div className="flex bg-slate-100 border-b-2 border-slate-300 p-1.5 gap-1.5 shrink-0">
                    <button 
                        type="button" 
                        onClick={() => setActiveTab('welcome')} 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'welcome' ? 'bg-white text-jade-700 shadow-none border-2 border-jade-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Penerimaan Santri
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setActiveTab('reset')} 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'reset' ? 'bg-white text-jade-700 shadow-none border-2 border-jade-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Pemulihan Akses
                    </button>
                </div>

                <div className="p-4 sm:p-6 flex flex-col gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
                    <div className="group shrink-0">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Subjek Email</label>
                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Contoh: Selamat Datang di Platform QurMa"
                                value={activeTab === 'welcome' ? (settings.welcome_email_subject || '') : (settings.reset_password_subject || '')}
                                onChange={e => handleInputChange(activeTab === 'welcome' ? 'welcome_email_subject' : 'reset_password_subject', e.target.value)}
                                className="w-full pl-12 pr-5 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-800 font-bold text-sm focus:border-jade-300 focus:ring-4 focus:ring-jade-50/30 outline-none transition-all shadow-none"
                            />
                        </div>
                    </div>
                    
                    <div className="group flex flex-col lg:flex-1 lg:min-h-0">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Konten Pesan (Body)</label>
                        <textarea
                            placeholder="Tuliskan format email di sini..."
                            value={activeTab === 'welcome' ? (settings.welcome_email_body || '') : (settings.reset_password_body || '')}
                            onChange={e => handleInputChange(activeTab === 'welcome' ? 'welcome_email_body' : 'reset_password_body', e.target.value)}
                            className="w-full flex-1 min-h-[200px] lg:min-h-0 px-5 lg:px-6 py-4 lg:py-5 bg-white border-2 border-slate-300 rounded-xl text-slate-700 font-medium text-[12px] lg:text-[13px] focus:border-jade-300 focus:ring-4 focus:ring-jade-50/30 outline-none transition-all font-mono leading-relaxed shadow-none lg:scrollbar-thin lg:scrollbar-thumb-slate-200"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Actions & Variable Selection */}
        <div className="flex flex-col gap-5 min-h-0 lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            <div className="bg-white p-5 lg:p-6 rounded-xl border-2 border-slate-300 shadow-none flex flex-col gap-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-jade-50 flex items-center justify-center text-jade-600 border-2 border-jade-100">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Email Variable</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dynamic Token Injection</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    {placeholders[activeTab].map(p => (
                        <button 
                            key={p} 
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(p);
                                addNotification({ type: 'success', title: 'Token Copied', message: `Variabel ${p} siap ditempel.` });
                            }}
                            className="w-full flex justify-between items-center bg-slate-50 border-2 border-slate-200 px-4 py-3 rounded-xl text-[11px] font-black text-jade-700 hover:bg-jade-50 hover:border-jade-300 transition-all group/token shadow-none"
                        >
                            <code className="font-mono">{p}</code>
                            <Send className="w-3 h-3 text-slate-300 group-hover/token:text-jade-400" />
                        </button>
                    ))}
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                    <p className="text-[9px] font-bold text-amber-700 leading-relaxed text-center uppercase tracking-tighter">
                        Variabel di atas akan otomatis digantikan oleh sistem saat pengiriman email berlangsung.
                    </p>
                </div>
            </div>

            <div className="bg-white p-5 lg:p-6 rounded-xl border-2 border-slate-300 shadow-none flex flex-col gap-4 lg:mt-auto">
                 <button 
                    type="button" 
                    onClick={handleTestSimulation}
                    className="w-full py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-xl border-2 border-slate-300 bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <PlayCircle className="w-4 h-4" />
                    Simulation Test
                </button>
                <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-xl border-2 border-jade-400 bg-jade-50 text-jade-700 hover:bg-jade-100 shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <Send className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
                    {isSaving ? 'SAVING...' : 'SAVE TEMPLATE'}
                </button>
            </div>
        </div>
      </form>

      {/* Email Simulation Modal */}
      {isSimulationOpen && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center p-4 sm:p-6 text-slate-800 lg:pl-64 pt-16">
          {/* Cinematic Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setIsSimulationOpen(false)}
          />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="px-6 py-3.5 border-b-2 border-slate-300 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-jade-50 text-jade-600 flex items-center justify-center border-2 border-slate-100 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">
                    Simulasi Pengiriman Email
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Preview Tampilan Email Sistem
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSimulationOpen(false)} 
                className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group"
              >
                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300"/>
              </button>
            </div>

            {/* Email Client UI Envelope Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 space-y-2 flex flex-col justify-start">
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-400 uppercase tracking-wider shrink-0 text-left">Pengirim:</span>
                <span className="text-slate-700 font-black">Admin QurMa Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-400 uppercase tracking-wider shrink-0 text-left">Penerima:</span>
                <span className="bg-jade-50 text-jade-700 px-2 py-0.5 rounded border border-jade-200 font-mono text-[10px]">{simulationData.recipient}</span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                <span className="w-16 text-slate-400 uppercase tracking-wider shrink-0 mt-0.5 text-left">Subjek:</span>
                <span className="text-slate-800 font-black text-[12px]">{simulationData.subject}</span>
              </div>
            </div>

            {/* Message / Body - Styled to look like a premium email content */}
            <div className="overflow-y-auto px-6 py-6 flex-1 bg-white custom-scrollbar">
              <div className="border border-slate-200 rounded-xl p-5 lg:p-6 bg-slate-50/30 shadow-inner min-h-[200px]">
                <div className="text-[12px] lg:text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap font-sans text-left">
                  {simulationData.body}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-3.5 border-t-2 border-slate-300 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSimulationOpen(false)}
                className="px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-none active:scale-95"
              >
                Tutup Simulasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
