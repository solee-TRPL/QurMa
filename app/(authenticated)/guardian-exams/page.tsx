'use client';

import React from 'react';
import { StudentExamResults } from '@/views/guardian/GuardianExamResults';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function GuardianExamsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SANTRI) return <div>Akses Ditolak</div>;
  
  return <StudentExamResults user={user} />;
}
