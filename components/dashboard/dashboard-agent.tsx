"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { personalityById } from "@/lib/agent";

// ─── Constants ──────────────────────────────────────

const MAX_VISIBLE_PILLS = 3;

// ─── Row Component ──────────────────────────────────

function ConfigRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
      style={{
        background: "rgba(2,75,65,0.5)",
      }}
    >
      <span className="text-[12px] text-[#A9C3BC] font-medium shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {children}
      </div>
    </div>
  );
}

// ─── Pill Component ─────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md font-medium"
      style={{
        background: "rgba(184,222,114,0.1)",
        color: "rgba(184,222,114,0.7)",
        fontSize: "10px",
      }}
    >
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// Agent Configuration Panel
// ═══════════════════════════════════════════════════

export function DashboardAgent() {
  const personalityId = useAgentStore((s) => s.personalityId);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const businessNiche = useOnboardingStore((s) => s.businessNiche);

  const personality = personalityById(personalityId);
  const displayNiche = businessNiche || "Not set";

  // Visible pills + overflow count
  const visiblePills = enabledCategories.slice(0, MAX_VISIBLE_PILLS);
  const overflow = enabledCategories.length - MAX_VISIBLE_PILLS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        bounce: 0,
        duration: 0.4,
        delay: 0.2,
      }}
      className="flex flex-col gap-4 p-5 rounded-[14px] h-full"
      style={{
        background: "rgba(11,80,70,0.5)",
        border: "1px solid rgba(23,96,85,0.5)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/90">
          Agent Configuration
        </span>
        <Link
          href="/settings"
          className={cn(
            "text-[12px] font-medium text-[#B8DE72]/70",
            "hover:text-[#B8DE72] transition-colors duration-200"
          )}
        >
          Edit
        </Link>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        <ConfigRow label="Personality">
          <span className="text-[12px] text-white/80">
            {personality?.label ?? "Not set"}
          </span>
        </ConfigRow>

        <ConfigRow label="Industry">
          <span className="text-[12px] text-white/80">{displayNiche}</span>
        </ConfigRow>

        <ConfigRow label="Knowledge">
          {visiblePills.length > 0 ? (
            <>
              {visiblePills.map((cat) => (
                <Pill key={cat}>{cat}</Pill>
              ))}
              {overflow > 0 && <Pill>+{overflow}</Pill>}
            </>
          ) : (
            <span className="text-[12px] text-white/50">None</span>
          )}
        </ConfigRow>
      </div>
    </motion.div>
  );
}
