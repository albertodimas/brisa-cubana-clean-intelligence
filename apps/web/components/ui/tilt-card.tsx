"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";

export interface TiltCardProps {
  /**
   * Contenido de la card
   */
  children: React.ReactNode;
  /**
   * Ángulo máximo de inclinación en grados
   * @default 10
   */
  maxTilt?: number;
  /**
   * Escala al hacer hover
   * @default 1.02
   */
  scale?: number;
  /**
   * Habilitar efecto glow al hover
   * @default true
   */
  glowEffect?: boolean;
  /**
   * Color del glow
   * @default "rgba(126, 231, 196, 0.3)"
   */
  glowColor?: string;
  /**
   * Clases adicionales
   */
  className?: string;
  /**
   * Velocidad de la transición (0-1, donde 1 es instantáneo)
   * @default 0.1
   */
  springStiffness?: number;
}

/**
 * Card con efecto 3D tilt que sigue el movimiento del mouse
 * Inspirado en diseños premium de Figma, Linear, y Apple
 *
 * @example
 * ```tsx
 * <TiltCard maxTilt={15} glowEffect>
 *   <CardHeader>
 *     <CardTitle>Título</CardTitle>
 *   </CardHeader>
 *   <CardContent>Contenido...</CardContent>
 * </TiltCard>
 * ```
 */
export function TiltCard({
  children,
  maxTilt = 10,
  scale = 1.02,
  glowEffect = true,
  glowColor = "rgba(126, 231, 196, 0.3)",
  className,
  springStiffness = 1,
}: TiltCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Motion values para tracking del mouse
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Configuración de spring para suavidad
  const springConfig = {
    stiffness: 150 * springStiffness,
    damping: 15 + springStiffness * 5,
  };

  // Transformaciones de rotación
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]),
    springConfig,
  );

  // Transformación de escala
  const cardScale = useSpring(1, springConfig);

  // Handler del movimiento del mouse
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    cardScale.set(scale);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    cardScale.set(1);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={cn("relative", className)}
      style={{
        rotateX,
        rotateY,
        scale: cardScale,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow effect */}
      {glowEffect && (
        <motion.div
          className="absolute -inset-1 rounded-xl opacity-0 transition-opacity duration-300 -z-10 blur-xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`,
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}

      {/* Contenido con transform 3D */}
      <div style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.div>
  );
}

/**
 * Card con efecto de hover lift (elevación simple sin tilt)
 * Más performante para casos donde no se necesita el efecto 3D completo
 */
export function HoverLiftCard({
  children,
  liftAmount = -8,
  glowEffect = true,
  glowColor = "rgba(126, 231, 196, 0.2)",
  className,
}: {
  children: React.ReactNode;
  liftAmount?: number;
  glowEffect?: boolean;
  glowColor?: string;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("relative", className)}
      whileHover={{
        y: liftAmount,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      initial={{ y: 0 }}
    >
      {/* Glow effect */}
      {glowEffect && (
        <motion.div
          className="absolute -inset-1 rounded-xl opacity-0 -z-10 blur-lg"
          style={{
            background: glowColor,
          }}
          whileHover={{
            opacity: 1,
            transition: { duration: 0.2 },
          }}
        />
      )}

      {children}
    </motion.div>
  );
}

/**
 * Card con magnetic effect (atrae el cursor)
 * Efecto sutil y premium
 */
export function MagneticCard({
  children,
  strength = 20,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = event.clientX - centerX;
    const distanceY = event.clientY - centerY;

    x.set(distanceX * (strength / 100));
    y.set(distanceY * (strength / 100));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
