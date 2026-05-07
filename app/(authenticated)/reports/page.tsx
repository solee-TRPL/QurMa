'use client';

import React from 'react';
import { GuardianReports } from '@/pages/guardian/GuardianReports';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function ReportsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SANTRI) return <div>Akses Ditolak</div>;
  
  return <GuardianReports user={user} />;
}
