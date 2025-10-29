"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

type BrandLogoProps = {
  href?: Route;
  showWordmark?: boolean;
  invert?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  contentClassName?: string;
};

const ICON_SIZES: Record<NonNullable<BrandLogoProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

export function BrandLogo({
  href = "/",
  showWordmark = true,
  invert = false,
  size = "md",
  className,
  contentClassName,
}: BrandLogoProps) {
  const iconSize = ICON_SIZES[size];
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2 py-1 transition-colors",
        invert ? "text-white" : "text-gray-900 dark:text-white",
        contentClassName,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#3b82f6] shadow-lg shadow-[#1e40af33]",
          {
            "h-8 w-8": size === "sm",
            "h-10 w-10": size === "md",
            "h-12 w-12": size === "lg",
          },
        )}
      >
        <Image
          src="/branding/logo-icon.svg"
          alt="Brisa Cubana icono"
          width={iconSize}
          height={iconSize}
          className="h-6 w-6 sm:h-7 sm:w-7"
          priority={size === "lg"}
        />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "flex flex-col leading-none",
            invert ? "text-white" : "text-gray-900 dark:text-white",
          )}
        >
          <span className="font-semibold tracking-tight">Brisa Cubana</span>
          <span className="text-[11px] uppercase tracking-[0.36em] text-gray-500 dark:text-brisa-300">
            Clean Intelligence
          </span>
        </span>
      ) : null}
    </span>
  );

  return (
    <Link
      href={href}
      aria-label="Brisa Cubana Clean Intelligence"
      className={cn("inline-flex items-center", className)}
    >
      {content}
    </Link>
  );
}
