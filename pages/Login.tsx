import React, { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { signIn, signUp } from '../services/authService';
import { supabase } from '../lib/supabase';
import { useNotification } from '../lib/NotificationContext';
import { GraduationCap, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import { getSuperAdminStats } from '../services/dataService';
import { SuperAdminStats, UserRole } from '../types';

interface LoginProps {
  onSwitchAccount?: (account: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchAccount }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const { addNotification } = useNotification();
  const formRef = useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    getSuperAdminStats().then(s => {
      setStats(s);
      if (s && s.totalUsers === 0) {
        setIsSignUp(true);
      }
    });
  }, []);

  // Reset form fields on every mount to prevent browser autofill
  React.useEffect(() => {
    if (formRef.current) {
      formRef.current.reset();
    }
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const finalEmail = (formData.get('email') as string || '').trim();
    const finalPassword = (formData.get('password') as string || '').trim();

    if (!finalEmail) {
        addNotification({ type: 'error', title: 'Email Kosong', message: 'Silakan masukkan alamat email Anda.' });
        return;
    }
    
    if (!finalEmail.includes('@')) {
        addNotification({ type: 'error', title: 'Format Email', message: 'Format email tidak valid (contoh: nama@qurma.com).' });
        return;
    }

    if (!finalPassword) {
        addNotification({ type: 'error', title: 'Password Kosong', message: 'Silakan masukkan kata sandi Anda.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        const fullName = formData.get('full_name') as string || 'Superadmin';
        await signUp(finalEmail, finalPassword, fullName, '');
        addNotification({ type: 'success', title: 'Registrasi Berhasil', message: 'Anda sekarang adalah Superadmin platform.' });
      } else {
        await signIn(finalEmail, finalPassword);
      }
    } catch (error: any) {
        setIsSubmitting(false);
        const msg = error.message?.toLowerCase() || "";
        
        let title = "Login Gagal";
        let finalMessage = "Terjadi kesalahan saat masuk. Silakan cek koneksi Anda.";

        if (msg.includes("invalid login credentials")) {
            finalMessage = "Email atau kata sandi yang Anda masukkan salah.";
        } else if (msg.includes("email") && (msg.includes("invalid") || msg.includes("format"))) {
            title = "Email Tidak Sah";
            finalMessage = "Format penulisan email salah (contoh: nama@gmail.com).";
        } else if (msg.includes("6 characters") || msg.includes("weak password")) {
            title = "Sandi Terlalu Lemah";
            finalMessage = "Kata sandi minimal harus 6 karakter.";
        } else if (msg.includes("database error") || msg.includes("saving new user")) {
            title = "Gangguan Database";
            finalMessage = "Gagal mendaftarkan profil ke tabel database. Mohon hubungi pusat.";
        } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
            title = "Terlalu Banyak Mencoba";
            finalMessage = "Silakan tunggu beberapa menit sebelum mencoba masuk lagi.";
        } else if (error.message) {
            finalMessage = error.message;
        }

        addNotification({ 
            type: 'error', 
            title: title, 
            message: finalMessage 
        });
    }
  };

  return (
    <div className="h-screen w-screen bg-[#F8F9FB] flex overflow-hidden font-sans">
      
      {/* --- LEFT SIDE: PREMIUM BRANDING (INFORMATIVE & DENSE) --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-700 relative items-center justify-center p-20 overflow-hidden border-r-4 border-indigo-800/20">
        
        {/* Subtle Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-20 w-full max-w-md animate-in slide-in-from-left duration-700">
           <div className="text-left">
               <div className="w-12 h-12 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                   <GraduationCap className="w-6 h-6 text-white" />
               </div>

               <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-3">
                  Sistem Tahfidz Terpadu
               </h2>
               <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] opacity-90 mb-6">
                  Monitoring & Penilaian Real-time
               </p>

               <p className="text-[10px] text-white/70 font-medium leading-relaxed mb-10 max-w-sm">
                  QurMa menyediakan solusi digital komprehensif untuk memudahkan sekolah dalam memantau perkembangan hafalan santri secara akurat, meningkatkan transparansi antara guru dan wali santri.
               </p>

               {/* Density Layer: More Features */}
               <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-12">
                   {[
                       { title: 'Digital Monitoring', desc: 'Pantau setoran harian secara instan.' },
                       { title: 'Smart Target', desc: 'Atur target mingguan yang personal.' },
                       { title: 'Validasi Data', desc: 'Hasil penilaian yang terstandarisasi.' },
                       { title: 'Laporan Otomatis', desc: 'E-Sertifikat dan raport berkala.' }
                   ].map((item, i) => (
                       <div key={item.title} className="group">
                           <div className="flex items-center gap-2 mb-2 text-white">
                               <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                               <span className="text-[9px] font-black uppercase tracking-widest">{item.title}</span>
                           </div>
                           <p className="text-[8px] font-bold text-white/40 uppercase tracking-wide leading-tight group-hover:text-white/60 transition-colors">
                              {item.desc}
                           </p>
                       </div>
                   ))}
               </div>

               {/* Density Layer: Stats Grid */}
               <div className="border-t border-white/10 pt-8 flex gap-4">
                    {[
                       { 
                           val: stats ? (stats.totalTenants > 0 ? `${stats.totalTenants}` : '0') : '...', 
                           lab: 'Sekolah' 
                       },
                       { 
                           val: stats ? (stats.totalTeachers < 1000 ? stats.totalTeachers.toString() : (stats.totalTeachers / 1000).toFixed(1) + 'k') : '...', 
                           lab: 'Guru' 
                       },
                       { 
                           val: stats ? (stats.totalStudents < 1000 ? stats.totalStudents.toString() : (stats.totalStudents / 1000).toFixed(1) + 'k') : '...', 
                           lab: 'Santri' 
                       }
                   ].map(stat => (
                       <div key={stat.lab}>
                            <h4 className="text-sm font-black text-white leading-none mb-1">{stat.val}</h4>
                            <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">{stat.lab}</p>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: THE ORIGINAL LOGIN FORM (50% WIDTH) --- */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 bg-[#F8F9FB] relative">
        <div className="bg-white w-full max-w-[400px] p-8 rounded-[32px] shadow-2xl shadow-slate-200/50 border-2 border-slate-50 relative overflow-hidden transform animate-in zoom-in duration-500">
          
          {/* Modern Glassmorphic Background Accents */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-white border-2 border-slate-100 shadow-xl shadow-indigo-50 rounded-[22px] flex items-center justify-center mx-auto mb-5 transition-all hover:scale-105 active:scale-95 group">
              <GraduationCap className="w-8 h-8 text-indigo-600 transition-transform duration-300 group-hover:rotate-12" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
              {isSignUp ? 'Daftar Superadmin' : 'Masuk QurMa'}
            </h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-3 opacity-80">
              {isSignUp ? 'Inisialisasi Platform Pertama' : 'Tahfidz System Platform'}
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
              {isSignUp && (
                <div className="group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Zap className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                        name="full_name"
                        type="text" 
                        placeholder="Nama Superadmin"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-800 font-bold text-xs focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/20 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    />
                  </div>
                </div>
              )}

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
                      autoComplete="off"
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
                      autoComplete="new-password"
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
                    {isSignUp ? 'Daftar Sekarang' : 'Masuk Aplikasi'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                {isSignUp 
                    ? 'Pendaftar pertama akan otomatis menjadi Superadmin platform' 
                    : 'Silakan hubungi administrator sekolah untuk mendapatkan kredensial akses'}
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center border-t border-slate-50 pt-6">
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em]">
                  &copy; 2026 QurMa SaaS • Production v1.4
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};
