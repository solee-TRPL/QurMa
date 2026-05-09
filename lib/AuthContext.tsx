'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, UserRole, PageView, Tenant } from '@/types';
import { getProfileWithRetry, signOut } from '@/services/authService';
import { getTenant } from '@/services/dataService';
import { supabase } from '@/lib/supabase';
import { useLoading } from './LoadingContext';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  user: UserProfile | null;
  tenant: Tenant | null;
  isInitializing: boolean;
  currentPage: PageView;
  deviceId: string;
  isImpersonating: boolean;
  originalUser: UserProfile | null;
  originalTenant: Tenant | null;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  showUnsavedModal: boolean;
  setShowUnsavedModal: (val: boolean) => void;
  saveTriggered: number;
  handleNavigation: (page: PageView) => void;
  proceedNavigation: () => void;
  triggerSave: () => void;
  handleLogout: () => Promise<void>;
  handleAddAccount: () => Promise<void>;
  switchAccount: (target: any) => Promise<void>;
  removeAccount: (userId: string, fullName: string) => Promise<void>;
  syncAccountsFromDB: () => Promise<void>;
  handleImpersonate: (target: UserProfile) => Promise<void>;
  stopImpersonating: () => void;
  updateProfile: (p: UserProfile) => void;
  updateTenant: (t: Tenant) => void;
  saveAccount: (p: UserProfile, s: any) => Promise<void>;
  getAccounts: () => any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setLoading } = useLoading();
  const { addNotification } = useNotification();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingPage, setPendingPage] = useState<PageView | null>(null);
  const [saveTriggered, setSaveTriggered] = useState(0);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [originalTenant, setOriginalTenant] = useState<Tenant | null>(null);
  
  const userRef = useRef<UserProfile | null>(null);
  const isUpdatingAuth = useRef(false);
  const didInit = useRef(false);

  const [deviceId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('qurma_device_id');
    if (!id) {
        if (window.crypto && window.crypto.randomUUID) {
            id = window.crypto.randomUUID();
        } else {
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        localStorage.setItem('qurma_device_id', id);
    }
    return id;
  });

  const getAccounts = useCallback(() => {
    if (typeof window === 'undefined') return [];
    try {
        const cached = localStorage.getItem('otherAccounts');
        return cached ? JSON.parse(cached) : [];
    } catch (e) {
        return [];
    }
  }, []);

  const saveAccount = async (profile: UserProfile, session: any) => {
    if (!profile || !profile.id) return;
    const accounts = getAccounts();
    const filtered = accounts.filter((a: any) => (a.id || a.profile?.id) !== profile.id);
    
    if (filtered.length >= 100) {
        const oldest = filtered[filtered.length - 1];
        const oldestId = oldest.id || oldest.profile?.id;
        try {
            await supabase.rpc('delete_backup_session', { target_user_id: oldestId, target_device_id: deviceId });
        } catch (e) {}
    }

    const sessionData = { access_token: session.access_token, refresh_token: session.refresh_token };
    const newEntry = { id: profile.id, profile: profile, session: sessionData, last_active: new Date().toISOString() };
    const updatedList = [newEntry, ...filtered].slice(0, 100);
    localStorage.setItem('otherAccounts', JSON.stringify(updatedList));

    try {
        await supabase.rpc('save_backup_session', {
            target_user_id: profile.id,
            target_device_id: deviceId,
            target_token: session.refresh_token,
            target_profile: profile
        });
    } catch (e) {}
  };

  const handleAuthSuccess = useCallback(async (userId: string, session: any) => {
    if (isUpdatingAuth.current) return;
    isUpdatingAuth.current = true;
    
    try {
        const profile = await getProfileWithRetry(userId, session?.user);
        if (!profile) {
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

        await saveAccount(profile, session);

        // Auto redirect if on auth pages
        if (pathname === '/' || pathname === '/login' || pathname === '/landing') {
            const target = profile.role === UserRole.SUPERADMIN ? '/sa-dashboard' : '/dashboard';
            router.push(target);
        }
        
        return profile;
    } catch (e) {
        return null;
    } finally {
        isUpdatingAuth.current = false;
    }
  }, [pathname, router, deviceId]);

  // Initialization Effect
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Load initial from cache for speed
    const cachedProfile = localStorage.getItem('qurma_active_profile');
    const cachedTenant = localStorage.getItem('qurma_active_tenant');
    if (cachedProfile) setUser(JSON.parse(cachedProfile));
    if (cachedTenant) setTenant(JSON.parse(cachedTenant));

    const initAuth = async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            const activeProfileStr = localStorage.getItem('qurma_active_profile');
            if (activeProfileStr) {
                const activeProfile = JSON.parse(activeProfileStr);
                const accounts = getAccounts();
                const matched = accounts.find((a: any) => a.id === activeProfile.id);
                
                let recoveryToken = matched?.session?.refresh_token;
                if (!recoveryToken) {
                    const { data: backup } = await supabase.rpc('get_backup_session', {
                        target_user_id: activeProfile.id,
                        target_device_id: deviceId
                    });
                    if (backup?.shared_token) recoveryToken = backup.shared_token;
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
          setIsInitializing(false);
          const isPublicPath = pathname === '/' || pathname === '/login' || pathname === '/landing';
          if (!isPublicPath) router.push('/login');
        }
      } catch (err) {
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []); // Run once on mount

  // Auth State Listener Effect
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (isUpdatingAuth.current) return;
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
            handleAuthSuccess(session.user.id, session);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setTenant(null);
            localStorage.removeItem('qurma_active_profile');
            localStorage.removeItem('qurma_active_tenant');
            const isPublicPath = pathname === '/' || pathname === '/login' || pathname === '/landing';
            if (!isPublicPath) router.push('/login');
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [handleAuthSuccess, pathname, router]);

  const handleNavigation = (page: PageView) => {
    if (hasUnsavedChanges) {
      setPendingPage(page);
      setShowUnsavedModal(true);
      return;
    }
    router.push(`/${page}`);
  };

  const triggerSave = () => {
    setSaveTriggered(prev => prev + 1);
  };

  const proceedNavigation = () => {
    if (pendingPage) {
      setHasUnsavedChanges(false);
      router.push(`/${pendingPage}`);
      setPendingPage(null);
    }
    setShowUnsavedModal(false);
  };

  const handleLogout = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const userId = user.id;
        const accounts = getAccounts();
        const updated = accounts.filter((a: any) => (a.id || a.profile?.id) !== userId);
        localStorage.setItem('otherAccounts', JSON.stringify(updated));

        try {
            await supabase.rpc('delete_backup_session', { target_user_id: userId, target_device_id: deviceId });
        } catch(e) {}

        await supabase.auth.signOut();
        setUser(null);
        setTenant(null);
        localStorage.removeItem('qurma_active_profile');
        localStorage.removeItem('qurma_active_tenant');

        if (updated.length > 0) {
            switchAccount(updated[0]);
        } else {
            router.push('/login');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    setLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && user) await saveAccount(user, session);
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setTenant(null);
        localStorage.removeItem('qurma_active_profile');
        localStorage.removeItem('qurma_active_tenant');
        router.push('/login');
    } finally {
        setLoading(false);
    }
  };

  const switchAccount = async (targetAccount: any) => {
    if (!targetAccount) return;
    setLoading(true);
    const targetId = targetAccount.id || targetAccount.profile?.id;
    try {
        const { data: backup } = await supabase.rpc('get_backup_session', {
            target_user_id: targetId,
            target_device_id: deviceId
        });
        let activeToken = backup?.shared_token || targetAccount.session?.refresh_token;

        if (!activeToken) throw new Error("Sesi tidak ditemukan.");

        const { data } = await supabase.auth.refreshSession({ refresh_token: activeToken });
        setUser(targetAccount.profile);
        localStorage.setItem('qurma_active_profile', JSON.stringify(targetAccount.profile));
        
        if (data?.session) await handleAuthSuccess(data.session.user.id, data.session);
        
        const targetHome = targetAccount.profile.role === UserRole.SUPERADMIN ? 'sa-dashboard' : 'dashboard';
        router.push(`/${targetHome}`);
    } catch (error: any) {
        addNotification({ type: 'error', title: 'Gagal', message: error.message });
    } finally {
        setLoading(false);
    }
  };

  const removeAccount = async (userId: string, fullName: string) => {
    const accounts = getAccounts();
    const updated = accounts.filter((a: any) => (a.id || a.profile?.id) !== userId);
    localStorage.setItem('otherAccounts', JSON.stringify(updated));
    try {
        await supabase.rpc('delete_backup_session', { target_user_id: userId, target_device_id: deviceId });
        addNotification({ type: 'success', title: 'Berhasil', message: `Akun ${fullName} dilepas.` });
    } catch(e) {}
  };

  const syncAccountsFromDB = async () => {
    try {
        const { data, error } = await supabase.rpc('get_all_device_sessions', { target_device_id: deviceId });
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

  const handleImpersonate = async (targetUser: UserProfile) => {
    if (!user) return;
    setLoading(true);
    try {
        if (!originalUser) {
            setOriginalUser(user);
            setOriginalTenant(tenant);
        }
        let tData: Tenant | null = null;
        if (targetUser.tenant_id) tData = await getTenant(targetUser.tenant_id);
        setUser(targetUser);
        setTenant(tData);
        router.push('/dashboard');
    } catch (error) {
    } finally { setLoading(false); }
  };

  const stopImpersonating = () => {
      if (originalUser) {
          setUser(originalUser);
          setTenant(originalTenant);
          setOriginalUser(null);
          setOriginalTenant(null);
          router.push('/sa-users');
      }
  };

  const updateProfile = (p: UserProfile) => { setUser(p); localStorage.setItem('qurma_active_profile', JSON.stringify(p)); };
  const updateTenant = (t: Tenant) => { setTenant(t); localStorage.setItem('qurma_active_tenant', JSON.stringify(t)); };

  const value = {
    user, tenant, isInitializing, currentPage: (pathname?.split('/').pop() || 'dashboard') as PageView,
    deviceId, isImpersonating: !!originalUser, originalUser, originalTenant,
    hasUnsavedChanges, setHasUnsavedChanges, 
    showUnsavedModal, setShowUnsavedModal,
    saveTriggered, handleNavigation, proceedNavigation, triggerSave,
    handleLogout, handleAddAccount,
    switchAccount, removeAccount, syncAccountsFromDB, handleImpersonate, stopImpersonating,
    updateProfile, updateTenant, saveAccount, getAccounts
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
