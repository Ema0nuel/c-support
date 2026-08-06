"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, X } from "lucide-react";

/**
 * C-Support — SettingsRow Component
 *
 * A reusable inline-editable row for the settings page.
 * Displays a label and value in read mode; switches to an input
 * on edit, with save/cancel controls.
 *
 * Emil Kowalski: "Specify exact transition properties, never transition-all."
 * Easing: cubic-bezier(0.23, 1, 0.32, 1) — strong ease-out.
 */

export interface SettingsRowProps {
  /** Label displayed on the left side */
  label: string;
  /** Current value displayed in read mode */
  value: string;
  /** Placeholder for the input when value is empty */
  placeholder?: string;
  /** Called when the user saves the new value */
  onSave: (value: string) => Promise<void> | void;
  /** Optional HTML input type (default: "text") */
  type?: string;
  /** Disable the edit button */
  disabled?: boolean;
  /** Additional class names for the outer container */
  className?: string;
}

export function SettingsRow({
  label,
  value,
  placeholder = "Enter value...",
  onSave,
  type = "text",
  disabled = false,
  className,
}: SettingsRowProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync external value changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  function handleEdit() {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  }

  function handleCancel() {
    setEditValue(value);
    setIsEditing(false);
  }

  async function handleSave() {
    const trimmed = editValue.trim();
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      // Keep editing on error so user can retry
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4",
        // Subtle hover highlight on fine-pointer devices only
        !isEditing && "hover:border-primary/20",
        "transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        className
      )}
    >
      {/* Label */}
      <span className="text-sm font-medium text-muted-foreground select-none min-w-[120px]">
        {label}
      </span>

      {/* Value / Input */}
      <div className="flex flex-1 items-center justify-end gap-3">
        {isEditing ? (
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={cn(
              "flex-1 max-w-xs rounded-lg border border-input bg-muted px-3 py-1.5 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "focus:border-primary focus:outline-none focus:shadow-none",
              "disabled:opacity-50"
            )}
          />
        ) : (
          <span
            className={cn(
              "text-sm text-foreground truncate max-w-xs",
              !value && "text-muted-foreground italic"
            )}
          >
            {value || placeholder}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "inline-flex items-center justify-center h-8 w-8 rounded-lg",
                  "text-primary-foreground bg-primary",
                  "transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "hover:bg-primary/90 active:scale-[0.97]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
                aria-label={`Save ${label}`}
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className={cn(
                  "inline-flex items-center justify-center h-8 w-8 rounded-lg",
                  "text-muted-foreground",
                  "transition-[transform,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "hover:text-foreground hover:bg-accent active:scale-[0.97]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
                aria-label={`Cancel editing ${label}`}
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              disabled={disabled}
              className={cn(
                "inline-flex items-center justify-center h-8 w-8 rounded-lg",
                "text-muted-foreground",
                "transition-[transform,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "hover:text-primary hover:bg-accent active:scale-[0.97]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                "disabled:pointer-events-none disabled:opacity-50",
                // Only show on hover for fine-pointer devices
                "opacity-0 group-hover:opacity-100",
                "[@media(hover:none)]:opacity-100"
              )}
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
