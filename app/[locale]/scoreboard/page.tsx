"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import He2bBar from "../../components/He2bBar";
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
  const router = useRouter();
  const locale = useLocale();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col">
        <div className="flex flex-1 flex-col items-center gap-4 px-6 py-6 text-center">
          <div>
            <h1 className="text-he2b text-2xl font-extrabold uppercase">
              Leaderboard
            </h1>
            <p className="text-xs text-gray-500">Top 10 des scores</p>
          </div>

          {loading && (
            <div className="text-sm font-semibold text-gray-500">
              Chargement...
            </div>
          )}

          {error && (
            <div className="text-sm font-semibold text-[#D91A5B]">{error}</div>
          )}

          {!loading && !error && scores.length === 0 && (
            <div className="text-sm text-gray-500">
              Aucun score pour le moment.
            </div>
          )}

          {!loading && !error && scores.length > 0 && (
            <div className="w-full max-w-[320px] rounded-2xl bg-gray-50 p-4">
              <div className="mb-2 text-center text-xs font-extrabold text-gray-700">
                Meilleurs scores
              </div>
              <div className="flex flex-col gap-2">
                {scores.map((entry, index) => (
                  <div
                    key={`${entry.firstName}-${entry.lastName}-${index}`}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700"
                  >
                    <span className="w-6 text-sm">
                      {index === 0
                        ? "🏆"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                    </span>
                    <span className="flex-1 text-left text-[11px] font-semibold text-gray-600">
                      {formatName(entry.firstName, entry.lastName)}
                    </span>
                    <span className="font-extrabold text-he2b">
                      {entry.score ?? 0} pts
                    </span>
                    <span className="text-[10px] font-semibold text-[#9B4F9B]">
                      Niv.{entry.level ?? 0}
                    </span>
                    <span className="font-semibold text-[#00BFB3]">
                      x{entry.maxCombo ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
