import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility para combinar clases de Tailwind CSS
 * Previene conflictos y merge intelligent classes
 *
 * @example
 * cn("px-4 py-2", "px-6") // => "py-2 px-6"
 * cn("bg-red-500", condition && "bg-blue-500") // => "bg-blue-500" si condition es true
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
