import type { Metadata } from "next";
import { StepAgentName } from "@/components/customize/steps/step-agent-name";

export const metadata: Metadata = {
  title: "Agent Name — C-Support",
  description: "Give your support agent an identity.",
};

export default function CustomizeNamePage() {
  return <StepAgentName />;
}
