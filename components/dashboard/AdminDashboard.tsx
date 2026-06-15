import React from "react";
import { AdminSchoolOverview } from "./AdminSchoolOverview";
import { AdminMemorizationOverview } from "./AdminMemorizationOverview";
import { AdminAttendanceOverview } from "./AdminAttendanceOverview";

interface AdminDashboardProps {
  currentPage?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentPage }) => {
  // Determine active view based on currentPage or default to school overview
  const isSchool = currentPage === "dashboard" || currentPage === "dashboard-school";
  const isMemorization = currentPage === "dashboard-memorization";
  const isAttendance = currentPage === "dashboard-attendance";

  return (
    <div className="flex-1 h-auto flex flex-col gap-3 lg:gap-4 animate-fade-in pb-20 lg:pb-8">
      {isSchool && <AdminSchoolOverview />}
      {isMemorization && <AdminMemorizationOverview />}
      {isAttendance && <AdminAttendanceOverview />}
    </div>
  );
};
