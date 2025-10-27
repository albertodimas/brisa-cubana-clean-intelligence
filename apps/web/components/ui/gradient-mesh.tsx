"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface GradientMeshProps {
  /**
   * Colores de los blobs (máximo 3)
   */
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /**
   * Velocidad de animación (1 = normal, 2 = doble velocidad)
   * @default 1
   */
  speed?: number;
  /**
   * Opacidad de los blobs (0-1)
   * @default 0.3
   */
  opacity?: number;
  /**
   * Intensidad del blur (en px)
   * @default 96
   */
  blurIntensity?: number;
  /**
   * Clases adicionales
   */
  className?: string;
  /**
   * Mostrar efecto de shimmer
   * @default true
   */
  shimmer?: boolean;
}

/**
 * Gradient Mesh Background - Fondos animados con múltiples gradientes flotantes
 * Inspirado en diseños de Apple y Stripe
 *
 * @example
 * ```tsx
 * <GradientMesh
 *   colors={{
 *     primary: "rgba(20, 184, 166, 0.4)",
 *     secondary: "rgba(139, 92, 246, 0.3)",
 *     accent: "rgba(6, 182, 212, 0.35)"
 *   }}
 * />
 * ```
 */
export function GradientMesh({
  colors = {
    primary: "rgba(20, 184, 166, 0.4)",
    secondary: "rgba(139, 92, 246, 0.3)",
    accent: "rgba(6, 182, 212, 0.35)",
  },
  speed = 1,
  opacity = 0.3,
  blurIntensity = 96,
  className,
  shimmer = true,
}: GradientMeshProps) {
  const baseDuration = 20 / speed;

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* Blob 1 - Primary (top-left) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "min(40vw, 500px)",
          height: "min(40vw, 500px)",
          background: colors.primary,
          filter: `blur(${blurIntensity}px)`,
          opacity,
        }}
        animate={{
          x: ["25%", "35%", "20%", "25%"],
          y: ["10%", "20%", "5%", "10%"],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: baseDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2 - Secondary (top-right) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "min(35vw, 450px)",
          height: "min(35vw, 450px)",
          background: colors.secondary,
          filter: `blur(${blurIntensity}px)`,
          opacity,
        }}
        animate={{
          x: ["60%", "70%", "55%", "60%"],
          y: ["15%", "5%", "20%", "15%"],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: baseDuration * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 - Accent (bottom-center) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "min(38vw, 480px)",
          height: "min(38vw, 480px)",
          background: colors.accent,
          filter: `blur(${blurIntensity}px)`,
          opacity,
        }}
        animate={{
          x: ["40%", "50%", "35%", "40%"],
          y: ["60%", "70%", "55%", "60%"],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: baseDuration * 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Shimmer effect */}
      {shimmer && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(126, 231, 196, 0.1), transparent)",
            opacity: 0.5,
          }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2,
          }}
        />
      )}

      {/* Noise texture overlay para profundidad */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

/**
 * Gradient Orb - Un solo orb/blob animado
 * Útil para efectos decorativos específicos
 */
export function GradientOrb({
  color = "rgba(20, 184, 166, 0.3)",
  size = "400px",
  blur = 80,
  position = { x: "50%", y: "50%" },
  animate = true,
  className,
}: {
  color?: string;
  size?: string;
  blur?: number;
  position?: { x: string; y: string };
  animate?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("absolute rounded-full pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        background: color,
        filter: `blur(${blur}px)`,
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
      animate={
        animate
          ? {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }
          : undefined
      }
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
