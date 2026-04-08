import { describe, it, expect } from "vitest";
import { getBrusselsDateString, DAILY_PLAY_LIMIT } from "../daily-token";

describe("getBrusselsDateString", () => {
  it("retourne le format YYYY-MM-DD", () => {
    const result = getBrusselsDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("retourne la date correcte pour un timestamp UTC connu (après-midi)", () => {
    // 2026-04-08T12:00:00Z = 14h00 Brussels (CEST UTC+2) → 2026-04-08
    const date = new Date("2026-04-08T12:00:00Z");
    expect(getBrusselsDateString(date)).toBe("2026-04-08");
  });

  it("gère correctement le changement de jour Brussels (UTC+1 en hiver)", () => {
    // 2026-01-15T23:30:00Z = 00h30 Brussels (CET UTC+1) → 2026-01-16
    const date = new Date("2026-01-15T23:30:00Z");
    expect(getBrusselsDateString(date)).toBe("2026-01-16");
  });

  it("gère correctement le changement de jour Brussels (UTC+2 en été)", () => {
    // 2026-07-20T22:30:00Z = 00h30 Brussels (CEST UTC+2) → 2026-07-21
    const date = new Date("2026-07-20T22:30:00Z");
    expect(getBrusselsDateString(date)).toBe("2026-07-21");
  });

  it("ne change pas de jour trop tôt (22h59 UTC en été = 00h59 Brussels)", () => {
    // 2026-07-20T21:59:00Z = 23h59 Brussels (CEST) → encore 2026-07-20
    const date = new Date("2026-07-20T21:59:00Z");
    expect(getBrusselsDateString(date)).toBe("2026-07-20");
  });

  it("deux appels consécutifs retournent la même date", () => {
    const a = getBrusselsDateString();
    const b = getBrusselsDateString();
    expect(a).toBe(b);
  });
});

describe("DAILY_PLAY_LIMIT", () => {
  it("vaut 3", () => {
    expect(DAILY_PLAY_LIMIT).toBe(3);
  });

  it("est un entier positif", () => {
    expect(Number.isInteger(DAILY_PLAY_LIMIT)).toBe(true);
    expect(DAILY_PLAY_LIMIT).toBeGreaterThan(0);
  });
});
