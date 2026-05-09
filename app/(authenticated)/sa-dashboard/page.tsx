'use client';

import React from 'react';
import { SuperAdminDashboard } from '@/views/superadmin/SuperAdminDashboard';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function SuperAdminDashboardPage() {
  const { user, handleNavigation } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <AccessDenied />;
  
  return <SuperAdminDashboard user={user} onNavigate={handleNavigation} />;
}
