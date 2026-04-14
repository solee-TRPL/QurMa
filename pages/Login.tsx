
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
    <div className="h-screen w-screen bg-[#F8F9FB] flex items-center justify-center p-4 overflow-hidden animate-fade-in font-sans">
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
  );
};
