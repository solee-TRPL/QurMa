"use client";

import React from "react";
import { AuditLogs } from "@/views/admin/AuditLogs";
import { useAuth } from "@/lib/AuthContext";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function AuditLogsPage() {
  const { user } = useAuth();

  if (!user || !user.tenant_id) return <AccessDenied />;

  return <AuditLogs tenantId={user.tenant_id} />;
}
