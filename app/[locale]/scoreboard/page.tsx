"use client";

import { useEffect, useState } from "react";
import He2bBar from "../../components/He2bBar";
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

export default function ScoreboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

  return (
    <main className="min-h-[100dvh] bg-white">
      <He2bBar />
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-[900px] items-center px-6 py-8">
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
      <Footer />
    </main>
  );
}
