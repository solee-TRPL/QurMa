import React from 'react';
import { BookOpen } from 'lucide-react';

export const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center max-w-[300px] w-full">
        {/* Animated Icon Container */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-10">
            {/* The outer ring/arc animation */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-jade-600/80 animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-[6px] rounded-full border border-slate-100/50"></div>
            
            {/* The centered rounded square icon box */}
            <div className="relative w-16 h-16 bg-white border border-slate-100 rounded-[24px] flex items-center justify-center shadow-xl shadow-jade-900/5 ring-4 ring-jade-50/30">
                <div className="w-10 h-10 bg-jade-600/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-jade-600" />
                </div>
            </div>
        </div>

        {/* Branding & Status Text */}
        <div className="flex flex-col items-center w-full">
            <h1 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.5em] leading-none mb-3 text-center">
                QURMA PLATFORM
            </h1>
            <div className="flex items-center gap-4 w-full px-4">
                <div className="h-[1px] bg-gradient-to-r from-transparent to-slate-200 flex-1"></div>
                <span className="text-[9px] font-black text-jade-500 uppercase tracking-[0.3em] whitespace-nowrap">
                    MEMUAT DATA
                </span>
                <div className="h-[1px] bg-gradient-to-l from-transparent to-slate-200 flex-1"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
