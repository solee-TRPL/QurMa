'use client';

import React from 'react';
import { TenantManagement } from '@/views/superadmin/TenantManagement';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function TenantsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <div>Akses Ditolak</div>;
  
  return <TenantManagement user={user} />;
}
