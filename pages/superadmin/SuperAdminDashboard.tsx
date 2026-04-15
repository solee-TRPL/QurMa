
import React, { useEffect, useState, useMemo } from 'react';
import { getSuperAdminStats, getAllTenants } from '../../services/dataService';
import { SuperAdminStats, Tenant, PageView } from '../../types';
import { Building, Users, GraduationCap, UserCheck, TrendingUp, PieChart as PieChartIcon, Clock, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface SuperAdminDashboardProps {
    onNavigate: (page: PageView) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
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

    const StatCard = ({ icon: Icon, label, value, color }: any) => {
        const colorMap: any = {
            primary: 'indigo',
            blue: 'blue',
            orange: 'orange',
            green: 'emerald'
        };
        const c = colorMap[color] || color;

        return (
            <div className="bg-white rounded-[20px] border-2 border-slate-50 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-1 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Icon className="w-12 h-12 rotate-12" />
                </div>
                <div className={`w-10 h-10 rounded-[16px] bg-${c}-50 flex items-center justify-center text-${c}-600 shrink-0 border border-${c}-100/50`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-indigo-600 transition-colors">{label}</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight leading-none">
                        {loading ? (
                            <div className="h-5 w-12 bg-slate-100 animate-pulse rounded" />
                        ) : value}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-fade-in overflow-hidden">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard icon={Building} label="Total Sekolah" value={stats?.totalTenants} color="primary" />
                <StatCard icon={Users} label="Total Pengguna" value={stats?.totalUsers} color="blue" />
                <StatCard icon={GraduationCap} label="Total Santri" value={stats?.totalStudents} color="orange" />
                <StatCard icon={UserCheck} label="Total Guru" value={stats?.totalTeachers} color="green" />
            </div>

            {/* Charts Section */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Growth Chart */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-sm relative overflow-hidden flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">
                                    Pertumbuhan Sekolah
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400">Akumulasi pendaftaran 6 bulan terakhir</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}
                                    labelStyle={{ fontSize: '10px', color: '#64748b', fontWeight: 900, marginBottom: '4px' }}
                                    formatter={(value: number) => [value, 'Sekolah']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#4f46e5" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorGrowth)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};
