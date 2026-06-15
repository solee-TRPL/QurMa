"use client";

import React from "react";
import { GlobalUserManagement } from "@/views/superadmin/GlobalUserManagement";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function GlobalUsersPage() {
  const { user, handleImpersonate } = useAuth();

  if (!user || user.role !== UserRole.SUPERADMIN) return <AccessDenied />;

  return <GlobalUserManagement user={user} onImpersonate={handleImpersonate} />;
}
