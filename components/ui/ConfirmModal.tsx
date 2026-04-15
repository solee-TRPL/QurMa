import React, { useState } from 'react';
import { AlertCircle, X, AlertTriangle, LucideIcon } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  icon?: LucideIcon | React.ReactNode;
  centerOnScreen?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  icon: IconProp,
  centerOnScreen = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirm action failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorClasses = {
    danger: {
      icon: 'bg-red-50 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-100',
      ring: 'ring-red-100'
    },
    warning: {
      icon: 'bg-amber-50 text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
      ring: 'ring-amber-50'
    },
    info: {
      icon: 'bg-indigo-50 text-indigo-500',
      button: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100',
      ring: 'ring-indigo-50'
    },
    primary: {
      icon: 'bg-indigo-50 text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
      ring: 'ring-indigo-50'
    }
  };

  const currentVariant = colorClasses[variant] || colorClasses.danger;

  return (
    <div className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 text-slate-800 ${!centerOnScreen ? 'lg:pl-64 lg:pt-20' : ''}`}>
      {/* Cinematic Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header/Ikon */}
        <div className="p-5 pb-2 flex flex-col items-center text-center">
          <div className={`w-12 h-12 ${currentVariant.icon} rounded-[18px] flex items-center justify-center mb-4 ring-6 ${currentVariant.ring} transition-all`}>
            {IconProp ? (
              typeof IconProp === 'function' ? React.createElement(IconProp as LucideIcon, { className: "w-6 h-6" }) : IconProp
            ) : (
              variant === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />
            )}
          </div>
          
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">
            {title}
          </h3>
          <div className="text-[10px] font-bold text-slate-500 leading-normal px-2">
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-2 flex flex-row-reverse gap-3">
          <button
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${currentVariant.button}`}
          >
            {isSubmitting ? '...' : confirmLabel}
          </button>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-[0.98] border border-slate-100"
          >
            {cancelLabel}
          </button>
        </div>

        {/* Close Button UI */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
