
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const dayNames = ["Mi", "Se", "Se", "Ra", "Ka", "Ju", "Sa"];

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Pilih Tanggal",
  className = "",
  align = 'center'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate when value or isOpen changes
  useEffect(() => {
    if (value && isOpen) {
        setViewDate(new Date(value));
    }
  }, [value, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Adjusted to start from Monday if needed, but standard calendar is Sunday (0)
    // To match common ID calendars, let's keep Sunday as 0
    const days = [];
    
    // Padding for previous month
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: 'prev', fullDate: new Date(year, month - 1, prevMonthDays - i) });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, month: 'current', fullDate: new Date(year, month, i) });
    }
    
    // Padding for next month
    const totalSlots = 42; // 6 rows * 7 days
    const nextPadding = totalSlots - days.length;
    for (let i = 1; i <= nextPadding; i++) {
        days.push({ day: i, month: 'next', fullDate: new Date(year, month + 1, i) });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    const d1 = new Date(date);
    const d2 = new Date(value);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  };

  const isToday = (date: Date) => {
    const d1 = new Date(date);
    const d2 = new Date();
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  };

  // Convert Date string to Display Format (DD MMMM YYYY)
  const displayValue = value ? (() => {
      const [y, m, d] = value.split('-');
      const monthIdx = parseInt(m) - 1;
      const shortMonth = monthNames[monthIdx].substring(0, 3);
      return `${parseInt(d)} ${shortMonth} ${y.substring(2)}`;
  })() : "";



  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer outline-none"
      >
         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{displayValue || placeholder}</span>
      </div>

      {isOpen && (
        <div className={`absolute top-full mt-2 z-[9999] w-[215px] sm:w-[240px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-200 
          ${align === 'left' ? 'left-0' : align === 'right' ? 'right-0 left-auto translate-x-0' : 'left-1/2 -translate-x-1/2'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">
                    {monthNames[viewDate.getMonth()]}
                </span>
                <span className="text-[11px] font-black text-slate-400 tracking-wider leading-none">
                    {viewDate.getFullYear()}
                </span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <span key={d} className="text-center text-[7px] font-black text-slate-300 uppercase tracking-widest">{d}</span>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {generateDays().map((d, index) => {
              const selected = isSelected(d.fullDate);
              const today = isToday(d.fullDate);
              const currentMonth = d.month === 'current';
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(d.fullDate)}
                  className={`
                    h-7 flex items-center justify-center rounded-lg text-[9px] font-bold transition-all
                    ${selected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-50' : 
                      today ? 'text-indigo-600 bg-indigo-50/50' : 
                      currentMonth ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-200'}
                  `}
                >
                  {d.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
            <button 
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="text-[8px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
                Bersihkan
            </button>
            <button 
                onClick={() => handleDateSelect(new Date())}
                className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
            >
                Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
