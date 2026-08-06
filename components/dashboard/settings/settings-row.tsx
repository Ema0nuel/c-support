"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/**
 * C-Support — Settings Row
 *
 * Reusable read/edit inline row. Shows a label + value in read mode,
 * expands to input/textarea + Save/Cancel in edit mode.
 *
 * Emil: "transition: border-color 160ms ease-out" — focus ring on input.
 */

interface SettingsRowProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  /** "input" for single-line, "textarea" for multi-line */
  type?: "input" | "textarea";
  placeholder?: string;
  maxLength?: number;
  showCount?: boolean;
  className?: string;
  /** Optional content to render below the value in read mode */
  children?: React.ReactNode;
}

export function SettingsRow({
  label,
  value,
  onSave,
  type = "input",
  placeholder,
  maxLength,
  showCount,
  className,
  children,
}: SettingsRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [editing, value]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("This field is required");
      return;
    }
    if (maxLength && trimmed.length > maxLength) {
      setError(`Keep it under ${maxLength} characters`);
      return;
    }
    onSave(trimmed);
    setEditing(false);
    setError("");
  };

  const handleCancel = () => {
    setDraft(value);
    setError("");
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type === "input") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3",
        "transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        editing && "ring-1 ring-primary/20",
        className
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-primary/70 transition-colors duration-150 hover:text-primary"
          >
            Edit
          </button>
        )}
      </div>

      {/* Read mode */}
      {!editing && (
        <>
          <p className="mt-1 text-sm font-medium text-white/80">
            {value || <span className="text-muted-foreground">Not set</span>}
          </p>
          {children}
        </>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="mt-2">
          {type === "textarea" ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              showCount={showCount}
              maxLength={maxLength}
              error={error}
              className="min-h-[100px] text-sm"
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              error={error}
              className="text-sm"
            />
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
