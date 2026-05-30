'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Layout } from '@/components/ui/Layout';
import { PageView, UserRole } from '@/types';
import { BookOpen, AlertTriangle } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { 
    user, 
    tenant, 
    isInitializing, 
    currentPage, 
    handleNavigation, 
    handleLogout, 
    handleAddAccount,
    switchAccount,
    removeAccount,
    syncAccountsFromDB,
    isImpersonating,
    stopImpersonating,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    showUnsavedModal,
    setShowUnsavedModal,
    proceedNavigation,
    triggerSave,
    saveTriggered
  } = useAuth();

  const getPageTitle = (page: PageView) => {
    switch (page) {
      case 'dashboard': return 'Dashboard Overview';
      case 'dashboard-school': return 'Dashboard: Data Sekolah';
      case 'dashboard-memorization': return 'Data Hafalan';
      case 'dashboard-attendance': return 'Data Kehadiran';
      case 'users': return 'Manajemen User';
      case 'student-management': return 'Manajemen Halaqah';
      case 'classes': return 'Manajemen Kelas';
      // case 'halaqah-management': return 'Manajemen Halaqah';
      case 'target-management': return 'Manajemen Target';
      case 'audit-logs': return 'Audit Logs';
      case 'data-santri': return 'Data Santri';
      case 'data-hafalan': return 'Data Hafalan';
      case 'data-kehadiran': return 'Data Kehadiran';
      case 'data-catatan': return 'Catatan dan Pencapaian';
      case 'input-hafalan': return 'Input Hafalan Baru';
      case 'recap-hafalan': return 'Rekap Hafalan';
      case 'exam-grades': return 'Penilaian Ujian';
      case 'reports': return 'Laporan Hafalan';
      case 'guardian-exams': return 'Nilai Ujian';
      case 'student-progress': return 'Perkembangan Santri';
      case 'pencapaian': return 'Pencapaian Santri';
      case 'teacher-notes': return 'Catatan Untuk Santri';
      case 'settings': return 'Pengaturan';
      case 'weekly-target': return 'Input Target Pekanan';
      case 'weekly-target-notes': return 'Catatan Perkembangan Pekanan';
      case 'sa-dashboard': return 'Platform Dashboard';
      case 'sa-tenants': return 'Manajemen Sekolah';
      case 'sa-users': return 'Manajemen Pengguna Global';
      case 'sa-audit-logs': return 'Global Audit Logs';
      case 'sa-platform-settings': return 'Pengaturan Platform';
      case 'sa-email-settings': return 'Pengaturan Email';
      case 'weekly-target-monitor': return 'Monitor Target Pekanan';
      case 'weekly-target-monitor-notes': return 'Monitor Catatan Pekanan';
      case 'monitor-hafalan': return 'Monitor Hafalan Santri';
      default: return 'QurMa';
    }
  };

  const getPageSubtitle = (page: PageView) => {
    switch (page) {
      case 'dashboard': return 'Ringkasan data & statistik operasional tahfidz';
      case 'dashboard-school': return 'Ringkasan statistik santri, asatidz, dan halaqah';
      case 'dashboard-memorization': return 'Tren setoran dan capaian target hafalan';
      case 'dashboard-attendance': return 'Tren dan rekapitulasi kehadiran santri';
      case 'users': return 'Kelola akses administrator, guru, dan pengawas';
      case 'student-management': return 'Pengaturan halaqah, kelompok belajar, dan data santri';
      case 'classes': return 'Data Organisasi Kelas & Sub-Kelas';
      // case 'halaqah-management': return 'Pengaturan kelompok dan pembimbing halaqah';
      case 'target-management': return 'Standarisasi kurikulum dan target hafalan';
      case 'audit-logs': return 'Rekaman riwayat aktivitas sistem';
      case 'data-santri': return 'Database lengkap informasi santri';
      case 'data-hafalan': return 'Monitoring hafalan saat ini seluruh santri';
      case 'data-kehadiran': return 'Rekapitulasi status kehadiran dan setoran santri';
      case 'data-catatan': return 'Pencatatan evaluasi dan pencapaian santri';
      case 'input-hafalan': return 'Rekam kemajuan setoran harian santri secara real-time';
      case 'recap-hafalan': return 'Analisis data kolektif dan riwayat setoran per periode';
      case 'exam-grades': return 'Evaluasi kumulatif hasil ujian dan standar tasmi\' santri';
      case 'weekly-target': return 'Atur rencana dan capaian hafalan untuk satu pekan ke depan';
      case 'weekly-target-notes': return 'Catatan khusus asatidz mengenai perkembangan santri per pekan';
      case 'settings': return 'Konfigurasi profil dan preferensi sekolah';
      case 'sa-dashboard': return 'Statistik agregat dan metrik pertumbuhan seluruh ekosistem platform';
      case 'sa-tenants': return 'Database pusat sekolah dan manajemen lisensi tenant';
      case 'sa-users': return 'Kelola kredensial dan hak akses seluruh akun di platform';
      case 'sa-audit-logs': return 'Log aktivitas global untuk pengecekan keamanan dan audit sistem';
      case 'sa-platform-settings': return 'Konfigurasi parameter sistem, branding, dan variabel global';
      case 'sa-email-settings': return 'Pengaturan server SMTP dan template notifikasi email sistem';
      case 'reports': return 'Riwayat lengkap setoran hafalan harian dan kualitas bacaan';
      case 'student-progress': return 'Visualisasi grafik perkembangan dan pencapaian target hafalan';
      case 'guardian-exams': return 'Rekapitulasi hasil ujian kumulatif dan standar penilaian asatidz';
      case 'weekly-target-monitor': return 'Pantau rencana dan pencapaian target hafalan seluruh ustadz';
      case 'weekly-target-monitor-notes': return 'Pantau catatan ustadz mengenai perkembangan santri per pekan';
      case 'monitor-hafalan': return 'Pantau progres dan kualitas setoran hafalan santri secara menyeluruh';
      case 'pencapaian': return 'Daftar penghargaan dan apresiasi atas kedisiplinan menghafal';
      case 'teacher-notes': return 'Kumpulan pesan motivasi dan evaluasi dari ustadz pembimbing';
      default: return undefined;
    }
  };

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-jade-50/50 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-jade-50/50 blur-[120px] rounded-full animate-pulse delay-1000" />
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700 relative z-10">
                <div className="relative w-20 h-20 mb-10">
                    <div className="absolute inset-0 border-[3px] border-jade-100 rounded-3xl opacity-40"></div>
                    <div className="absolute inset-0 border-[3px] border-transparent border-t-jade-600 rounded-3xl animate-[spin_2s_linear_infinite] shadow-[0_0_15px_rgba(79,70,229,0.1)]"></div>
                    <div className="absolute inset-4 bg-jade-600 rounded-2xl flex items-center justify-center shadow-lg shadow-jade-200 animate-pulse">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none">QurMa Platform</h2>
                    <div className="flex items-center gap-3">
                        <div className="h-0.5 w-8 bg-slate-100" />
                        <p className="text-[9px] font-black text-jade-400 uppercase tracking-[0.2em]">Memuat Data</p>
                        <div className="h-0.5 w-8 bg-slate-100" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (!user) return null;

  return (
    <Layout 
      user={user} 
      tenant={tenant} 
      title={getPageTitle(currentPage)}
      currentPage={currentPage}
      onNavigate={handleNavigation}
      onLogout={handleLogout}
      onAddAccount={handleAddAccount}
      onSwitchAccount={switchAccount}
      onRemoveAccount={removeAccount}
      onSyncAccounts={syncAccountsFromDB}
      isImpersonating={isImpersonating}
      onStopImpersonating={stopImpersonating}
      subtitle={getPageSubtitle(currentPage)}
    >
      <div className="animate-fade-in">
        {children}
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in lg:pl-64">
              <div className="bg-white rounded-xl shadow-none w-full max-w-md overflow-hidden animate-scale-in border-2 border-slate-300">
                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-none border-2 border-amber-100">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-normal mb-3">Tunggu Sebentar!</h3>
                      <p className="text-[11px] font-black text-slate-500 leading-relaxed uppercase tracking-wide opacity-80">
                          Anda memiliki perubahan data yang belum disimpan. Ingin menyimpannya sebelum pindah halaman?
                      </p>
                  </div>
                  <div className="px-6 pb-8 flex items-center gap-2">
                      <button 
                          onClick={() => { setShowUnsavedModal(false); }}
                          className="flex-1 py-3 bg-white text-slate-400 border-2 border-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-all active:scale-95"
                      >
                          Batal
                      </button>
                      <button 
                          onClick={() => { 
                              setHasUnsavedChanges(false); 
                              setShowUnsavedModal(false);
                              proceedNavigation();
                          }}
                          className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl border-2 border-rose-200 text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                      >
                          Buang
                      </button>
                      <button 
                          onClick={() => { 
                              triggerSave();
                              setShowUnsavedModal(false);
                          }}
                          className="flex-2 py-3 bg-jade-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-jade-700 shadow-none border-2 border-jade-600 transition-all active:scale-95 outline-none"
                      >
                          Simpan & Pindah
                      </button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
}
