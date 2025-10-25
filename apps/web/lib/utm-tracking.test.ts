import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  extractUtmFromSearch,
  hasUtm,
  loadStoredUtm,
  resolveAndStoreUtm,
  storeUtm,
  type UtmParams,
} from "./utm-tracking";

describe("utm-tracking", () => {
  const storage = {
    getItem: vi.fn<(key: string) => string | null>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    removeItem: vi.fn<(key: string) => void>(),
  };

  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
    storage.removeItem.mockReset();
  });

  it("extrae parámetros UTM válidos desde la query", () => {
    const params = extractUtmFromSearch(
      "?utm_source=linkedin&utm_medium=paid&utm_campaign=lanzamiento",
    );
    expect(params).toEqual({
      source: "linkedin",
      medium: "paid",
      campaign: "lanzamiento",
    });
  });

  it("ignora parámetros vacíos o ruido", () => {
    const params = extractUtmFromSearch(
      "?utm_source=&utm_medium=  &foo=bar&utm_term=keyword",
    );
    expect(params).toEqual({
      term: "keyword",
    });
  });

  it("identifica cuándo un objeto contiene UTM", () => {
    expect(hasUtm(null)).toBe(false);
    expect(hasUtm({})).toBe(false);
    expect(hasUtm({ source: "linkedIn" })).toBe(true);
  });

  it("persiste y recupera parámetros desde storage", () => {
    const utm: UtmParams = { source: "email", campaign: "newsletter" };
    storeUtm(utm, storage);
    expect(storage.setItem).toHaveBeenCalledWith(
      "brisa:last-utm",
      JSON.stringify(utm),
    );

    storage.getItem.mockReturnValueOnce(JSON.stringify(utm));
    const loaded = loadStoredUtm(storage);
    expect(loaded).toEqual(utm);
  });

  it("elimina storage cuando la data es inválida", () => {
    storeUtm(null, storage);
    expect(storage.removeItem).toHaveBeenCalledWith("brisa:last-utm");

    storage.getItem.mockReturnValueOnce("not-json");
    const loaded = loadStoredUtm(storage);
    expect(loaded).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith("brisa:last-utm");
  });

  it("precede la query a lo almacenado", () => {
    storage.getItem.mockReturnValueOnce(
      JSON.stringify({ source: "email", medium: "newsletter" }),
    );

    const resolved = resolveAndStoreUtm(
      "?utm_source=tiktok&utm_medium=paid",
      storage,
    );
    expect(resolved).toEqual({ source: "tiktok", medium: "paid" });
    expect(storage.setItem).toHaveBeenCalledWith(
      "brisa:last-utm",
      JSON.stringify({ source: "tiktok", medium: "paid" }),
    );
  });
});
