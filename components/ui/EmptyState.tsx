import React from "react";
import { FileSearch, UserX, Ghost, Award, MessageSquare } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: "search" | "user" | "ghost" | "award" | "message";
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, description, icon = "ghost" }) => {
  const IconComponent = icon === "search" ? FileSearch : icon === "user" ? UserX : icon === "award" ? Award : icon === "message" ? MessageSquare : Ghost;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in duration-500">

      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-3">{message}</h3>

      {description ? (
        <p className="max-70 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-80">{description}</p>
      ) : (
        <div className="flex gap-1">
          <div className="w-6 h-1 bg-slate-100 rounded-full" />
          <div className="w-12 h-1 bg-jade-100 rounded-full" />
          <div className="w-6 h-1 bg-slate-100 rounded-full" />
        </div>
      )}
    </div>
  );
};
