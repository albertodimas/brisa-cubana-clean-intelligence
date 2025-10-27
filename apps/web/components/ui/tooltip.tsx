"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface TooltipProps {
  /**
   * Contenido del tooltip
   */
  content: React.ReactNode;
  /**
   * Elemento que dispara el tooltip
   */
  children: React.ReactElement;
  /**
   * Posición del tooltip
   */
  position?: "top" | "bottom" | "left" | "right";
  /**
   * Delay antes de mostrar (ms)
   */
  delay?: number;
  /**
   * Si el tooltip está deshabilitado
   */
  disabled?: boolean;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Tooltip component con posicionamiento automático
 */
export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
        });
      }
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: "-translate-x-1/2 bottom-full mb-2",
    bottom: "-translate-x-1/2 top-full mt-2",
    left: "-translate-y-1/2 right-full mr-2 top-1/2",
    right: "-translate-y-1/2 left-full ml-2 top-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-brisa-800",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-brisa-800",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-brisa-800",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-brisa-800",
  };

  const initialAnimation = {
    top: { y: 10, opacity: 0 },
    bottom: { y: -10, opacity: 0 },
    left: { x: 10, opacity: 0 },
    right: { x: -10, opacity: 0 },
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={initialAnimation[position]}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={initialAnimation[position]}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-[9999] px-3 py-2 text-xs font-medium text-white",
              "bg-brisa-800 rounded-lg shadow-xl border border-brisa-700/50",
              "max-w-xs backdrop-blur-sm pointer-events-none",
              positionClasses[position],
              className,
            )}
            style={{
              left:
                position === "top" || position === "bottom"
                  ? coords.x
                  : undefined,
              top:
                position === "top"
                  ? coords.y
                  : position === "bottom"
                    ? coords.y
                    : undefined,
            }}
          >
            {content}

            {/* Arrow */}
            <div
              className={cn(
                "absolute w-0 h-0 border-4",
                arrowClasses[position],
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export interface TooltipTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

/**
 * Wrapper simple para el trigger del tooltip
 */
export function TooltipTrigger({
  children,
  asChild = false,
}: TooltipTriggerProps) {
  if (asChild) {
    return children;
  }

  return <span className="inline-flex">{children}</span>;
}
