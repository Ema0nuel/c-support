"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BusinessOriginIcon } from "../step-icons";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface StepBusinessOriginProps {
  origin: string;
  onNext: (origin: string) => void;
  onBack: () => void;
}

/**
 * Onboarding Step 3 — Business Origin
 *
 * Collects company background, founding story, mission.
 */
export function StepBusinessOrigin({ origin, onNext, onBack }: StepBusinessOriginProps) {
  const [value, setValue] = useState(origin);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please tell us about your business");
      return;
    }
    if (trimmed.length < 10) {
      setError("Please provide at least 10 characters");
      return;
    }
    if (trimmed.length > 2000) {
      setError("Please keep it under 2000 characters");
      return;
    }
    onNext(trimmed);
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
            <BusinessOriginIcon className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Tell us about your business
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 text-sm text-muted-foreground"
        >
          Company background, founding story, mission. This gives the AI context about who you are.
        </motion.p>

        {/* Textarea — no redundant label; the h2 header is the label.
            Emil: "Every element earns its place. If it repeats, it goes." */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <Textarea
            ref={textareaRef}
            id="business-origin"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder="We started in 2019 as a small family-run business selling quality products. Our mission is to make great service accessible..."
            showCount
            maxLength={2000}
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
