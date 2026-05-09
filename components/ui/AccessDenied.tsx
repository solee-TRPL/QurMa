import React from 'react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
      </div>
      <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Akses Ditolak</h2>
      <p className="text-sm font-medium text-slate-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
    </div>
  );
};
