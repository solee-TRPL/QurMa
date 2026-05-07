'use client';

import React from 'react';
import { WeeklyTargetMonitor } from '@/views/admin/WeeklyTargetMonitor';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function WeeklyTargetMonitorNotesPage() {
  const { user, tenant } = useAuth();
  
  if (!user || user.role !== UserRole.ADMIN) return <div>Akses Ditolak</div>;
  if (!tenant) return <div>Memuat data...</div>;
  
  return <WeeklyTargetMonitor user={user} tenantId={tenant.id} showNotesMode={true} />;
}
