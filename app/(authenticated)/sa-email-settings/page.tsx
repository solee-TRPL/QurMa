"use client";

import React from "react";
import { EmailSettings } from "@/views/superadmin/EmailSettings";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";
import { AccessDenied } from "@/components/ui/AccessDenied";

export default function EmailSettingsPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SUPERADMIN) return <AccessDenied />;

  return <EmailSettings user={user} />;
}
