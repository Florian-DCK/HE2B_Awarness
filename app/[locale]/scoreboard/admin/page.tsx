"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import He2bBar from "../../../components/He2bBar";
import { QRCodeCanvas } from "qrcode.react";
import Footer from "@/app/components/Footer";

type ScoreEntry = {
  firstName: string;
  lastName: string;
  pseudo?: string | null;
  score: number | null;
  maxCombo: number | null;
  level: number | null;
};

const decodeValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const formatName = (entry: ScoreEntry) => {
  const pseudo = decodeValue(entry.pseudo?.trim() ?? "");
  if (pseudo) return pseudo;
  const safeFirst = decodeValue(entry.firstName.trim());
  const safeLastInitial = decodeValue(entry.lastName.trim())
    .slice(0, 1)
    .toUpperCase();
  if (!safeFirst && !safeLastInitial) return "Anonyme";
  if (!safeLastInitial) return safeFirst;
  return `${safeFirst} ${safeLastInitial}.`;
};

export default function ScoreboardAdminPage() {
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password") ?? "";
    if (saved) {
      setPassword(saved);
      verifyPassword(saved);
    }
  }, []);

  const verifyPassword = async (nextPassword = password) => {
    if (!nextPassword) {
      setAuthError("Mot de passe requis.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/admin/auth", {
        headers: { "x-admin-password": nextPassword },
      });
      if (!response.ok) {
        throw new Error("Acces refuse.");
      }
      setAuthorized(true);
      sessionStorage.setItem("admin_password", nextPassword);
    } catch {
      setAuthorized(false);
      setAuthError("Mot de passe invalide.");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    let isMounted = true;

    const fetchScores = (showLoading: boolean) => {
      if (showLoading) {
        setLoading(true);
      }
      fetch("/api/scores")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur serveur");
          }
          return response.json();
        })
        .then((data) => {
          if (!isMounted) return;
          const list = Array.isArray(data?.scores) ? data.scores : [];
          setScores(list);
          setError("");
        })
        .catch(() => {
          if (!isMounted) return;
          setError("Impossible de charger le leaderboard.");
        })
        .finally(() => {
          if (!isMounted) return;
          if (showLoading) {
            setLoading(false);
          }
        });
    };

    fetchScores(true);
    const intervalId = window.setInterval(() => {
      fetchScores(false);
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    const loadDailyToken = async () => {
      try {
        const response = await fetch("/api/daily-token", {
          cache: "no-store",
          headers: { "x-admin-password": password },
        });
        if (!response.ok) return;
        const data = (await response.json()) as { token?: string };
        if (!active || !data?.token) return;
        if (typeof window !== "undefined") {
          setQrValue(`${window.location.origin}/${data.token}/${locale}`);
        }
      } catch {
        // Ignore token fetch errors; fallback to locale-only url.
      }
    };
    loadDailyToken();
    return () => {
      active = false;
    };
  }, [authorized, locale, password]);

  if (!authorized) {
    return (
      <main className="min-h-[100dvh] bg-white">
        <He2bBar />
        <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-[640px] items-center px-6 py-10">
          <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="text-center">
              <h1 className="text-he2b text-2xl font-extrabold uppercase">
                Acces Organisateurs
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Mot de passe requis pour afficher le scoreboard.
              </p>
            </div>
            <div className="mt-5 flex w-full gap-2">
              <input
                className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#D91A5B] focus:outline-none"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="rounded-full bg-he2b px-4 py-2 text-sm font-bold text-white shadow transition active:scale-95"
                onClick={() => verifyPassword()}
              >
                {authLoading ? "..." : "Valider"}
              </button>
            </div>
            {authError && (
              <div className="mt-3 text-center text-sm font-semibold text-[#D91A5B]">
                {authError}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-white">
      <He2bBar />
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-[1100px] items-center px-6 py-8">
        <div className="flex w-full flex-col gap-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <img
              src="/assets/diplomePoulpe.png"
              alt="Poulpe HE2B"
              className="float h-24 w-24 object-contain"
            />
            <h1 className="mt-3 text-he2b text-3xl font-extrabold uppercase">
              JONGLE AVEC TA VIE D&apos;ETUDIANT
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Attrape les bons objets, evite les malus et garde ton focus.
              Chaque partie dure 90 secondes. Pret a battre le top 10 ?
            </p>

            <div className="mt-6 w-full rounded-2xl bg-gray-50 px-5 py-4 text-left shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00BFB3]">
                Defi du stand
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-700">
                Entre dans le top 10 et gagne la gloire tentaculaire.
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Le jeu est juste la - viens essayer maintenant !
              </div>
              <div className="mt-4 flex justify-center lg:justify-start">
                <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                  <QRCodeCanvas
                    value={qrValue || `/${locale}`}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#0a0a14"
                    level="M"
                  />
                </div>
              </div>
              {qrValue && (
                <div className="mt-2 text-center text-[10px] text-gray-400 lg:text-left">
                  {qrValue}
                </div>
              )}
            </div>
          </section>

          <section className="w-full">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-extrabold text-gray-700">
                    Meilleurs scores
                  </div>
                  <div className="text-xs text-gray-400">Top 10 du stand</div>
                </div>
                <span className="rounded-full bg-[linear-gradient(135deg,#D91A5B,#9B4F9B)] px-3 py-1 text-[11px] font-bold text-white">
                  Leaderboard
                </span>
              </div>

              {loading && (
                <div className="mt-4 text-sm font-semibold text-gray-500">
                  Chargement...
                </div>
              )}

              {error && (
                <div className="mt-4 text-sm font-semibold text-[#D91A5B]">
                  {error}
                </div>
              )}

              {!loading && !error && scores.length === 0 && (
                <div className="mt-4 text-sm text-gray-500">
                  Aucun score pour le moment. Ton nom peut etre ici !
                </div>
              )}

              {!loading && !error && scores.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  {scores.map((entry, index) => (
                    <div
                      key={`${entry.firstName}-${entry.lastName}-${index}`}
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-700"
                    >
                      <span className="w-9 text-lg">
                        {index === 0
                          ? "1."
                          : index === 1
                            ? "2."
                            : index === 2
                              ? "3."
                              : `${index + 1}.`}
                      </span>
                      <span className="flex-1 text-left text-[13px] font-semibold text-gray-700">
                        {formatName(entry)}
                      </span>
                      <span className="font-extrabold text-he2b">
                        {entry.score ?? 0} pts
                      </span>
                      <span className="text-[11px] font-semibold text-[#9B4F9B]">
                        Niv.{entry.level ?? 0}
                      </span>
                      <span className="font-semibold text-[#00BFB3]">
                        x{entry.maxCombo ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}


