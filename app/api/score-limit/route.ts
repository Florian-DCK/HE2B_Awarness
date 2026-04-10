import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getBrusselsDateString, DAILY_PLAY_LIMIT } from "@/lib/daily-token";

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return NextResponse.json({ blocked: false });
  }

  try {
    const today = getBrusselsDateString();
    const emailCount = await prisma.dailyPlayRecord.count({
      where: { email, date: today },
    });

    const blocked = emailCount >= DAILY_PLAY_LIMIT;
    return NextResponse.json({
      blocked,
      remainingByEmail: Math.max(0, DAILY_PLAY_LIMIT - emailCount),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check score limit." },
      { status: 500 },
    );
  }
}
