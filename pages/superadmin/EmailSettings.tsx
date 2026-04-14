
import React, { useEffect, useState } from 'react';
import { Mail, Send, PlayCircle, ChevronDown, Monitor, Sparkles } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings } from '../../services/dataService';
import { PlatformSettings, UserProfile } from '../../types';
import { useLoading } from '../../lib/LoadingContext';
import { useNotification } from '../../lib/NotificationContext';

export const EmailSettings: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [settings, setSettings] = useState<Partial<PlatformSettings>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'welcome' | 'reset'>('welcome');
  const { setLoading: setGlobalLoading } = useLoading();
  const { addNotification } = useNotification();

  useEffect(() => {
    setLoading(true);
    getPlatformSettings()
      .then(setSettings)
      .catch(() => addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat memuat template email.' }))
      .finally(() => setLoading(false));
  }, [addNotification]);

  const handleInputChange = (key: keyof PlatformSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      await updatePlatformSettings(settings, user);
      addNotification({ type: 'success', title: 'Berhasil', message: 'Template email telah disimpan.' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Gagal', message: 'Tidak dapat menyimpan template email.' });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleTestSimulation = () => {
    const subjectTemplate = activeTab === 'welcome' ? settings.welcome_email_subject : settings.reset_password_subject;
    const bodyTemplate = activeTab === 'welcome' ? settings.welcome_email_body : settings.reset_password_body;

    if (!subjectTemplate || !bodyTemplate) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Subject atau Body tidak boleh kosong.' });
        return;
    }

    alert(`[SIMULASI EMAIL TERKIRIM]\n\nKepada: budi@contoh.com\nSubject: ${subjectTemplate}\n\nIsi Pesan:\n${bodyTemplate}`);
    addNotification({ type: 'success', title: 'Simulasi Terkirim', message: 'Cek popup untuk melihat hasil simulasi.' });
  };

  const placeholders = {
    welcome: ['{{user_name}}'],
    reset: ['{{user_name}}', '{{reset_link}}']
  };

  if (loading) {
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Templates...</p>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in overflow-hidden">
      <form onSubmit={handleSave} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 overflow-hidden">
        
        {/* Left Column: Template Editor */}
        <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
            <div className="bg-white rounded-3xl border-2 border-slate-50 shadow-sm flex flex-col min-h-0 overflow-hidden flex-1">
                {/* Navigation Tabs */}
                <div className="flex bg-[#F8FAFC] border-b border-slate-100 p-1.5 gap-1.5 shrink-0">
                    <button 
                        type="button" 
                        onClick={() => setActiveTab('welcome')} 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'welcome' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Penerimaan Santri
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setActiveTab('reset')} 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'reset' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Pemulihan Akses
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-4 min-h-0 overflow-hidden">
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
                                className="w-full pl-12 pr-5 py-3 bg-slate-50/50 border-2 border-transparent rounded-[18px] text-slate-800 font-bold text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all shadow-sm shadow-slate-200/50"
                            />
                        </div>
                    </div>
                    
                    <div className="group flex-1 flex flex-col min-h-0">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Konten Pesan (Body)</label>
                        <textarea
                            placeholder="Tuliskan format email di sini..."
                            value={activeTab === 'welcome' ? (settings.welcome_email_body || '') : (settings.reset_password_body || '')}
                            onChange={e => handleInputChange(activeTab === 'welcome' ? 'welcome_email_body' : 'reset_password_body', e.target.value)}
                            className="w-full flex-1 px-6 py-5 bg-slate-50/50 border-2 border-transparent rounded-[24px] text-slate-700 font-medium text-[13px] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all font-mono leading-relaxed shadow-inner scrollbar-thin scrollbar-thumb-slate-200"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Actions & Variable Selection */}
        <div className="flex flex-col gap-5 min-h-0">
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm flex flex-col gap-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
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
                            className="w-full flex justify-between items-center bg-slate-50/80 border border-slate-100 px-4 py-3 rounded-xl text-[11px] font-black text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all group/token"
                        >
                            <code className="font-mono">{p}</code>
                            <Send className="w-3 h-3 text-slate-300 group-hover/token:text-indigo-400" />
                        </button>
                    ))}
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[9px] font-bold text-amber-700 leading-relaxed text-center">
                        Variabel di atas akan otomatis digantikan oleh sistem saat pengiriman email berlangsung.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm flex flex-col gap-4 mt-auto">
                 <button 
                    type="button" 
                    onClick={handleTestSimulation}
                    className="w-full py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <PlayCircle className="w-4 h-4" />
                    Simulation Test
                </button>
                <button 
                    type="submit"
                    className="w-full py-3 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-lg shadow-indigo-100/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Save Template
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};
