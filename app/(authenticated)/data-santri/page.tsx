'use client';

import React from 'react';
import { StudentDirectory } from '@/pages/teacher/StudentDirectory';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function StudentDirectoryPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <div>Akses Ditolak</div>;
  
  return <StudentDirectory user={user} />;
}
