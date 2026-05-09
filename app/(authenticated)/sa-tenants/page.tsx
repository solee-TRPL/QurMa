'use client';

import React from 'react';
import { TenantManagement } from '@/views/superadmin/TenantManagement';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function TenantsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <AccessDenied />;
  
  return <TenantManagement user={user} />;
}
