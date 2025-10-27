"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Variantes de animación predefinidas
 */
export const scrollVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 1.2 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },
} as const satisfies Record<string, Variants>;

export interface ScrollRevealProps {
  /**
   * Contenido a animar
   */
  children: React.ReactNode;
  /**
   * Variante de animación a usar
   * @default "fadeUp"
   */
  variant?: keyof typeof scrollVariants;
  /**
   * Delay antes de iniciar la animación (en segundos)
   * @default 0
   */
  delay?: number;
  /**
   * Duración de la animación (en segundos)
   * @default 0.6
   */
  duration?: number;
  /**
   * Margen del viewport para activar la animación
   * Ej: "-100px" activa la animación 100px antes de que el elemento entre al viewport
   * @default "-100px"
   */
  viewportMargin?: string;
  /**
   * Si true, la animación solo se ejecuta una vez
   * @default true
   */
  once?: boolean;
  /**
   * Cantidad de veces que debe ser visible (0-1)
   * @default 0.3
   */
  amount?: number;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Componente de scroll reveal con múltiples variantes de animación
 * Usa Framer Motion para animar elementos cuando entran al viewport
 *
 * @example
 * ```tsx
 * <ScrollReveal variant="fadeUp">
 *   <h2>Título que aparece desde abajo</h2>
 * </ScrollReveal>
 *
 * <ScrollReveal variant="stagger">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </ScrollReveal>
 * ```
 */
export function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  viewportMargin = "-100px",
  once = true,
  amount = 0.3,
  className,
}: ScrollRevealProps) {
  const variants = scrollVariants[variant];

  // Override timing si se especifica custom
  const visibleConfig =
    variants.visible && typeof variants.visible === "object"
      ? variants.visible
      : {};
  const baseTransition =
    "transition" in visibleConfig &&
    typeof visibleConfig.transition === "object"
      ? visibleConfig.transition
      : {};

  const customVariants: Variants = {
    hidden: variants.hidden,
    visible: {
      ...visibleConfig,
      transition: {
        ...baseTransition,
        delay,
        duration,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin, amount }}
      variants={customVariants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Componente para animar listas con efecto stagger (cascada)
 *
 * @example
 * ```tsx
 * <StaggerContainer staggerDelay={0.1}>
 *   <StaggerItem><Card /></StaggerItem>
 *   <StaggerItem><Card /></StaggerItem>
 *   <StaggerItem><Card /></StaggerItem>
 * </StaggerContainer>
 * ```
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  delayChildren = 0.2,
  className,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
}) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px", amount: 0.2 }}
      variants={containerVariants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item individual en un StaggerContainer
 */
export function StaggerItem({
  children,
  className,
  variant = "fadeUp",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof scrollVariants;
}) {
  const itemVariants = scrollVariants[variant];

  return (
    <motion.div variants={itemVariants} className={cn(className)}>
      {children}
    </motion.div>
  );
}
