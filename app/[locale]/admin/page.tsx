"use client";

import { useEffect, useMemo, useState } from "react";
import He2bBar from "../../components/He2bBar";

type Winner = {
  firstName: string;
  lastName: string;
  email: string;
  pseudo: string | null;
  score: number;
  maxCombo: number;
  level: number;
  durationSeconds: number | null;
  createdAt: string;
};

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
  averageDuration: number | null;
  bestScore: number;
  bestCombo: number;
  maxLevel: number;
  lastParticipationAt: string | null;
  conversionRate: number;
  participationByDay: { day: string; count: number }[];
  registrationsByDay: { day: string; count: number }[];
  participationByHour: { day: string; hour: number; count: number }[];
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

const formatDuration = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s} s`;
  return `${m} min ${s.toString().padStart(2, "0")} s`;
};

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

const DAY_COLORS = [
  "#F7941D",
  "#00BFB3",
  "#D91A5B",
  "#8DC63F",
  "#784CB7",
  "#F5C518",
  "#0070B8",
];

type TooltipState = {
  xPct: number;
  yPct: number;
  day: string;
  hour: number;
  count: number;
  color: string;
};

const dayLabel = (isoDay: string) => {
  // isoDay = "2026-04-08T00:00:00.000Z" — le jour est déjà en heure Brussels
  // On extrait directement depuis la partie date UTC pour éviter les décalages TZ
  const [year, month, d] = isoDay.slice(0, 10).split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(d));
  return date.toLocaleDateString("fr-BE", { day: "2-digit", month: "short" });
};

const HourlyLineChart = ({
  data,
}: {
  data: { day: string; hour: number; count: number }[];
}) => {
  const WIDTH = 560;
  const HEIGHT = 200;
  const PL = 28; // padding left
  const PR = 16; // padding right
  const PT = 12; // padding top
  const PB = 32; // padding bottom
  const CW = WIDTH - PL - PR;
  const CH = HEIGHT - PT - PB;

  const allDays = useMemo(
    () => Array.from(new Set(data.map((d) => d.day))).sort(),
    [data],
  );

  const [activeDays, setActiveDays] = useState<Set<string>>(
    () => new Set(allDays),
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Re-sync quand les données changent (nouveau chargement)
  const prevDaysKey = allDays.join(",");
  const [lastDaysKey, setLastDaysKey] = useState(prevDaysKey);
  if (prevDaysKey !== lastDaysKey) {
    setLastDaysKey(prevDaysKey);
    setActiveDays(new Set(allDays));
  }

  if (allDays.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const xOf = (hour: number) => PL + (hour / 23) * CW;
  const yOf = (count: number) => PT + CH - (count / maxCount) * CH;

  const pointsForDay = (day: string) =>
    Array.from({ length: 24 }, (_, h) => {
      const found = data.find((d) => d.day === day && d.hour === h);
      return { h, count: found?.count ?? 0 };
    });

  const pathFor = (day: string) =>
    pointsForDay(day)
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.h)},${yOf(p.count)}`)
      .join(" ");

  const yTicks = [0, Math.round(maxCount / 2), maxCount].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );
  const xTickHours = [0, 3, 6, 9, 12, 15, 18, 21, 23];

  const allSelected = activeDays.size === allDays.length;

  const toggleDay = (day: string) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setActiveDays(allSelected ? new Set() : new Set(allDays));
  };

  // Calcul du transform du tooltip pour éviter le débordement
  const tooltipTransform = tooltip
    ? `translateX(${
        tooltip.xPct < 15 ? "0%" : tooltip.xPct > 85 ? "-100%" : "-50%"
      }) translateY(${tooltip.yPct < 25 ? "8px" : "calc(-100% - 8px)"})`
    : undefined;

  return (
    <div>
      {/* Boutons de sélection des jours */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={toggleAll}
          className="cursor-pointer rounded-full border border-gray-300 px-3 py-1 text-[11px] font-semibold text-gray-500 transition-all hover:border-gray-400 hover:text-gray-700"
        >
          {allSelected ? "Tout désélect." : "Tout sélect."}
        </button>
        {allDays.map((day, i) => {
          const color = DAY_COLORS[i % DAY_COLORS.length];
          const active = activeDays.has(day);
          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className="cursor-pointer flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all"
              style={{
                borderColor: color,
                background: active ? color : "transparent",
                color: active ? "#fff" : color,
                opacity: active ? 1 : 0.45,
              }}
            >
              {dayLabel(day)}
            </button>
          );
        })}
      </div>

      {/* Graphique */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: 340 }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PL}
                x2={WIDTH - PR}
                y1={yOf(v)}
                y2={yOf(v)}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              <text
                x={PL - 4}
                y={yOf(v) + 4}
                textAnchor="end"
                fontSize={9}
                fill="#d1d5db"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X axis */}
          {xTickHours.map((h) => (
            <g key={h}>
              <line
                x1={xOf(h)}
                x2={xOf(h)}
                y1={PT}
                y2={PT + CH}
                stroke="#f3f4f6"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={xOf(h)}
                y={HEIGHT - 10}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {`${h}h`}
              </text>
            </g>
          ))}

          {/* Lines + dots */}
          {allDays.map((day, i) => {
            if (!activeDays.has(day)) return null;
            const color = DAY_COLORS[i % DAY_COLORS.length];
            const pts = pointsForDay(day);
            return (
              <g key={day}>
                <path
                  d={pathFor(day)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {pts.map((p) => (
                  <g key={p.h}>
                    {/* Zone de hit large */}
                    <circle
                      cx={xOf(p.h)}
                      cy={yOf(p.count)}
                      r={10}
                      fill="transparent"
                      onMouseEnter={() =>
                        setTooltip({
                          xPct: (xOf(p.h) / WIDTH) * 100,
                          yPct: (yOf(p.count) / HEIGHT) * 100,
                          day,
                          hour: p.h,
                          count: p.count,
                          color,
                        })
                      }
                    />
                    {/* Point visible uniquement si count > 0 */}
                    {p.count > 0 && (
                      <circle
                        cx={xOf(p.h)}
                        cy={yOf(p.count)}
                        r={tooltip?.day === day && tooltip.hour === p.h ? 5 : 3}
                        fill={color}
                        style={{ pointerEvents: "none", transition: "r 0.1s" }}
                      />
                    )}
                  </g>
                ))}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            style={{
              left: `${tooltip.xPct}%`,
              top: `${tooltip.yPct}%`,
              transform: tooltipTransform,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: tooltip.color }}
              />
              <span className="text-[11px] font-bold text-gray-700">
                {dayLabel(tooltip.day)} — {tooltip.hour}h
              </span>
            </div>
            <div className="mt-0.5 text-[13px] font-extrabold text-gray-900">
              {tooltip.count}{" "}
              <span className="font-normal text-gray-400">
                participation{tooltip.count > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
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
                  label: "Durée moyenne",
                  value: formatDuration(stats.averageDuration),
                  help: "Durée moyenne d'une session de jeu (du lancement au résultat).",
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

      try {
        const winnersResponse = await fetch("/api/admin/winners", {
          headers: { "x-admin-password": nextPassword },
        });
        if (winnersResponse.ok) {
          const winnersData = (await winnersResponse.json()) as {
            winners: Winner[];
          };
          setWinners(winnersData.winners ?? []);
        } else {
          setWinners([]);
        }
      } catch {
        setWinners([]);
      }
    } catch {
      setStats(null);
      setWinners([]);
      setError("Mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  };

  const exportWinnersCsv = () => {
    if (winners.length === 0) return;
    const header = [
      "rang",
      "prenom",
      "nom",
      "email",
      "pseudo",
      "score",
      "maxCombo",
      "level",
      "durationSeconds",
      "createdAt",
    ];
    const escape = (value: string | number | null) => {
      const str = value == null ? "" : String(value);
      if (/[",\n;]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const lines = [header.join(";")];
    winners.forEach((w, idx) => {
      lines.push(
        [
          idx + 1,
          w.firstName,
          w.lastName,
          w.email,
          w.pseudo ?? "",
          w.score,
          w.maxCombo,
          w.level,
          w.durationSeconds ?? "",
          w.createdAt,
        ]
          .map(escape)
          .join(";"),
      );
    });
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `gagnants-he2b-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

              {charts && stats.participationByHour.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                  <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                    Participations par heure
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Nombre de parties lancées par heure de la journée, une ligne par jour.
                  </p>
                  <div className="mt-4">
                    <HourlyLineChart data={stats.participationByHour} />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
                      Gagnants
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Top 50 des meilleurs scores. Un seul score par personne (le meilleur).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportWinnersCsv}
                    disabled={winners.length === 0}
                    className="rounded-full bg-he2b px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Exporter CSV
                  </button>
                </div>
                {winners.length === 0 ? (
                  <div className="mt-4 text-sm text-gray-500">
                    Aucun gagnant pour le moment.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="px-2 py-2">#</th>
                          <th className="px-2 py-2">Prénom</th>
                          <th className="px-2 py-2">Nom</th>
                          <th className="px-2 py-2">Email</th>
                          <th className="px-2 py-2">Pseudo</th>
                          <th className="px-2 py-2 text-right">Score</th>
                          <th className="px-2 py-2 text-right">Combo</th>
                          <th className="px-2 py-2 text-right">Niveau</th>
                          <th className="px-2 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {winners.map((w, idx) => (
                          <tr
                            key={`${w.email}-${w.createdAt}`}
                            className="border-t border-gray-100"
                          >
                            <td className="px-2 py-2 font-bold">{idx + 1}</td>
                            <td className="px-2 py-2">{w.firstName}</td>
                            <td className="px-2 py-2">{w.lastName}</td>
                            <td className="px-2 py-2 text-gray-500">{w.email}</td>
                            <td className="px-2 py-2">{w.pseudo ?? "—"}</td>
                            <td className="px-2 py-2 text-right font-bold">
                              {w.score}
                            </td>
                            <td className="px-2 py-2 text-right">{w.maxCombo}</td>
                            <td className="px-2 py-2 text-right">{w.level}</td>
                            <td className="px-2 py-2 text-gray-500">
                              {new Date(w.createdAt).toLocaleString("fr-BE")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
