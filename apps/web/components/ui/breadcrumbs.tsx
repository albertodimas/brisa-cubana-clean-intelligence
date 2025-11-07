import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  /**
   * Etiqueta del breadcrumb
   */
  label: string;
  /**
   * URL del breadcrumb
   */
  href?: Route | string;
  /**
   * Icono personalizado
   */
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  /**
   * Items del breadcrumb
   */
  items: BreadcrumbItem[];
  /**
   * Separador personalizado
   */
  separator?: React.ReactNode;
  /**
   * Mostrar icono de home al inicio
   */
  showHome?: boolean;
  /**
   * URL del home
   */
  homeHref?: Route | string;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Breadcrumbs component para navegación jerárquica
 */
export function Breadcrumbs({
  items,
  separator = <ChevronRight className="w-4 h-4" />,
  showHome = true,
  homeHref = "/",
  className,
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-2 flex-wrap">
        {/* Home link */}
        {showHome && (
          <>
            <li>
              <Link
                href={(homeHref || "/") as Route}
                className={cn(
                  "flex items-center text-sm text-brisa-400 hover:text-brisa-200",
                  "transition-colors duration-200",
                )}
              >
                <Home className="w-4 h-4" />
                <span className="sr-only">Inicio</span>
              </Link>
            </li>
            {items.length > 0 && (
              <li className="text-brisa-600" aria-hidden="true">
                {separator}
              </li>
            )}
          </>
        )}

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href as Route}
                    className={cn(
                      "flex items-center gap-1.5 text-sm text-brisa-400 hover:text-brisa-200",
                      "transition-colors duration-200",
                    )}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-sm",
                      isLast ? "text-brisa-50 font-medium" : "text-brisa-400",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>

              {!isLast && (
                <li className="text-brisa-600" aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
