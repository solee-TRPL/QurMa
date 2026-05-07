'use client';

import React from 'react';
import { SuperAdminDashboard } from '@/pages/superadmin/SuperAdminDashboard';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function SuperAdminDashboardPage() {
  const { user, handleNavigation } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <div>Akses Ditolak</div>;
  
  return <SuperAdminDashboard user={user} onNavigate={handleNavigation} />;
}
