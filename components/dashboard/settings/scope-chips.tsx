"use client";

import { DEFAULT_SCOPE } from "@/lib/agent";
import { cn } from "@/lib/utils";

interface ScopeChipsProps {
  enabledCategories: string[];
  sourceCategories?: string[];
  onChange: (categories: string[]) => void;
}

export function ScopeChips({
  enabledCategories,
  sourceCategories = DEFAULT_SCOPE,
  onChange,
}: ScopeChipsProps) {
  const enabled =
    enabledCategories.length > 0 ? enabledCategories : sourceCategories;
  const isAllEnabled = enabled.length === sourceCategories.length;

  const toggle = (category: string) => {
    const next = enabled.includes(category)
      ? enabled.filter((c) => c !== category)
      : [...enabled, category];
    onChange(next);
  };

  const toggleAll = () => {
    onChange(isAllEnabled ? [] : [...sourceCategories]);
  };

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Knowledge Topics
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-primary/70 transition-colors duration-150 hover:text-primary"
        >
          {isAllEnabled ? "Disable all" : "Enable all"}
        </button>
      </div>

      {/* Counter */}
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{enabled.length}</span>{" "}
        of {sourceCategories.length} topics enabled
      </p>

      {/* Toggle chips — same pattern as customize/scope step */}
      <div className="mt-3 flex flex-wrap gap-2">
        {sourceCategories.map((category) => {
          const isOn = enabled.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              aria-pressed={isOn}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium",
                "transition-[border-color,background-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.97]",
                isOn
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {category}
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150",
                  isOn
                    ? "border-lime-400 bg-lime-400 text-teal-950"
                    : "border-border bg-muted text-transparent"
                )}
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
