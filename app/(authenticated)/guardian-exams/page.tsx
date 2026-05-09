'use client';

import React from 'react';
import { StudentExamResults } from '@/views/guardian/GuardianExamResults';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function GuardianExamsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SANTRI) return <AccessDenied />;
  
  return <StudentExamResults user={user} />;
}
