import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { getDailyToken } from "./lib/daily-token";

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

const getLocaleFromSegments = (segments: string[]) => {
  const maybeLocale = segments[0];
  return maybeLocale &&
    routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? (maybeLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;
};

const isScoreboardPath = (segments: string[]) => {
  if (segments.length < 2) return false;
  if (!routing.locales.includes(segments[0] as (typeof routing.locales)[number]))
    return false;
  return segments[1] === "scoreboard" && segments[2] !== "admin";
};

const isAdminPath = (segments: string[]) => {
  if (segments.length < 2) return false;
  if (!routing.locales.includes(segments[0] as (typeof routing.locales)[number]))
    return false;
  return segments[1] === "admin";
};

const isScoreboardAdminPath = (segments: string[]) => {
  if (segments.length < 3) return false;
  if (!routing.locales.includes(segments[0] as (typeof routing.locales)[number]))
    return false;
  return segments[1] === "scoreboard" && segments[2] === "admin";
};

const isClosedPath = (segments: string[]) => {
  if (segments.length < 2) return false;
  if (!routing.locales.includes(segments[0] as (typeof routing.locales)[number]))
    return false;
  return segments[1] === "closed";
};

export default async function middleware(request: NextRequest) {
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

  const segments = pathname.split("/").filter(Boolean);
  const dailyToken = await getDailyToken();
  const hasTokenPrefix = segments[0] === dailyToken;
  const effectiveSegments = hasTokenPrefix ? segments.slice(1) : segments;

  if (!hasTokenPrefix) {
    if (
      !isScoreboardPath(effectiveSegments) &&
      !isScoreboardAdminPath(effectiveSegments) &&
      !isAdminPath(effectiveSegments) &&
      !isClosedPath(effectiveSegments)
    ) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  if (hasTokenPrefix) {
    if (effectiveSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }
    if (
      isScoreboardPath(effectiveSegments) ||
      isScoreboardAdminPath(effectiveSegments) ||
      isAdminPath(effectiveSegments)
    ) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  if (!isOpenNow()) {
    if (pathname.includes("/admin")) {
      return intlMiddleware(request);
    }
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Site closed (10h-18h)." },
        { status: 403 },
      );
    }

    const locale = getLocaleFromSegments(effectiveSegments);
    const closedPath = `/${locale}/closed`;

    if (pathname !== closedPath) {
      const url = request.nextUrl.clone();
      url.pathname = closedPath;
      return NextResponse.redirect(url);
    }
  }

  if (request.method === "GET" && effectiveSegments.includes("game")) {
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
          if (hasTokenPrefix) {
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = `/${effectiveSegments.join("/")}`;
            return NextResponse.rewrite(rewriteUrl);
          }
          return intlMiddleware(request);
        }
        const data = (await res.json()) as { blocked?: boolean };
        if (data?.blocked) {
          const locale = getLocaleFromSegments(effectiveSegments);
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/${locale}/scoreboard`;
          redirectUrl.searchParams.set("limit", "1");
          return NextResponse.redirect(redirectUrl);
        }
        if (hasTokenPrefix) {
          const rewriteUrl = request.nextUrl.clone();
          rewriteUrl.pathname = `/${effectiveSegments.join("/")}`;
          return NextResponse.rewrite(rewriteUrl);
        }
        return intlMiddleware(request);
      });
    }
  }

  if (hasTokenPrefix) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/${effectiveSegments.join("/")}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/:path*",
};
