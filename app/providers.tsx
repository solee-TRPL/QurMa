"use client";

import React from "react";
import { LoadingProvider } from "@/lib/LoadingContext";
import { NotificationProvider } from "@/lib/NotificationContext";
import { AuthProvider } from "@/lib/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <NotificationProvider>
        <AuthProvider>{children}</AuthProvider>
      </NotificationProvider>
    </LoadingProvider>
  );
}
