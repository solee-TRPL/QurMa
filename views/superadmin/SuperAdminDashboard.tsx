
import React, { useEffect, useState, useMemo } from 'react';
import { getSuperAdminStats, getAllTenants } from '../../services/dataService';
import { SuperAdminStats, Tenant, PageView, UserProfile } from '../../types';
import { Building, Users, GraduationCap, UserCheck, TrendingUp, PieChart as PieChartIcon, Clock, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface SuperAdminDashboardProps {
    user: UserProfile;
    onNavigate: (page: PageView) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onNavigate }) => {
    const [stats, setStats] = useState<SuperAdminStats | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsData, tenantsData] = await Promise.all([
                    getSuperAdminStats(),
                    getAllTenants()
                ]);
                setStats(statsData);
                setTenants(tenantsData);
            } catch (error) {
                console.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Data Processing for Charts ---

    // 1. Growth Chart Data (Tenants created per month - Last 6 Months)
    const growthData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                month: d.toLocaleString('id-ID', { month: 'short' }),
                year: d.getFullYear(),
                key: `${d.getFullYear()}-${d.getMonth()}`, // Unique key for grouping
                count: 0
            };
        }).reverse();

        tenants.forEach(t => {
            const date = new Date(t.created_at);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const monthData = last6Months.find(m => m.key === key);
            if (monthData) {
                monthData.count++;
            }
        });

        // Accumulate counts to show total growth over time
        let runningTotal = 0;
        return last6Months.map(m => {
            runningTotal += m.count;
            return { name: m.month, total: runningTotal, new: m.count };
        });
    }, [tenants]);


    // 3. Recent Tenants
    const recentTenants = useMemo(() => {
        return [...tenants]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
    }, [tenants]);

    const [activeSlice, setActiveSlice] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const StatCard = ({ icon: Icon, label, value, color }: any) => {
        const colorMap: any = {
            primary: 'jade',
            blue: 'blue',
            orange: 'orange',
            green: 'emerald'
        };
        const c = colorMap[color] || color;

        return (
            <div className="bg-white rounded-xl border-2 border-slate-300 p-3 lg:p-4 flex items-center gap-3 lg:gap-4 relative overflow-hidden group hover:border-jade-300 transition-all shadow-none">
                <div className={`absolute right-0 top-0 w-24 h-24 rounded-2xl -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                    c === 'jade' ? 'bg-jade-50/40' :
                    c === 'blue' ? 'bg-blue-50/40' :
                    c === 'orange' ? 'bg-orange-50/40' :
                    'bg-emerald-50/40'
                }`} />
                <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center border-2 relative z-10 ${
                    c === 'jade' ? 'bg-jade-50 text-jade-700 border-jade-100' :
                    c === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    c === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                    <Icon className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                </div>
                <div className="relative z-10">
                    <p className="text-[7.5px] lg:text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 lg:mb-1.5 group-hover:text-jade-600 transition-colors truncate">{label}</p>
                    <h4 className="text-sm lg:text-lg font-black text-slate-800 leading-none">
                        {loading ? (
                            <div className="h-4 lg:h-5 w-8 lg:w-12 bg-slate-100 animate-pulse rounded" />
                        ) : value}
                    </h4>
                </div>
            </div>
        );
    };

    return (
        <div className="lg:h-[calc(100vh-140px)] flex flex-col gap-4 animate-fade-in lg:overflow-hidden pb-0">
            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 shrink-0 px-2 lg:px-0">
                <StatCard icon={Building} label="Total Sekolah" value={stats?.totalTenants} color="primary" />
                <StatCard icon={Users} label="Total Pengguna" value={stats?.totalUsers} color="blue" />
                <StatCard icon={GraduationCap} label="Total Santri" value={stats?.totalStudents} color="orange" />
                <StatCard icon={UserCheck} label="Total Guru" value={stats?.totalTeachers} color="green" />
            </div>

            {/* Charts Section */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Growth Chart */}
                <div className="lg:col-span-3 bg-white p-5 lg:p-6 rounded-xl border-2 border-slate-300 shadow-none relative overflow-hidden flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">
                                Pertumbuhan Sekolah
                            </h3>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Akumulasi pendaftaran 6 bulan terakhir</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full overflow-hidden">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-jade-600)" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="var(--color-jade-600)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} 
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                    contentStyle={{ borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', padding: '10px', boxShadow: 'none' }}
                                    itemStyle={{ color: '#1e293b', fontSize: '9px', fontWeight: 900, padding: 0, textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#94a3b8', opacity: 1, fontSize: '7px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}
                                    formatter={(value: number) => [value, 'SEKOLAH']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="var(--color-jade-600)" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorGrowth)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    </div>
);
};
