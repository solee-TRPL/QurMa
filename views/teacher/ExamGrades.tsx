import React from "react";
import { UserProfile } from "../../types";
import { ClipboardCheck } from "lucide-react";

export const ExamGrades: React.FC<{ user: UserProfile }> = ({ user }) => {
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center animate-fade-in">
      <div className="w-20 h-20 bg-jade-50 text-jade-600 rounded-28px flex items-center justify-center mb-6 shadow-xl shadow-primary-100/50 ring-1 ring-jade-100 animate-bounce">
        <ClipboardCheck className="w-8 h-8" />
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] max-75 text-center leading-relaxed">
        Halaman sedang dalam proses pembaruan desain. <br /> Silakan tunggu sebentar.
      </p>
    </div>
  );
};
