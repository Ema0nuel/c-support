import type { Metadata } from "next";
import { StepAvatar } from "@/components/customize/steps/step-avatar";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Avatar — C-Support",
  description: "Give your support agent a face.",
};

export default function CustomizeAvatarPage() {
  return (
    <OnboardingGuard>
      <StepAvatar />
    </OnboardingGuard>
  );
}
