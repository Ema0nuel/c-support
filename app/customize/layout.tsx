import { CustomizeShell } from "@/components/customize/customize-shell";
import { ReducedMotionProvider } from "@/components/reduced-motion-provider";

/**
 * Customize Layout
 *
 * Wraps all 7 routed customization steps in the shared shell
 * (top bar + progress rail) and ReducedMotionProvider so Framer
 * Motion respects `prefers-reduced-motion`.
 */
export default function CustomizeLayout({
  children,
}: LayoutProps<"/customize">) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <ReducedMotionProvider>
          <CustomizeShell>{children}</CustomizeShell>
        </ReducedMotionProvider>
      </div>
    </main>
  );
}
