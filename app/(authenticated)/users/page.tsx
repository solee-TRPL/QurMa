'use client';

import React from 'react';
import { UserManagement } from '@/pages/admin/UserManagement';
import { useAuth } from '@/lib/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  if (!user || !user.tenant_id) return <div>Akses Ditolak</div>;
  return <UserManagement tenantId={user.tenant_id} user={user} />;
}
