import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  showCount?: boolean;
}

/**
 * C-Support Textarea Component
 *
 * Same transition philosophy as Input: exact properties, not "all".
 * Character count turns red at 90% of max length.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCount, maxLength, value, ...props }, ref) => {
    const count = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[160px] w-full rounded-xl border border-input bg-muted px-4 py-3 text-base text-foreground",
            "placeholder:text-muted-foreground resize-none",
            "transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "focus:border-primary focus:outline-none focus:shadow-none",
            error && "border-destructive",
            "hover:border-primary/30",
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex items-center justify-between mt-1">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {showCount && maxLength && (
            <p className={cn(
              "text-sm text-muted-foreground ml-auto transition-colors duration-150",
              count > maxLength * 0.9 && "text-destructive"
            )}>
              {count}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
