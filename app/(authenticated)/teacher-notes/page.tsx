"use client";

import React from "react";
import { TeacherNotesList } from "@/views/guardian/TeacherNotesList";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function TeacherNotesPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SANTRI) return <AccessDenied />;

  return <TeacherNotesList user={user} />;
}
