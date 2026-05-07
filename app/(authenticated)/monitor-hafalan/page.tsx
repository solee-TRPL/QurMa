'use client';

import React from 'react';
import { MonitorHafalan } from '@/views/admin/MonitorHafalan';
import { useAuth } from '@/lib/AuthContext';

export default function MonitorHafalanPage() {
  const { user } = useAuth();
  
  if (!user || !user.tenant_id) return <div>Akses Ditolak</div>;
  
  return <MonitorHafalan tenantId={user.tenant_id} user={user} />;
}
