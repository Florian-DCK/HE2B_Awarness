import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const TIME_ZONE = "Europe/Brussels";
const OPEN_HOUR = 10;
const CLOSE_HOUR = 18;

const intlMiddleware = createMiddleware(routing);
const BYPASS_HOURS_LIMIT = process.env.BYPASS_HOURS_LIMIT === "true";

const parseCookie = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) return "";
  const value = `; ${cookieHeader}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length < 2) return "";
  const raw = parts.pop()?.split(";").shift() ?? "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const getHourInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((part) => part.type === "hour");
  const hour = hourPart ? Number.parseInt(hourPart.value, 10) : date.getUTCHours();
  return Number.isNaN(hour) ? date.getUTCHours() : hour;
};

const isOpenNow = () => {
  if (BYPASS_HOURS_LIMIT) return true;
  const hour = getHourInTimeZone(new Date(), TIME_ZONE);
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
};

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  if (!isOpenNow()) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Site closed (10h-18h)." },
        { status: 403 },
      );
    }

    const segments = pathname.split("/").filter(Boolean);
    const locale = routing.locales.includes(segments[0] ?? "")
      ? segments[0]
      : routing.defaultLocale;
    const closedPath = `/${locale}/closed`;

    if (pathname !== closedPath) {
      const url = request.nextUrl.clone();
      url.pathname = closedPath;
      return NextResponse.redirect(url);
    }
  }

  if (request.method === "GET" && pathname.includes("/game")) {
    const email = parseCookie(request.headers.get("cookie"), "he2b_email");
    if (email) {
      const url = new URL("/api/score-limit", request.nextUrl.origin);
      url.searchParams.set("email", email);
      const limitRes = fetch(url, {
        headers: {
          "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
          "x-real-ip": request.headers.get("x-real-ip") ?? "",
        },
      });
      return limitRes.then(async (res) => {
        if (!res.ok) {
          return intlMiddleware(request);
        }
        const data = (await res.json()) as { blocked?: boolean };
        if (data?.blocked) {
          const segments = pathname.split("/").filter(Boolean);
          const locale = routing.locales.includes(segments[0] ?? "")
            ? segments[0]
            : routing.defaultLocale;
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/${locale}/scoreboard`;
          redirectUrl.searchParams.set("limit", "1");
          return NextResponse.redirect(redirectUrl);
        }
        return intlMiddleware(request);
      });
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/:path*",
};
