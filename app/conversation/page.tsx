import type { Metadata } from "next";
import { ConversationPage } from "@/components/conversations/conversation-page";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";

export const metadata: Metadata = {
  title: "Conversations — C-Support",
  description: "View and manage your customer conversations.",
};

export default function ConversationsRoute() {
  return (
    <OnboardingGuard>
      <ConversationPage />
    </OnboardingGuard>
  );
}
