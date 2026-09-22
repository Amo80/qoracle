import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isAllowedIntelligenceOrigin, isJsonContentType, ORACLE_INTELLIGENCE_MAX_BODY_BYTES } from "./http";

const makeRequest = (headers: Record<string, string>) =>
  new NextRequest("https://preview.example.com/api/oracle/intelligence", { method: "POST", headers });

describe("Oracle Intelligence HTTP boundary", () => {
  it("requires JSON and same-origin/same-site requests", () => {
    expect(isAllowedIntelligenceOrigin(makeRequest({ origin: "https://preview.example.com" }))).toBe(true);
    expect(isAllowedIntelligenceOrigin(makeRequest({ origin: "https://attacker.example" }))).toBe(false);
    expect(isAllowedIntelligenceOrigin(makeRequest({ "sec-fetch-site": "same-site" }))).toBe(true);
    expect(isAllowedIntelligenceOrigin(makeRequest({}))).toBe(false);
    expect(isJsonContentType(makeRequest({ "content-type": "application/json; charset=utf-8" }))).toBe(true);
    expect(isJsonContentType(makeRequest({ "content-type": "text/plain" }))).toBe(false);
    expect(ORACLE_INTELLIGENCE_MAX_BODY_BYTES).toBe(2048);
  });
});
