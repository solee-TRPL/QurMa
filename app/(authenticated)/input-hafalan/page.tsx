'use client';

import React from 'react';
import { InputHafalan } from '@/views/teacher/InputHafalan';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function InputHafalanPage() {
  const { user, setHasUnsavedChanges, saveTriggered, proceedNavigation, showUnsavedModal } = useAuth();
  
  if (!user || user.role !== UserRole.TEACHER) return <AccessDenied />;
  
  return (
    <InputHafalan 
      user={user} 
      tenantId={user.tenant_id || ''}
      onSetUnsavedChanges={setHasUnsavedChanges}
      saveTrigger={saveTriggered}
      onSaveSuccess={proceedNavigation}
      isGlobalModalOpen={showUnsavedModal}
    />
  );
}
