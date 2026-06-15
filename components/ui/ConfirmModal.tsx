"use client";

import React, { useState } from "react";
import { AlertCircle, X, AlertTriangle, LucideIcon } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  icon?: LucideIcon | React.ReactNode;
  centerOnScreen?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Lanjutkan", cancelLabel = "Batal", variant = "danger", icon: IconProp, centerOnScreen = false }) => {
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
      icon: "bg-red-50 text-red-600",
      button: "bg-red-600 hover:bg-red-700 border-2 border-red-600 shadow-none",
      ring: "ring-red-100",
    },
    warning: {
      icon: "bg-amber-50 text-amber-500",
      button: "bg-amber-500 hover:bg-amber-600 border-2 border-amber-500 shadow-none",
      ring: "ring-amber-50",
    },
    info: {
      icon: "bg-jade-50 text-jade-500",
      button: "bg-jade-600 hover:bg-jade-700 border-2 border-jade-600 shadow-none",
      ring: "ring-jade-50",
    },
    primary: {
      icon: "bg-jade-50 text-jade-600",
      button: "bg-jade-600 hover:bg-jade-700 border-2 border-jade-600 shadow-none",
      ring: "ring-jade-50",
    },
  };

  const currentVariant = colorClasses[variant] || colorClasses.danger;

  const renderIcon = () => {
    if (!IconProp) return variant === "danger" ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />;
    if (React.isValidElement(IconProp)) return IconProp;
    const IconComp = IconProp as any;
    return <IconComp className="w-6 h-6" />;
  };

  return (
    <div className={`fixed inset-0 z-999999 flex items-center justify-center p-4 sm:p-6 text-slate-800 ${!centerOnScreen ? "lg:pl-64 pt-16" : ""}`}>
      {/* Invisible overlay for capturing clicks on the whole screen */}
      <div className="absolute inset-0" onClick={onClose} />
      {/* Cinematic Overlay - only blurs the intended area */}
      <div className={`absolute right-0 bottom-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 pointer-events-none ${!centerOnScreen ? "left-0 lg:left-64 top-16" : "inset-0"}`} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-3.5 border-b-2 border-slate-300 flex justify-between items-center bg-[#FCFDFE] sticky top-0 z-10 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${currentVariant.icon} flex items-center justify-center border-2 border-slate-100 shadow-none shrink-0`}>{renderIcon()}</div>
            <div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight leading-none">{title}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1 opacity-70">Konfirmasi Sistem</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all group">
            <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Message / Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1 text-[11px] font-bold text-slate-500 leading-normal text-left custom-scrollbar">{message}</div>

        {/* Action Buttons */}
        <div className="px-6 py-3 border-t-2 border-slate-300 bg-slate-50/50 flex gap-2 md:gap-3">
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="px-2 md:px-6 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl border-2 border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex-1 shadow-none whitespace-nowrap active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`px-2 md:px-8 py-2.5 font-black text-[9px] md:text-[10px] uppercase tracking-wider md:tracking-widest rounded-xl text-white hover:opacity-90 shadow-none transition-all active:scale-95 flex items-center justify-center gap-1.5 flex-1 whitespace-nowrap border-2 disabled:opacity-50 disabled:cursor-not-allowed ${currentVariant.button}`}
          >
            {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
