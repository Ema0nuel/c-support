"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomizeNav } from "../customize-nav";
import { AgentAvatar } from "../agent-icons";
import { Textarea } from "@/components/ui/textarea";
import { getDefaultHandoff, nextPath, prevPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * Customize Step 6 — Human Handoff
 *
 * What the agent says when it can't answer confidently. Pre-filled with a
 * smart default built from the business name, with a live sample reply
 * below showing exactly how the fallback reads to a customer.
 */
export function StepHandoff() {
  const router = useRouter();

  const handoffMessage = useAgentStore((s) => s.handoffMessage);
  const agentName = useAgentStore((s) => s.agentName);
  const updateField = useAgentStore((s) => s.updateField);

  const businessName = useOnboardingStore((s) => s.businessName);

  const defaultHandoff = getDefaultHandoff(businessName);
  const [value, setValue] = useState(handoffMessage || defaultHandoff);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Add a handoff message");
      return;
    }
    if (trimmed.length > 300) {
      setError("Keep the handoff under 300 characters");
      return;
    }
    updateField("handoffMessage", trimmed);
    router.push(nextPath("handoff")!);
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Header */}
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          When should a human take over?
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          This is what {agentName.trim() || "your agent"} says when it can&apos;t
          answer confidently. Customers should always know how to reach you.
        </p>

        {/* Handoff input */}
        <div>
          <Textarea
            ref={textareaRef}
            id="handoff"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder={defaultHandoff}
            showCount
            maxLength={300}
            error={error}
          />
        </div>

        {/* Live preview — how it reads */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preview · out-of-scope reply
          </p>
          <div className="flex items-start gap-3">
            <AgentAvatar avatarId="spark" size="sm" />
            <div className="rounded-xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">
              {value.trim() || "Your handoff message will appear here."}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <CustomizeNav backHref={prevPath("handoff")} onContinue={handleContinue} />
      </div>
    </div>
  );
}
