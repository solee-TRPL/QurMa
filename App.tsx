
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/ui/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
// Admin Pages
import { UserManagement } from './pages/admin/UserManagement';
import { StudentManagement } from './pages/admin/GuardianManagement';
import { HalaqahManagement } from './pages/admin/HalaqahManagement';
import { ClassManagement } from './pages/admin/ClassManagement';
import { AuditLogs } from './pages/admin/AuditLogs';
import { TargetManagement } from './pages/admin/TargetManagement';
import { WeeklyTargetMonitor } from './pages/admin/WeeklyTargetMonitor';
// Teacher Pages
import { StudentDirectory } from './pages/teacher/StudentDirectory';
import { GuardianDirectory } from './pages/teacher/GuardianDirectory';
import { ExamGrades } from './pages/teacher/ExamGrades';
import { InputHafalan } from './pages/teacher/InputHafalan';
import { MemorizationRecap } from './pages/teacher/MemorizationRecap';
import { WeeklyTarget } from './pages/teacher/WeeklyTarget';
import { ManageStudentProgress } from './pages/teacher/ManageStudentProgress';
// Guardian Pages
import { StudentReports } from './pages/guardian/GuardianReports';
import { StudentExamResults } from './pages/guardian/GuardianExamResults';
import { StudentProgress } from './pages/guardian/StudentProgress';
// Superadmin Pages
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { TenantManagement } from './pages/superadmin/TenantManagement';
import { GlobalUserManagement } from './pages/superadmin/GlobalUserManagement';
import { PlatformSettings } from './pages/superadmin/PlatformSettings';
import { EmailSettings } from './pages/superadmin/EmailSettings';
import { GlobalAuditLogs } from './pages/superadmin/GlobalAuditLogs';
// Common Page
import { Settings } from './pages/Settings';
import { BookOpen } from 'lucide-react';

import { UserProfile, PageView, UserRole, Tenant } from './types';
import { getProfileWithRetry, signOut } from './services/authService';
import { getTenant } from './services/dataService';
import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabase';
import { LoadingProvider, useLoading } from './lib/LoadingContext';
import { NotificationProvider, useNotification } from './lib/NotificationContext';

