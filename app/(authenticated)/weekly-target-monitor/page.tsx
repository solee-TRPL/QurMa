'use client';

import React from 'react';
import { WeeklyTargetMonitor } from '@/views/admin/WeeklyTargetMonitor';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function WeeklyTargetMonitorPage() {
  const { user, tenant } = useAuth();
  
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR)) {
    return <AccessDenied />;
  }
  
  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-jade-100 border-t-jade-600 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-jade-600 uppercase tracking-widest animate-pulse">Memuat data...</p>
      </div>
    );
  }
  
  return <WeeklyTargetMonitor user={user} tenantId={tenant.id} />;
}
