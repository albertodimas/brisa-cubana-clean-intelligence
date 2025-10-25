"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TimelineItem {
  /**
   * Título del paso
   */
  title: string;
  /**
   * Descripción del paso
   */
  description: string;
  /**
   * Icono del paso
   */
  icon?: LucideIcon;
  /**
   * Contenido adicional (imagen, stats, etc.)
   */
  content?: React.ReactNode;
}

export interface AnimatedTimelineProps {
  /**
   * Lista de pasos del timeline
   */
  items: TimelineItem[];
  /**
   * Orientación del timeline
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Timeline animado que revela los pasos al hacer scroll
 */
export function AnimatedTimeline({
  items,
  orientation = "vertical",
  className,
}: AnimatedTimelineProps) {
  if (orientation === "horizontal") {
    return (
      <div className={cn("relative py-12", className)}>
        {/* Línea horizontal de fondo */}
        <div className="absolute top-20 left-0 right-0 h-0.5 bg-brisa-800/30" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {items.map((item, idx) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex flex-col items-center text-center"
              >
                {/* Icono circular */}
                <motion.div
                  className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-brisa-700/30 border-4 border-brisa-900 mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {Icon && <Icon className="w-8 h-8 text-brisa-400" />}
                  {!Icon && (
                    <span className="text-2xl font-bold text-brisa-400">
                      {idx + 1}
                    </span>
                  )}

                  {/* Pulso animado */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-brisa-500/20"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: idx * 0.3,
                    }}
                  />
                </motion.div>

                {/* Contenido */}
                <h3 className="text-xl font-semibold text-brisa-50 mb-2">
                  {item.title}
                </h3>
                <p className="text-brisa-300 text-sm max-w-xs">
                  {item.description}
                </p>

                {item.content && (
                  <div className="mt-4 w-full">{item.content}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn("relative", className)}>
      {/* Línea vertical de fondo */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-brisa-800/30" />

      <div className="space-y-12">
        {items.map((item, idx) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative flex gap-6 items-start"
            >
              {/* Icono circular */}
              <motion.div
                className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-brisa-700/30 border-4 border-brisa-900 flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {Icon && <Icon className="w-8 h-8 text-brisa-400" />}
                {!Icon && (
                  <span className="text-2xl font-bold text-brisa-400">
                    {idx + 1}
                  </span>
                )}

                {/* Pulso animado */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-brisa-500/20"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: idx * 0.3,
                  }}
                />
              </motion.div>

              {/* Contenido */}
              <div className="flex-1 pt-1">
                <h3 className="text-2xl font-semibold text-brisa-50 mb-2">
                  {item.title}
                </h3>
                <p className="text-brisa-300 text-base leading-relaxed mb-4">
                  {item.description}
                </p>

                {item.content && <div className="mt-4">{item.content}</div>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
