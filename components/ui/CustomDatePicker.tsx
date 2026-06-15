"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const dayNames = ["Mi", "Se", "Se", "Ra", "Ka", "Ju", "Sa"];

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  modalClassName?: string;
  align?: "left" | "right" | "center" | "none";
  disabled?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, placeholder = "Pilih Tanggal", className = "", modalClassName = "", align = "center", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (value) {
      setViewDate(new Date(value));
    }
  }, []);

  // Sync viewDate when value or isOpen changes
  useEffect(() => {
    if (value && isOpen) {
      setViewDate(new Date(value));
    }
    if (!isOpen) {
      setShowMonthPicker(false);
      setShowYearPicker(false);
    }
  }, [value, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
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
    const days: any[] = [];

    // Padding for previous month
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: "prev", fullDate: new Date(year, month - 1, prevMonthDays - i) });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: "current", fullDate: new Date(year, month, i) });
    }

    // Padding for next month
    const totalSlots = 42; // 6 rows * 7 days
    const nextPadding = totalSlots - days.length;
    for (let i = 1; i <= nextPadding; i++) {
      days.push({ day: i, month: "next", fullDate: new Date(year, month + 1, i) });
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
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const isToday = (date: Date) => {
    const d1 = new Date(date);
    const d2 = new Date();
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  // Convert Date string to Display Format (DD MMMM YYYY)
  const displayValue = value
    ? (() => {
        const [y, m, d] = value.split("-");
        const monthIdx = parseInt(m) - 1;
        const shortMonth = monthNames[monthIdx].substring(0, 3);
        return `${parseInt(d)} ${shortMonth} ${y}`;
      })()
    : "";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`flex items-center justify-center w-full h-full gap-2 outline-none ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{mounted ? displayValue || placeholder : placeholder}</span>
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-1 z-99! w-53.75 sm:w-60 bg-white rounded-xl shadow-none border-2 border-slate-300 p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-200 
          ${align === "left" ? "left-0" : align === "right" ? "right-0 left-auto translate-x-0" : align === "center" ? "left-1/2 -translate-x-1/2" : ""} ${modalClassName}`}
        >
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1 flex-1">
              {(showMonthPicker || showYearPicker) && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMonthPicker(false);
                    setShowYearPicker(false);
                  }}
                />
              )}
              <div
                className="relative z-50 flex items-center justify-center hover:bg-slate-50 rounded py-1 px-1 cursor-pointer transition-colors"
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
              >
                <span className="text-[12px] font-black text-slate-700 tracking-widest pointer-events-none">{monthNames[viewDate.getMonth()]}</span>
                {showMonthPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-28 bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                    {monthNames.map((m, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-2 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-center hover:bg-slate-50 transition-colors ${idx === viewDate.getMonth() ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDate = new Date(viewDate.getFullYear(), idx, 1);
                          setViewDate(newDate);
                          setShowMonthPicker(false);
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="relative z-50 flex items-center justify-center hover:bg-slate-50 rounded py-1 px-1 cursor-pointer transition-colors"
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
              >
                <span className="text-[12px] font-black text-slate-700 tracking-widest pointer-events-none">{viewDate.getFullYear()}</span>
                {showYearPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-24 bg-white border-2 border-slate-300 rounded-xl shadow-none z-50 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in zoom-in-95 duration-200">
                    {Array.from({ length: 41 }, (_, i) => new Date().getFullYear() - 20 + i).map((year) => (
                      <div
                        key={year}
                        className={`px-3 py-2.5 border-b border-slate-100 last:border-0 text-[10px] font-black tracking-widest cursor-pointer text-center hover:bg-slate-50 transition-colors ${year === viewDate.getFullYear() ? "text-jade-600 bg-jade-50" : "text-slate-600"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDate = new Date(year, viewDate.getMonth(), 1);
                          setViewDate(newDate);
                          setShowYearPicker(false);
                        }}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((d, i) => (
              <span key={i} className="text-center text-[7px] font-black text-slate-400 uppercase tracking-widest">
                {d}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {generateDays().map((d, index) => {
              const selected = isSelected(d.fullDate);
              const today = isToday(d.fullDate);
              const currentMonth = d.month === "current";

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(d.fullDate)}
                  className={`
                    h-7 flex items-center justify-center rounded-lg text-[9px] font-bold transition-all
                    ${
                      selected
                        ? "bg-jade-600 text-white shadow-md shadow-primary-100 ring-2 ring-jade-50"
                        : today
                          ? "text-jade-600 border border-jade-400 bg-jade-100/50"
                          : currentMonth
                            ? "text-slate-600 hover:bg-slate-50"
                            : "text-slate-300"
                    }
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
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
            >
              Bersihkan
            </button>
            <button onClick={() => handleDateSelect(new Date())} className="text-[9px] font-black text-jade-600 uppercase tracking-widest hover:text-jade-800 transition-colors">
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
