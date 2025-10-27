"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

export interface TestimonialCardProps {
  /**
   * Cita o testimonio
   */
  quote: string;
  /**
   * Nombre del autor
   */
  author: string;
  /**
   * Rol o título del autor
   */
  role?: string;
  /**
   * Avatar del autor (URL)
   */
  avatar?: string;
  /**
   * Calificación en estrellas (1-5)
   */
  rating?: number;
  /**
   * Empresa u organización
   */
  company?: string;
  /**
   * Variante visual
   */
  variant?: "default" | "glass" | "elevated";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Card de testimonio con animaciones y efectos visuales
 */
export function TestimonialCard({
  quote,
  author,
  role,
  avatar,
  rating,
  company,
  variant = "glass",
  className,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={className}
    >
      <Card
        variant={variant}
        className="relative h-full p-6 sm:p-8 flex flex-col gap-6"
      >
        {/* Icono de comillas */}
        <div className="absolute top-6 right-6 opacity-10">
          <Quote className="w-16 h-16 text-brisa-400" />
        </div>

        {/* Rating (si existe) */}
        {rating && (
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < rating
                    ? "fill-brisa-400 text-brisa-400"
                    : "text-brisa-700",
                )}
              />
            ))}
          </div>
        )}

        {/* Quote */}
        <blockquote className="relative z-10 text-base sm:text-lg text-brisa-100 leading-relaxed flex-1">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Author info */}
        <div className="flex items-center gap-4 relative z-10">
          {avatar ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-brisa-700/30">
              <Image src={avatar} alt={author} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-brisa-700/30 flex items-center justify-center">
              <span className="text-lg font-semibold text-brisa-400">
                {author.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1">
            <div className="font-semibold text-brisa-50">{author}</div>
            {role && (
              <div className="text-sm text-brisa-400">
                {role}
                {company && ` · ${company}`}
              </div>
            )}
          </div>
        </div>

        {/* Efecto de brillo al hover */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(126, 231, 196, 0.05), transparent 70%)",
          }}
          whileHover={{ opacity: 1 }}
        />
      </Card>
    </motion.div>
  );
}

export interface TestimonialGridProps {
  testimonials: TestimonialCardProps[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Grid de testimonios con animación escalonada
 */
export function TestimonialGrid({
  testimonials,
  columns = 3,
  className,
}: TestimonialGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {testimonials.map((testimonial, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: idx * 0.1 }}
          viewport={{ once: true }}
        >
          <TestimonialCard {...testimonial} />
        </motion.div>
      ))}
    </div>
  );
}
