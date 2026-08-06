"use client";

import { motion } from "framer-motion";
import { SettingsPanel } from "@/components/dashboard/settings/settings-panel";

/**
 * C-Support — /settings
 *
 * Standalone settings page. Route to this from dashboard edit buttons.
 */
export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="mx-auto max-w-3xl px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your business and AI agent
        </p>
      </div>
      <SettingsPanel />
    </motion.div>
  );
}
