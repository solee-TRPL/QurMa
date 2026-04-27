
import React from 'react';
import { FileSearch, UserX, Ghost, Award, MessageSquare } from 'lucide-react';

interface EmptyStateProps {
    message: string;
    description?: string;
    icon?: 'search' | 'user' | 'ghost' | 'award' | 'message';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    message, 
    description, 
    icon = 'ghost' 
}) => {
    const IconComponent = icon === 'search' ? FileSearch : icon === 'user' ? UserX : icon === 'award' ? Award : icon === 'message' ? MessageSquare : Ghost;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6 border-2 border-slate-50/50 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/50 transition-colors duration-500" />
                <IconComponent className="w-10 h-10 text-slate-300 group-hover:text-indigo-400 transition-all duration-500 group-hover:scale-110" />
            </div>
            
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-3">
                {message}
            </h3>
            
            {description ? (
                <p className="max-w-[280px] text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-80">
                    {description}
                </p>
            ) : (
                <div className="flex gap-1">
                    <div className="w-6 h-1 bg-slate-100 rounded-full" />
                    <div className="w-12 h-1 bg-indigo-100 rounded-full" />
                    <div className="w-6 h-1 bg-slate-100 rounded-full" />
                </div>
            )}
        </div>
    );
};
