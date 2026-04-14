import React from 'react';

export const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/5 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center bg-white/40 p-10 rounded-[40px] shadow-2xl border border-white/40 backdrop-blur-2xl animate-in zoom-in-95 duration-200">
        <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-[6px] border-indigo-100 rounded-full opacity-30"></div>
            <div className="absolute inset-0 border-[6px] border-transparent border-t-indigo-600 rounded-full animate-spin shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,1)]"></div>
        </div>
        <div className="mt-8 flex flex-col items-center space-y-1">
            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.3em] leading-none">Sinkronisasi</p>
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.15em] opacity-80">Memproses Data</p>
        </div>
      </div>
    </div>
  );
};
