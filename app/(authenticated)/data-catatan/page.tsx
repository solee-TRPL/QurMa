"use client";

import { useAuth } from "@/lib/AuthContext";
import { StudentDirectory } from "@/views/teacher/StudentDirectory";

export default function StudentDirectoryCatatanPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <StudentDirectory user={user} tenantId={user.tenant_id || ""} mode="catatan" />;
}
