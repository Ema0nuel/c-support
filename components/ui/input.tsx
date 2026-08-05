import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * C-Support Input Component
 *
 * Emil: "transition: transform 160ms ease-out" — applied to border + ring.
 * Hover state on fine-pointer devices only (no touch false positives).
 * Focus ring uses CSS variable for theming.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-muted px-4 py-3 text-base text-foreground",
            "placeholder:text-muted-foreground",
            // Emil: specify exact transition properties, never "all"
            "transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            // Clean single-line focus — border color only, no outline, no ring, no shadow
            "focus:border-primary focus:outline-none focus:shadow-none",
            error && "border-destructive",
            // Hover state — only on fine pointer devices
            "hover:border-primary/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
