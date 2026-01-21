"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import He2bBar from "../../components/He2bBar";
import { QRCodeCanvas } from "qrcode.react";
import Footer from "@/app/components/Footer";

type ScoreEntry = {
  firstName: string;
  lastName: string;
  score: number | null;
  maxCombo: number | null;
  level: number | null;
};

const formatName = (firstName: string, lastName: string) => {
  const safeFirst = firstName.trim();
  const safeLastInitial = lastName.trim().slice(0, 1).toUpperCase();
  if (!safeFirst && !safeLastInitial) return "Anonyme";
  if (!safeLastInitial) return safeFirst;
  return `${safeFirst} ${safeLastInitial}.`;
};

export default function ScoreboardPage() {
  const locale = useLocale();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    let isMounted = true;
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
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Impossible de charger le leaderboard.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrValue(`${window.location.origin}/${locale}`);
    }
  }, [locale]);

  return (
    <main className="min-h-[100dvh] bg-white">
      <He2bBar />
      <div className="mx-auto w-full max-w-[1100px] px-6 py-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <img
              src="/assets/diplomePoulpe.png"
              alt="Poulpe HE2B"
              className="float h-24 w-24 object-contain lg:h-28 lg:w-28"
            />
            <h1 className="mt-3 text-he2b text-3xl font-extrabold uppercase lg:text-4xl">
              JONGLE AVEC TA VIE D&apos;ÉTUDIANT
            </h1>
            <p className="mt-2 max-w-[520px] text-sm text-gray-500">
              Attrape les bons objets, évite les malus et garde ton focus.
              Chaque partie dure 90 secondes. Prêt à battre le top 10 ?
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Tape D/F/J/K", "Enchaîne les combos", "Vise le x3"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-4 text-left shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00BFB3]">
                Défi du stand
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-700">
                Entre dans le top 10 et gagne la gloire tentaculaire.
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Le jeu est juste là — viens essayer maintenant !
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
            </div>
          </section>

          <section className="w-full">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-gray-700">
                    Meilleurs scores
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Top 10 du stand
                  </div>
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
                  Aucun score pour le moment. Ton nom peut être ici !
                </div>
              )}

              {!loading && !error && scores.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {scores.map((entry, index) => (
                    <div
                      key={`${entry.firstName}-${entry.lastName}-${index}`}
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-xs font-semibold text-gray-700"
                    >
                      <span className="w-7 text-base">
                        {index === 0
                          ? "🏆"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `${index + 1}.`}
                      </span>
                      <span className="flex-1 text-left text-[12px] font-semibold text-gray-600">
                        {formatName(entry.firstName, entry.lastName)}
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
