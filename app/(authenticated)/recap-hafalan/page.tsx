'use client';

import React from 'react';
import { MemorizationRecap } from '@/views/teacher/MemorizationRecap';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function RecapHafalanPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <div>Akses Ditolak</div>;
  
  return <MemorizationRecap user={user} />;
}
