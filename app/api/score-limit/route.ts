import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getBrusselsDateString, DAILY_PLAY_LIMIT } from "@/lib/daily-token";

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    return first?.trim() ?? "";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "";
};

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
    const ip = getClientIp(request);
    const today = getBrusselsDateString();
    const [emailCount, ipCount] = await Promise.all([
      prisma.dailyPlayRecord.count({ where: { email, date: today } }),
      ip
        ? prisma.dailyPlayRecord.count({ where: { ip, date: today } })
        : Promise.resolve(0),
    ]);

    const blocked = emailCount >= DAILY_PLAY_LIMIT || ipCount >= DAILY_PLAY_LIMIT;
    return NextResponse.json({
      blocked,
      remainingByEmail: Math.max(0, DAILY_PLAY_LIMIT - emailCount),
      remainingByIp: ip ? Math.max(0, DAILY_PLAY_LIMIT - ipCount) : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check score limit." },
      { status: 500 },
    );
  }
}
