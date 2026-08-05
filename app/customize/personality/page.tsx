import type { Metadata } from "next";
import { StepPersonality } from "@/components/customize/steps/step-personality";

export const metadata: Metadata = {
  title: "Personality — C-Support",
  description: "Choose how your support agent sounds.",
};

export default function CustomizePersonalityPage() {
  return <StepPersonality />;
}
