'use client';

import React from 'react';
import { GlobalAuditLogs } from '@/views/superadmin/GlobalAuditLogs';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function GlobalAuditLogsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <div>Akses Ditolak</div>;
  
  return <GlobalAuditLogs />;
}
