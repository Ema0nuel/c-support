"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ReviewIcon } from "../step-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingStore, TOTAL_STEPS } from "@/store/onboarding";

/**
 * Onboarding Step 5 — Review
 *
 * Displays a summary of all entered data for final confirmation.
 * On "Continue", marks onboarding complete and redirects to the
 * agent customization flow (/customize).
 */
export function StepReview() {
  const router = useRouter();

  const {
    businessName,
    businessNiche,
    customNiche,
    businessOrigin,
    policiesInput,
    aiAnalysis,
    markComplete,
    setCurrentStep,
  } = useOnboardingStore();

  const displayNiche =
    businessNiche === "Other" ? customNiche : businessNiche;

  const handleLaunch = () => {
    markComplete();
    router.push("/customize");
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
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
            <ReviewIcon className="h-8 w-8" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Review your setup
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 text-sm text-muted-foreground"
        >
          Everything looks good? Next, let&apos;s customize your AI support agent.
        </motion.p>

        {/* Summary cards */}
        <div className="space-y-3">
          {/* Business Name */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Business Name
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {businessName || "Not set"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditStep(1)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Business Niche */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Industry
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {displayNiche || "Not set"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditStep(2)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Business Origin */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    About Your Business
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-foreground">
                    {businessOrigin || "Not set"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditStep(3)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Policies & Knowledge Base */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Knowledge Base
                    </p>
                    {policiesInput ? (
                      <p className="mt-0.5 text-sm text-foreground">
                        {policiesInput.length.toLocaleString()} characters of policy content
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        No policies added
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStep(4)}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Edit
                  </Button>
                </div>

                {/* Matched categories */}
                {aiAnalysis && aiAnalysis.matchedCategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {aiAnalysis.matchedCategories.map((cat) => (
                      <Badge key={cat} variant="default">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* AI Analysis summary */}
                {aiAnalysis && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {aiAnalysis.suggestedPolicies.length} policies extracted
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Launch button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex gap-3 pt-6"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentStep(TOTAL_STEPS - 1)}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleLaunch}
          className="flex-[2]"
        >
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
