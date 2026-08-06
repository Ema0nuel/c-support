"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";

const ANALYSIS_STEPS = [
  "Reading your policies...",
  "Matching against training categories...",
  "Generating knowledge base profile...",
];

export function PoliciesSection() {
  const {
    policiesInput,
    aiAnalysis,
    isAnalyzing,
    updateField,
    setAiAnalysis,
    setAnalyzing,
  } = useOnboardingStore();

  const [value, setValue] = useState(policiesInput);
  const [error, setError] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File handling
  const processFile = useCallback(
    async (file: File) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (![".txt", ".pdf"].includes(ext)) {
        setError("Only .txt and .pdf files are supported.");
        return;
      }

      if (file.type === "application/pdf" || ext === ".pdf") {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text +=
              content.items
                .filter(
                  (item) =>
                    "str" in item &&
                    typeof (item as { str: unknown }).str === "string"
                )
                .map((item) => (item as { str: string }).str)
                .join(" ") + "\n";
          }
          if (text.trim().length < 20) {
            setError("Could not extract meaningful text from the PDF.");
            return;
          }
          setValue(text.trim());
          setError("");
        } catch {
          setError("Failed to read PDF. Try pasting instead.");
        }
      } else {
        const text = await file.text();
        if (text.trim().length < 20) {
          setError("File content is too short. Please provide more detail.");
          return;
        }
        setValue(text.trim());
        setError("");
      }
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // AI Analysis
  const handleAnalyze = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter your business policies.");
      return;
    }
    if (trimmed.length < 20) {
      setError("Please provide at least 20 characters of policy content.");
      return;
    }

    setError("");
    updateField("policiesInput", trimmed);
    setAnalyzing(true);
    setAnalysisStep(0);

    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.forEach((_, i) => {
      stepTimers.push(
        setTimeout(() => setAnalysisStep(i), (i + 1) * 2000)
      );
    });

    try {
      const { businessName, businessNiche } = useOnboardingStore.getState();
      const response = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policies: trimmed,
          businessName,
          businessNiche,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setAiAnalysis(data);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze policies. Please try again."
      );
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setValue("");
    updateField("policiesInput", "");
    setAiAnalysis(null);
    setIsEditing(true);
  };

  const hasPolicies = policiesInput.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Policies & Knowledge Base
        </p>
        {hasPolicies && !isEditing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-primary/70 transition-colors duration-150 hover:text-primary"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-destructive/70 transition-colors duration-150 hover:text-destructive"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Read mode — show summary */}
      {hasPolicies && !isEditing && !isAnalyzing && (
        <div className="mt-2">
          <p className="text-sm text-white/80">
            {policiesInput.length.toLocaleString()} characters of policy
            content
          </p>

          {/* Matched categories */}
          {aiAnalysis && aiAnalysis.matchedCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {aiAnalysis.matchedCategories.map((cat) => (
                <Badge key={cat}>{cat}</Badge>
              ))}
            </div>
          )}

          {/* Extracted policies count */}
          {aiAnalysis && (
            <p className="mt-2 text-xs text-muted-foreground">
              {aiAnalysis.suggestedPolicies.length} policies extracted
            </p>
          )}

          {/* Re-analyze button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            className="mt-3"
          >
            Re-analyze with AI
          </Button>
        </div>
      )}

      {/* Edit mode — textarea + upload */}
      {(isEditing || !hasPolicies) && !isAnalyzing && (
        <div className="mt-3">
          {/* Upload drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-[border-color,background-color] duration-150",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <p className="text-xs font-medium text-foreground">
              Drop a .txt/.pdf file or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Or divider */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              or paste
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Paste textarea */}
          <Textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder="Paste your business policies here..."
            showCount
            maxLength={50000}
            error={error}
            className="min-h-[120px] text-sm"
          />

          {/* Analyze button */}
          <div className="mt-3 flex gap-2">
            {isEditing && hasPolicies && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={!value.trim() || value.trim().length < 20}
              className={isEditing && hasPolicies ? "flex-1" : "w-full"}
            >
              Analyze with AI
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isAnalyzing && (
        <div className="mt-4 flex flex-col items-center py-6">
          <div className="relative mb-6">
            <div
              className="h-12 w-12 animate-spin-css rounded-full border-3 border-primary/20"
              style={{ borderTopColor: "var(--primary)" }}
            />
          </div>
          <div className="space-y-2">
            {ANALYSIS_STEPS.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: i <= analysisStep ? 1 : 0.3, y: 0 }}
                className="flex items-center gap-2"
              >
                {i < analysisStep ? (
                  <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === analysisStep ? (
                  <div className="animate-pulse-soft h-4 w-4 rounded-full border-2 border-primary" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    i <= analysisStep ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis summary */}
      {aiAnalysis && !isEditing && !isAnalyzing && (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">
            Knowledge Base Profile
          </p>
          <p className="mt-1 text-xs text-foreground">{aiAnalysis.summary}</p>
        </div>
      )}
    </div>
  );
}