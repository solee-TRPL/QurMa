"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { DailyMemorizationMonitor } from "@/views/admin/DailyMemorizationMonitor";

export default function DailyMemorizationMonitorPage() {
  const { user, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !user) {
      router.push("/login");
    }
  }, [user, isInitializing, router]);

  if (isInitializing || !user) {
    return null; // Layout will show loading state
  }

  return <DailyMemorizationMonitor tenantId={user.tenant_id || ""} user={user} />;
}
