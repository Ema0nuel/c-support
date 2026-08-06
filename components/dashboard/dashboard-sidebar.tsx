"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CSupportMark, AgentAvatar } from "@/components/customize/agent-icons";
import {
  DashboardIcon,
  ConversationsIcon,
  SettingsIcon,
} from "./dashboard-icons";

// ─── Types ──────────────────────────────────────────

export type DashboardTab = "dashboard" | "conversations";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  avatarId?: string;
}

// ─── Nav Items ──────────────────────────────────────

const NAV_ITEMS: {
  id: DashboardTab;
  label: string;
  mobileLabel: string;
  Icon: (props: { className?: string }) => React.ReactNode;
}[] = [
  { id: "dashboard", label: "Dashboard", mobileLabel: "Dash", Icon: DashboardIcon },
  { id: "conversations", label: "Conversations", mobileLabel: "Chats", Icon: ConversationsIcon },
];

// ═══════════════════════════════════════════════════
// Desktop Sidebar (≥768px)
// ═══════════════════════════════════════════════════

function DesktopSidebar({
  activeTab,
  onTabChange,
  avatarId,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 z-30">
      {/* Glass background */}
      <div
        className="absolute inset-0 rounded-r-2xl z-0"
        style={{
          background: "rgba(11,80,70,0.6)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      />

      <div className="relative z-10 flex flex-col h-full py-6 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <CSupportMark className="h-9 w-9 shrink-0" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1" role="tablist">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium",
                  "transition-colors duration-200",
                  "hover:bg-white/5",
                  isActive
                    ? "text-[#B8DE72]"
                    : "text-[#A9C3BC]/50 hover:text-[#A9C3BC]/70"
                )}
                style={{
                  background: isActive ? "rgba(184,222,114,0.1)" : undefined,
                }}
              >
                <item.Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings link */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium",
            "transition-colors duration-200",
            "hover:bg-white/5",
            "text-[#A9C3BC]/50 hover:text-[#A9C3BC]/70"
          )}
        >
          <SettingsIcon className="h-[18px] w-[18px] shrink-0" />
          <span>Settings</span>
        </Link>

        {/* Glass divider */}
        <div
          className="h-px mb-4"
          style={{ background: "rgba(23,96,85,0.5)" }}
        />

        {/* Agent mini-card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="flex items-center gap-3 px-3 py-3 rounded-xl"
          style={{ background: "rgba(2,75,65,0.5)" }}
        >
          <AgentAvatar avatarId={avatarId ?? "spark"} size="sm" />
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-white/80">
              Agent
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#A9C3BC]/60">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#B8DE72]"
                aria-hidden="true"
              />
              Active
            </span>
          </div>
        </motion.div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════
// Mobile Bottom Island (<768px)
// ═══════════════════════════════════════════════════

function MobileIsland({
  activeTab,
  onTabChange,
}: DashboardSidebarProps) {
  const activeIndex = NAV_ITEMS.findIndex((n) => n.id === activeTab);

  return (
    <nav
      role="tablist"
      className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around py-2.5 px-2 rounded-[16px]"
      style={{
        background: "rgba(11,80,70,0.7)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(23,96,85,0.5)",
      }}
    >
      {NAV_ITEMS.map((item, idx) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full",
              "text-[10px] font-medium",
              "transition-colors duration-200",
              isActive
                ? "text-[#B8DE72]"
                : "text-[#A9C3BC]/50"
            )}
          >
            {/* Active capsule background */}
            {isActive && (
              <motion.div
                layoutId="mobile-tab-capsule"
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(184,222,114,0.1)" }}
                transition={{
                  type: "spring",
                  bounce: 0,
                  duration: 0.3,
                }}
              />
            )}

            <item.Icon className="h-[18px] w-[18px] relative z-10" />
            <span className="relative z-10">{item.mobileLabel}</span>
          </button>
        );
      })}

      {/* Settings — routes to /settings */}
      <Link
        href="/settings"
        className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-[10px] font-medium text-[#A9C3BC]/50"
      >
        <SettingsIcon className="h-[18px] w-[18px] relative z-10" />
        <span className="relative z-10">Settings</span>
      </Link>
    </nav>
  );
}

// ═══════════════════════════════════════════════════
// Combined Export
// ═══════════════════════════════════════════════════

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileIsland {...props} />
    </>
  );
}
