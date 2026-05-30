import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Student, AdminStats, Halaqah, MemorizationType, MemorizationStatus } from '../../types';
import { getWeeklyTargets, getWeeklyAllTypeTotals, getTenantRecords } from '../../services/dataService';

interface AdminDashboardContextProps {
    user: UserProfile;
    adminStats: AdminStats | null;
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    students: Student[];
    activeDays: number[];
    isRefreshing: boolean;
    refreshData: (showFullLoader?: boolean) => Promise<void>;

    // Trend States
    adminTrendType: MemorizationType | 'all';
    setAdminTrendType: (t: MemorizationType | 'all') => void;
    adminTrendPeriod: 'weekly' | 'monthly' | '3months' | '6months' | 'yearly';
    setAdminTrendPeriod: (p: any) => void;
    adminTrendWeekOffset: number;
    setAdminTrendWeekOffset: (o: number | ((v: number) => number)) => void;
    adminTrendMonth: number;
    setAdminTrendMonth: (m: number | ((v: number) => number)) => void;
    adminTrendYear: number;
    setAdminTrendYear: (y: number | ((v: number) => number)) => void;
    loadingAdminTrend: boolean;
    adminTrendData: any[];

    // Target States
    adminTargetHalaqahId: string;
    setAdminTargetHalaqahId: (id: string) => void;
    adminTargetWeekOffset: number;
    setAdminTargetWeekOffset: (o: number | ((v: number) => number)) => void;
    adminTargetData: any[];
    adminKehadiranTrendData: any[];
    loadingAdminTargetChart: boolean;
    adminTargetWeekRange: { display: string; start: string; end: string };
}

const AdminDashboardContext = createContext<AdminDashboardContextProps | undefined>(undefined);

export const useAdminDashboard = () => {
    const context = useContext(AdminDashboardContext);
    if (!context) {
        throw new Error('useAdminDashboard must be used within an AdminDashboardProvider');
    }
    return context;
};

interface AdminDashboardProviderProps {
    children: React.ReactNode;
    user: UserProfile;
    adminStats: AdminStats | null;
    halaqahs: Halaqah[];
    allUsers: UserProfile[];
    students: Student[];
    activeDays: number[];
    isRefreshing: boolean;
    refreshData: (showFullLoader?: boolean) => Promise<void>;
}

