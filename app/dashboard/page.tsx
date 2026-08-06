import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Dashboard — C-Support",
  description: "Your support agent is ready. Launch it and take it for a spin.",
};

export default function DashboardPage() {
  return (
    <OnboardingGuard>
      <Dashboard />
    </OnboardingGuard>
  );
}
