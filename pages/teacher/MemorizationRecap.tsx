
import React from 'react';
import { UserProfile } from '../../types';
import { FileText } from 'lucide-react';

interface MemorizationRecapProps {
    user: UserProfile;
}

export const MemorizationRecap: React.FC<MemorizationRecapProps> = ({ user }) => {
    return (
        <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center animate-fade-in">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mb-6 shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-100 animate-bounce">
                <FileText className="w-8 h-8" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[300px] text-center leading-relaxed">
                Halaman sedang dalam proses pembaruan desain. <br/> Silakan tunggu sebentar.
            </p>
        </div>
    );
};
