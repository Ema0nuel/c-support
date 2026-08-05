import type { Metadata } from "next";
import { StepScope } from "@/components/customize/steps/step-scope";

export const metadata: Metadata = {
  title: "Knowledge — C-Support",
  description: "Define what your agent handles.",
};

export default function CustomizeScopePage() {
  return <StepScope />;
}
