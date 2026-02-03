import { NextResponse } from "next/server";

const isAuthorized = (request: Request) => {
  const password = request.headers.get("x-admin-password") ?? "";
  return password && password === process.env.ADMIN_PASSWORD;
};

export async function GET(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
