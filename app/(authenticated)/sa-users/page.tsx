'use client';

import React from 'react';
import { GlobalUserManagement } from '@/pages/superadmin/GlobalUserManagement';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function GlobalUsersPage() {
  const { user, handleImpersonate } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <div>Akses Ditolak</div>;
  
  return <GlobalUserManagement user={user} onImpersonate={handleImpersonate} />;
}
