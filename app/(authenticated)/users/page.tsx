"use client";

import React from "react";
import { UserManagement } from "@/views/admin/UserManagement";
import { useAuth } from "@/lib/AuthContext";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function UsersPage() {
  const { user } = useAuth();
  if (!user || !user.tenant_id) return <AccessDenied />;
  return <UserManagement tenantId={user.tenant_id} user={user} />;
}
