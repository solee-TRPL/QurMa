'use client';

import React from 'react';
import { AuditLogs } from '@/views/admin/AuditLogs';
import { useAuth } from '@/lib/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  
  if (!user || !user.tenant_id) return <div>Akses Ditolak</div>;
  
  return <AuditLogs tenantId={user.tenant_id} />;
}
