'use client';

import React from 'react';
import { EmailSettings } from '@/views/superadmin/EmailSettings';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function EmailSettingsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SUPERADMIN) return <div>Akses Ditolak</div>;
  
  return <EmailSettings user={user} />;
}
