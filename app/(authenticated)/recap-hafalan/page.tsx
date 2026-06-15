"use client";

import React from "react";
import { MemorizationRecap } from "@/views/teacher/MemorizationRecap";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function RecapHafalanPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.TEACHER) return <AccessDenied />;

  return <MemorizationRecap user={user} />;
}
