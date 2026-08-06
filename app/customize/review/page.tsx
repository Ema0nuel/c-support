import type { Metadata } from "next";
import { StepReview } from "@/components/customize/steps/step-review";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Review — C-Support",
  description: "Review your agent before launching it.",
};

export default function CustomizeReviewPage() {
  return (
    <OnboardingGuard>
      <StepReview />
    </OnboardingGuard>
  );
}
