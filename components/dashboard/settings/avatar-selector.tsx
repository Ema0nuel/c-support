"use client";

import { AVATARS } from "@/lib/agent";
import { AgentAvatar } from "@/components/customize/agent-icons";
import { cn } from "@/lib/utils";

interface AvatarSelectorProps {
  selectedId: string;
  agentName: string;
  businessName: string;
  onSelect: (id: string) => void;
}

export function AvatarSelector({
  selectedId,
  agentName,
  businessName,
  onSelect,
}: AvatarSelectorProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Avatar
      </p>

      {/* Live preview — agent header */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted p-3">
        <AgentAvatar avatarId={selectedId} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {agentName.trim() || "Your agent"}
          </p>
          <p className="text-xs text-muted-foreground">
            {businessName.trim() || "Your business"} · Online
          </p>
        </div>
      </div>

      {/* Avatar grid — 3 columns, compact */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {AVATARS.map((a) => {
          const isSelected = selectedId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              aria-pressed={isSelected}
              aria-label={`Use the ${a.label} avatar`}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 pt-3",
                "transition-[border-color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.97]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                  : "border-border bg-background hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              {isSelected && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <AgentAvatar
                avatarId={a.id}
                size="md"
                className={cn(
                  "transition-transform duration-150",
                  isSelected ? "scale-105" : "group-hover:scale-105"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
