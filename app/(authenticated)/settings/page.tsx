'use client';

import React from 'react';
import { Settings } from '@/pages/Settings';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user, tenant, updateProfile, updateTenant } = useAuth();
  
  if (!user) return null;
  
  return (
    <Settings 
      user={user} 
      tenant={tenant} 
      onUpdateProfile={updateProfile}
      onUpdateTenant={updateTenant}
    />
  );
}
