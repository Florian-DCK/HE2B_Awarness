import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

type RegistrationPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  pseudo?: string;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  let payload: RegistrationPayload;
  try {
    payload = (await request.json()) as RegistrationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const pseudo = payload.pseudo?.trim() ?? "";

  if (!firstName || !lastName || !email || !pseudo) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  // Check for existing registration
  const existing = await prisma.playerRegistration.findFirst({
    where: { email },
  });
  if (existing) {
    if (existing.pseudo !== pseudo) {
      try {
        await prisma.playerRegistration.update({
          where: { id: existing.id },
          data: { pseudo },
        });
      } catch {
        return NextResponse.json(
          { error: "Failed to update registration." },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.playerRegistration.create({
      data: {
        firstName,
        lastName,
        email,
        pseudo,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to store registration." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
