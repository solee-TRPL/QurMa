import React, { useState, useEffect } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";

export const AccessDenied: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(false);
    }, 1500); // Menunggu 1.5 detik sebelum menampilkan pesan ditolak
    return () => clearTimeout(timer);
  }, []);

  if (isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="relative w-12 h-12 mb-6">
          <div className="absolute inset-0 border-2 border-slate-100 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-transparent border-t-jade-600 rounded-xl animate-spin"></div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Memverifikasi Izin Akses...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 shadow-sm shadow-rose-100/50">
        <ShieldAlert className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight uppercase">Akses Ditolak</h2>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide text-center max-w-xs leading-relaxed">
        Maaf, akun Anda tidak memiliki otoritas <br /> untuk mengakses modul ini.
      </p>
    </div>
  );
};
