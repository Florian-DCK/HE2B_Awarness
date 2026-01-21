import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

type ScorePayload = {
  firstName?: string;
  lastName?: string;
  score?: number;
  maxCombo?: number;
  level?: number;
};

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  try {
    // Récupère le meilleur score par personne (firstName + lastName)
    const scores = await prisma.scoreboard.groupBy({
      by: ["firstName", "lastName"],
      _max: {
        score: true,
        maxCombo: true,
        level: true,
      },
      orderBy: {
        _max: { score: "desc" },
      },
      take: 10,
    });

    // Formate les résultats pour retourner les champs attendus
    const formattedScores = scores.map((s) => ({
      firstName: s.firstName,
      lastName: s.lastName,
      score: s._max.score,
      maxCombo: s._max.maxCombo,
      level: s._max.level,
    }));

    return NextResponse.json({ scores: formattedScores });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve scores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  let payload: ScorePayload;
  try {
    payload = (await request.json()) as ScorePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const score = payload.score ?? null;
  const maxCombo = payload.maxCombo ?? null;
  const level = payload.level ?? null;

  if (
    !firstName ||
    !lastName ||
    score === null ||
    maxCombo === null ||
    level === null
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  if (
    !Number.isFinite(score) ||
    !Number.isFinite(maxCombo) ||
    !Number.isFinite(level)
  ) {
    return NextResponse.json({ error: "Invalid score data." }, { status: 400 });
  }

  try {
    await prisma.scoreboard.create({
      data: {
        firstName,
        lastName,
        score,
        maxCombo,
        level,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to store score." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
