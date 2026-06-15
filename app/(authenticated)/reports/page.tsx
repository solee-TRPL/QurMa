"use client";

import React from "react";
import { StudentReports } from "@/views/guardian/GuardianReports";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SANTRI) return <AccessDenied />;

  return <StudentReports user={user} />;
}
