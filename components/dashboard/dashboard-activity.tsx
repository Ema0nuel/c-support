"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getRecentConversations } from "@/lib/conversations";

// ─── Relative Time Helper ───────────────────────────

function relativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

// ─── Dot Color ──────────────────────────────────────

function dotColor(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 1000 / 60);

  if (diffMin < 5) return "#B8DE72";
  if (diffMin < 60) return "rgba(184,222,114,0.25)";
  return "rgba(184,222,114,0.15)";
}

// ═══════════════════════════════════════════════════
// Activity Feed
// ═══════════════════════════════════════════════════

export function DashboardActivity() {
  const conversations = useMemo(() => getRecentConversations(5), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        bounce: 0,
        duration: 0.4,
        delay: 0.25,
      }}
      className="flex flex-col gap-3 p-5 rounded-[14px] h-full"
      style={{
        background: "rgba(11,80,70,0.5)",
        border: "1px solid rgba(23,96,85,0.5)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/90">
          Recent Activity
        </span>
        <Link
          href="#"
          className={cn(
            "text-[12px] font-medium text-[#B8DE72]/70",
            "hover:text-[#B8DE72] transition-colors duration-200"
          )}
        >
          View All
        </Link>
      </div>

      {/* Items */}
      {conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <span className="text-[12px] text-[#A9C3BC]/40">
            No conversations yet
          </span>
        </div>
      ) : (
        <div className="flex flex-col">
          {conversations.map((convo, index) => (
            <div
              key={convo.id}
              className={cn(
                "flex items-start gap-3 py-3",
                index < conversations.length - 1 && "border-b"
              )}
              style={{
                borderBottomColor:
                  index < conversations.length - 1
                    ? "rgba(23,96,85,0.3)"
                    : undefined,
              }}
            >
              {/* Dot */}
              <span
                className="mt-[5px] shrink-0 rounded-full"
                style={{
                  width: "6px",
                  height: "6px",
                  background: dotColor(convo.updatedAt),
                }}
                aria-hidden="true"
              />

              {/* Text + time */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-[12px] text-white/75 truncate">
                  {convo.title}
                </span>
                <span className="text-[10px] text-[#A9C3BC]/50">
                  {relativeTime(convo.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
