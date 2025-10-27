"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PricingCard3DProps {
  /**
   * Nombre del plan
   */
  name: string;
  /**
   * Descripción breve
   */
  description: string;
  /**
   * Precio
   */
  price: string;
  /**
   * Sufijo del precio (ej: "/mes", "/servicio")
   */
  priceSuffix?: string;
  /**
   * Lista de características
   */
  features: string[];
  /**
   * Call to action
   */
  cta?: React.ReactNode;
  /**
   * Si está destacado
   */
  highlighted?: boolean;
  /**
   * Badge adicional (ej: "Más popular", "Mejor valor")
   */
  badge?: string;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Card de pricing con efecto 3D tilt al pasar el mouse
 */
export function PricingCard3D({
  name,
  description,
  price,
  priceSuffix = "/mes",
  features,
  cta,
  highlighted = false,
  badge,
  className,
}: PricingCard3DProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    ["7.5deg", "-7.5deg"],
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    ["-7.5deg", "7.5deg"],
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative", className)}
    >
      <Card
        variant={highlighted ? "elevated" : "default"}
        className={cn(
          "relative h-full flex flex-col p-8 transition-all duration-300",
          highlighted && "ring-2 ring-brisa-500 shadow-2xl shadow-brisa-500/20",
        )}
      >
        {/* Badge superior */}
        {badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant={highlighted ? "default" : "outline"}>{badge}</Badge>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 space-y-2">
          <h3 className="text-2xl font-bold text-brisa-50">{name}</h3>
          <p className="text-sm text-brisa-300">{description}</p>
        </div>

        {/* Precio */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-brisa-50">{price}</span>
            <span className="text-brisa-400">{priceSuffix}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="mb-8 space-y-3 flex-1">
          {features.map((feature, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="flex items-start gap-3 text-sm text-brisa-200"
            >
              <Check className="h-5 w-5 text-brisa-400 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        {cta && <div className="mt-auto">{cta}</div>}

        {/* Efecto de brillo al hover */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(126, 231, 196, 0.1), transparent 50%)",
          }}
          whileHover={{ opacity: 1 }}
        />
      </Card>
    </motion.div>
  );
}
