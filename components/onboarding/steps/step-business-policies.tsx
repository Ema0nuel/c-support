"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessPoliciesIcon } from "../step-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useOnboardingStore, type AIAnalysis } from "@/store/onboarding";
import { cn } from "@/lib/utils";

/**
 * Check if an AIAnalysis result is actually valid (has real data).
 * When the LLM returns an error stub (empty categories + empty policies),
 * the analysis should be treated as failed — not shown as results.
 */
function isAnalysisValid(analysis: AIAnalysis | null): boolean {
  if (!analysis) return false;
  const hasCategories = analysis.matchedCategories.length > 0;
  const hasPolicies = analysis.suggestedPolicies.length > 0;
  const hasSummary = analysis.summary.trim().length > 0;
  // Must have at least categories OR policies AND a summary
  return (hasCategories || hasPolicies) && hasSummary;
}

interface StepBusinessPoliciesProps {
  onBack: () => void;
}

const ACCEPTED_EXTENSIONS = ".txt,.pdf";

const ANALYSIS_STEPS = [
  "Reading your policies...",
  "Matching against training categories...",
  "Generating knowledge base profile...",
];

/**
 * Onboarding Step 4 — Business Policies
 *
 * The most critical step: collects business policies (upload or paste),
 * then calls the AI to analyze them and generate a structured knowledge base profile.
 */
