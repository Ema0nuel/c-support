"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SendIcon } from "./chat-icons";
import { cn } from "@/lib/utils";

/**
 * C-Support — Chat Composer
 *
 * Glass input dock with send button.
 * - Glass container: bg rgba(11,80,70,0.6), backdrop-blur(20px), border
 * - Input: transparent bg, white text, 13px, NO focus ring
 * - Send button: lime #B8DE72 bg, #024B41 icon, scale(0.97) on :active
 * - Send on Enter (not Shift+Enter)
 * - Footer: "Powered by C-Support AI"
 */

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Type-to-focus: any printable keypress anywhere focuses the input
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      // Skip if already focused on the input, a textarea, or contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" || tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) return;

      // Skip modifier combos (Ctrl+C, Cmd+K, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Skip non-printable keys (Shift, Ctrl, Alt, Meta, Arrow keys, F-keys, etc.)
      if (e.key.length > 1 && e.key !== "Space") return;

      // Printable character — focus the input
      inputRef.current?.focus();
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div className="shrink-0 px-3 pb-4 pt-2 sm:px-4 md:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Glass composer container */}
        <div
          className="rounded-[14px] border border-[rgba(23,96,85,0.5)] bg-[rgba(11,80,70,0.6)] p-1 backdrop-blur-xl backdrop-saturate-[1.8]"
        >
          <div className="flex items-center gap-2">
            {/* Input — zero border, zero outline, zero ring */}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              maxLength={500}
              className={cn(
                "flex-1 border-0 bg-transparent px-3 py-2.5 text-[13px] tracking-[-0.005em] text-white outline-none ring-0 shadow-none",
                "placeholder:text-[rgba(169,195,188,0.3)]",
                "disabled:opacity-40"
              )}
            />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                "border-none transition-[transform,background-color] duration-150",
                "ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.97]",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-[#a8d066]"
                  : "cursor-not-allowed bg-[rgba(169,195,188,0.1)] text-[rgba(169,195,188,0.2)]"
              )}
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-2 text-center text-[10px] text-[rgba(169,195,188,0.2)]">
          Powered by C-Support AI
        </p>
      </div>
    </div>
  );
}
