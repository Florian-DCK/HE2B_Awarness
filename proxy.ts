import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

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

const getLocaleFromSegments = (segments: string[]) => {
  const maybeLocale = segments[0];
  return maybeLocale &&
    routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? (maybeLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;
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

  if (request.method === "GET" && segments.includes("game")) {
    const email = parseCookie(request.headers.get("cookie"), "he2b_email");
    if (email) {
      const url = new URL("/api/score-limit", request.nextUrl.origin);
      url.searchParams.set("email", email);
      const res = await fetch(url, {
        headers: {
          "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
          "x-real-ip": request.headers.get("x-real-ip") ?? "",
        },
      });
      if (res.ok) {
        const data = (await res.json()) as { blocked?: boolean };
        if (data?.blocked) {
          const locale = getLocaleFromSegments(segments);
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/${locale}/scoreboard`;
          redirectUrl.searchParams.set("limit", "1");
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/:path*",
};
