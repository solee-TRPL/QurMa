
import React, { useState, useEffect, useMemo } from 'react';
import { MemorizationRecord, MemorizationStatus, TeacherNote, UserProfile, Student, MemorizationType } from '../../types';
import { getStudentRecords, getStudentNotes, getStudents } from '../../services/dataService';
import { 
    FileText, 
    Calendar, 
    TrendingUp, 
    BookOpen, 
    Clock, 
    Download,
    Filter,
    ArrowUpRight,
    Award,
    Quote
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const StudentReports: React.FC<{ user?: UserProfile }> = ({ user }) => {
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [student, setStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // High density view

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
          setLoading(false);
          return;
      }

      try {
          const allStudents = await getStudents(user.tenant_id);
          const myStudent = allStudents.find(s => s.parent_id === user.id);
          
          if (myStudent) {
              setStudent(myStudent);
              const [recs, studentNotes] = await Promise.all([
                getStudentRecords(myStudent.id),
                getStudentNotes(myStudent.id)
              ]);
              // Sort records by date descending
              const sorted = recs.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
              setRecords(sorted);
              setNotes(studentNotes);
          }
      } catch (e) {
          console.error("Failed to fetch report data", e);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredRecords = useMemo(() => {
    const list = records.filter(r => {
      if (!r.record_date.startsWith(monthFilter)) return false;
      // Sembunyikan data dengan nilai 0 atau kosong
      const val = parseInt(r.ayat_end as any) || 0;
      if ((r.type === MemorizationType.SABAQ || r.type === MemorizationType.SABQI) && val < 1) return false;
      return true;
    });
    return list;
  }, [records, monthFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [monthFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => n.date.startsWith(monthFilter));
  }, [notes, monthFilter]);

  // Insights Calculation
  const stats = useMemo(() => {
    const sabaqCount = filteredRecords
        .filter(r => r.type === MemorizationType.SABAQ)
        .reduce((sum, r) => sum + (parseInt(r.ayat_end as any) || 0), 0);
    
    const sabqiCount = filteredRecords
        .filter(r => r.type === MemorizationType.SABQI)
        .reduce((sum, r) => sum + (parseInt(r.ayat_end as any) || 0), 0);

    const total = filteredRecords.length;
    const mumtaz = filteredRecords.filter(r => r.status === MemorizationStatus.LANCAR).length;
    const quality = total > 0 ? Math.round((mumtaz / total) * 100) : 0;

    return { sabaqCount, sabqiCount, total, quality };
  }, [filteredRecords]);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menyusun Laporan...</p>
    </div>
  );

  if (!student) return (
    <div className="h-[400px] flex items-center justify-center px-10">
        <div className="text-center bg-white p-8 rounded-xl border-2 border-slate-50 shadow-sm max-w-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Data Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">Pastikan akun Anda sudah terhubung dengan profil santri yang aktif.</p>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* HEADER ACTIONS - CHARTBOX STYLE */}
      <div className="bg-white rounded-xl p-5 border-2 border-slate-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group shrink-0">
        <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50/50 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500" />
        
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm relative transition-all group-hover:bg-indigo-600 group-hover:text-white">
                <FileText className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Laporan Bulanan</p>
                <h2 className="text-xl font-black text-slate-800 leading-none truncate max-w-[200px] md:max-w-none uppercase tracking-tight">{student.full_name}</h2>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
            <div className="relative flex-1 md:w-48">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 z-10 group-hover:text-indigo-600 transition-colors" />
                <input 
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-black text-slate-700 uppercase tracking-widest focus:border-indigo-100 outline-none transition-all cursor-pointer hover:bg-white"
                />
            </div>
        </div>
      </div>

      {/* INSIGHTS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
              { label: 'Total Sabaq', value: `${stats.sabaqCount} Baris`, sub: 'Bulan Ini', icon: TrendingUp, color: 'indigo' },
              { label: 'Murojaah Sabqi', value: `${stats.sabqiCount} Halaman`, sub: 'Bulan Ini', icon: BookOpen, color: 'emerald' },
              { label: 'Kualitas', value: `${stats.quality}%`, sub: 'Rerata Mumtaz', icon: Award, color: 'orange' },
              { label: 'Frekuensi', value: `${stats.total}`, sub: 'Total Setoran', icon: Clock, color: 'blue' }
          ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border-2 border-slate-50 shadow-sm group hover:border-indigo-100 transition-all">
                  <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                          stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                          stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                          'bg-blue-50 text-blue-600'
                      }`}>
                          <stat.icon className="w-4 h-4" />
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-sm font-black text-slate-800 leading-none mb-1.5">{stat.value}</h4>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">{stat.sub}</p>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN DATA TABLE */}
          <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-50 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                      Rincian Setoran Harian
                  </h3>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl uppercase tracking-widest">
                      {filteredRecords.length} ENTRI
                  </span>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50/50">
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-10">No.</th>
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Materi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {paginatedRecords.map((rec, idx) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                      <p className="text-[10px] font-black text-slate-300">
                                          {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0')}
                                      </p>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                      <p className="text-xs font-black text-slate-800 leading-none">
                                          {new Date(rec.record_date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}
                                      </p>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                      <p className="text-xs font-black text-slate-800 leading-none">
                                          {rec.type === MemorizationType.SABAQ
                                              ? `Sabaq (${rec.ayat_end} Baris)`
                                              : rec.type === MemorizationType.SABQI
                                              ? `Sabqi (${rec.ayat_end} Hal)`
                                              : `Manzil (${rec.surah_name} ${rec.ayat_start}–${rec.ayat_end})`}
                                      </p>
                                  </td>
                              </tr>
                          ))}
                          {filteredRecords.length === 0 && (
                              <tr>
                                  <td colSpan={3} className="px-6 py-20 text-center">
                                      <Clock className="w-8 h-8 text-slate-100 mx-auto mb-3" />
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Tidak Ada Setoran Bulan Ini</p>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Halaman {currentPage} dari {totalPages}
                      </p>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 rotate-[225deg]" />
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                    currentPage === i + 1 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                  {i + 1}
                              </button>
                          ))}
                          <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 rotate-45" />
                          </button>
                      </div>
                  </div>
              )}
          </div>
          
          {/* TEACHER INSIGHTS SIDEBAR */}
          <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-slate-50 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                  
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center relative z-10">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center mr-2">
                          <Quote className="w-3.5 h-3.5 text-indigo-500" />
                      </span>
                      Evaluasi Ustadz
                  </h3>

                  <div className="relative z-10">
                      {filteredNotes.length > 0 ? (
                          <>
                              {/* Badge jumlah total catatan */}
                              {filteredNotes.length > 3 && (
                                  <div className="flex items-center justify-end mb-3">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                          {filteredNotes.length} Catatan
                                      </span>
                                  </div>
                              )}
                              {/* Scrollable container — tinggi ~3 item */}
                              <div
                                  className="overflow-y-auto space-y-4"
                                  style={{
                                      maxHeight: '240px',
                                      scrollbarWidth: 'none',
                                      msOverflowStyle: 'none',
                                  } as React.CSSProperties}
                              >
                                  {filteredNotes.map(note => (
                                      <div key={note.id} className="pl-4 py-1 hover:border-indigo-400 transition-colors">
                                          <div className="flex items-center justify-between mb-2">
                                              <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">{note.category}</span>
                                              <span className="text-[8px] font-bold text-slate-400">{new Date(note.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                          </div>
                                          <p className="text-[11px] font-bold text-slate-700 leading-relaxed">"{note.content}"</p>
                                          <p className="text-[8px] font-black text-slate-400 uppercase mt-2.5 tracking-widest">Ust. {note.teacher_name}</p>
                                      </div>
                                  ))}
                              </div>
                              {/* Fade gradient bawah sebagai hint scroll */}
                              {filteredNotes.length > 3 && (
                                  <div className="h-6 bg-gradient-to-t from-white to-transparent -mt-6 relative z-10 pointer-events-none rounded-b-xl" />
                              )}
                          </>
                      ) : (
                          <div className="py-10 text-center">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Quote className="w-5 h-5 text-slate-200" />
                            </div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Belum Ada Catatan</p>
                          </div>
                      )}
                  </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-100/50">
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Tips Pekan Ini</h3>
                  <p className="text-[11px] font-bold text-indigo-900 leading-relaxed">
                      Fokuskan murojaah pada juz yang baru saja diselesaikan sebelum menambah sabaq baru untuk memperkuat itqan hafalan.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};