'use client';

import React from 'react';
import { HalaqahManagement } from '@/views/admin/HalaqahManagement';
import { useAuth } from '@/lib/AuthContext';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function HalaqahManagementPage() {
  const { user } = useAuth();
  
  if (!user || !user.tenant_id) return <AccessDenied />;
  
  return <HalaqahManagement tenantId={user.tenant_id} user={user} />;
}
