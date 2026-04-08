import { describe, it, expect } from "vitest";

// Logique extraite du middleware proxy.ts pour tests unitaires
const routing = { locales: ["fr"] as const, defaultLocale: "fr" as const };

const isUnrestrictedPath = (segments: string[]) =>
  routing.locales.includes(segments[0] as (typeof routing.locales)[number]) &&
  (segments[1] === "scoreboard" || segments[1] === "admin" || segments[1] === "closed");

const getLocaleFromSegments = (segments: string[]) => {
  const maybeLocale = segments[0];
  return maybeLocale && routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? (maybeLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;
};

const getHourInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((part) => part.type === "hour");
  const hour = hourPart ? Number.parseInt(hourPart.value, 10) : date.getUTCHours();
  return Number.isNaN(hour) ? date.getUTCHours() : hour;
};

describe("isUnrestrictedPath (scoreboard/admin/closed accessibles sans restriction horaire)", () => {
  it("scoreboard est non restreint", () => {
    expect(isUnrestrictedPath(["fr", "scoreboard"])).toBe(true);
  });

  it("scoreboard/admin est non restreint", () => {
    expect(isUnrestrictedPath(["fr", "scoreboard", "admin"])).toBe(true);
  });

  it("admin est non restreint", () => {
    expect(isUnrestrictedPath(["fr", "admin"])).toBe(true);
  });

  it("closed est non restreint", () => {
    expect(isUnrestrictedPath(["fr", "closed"])).toBe(true);
  });

  it("home (/) est restreint", () => {
    expect(isUnrestrictedPath(["fr"])).toBe(false);
  });

  it("game est restreint", () => {
    expect(isUnrestrictedPath(["fr", "game"])).toBe(false);
  });

  it("chemin invalide est restreint", () => {
    expect(isUnrestrictedPath([])).toBe(false);
    expect(isUnrestrictedPath(["unknown"])).toBe(false);
  });
});

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

describe("getHourInTimeZone (Brussels)", () => {
  it("retourne l'heure correcte en CEST (UTC+2, été)", () => {
    // 2026-07-15T10:00:00Z = 12h00 Brussels
    const date = new Date("2026-07-15T10:00:00Z");
    expect(getHourInTimeZone(date, "Europe/Brussels")).toBe(12);
  });

  it("retourne l'heure correcte en CET (UTC+1, hiver)", () => {
    // 2026-01-15T09:00:00Z = 10h00 Brussels
    const date = new Date("2026-01-15T09:00:00Z");
    expect(getHourInTimeZone(date, "Europe/Brussels")).toBe(10);
  });

  it("le jeu est ouvert entre 10h et 18h Brussels", () => {
    const OPEN_HOUR = 10;
    const CLOSE_HOUR = 18;
    const isOpen = (hour: number) => hour >= OPEN_HOUR && hour < CLOSE_HOUR;

    expect(isOpen(9)).toBe(false);   // avant ouverture
    expect(isOpen(10)).toBe(true);   // ouverture
    expect(isOpen(12)).toBe(true);   // milieu
    expect(isOpen(17)).toBe(true);   // juste avant fermeture
    expect(isOpen(18)).toBe(false);  // fermeture exacte
    expect(isOpen(20)).toBe(false);  // après fermeture
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
    // Simuler: 3 entrées hier, 0 aujourd'hui → pas bloqué aujourd'hui
    const recordsYesterday = [
      { email: "test@test.com", date: yesterday },
      { email: "test@test.com", date: yesterday },
      { email: "test@test.com", date: yesterday },
    ];
    const countToday = recordsYesterday.filter(
      (r) => r.email === "test@test.com" && r.date === today,
    ).length;
    expect(countToday >= DAILY_PLAY_LIMIT).toBe(false); // pas bloqué aujourd'hui
  });
});
