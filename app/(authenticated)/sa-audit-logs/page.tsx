'use client';

import React from 'react';
import { GlobalAuditLogs } from '@/views/superadmin/GlobalAuditLogs';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function GlobalAuditLogsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <AccessDenied />;
  
  return <GlobalAuditLogs />;
}
