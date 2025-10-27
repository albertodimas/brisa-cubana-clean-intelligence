"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BeforeAfterSliderProps {
  /**
   * URL de la imagen "antes"
   */
  beforeImage: string;
  /**
   * Alt text para la imagen "antes"
   */
  beforeAlt: string;
  /**
   * URL de la imagen "después"
   */
  afterImage: string;
  /**
   * Alt text para la imagen "después"
   */
  afterAlt: string;
  /**
   * Posición inicial del slider (0-100)
   */
  initialPosition?: number;
  /**
   * Etiquetas personalizadas
   */
  beforeLabel?: string;
  afterLabel?: string;
  /**
   * Aspect ratio de las imágenes
   */
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/2";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Slider interactivo para comparar imágenes antes/después
 */
export function BeforeAfterSlider({
  beforeImage,
  beforeAlt,
  afterImage,
  afterAlt,
  initialPosition = 50,
  beforeLabel = "Antes",
  afterLabel = "Después",
  aspectRatio = "16/9",
  className,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = React.useState(initialPosition);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/2": "aspect-[3/2]",
  };

  const handleMove = React.useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    setSliderPosition(clampedPercentage);
  }, []);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  React.useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl select-none",
        aspectRatioClasses[aspectRatio],
        className,
      )}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Imagen "Después" (fondo completo) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          priority
        />
        {/* Etiqueta "Después" */}
        <div className="absolute top-4 right-4 bg-brisa-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-xs font-semibold text-white">{afterLabel}</span>
        </div>
      </div>

      {/* Imagen "Antes" (recortada por el slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          priority
        />
        {/* Etiqueta "Antes" */}
        <div className="absolute top-4 left-4 bg-brisa-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-xs font-semibold text-white">
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* Línea divisoria y control del slider */}
      <div
        className="absolute inset-y-0 cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        {/* Línea vertical */}
        <div className="absolute inset-y-0 w-0.5 bg-white shadow-lg -translate-x-1/2" />

        {/* Control circular */}
        <motion.div
          className={cn(
            "absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
            "w-12 h-12 rounded-full bg-white shadow-xl",
            "flex items-center justify-center",
            "transition-transform duration-150",
            isDragging && "scale-110",
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MoveHorizontal className="w-6 h-6 text-brisa-700" />
        </motion.div>
      </div>
    </div>
  );
}
