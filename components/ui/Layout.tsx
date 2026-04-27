
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, PageView, Tenant } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Menu, 
  X,
  GraduationCap,
  ClipboardCheck,
  Award,
  BookOpen,
  TrendingUp,
  Activity,
  School,
  LogOut as LogoutIcon,
  UserCheck,
  Building,
  Mail,
  ShieldCheck,
  Globe,
  FileText,
  EyeOff,
  ChevronDown,
  UserPlus,
  Check,
  User,
  Trash2,
  AlertTriangle,
  LogOut,
  Target,
  Calendar,
  MessageSquare,
  Bell,
  Clock,
  Info,
  ChevronRight
} from 'lucide-react';
import { useNotification } from '../../lib/NotificationContext';
import { ConfirmModal } from './ConfirmModal';
import { supabase } from '../../lib/supabase';
import { AppNotification, getMyNotifications, markNotificationsAsRead, getGuardianStats } from '../../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  tenant: Tenant | null;
  title: string;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
  onAddAccount?: () => void;
  onSwitchAccount?: (account: any) => void;
  onRemoveAccount?: (id: string, name: string) => void;
  onSyncAccounts?: () => Promise<void>;
  isImpersonating?: boolean;
  onStopImpersonating?: () => void;
  subtitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  tenant, 
  title, 
  currentPage, 
  onNavigate, 
  onLogout,
  onAddAccount,
  onSwitchAccount,
  onRemoveAccount,
  onSyncAccounts,
  isImpersonating = false,
  onStopImpersonating,
  subtitle
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalHafalan, setTotalHafalan] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchMyNotifications = async () => {
    try {
        const data = await getMyNotifications(user.id);
        setNotifications(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (user.role === UserRole.SANTRI) {
        getGuardianStats(user.id).then(stats => {
            if (stats) setTotalHafalan(stats.totalJuz.toString());
        });
    }
  }, [user.id, user.role]);

  useEffect(() => {
    fetchMyNotifications();
    
    const channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
        }, (payload) => {
            setNotifications(prev => [payload.new as AppNotification, ...prev]);
        })
        .subscribe();

    const interval = setInterval(fetchMyNotifications, 60000);
    
    return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Load saved accounts from localStorage
  const refreshLocalAccounts = async () => {
    // 1. Sync from server to get freshest DB state
    if (onSyncAccounts) {
        await onSyncAccounts();
    }

    const accounts = localStorage.getItem('otherAccounts');
    if (accounts) {
      try {
        const parsed = JSON.parse(accounts) as any[];
        const normalized = parsed
            .filter(a => a && (a.id || a.profile?.id) !== user.id)
            .map(a => {
                if (a.profile) return a;
                return { id: a.id, profile: a, session: null };
            })
            .filter(a => a.profile && a.profile.full_name);
        setSavedAccounts(normalized);
      } catch (e) {
        setSavedAccounts([]);
      }
    } else {
        setSavedAccounts([]);
    }
  };

  useEffect(() => {
    refreshLocalAccounts();
  }, [user.id, isProfileOpen]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const renderFormattedMessage = (msg: string) => {
    return msg.split(' ').map((word, i) => {
        const lower = word.toLowerCase();
        const highlight = ['sabaq', 'sabqi', 'manzil', 'juz', 'halaman', 'santri', 'ananda', 'telah', 'update'].some(term => lower.includes(term));
        return highlight ? <span key={i} className="font-extrabold text-slate-800">{word} </span> : word + ' ';
    });
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (user.role === UserRole.SANTRI && notif.title === "Update Hafalan Baru") {
        onNavigate('reports');
    }
    setIsNotificationsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSidebarOpen]);

  // Update Favicon based on school logo
  useEffect(() => {
    if (tenant?.logo_url) {
      const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = tenant.logo_url;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [tenant?.logo_url]);

  const NavItem = ({ icon: Icon, label, page, active }: { icon: any, label: string, page: PageView, active?: boolean }) => (
    <div className="px-3 py-0.5">
      <button 
        onClick={() => {
          onNavigate(page);
          setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center px-4 py-2.5 text-sm transition-all duration-200 rounded-xl border-2 group
          ${active 
            ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm shadow-indigo-50' 
            : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
        `}
      >
        <Icon className={`w-4 h-4 mr-3 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className={`tracking-tight ${active ? 'font-black' : 'font-bold'} text-[11px] uppercase`}>{label}</span>
        {active && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
        )}
      </button>
    </div>
  );

  const isSuperAdmin = user.role === UserRole.SUPERADMIN;
  const topOffsetClass = isImpersonating ? 'top-10' : 'top-0';
  const paddingTopClass = isImpersonating ? 'pt-10' : '';

  const handleSwitchAccount = (targetAccount: any) => {
      if (onSwitchAccount) {
          onSwitchAccount(targetAccount);
          setIsProfileOpen(false);
      }
  };

  const handleRemoveAccount = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      setDeleteConfirm({ id, name });
  };

  const executeRemoveAccount = async () => {
    if (!deleteConfirm) return;
    if (onRemoveAccount) {
        await (onRemoveAccount as any)(deleteConfirm.id, deleteConfirm.name);
    } else {
        const accounts = localStorage.getItem('otherAccounts');
        if (accounts) {
            try {
                const parsed = JSON.parse(accounts) as any[];
                const filtered = parsed.filter(a => (a.id || a.profile?.id) !== deleteConfirm.id);
                localStorage.setItem('otherAccounts', JSON.stringify(filtered));
            } catch(e) {}
        }
    }
    refreshLocalAccounts();
    setDeleteConfirm(null);
  };
  
  const getAvatarColor = (name: string) => {
    const colors = [
        'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 
        'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`min-h-screen bg-[#F8F9FB] font-sans text-slate-800 ${paddingTopClass}`}>
      
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 h-10 bg-slate-800 text-white z-[70] flex items-center justify-between px-4 shadow-md">
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium animate-pulse">
                <EyeOff className="w-4 h-4 text-orange-400" />
                <span>
                    Mode Penyamaran: <strong>{user.full_name}</strong> ({user.role})
                </span>
            </div>
            <button 
                onClick={onStopImpersonating}
                className="bg-white text-slate-900 px-3 py-1 rounded text-[10px] md:text-xs font-bold hover:bg-orange-100 transition-colors uppercase tracking-wide"
            >
                Kembali ke Superadmin
            </button>
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[55] bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-[60] w-64 bg-white border-r border-slate-100 flex flex-col h-[calc(100vh)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isImpersonating ? 'mt-10 h-[calc(100vh-40px)]' : ''}`}
      >
        <div className="px-5 py-8 flex items-center gap-4 shrink-0 border-b border-slate-50/50 mb-2">
            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center overflow-hidden shadow-sm border border-slate-100 transition-all bg-white shrink-0`}>
                {isSuperAdmin ? (
                    <Globe className="w-7 h-7 text-slate-800" />
                ) : (
                    tenant?.logo_url ? (
                        <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                        <School className="w-7 h-7 text-indigo-600" />
                    )
                )}
            </div>
            <div className="overflow-hidden">
                <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none truncate">
                    {isSuperAdmin ? 'PLATFORM HQ' : (tenant?.name?.toUpperCase() || 'QURMA')}
                </h1>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 ${isSuperAdmin ? 'text-slate-500' : 'text-indigo-600'}`}>
                    {isSuperAdmin ? 'Super Control' : 'Tahfidz System'}
                </p>
            </div>
            <button className="lg:hidden ml-auto text-slate-400" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1 overscroll-contain">
            {isSuperAdmin ? (
                <>
                    <NavItem icon={LayoutDashboard} label="Dashboard" page="sa-dashboard" active={currentPage === 'sa-dashboard'} />
                    <NavItem icon={Building} label="Manajemen Sekolah" page="sa-tenants" active={currentPage === 'sa-tenants'} />
                    <NavItem icon={Users} label="Pengguna Global" page="sa-users" active={currentPage === 'sa-users'} />
                    <NavItem icon={ShieldCheck} label="Audit Logs" page="sa-audit-logs" active={currentPage === 'sa-audit-logs'} />
                </>
            ) : (
                <>
                    <NavItem icon={LayoutDashboard} label="Beranda" page="dashboard" active={currentPage === 'dashboard'} />
                    {user.role === UserRole.TEACHER && (
                        <>
                            <NavItem icon={BookOpen} label="Input Hafalan" page="input-hafalan" active={currentPage === 'input-hafalan'}/>
                            <NavItem icon={Target} label="Target Pekanan" page="weekly-target" active={currentPage === 'weekly-target'}/>
                            {/* <NavItem icon={TrendingUp} label="Kelola Perkembangan" page="student-progress-manage" active={currentPage === 'student-progress-manage'}/> */}
                            <NavItem icon={Users} label="Data Santri" page="data-santri" active={currentPage === 'data-santri'}/>
                        </>
                    )}
                    {(user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && (
                        <>
                            <NavItem icon={Users} label="Manajemen User" page="users" active={currentPage === 'users'}/>
                            <NavItem icon={UserCheck} label="Manajemen Santri" page="student-management" active={currentPage === 'student-management'}/>
                            {/* <NavItem icon={School} label="Manajemen Kelas" page="classes" active={currentPage === 'classes'}/> */}
                            <NavItem icon={GraduationCap} label="Manajemen Halaqah" page="halaqah-management" active={currentPage === 'halaqah-management'}/>
                            {/* <NavItem icon={Target} label="Manajemen Target" page="target-management" active={currentPage === 'target-management'}/> */}
                            <NavItem icon={Activity} label="Monitor Hafalan Santri" page="monitor-hafalan" active={currentPage === 'monitor-hafalan'}/>
                            <NavItem icon={ClipboardCheck} label="Monitor Target Pekanan" page="weekly-target-monitor" active={currentPage === 'weekly-target-monitor'}/>
                            <NavItem icon={ShieldCheck} label="Audit Logs" page="audit-logs" active={currentPage === 'audit-logs'}/>
                        </>
                    )}
                    {user.role === UserRole.SANTRI && (
                        <>
                            <NavItem icon={BookOpen} label="Mutaba'ah Hafalan" page="reports" active={currentPage === 'reports'}/>
                            <NavItem icon={Award} label="Pencapaian" page="pencapaian" active={currentPage === 'pencapaian'}/>
                            <NavItem icon={MessageSquare} label="Catatan Santri" page="teacher-notes" active={currentPage === 'teacher-notes'}/>
                            {/* <NavItem icon={TrendingUp} label="Perkembangan" page="student-progress" active={currentPage === 'student-progress'}/>
                            <NavItem icon={ShieldCheck} label="Nilai Ujian" page="guardian-exams" active={currentPage === 'guardian-exams'}/> */}
                        </>
                    )}
                </>
            )}
        </div>

        <div className="py-4 border-t border-slate-100 shrink-0 bg-white space-y-1">
            {isSuperAdmin ? (
                <>
                    <NavItem icon={Settings} label="Pengaturan Platform" page="sa-platform-settings" active={currentPage === 'sa-platform-settings'} />
                    <NavItem icon={Mail} label="Pengaturan Email" page="sa-email-settings" active={currentPage === 'sa-email-settings'} />
                </>
            ) : (
                <NavItem icon={Settings} label="Pengaturan" page="settings" active={currentPage === 'settings'}/>
            )}
        </div>
      </aside>

      <div className={`lg:pl-64 flex flex-col min-h-screen transition-all duration-300`}>
        <header className={`fixed right-0 left-0 lg:left-64 z-50 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-all shadow-sm ${topOffsetClass}`}>
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="w-6 h-6" />
                </button>
                <div className="hidden md:block">
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
                    {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto relative">
                {/* TOTAL HAFALAN FOR SANTRI - MINIMALIST STYLE */}
                {user.role === UserRole.SANTRI && (
                    <div className="hidden sm:flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-500">
                        <span className="text-[14px] font-black text-slate-700 tracking-tight leading-none">
                            {totalHafalan || '0'} <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em] ml-0.5">Juz</span>
                        </span>
                    </div>
                )}

                 {/* NOTIFICATION BELL */}
                 <div className="relative" ref={notifRef}>
                     <button 
                        onClick={() => {
                            setIsNotificationsOpen(!isNotificationsOpen);
                            if (!isNotificationsOpen && unreadCount > 0) {
                                markNotificationsAsRead(user.id);
                                // Optimistically clear unread locally
                                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            }
                        }}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${
                            isNotificationsOpen 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-inner' 
                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-indigo-500 shadow-sm'
                        }`}
                     >
                        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                     </button>

                     {/* Notification Dropdown */}
                     {isNotificationsOpen && (
                         <div className="absolute right-0 top-full mt-4 w-72 sm:w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 ring-1 ring-slate-900/5 z-[110] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                             <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                 <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Pemberitahuan</h4>
                                 <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Terbaru</span>
                             </div>

                             <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                                 {notifications.length > 0 ? (
                                     notifications.map((notif) => (
                                         <div 
                                            key={notif.id} 
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50/80 transition-all flex gap-3.5 group cursor-pointer relative ${!notif.is_read ? 'bg-indigo-50/20' : ''}`}
                                         >
                                             {!notif.is_read && (
                                                 <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                             )}
                                             <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${
                                                 notif.type === 'success' ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' :
                                                 notif.type === 'error' ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100' :
                                                 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100'
                                             }`}>
                                                 {notif.title.includes('Hafalan') ? <BookOpen className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <div className="flex items-center justify-between gap-2 mb-1">
                                                     <p className="text-[11px] font-black text-slate-900 leading-none truncate">{notif.title}</p>
                                                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter shrink-0">{formatTime(notif.created_at)}</span>
                                                 </div>
                                                 <p className="text-[10.5px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                                                     {renderFormattedMessage(notif.message)}
                                                 </p>
                                             </div>
                                             <div className="self-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                             </div>
                                         </div>
                                     ))
                                 ) : (
                                     <div className="py-12 px-6 text-center">
                                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                             <Bell className="w-6 h-6 text-slate-300" />
                                         </div>
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada pemberitahuan</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}
                 </div>

                 {/* WEEKLY DATE FOR SANTRI ROLE - TIERED STYLE */}
                 {user.role === UserRole.SANTRI && (
                    <div className="hidden xl:flex bg-white p-1 rounded-[20px] border border-slate-200 shadow-sm ring-1 ring-white animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 flex flex-col items-center justify-center">
                            <span className="text-[7px] text-indigo-300 mt-0.5 opacity-80 uppercase tracking-widest font-black leading-none mb-1">
                                Pekan Ini
                            </span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap leading-none">
                                {/* <Calendar className="w-3.5 h-3.5 text-indigo-400" /> */}
                                {(() => {
                                    const today = new Date();
                                    const day = today.getDay();
                                    const diffToMonday = (day === 0 ? -6 : 1) - day;
                                    const monday = new Date(today);
                                    monday.setDate(today.getDate() + diffToMonday);
                                    const friday = new Date(monday);
                                    friday.setDate(monday.getDate() + 4);
                                    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
                                    return `${monday.toLocaleDateString('id-ID', options)} - ${friday.toLocaleDateString('id-ID', options)}`;
                                })()}
                            </span>
                        </div>
                    </div>
                 )}

                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                 >
                    <div className="flex flex-col items-end max-w-[80px] sm:max-w-[120px] lg:max-w-none">
                        <span className="text-[9.5px] lg:text-xs font-black text-slate-900 uppercase tracking-tighter truncate w-full text-right">
                            {(user.role === UserRole.SANTRI && user.student_name) ? user.student_name : (user.full_name || 'User')}
                        </span>
                        <span className="text-[8px] lg:text-[10px] text-indigo-600 font-black uppercase tracking-widest opacity-70">{(user.role || '').replace('_', ' ')}</span>
                    </div>
                    <div className="w-9 h-9 bg-slate-200 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent((user.role === UserRole.SANTRI && user.student_name) ? user.student_name : (user.full_name || 'User'))}&background=${isSuperAdmin ? '1e293b' : '4f46e5'}&color=fff`} alt="" />
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {/* Profile Dropdown */}
                 {isProfileOpen && (
                     <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                        
                        {/* COMPACT LIST SECTION */}
                        <div className="p-2">
                            {savedAccounts.length > 0 && (
                                <>
                                    <p className="px-2 pt-1 pb-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Akun Lainnya</p>
                                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                        {savedAccounts.map(acc => {
                                            if (!acc?.profile) return null;
                                            const accId = acc.id || acc.profile.id;
                                            const avatarColor = getAvatarColor(acc.profile.full_name || 'User');
                                            
                                            return (
                                                <div key={accId} className="flex items-center group/item hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-100 overflow-hidden">
                                                    <button 
                                                        onClick={() => handleSwitchAccount(acc)}
                                                        className="flex-1 flex items-center px-2 py-1.5 text-left min-w-0"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                                            <div className={`w-7 h-7 flex-shrink-0 rounded-full ${avatarColor} text-white flex items-center justify-center text-[10px] font-bold shadow-sm`}>
                                                                {(acc.profile.full_name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1 pb-1">
                                                                <p className="text-[11px] font-bold text-slate-700 truncate pr-1" title={acc.profile.full_name}>
                                                                    {acc.profile.full_name}
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-medium uppercase truncate">
                                                                    {(acc.profile.role || '').replace('_', ' ')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <div className="flex-shrink-0 w-8 flex justify-center">
                                                        <button 
                                                            onClick={(e) => handleRemoveAccount(e, accId, acc.profile.full_name)}
                                                            className="p-1.5 opacity-0 group-hover/item:opacity-100 hover:text-red-500 text-slate-300 transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="my-2 border-t border-slate-50"></div>
                                </>
                            )}

                            {/* COMPACT FOOTER ACTIONS */}
                            <div className="space-y-0.5">
                                <button 
                                    onClick={() => { onAddAccount?.(); setIsProfileOpen(false); }}
                                    className="w-full flex items-center px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-lg transition-all group/btn"
                                >
                                    <UserPlus className="w-3.5 h-3.5 mr-2 text-slate-400 group-hover/btn:text-primary-500" />
                                    Masuk Akun Lain
                                </button>
                                
                                <button 
                                    onClick={() => { onLogout?.(); setIsProfileOpen(false); }}
                                    className="w-full flex items-center px-2 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5 mr-2 text-red-400" />
                                    Keluar dari QurMa
                                </button>
                            </div>
                        </div>

                        <div className="py-2 bg-slate-50/50">
                            <p className="text-[9px] text-slate-400 text-center uppercase tracking-tighter font-bold opacity-60">Versi 1.4 Production</p>
                        </div>
                    </div>
                 )}
            </div>
        </header>

        <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-24 min-h-[calc(100vh-64px)] overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
                {children}
            </div>
        </main>

        {/* CUSTOM DELETE CONFIRMATION MODAL */}
        <ConfirmModal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={executeRemoveAccount}
            title="Lepas Akun?"
            variant="danger"
            centerOnScreen={true}
            confirmLabel="YA, LEPAS AKUN"
            message={
                <span>
                    Apakah Anda yakin ingin melepas akun <strong className="text-slate-800">"{deleteConfirm?.name}"</strong>? 
                    <br/><span className="mt-2 block text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-75">Anda harus login manual lagi untuk menambahkannya kembali.</span>
                </span>
            }
        />
      </div>
    </div>
  );
};
