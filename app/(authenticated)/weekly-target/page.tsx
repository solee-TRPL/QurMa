'use client';

import React from 'react';
import { WeeklyTarget } from '@/pages/teacher/WeeklyTarget';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function WeeklyTargetPage() {
  const { user, setHasUnsavedChanges, saveTriggered, proceedNavigation, showUnsavedModal } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <div>Akses Ditolak</div>;
  
  return (
    <WeeklyTarget 
      user={user} 
      onSetUnsavedChanges={setHasUnsavedChanges}
      saveTrigger={saveTriggered}
      onSaveSuccess={proceedNavigation}
      isGlobalModalOpen={showUnsavedModal}
    />
  );
}
