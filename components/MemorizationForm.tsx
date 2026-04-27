
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/Button';
import { MemorizationType, MemorizationStatus, Student, UserProfile } from '../types';
import { Save, CheckCircle, X, BookOpen } from 'lucide-react';
import { createRecord } from '../services/dataService';
import { useLoading } from '../lib/LoadingContext';
import { useNotification } from '../lib/NotificationContext';
import { SURAH_DATA, JUZ_OPTIONS } from '../lib/quranData';

interface MemorizationFormProps {
  students: Student[];
  actor: UserProfile; 
  onSuccess: () => void;
  initialStudentId?: string;
  onCancel?: () => void;
}

export const MemorizationForm: React.FC<MemorizationFormProps> = ({ 
  students, 
  actor, 
  onSuccess, 
  initialStudentId,
  onCancel 
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>(initialStudentId || '');
  const [type, setType] = useState<MemorizationType>(MemorizationType.SABAQ);
  
  // New States for Dropdowns
  const [selectedJuz, setSelectedJuz] = useState<number | ''>(''); // Start with empty to force selection
  const [surah, setSurah] = useState('');
  
  const [ayatStart, setAyatStart] = useState<number>(1);
  const [ayatEnd, setAyatEnd] = useState<number>(1);
  const [status, setStatus] = useState<MemorizationStatus>(MemorizationStatus.LANCAR);
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { setLoading } = useLoading();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudent(initialStudentId);
    }
  }, [initialStudentId]);

  // Filter Surah based on Selected Juz
  const availableSurahs = useMemo(() => {
    if (!selectedJuz) return [];
    return SURAH_DATA.filter(s => s.juz.includes(Number(selectedJuz)));
  }, [selectedJuz]);

  // Get current Surah object for validation
  const currentSurahData = useMemo(() => {
    return SURAH_DATA.find(s => s.name === surah);
  }, [surah]);

  // Reset Surah when Juz changes
  useEffect(() => {
    setSurah(''); 
  }, [selectedJuz]);

  // Validate Ayat inputs when Surah changes
  useEffect(() => {
    if (currentSurahData) {
        // If current input exceeds new max, reset to max
        if (ayatStart > currentSurahData.totalAyah) {
            setAyatStart(1);
        }
        if (ayatEnd > currentSurahData.totalAyah) {
            setAyatEnd(currentSurahData.totalAyah);
        }
    }
  }, [surah, currentSurahData]);

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudentData) return;

    setLoading(true);
    
    try {
      await createRecord({
        student_id: selectedStudent,
        teacher_id: actor.id,
        record_date: new Date().toISOString(),
        type,
        surah_name: surah,
        ayat_start: ayatStart,
        ayat_end: ayatEnd,
        status,
        notes: notes ? `${notes} (Juz ${selectedJuz})` : `Juz ${selectedJuz}`
      }, actor, selectedStudentData.full_name);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onSuccess();
      
      // Reset Form
      if (!initialStudentId) setSelectedStudent('');
      // Keep Juz selected for convenience if inputting multiple students
      setSurah('');
      setAyatStart(1);
      setAyatEnd(1);
      setNotes('');
    } catch (error) {
      console.error(error);
      addNotification({ type: 'error', title: 'Gagal Menyimpan', message: 'Tidak dapat menyimpan data setoran. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
        <h3 className="font-semibold text-slate-800 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
            {initialStudentId ? `Input Hafalan: ${selectedStudentData?.full_name}` : 'Input Setoran Hafalan'}
        </h3>
        <div className="flex items-center gap-2">
            {showSuccess && (
            <span className="flex items-center text-sm text-green-600 font-medium animate-fade-in">
                <CheckCircle className="w-4 h-4 mr-1" /> Tersimpan
            </span>
            )}
            {onCancel && (
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>
      
      <form 
        onSubmit={handleSubmit} 
        className="p-6 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* Row 1: Santri & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Santri</label>
            {initialStudentId ? (
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-600 font-medium capitalize">
                    {selectedStudentData?.full_name || 'Santri tidak ditemukan'}
                </div>
            ) : (
                <select 
                required
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 border bg-white text-slate-900 capitalize"
                >
                <option value="">-- Pilih Santri --</option>
                {students.map(s => (
                    <option key={s.id} value={s.id} className="capitalize">{s.full_name}</option>
                ))}
                </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Setoran</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[MemorizationType.SABAQ, MemorizationType.SABQI, MemorizationType.MANZIL].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${type === t ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Juz & Surah Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Juz</label>
                <select
                    required
                    value={selectedJuz}
                    onChange={(e) => setSelectedJuz(Number(e.target.value))}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 border bg-white text-slate-900"
                >
                    <option value="">-- Pilih Juz --</option>
                    {JUZ_OPTIONS.map(j => (
                        <option key={j} value={j}>Juz {j}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Surah 
                    {currentSurahData && <span className="ml-2 text-xs font-normal text-slate-500">({currentSurahData.totalAyah} Ayat)</span>}
                </label>
                <select
                    required
                    value={surah}
                    onChange={(e) => setSurah(e.target.value)}
                    disabled={!selectedJuz}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 border bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <option value="">{selectedJuz ? '-- Pilih Surat --' : '-- Pilih Juz Terlebih Dahulu --'}</option>
                    {availableSurahs.map((s, idx) => (
                        <option key={`${s.name}-${idx}`} value={s.name}>{s.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Row 3: Ayat */}
        <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ayat Awal
                  {currentSurahData && <span className="ml-1 text-xs font-normal text-slate-400">(Max: {currentSurahData.totalAyah})</span>}
              </label>
              <input 
                type="number" 
                min="1"
                max={currentSurahData?.totalAyah}
                required
                value={ayatStart}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAyatStart(val);
                    // Adjust ayatEnd automatically if it's less than new start
                    if (val > ayatEnd) setAyatEnd(val);
                }}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 border bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ayat Akhir
                  {currentSurahData && <span className="ml-1 text-xs font-normal text-slate-400">(Max: {currentSurahData.totalAyah})</span>}
              </label>
              <input 
                type="number" 
                min={ayatStart}
                max={currentSurahData?.totalAyah}
                required
                value={ayatEnd}
                onChange={(e) => setAyatEnd(parseInt(e.target.value))}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 border bg-white text-slate-900"
              />
            </div>
        </div>

        {/* Row 4: Status / Verdict */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Penilaian</label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: MemorizationStatus.LANCAR, label: 'Lancar', color: 'border-green-500 bg-green-50 text-green-800' },
              { val: MemorizationStatus.TIDAK_LANCAR, label: 'Tidak Lancar', color: 'border-yellow-500 bg-yellow-50 text-yellow-800' },
              { val: MemorizationStatus.TIDAK_SETOR, label: 'Tidak Setor', color: 'border-red-500 bg-red-50 text-red-800' }
            ].map((option) => (
              <label 
                key={option.val}
                className={`relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${status === option.val ? option.color : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <input 
                  type="radio" 
                  name="status" 
                  value={option.val}
                  checked={status === option.val}
                  onChange={() => setStatus(option.val)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <span className="font-semibold text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Row 5: Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
          <textarea 
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Perlu perbaikan pada makhraj huruf..."
            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 px-3 border bg-white text-slate-900"
          ></textarea>
        </div>
        
        <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button 
            type="submit"
            disabled={!selectedStudent || !surah || !selectedJuz}
            >
            <Save className="w-4 h-4 mr-2" />
            Simpan Setoran
            </Button>
        </div>
      </form>
    </div>
  );
};
