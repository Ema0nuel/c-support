import { redirect } from "next/navigation";

/**
 * /customize — entry point
 *
 * Server-side redirect to the first customization step (Agent Name).
 * Defense-in-depth: each sub-page also has OnboardingGuard for client-side check.
 */
export default function CustomizePage() {
  redirect("/customize/name");
}
