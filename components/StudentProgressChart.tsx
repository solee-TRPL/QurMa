import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MemorizationRecord, MemorizationStatus } from '../types';

interface Props {
  records: MemorizationRecord[];
}

// Custom Tooltip Component for a Premium Look
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100 ring-1 ring-slate-200/50">
        <p className="text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          {payload.slice().reverse().map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8 min-w-[140px]">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-slate-700">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-800">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const StudentProgressChart: React.FC<Props> = ({ records }) => {
  // Aggregate data for the chart (Group by Date)
  const data = React.useMemo(() => {
    const grouped = records.reduce((acc, curr) => {
      const date = new Date(curr.record_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      if (!acc[date]) {
        acc[date] = { date, lancar: 0, perbaikan: 0, ulang: 0 };
      }
      if (curr.status === MemorizationStatus.LANCAR) acc[date].lancar += 1;
      if (curr.status === MemorizationStatus.PERBAIKAN) acc[date].perbaikan += 1;
      if (curr.status === MemorizationStatus.ULANG) acc[date].ulang += 1;
      return acc;
    }, {} as Record<string, any>);
    
    // Take last 7 days for visibility
    return Object.values(grouped).slice(0, 7).reverse();
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
        Belum ada data hafalan untuk ditampilkan grafiknya.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Kualitas Setoran</h3>
           <p className="text-sm text-slate-500">Analisis hafalan 7 hari terakhir</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMumtaz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorJayyid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNaqish" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12}} 
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ paddingTop: '20px' }}
            />

            <Area 
              type="monotone" 
              dataKey="lancar" 
              name="Mumtaz (Lancar)" 
              stackId="1" 
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#colorMumtaz)" 
            />
            <Area 
              type="monotone" 
              dataKey="perbaikan" 
              name="Jayyid (Perbaikan)" 
              stackId="1" 
              stroke="#f59e0b" 
              strokeWidth={2}
              fill="url(#colorJayyid)" 
            />
            <Area 
              type="monotone" 
              dataKey="ulang" 
              name="Naqish (Ulang)" 
              stackId="1" 
              stroke="#ef4444" 
              strokeWidth={2}
              fill="url(#colorNaqish)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};