import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../app/api/oracle/intelligence/route";

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

const validBody = {
  schemaVersion: "1",
  requestId: "request_1",
  cycleId: "cycle_1",
  oracleId: "jester",
  question: "What truth should I notice?",
};

const request = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("https://preview.example.com/api/oracle/intelligence", {
    method: "POST",
    headers: {
      origin: "https://preview.example.com",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

describe("POST /api/oracle/intelligence", () => {
  it("returns a normalized fallback with master intelligence OFF and sets an opaque session cookie", async () => {
    process.env.ORACLE_INTELLIGENCE_ENABLED = "false";
    delete process.env.OPENAI_API_KEY;
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("qrystal_intelligence_session=");
    await expect(response.json()).resolves.toMatchObject({ ok: false, action: "use_protected_library", reason: "disabled" });
  });

  it("rejects wrong content type, cross-origin, unexpected fields, and oversized bodies generically", async () => {
    expect((await POST(request(validBody, { "content-type": "text/plain" }))).status).toBe(400);
    expect((await POST(request(validBody, { origin: "https://attacker.example" }))).status).toBe(400);
    expect((await POST(request({ ...validBody, source: "oracle-ai" }))).status).toBe(400);
    expect((await POST(request({ ...validBody, question: "x".repeat(3000) }))).status).toBe(400);
  });
});
