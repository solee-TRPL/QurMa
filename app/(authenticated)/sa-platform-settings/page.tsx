'use client';

import React from 'react';
import { PlatformSettings } from '@/pages/superadmin/PlatformSettings';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function PlatformSettingsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <div>Akses Ditolak</div>;
  
  return <PlatformSettings user={user} />;
}
