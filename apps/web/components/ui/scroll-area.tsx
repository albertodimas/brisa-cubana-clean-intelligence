"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Orientación del scroll
   */
  orientation?: "vertical" | "horizontal" | "both";
  /**
   * Altura máxima
   */
  maxHeight?: string | number;
}

/**
 * Área de scroll personalizada
 * Componente simple, podrías usar @radix-ui/react-scroll-area para más características
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    { className, orientation = "vertical", maxHeight, children, ...props },
    ref,
  ) => {
    const overflowClasses = {
      vertical: "overflow-y-auto overflow-x-hidden",
      horizontal: "overflow-x-auto overflow-y-hidden",
      both: "overflow-auto",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          overflowClasses[orientation],
          "scrollbar-thin scrollbar-thumb-brisa-700 scrollbar-track-brisa-900",
          className,
        )}
        style={{
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";
