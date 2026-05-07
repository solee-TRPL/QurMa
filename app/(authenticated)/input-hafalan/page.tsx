'use client';

import React from 'react';
import { InputHafalan } from '@/pages/teacher/InputHafalan';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function InputHafalanPage() {
  const { user, setHasUnsavedChanges, saveTriggered, proceedNavigation, showUnsavedModal } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <div>Akses Ditolak</div>;
  
  return (
    <InputHafalan 
      user={user} 
      onSetUnsavedChanges={setHasUnsavedChanges}
      saveTrigger={saveTriggered}
      onSaveSuccess={proceedNavigation}
      isGlobalModalOpen={showUnsavedModal}
    />
  );
}
