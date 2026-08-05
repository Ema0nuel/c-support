import type { Metadata } from "next";
import { ChatInterface } from "@/components/chat/chat-interface";

export const metadata: Metadata = {
  title: "Test your agent — C-Support",
  description:
    "Try out your customized support agent with a live chat before going live.",
};

export default function ChatPage() {
  return <ChatInterface />;
}
