'use client';

import React from 'react';
import { TeacherNotesList } from '@/pages/guardian/TeacherNotesList';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types';

export default function TeacherNotesPage() {
  const { user } = useAuth();
  
  if (!user || user.role !== UserRole.SANTRI) return <div>Akses Ditolak</div>;
  
  return <TeacherNotesList user={user} />;
}
