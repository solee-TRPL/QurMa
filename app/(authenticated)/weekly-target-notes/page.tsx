'use client';

import React from 'react';
import { WeeklyTarget } from '@/views/teacher/WeeklyTarget';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function WeeklyTargetNotesPage() {
  const { user, setHasUnsavedChanges, saveTriggered, proceedNavigation, showUnsavedModal } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <AccessDenied />;
  
  return (
    <WeeklyTarget 
      user={user} 
      tenantId={user.tenant_id!}
      onSetUnsavedChanges={setHasUnsavedChanges} 
      showNotesMode={true} 
      saveTrigger={saveTriggered}
      onSaveSuccess={proceedNavigation}
      isGlobalModalOpen={showUnsavedModal}
    />
  );
}
