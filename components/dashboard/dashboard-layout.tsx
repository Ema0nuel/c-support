"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DashboardSidebar, type DashboardTab } from "./dashboard-sidebar";

// ─── Types ──────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

// ─── Tab Subtitles ──────────────────────────────────

const TAB_SUBTITLES: Record<DashboardTab, string> = {
  dashboard: "Monitor your agent",
  conversations: "View recent conversations",
  settings: "Manage agent settings",
};

// ═══════════════════════════════════════════════════
// Dashboard Layout Shell
// ═══════════════════════════════════════════════════

export function DashboardLayout({
  children,
  activeTab,
  onTabChange,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) + Bottom Island (mobile) */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-6 md:px-8 md:py-7 pb-24 md:pb-7">
          {/* Header Row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              bounce: 0,
              duration: 0.4,
            }}
            className="flex items-start justify-between gap-4 mb-6"
          >
            <div className="flex flex-col">
              <h1
                className="text-white font-semibold"
                style={{
                  fontSize: "22px",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2,
                }}
              >
                Dashboard
              </h1>
              <span className="text-[13px] text-[#A9C3BC]/60 mt-0.5">
                {TAB_SUBTITLES[activeTab]}
              </span>
            </div>

            {/* Launch Agent Button */}
            <button
              onClick={() => window.open("/chat", "_blank")}
              className={cn(
                "btn-press shrink-0 font-semibold rounded-[10px]",
                "transition-opacity duration-200 hover:opacity-90"
              )}
              style={{
                background: "#B8DE72",
                color: "#024B41",
                padding: "9px 18px",
                fontSize: "13px",
              }}
            >
              Launch Agent
            </button>
          </motion.div>

          {/* Content Slot */}
          {children}
        </div>
      </main>
    </div>
  );
}
