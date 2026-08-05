import type { Metadata } from "next";
import { StepGreeting } from "@/components/customize/steps/step-greeting";

export const metadata: Metadata = {
  title: "Greeting — C-Support",
  description: "Set your agent's first impression.",
};

export default function CustomizeGreetingPage() {
  return <StepGreeting />;
}
