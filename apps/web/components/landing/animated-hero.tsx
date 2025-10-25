"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface AnimatedHeroProps {
  /**
   * Subtítulo o categoría
   */
  subtitle?: string;
  /**
   * Título principal
   */
  title: string | React.ReactNode;
  /**
   * Descripción o pitch
   */
  description: string | React.ReactNode;
  /**
   * Acciones/CTAs del hero
   */
  actions?: React.ReactNode;
  /**
   * Contenido visual del lado derecho (imagen, video, etc.)
   */
  visual?: React.ReactNode;
  /**
   * Clases adicionales para el contenedor
   */
  className?: string;
  /**
   * Habilita gradiente animado de fondo
   */
  animatedGradient?: boolean;
}

/**
 * Hero Section moderno con gradiente animado y efectos de entrada
 */
export function AnimatedHero({
  subtitle,
  title,
  description,
  actions,
  visual,
  className,
  animatedGradient = true,
}: AnimatedHeroProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Gradiente animado de fondo */}
      {animatedGradient && (
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-brisa-900/30 via-brisa-950 to-brisa-950"
            animate={{
              background: [
                "linear-gradient(135deg, rgba(13, 61, 56, 0.3) 0%, rgba(5, 11, 15, 1) 50%, rgba(5, 11, 15, 1) 100%)",
                "linear-gradient(135deg, rgba(5, 11, 15, 1) 0%, rgba(13, 61, 56, 0.3) 50%, rgba(5, 11, 15, 1) 100%)",
                "linear-gradient(135deg, rgba(5, 11, 15, 1) 0%, rgba(5, 11, 15, 1) 50%, rgba(13, 61, 56, 0.3) 100%)",
                "linear-gradient(135deg, rgba(13, 61, 56, 0.3) 0%, rgba(5, 11, 15, 1) 50%, rgba(5, 11, 15, 1) 100%)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Efecto de shimmer */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(126, 231, 196, 0.1), transparent)",
            }}
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Contenido izquierdo */}
          <div className="flex flex-col gap-6 lg:gap-8">
            {subtitle && (
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xs tracking-[0.45em] uppercase text-brisa-400 font-semibold"
              >
                {subtitle}
              </motion.span>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {typeof title === "string" ? (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brisa-50">
                  {title}
                </h1>
              ) : (
                title
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {typeof description === "string" ? (
                <p className="text-lg sm:text-xl lg:text-2xl text-brisa-200 max-w-2xl">
                  {description}
                </p>
              ) : (
                description
              )}
            </motion.div>

            {actions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                {actions}
              </motion.div>
            )}
          </div>

          {/* Visual derecho */}
          {visual && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative"
            >
              {visual}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
