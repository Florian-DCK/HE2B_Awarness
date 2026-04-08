import { describe, it, expect } from "vitest";
import {
  getDailyTokenFromPathname,
  getDailyPrefixFromPathname,
} from "../daily-token-client";

describe("getDailyTokenFromPathname", () => {
  it("retourne toujours une chaîne vide (token supprimé)", () => {
    expect(getDailyTokenFromPathname("/abc12345/fr")).toBe("");
    expect(getDailyTokenFromPathname("/fr")).toBe("");
    expect(getDailyTokenFromPathname("/fr/game")).toBe("");
    expect(getDailyTokenFromPathname("")).toBe("");
    expect(getDailyTokenFromPathname("/")).toBe("");
  });
});

describe("getDailyPrefixFromPathname", () => {
  it("retourne toujours une chaîne vide — plus de préfixe dynamique", () => {
    expect(getDailyPrefixFromPathname("/abc12345/fr")).toBe("");
    expect(getDailyPrefixFromPathname("/fr")).toBe("");
    expect(getDailyPrefixFromPathname("/fr/game?skin=diplome")).toBe("");
    expect(getDailyPrefixFromPathname("")).toBe("");
  });

  it("la navigation vers /game utilise /${locale}/game (pas de préfixe)", () => {
    const locale = "fr";
    const prefix = getDailyPrefixFromPathname("/fr");
    const gameUrl = `${prefix}/${locale}/game`;
    expect(gameUrl).toBe("/fr/game");
  });
});