const AppContent: React.FC = () => {
  // --- PERFORMANCE 1: HYDRATION ---
  // Instantly load from cache to avoid white screen flicker
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('qurma_active_profile');
    return cached ? JSON.parse(cached) : null;
  });
  
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const cached = localStorage.getItem('qurma_active_tenant');
    return cached ? JSON.parse(cached) : null;
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageView>(() => {
    const path = window.location.pathname.substring(1);
    // Handle /app prefix
    if (path.startsWith('app')) {
        const subPath = path.substring(4) as PageView; // remove 'app/'
        return subPath || 'dashboard';
    }
    return (path as PageView) || 'dashboard';
  });
  
  const { isLoading, setLoading } = useLoading();
  const { addNotification } = useNotification();
  
  const isUpdatingAuth = useRef(false);
  const didInit = useRef(false);
  const userRef = useRef<UserProfile | null>(user);

  // --- STANDARDIZED ACCOUNT SWITCHER CORE ---

  const getAccounts = () => {
    try {
        const cached = localStorage.getItem('otherAccounts');
        return cached ? JSON.parse(cached) : [];
    } catch (e) {
        return [];
    }
  };

  const saveAccount = (profile: UserProfile, session: any) => {
    const accounts = getAccounts();
    // Filter out if already exists (no duplicates)
    const filtered = accounts.filter((a: any) => a.id !== profile.id);
    
    // Check limit
    if (filtered.length >= 5) {
        const oldest = filtered[filtered.length - 1];
        addNotification({ 
            type: 'warning', 
            title: 'Kapasitas Penuh', 
            message: `Akun tertua (${oldest.profile.full_name}) dicabut untuk memberi ruang.` 
        });
    }

    const newEntry = {
        id: profile.id,
        profile: profile,
        session: { access_token: session.access_token, refresh_token: session.refresh_token },
        last_active: new Date().toISOString()
    };

    // Newest always first, limit to 5
    const updatedList = [newEntry, ...filtered].slice(0, 5);
    localStorage.setItem('otherAccounts', JSON.stringify(updatedList));
  };

  const removeAccount = (id: string) => {
    const accounts = getAccounts();
    const updated = accounts.filter((a: any) => a.id !== id);
    localStorage.setItem('otherAccounts', JSON.stringify(updated));
    // Trigger re-render by not doing anything since Layout reads from localStorage
  };

  const switchAccount = async (targetAccount: any) => {
    setLoading(true);
    addNotification({ 
        type: 'info', 
        title: 'Beralih Profil', 
        message: `Masuk sebagai ${targetAccount.profile.full_name}...` 
    });

    try {
        if (!targetAccount.session) throw new Error("No session");
        const { data, error } = await supabase.auth.setSession(targetAccount.session);
        if (error) throw error;
        
        if (data.session) {
            const isSuperAdmin = targetAccount.profile.role === UserRole.SUPERADMIN;
            const targetPath = isSuperAdmin ? '/app/sa-dashboard' : '/app/dashboard';
            
            // Persist the active profile intent
            localStorage.setItem('qurma_active_profile', JSON.stringify(targetAccount.profile));
            
            // Chrome-like isolated hard-reload
            window.location.href = targetPath;
        }
    } catch (error) {
        addNotification({ 
            type: 'error', 
            title: 'Sesi Habis', 
            message: 'Silakan login ulang manual untuk akun ini.' 
        });
        setLoading(false);
    }
  };

  const handleAuthSuccess = async (userId: string, session: any) => {
    if (isUpdatingAuth.current) return;
    isUpdatingAuth.current = true;
    
    try {
        const profile = await getProfileWithRetry(userId);
        if (!profile) return;

        setUser(profile);
        userRef.current = profile;
        localStorage.setItem('qurma_active_profile', JSON.stringify(profile));
        
        if (profile.tenant_id) {
            const tenantData = await getTenant(profile.tenant_id);
            setTenant(tenantData);
            localStorage.setItem('qurma_active_tenant', JSON.stringify(tenantData));
        }

        // Use our new standardized save function
        saveAccount(profile, session);

        // Smart URL Redirection
        const path = window.location.pathname.substring(1);
        const isSuperAdmin = profile.role === UserRole.SUPERADMIN;
        const targetHome = isSuperAdmin ? 'sa-dashboard' : 'dashboard';
        const isSaPage = path && path.includes('sa-');

        if (!path.startsWith('app') || (isSuperAdmin && path === 'app/dashboard') || (!isSuperAdmin && isSaPage)) {
            setCurrentPage(targetHome);
            window.history.pushState({}, '', `/app/${targetHome}`);
        }
    } catch (e) {
        console.error("[Auth] Sync failed:", e);
    } finally {
        isUpdatingAuth.current = false;
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Handle PopState (Navigation)
    const handlePopState = () => {
        const path = window.location.pathname.substring(1);
        if (path.startsWith('app')) {
            const subPath = path.substring(4) as PageView;
            if (subPath) setCurrentPage(subPath);
        } else {
            setCurrentPage('dashboard');
        }
    };
    window.addEventListener('popstate', handlePopState);




  const refreshAllSessions = async () => {
        const cached = localStorage.getItem('otherAccounts');
        if (!cached) return;
        try {
            const accounts = JSON.parse(cached) as any[];
            let changed = false;
            for (let i = 0; i < accounts.length; i++) {
                const acc = accounts[i];
                // Refresh tokens for background accounts proactively
                    if (userRef.current?.id !== acc.id && acc.session?.refresh_token) {
                        try {
                            const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
                                body: JSON.stringify({ refresh_token: acc.session.refresh_token })
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                accounts[i] = { 
                                    ...acc, 
                                    session: { access_token: data.access_token, refresh_token: data.refresh_token }, 
                                    last_active: new Date().toISOString() 
                                };
                                changed = true;
                            } else if (response.status === 400 || response.status === 401) {
                                // Token is dead, clear session so we stop trying
                                accounts[i] = { ...acc, session: null };
                                changed = true;
                            }
                        } catch (e) {
                            console.error("[Auth] Background refresh failed:", e);
                        }
                    }
            }
            if (changed) localStorage.setItem('otherAccounts', JSON.stringify(accounts));
        } catch (e) {}
    };

    // 2. Auth Initialization
    const initAuth = async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        
        // --- AUTO-RECOVERY LOGIC (FOREVER SESSION) ---
        // If no active session, try to recover from otherAccounts for the last known active profile
        if (!session) {
            const activeProfileStr = localStorage.getItem('qurma_active_profile');
            if (activeProfileStr) {
                const activeProfile = JSON.parse(activeProfileStr);
                const accounts = getAccounts();
                const matched = accounts.find((a: any) => a.id === activeProfile.id);
                if (matched?.session) {
                    const { data } = await supabase.auth.setSession(matched.session);
                    session = data.session;
                }
            }
        }

        if (session) {
          await handleAuthSuccess(session.user.id, session);
          // Run an eager refresh for all background accounts immediately
          refreshAllSessions();
        } else {
          setUser(null);
          setTenant(null);
          if (window.location.pathname.startsWith('/app')) window.history.pushState({}, '', '/');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    if (!didInit.current) {
        didInit.current = true;
        initAuth();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
            handleAuthSuccess(session.user.id, session);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setTenant(null);
            localStorage.removeItem('qurma_active_profile');
            localStorage.removeItem('qurma_active_tenant');
            if (window.location.pathname.startsWith('/app')) window.history.pushState({}, '', '/');
        }
    });

    const sessionRefresher = setInterval(refreshAllSessions, 1000 * 60 * 15); // Refresh background accounts every 15 mins

    return () => { 
        clearInterval(sessionRefresher);
        authListener.subscription.unsubscribe();
        window.removeEventListener('popstate', handlePopState);
    };
  }, []); 

  const handleNavigation = (page: PageView) => {
    setCurrentPage(page);
    window.history.pushState({}, '', `/app/${page}`);
  }; 

  // --- AUTH ACTIONS ---

  // Soft Logout: For 'Masuk Akun Lain'
  // Clears active session locally but KEEPS it alive on server so we can switch back
  const handleAddAccount = async () => {
    setLoading(true);
    try {
        // IMPORTANT: We explicitly save the current state before clearing local session
        // so it stays 'nyangkut' in otherAccounts
        
        // signOut with scope: 'local' ONLY removes storage, doesn't kill session on server
        await supabase.auth.signOut({ scope: 'local' });
        
        setUser(null);
        setTenant(null);
        localStorage.removeItem('qurma_active_profile');
        localStorage.removeItem('qurma_active_tenant');
        window.history.pushState({}, '', '/');
    } finally {
        setLoading(false);
    }
  };

  // Hard Logout: Full Sign Out (User explicitly wants to leave the PC/device)
  const handleLogout = async () => {
    setLoading(true);
    addNotification({ type: 'info', title: 'Keluar', message: 'Menutup seluruh sesi dan keluar...' });
    try {
        // Full signOut invalidates the session on the server
        await supabase.auth.signOut();
        
        setUser(null);
        setTenant(null);
        localStorage.removeItem('qurma_active_profile');
        localStorage.removeItem('qurma_active_tenant');
        // Note: otherAccounts stays as a history unless we manually clear it, 
        // but the session within it will now be invalid.
        window.location.href = '/';
    } finally {
        setLoading(false);
    }
  };

  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [originalTenant, setOriginalTenant] = useState<Tenant | null>(null);

  const handleImpersonate = async (targetUser: UserProfile) => {
    if (!user) return;
    setLoading(true);
    try {
        if (!originalUser) {
            setOriginalUser(user);
            setOriginalTenant(tenant);
        }
        let targetTenantData: Tenant | null = null;
        if (targetUser.tenant_id) {
            targetTenantData = await getTenant(targetUser.tenant_id);
        }
        setUser(targetUser);
        setTenant(targetTenantData);
        setCurrentPage('dashboard');
        window.history.pushState({}, '', '/dashboard');
        addNotification({ type: 'warning', title: 'Mode Penyamaran Aktif', message: `Anda sekarang login sebagai ${targetUser.full_name}.` });
    } catch (error) {
        addNotification({ type: 'error', title: 'Gagal', message: 'Gagal melakukan impersonasi user.' });
    } finally { setLoading(false); }
  };

  const stopImpersonating = () => {
      if (originalUser) {
          setUser(originalUser);
          setTenant(originalTenant);
          setOriginalUser(null);
          setOriginalTenant(null);
          setCurrentPage('sa-users');
          window.history.pushState({}, '', '/sa-users');
          addNotification({ type: 'info', title: 'Mode Penyamaran Berakhir', message: 'Anda kembali ke akun Superadmin.' });
      }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => { 
    setUser(updatedProfile); 
    localStorage.setItem('qurma_active_profile', JSON.stringify(updatedProfile));
  };
  const handleTenantUpdate = (updatedTenant: Tenant) => { setTenant(updatedTenant); };

  const getPageTitle = (page: PageView) => {
    switch (page) {
      case 'dashboard': return 'Dashboard Overview';
      case 'users': return 'Manajemen User';
      case 'student-management': return 'Manajemen Santri';
      case 'classes': return 'Manajemen Kelas';
      case 'halaqah-management': return 'Manajemen Halaqah';
      case 'target-management': return 'Manajemen Target';
      case 'audit-logs': return 'Audit Logs';
      case 'data-santri': return 'Direktori Santri';
      case 'input-hafalan': return 'Input Hafalan Baru';
      case 'recap-hafalan': return 'Rekap Hafalan';
      case 'exam-grades': return 'Penilaian Ujian';
      case 'reports': return 'Laporan Hafalan';
      case 'guardian-exams': return 'Nilai Ujian';
      case 'student-progress': return 'Perkembangan Santri';
      case 'settings': return 'Pengaturan';
      case 'weekly-target': return 'Input Target Pekanan';
      case 'student-progress-manage': return 'Kelola Perkembangan';
      case 'sa-dashboard': return 'Platform Dashboard';
      case 'sa-tenants': return 'Manajemen Sekolah';
      case 'sa-users': return 'Manajemen Pengguna Global';
      case 'sa-audit-logs': return 'Global Audit Logs';
      case 'sa-platform-settings': return 'Pengaturan Platform';
      case 'sa-email-settings': return 'Pengaturan Email';
      case 'weekly-target-monitor': return 'Monitor Target Pekanan';
      default: return 'QurMa';
    }
  };

  const getPageSubtitle = (page: PageView) => {
    switch (page) {
      case 'dashboard': return 'Ringkasan data & statistik operasional tahfidz';
      case 'users': return 'Kelola akses administrator, guru, dan pengawas';
      case 'student-management': return 'Database pusat dan administrasi data santri';
      case 'classes': return 'Data Organisasi Kelas & Sub-Kelas';
      case 'halaqah-management': return 'Pengaturan kelompok dan pembimbing halaqah';
      case 'target-management': return 'Standarisasi kurikulum dan target hafalan';
      case 'audit-logs': return 'Rekaman riwayat aktivitas sistem';
      case 'data-santri': return 'Database lengkap dan statistik hafalan seluruh santri';
      case 'input-hafalan': return 'Rekam kemajuan setoran harian santri secara real-time';
      case 'recap-hafalan': return 'Analisis data kolektif dan riwayat setoran per periode';
      case 'exam-grades': return 'Evaluasi kumulatif hasil ujian dan standar tasmi\' santri';
      case 'weekly-target': return 'Atur rencana dan capaian hafalan untuk satu pekan ke depan';
      case 'student-progress-manage': return 'Input Standar Capaian Semesteran';
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
      default: return undefined;
    }
  };

  const renderContent = () => {
    if (!user) return null;
    switch (currentPage) {
      case 'sa-dashboard': return user.role === UserRole.SUPERADMIN ? <SuperAdminDashboard onNavigate={handleNavigation} /> : <div>Akses Ditolak</div>;
      case 'sa-tenants': return user.role === UserRole.SUPERADMIN ? <TenantManagement user={user} /> : <div>Akses Ditolak</div>;
      case 'sa-users': return user.role === UserRole.SUPERADMIN ? <GlobalUserManagement user={user} onImpersonate={handleImpersonate} /> : <div>Akses Ditolak</div>;
      case 'sa-audit-logs': return user.role === UserRole.SUPERADMIN ? <GlobalAuditLogs /> : <div>Akses Ditolak</div>;
      case 'sa-platform-settings': return user.role === UserRole.SUPERADMIN ? <PlatformSettings user={user} /> : <div>Akses Ditolak</div>;
      case 'sa-email-settings': return user.role === UserRole.SUPERADMIN ? <EmailSettings user={user} /> : <div>Akses Ditolak</div>;
      case 'dashboard': return <Dashboard user={user} onNavigate={handleNavigation} />;
      case 'users': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <UserManagement tenantId={user.tenant_id!} user={user} /> : <div>Akses Ditolak</div>;
      case 'student-management': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <StudentManagement tenantId={user.tenant_id!} user={user} /> : <div>Akses Ditolak</div>;
      case 'classes': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <ClassManagement tenantId={user.tenant_id!} user={user} /> : <div>Akses Ditolak</div>;
      case 'halaqah-management': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <HalaqahManagement tenantId={user.tenant_id!} user={user} /> : <div>Akses Ditolak</div>;
      case 'target-management': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <TargetManagement tenantId={user.tenant_id!} user={user} /> : <div>Akses Ditolak</div>;
      case 'audit-logs': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <AuditLogs tenantId={user.tenant_id!} /> : <div>Akses Ditolak</div>;
      case 'data-santri': return (user.role === UserRole.TEACHER || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN) ? <StudentDirectory user={user} tenantId={user.tenant_id!} /> : <div>Akses Ditolak</div>;
      case 'input-hafalan': return user.role === UserRole.TEACHER ? <InputHafalan user={user} /> : <div>Akses Ditolak</div>;
      case 'recap-hafalan': return (user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN) ? <MemorizationRecap user={user} /> : <div>Akses Ditolak</div>;
      case 'reports': return user.role === UserRole.SANTRI ? <StudentReports user={user} /> : <div>Akses Ditolak</div>;
      case 'weekly-target': return user.role === UserRole.TEACHER ? <WeeklyTarget user={user} /> : <div>Akses Ditolak</div>;
      case 'student-progress-manage': return user.role === UserRole.TEACHER ? <ManageStudentProgress user={user} /> : <div>Akses Ditolak</div>;
      case 'weekly-target-monitor': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <WeeklyTargetMonitor user={user} tenantId={user.tenant_id!} /> : <div>Akses Ditolak</div>;
      case 'guardian-exams': return user.role === UserRole.SANTRI ? <StudentExamResults user={user} /> : <div>Akses Ditolak</div>;
      case 'student-progress': return user.role === UserRole.SANTRI ? <StudentProgress user={user} /> : <div>Akses Ditolak</div>;
      case 'settings': return <Settings user={user} tenant={tenant} onProfileUpdate={handleProfileUpdate} onTenantUpdate={handleTenantUpdate} />;
      default: return user.role === UserRole.SUPERADMIN ? <SuperAdminDashboard onNavigate={handleNavigation} /> : <Dashboard user={user} onNavigate={handleNavigation} />;
    }
  };
  
  if (isInitializing && !user) { 
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
              {/* Cinematic Background Elements */}
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full animate-pulse delay-1000" />
              
              <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700 relative z-10">
                  <div className="relative w-20 h-20 mb-10">
                      <div className="absolute inset-0 border-[3px] border-indigo-100 rounded-[24px] opacity-40"></div>
                      <div className="absolute inset-0 border-[3px] border-transparent border-t-indigo-600 rounded-[24px] animate-[spin_2s_linear_infinite] shadow-[0_0_15px_rgba(79,70,229,0.1)]"></div>
                      <div className="absolute inset-4 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
                          <BookOpen className="w-6 h-6 text-white" />
                      </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                      <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none">QurMa Platform</h2>
                      <div className="flex items-center gap-3">
                          <div className="h-[2px] w-8 bg-slate-100" />
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Memulai Sistem</p>
                          <div className="h-[2px] w-8 bg-slate-100" />
                      </div>
                  </div>
              </div>
          </div>
      );
  }
  
  if (!user) { return <Login onSwitchAccount={switchAccount} />; }

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
      isImpersonating={!!originalUser}
      onStopImpersonating={stopImpersonating}
      subtitle={getPageSubtitle(currentPage)}
    >
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <LoadingProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </LoadingProvider>
  );
}

export default App;
