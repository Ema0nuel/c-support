import type { Metadata } from "next";
import { StepAvatar } from "@/components/customize/steps/step-avatar";

export const metadata: Metadata = {
  title: "Avatar — C-Support",
  description: "Give your support agent a face.",
};

export default function CustomizeAvatarPage() {
  return <StepAvatar />;
}
