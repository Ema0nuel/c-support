import type { Metadata } from "next";
import { StepHandoff } from "@/components/customize/steps/step-handoff";

export const metadata: Metadata = {
  title: "Handoff — C-Support",
  description: "Plan how your agent falls back to a human.",
};

export default function CustomizeHandoffPage() {
  return <StepHandoff />;
}
