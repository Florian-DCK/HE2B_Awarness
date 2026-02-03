import { NextResponse } from "next/server";
import { getDailyToken } from "@/lib/daily-token";

const isAuthorized = (request: Request) => {
  const password = request.headers.get("x-admin-password") ?? "";
  return password && password === process.env.ADMIN_PASSWORD;
};

export const GET = async (request: Request) => {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const token = await getDailyToken();
  return NextResponse.json({ token });
};
