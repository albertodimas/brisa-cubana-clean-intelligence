import { type HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-brisa-800";

  const variants = {
    text: "rounded h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const variantStyles = variants[variant];

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && {
      height: typeof height === "number" ? `${height}px` : height,
    }),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}
