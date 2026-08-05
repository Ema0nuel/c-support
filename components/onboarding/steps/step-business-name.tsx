"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BusinessNameIcon } from "../step-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StepBusinessNameProps {
  name: string;
  onNext: (name: string) => void;
  onBack: () => void;
}

/**
 * Onboarding Step 1 — Business Name
 *
 * Collects the business name for identifying the company to customers.
 */
export function StepBusinessName({ name, onNext, onBack }: StepBusinessNameProps) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter your business name");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }
    onNext(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <BusinessNameIcon className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          What&apos;s your business called?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 text-sm text-muted-foreground"
        >
          This is how the AI will identify your company to customers.
        </motion.p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <label
            htmlFor="business-name"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Business name
          </label>
          <Input
            ref={inputRef}
            id="business-name"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., TechVault Electronics"
            error={error}
          />
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex gap-3 pt-6"
      >
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-[2]"
        >
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
