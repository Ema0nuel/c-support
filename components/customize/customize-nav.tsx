"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * C-Support — Customize Step Navigation
 *
 * Shared Back / Continue row for the routed customization steps.
 * Back uses useRouter().push for client-side navigation; Continue
 * is delegated to each step via onContinue (validation + persist).
 */
export function CustomizeNav({
  backHref,
  onContinue,
  continueDisabled = false,
  continueLabel = "Continue",
}: {
  backHref: string | null;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-3 pt-6">
      <Button
        variant="outline"
        onClick={() => backHref && router.push(backHref)}
        disabled={!backHref}
        className="flex-1"
      >
        Back
      </Button>
      <Button
        onClick={onContinue}
        disabled={continueDisabled}
        className="flex-[2]"
      >
        {continueLabel}
      </Button>
    </div>
  );
}
