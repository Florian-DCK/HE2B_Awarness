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
    const rows = await prisma.scoreboard.findMany({
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
      select: {
        firstName: true,
        lastName: true,
        email: true,
        pseudo: true,
        score: true,
        maxCombo: true,
        level: true,
        durationSeconds: true,
        createdAt: true,
      },
    });

    const seen = new Set<string>();
    const winners: Array<{
      firstName: string;
      lastName: string;
      email: string;
      pseudo: string | null;
      score: number;
      maxCombo: number;
      level: number;
      durationSeconds: number | null;
      createdAt: string;
    }> = [];
    for (const row of rows) {
      const key = row.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      winners.push({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        pseudo: row.pseudo,
        score: row.score,
        maxCombo: row.maxCombo,
        level: row.level,
        durationSeconds: row.durationSeconds,
        createdAt: row.createdAt.toISOString(),
      });
      if (winners.length >= 50) break;
    }

    return NextResponse.json({ winners });
  } catch {
    return NextResponse.json(
      { error: "Failed to load winners." },
      { status: 500 },
    );
  }
}
