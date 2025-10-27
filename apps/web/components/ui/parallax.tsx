"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/cn";

export interface ParallaxProps {
  /**
   * Contenido a animar
   */
  children: React.ReactNode;
  /**
   * Velocidad del parallax (-1 a 1)
   * - Valores negativos: se mueve hacia arriba más rápido que el scroll
   * - 0: sin parallax
   * - Valores positivos: se mueve hacia abajo más lento que el scroll
   * @default 0.5
   */
  speed?: number;
  /**
   * Rango de inicio del scroll (0-1)
   * @default 0
   */
  startScroll?: number;
  /**
   * Rango de fin del scroll (0-1)
   * @default 1
   */
  endScroll?: number;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Componente Parallax que mueve elementos a diferentes velocidades al hacer scroll
 * Crea profundidad y dinamismo visual
 *
 * @example
 * ```tsx
 * <Parallax speed={0.5}>
 *   <img src="/hero.jpg" alt="Hero" />
 * </Parallax>
 *
 * // Parallax invertido (se mueve más rápido)
 * <Parallax speed={-0.3}>
 *   <div>Background decorativo</div>
 * </Parallax>
 * ```
 */
export function Parallax({
  children,
  speed = 0.5,
  startScroll = 0,
  endScroll = 1,
  className,
}: ParallaxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Transformar el scroll progress a movimiento Y
  const y = useTransform(
    scrollYProgress,
    [startScroll, endScroll],
    [0, speed * 200], // 200px de rango máximo
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/**
 * Parallax para imágenes con optimización
 */
export function ParallaxImage({
  src,
  alt,
  speed = 0.5,
  className,
  priority = false,
  sizes = "100vw",
  width = 1920,
  height = 1080,
}: {
  src: string;
  alt: string;
  speed?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Parallax
      speed={speed}
      className={cn("overflow-hidden relative", className)}
    >
      <Image
        src={src}
        alt={alt}
        priority={priority}
        sizes={sizes}
        width={width}
        height={height}
        className="h-full w-full object-cover"
      />
    </Parallax>
  );
}

/**
 * Parallax Layer - Para crear múltiples capas con diferentes velocidades
 */
export function ParallaxLayer({
  children,
  depth = 1,
  className,
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  // depth 1 = más lento, depth 5 = más rápido
  const speed = depth * 0.2;

  return (
    <Parallax speed={speed} className={className}>
      {children}
    </Parallax>
  );
}

/**
 * Hook personalizado para parallax manual
 */
export function useParallax(speed: number = 0.5): MotionValue<number> {
  const { scrollY } = useScroll();
  return useTransform(scrollY, (latest) => latest * speed);
}
