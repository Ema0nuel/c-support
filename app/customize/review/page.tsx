import type { Metadata } from "next";
import { StepReview } from "@/components/customize/steps/step-review";

export const metadata: Metadata = {
  title: "Review — C-Support",
  description: "Review your agent before launching it.",
};

export default function CustomizeReviewPage() {
  return <StepReview />;
}
