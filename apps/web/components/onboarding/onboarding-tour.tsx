"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface TourStep {
  /**
   * ID único del paso
   */
  id: string;
  /**
   * Título del paso
   */
  title: string;
  /**
   * Descripción del paso
   */
  description: string;
  /**
   * Selector del elemento a destacar
   */
  target?: string;
  /**
   * Posición del tooltip
   */
  position?: "top" | "bottom" | "left" | "right" | "center";
  /**
   * Acción opcional al completar el paso
   */
  onComplete?: () => void;
}

export interface OnboardingTourProps {
  /**
   * Pasos del tour
   */
  steps: TourStep[];
  /**
   * Clave de localStorage para tracking
   */
  tourId: string;
  /**
   * Callback cuando se completa el tour
   */
  onComplete?: () => void;
  /**
   * Callback cuando se omite el tour
   */
  onSkip?: () => void;
  /**
   * Si el tour está activo
   */
  isActive?: boolean;
}

/**
 * Componente de tour guiado para onboarding
 */
export function OnboardingTour({
  steps,
  tourId,
  onComplete,
  onSkip,
  isActive: externalIsActive,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const storageKey = `onboarding-${tourId}-completed`;

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(storageKey);
    if (!completed && externalIsActive !== false) {
      setIsActive(true);
    }
  }, [storageKey, externalIsActive]);

  useEffect(() => {
    if (!isActive || !steps[currentStep]?.target) {
      setTargetRect(null);
      return;
    }

    const updateTargetPosition = () => {
      const element = document.querySelector(steps[currentStep].target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updateTargetPosition();

    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);

    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [isActive, currentStep, steps]);

  const handleNext = () => {
    const step = steps[currentStep];
    step.onComplete?.();

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsActive(false);
    onSkip?.();
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const getTooltipPosition = () => {
    if (!targetRect || step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const positions = {
      top: {
        top: targetRect.top - 20,
        left: targetRect.left + targetRect.width / 2,
        transform: "translate(-50%, -100%)",
      },
      bottom: {
        top: targetRect.bottom + 20,
        left: targetRect.left + targetRect.width / 2,
        transform: "translate(-50%, 0)",
      },
      left: {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.left - 20,
        transform: "translate(-100%, -50%)",
      },
      right: {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.right + 20,
        transform: "translate(0, -50%)",
      },
    };

    return positions[step.position || "bottom"];
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Spotlight */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              borderRadius: "12px",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute w-full max-w-sm mx-4 sm:mx-0",
            "bg-white dark:bg-brisa-900 rounded-xl shadow-2xl",
            "border border-gray-200 dark:border-brisa-700",
            "p-6 z-10",
          )}
          style={getTooltipPosition()}
        >
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-brisa-400 dark:hover:text-brisa-200 transition-colors"
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-1.5 bg-gray-200 dark:bg-brisa-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-brisa-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-brisa-400">
              Paso {currentStep + 1} de {steps.length}
            </p>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-brisa-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-600 dark:text-brisa-400"
            >
              Omitir
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Atrás
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                iconRight={
                  currentStep < steps.length - 1 ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : undefined
                }
              >
                {currentStep < steps.length - 1 ? "Siguiente" : "Finalizar"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook para controlar el estado del tour
 */
export function useOnboarding(tourId: string) {
  const [isCompleted, setIsCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(`onboarding-${tourId}-completed`);
    setIsCompleted(!!completed);
  }, [tourId]);

  const reset = () => {
    localStorage.removeItem(`onboarding-${tourId}-completed`);
    setIsCompleted(false);
  };

  return {
    isCompleted,
    shouldShowTour: !isCompleted,
    reset,
  };
}
