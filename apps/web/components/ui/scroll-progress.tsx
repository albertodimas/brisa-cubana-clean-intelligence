"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";

export interface ScrollProgressProps {
  /**
   * Posición de la barra
   * @default "top"
   */
  position?: "top" | "bottom" | "left" | "right";
  /**
   * Altura/Ancho de la barra en px
   * @default 3
   */
  thickness?: number;
  /**
   * Color de la barra
   * @default "rgb(126, 231, 196)"
   */
  color?: string;
  /**
   * Suavidad del spring (0-300)
   * @default 100
   */
  springStiffness?: number;
  /**
   * Clases adicionales
   */
  className?: string;
  /**
   * Mostrar glow effect
   * @default true
   */
  glow?: boolean;
}

/**
 * Barra de progreso que muestra el avance del scroll de la página
 * Efecto premium y funcional para páginas largas
 *
 * @example
 * ```tsx
 * // Barra superior (default)
 * <ScrollProgress />
 *
 * // Barra inferior con glow
 * <ScrollProgress position="bottom" glow color="rgb(139, 92, 246)" />
 *
 * // Barra lateral derecha
 * <ScrollProgress position="right" thickness={4} />
 * ```
 */
export function ScrollProgress({
  position = "top",
  thickness = 3,
  color = "rgb(126, 231, 196)",
  springStiffness = 100,
  className,
  glow = true,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: springStiffness,
    damping: 30,
    restDelta: 0.001,
  });

  const isHorizontal = position === "top" || position === "bottom";

  const positionStyles = {
    top: "top-0 left-0 right-0 h-[var(--thickness)] w-full",
    bottom: "bottom-0 left-0 right-0 h-[var(--thickness)] w-full",
    left: "top-0 left-0 bottom-0 w-[var(--thickness)] h-full",
    right: "top-0 right-0 bottom-0 w-[var(--thickness)] h-full",
  };

  return (
    <motion.div
      className={cn(
        "fixed z-[9999] bg-gradient-to-r from-transparent via-current to-transparent",
        positionStyles[position],
        className,
      )}
      style={
        {
          "--thickness": `${thickness}px`,
          color,
          scaleX: isHorizontal ? scaleX : 1,
          scaleY: isHorizontal ? 1 : scaleX,
          transformOrigin: isHorizontal
            ? "0% 50%"
            : position === "left"
              ? "50% 0%"
              : "50% 100%",
          boxShadow: glow
            ? `0 0 20px ${color}, 0 0 40px ${color}40, 0 0 60px ${color}20`
            : "none",
        } as React.CSSProperties
      }
    />
  );
}

/**
 * Indicador circular de progreso de scroll
 * Alternativa moderna al scroll progress bar
 */
export function ScrollProgressCircle({
  size = 60,
  strokeWidth = 4,
  color = "rgb(126, 231, 196)",
  position = "bottom-right",
  className,
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}) {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const positionClasses = {
    "bottom-right": "bottom-8 right-8",
    "bottom-left": "bottom-8 left-8",
    "top-right": "top-8 right-8",
    "top-left": "top-8 left-8",
  };

  return (
    <div
      className={cn("fixed z-[9999]", positionClasses[position], className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(126, 231, 196, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            pathLength,
            rotate: -90,
            transformOrigin: "50% 50%",
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }}
        />
      </svg>
    </div>
  );
}

/**
 * Scroll progress con porcentaje
 */
export function ScrollProgressWithPercentage({
  position = "bottom-right",
}: {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) {
  const { scrollYProgress } = useScroll();
  const [percentage, setPercentage] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setPercentage(Math.round(latest * 100));
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const positionClasses = {
    "bottom-right": "bottom-8 right-8",
    "bottom-left": "bottom-8 left-8",
    "top-right": "top-8 right-8",
    "top-left": "top-8 left-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "fixed z-[9999] rounded-full bg-brisa-800/80 backdrop-blur-md border border-brisa-600/30 px-4 py-2 shadow-lg",
        positionClasses[position],
      )}
    >
      <span className="text-sm font-semibold text-brisa-50 tabular-nums">
        {percentage}%
      </span>
    </motion.div>
  );
}
