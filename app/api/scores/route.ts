import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

type ScorePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  pseudo?: string;
  score?: number;
  maxCombo?: number;
  level?: number;
};

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    return first?.trim() ?? "";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "";
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
    const scores = await prisma.scoreboard.findMany({
      orderBy: { score: "desc" },
      take: 50,
      select: {
        firstName: true,
        lastName: true,
        email: true,
        pseudo: true,
        score: true,
        maxCombo: true,
        level: true,
      },
    });

    const seen = new Set<string>();
    const uniqueScores = [];
    for (const entry of scores) {
      if (seen.has(entry.email)) continue;
      seen.add(entry.email);
      uniqueScores.push(entry);
      if (uniqueScores.length >= 10) break;
    }

    return NextResponse.json({ scores: uniqueScores });
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
  const email = payload.email?.trim() ?? "";
  const pseudo = payload.pseudo?.trim() ?? "";
  const score = payload.score ?? null;
  const maxCombo = payload.maxCombo ?? null;
  const level = payload.level ?? null;

  if (
    !firstName ||
    !lastName ||
    !email ||
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
    const ip = getClientIp(request);
    const userWhere = { email };

    if (ip) {
      const ipCount = await prisma.scoreboard.count({ where: { ip } });
      if (ipCount >= 3) {
        return NextResponse.json(
          { error: "Too many submissions from this IP." },
          { status: 429 },
        );
      }
    }

    const userCount = await prisma.scoreboard.count({ where: userWhere });
    if (userCount >= 3) {
      return NextResponse.json(
        { error: "Too many submissions for this player." },
        { status: 429 },
      );
    }

    await prisma.scoreboard.create({
      data: {
        firstName,
        lastName,
        email,
        pseudo: pseudo || null,
        ip: ip || null,
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
