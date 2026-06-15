"use client";

import React from "react";
import { ClassManagement } from "@/views/admin/ClassManagement";
import { useAuth } from "@/lib/AuthContext";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function ClassesPage() {
  const { user } = useAuth();
  if (!user || !user.tenant_id) return <AccessDenied />;
  return <ClassManagement tenantId={user.tenant_id} user={user} />;
}
