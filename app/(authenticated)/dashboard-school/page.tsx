
'use client';
import React from 'react';
import { Dashboard } from '@/views/Dashboard';
import { useAuth } from '@/lib/AuthContext';
export default function DashboardSchoolPage() {
  const { user, handleNavigation } = useAuth();
  if (!user) return null;
  return <Dashboard user={user} onNavigate={handleNavigation} currentPage='dashboard-school' />;
}