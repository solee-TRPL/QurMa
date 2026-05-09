'use client';

import React from 'react';
import { PlatformSettings } from '@/views/superadmin/PlatformSettings';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function PlatformSettingsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <AccessDenied />;
  
  return <PlatformSettings user={user} />;
}
