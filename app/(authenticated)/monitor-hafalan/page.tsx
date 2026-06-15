"use client";

import React from "react";
import { MonitorHafalan } from "@/views/admin/MonitorHafalan";
import { useAuth } from "@/lib/AuthContext";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function MonitorHafalanPage() {
  const { user } = useAuth();

  if (!user || !user.tenant_id) return <AccessDenied />;

  return <MonitorHafalan tenantId={user.tenant_id} user={user} />;
}
