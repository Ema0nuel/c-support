"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

// ─── Types ──────────────────────────────────────────

interface DashboardStatsProps {
  conversations: number;
  messages: number;
  avgResponseTime: number;
  satisfaction: number;
}

interface StatConfig {
  label: string;
  value: number;
  suffix: string;
  decimals: number;
}

// ─── Animated Number ────────────────────────────────

function AnimatedNumber({
  target,
  decimals = 0,
  suffix = "",
}: {
  target: number;
  decimals?: number;
  suffix?: string;
}) {
  const spring = useSpring(0, {
    bounce: 0,
    duration: 0.6,
  });

  const display = useTransform(spring, (v) => {
    if (decimals > 0) return `${v.toFixed(decimals)}${suffix}`;
    return `${Math.round(v)}${suffix}`;
  });

  const [displayValue, setDisplayValue] = useState(
    decimals > 0 ? `0.0${suffix}` : `0${suffix}`
  );

  useEffect(() => {
    spring.set(target);
  }, [spring, target]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return <span>{displayValue}</span>;
}

// ═══════════════════════════════════════════════════
// Dashboard Stats
// ═══════════════════════════════════════════════════

export function DashboardStats({
  conversations,
  messages,
  avgResponseTime,
  satisfaction,
}: DashboardStatsProps) {
  const stats: StatConfig[] = [
    { label: "Conversations", value: conversations, suffix: "", decimals: 0 },
    { label: "Messages", value: messages, suffix: "", decimals: 0 },
    { label: "Avg Response", value: avgResponseTime, suffix: "s", decimals: 1 },
    { label: "Satisfaction", value: satisfaction, suffix: "%", decimals: 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            bounce: 0,
            duration: 0.4,
            delay: index * 0.05,
          }}
          className="hover-lift flex flex-col gap-2 p-4 rounded-[14px]"
          style={{
            background: "rgba(11,80,70,0.5)",
            border: "1px solid rgba(23,96,85,0.5)",
          }}
        >
          {/* Label */}
          <span
            className="uppercase font-medium"
            style={{
              color: "rgba(169,195,188,0.5)",
              fontSize: "10px",
              letterSpacing: "0.06em",
            }}
          >
            {stat.label}
          </span>

          {/* Value */}
          <span
            className="font-semibold"
            style={{
              color: "#fff",
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            <AnimatedNumber
              target={stat.value}
              decimals={stat.decimals}
              suffix={stat.suffix}
            />
          </span>

          {/* Change indicator — placeholder for future */}
          <span
            style={{
              color: "rgba(184,222,114,0.6)",
              fontSize: "11px",
            }}
          >
            +0
          </span>
        </motion.div>
      ))}
    </div>
  );
}
