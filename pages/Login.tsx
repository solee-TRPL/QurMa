
import React, { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { signIn } from '../services/authService';
import { supabase } from '../lib/supabase';
import { useNotification } from '../lib/NotificationContext';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onSwitchAccount?: (account: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchAccount }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotification();
  const formRef = useRef<HTMLFormElement>(null);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const finalEmail = (formData.get('email') as string || '').trim();
    const finalPassword = (formData.get('password') as string || '').trim();

    if (!finalEmail || !finalPassword) {
        addNotification({ type: 'error', title: 'Validasi', message: 'Email dan password wajib diisi.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
      await signIn(finalEmail, finalPassword);
    } catch (error: any) {
        setIsSubmitting(false);
        console.error("Auth Error:", error);
        addNotification({ 
            type: 'error', 
            title: 'Login Gagal', 
            message: error.message || "Email atau password salah." 
        });
    }
  };

  return (
    <div className="h-screen w-screen bg-[#F8F9FB] flex overflow-hidden animate-fade-in font-sans">
      {/* Kolom Informasi (Kiri) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative flex-col justify-center p-12 lg:p-20 overflow-hidden">
         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 -mt-24 -mr-24 w-[500px] h-[500px] bg-white/5 rounded-[100px] rotate-45 blur-2xl pointer-events-none"></div>
         <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-800/40 rounded-full blur-3xl pointer-events-none"></div>

         <div className="relative z-10 flex flex-col h-full justify-between max-w-xl mx-auto w-full">
            {/* Header / Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl flex items-center justify-center relative overflow-hidden">
                <GraduationCap className="w-6 h-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">QurMa</h2>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Tahfidz System</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="my-auto">
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.12] tracking-tight mb-4 mt-10 lg:mt-0">
                Pusat Integrasi<br />
                Manajemen<br />
                Tahfidz Anda.
              </h1>
              <p className="text-base text-indigo-100 font-medium leading-relaxed max-w-md mb-10 opacity-90">
                Masuk untuk memantau hafalan mutlak, mengelola kelas secara komprehensif, dan mendapatkan laporan perkembangan santri secara real-time.
              </p>

              {/* Footer / Social Proof */}
              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-indigo-600 flex items-center justify-center shadow-lg relative z-30">
                    <span className="text-[11px] font-black text-white">AD</span>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-600 border-2 border-indigo-600 flex items-center justify-center shadow-lg relative z-20">
                    <span className="text-[11px] font-black text-white">US</span>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-amber-500 border-2 border-indigo-600 flex items-center justify-center shadow-lg relative z-10">
                    <span className="text-[11px] font-black text-white">WS</span>
                  </div>
                </div>
                <p className="text-[13px] font-bold text-white tracking-wide leading-tight">
                  Bergabung dengan Ribuan<br/>
                  <span className="text-indigo-200 font-medium">Asatidz & Wali Santri</span>
                </p>
              </div>
            </div>
         </div>
      </div>

      {/* Kolom Form Login (Kanan) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative bg-[#F8F9FB] z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
        <div className="bg-white w-full max-w-[400px] p-8 rounded-[32px] shadow-2xl shadow-indigo-100/20 border-2 border-slate-100 relative overflow-hidden transform animate-scale-in">
          
          {/* Modern Glassmorphic Background Accents */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-white border-2 border-slate-100 shadow-xl shadow-indigo-50 rounded-[22px] flex items-center justify-center mx-auto mb-5 transition-all hover:scale-105 active:scale-95 group">
            <GraduationCap className="w-8 h-8 text-indigo-600 transition-transform duration-300 group-hover:rotate-12" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
            Masuk QurMa
          </h1>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-3 opacity-80">
            Tahfidz System Platform
          </p>
        </div>

        <div className="space-y-5 relative z-10">
          <form 
            ref={formRef}
            onSubmit={handleAuth} 
            className="space-y-4" 
            noValidate
            autoComplete="off"
          >
            <div className="group">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Email Pengguna</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                    name="email"
                    type="email" 
                    placeholder="email@sekolah.com"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-800 font-bold text-xs focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/20 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                    name="password"
                    type="password" 
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-800 font-bold text-xs focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/20 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 font-black text-[11px] uppercase tracking-tight rounded-2xl border-2 border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white shadow-xl shadow-indigo-100/50 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4" 
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-indigo-700/20 border-t-indigo-700 rounded-full animate-spin"></div>
              ) : (
                <>
                  Masuk Aplikasi
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Silakan hubungi administrator sekolah<br/>untuk mendapatkan kredensial akses
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center border-t border-slate-50 pt-6">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em]">
                &copy; 2024 QurMa SaaS • Production v1.4
            </p>
        </div>
        </div>
      </div>
    </div>
  );
};
