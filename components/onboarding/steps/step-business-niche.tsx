"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BusinessNicheIcon } from "../step-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StepBusinessNicheProps {
  niche: string;
  customNiche: string;
  onNext: (niche: string, customNiche: string) => void;
  onBack: () => void;
}

const NICHES = [
  "E-commerce & Retail",
  "Telecommunications",
  "SaaS & Technology",
  "Healthcare",
  "Finance & Banking",
  "Education",
  "Travel & Hospitality",
  "Food & Beverage",
  "Other",
];

/**
 * Onboarding Step 2 — Business Niche
 *
 * Collects the industry/category for business context.
 */
export function StepBusinessNiche({ niche, customNiche, onNext, onBack }: StepBusinessNicheProps) {
  const [selected, setSelected] = useState(niche);
  const [custom, setCustom] = useState(customNiche);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!selected) {
      setError("Please select an industry");
      return;
    }
    if (selected === "Other" && !custom.trim()) {
      setError("Please enter your industry");
      return;
    }
    onNext(selected, custom);
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
            <BusinessNicheIcon className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          What industry are you in?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 text-sm text-muted-foreground"
        >
          This helps the AI understand your business context.
        </motion.p>

        {/* Niche grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="grid grid-cols-3 gap-3"
        >
          {NICHES.map((item) => (
            <button
              key={item}
              onClick={() => {
                setSelected(item);
                setError("");
              }}
              className={cn(
                // Emil: "Specify exact properties, never transition-all"
                "rounded-xl border px-4 py-3 text-sm font-medium",
                "transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "hover:border-primary/30 hover:bg-primary/5",
                "active:scale-[0.98] will-change-transform",
                selected === item
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </motion.div>

        {/* Custom input for "Other" — CSS grid transition, not height animation.
            Emil: "Avoid animating layout-driving properties such as height." */}
        <div
          className="mt-4 grid transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            gridTemplateRows: selected === "Other" ? "1fr" : "0fr",
            opacity: selected === "Other" ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <Input
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setError("");
              }}
              placeholder="e.g., Logistics & Supply Chain"
              error={error}
            />
          </div>
        </div>

        {error && selected !== "Other" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
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
