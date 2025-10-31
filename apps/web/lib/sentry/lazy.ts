type SentryModule = typeof import("@sentry/nextjs");

let loadPromise: Promise<SentryModule> | null = null;
let cachedModule: SentryModule | null = null;

const importSentry = async () => {
  if (!loadPromise) {
    loadPromise = import("@sentry/nextjs")
      .then((mod) => {
        cachedModule = mod;
        return mod;
      })
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
  }

  return loadPromise;
};

/**
 * Carga perezosamente el SDK del lado del cliente. Se reutiliza el mismo módulo
 * para evitar imports duplicados y mantener el bundle fuera del chunk principal.
 */
export async function loadSentry(): Promise<SentryModule> {
  if (cachedModule) {
    return cachedModule;
  }
  return importSentry();
}

/**
 * Devuelve el módulo ya resuelto si fue cargado previamente; útil para
 * comprobaciones sincronas sin forzar un nuevo import.
 */
export function getSentryIfLoaded(): SentryModule | null {
  return cachedModule;
}
