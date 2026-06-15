"use client";

import React from "react";
import { StudentDirectory } from "@/views/teacher/StudentDirectory";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function StudentDirectoryPage() {
  const { user } = useAuth();

  if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR)) return <AccessDenied />;

  return <StudentDirectory user={user} tenantId={user.tenant_id || ""} mode="santri" />;
}
