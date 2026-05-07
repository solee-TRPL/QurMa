'use client';

import React from 'react';
import { StudentAchievements } from '@/pages/guardian/StudentAchievements';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function AchievementsPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SANTRI) return <div>Akses Ditolak</div>;
  
  return <StudentAchievements user={user} />;
}
