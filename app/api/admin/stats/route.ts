import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const isAuthorized = (request: Request) => {
  const password = request.headers.get("x-admin-password") ?? "";
  return password && password === process.env.ADMIN_PASSWORD;
};

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const totalRegistrations = await prisma.playerRegistration.count();
    const uniqueRegistrations = (
      await prisma.playerRegistration.findMany({
        select: { email: true },
        distinct: ["email"],
      })
    ).length;

    const totalParticipations = await prisma.scoreboard.count();
    const uniquePlayersWithScores = (
      await prisma.scoreboard.findMany({
        select: { email: true },
        distinct: ["email"],
      })
    ).length;

    const participationsByEmail = await prisma.scoreboard.groupBy({
      by: ["email"],
      _count: { _all: true },
    });
    const totalFromGroups = participationsByEmail.reduce(
      (sum, entry) => sum + entry._count._all,
      0,
    );
    const avgParticipationsPerPlayer =
      participationsByEmail.length > 0
        ? totalFromGroups / participationsByEmail.length
        : 0;
    const avgReplays =
      participationsByEmail.length > 0
        ? Math.max(0, avgParticipationsPerPlayer - 1)
        : 0;

    const scoreAggregate = await prisma.scoreboard.aggregate({
      _avg: { score: true, maxCombo: true, level: true },
      _max: { score: true, maxCombo: true, level: true, createdAt: true },
    });

    const lastParticipation = await prisma.scoreboard.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const participationByDay = await prisma.$queryRaw<
      { day: Date; count: number }[]
    >`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "Scoreboard"
      GROUP BY day
      ORDER BY day ASC;
    `;

    const registrationsByDay = await prisma.$queryRaw<
      { day: Date; count: number }[]
    >`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "PlayerRegistration"
      GROUP BY day
      ORDER BY day ASC;
    `;

    return NextResponse.json({
      totalRegistrations,
      uniqueRegistrations,
      totalParticipations,
      uniquePlayersWithScores,
      avgParticipationsPerPlayer,
      avgReplays,
      averageScore: scoreAggregate._avg.score ?? 0,
      averageMaxCombo: scoreAggregate._avg.maxCombo ?? 0,
      averageLevel: scoreAggregate._avg.level ?? 0,
      bestScore: scoreAggregate._max.score ?? 0,
      bestCombo: scoreAggregate._max.maxCombo ?? 0,
      maxLevel: scoreAggregate._max.level ?? 0,
      lastParticipationAt: lastParticipation?.createdAt ?? null,
      conversionRate:
        uniqueRegistrations > 0
          ? uniquePlayersWithScores / uniqueRegistrations
          : 0,
      participationByDay: participationByDay.map((row) => ({
        day: row.day.toISOString(),
        count: row.count,
      })),
      registrationsByDay: registrationsByDay.map((row) => ({
        day: row.day.toISOString(),
        count: row.count,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load stats." },
      { status: 500 },
    );
  }
}
