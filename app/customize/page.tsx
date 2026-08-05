import { redirect } from "next/navigation";

/**
 * /customize — entry point
 *
 * Redirects to the first customization step (Agent Name).
 */
export default function CustomizePage() {
  redirect("/customize/name");
}
