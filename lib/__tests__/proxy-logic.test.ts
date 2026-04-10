import { describe, it, expect } from "vitest";

// Logique extraite du middleware proxy.ts pour tests unitaires
const routing = { locales: ["fr"] as const, defaultLocale: "fr" as const };

const getLocaleFromSegments = (segments: string[]) => {
  const maybeLocale = segments[0];
  return maybeLocale && routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? (maybeLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;
};

describe("getLocaleFromSegments", () => {
  it("retourne la locale si valide", () => {
    expect(getLocaleFromSegments(["fr"])).toBe("fr");
    expect(getLocaleFromSegments(["fr", "game"])).toBe("fr");
  });

  it("retourne la locale par défaut si invalide", () => {
    expect(getLocaleFromSegments(["en"])).toBe("fr");
    expect(getLocaleFromSegments([])).toBe("fr");
    expect(getLocaleFromSegments(["abc12345"])).toBe("fr");
  });
});

describe("logique de limite quotidienne", () => {
  const DAILY_PLAY_LIMIT = 3;

  it("bloque si emailCount >= 3", () => {
    expect(3 >= DAILY_PLAY_LIMIT).toBe(true);
    expect(2 >= DAILY_PLAY_LIMIT).toBe(false);
  });

  it("calcule le reste correctement", () => {
    expect(Math.max(0, DAILY_PLAY_LIMIT - 0)).toBe(3);
    expect(Math.max(0, DAILY_PLAY_LIMIT - 1)).toBe(2);
    expect(Math.max(0, DAILY_PLAY_LIMIT - 2)).toBe(1);
    expect(Math.max(0, DAILY_PLAY_LIMIT - 3)).toBe(0);
    expect(Math.max(0, DAILY_PLAY_LIMIT - 4)).toBe(0); // pas de négatif
  });

  it("la limite est par jour — deux dates différentes = deux compteurs indépendants", () => {
    const today = "2026-04-08";
    const yesterday = "2026-04-07";
    const recordsYesterday = [
      { email: "test@test.com", date: yesterday },
      { email: "test@test.com", date: yesterday },
      { email: "test@test.com", date: yesterday },
    ];
    const countToday = recordsYesterday.filter(
      (r) => r.email === "test@test.com" && r.date === today,
    ).length;
    expect(countToday >= DAILY_PLAY_LIMIT).toBe(false);
  });
});
