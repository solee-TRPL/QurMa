"use client";

import React from "react";
import { StudentProgress } from "@/views/guardian/StudentProgress";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function StudentProgressPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SANTRI) return <AccessDenied />;

  return <StudentProgress user={user} />;
}
