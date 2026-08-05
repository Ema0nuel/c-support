"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomizeNav } from "../customize-nav";
import { AgentAvatar } from "../agent-icons";
import { Textarea } from "@/components/ui/textarea";
import { getDefaultGreeting, nextPath, prevPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * Customize Step 3 — Greeting
 *
 * The customer's first impression. Pre-filled with a smart default
 * derived from the agent + business name, with a live chat-bubble
 * preview below.
 */
export function StepGreeting() {
  const router = useRouter();

  const greeting = useAgentStore((s) => s.greeting);
  const agentName = useAgentStore((s) => s.agentName);
  const updateField = useAgentStore((s) => s.updateField);

  const businessName = useOnboardingStore((s) => s.businessName);

  const defaultGreeting = getDefaultGreeting(agentName, businessName);
  const [value, setValue] = useState(greeting || defaultGreeting);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Add a greeting message");
      return;
    }
    if (trimmed.length > 300) {
      setError("Keep the greeting under 300 characters");
      return;
    }
    updateField("greeting", trimmed);
    router.push(nextPath("greeting")!);
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Header */}
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          How will you greet customers?
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          This is the first message every customer sees when a conversation
          starts.
        </p>

        {/* Greeting input */}
        <div>
          <Textarea
            ref={textareaRef}
            id="greeting"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder={defaultGreeting}
            showCount
            maxLength={300}
            error={error}
          />
        </div>

        {/* Live preview bubble */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preview · new conversation
          </p>
          <div className="flex items-start gap-3">
            <AgentAvatar avatarId="spark" size="sm" />
            <div className="rounded-xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">
              {value.trim() || "Your greeting will appear here."}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <CustomizeNav backHref={prevPath("greeting")} onContinue={handleContinue} />
      </div>
    </div>
  );
}
