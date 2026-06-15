"use client";

import React from "react";
import { ExamGrades } from "@/views/teacher/ExamGrades";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function ExamGradesPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.TEACHER) return <AccessDenied />;

  return <ExamGrades user={user} />;
}
