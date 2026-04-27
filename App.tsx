
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
import { MonitorHafalan } from './pages/admin/MonitorHafalan';
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
import { StudentAchievements } from './pages/guardian/StudentAchievements';
import { TeacherNotesList } from './pages/guardian/TeacherNotesList';
// Superadmin Pages
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { TenantManagement } from './pages/superadmin/TenantManagement';
import { GlobalUserManagement } from './pages/superadmin/GlobalUserManagement';
import { PlatformSettings } from './pages/superadmin/PlatformSettings';
import { EmailSettings } from './pages/superadmin/EmailSettings';
import { GlobalAuditLogs } from './pages/superadmin/GlobalAuditLogs';
// Common Page
import { Settings } from './pages/Settings';
import { BookOpen, AlertTriangle, AlertCircle } from 'lucide-react';

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
  const [showCapacityPrompt, setShowCapacityPrompt] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<PageView>(() => {
    const path = window.location.pathname.substring(1);
    // Handle /app prefix
    if (path.startsWith('app')) {
        const subPath = path.substring(4) as PageView; // remove 'app/'
        return subPath || 'dashboard';
    }
    return (path as PageView) || 'dashboard';
  });

  // --- DEVICE ID & SESSION BACKUP CORE ---
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('qurma_device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('qurma_device_id', id);
    }
    return id;
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

  const saveAccount = async (profile: UserProfile, session: any) => {
    if (!profile || !profile.id) return;
    const accounts = getAccounts();
    const filtered = accounts.filter((a: any) => (a.id || a.profile?.id) !== profile.id);
    
    // CHECK LIMIT (Increased to 100 for 'Forever' feel)
    if (filtered.length >= 100) {
        const oldest = filtered[filtered.length - 1];
        const oldestId = oldest.id || oldest.profile?.id;
        
        // DESTROY FROM DB BACKUP TO PREVENT GHOST SYNC
        try {
            await supabase.rpc('delete_backup_session', {
                target_user_id: oldestId,
                target_device_id: deviceId
            });
        } catch (e) {
            console.error("[Auth] Failed to purge oldest account from DB:", e);
        }

        addNotification({ 
            type: 'warning', 
            title: 'Kapasitas Penuh', 
            message: `Akun tertua (${oldest.profile?.full_name || 'Tanpa Nama'}) dicabut untuk memberi ruang.` 
        });
    }

    const sessionData = { 
        access_token: session.access_token, 
        refresh_token: session.refresh_token 
    };

    const newEntry = {
        id: profile.id,
        profile: profile,
        session: sessionData,
        last_active: new Date().toISOString()
    };

    const updatedList = [newEntry, ...filtered].slice(0, 100);
    localStorage.setItem('otherAccounts', JSON.stringify(updatedList));

    // SYNC TO DB BACKUP (Using RPC to avoid race-condition 401 errors)
    try {
        await supabase.rpc('save_backup_session', {
            target_user_id: profile.id,
            target_device_id: deviceId,
            target_token: session.refresh_token,
            target_profile: profile
        });
    } catch (e) {
        console.error("[Auth] DB Sync failed:", e);
    }
  };

  const removeAccount = async (userId: string, fullName: string) => {
    const accounts = getAccounts();
    const updated = accounts.filter((a: any) => (a.id || a.profile?.id) !== userId);
    localStorage.setItem('otherAccounts', JSON.stringify(updated));
    
    // DB Cleanup using RPC (to bypass RLS for non-active accounts)
    try {
        await supabase.rpc('delete_backup_session', {
            target_user_id: userId,
            target_device_id: deviceId
        });
        
        addNotification({
            type: 'success',
            title: 'Akun Dilepas',
            message: `Akun ${fullName} berhasil dihapus dari perangkat ini.`
        });

        // Fresh sync after delete
        await syncAccountsFromDB();
    } catch(e) {
        console.error("[Auth] DB Cleanup failed:", e);
    }
  };

  const syncAccountsFromDB = async () => {
    try {
        const { data, error } = await supabase.rpc('get_all_device_sessions', {
            target_device_id: deviceId
        });

        if (!error && data) {
            const normalized = data.map((d: any) => ({
                id: d.user_id,
                profile: d.profile_data,
                session: { refresh_token: d.refresh_token, access_token: '' },
                last_active: d.updated_at
            }));
            localStorage.setItem('otherAccounts', JSON.stringify(normalized));
        }
    } catch (e) {}
  };

  const switchAccount = async (targetAccount: any) => {
    if (!targetAccount) return;
    
    if (hasUnsavedChanges) {
        setPendingSwitchTarget(targetAccount);
        setShowUnsavedModal(true);
        return;
    }

    setLoading(true);

    const targetId = targetAccount.id || targetAccount.profile?.id;
    
    try {
        // 1. PRIMARY: Fetch from database (Cloud Source of Truth)
        const { data: backup, error: rpcError } = await supabase.rpc('get_backup_session', {
            target_user_id: targetId,
            target_device_id: deviceId
        });

        let activeToken = backup?.shared_token;

        // 2. FALLBACK SELF-HEALING: Only if DB is empty, try local for one-time recovery
        if (!activeToken && targetAccount.session?.refresh_token) {
            console.log("[Auth] Session not in DB, trying local fallback recovery...");
            activeToken = targetAccount.session.refresh_token;
        }

        if (!activeToken) {
            throw new Error(`Sesi tidak ditemukan di database maupun lokal untuk ${targetAccount.profile?.full_name || 'akun ini'}.`);
        }

        // Use the token to restore session
        const { data, error: refreshError } = await supabase.auth.refreshSession({ 
            refresh_token: activeToken 
        });

        if (refreshError || !data.session) {
            console.warn("[Auth] Background refresh failed, continuing with local state anyway.");
        }
        
        // 1. INSTANT UI UPDATE (Chrome-like feel)
        // Set user and tenant data instantly from the switcher list
        setUser(targetAccount.profile);
        userRef.current = targetAccount.profile;
        localStorage.setItem('qurma_active_profile', JSON.stringify(targetAccount.profile));
        
        // 2. Perform background sync if we have a session
        if (data?.session) {
            await handleAuthSuccess(data.session.user.id, data.session);
        }

        // 3. Client-side navigation
        const isSuperAdmin = targetAccount.profile.role === UserRole.SUPERADMIN;
        const targetHome = isSuperAdmin ? 'sa-dashboard' : 'dashboard';
        setCurrentPage(targetHome);
        window.history.pushState({}, '', `/app/${targetHome}`);
    } catch (error: any) {
        console.error("[Auth] Switch failed:", error);
        addNotification({ 
            type: 'error', 
            title: 'Sesi Tidak Valid', 
            message: error.message || 'Terjadi kesalahan sistem saat menghubungi database.'
        });
    } finally {
        setLoading(false);
    }
  };

  const handleAuthSuccess = async (userId: string, session: any) => {
    if (isUpdatingAuth.current) return;
    isUpdatingAuth.current = true;
    
    try {
        // Reduced delay for faster transition
        const profile = await getProfileWithRetry(userId, session?.user);
        if (!profile) {
            // If profile still fails, maybe session is truly invalid
            isUpdatingAuth.current = false;
            return;
        }

        setUser(profile);
        userRef.current = profile;
        localStorage.setItem('qurma_active_profile', JSON.stringify(profile));
        
        if (profile.tenant_id) {
            const tenantData = await getTenant(profile.tenant_id);
            setTenant(tenantData);
            localStorage.setItem('qurma_active_tenant', JSON.stringify(tenantData));
        }

        // CHECK CAPACITY BEFORE SAVING
        const accounts = getAccounts();
        const isAlreadyIn = accounts.some((a: any) => (a.id || a.profile?.id) === profile.id);
        
        if (!isAlreadyIn && accounts.length >= 100) {
            // Effectively disabled for 100 accounts
        } else {
            // CRITICAL: Await the save to DB before proceeding
            await saveAccount(profile, session);
        }

        // Smart URL Redirection
        const path = window.location.pathname.substring(1);
        const isSuperAdmin = profile.role === UserRole.SUPERADMIN;
        const targetHome = isSuperAdmin ? 'sa-dashboard' : 'dashboard';
        const isSaPage = path && path.includes('sa-');

        if (!path.startsWith('app') || (isSuperAdmin && path === 'app/dashboard') || (!isSuperAdmin && isSaPage)) {
            setCurrentPage(targetHome);
            window.history.pushState({}, '', `/app/${targetHome}`);
        }
        
        return profile;
    } catch (e) {
        console.error("[Auth] Sync failed:", e);
        return null;
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




    // [REMOVED AGGRESSIVE REFRESHER THAT WAS CAUSING SESSION LOSS]

    // 2. Auth Initialization
    const initAuth = async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        
        // --- DEEP RECOVERY LOGIC (DATABASE-BACKED) ---
        if (!session) {
            const activeProfileStr = localStorage.getItem('qurma_active_profile');
            if (activeProfileStr) {
                const activeProfile = JSON.parse(activeProfileStr);
                const accounts = getAccounts();
                const matched = accounts.find((a: any) => a.id === activeProfile.id);
                
                // Fallback 1: Try local session cache
                let recoveryToken = matched?.session?.refresh_token;

                // Fallback 2: If local cache missing, try DB via RPC
                if (!recoveryToken) {
                    const { data: backup } = await supabase.rpc('get_backup_session', {
                        target_user_id: activeProfile.id,
                        target_device_id: deviceId
                    });
                    if (backup?.shared_token) {
                        recoveryToken = backup.shared_token;
                    }
                }

                if (recoveryToken) {
                    const { data } = await supabase.auth.refreshSession({ refresh_token: recoveryToken });
                    session = data.session;
                }
            }
        }

        if (session) {
          await handleAuthSuccess(session.user.id, session);
        } else {
          setUser(null);
          setTenant(null);
          // Only redirect if we are currently on an app page
          if (window.location.pathname.startsWith('/app')) {
            window.history.pushState({}, '', '/');
          }
        }
      } catch (err) {
          console.error("[Auth] Init failed:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    if (!didInit.current) {
        didInit.current = true;
        initAuth();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        // PREVENT DOUBLE EXECUTE: Ignore background events if we are already in the middle of a manual switch
        if (isUpdatingAuth.current) return;

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
            handleAuthSuccess(session.user.id, session);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setTenant(null);
            localStorage.removeItem('qurma_active_profile');
            localStorage.removeItem('qurma_active_tenant');
            if (window.location.pathname.startsWith('/app')) window.history.pushState({}, '', '/');
        }
    });

    const sessionRefresher = null; // Removed

    return () => { 
        authListener.subscription.unsubscribe();
        window.removeEventListener('popstate', handlePopState);
    };
  }, []); 

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingPage, setPendingPage] = useState<PageView | null>(null);
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState<any | null>(null);
  const [pendingAddAccount, setPendingAddAccount] = useState(false);
  const [pendingLogout, setPendingLogout] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [saveTriggered, setSaveTriggered] = useState(0);

  const handleNavigation = (page: PageView) => {
    if (page === currentPage) return;
    if (hasUnsavedChanges) {
        setPendingPage(page);
        setShowUnsavedModal(true);
        return;
    }
    setCurrentPage(page);
    window.history.pushState({}, '', `/app/${page}`);
  }; 

  const proceedNavigation = () => {
    if (pendingPage) {
        setHasUnsavedChanges(false);
        setCurrentPage(pendingPage);
        window.history.pushState({}, '', `/app/${pendingPage}`);
        setPendingPage(null);
    } else if (pendingSwitchTarget) {
        setHasUnsavedChanges(false);
        const target = pendingSwitchTarget;
        setPendingSwitchTarget(null);
        switchAccount(target);
    } else if (pendingAddAccount) {
        setHasUnsavedChanges(false);
        setPendingAddAccount(false);
        handleAddAccount();
    } else if (pendingLogout) {
        setHasUnsavedChanges(false);
        setPendingLogout(false);
        handleLogout();
    }
    setShowUnsavedModal(false);
  };

  const handleSaveAndProceed = () => {
    setSaveTriggered(prev => prev + 1);
    // The component will handle save then call onSaveSuccess
  };

  // --- AUTH ACTIONS ---

  // Soft Logout: For 'Masuk Akun Lain'
  const handleAddAccount = async () => {
    if (hasUnsavedChanges) {
        setPendingAddAccount(true);
        setShowUnsavedModal(true);
        return;
    }
    setLoading(true);
    try {
        // PROACTIVE SAVE: Ensure current session is captured one last time before we clear active state
        const { data: { session } } = await supabase.auth.getSession();
        if (session && user) {
            saveAccount(user, session);
        }

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
    if (!user) return;
    
    if (hasUnsavedChanges) {
        setPendingLogout(true);
        setShowUnsavedModal(true);
        return;
    }

    setLoading(true);
    addNotification({ type: 'info', title: 'Keluar', message: 'Tutup sesi akun ini...' });
    
    try {
        const userId = user.id;
        // 1. Remove from otherAccounts & DB so it doesn't 'nyangkut'
        const accounts = getAccounts();
        const updated = accounts.filter((a: any) => (a.id || a.profile?.id) !== userId);
        localStorage.setItem('otherAccounts', JSON.stringify(updated));

        try {
            await supabase.rpc('delete_backup_session', {
                target_user_id: userId,
                target_device_id: deviceId
            });
        } catch(e) {}

        // 2. Full signOut invalidates the session on the server
        await supabase.auth.signOut();
        
        // 3. Clear active state
        setUser(null);
        setTenant(null);
        localStorage.removeItem('qurma_active_profile');
        localStorage.removeItem('qurma_active_tenant');

        // 4. If there are other accounts still available, try to auto-switch to the next one
        if (updated.length > 0) {
            const nextAcc = updated[0];
            switchAccount(nextAcc);
        } else {
            window.location.href = '/';
        }
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
      case 'pencapaian': return 'Pencapaian Santri';
      case 'teacher-notes': return 'Catatan Untuk Santri';
      case 'settings': return 'Pengaturan';
      case 'weekly-target': return 'Input Target Pekanan';
      // case 'student-progress-manage': return 'Kelola Perkembangan';
      case 'sa-dashboard': return 'Platform Dashboard';
      case 'sa-tenants': return 'Manajemen Sekolah';
      case 'sa-users': return 'Manajemen Pengguna Global';
      case 'sa-audit-logs': return 'Global Audit Logs';
      case 'sa-platform-settings': return 'Pengaturan Platform';
      case 'sa-email-settings': return 'Pengaturan Email';
      case 'weekly-target-monitor': return 'Monitor Target Pekanan';
      case 'monitor-hafalan': return 'Monitor Hafalan Santri';
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
      case 'monitor-hafalan': return 'Pantau progres dan kualitas setoran hafalan santri secara menyeluruh';
      case 'pencapaian': return 'Daftar penghargaan dan apresiasi atas kedisiplinan menghafal';
      case 'teacher-notes': return 'Kumpulan pesan motivasi dan evaluasi dari ustadz pembimbing';
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
      case 'input-hafalan': return user.role === UserRole.TEACHER ? <InputHafalan user={user} onSetUnsavedChanges={setHasUnsavedChanges} saveTrigger={saveTriggered} onSaveSuccess={proceedNavigation} isGlobalModalOpen={showUnsavedModal} /> : <div>Akses Ditolak</div>;
      case 'recap-hafalan': return (user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN) ? <MemorizationRecap user={user} /> : <div>Akses Ditolak</div>;
      case 'reports': return user.role === UserRole.SANTRI ? <StudentReports user={user} /> : <div>Akses Ditolak</div>;
      case 'weekly-target': return user.role === UserRole.TEACHER ? <WeeklyTarget user={user} onSetUnsavedChanges={setHasUnsavedChanges} saveTrigger={saveTriggered} onSaveSuccess={proceedNavigation} isGlobalModalOpen={showUnsavedModal} /> : <div>Akses Ditolak</div>;
      case 'student-progress-manage': return user.role === UserRole.TEACHER ? <ManageStudentProgress user={user} /> : <div>Akses Ditolak</div>;
      case 'weekly-target-monitor': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <WeeklyTargetMonitor user={user} tenantId={user.tenant_id!} /> : <div>Akses Ditolak</div>;
      case 'monitor-hafalan': return (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) ? <MonitorHafalan user={user} tenantId={user.tenant_id!} /> : <div>Akses Ditolak</div>;
      case 'guardian-exams': return user.role === UserRole.SANTRI ? <StudentExamResults user={user} /> : <div>Akses Ditolak</div>;
      case 'student-progress': return user.role === UserRole.SANTRI ? <StudentProgress user={user} /> : <div>Akses Ditolak</div>;
      case 'pencapaian': return user.role === UserRole.SANTRI ? <StudentAchievements user={user} /> : <div>Akses Ditolak</div>;
      case 'teacher-notes': return user.role === UserRole.SANTRI ? <TeacherNotesList user={user} /> : <div>Akses Ditolak</div>;
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
      onRemoveAccount={removeAccount}
      onSyncAccounts={syncAccountsFromDB}
      isImpersonating={!!originalUser}
      onStopImpersonating={stopImpersonating}
      subtitle={getPageSubtitle(currentPage)}
    >
      <div className="animate-fade-in">
        {renderContent()}
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in lg:pl-64">
              <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-[380px] overflow-hidden animate-scale-in border border-white/50">
                  <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-sm border border-amber-100">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-normal mb-3">Tunggu Sebentar!</h3>
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide opacity-80">
                          Anda memiliki perubahan data yang belum disimpan. Ingin menyimpannya sebelum pindah halaman?
                      </p>
                  </div>
                  <div className="px-6 pb-8 flex items-center gap-2">
                      <button 
                          onClick={() => { setShowUnsavedModal(false); setPendingPage(null); }}
                          className="flex-1 py-3 bg-white text-slate-400 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-all active:scale-95"
                      >
                          Batal
                      </button>
                      <button 
                          onClick={proceedNavigation}
                          className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                      >
                          Buang
                      </button>
                      <button 
                          onClick={handleSaveAndProceed}
                          className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 outline-none"
                      >
                          Simpan & Pindah
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* ACCOUNT CAPACITY MODAL */}
      {showCapacityPrompt && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-[380px] overflow-hidden animate-scale-in border border-white/50">
            <div className="p-8 text-center text-balance">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6 border border-amber-100/50">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-normal mb-3">Slot Akun Penuh</h3>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide opacity-80 mb-8">
                Hanya dapat menyimpan maksimal <span className="font-black text-slate-800">5 akun</span>. 
                Hubungkan akun ini dengan melepas <span className="font-black text-indigo-600">{(getAccounts().sort((a: any, b: any) => new Date(a.last_active).getTime() - new Date(b.last_active).getTime())[0]?.profile?.full_name)}</span>?
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    const { profile, session } = showCapacityPrompt;
                    await saveAccount(profile, session);
                    setShowCapacityPrompt(null);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  Ganti Akun Terlama
                </button>
                <button 
                  onClick={() => setShowCapacityPrompt(null)}
                  className="w-full py-3.5 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 active:scale-95"
                >
                  Masuk Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
