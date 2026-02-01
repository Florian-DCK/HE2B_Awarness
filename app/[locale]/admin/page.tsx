"use client";

import { useEffect, useMemo, useState } from "react";
import He2bBar from "../../components/He2bBar";

type StatsResponse = {
  totalRegistrations: number;
  uniqueRegistrations: number;
  totalParticipations: number;
  uniquePlayersWithScores: number;
  avgParticipationsPerPlayer: number;
  avgReplays: number;
  averageScore: number;
  averageMaxCombo: number;
  averageLevel: number;
  bestScore: number;
  bestCombo: number;
  maxLevel: number;
  lastParticipationAt: string | null;
  conversionRate: number;
  participationByDay: { day: string; count: number }[];
  registrationsByDay: { day: string; count: number }[];
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("fr-BE") : "0";

const formatPercent = (value: number) =>
  `${(value * 100).toFixed(1).replace(".", ",")}%`;

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
  });
};

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

type BarRowProps = {
  label: string;
  value: string;
  percent: number;
  color?: string;
};

const BarRow = ({ label, value, percent, color }: BarRowProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
      <span>{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${clampPercent(percent)}%`,
          background:
            color ?? "linear-gradient(90deg, #D91A5B, rgba(217,26,91,0.6))",
        }}
      />
    </div>
  </div>
);

const StatInfo = ({ text }: { text: string }) => (
  <span className="relative inline-flex items-center group">
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[11px] font-bold text-gray-500">
      ?
    </span>
    <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-56 -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-[11px] text-gray-600 shadow-[0_8px_24px_rgba(0,0,0,0.12)] opacity-0 transition group-hover:opacity-100">
      {text}
    </span>
  </span>
);

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password") ?? "";
    if (saved) {
      setPassword(saved);
    }
  }, []);

  const kpis = useMemo(
    () =>
          stats
            ? [
                {
                  label: "Inscrits (total)",
                  value: formatNumber(stats.totalRegistrations),
                  help: "Nombre total d'inscriptions enregistrées.",
                },
                {
                  label: "Participations",
                  value: formatNumber(stats.totalParticipations),
                  help: "Nombre total de parties jouées.",
                },
                {
                  label: "Participations / joueur",
                  value: stats.avgParticipationsPerPlayer.toFixed(2).replace(".", ","),
                  help: "Moyenne de parties jouées par joueur.",
                },
                {
                  label: "Taux conversion",
                  value: formatPercent(stats.conversionRate),
                  help:
                    "Part des inscrits qui ont effectivement joué au moins une partie.",
                },
                {
                  label: "Score en moyenne",
                  value: formatNumber(stats.averageScore),
                  help: "Score moyen toutes parties confondues.",
                },
                {
                  label: "Combo en moyenne",
                  value: formatNumber(stats.averageMaxCombo),
                  help: "Meilleur combo moyen atteint par partie.",
                },
                {
                  label: "Niveau en moyenne",
                  value: stats.averageLevel.toFixed(1).replace(".", ","),
                  help: "Niveau moyen atteint par partie.",
                },
                {
                  label: "Dernière partie",
                  value: formatDateTime(stats.lastParticipationAt),
                  help: "Date et heure de la dernière partie jouée.",
                },
              ]
            : [],
    [stats],
  );

  const charts = useMemo(() => {
    if (!stats) return null;
    const maxAudience = Math.max(
      stats.totalRegistrations,
      stats.totalParticipations,
      1,
    );
    const maxScore = Math.max(stats.bestScore, 1);
    const maxCombo = Math.max(stats.bestCombo, 1);
    const maxLevel = Math.max(stats.maxLevel, 1);
    const participationSeries = [...stats.participationByDay];
    const registrationSeries = [...stats.registrationsByDay];
    const maxDaily = Math.max(
      ...participationSeries.map((row) => row.count),
      ...registrationSeries.map((row) => row.count),
      1,
    );
    return {
      audience: [
        {
          label: "Inscrits (total)",
          value: formatNumber(stats.totalRegistrations),
          percent: (stats.totalRegistrations / maxAudience) * 100,
          color: "linear-gradient(90deg, #00BFB3, rgba(0,191,179,0.6))",
        },
        {
          label: "Participations",
          value: formatNumber(stats.totalParticipations),
          percent: (stats.totalParticipations / maxAudience) * 100,
          color: "linear-gradient(90deg, #F7941D, rgba(247,148,29,0.6))",
        },
      ],
      engagement: [
        {
          label: "Participations / joueur",
          value: stats.avgParticipationsPerPlayer.toFixed(2).replace(".", ","),
          percent: Math.min(stats.avgParticipationsPerPlayer / 3, 1) * 100,
          color: "linear-gradient(90deg, #9B4F9B, rgba(155,79,155,0.6))",
        },
        {
          label: "Taux conversion",
          value: formatPercent(stats.conversionRate),
          percent: stats.conversionRate * 100,
          color: "linear-gradient(90deg, #8DC63F, rgba(141,198,63,0.6))",
        },
      ],
      performance: [
        {
          label: "Score moyen",
          value: formatNumber(stats.averageScore),
          percent: (stats.averageScore / maxScore) * 100,
          color: "linear-gradient(90deg, #D91A5B, rgba(217,26,91,0.6))",
        },
        {
          label: "Combo moyen",
          value: formatNumber(stats.averageMaxCombo),
          percent: (stats.averageMaxCombo / maxCombo) * 100,
          color: "linear-gradient(90deg, #00BFB3, rgba(0,191,179,0.6))",
        },
        {
          label: "Niveau moyen",
          value: stats.averageLevel.toFixed(1).replace(".", ","),
          percent: (stats.averageLevel / maxLevel) * 100,
          color: "linear-gradient(90deg, #F5C518, rgba(245,197,24,0.6))",
        },
      ],
      daily: {
        participationSeries,
        registrationSeries,
        maxDaily,
      },
    };
  }, [stats]);

  const loadStats = async (nextPassword = password) => {
    if (!nextPassword) {
      setError("Mot de passe requis.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": nextPassword },
      });
      if (!response.ok) {
        throw new Error("Accès refusé.");
      }
      const data = (await response.json()) as StatsResponse;
      setStats(data);
      sessionStorage.setItem("admin_password", nextPassword);
    } catch {
      setStats(null);
      setError("Mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-white">
      <He2bBar />
      <div className="mx-auto w-full max-w-[980px] px-6 py-10">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-he2b text-3xl font-extrabold uppercase">
                  Admin HE2B
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Statistiques d&apos;engagement de l&apos;activation.
                </p>
              </div>
              <div className="flex w-full max-w-[320px] gap-2">
                <input
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#D91A5B] focus:outline-none"
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="rounded-full bg-he2b px-4 py-2 text-sm font-bold text-white shadow transition active:scale-95"
                  onClick={() => loadStats()}
                >
                  {loading ? "..." : "Charger"}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-3 text-sm font-semibold text-[#D91A5B]">
                {error}
              </div>
            )}
          </div>

          {stats && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      <span>{kpi.label}</span>
                      {"help" in kpi && kpi.help ? <StatInfo text={kpi.help} /> : null}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-gray-800">
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>

              {charts && (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                    <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                      Audience
                    </div>
                    <div className="mt-4 flex flex-col gap-4">
                      {charts.audience.map((row) => (
                        <BarRow key={row.label} {...row} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                    <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                      Engagement
                    </div>
                    <div className="mt-4 flex flex-col gap-4">
                      {charts.engagement.map((row) => (
                        <BarRow key={row.label} {...row} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                    <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                      Performance
                    </div>
                    <div className="mt-4 flex flex-col gap-4">
                      {charts.performance.map((row) => (
                        <BarRow key={row.label} {...row} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {charts && (
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                  <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                    Stats par jour
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-gray-50 px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Participations
                      </div>
                      <div className="mt-4 flex flex-col gap-3">
                        {charts.daily.participationSeries.map((row) => (
                          <BarRow
                            key={`p-${row.day}`}
                            label={formatDay(row.day)}
                            value={formatNumber(row.count)}
                            percent={(row.count / charts.daily.maxDaily) * 100}
                            color="linear-gradient(90deg, #F7941D, rgba(247,148,29,0.6))"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Inscriptions
                      </div>
                      <div className="mt-4 flex flex-col gap-3">
                        {charts.daily.registrationSeries.map((row) => (
                          <BarRow
                            key={`r-${row.day}`}
                            label={formatDay(row.day)}
                            value={formatNumber(row.count)}
                            percent={(row.count / charts.daily.maxDaily) * 100}
                            color="linear-gradient(90deg, #00BFB3, rgba(0,191,179,0.6))"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
