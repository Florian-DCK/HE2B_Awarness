import { describe, it, expect } from "vitest";

// --- Logique de validation durationSeconds (extraite de app/api/scores/route.ts) ---

const parseDuration = (raw: unknown): number | null => {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
};

// --- Logique de formatage (extraite de app/[locale]/admin/page.tsx) ---

const formatDuration = (seconds: number | null): string => {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s} s`;
  return `${m} min ${s.toString().padStart(2, "0")} s`;
};

// --- Logique de calcul côté client (extraite de app/[locale]/game/page.tsx) ---

const computeDuration = (startTime: number, endTime: number): number | null => {
  if (startTime <= 0) return null;
  return Math.round((endTime - startTime) / 1000);
};

// ===========================================================================

describe("parseDuration (validation API scores)", () => {
  it("accepte un entier positif", () => {
    expect(parseDuration(120)).toBe(120);
  });

  it("arrondit les flottants", () => {
    expect(parseDuration(90.7)).toBe(91);
    expect(parseDuration(90.2)).toBe(90);
  });

  it("rejette null et undefined", () => {
    expect(parseDuration(null)).toBeNull();
    expect(parseDuration(undefined)).toBeNull();
  });

  it("rejette zéro et négatif", () => {
    expect(parseDuration(0)).toBeNull();
    expect(parseDuration(-5)).toBeNull();
  });

  it("rejette NaN et Infinity", () => {
    expect(parseDuration(NaN)).toBeNull();
    expect(parseDuration(Infinity)).toBeNull();
    expect(parseDuration(-Infinity)).toBeNull();
  });

  it("rejette une chaîne non numérique", () => {
    expect(parseDuration("abc")).toBeNull();
  });

  it("accepte une chaîne numérique positive (robustesse JSON)", () => {
    expect(parseDuration("120")).toBe(120);
  });
});

// ===========================================================================

describe("formatDuration (affichage admin)", () => {
  it("affiche '—' pour null", () => {
    expect(formatDuration(null)).toBe("—");
  });

  it("affiche secondes seules si < 60", () => {
    expect(formatDuration(0)).toBe("0 s");
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(59)).toBe("59 s");
  });

  it("affiche minutes et secondes padded pour >= 60", () => {
    expect(formatDuration(60)).toBe("1 min 00 s");
    expect(formatDuration(90)).toBe("1 min 30 s");
    expect(formatDuration(125)).toBe("2 min 05 s");
    expect(formatDuration(154)).toBe("2 min 34 s");
  });

  it("gère des durées longues", () => {
    expect(formatDuration(3600)).toBe("60 min 00 s");
    expect(formatDuration(3661)).toBe("61 min 01 s");
  });

  it("affiche '—' pour NaN", () => {
    expect(formatDuration(NaN)).toBe("—");
  });
});

// ===========================================================================

describe("computeDuration (client game/page.tsx)", () => {
  it("calcule correctement la durée en secondes", () => {
    const start = 1_000_000;
    const end = start + 154_000; // 154 secondes
    expect(computeDuration(start, end)).toBe(154);
  });

  it("arrondit à la seconde la plus proche", () => {
    const start = 1_000_000;
    expect(computeDuration(start, start + 1_700)).toBe(2);
    expect(computeDuration(start, start + 1_400)).toBe(1);
  });

  it("retourne null si startTime vaut 0 (partie non lancée)", () => {
    expect(computeDuration(0, Date.now())).toBeNull();
  });

  it("renvoie <= 0 si l'horloge recule (edge case physiquement impossible)", () => {
    const start = 1_000_500;
    const end = 1_000_000; // end avant start (impossible en pratique)
    const result = computeDuration(start, end);
    // Math.round(-500/1000) = Math.round(-0.5) = 0 (zéro en JS)
    expect(result).not.toBeNull();
    expect(result!).toBeLessThanOrEqual(0);
  });

  it("une partie de 2 min 34 s = 154 s", () => {
    const start = 0; // timestamp fictif
    // startTime > 0 donc on le fixe à 1
    const result = computeDuration(1, 1 + 154_000);
    expect(result).toBe(154);
    expect(formatDuration(result)).toBe("2 min 34 s");
  });
});

// ===========================================================================

describe("intégration formatDuration ↔ parseDuration", () => {
  it("une valeur valide parsée puis formatée est cohérente", () => {
    const raw = 154;
    const parsed = parseDuration(raw);
    expect(parsed).not.toBeNull();
    expect(formatDuration(parsed)).toBe("2 min 34 s");
  });

  it("une valeur invalide parsée donne '—' au format", () => {
    expect(formatDuration(parseDuration(null))).toBe("—");
    expect(formatDuration(parseDuration(-1))).toBe("—");
  });
});