export function StepBusinessPolicies({ onBack }: StepBusinessPoliciesProps) {
  const {
    policiesInput,
    policiesSource,
    aiAnalysis,
    isAnalyzing,
    updateField,
    setAiAnalysis,
    setAnalyzing,
    setPoliciesSource,
  } = useOnboardingStore();

  const [activeTab, setActiveTab] = useState<"upload" | "paste">(
    policiesSource || "paste"
  );
  const [value, setValue] = useState(policiesInput);
  const [error, setError] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Auto-clear stale/invalid analysis from prior session ──
  // When the user resumes onboarding after a failed analysis was persisted,
  // clear it so they see the input form instead of broken results.
  useEffect(() => {
    if (aiAnalysis && !isAnalysisValid(aiAnalysis)) {
      setAiAnalysis(null);
    }
  }, [aiAnalysis, setAiAnalysis]);

  // ─── File handling ────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    // Validate extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".txt", ".pdf"].includes(ext)) {
      setError("Only .txt and .pdf files are supported.");
      return;
    }

    if (file.type === "application/pdf" || ext === ".pdf") {
      // Dynamic import pdfjs-dist
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items
            .filter((item) => "str" in item && typeof (item as { str: unknown }).str === "string")
            .map((item) => (item as { str: string }).str)
            .join(" ") + "\n";
        }

        if (text.trim().length < 20) {
          setError("Could not extract meaningful text from the PDF. Try pasting the content instead.");
          setActiveTab("paste");
          return;
        }

        setValue(text.trim());
        setPoliciesSource("upload");
        setError("");
      } catch {
        setError("Failed to read PDF. Try pasting the content instead.");
        setActiveTab("paste");
      }
    } else {
      // Plain text
      const text = await file.text();
      if (text.trim().length < 20) {
        setError("File content is too short. Please provide more detail.");
        return;
      }
      setValue(text.trim());
      setPoliciesSource("upload");
      setError("");
    }
  }, [setPoliciesSource]);

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

  // ─── AI Analysis ──────────────────────────────────
  const handleAnalyze = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please paste or upload your business policies.");
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

    // Simulate progressive analysis steps
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

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Clear any prior stale analysis before storing new results
      setAiAnalysis(null);

      setAiAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze policies. Please try again."
      );
      setAiAnalysis(null);
      setAnalyzing(false);
    }
  };

  const handleRetry = () => {
    setAiAnalysis(null);
    setAnalyzing(false);
    setAnalysisStep(0);
  };

  const handleContinue = () => {
    // Trigger wizard's onNext — handled by the wizard container reading isAnalyzing/aiAnalysis
    // We emit a custom event the wizard listens for
    window.dispatchEvent(new CustomEvent("onboarding:policies-ready"));
  };

  // ─── Render states ────────────────────────────────
  const renderAnalysisLoading = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-12"
    >
      {/* Animated spinner — CSS only, not Framer Motion.
          Emil: "CSS animations run off the main thread." */}
      <div className="relative mb-8">
        <div
          className="h-16 w-16 animate-spin-css rounded-full border-4 border-primary/20"
          style={{ borderTopColor: "var(--primary)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-primary/20" />
        </div>
      </div>

      {/* Analysis steps */}
      <div className="space-y-3 text-center">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: i <= analysisStep ? 1 : 0.3,
              y: 0,
            }}
            transition={{ delay: i * 0.15, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {i < analysisStep ? (
              <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : i === analysisStep ? (
              <div
                className="animate-pulse-soft h-5 w-5 rounded-full border-2 border-primary"
              />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-border" />
            )}
            <span className={cn(
              "text-sm font-medium",
              i <= analysisStep ? "text-foreground" : "text-muted-foreground"
            )}>
              {step}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Powered by deepseek-customer-support
      </p>
    </motion.div>
  );

  const renderAnalysisResults = () => {
    if (!aiAnalysis) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {/* Summary */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="mb-1 text-sm font-semibold text-primary">
            Knowledge Base Profile
          </h4>
          <p className="text-sm text-foreground">{aiAnalysis.summary}</p>
        </div>

        {/* Matched categories */}
        {aiAnalysis.matchedCategories.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Matched Training Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.matchedCategories.map((cat) => (
                <Badge key={cat}>{cat}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested policies */}
        {aiAnalysis.suggestedPolicies.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Extracted Policies
            </h4>
            <div className="space-y-2">
              {aiAnalysis.suggestedPolicies.map((policy, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <Badge variant="accent">{policy.category}</Badge>
                  <p className="flex-1 text-sm text-foreground">
                    {policy.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleRetry} className="flex-1">
            Re-analyze
          </Button>
          <Button onClick={handleContinue} className="flex-[2]">
            Looks good, continue
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderInputForm = () => (
    <>
      {/* Tab switcher */}
      <div className="mb-4 flex rounded-lg border border-border bg-muted p-1">
        {(["upload", "paste"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setError("");
            }}
            className={cn(
              // Emil: "Specify exact properties, never transition-all"
              "flex-1 rounded-md px-4 py-2 text-sm font-medium",
              "transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "upload" ? "Upload File" : "Paste Text"}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      <AnimatePresence mode="wait">
        {activeTab === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {/* Upload icon */}
              <svg className="mb-3 h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="mb-1 text-sm font-medium text-foreground">
                {value ? "File loaded" : "Drop a file or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts .txt and .pdf files
              </p>
              {value && (
                <p className="mt-2 text-xs text-primary">
                  Content loaded ({value.length} characters)
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
        )}

        {activeTab === "paste" && (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder={"Paste your business policies here. For example:\n\nRefund Policy: We offer a full refund within 30 days of purchase...\nShipping Policy: Orders are processed within 2 business days...\nReturn Policy: Items can be returned within 14 days if unopened..."}
              showCount
              maxLength={50000}
              error={error}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error (for upload tab) */}
      {error && activeTab === "upload" && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      {/* Analyze button */}
      <div className="flex gap-3 pt-6">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={!value.trim() || value.trim().length < 20}
          className="flex-[2]"
        >
          Analyze with AI
        </Button>
      </div>
    </>
  );

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
            <BusinessPoliciesIcon className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {isAnalysisValid(aiAnalysis)
            ? "Analysis Complete"
            : isAnalyzing
              ? "Analyzing your policies"
              : "Add your business policies"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 text-sm text-muted-foreground"
        >
          {isAnalysisValid(aiAnalysis)
            ? "The AI has analyzed your policies and created a knowledge base profile."
            : isAnalyzing
              ? "The AI is comparing your policies against our training categories..."
              : "Upload or paste your refund, shipping, return, and other policies. The AI will analyze them to build your knowledge base."}
        </motion.p>

        {/* Content — switches between input, loading, results */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <AnimatePresence mode="wait">
            {isAnalyzing && !isAnalysisValid(aiAnalysis) ? (
              renderAnalysisLoading()
            ) : isAnalysisValid(aiAnalysis) ? (
              renderAnalysisResults()
            ) : (
              renderInputForm()
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
