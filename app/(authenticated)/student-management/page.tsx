'use client';

import React from 'react';
import { StudentManagement } from '@/views/admin/GuardianManagement';
import { useAuth } from '@/lib/AuthContext';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function StudentManagementPage() {
  const { user } = useAuth();
  if (!user || !user.tenant_id) return <AccessDenied />;
  return <StudentManagement tenantId={user.tenant_id} user={user} />;
}
