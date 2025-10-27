"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface PageTransitionProps {
  /**
   * Contenido de la página
   */
  children: React.ReactNode;
  /**
   * Tipo de transición
   */
  variant?: "fade" | "slide" | "scale" | "blur";
  /**
   * Duración de la transición en segundos
   */
  duration?: number;
  /**
   * Clases adicionales
   */
  className?: string;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(10px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(10px)" },
  },
};

/**
 * Wrapper de transiciones para páginas
 */
export function PageTransition({
  children,
  variant = "fade",
  duration = 0.3,
  className,
}: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={variants[variant].initial}
        animate={variants[variant].animate}
        exit={variants[variant].exit}
        transition={{ duration }}
        className={cn("", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export interface FadeInProps {
  /**
   * Contenido a animar
   */
  children: React.ReactNode;
  /**
   * Delay antes de iniciar la animación
   */
  delay?: number;
  /**
   * Duración de la animación
   */
  duration?: number;
  /**
   * Dirección del slide (si aplica)
   */
  direction?: "up" | "down" | "left" | "right";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Componente de fade-in genérico con opciones de dirección
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction,
  className,
}: FadeInProps) {
  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  const initial = direction
    ? { opacity: 0, ...directionOffset[direction] }
    : { opacity: 0 };

  const animate = direction ? { opacity: 1, y: 0, x: 0 } : { opacity: 1 };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerContainerProps {
  /**
   * Contenido a animar
   */
  children: React.ReactNode;
  /**
   * Delay entre cada hijo
   */
  staggerDelay?: number;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Contenedor que anima sus hijos de forma escalonada
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