export const AdminDashboardProvider: React.FC<AdminDashboardProviderProps> = ({
    children,
    user,
    adminStats,
    halaqahs,
    allUsers,
    students,
    activeDays,
    isRefreshing,
    refreshData
}) => {
    // Admin Specific States
    const [adminTrendType, setAdminTrendType] = useState<MemorizationType | 'all'>(MemorizationType.SABAQ);
    const [adminTrendPeriod, setAdminTrendPeriod] = useState<'weekly' | 'monthly' | '3months' | '6months' | 'yearly'>('weekly');
    const [adminTrendWeekOffset, setAdminTrendWeekOffset] = useState(0);
    const [adminTrendMonth, setAdminTrendMonth] = useState(new Date().getMonth());
    const [adminTrendYear, setAdminTrendYear] = useState(new Date().getFullYear());
    const [adminTrendData, setAdminTrendData] = useState<any[]>([]);
    const adminTrendCache = useRef<Record<string, any[]>>({});
    const [loadingAdminTrend, setLoadingAdminTrend] = useState(false);
    
    const [adminTargetHalaqahId, setAdminTargetHalaqahId] = useState<string>('all');
    const [adminTargetWeekOffset, setAdminTargetWeekOffset] = useState<number>(0);
    const [adminTargetData, setAdminTargetData] = useState<any[]>([]);
    const [adminKehadiranTrendData, setAdminKehadiranTrendData] = useState<any[]>([]);
    const [loadingAdminTargetChart, setLoadingAdminTargetChart] = useState(false);

    // Admin-specific calculation logic
    const adminTargetWeekRange = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day + (adminTargetWeekOffset * 7);
        const start = new Date(today);
        start.setDate(today.getDate() + diff);
        const end = new Date(start);
        const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
        end.setDate(start.getDate() + rangeLength);
        const formatToLocalISO = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayStr = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dayStr}`;
        };
        return {
            start: formatToLocalISO(start),
            end: formatToLocalISO(end),
            display: `${start.getDate()} ${start.toLocaleDateString('id-ID', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short' })} ${end.getFullYear()}`
        };
    }, [adminTargetWeekOffset, activeDays.length]);

    useEffect(() => {
        if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
            const fetchTargetAchievement = async () => {
                setLoadingAdminTargetChart(true);
                try {
                    let filteredStudents = students;
                    if (adminTargetHalaqahId !== 'all') filteredStudents = students.filter(s => s.halaqah_id === adminTargetHalaqahId);
                    if (filteredStudents.length === 0) { setAdminTargetData([]); return; }
                    const studentIds = filteredStudents.map(s => s.id);
                    const [targets, weeklyTotals, records] = await Promise.all([
                        getWeeklyTargets(studentIds, adminTargetWeekRange.start),
                        getWeeklyAllTypeTotals(studentIds, adminTargetWeekRange.start),
                        getTenantRecords(studentIds, adminTargetWeekRange.start, adminTargetWeekRange.end)
                    ]);
                    const stats = {
                        sabaq: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 },
                        sabqi: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 },
                        manzil: { tercapai: 0, tidakTercapai: 0, terlampaui: 0 }
                    };
                    targets.forEach(t => {
                        const studentTotals = weeklyTotals[t.student_id] || { sabaq: 0, sabqi: 0, manzil: 0 };
                        const data = t.target_data || {};
                        const sabaqTarget = Number(data.sabaq_target || 0);
                        const sabaqActual = Number(studentTotals.sabaq || 0);
                        if (sabaqTarget > 0) {
                            if (sabaqActual > sabaqTarget) stats.sabaq.terlampaui++;
                            else if (sabaqActual === sabaqTarget) stats.sabaq.tercapai++;
                            else stats.sabaq.tidakTercapai++;
                        }
                        const sabqiTarget = Number(data.sabqi_target || 0);
                        const sabqiActual = Number(studentTotals.sabqi || 0);
                        if (sabqiTarget > 0) {
                            if (sabqiActual > sabqiTarget) stats.sabqi.terlampaui++;
                            else if (sabqiActual === sabqiTarget) stats.sabqi.tercapai++;
                            else stats.sabqi.tidakTercapai++;
                        }
                        const manzilTarget = Number(data.manzil_hal || 0);
                        const manzilActual = Number(studentTotals.manzil || 0);
                        if (manzilTarget > 0) {
                            if (manzilActual > manzilTarget) stats.manzil.terlampaui++;
                            else if (manzilActual === manzilTarget) stats.manzil.tercapai++;
                            else stats.manzil.tidakTercapai++;
                        }
                    });
                    setAdminTargetData([
                        { name: 'SABAQ', tercapai: stats.sabaq.tercapai, tidakTercapai: stats.sabaq.tidakTercapai, terlampaui: stats.sabaq.terlampaui },
                        { name: 'SABQI', tercapai: stats.sabqi.tercapai, tidakTercapai: stats.sabqi.tidakTercapai, terlampaui: stats.sabqi.terlampaui },
                        { name: 'MANZIL', tercapai: stats.manzil.tercapai, tidakTercapai: stats.manzil.tidakTercapai, terlampaui: stats.manzil.terlampaui }
                    ]);
    
                    const kehadiranTrend: { name: string, hadir: number, tidak_hadir: number }[] = [];
                    const startD = new Date(adminTargetWeekRange.start);
                    const endD = new Date(adminTargetWeekRange.end);
                    const formatD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    
                    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
                        const dateStr = formatD(d);
                        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                        const dayRecords = records.filter(r => r.record_date.startsWith(dateStr));
                        
                        const uniqueStudentsDay = new Set<string>();
                        let absentCountDay = 0;
                        
                        dayRecords.forEach(r => {
                            if (!uniqueStudentsDay.has(r.student_id)) {
                                uniqueStudentsDay.add(r.student_id);
                                if (r.status === MemorizationStatus.SAKIT || r.status === MemorizationStatus.IZIN || r.status === MemorizationStatus.ALPA) {
                                    absentCountDay++;
                                }
                            }
                        });
                        
                        const hadirCountDay = Math.max(0, filteredStudents.length - absentCountDay);
                        kehadiranTrend.push({ name: dayName, hadir: hadirCountDay, tidak_hadir: absentCountDay });
                    }
                    setAdminKehadiranTrendData(kehadiranTrend);
                } catch (error) {
                    console.error("Error fetching target achievement data:", error);
                } finally {
                    setLoadingAdminTargetChart(false);
                }
            };
            fetchTargetAchievement();
        }
    }, [user.role, students, adminTargetHalaqahId, adminTargetWeekOffset, adminTargetWeekRange.start]);
    
    useEffect(() => {
        if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR) && students.length > 0) {
            const fetchRangeData = async () => {
                const cacheKey = `${adminTrendPeriod}-${adminTrendYear}-${adminTrendMonth}-${adminTrendWeekOffset}`;
                if (adminTrendCache.current[cacheKey]) {
                    setAdminTrendData(adminTrendCache.current[cacheKey]);
                    return;
                }
    
                setLoadingAdminTrend(true);
                try {
                    const studentIds = students.map(s => s.id);
                    let start, end;
                    if (adminTrendPeriod === 'weekly') {
                        const today = new Date();
                        const day = today.getDay();
                        const diff = (day === 0 ? -6 : 1) - day + (adminTrendWeekOffset * 7);
                        start = new Date(today);
                        start.setDate(today.getDate() + diff);
                        end = new Date(start);
                        const rangeLength = activeDays.length > 0 ? activeDays.length - 1 : 4;
                        end.setDate(start.getDate() + rangeLength);
                    } else if (adminTrendPeriod === 'monthly') {
                        start = new Date(adminTrendYear, adminTrendMonth, 1);
                        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                    } else if (adminTrendPeriod === '3months') {
                        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                        start = new Date(adminTrendYear, adminTrendMonth - 2, 1);
                    } else if (adminTrendPeriod === '6months') {
                        if (adminTrendMonth < 6) { start = new Date(adminTrendYear, 0, 1); end = new Date(adminTrendYear, 6, 0); }
                        else { start = new Date(adminTrendYear, 6, 1); end = new Date(adminTrendYear, 12, 0); }
                    } else if (adminTrendPeriod === 'yearly') {
                        start = new Date(adminTrendYear, 0, 1);
                        end = new Date(adminTrendYear, 11, 31);
                    } else {
                        start = new Date(adminTrendYear, adminTrendMonth, 1);
                        end = new Date(adminTrendYear, adminTrendMonth + 1, 0);
                    }
                    const formatD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const records = await getTenantRecords(studentIds, formatD(start), formatD(end));
    
                    const isMonthlyAggregation = adminTrendPeriod !== 'weekly' && adminTrendPeriod !== 'monthly';
                    const groups: Record<string, { sabaq: number, sabqi: number, manzil: number }> = {};
    
                    if (!isMonthlyAggregation) {
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            const dateStr = formatD(d);
                            groups[dateStr] = { sabaq: 0, sabqi: 0, manzil: 0 };
                        }
                    } else {
                        for (let d = new Date(start); d <= end; ) {
                            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            groups[mKey] = { sabaq: 0, sabqi: 0, manzil: 0 };
                            d.setMonth(d.getMonth() + 1);
                        }
                    }
    
                    records.forEach(rec => {
                        const dateStr = rec.record_date.split('T')[0];
                        const mKey = dateStr.slice(0, 7);
                        const key = isMonthlyAggregation ? mKey : dateStr;
                        if (groups[key] !== undefined && rec.status !== MemorizationStatus.TIDAK_SETOR) {
                             if (rec.type === MemorizationType.SABAQ) groups[key].sabaq++;
                             else if (rec.type === MemorizationType.SABQI) groups[key].sabqi++;
                             else if (rec.type === MemorizationType.MANZIL) groups[key].manzil++;
                        }
                    });
    
                    const chartData = Object.entries(groups).map(([key, counts]) => {
                        let name = "";
                        if (!isMonthlyAggregation) {
                            const d = new Date(key);
                            name = `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;
                        } else {
                            const [y, m] = key.split('-');
                            name = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                        }
                        return { name, sabaq: counts.sabaq, sabqi: counts.sabqi, manzil: counts.manzil, fullDate: key };
                    });
    
                    adminTrendCache.current[cacheKey] = chartData;
                    setAdminTrendData(chartData);
    
                } catch (error) {
                    console.error("Error fetching admin trend records:", error);
                } finally {
                    setLoadingAdminTrend(false);
                }
            };
            fetchRangeData();
        }
    }, [adminTrendMonth, adminTrendYear, adminTrendPeriod, adminTrendWeekOffset, user.role, students.length, activeDays]);

    const value = {
        user,
        adminStats,
        halaqahs,
        allUsers,
        students,
        activeDays,
        isRefreshing,
        refreshData,

        adminTrendType,
        setAdminTrendType,
        adminTrendPeriod,
        setAdminTrendPeriod,
        adminTrendWeekOffset,
        setAdminTrendWeekOffset,
        adminTrendMonth,
        setAdminTrendMonth,
        adminTrendYear,
        setAdminTrendYear,
        loadingAdminTrend,
        adminTrendData,

        adminTargetHalaqahId,
        setAdminTargetHalaqahId,
        adminTargetWeekOffset,
        setAdminTargetWeekOffset,
        adminTargetData,
        adminKehadiranTrendData,
        loadingAdminTargetChart,
        adminTargetWeekRange
    };

    return (
        <AdminDashboardContext.Provider value={value}>
            {children}
        </AdminDashboardContext.Provider>
    );
};
