'use client';

import React from 'react';
import { StudentManagement } from '@/views/admin/GuardianManagement';
import { useAuth } from '@/lib/AuthContext';

export default function StudentManagementPage() {
  const { user } = useAuth();
  if (!user || !user.tenant_id) return <div>Akses Ditolak</div>;
  return <StudentManagement tenantId={user.tenant_id} user={user} />;
}
