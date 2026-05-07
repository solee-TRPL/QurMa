'use client';

import React from 'react';
import { ExamGrades } from '@/views/teacher/ExamGrades';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function ExamGradesPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <div>Akses Ditolak</div>;
  
  return <ExamGrades user={user} />;
}
