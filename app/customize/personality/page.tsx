import type { Metadata } from "next";
import { StepPersonality } from "@/components/customize/steps/step-personality";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Personality — C-Support",
  description: "Choose how your support agent sounds.",
};

export default function CustomizePersonalityPage() {
  return (
    <OnboardingGuard>
      <StepPersonality />
    </OnboardingGuard>
  );
}
