"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface Step {
  /**
   * ID único del paso
   */
  id: string;
  /**
   * Título del paso
   */
  title: string;
  /**
   * Descripción opcional del paso
   */
  description?: string;
  /**
   * Contenido del paso
   */
  content: React.ReactNode;
  /**
   * Validación antes de avanzar (opcional)
   */
  validate?: () => boolean | Promise<boolean>;
  /**
   * Callback al entrar en este paso
   */
  onEnter?: () => void | Promise<void>;
  /**
   * Callback al salir de este paso
   */
  onExit?: () => void | Promise<void>;
}

export interface MultiStepFormProps {
  /**
   * Lista de pasos del formulario
   */
  steps: Step[];
  /**
   * Callback al completar el formulario
   */
  onComplete: () => void | Promise<void>;
  /**
   * Callback al cancelar el formulario
   */
  onCancel?: () => void;
  /**
   * Paso inicial (por defecto 0)
   */
  initialStep?: number;
  /**
   * Permitir navegación a pasos anteriores
   */
  allowBackNavigation?: boolean;
  /**
   * Mostrar progress bar
   */
  showProgress?: boolean;
  /**
   * Mostrar indicadores de pasos
   */
  showStepIndicators?: boolean;
  /**
   * Texto del botón de finalizar
   */
  submitText?: string;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Formulario multi-paso con progreso y validaciones
 */
export function MultiStepForm({
  steps,
  onComplete,
  onCancel,
  initialStep = 0,
  allowBackNavigation = true,
  showProgress = true,
  showStepIndicators = true,
  submitText = "Finalizar",
  className,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [isValidating, setIsValidating] = React.useState(false);
  const [direction, setDirection] = React.useState(1); // 1 = forward, -1 = backward

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStepData.validate) {
      setIsValidating(true);
      try {
        const isValid = await currentStepData.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error("Validation error:", error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    if (currentStepData.onExit) {
      await currentStepData.onExit();
    }

    if (isLastStep) {
      await onComplete();
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      if (steps[currentStep + 1]?.onEnter) {
        await steps[currentStep + 1].onEnter!();
      }
    }
  };

  const handleBack = async () => {
    if (!isFirstStep && allowBackNavigation) {
      if (currentStepData.onExit) {
        await currentStepData.onExit();
      }

      setDirection(-1);
      setCurrentStep((prev) => prev - 1);

      if (steps[currentStep - 1]?.onEnter) {
        await steps[currentStep - 1].onEnter!();
      }
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    if (stepIndex === currentStep) return;
    if (stepIndex > currentStep) return; // Solo permitir volver atrás

    if (currentStepData.onExit) {
      await currentStepData.onExit();
    }

    setDirection(stepIndex > currentStep ? 1 : -1);
    setCurrentStep(stepIndex);

    if (steps[stepIndex]?.onEnter) {
      await steps[stepIndex].onEnter!();
    }
  };

  const hasInitialized = React.useRef(false);

  // Ensure the initial step executes its onEnter handler once
  React.useEffect(() => {
    if (!hasInitialized.current && currentStepData?.onEnter) {
      currentStepData.onEnter();
      hasInitialized.current = true;
    }
  }, [currentStepData]);

  return (
    <Card className={cn("w-full max-w-3xl mx-auto", className)}>
      <CardHeader className="space-y-4">
        {/* Step Indicators */}
        {showStepIndicators && (
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleStepClick(index)}
                      disabled={index > currentStep}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                        isCompleted &&
                          "bg-brisa-600 text-white cursor-pointer hover:bg-brisa-700",
                        isCurrent &&
                          "bg-brisa-500 text-white ring-4 ring-brisa-500/20",
                        !isCompleted &&
                          !isCurrent &&
                          "bg-brisa-800/50 text-brisa-400",
                        index <= currentStep
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block text-center max-w-[100px]",
                        isCurrent ? "text-brisa-200" : "text-brisa-500",
                      )}
                    >
                      {step.title}
                    </span>
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-colors",
                        index < currentStep
                          ? "bg-brisa-600"
                          : "bg-brisa-800/50",
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <Progress value={progress} showLabel className="h-2" />
        )}
      </CardHeader>

      <CardContent className="min-h-[300px]">
        {/* Step Content with Animation */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-brisa-50 mb-2">
                {currentStepData.title}
              </h3>
              {currentStepData.description && (
                <p className="text-brisa-400">{currentStepData.description}</p>
              )}
            </div>

            <div>{currentStepData.content}</div>
          </motion.div>
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-brisa-700/30 pt-6">
        <div>
          {!isFirstStep && allowBackNavigation && (
            <Button
              variant="outline"
              onClick={handleBack}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
          )}
          {onCancel && isFirstStep && (
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          isLoading={isValidating}
          iconRight={
            !isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined
          }
        >
          {isLastStep ? submitText : "Siguiente"}
        </Button>
      </CardFooter>
    </Card>
  );
}
