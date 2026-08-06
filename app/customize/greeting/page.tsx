import type { Metadata } from "next";
import { StepGreeting } from "@/components/customize/steps/step-greeting";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Greeting — C-Support",
  description: "Set your agent's first impression.",
};

export default function CustomizeGreetingPage() {
  return (
    <OnboardingGuard>
      <StepGreeting />
    </OnboardingGuard>
  );
}
