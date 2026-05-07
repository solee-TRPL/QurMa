'use client';

import React from 'react';
import { StudentProgress } from '@/pages/guardian/StudentProgress';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function StudentProgressPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SANTRI) return <div>Akses Ditolak</div>;
  
  return <StudentProgress user={user} />;
}
