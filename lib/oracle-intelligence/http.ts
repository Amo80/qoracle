import type { NextRequest } from "next/server";

export const ORACLE_INTELLIGENCE_MAX_BODY_BYTES = 2048;

export function isAllowedIntelligenceOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite === "same-origin" || fetchSite === "same-site";
}

export function isJsonContentType(request: Request) {
  return request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}
