"use client";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-6 md:px-8 md:py-7 pb-24 md:pb-7">
          {children}
        </div>
      </main>
    </div>
  );
}