import type { Metadata } from "next";
import { StepScope } from "@/components/customize/steps/step-scope";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Knowledge — C-Support",
  description: "Define what your agent handles.",
};

export default function CustomizeScopePage() {
  return (
    <OnboardingGuard>
      <StepScope />
    </OnboardingGuard>
  );
}
