import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

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
    const emailCount = await prisma.scoreboard.count({ where: { email } });
    const ipCount = ip
      ? await prisma.scoreboard.count({ where: { ip } })
      : 0;

    const blocked = emailCount >= 3 || ipCount >= 3;
    return NextResponse.json({
      blocked,
      remainingByEmail: Math.max(0, 3 - emailCount),
      remainingByIp: ip ? Math.max(0, 3 - ipCount) : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check score limit." },
      { status: 500 },
    );
  }
}
