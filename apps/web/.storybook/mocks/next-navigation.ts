import { useMemo } from "react";

export function usePathname() {
  if (typeof window === "undefined") {
    return "/";
  }
  return window.location.pathname || "/";
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    prefetch: async () => {},
    back: () => {},
    forward: () => {},
  };
}

export function useSearchParams() {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }, [typeof window === "undefined" ? "" : window.location.search]);
}

export function redirect(_url: string) {
  // No-op in Storybook
}

export function notFound() {
  throw new Error("notFound() se llamó dentro de Storybook.");
}
