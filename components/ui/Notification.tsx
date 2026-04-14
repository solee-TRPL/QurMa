
import React, { useEffect, useState } from 'react';
import { useNotification } from '../../lib/NotificationContext';
import { Notification } from '../../types';
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react';

const Toast: React.FC<{ notification: Notification; onDismiss: (id: string) => void; }> = ({ notification, onDismiss }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1.5s display duration as requested
    const timer = setTimeout(() => {
      handleDismiss();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => onDismiss(notification.id), 300); // Wait for fade out animation
  };

  const getStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-[#10B981]/20',
          iconBg: 'bg-[#10B981]/10',
          iconColor: 'text-[#10B981]',
          icon: <CheckCircle className="w-5 h-5" />,
          title: 'text-[#064E3B]',
          message: 'text-[#64748B]'
        };
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-[#F59E0B]/20',
          iconBg: 'bg-[#F59E0B]/10',
          iconColor: 'text-[#F59E0B]',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'text-[#78350F]',
          message: 'text-[#64748B]'
        };
      case 'info':
        return {
          bg: 'bg-white',
          border: 'border-[#6366F1]/20',
          iconBg: 'bg-[#6366F1]/10',
          iconColor: 'text-[#6366F1]',
          icon: <Info className="w-5 h-5" />,
          title: 'text-[#312E81]',
          message: 'text-[#64748B]'
        };
      case 'error':
      default:
        return {
          bg: 'bg-white',
          border: 'border-[#EF4444]/20',
          iconBg: 'bg-[#EF4444]/10',
          iconColor: 'text-[#EF4444]',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'text-[#7F1D1D]',
          message: 'text-[#64748B]'
        };
    }
  };

  const style = getStyle(notification.type);

  return (
    <div
      className={`relative w-[340px] rounded-[22px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border-2 ${style.border} flex items-center p-4 pr-10 transition-all duration-300 transform ${isFadingOut ? 'opacity-0 translate-x-10 scale-95' : 'animate-in slide-in-from-right-10 fade-in duration-300'} ${style.bg}`}
    >
      <div className="flex items-center gap-4 w-full">
        {/* Circle Icon Container */}
        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${style.iconBg} ring-1 ring-inset ${style.border}`}>
            <div className={style.iconColor}>
                {style.icon}
            </div>
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
            <h4 className={`font-black text-[13px] uppercase tracking-tight leading-none ${style.title}`}>
                {notification.title}
            </h4>
            <p className={`text-[10px] font-bold uppercase tracking-tighter mt-1 leading-none ${style.message}`}>
                {notification.message}
            </p>
        </div>
      </div>
      
      {/* Close Button */}
      <button 
        onClick={handleDismiss} 
        className="absolute right-4 p-1 text-slate-300 hover:text-slate-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-14 right-6 z-[99999] flex flex-col items-end gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {notifications.map((notif) => (
          <Toast key={notif.id} notification={notif} onDismiss={removeNotification} />
        ))}
      </div>
    </div>
  );
};
