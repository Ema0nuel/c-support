"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";

// ─── reCAPTCHA ──────────────────────────────────────
// Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local with your key from
// https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId: number) => void;
    };
  }
}

// ═══════════════════════════════════════════════════
// Reset Section
// ═══════════════════════════════════════════════════

export function ResetSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="mt-10 rounded-xl border border-red-500/20 p-5"
      style={{ background: "rgba(239,68,68,0.05)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-400">
              Reset All Data
            </h3>
            <p className="mt-1 text-xs text-red-400/60">
              Wipe all business info, agent config, policies, and
              conversations. This cannot be undone.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/10 active:scale-[0.97]"
          style={{ border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Everything
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <ResetModal onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Confirmation Modal
// ═══════════════════════════════════════════════════

function ResetModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const resetAgent = useAgentStore((s) => s.reset);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaLoadError, setCaptchaLoadError] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Dynamically load reCAPTCHA script and render widget when modal opens
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;

    const renderCaptcha = () => {
      if (!window.grecaptcha || !captchaRef.current) return;
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.grecaptcha.render(captchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
      });
    };

    // Check if script already loaded
    const existingScript = document.querySelector(
      `script[src="https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}"]`
    );

    if (window.grecaptcha) {
      window.grecaptcha.ready(renderCaptcha);
    } else if (!existingScript) {
      // Dynamically inject the script
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => window.grecaptcha?.ready(renderCaptcha);
      document.head.appendChild(script);
    } else {
      // Script tag exists but grecaptcha not ready yet — poll
      const interval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(interval);
          window.grecaptcha.ready(renderCaptcha);
        }
      }, 200);

      const timeout = setTimeout(() => {
        if (!window.grecaptcha) {
          clearInterval(interval);
          setCaptchaLoadError(true);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    // Timeout for initial load
    const timeout = setTimeout(() => {
      if (!window.grecaptcha) {
        setCaptchaLoadError(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const handleReset = useCallback(() => {
    setIsResetting(true);

    // Reset both stores
    resetAgent();
    resetOnboarding();

    // Clear localStorage keys
    localStorage.removeItem("c-support-agent");
    localStorage.removeItem("c-support-onboarding");

    // Brief delay for user feedback, then redirect
    setTimeout(() => {
      router.push("/onboarding");
    }, 600);
  }, [resetAgent, resetOnboarding, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "rgba(11,80,70,0.95)",
          border: "1px solid rgba(239,68,68,0.2)",
          backdropFilter: "blur(24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Confirm Reset
              </h2>
              <p className="text-xs text-red-400/60">
                This action is irreversible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors duration-150 hover:bg-white/5 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning */}
        <div
          className="mb-5 rounded-lg p-3 text-xs text-red-300/80"
          style={{ background: "rgba(239,68,68,0.08)" }}
        >
          <p className="font-medium text-red-300 mb-1.5">
            This will permanently delete:
          </p>
          <ul className="space-y-1 list-disc list-inside text-red-300/60">
            <li>Business name, niche, origin &amp; all policies</li>
            <li>Agent personality, name, avatar &amp; scope</li>
            <li>All AI analysis results</li>
            <li>Conversation history</li>
          </ul>
          <p className="mt-2 text-red-300/80 font-medium">
            You will be redirected to the onboarding flow.
          </p>
        </div>

        {/* reCAPTCHA */}
        <div className="mb-5 flex justify-center">
          {!RECAPTCHA_SITE_KEY ? (
            <div className="text-center py-3">
              <p className="text-xs text-yellow-400/80 font-medium mb-1">
                reCAPTCHA not configured
              </p>
              <p className="text-[11px] text-yellow-400/50">
                Set <code className="text-yellow-400/70">NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> in <code className="text-yellow-400/70">.env.local</code>
              </p>
            </div>
          ) : captchaLoadError ? (
            <div className="text-center py-3">
              <p className="text-xs text-red-400/80 font-medium mb-1">
                Failed to load reCAPTCHA
              </p>
              <p className="text-[11px] text-red-400/50">
                Check your network connection and try again.
              </p>
            </div>
          ) : (
            <div ref={captchaRef} />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white/60 transition-colors duration-150 hover:bg-white/5 hover:text-white/80 active:scale-[0.98]"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!captchaToken || isResetting || captchaLoadError}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: captchaToken && !isResetting ? "#EF4444" : "rgba(239,68,68,0.3)",
              color: "white",
            }}
          >
            {isResetting ? (
              <>
                <span className="cs-loader h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                Resetting…
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Yes, Reset Everything
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
