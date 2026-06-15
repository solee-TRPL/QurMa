"use client";

import React from "react";
import { StudentAchievements } from "@/views/guardian/StudentAchievements";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function AchievementsPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SANTRI) return <AccessDenied />;

  return <StudentAchievements user={user} />;
}
