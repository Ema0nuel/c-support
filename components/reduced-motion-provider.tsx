"use client";

import { MotionConfig } from "framer-motion";

/**
 * C-Support — Reduced Motion Provider
 *
 * Wraps the app tree so Framer Motion respects `prefers-reduced-motion`.
 *
 * Without this, Framer Motion's JS-based animations (requestAnimationFrame)
 * bypass the CSS `@media (prefers-reduced-motion: reduce)` rule.
 * `MotionConfig reducedMotion="user"` hooks into matchMedia natively.
 *
 * Emil Kowalski: "prefers-reduced-motion doesn't mean zero animation.
 * Keep opacity/color transitions; remove transform-based motion."
 */
export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
