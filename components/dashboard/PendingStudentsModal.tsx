import React from "react";
import { Clock, X } from "lucide-react";
import { Student, PageView } from "../../types";
import { Button } from "../ui/Button";

interface PendingStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onNavigate: (page: PageView) => void;
}

export const PendingStudentsModal: React.FC<PendingStudentsModalProps> = ({ isOpen, onClose, students, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in shadow-2xl">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-500" />
            Belum Setoran ({students.length})
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 capitalize">{student.full_name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{student.full_name}</p>
                    <p className="text-xs text-slate-500">Juz {student.current_juz}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onNavigate && onNavigate("input-hafalan");
                    onClose();
                  }}
                  className="text-xs font-medium text-primary-600 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  Input Setoran
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
