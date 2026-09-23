import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../app/api/oracle/intelligence/qualification/[profile]/route";

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

const validBody = {
  schemaVersion: "1",
  requestId: "qualification_request_1",
  cycleId: "qualification_cycle_1",
  oracleId: "jester",
  question: "Will taking this chance actually change my life?",
};

const request = (body: unknown) => new NextRequest(
  "https://preview.example.com/api/oracle/intelligence/qualification/default",
  {
    method: "POST",
    headers: { origin: "https://preview.example.com", "content-type": "application/json" },
    body: JSON.stringify(body),
  }
);

const context = (profile: string) => ({ params: Promise.resolve({ profile }) });

describe("Preview Oracle Intelligence qualification route", () => {
  it("returns 404 in Production regardless of the flag", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.VERCEL_ENV = "production";
    process.env.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED = "true";
    expect((await POST(request(validBody), context("default"))).status).toBe(404);
    expect((await POST(request(validBody), context("full-standard"))).status).toBe(404);
    expect((await POST(request(validBody), context("compact-standard"))).status).toBe(404);
  });

  it("accepts only server-selected full and compact A/B profiles in Preview", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.VERCEL_ENV = "preview";
    process.env.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED = "true";
    process.env.ORACLE_INTELLIGENCE_ENABLED = "false";
    for (const profile of ["full-standard", "compact-standard"]) {
      const response = await POST(request(validBody), context(profile));
      expect(response.status).toBe(200);
      expect((await response.json()).diagnostic.profile).toBe(profile);
    }
    expect((await POST(request(validBody), context("compact-custom"))).status).toBe(404);
  });

  it("returns 404 when disabled or when the profile is not approved", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.VERCEL_ENV = "preview";
    process.env.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED = "false";
    expect((await POST(request(validBody), context("default"))).status).toBe(404);
    process.env.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED = "true";
    expect((await POST(request(validBody), context("medium"))).status).toBe(404);
  });

  it("exposes bounded privacy-safe diagnostics in Preview without requiring a provider call", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.VERCEL_ENV = "preview";
    process.env.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED = "true";
    process.env.ORACLE_INTELLIGENCE_ENABLED = "false";
    const response = await POST(request(validBody), context("none"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-oracle-diagnostic")).toBe("preview-qualification-v1");
    expect(response.headers.get("server-timing")).toContain("total;dur=");
    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      action: "use_protected_library",
      reason: "disabled",
      diagnostic: {
        mode: "preview-qualification-v1",
        profile: "none",
        reasoningEffort: "none",
        timeoutMs: 5000,
        openAI: {
          configuredMaxOutputTokens: null,
          outputTokenExhausted: false,
          outputTextPresent: false,
          outputTextCharacterCount: 0,
        },
      },
    });
    const diagnostic = JSON.stringify(body.diagnostic);
    expect(diagnostic).not.toContain(validBody.question);
    expect(diagnostic).not.toContain("question");
    expect(diagnostic).not.toContain("answer");
    expect(diagnostic).not.toContain("session");
  });

  it("rejects client-supplied effort and timeout fields", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    process.env.VERCEL_ENV = "preview";
    process.env.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED = "true";
    expect((await POST(request({ ...validBody, reasoningEffort: "none" }), context("default"))).status).toBe(400);
    expect((await POST(request({ ...validBody, timeoutMs: 60_000 }), context("default"))).status).toBe(400);
  });
});
