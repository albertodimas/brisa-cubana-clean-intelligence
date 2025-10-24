import { beforeEach, describe, expect, it } from "vitest";

import {
  extractUtmFromSearch,
  hasUtm,
  loadStoredUtm,
  resolveAndStoreUtm,
  storeUtm,
  type UtmParams,
} from "./utm-tracking";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("utm-tracking", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("extrae parámetros UTM del querystring", () => {
    const utm = extractUtmFromSearch(
      "?utm_source=linkedin&utm_medium=paid&utm_campaign=launch&utm_content=ad&utm_term=cleaning",
    );

    expect(utm).toEqual({
      source: "linkedin",
      medium: "paid",
      campaign: "launch",
      content: "ad",
      term: "cleaning",
    });
  });

  it("ignora querystrings sin parámetros UTM", () => {
    expect(extractUtmFromSearch("?foo=bar")).toBeNull();
    expect(hasUtm(null)).toBe(false);
  });

  it("persiste y recupera parámetros UTM", () => {
    const storage = new MemoryStorage();
    const params: UtmParams = { source: "instagram", medium: "organic" };

    storeUtm(params, storage);

    expect(loadStoredUtm(storage)).toEqual({
      source: "instagram",
      medium: "organic",
    });
  });

  it("limpia almacenamiento cuando los datos son inválidos", () => {
    const storage = new MemoryStorage();
    storage.setItem("brisa:last-utm", "not-json");

    expect(loadStoredUtm(storage)).toBeNull();
    expect(storage.length).toBe(0);
  });

  it("prefiere los parámetros de la URL sobre el almacenamiento", () => {
    storeUtm({ source: "email", medium: "newsletter" });

    const utm = resolveAndStoreUtm(
      "?utm_source=google&utm_medium=cpc&utm_campaign=winter",
    );

    expect(utm).toEqual({
      source: "google",
      medium: "cpc",
      campaign: "winter",
    });
    expect(loadStoredUtm()).toEqual({
      source: "google",
      medium: "cpc",
      campaign: "winter",
    });
  });
});
