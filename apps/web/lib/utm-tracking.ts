"use client";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_KEY = "brisa:last-utm";

const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(params: UtmParams | null | undefined): UtmParams | null {
  if (!params) {
    return null;
  }

  const normalizedEntries = UTM_KEYS.map((key) => {
    const value = sanitize(params[key]);
    return value ? [key, value] : null;
  }).filter(Boolean) as Array<[keyof UtmParams, string]>;

  if (normalizedEntries.length === 0) {
    return null;
  }

  return Object.fromEntries(normalizedEntries) as UtmParams;
}

export function extractUtmFromSearch(search: string): UtmParams | null {
  if (!search) {
    return null;
  }

  const params = new URLSearchParams(search);
  const collected: UtmParams = {};

  for (const key of UTM_KEYS) {
    const value = sanitize(params.get(`utm_${key}`));
    if (value) {
      collected[key] = value;
    }
  }

  return normalize(collected);
}

export function hasUtm(
  params: UtmParams | null | undefined,
): params is UtmParams {
  return Boolean(params && Object.keys(params).length > 0);
}

export function loadStoredUtm(
  storage: StorageLike | null = getStorage(),
): UtmParams | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as UtmParams | null;
    return normalize(parsed);
  } catch {
    storage.removeItem?.(STORAGE_KEY);
    return null;
  }
}

export function storeUtm(
  params: UtmParams | null | undefined,
  storage: StorageLike | null = getStorage(),
): void {
  if (!storage) {
    return;
  }

  const normalized = normalize(params);

  if (!normalized) {
    storage.removeItem?.(STORAGE_KEY);
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // el almacenamiento puede estar lleno o no disponible; ignorar sin interrumpir
  }
}

export function resolveAndStoreUtm(search: string): UtmParams | null {
  const fromSearch = extractUtmFromSearch(search);

  if (hasUtm(fromSearch)) {
    storeUtm(fromSearch);
    return fromSearch;
  }

  const stored = loadStoredUtm();
  return stored;
}
