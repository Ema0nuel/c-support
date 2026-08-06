"use client";

import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SettingsPanel } from "@/components/dashboard/settings/settings-panel";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

/**
 * C-Support — /settings
 *
 * Standalone settings page with sidebar (desktop + mobile).
 * Route to this from dashboard edit buttons.
 */
export default function SettingsPage() {
  return (
    <OnboardingGuard>
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-6 py-6 md:px-8 md:py-7 pb-24 md:pb-7">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex items-start gap-4 mb-6"
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
                  Settings
                </h1>
                <span className="text-[13px] text-[#A9C3BC]/60 mt-0.5">
                  Configure your business and AI agent
                </span>
              </div>
            </motion.div>

            <div className="mx-auto max-w-3xl">
              <SettingsPanel />
            </div>
          </div>
        </main>
      </div>
    </OnboardingGuard>
  );
}
