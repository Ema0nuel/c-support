"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PERSONALITIES, personalityById } from "@/lib/agent";
import { AgentAvatar } from "@/components/customize/agent-icons";
import { cn } from "@/lib/utils";

interface PersonalitySelectorProps {
  selectedId: string;
  agentName: string;
  onSelect: (id: string) => void;
}

export function PersonalitySelector({
  selectedId,
  agentName,
  onSelect,
}: PersonalitySelectorProps) {
  const selected = personalityById(selectedId) ?? PERSONALITIES[0];

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Personality
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PERSONALITIES.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={isSelected}
              className={cn(
                "group rounded-xl border p-4 text-left",
                "transition-[border-color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                  : "border-border bg-background hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {p.label}
                </span>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted p-4 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Preview · &ldquo;Where is my refund?&rdquo;
        </p>
        <div className="flex items-start gap-3">
          <AgentAvatar avatarId="spark" size="sm" />
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-xl rounded-tl-sm bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground"
            >
              {selected.sample}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
