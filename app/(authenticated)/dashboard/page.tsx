'use client';

import React from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardPage() {
  const { user, handleNavigation } = useAuth();
  
  if (!user) return null;
  
  return <Dashboard user={user} onNavigate={handleNavigation} />;
}
