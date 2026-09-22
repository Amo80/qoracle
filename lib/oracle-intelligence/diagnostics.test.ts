import { describe, expect, it } from "vitest";
import {
  isPreviewIntelligenceDiagnosticsEnabled,
  parseQualificationReasoningProfile,
  PreviewIntelligenceDiagnosticRecorder,
} from "./diagnostics";

describe("Preview-only Oracle Intelligence diagnostics", () => {
  it("fails closed in Production even when the diagnostic flag is set", () => {
    expect(isPreviewIntelligenceDiagnosticsEnabled({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED: "true",
    })).toBe(false);
    expect(isPreviewIntelligenceDiagnosticsEnabled({
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED: "true",
    })).toBe(true);
    expect(isPreviewIntelligenceDiagnosticsEnabled({
      NODE_ENV: "development",
      ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED: "true",
    })).toBe(true);
  });

  it("accepts only the three server-approved reasoning profiles", () => {
    expect(parseQualificationReasoningProfile("default")).toBe("default");
    expect(parseQualificationReasoningProfile("low")).toBe("low");
    expect(parseQualificationReasoningProfile("none")).toBe("none");
    expect(parseQualificationReasoningProfile("medium")).toBeNull();
    expect(parseQualificationReasoningProfile("high")).toBeNull();
    expect(parseQualificationReasoningProfile("arbitrary")).toBeNull();
  });

  it("records timings and completed-response metadata without accepting private content", () => {
    const recorder = new PreviewIntelligenceDiagnosticRecorder("instance-test", 2, "low", 5000);
    recorder.markProviderRequestStart();
    recorder.markProviderResponseReceived({
      requestId: "resp_test",
      status: "incomplete",
      incompleteReason: "max_output_tokens",
      incompleteDetails: { reason: "max_output_tokens" },
      configuredMaxOutputTokens: 512,
      outputTokenExhausted: true,
      outputTextPresent: true,
      outputTextCharacterCount: 123,
      outputStructure: [{ type: "message", contentTypes: ["output_text"] }],
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      reasoningTokens: 12,
    });
    recorder.recordProviderParse(0.4);
    recorder.recordProviderValidation(0.6);
    recorder.recordFinalServiceValidation(0.3);
    recorder.markProviderFinished();
    recorder.finish();
    const snapshot = recorder.snapshot();
    expect(snapshot).toMatchObject({
      mode: "preview-qualification-v1",
      instanceId: "instance-test",
      invocationCount: 2,
      profile: "low",
      timeoutMs: 5000,
      openAI: {
        requestId: "resp_test",
        status: "incomplete",
        incompleteReason: "max_output_tokens",
        incompleteDetails: { reason: "max_output_tokens" },
        configuredMaxOutputTokens: 512,
        outputTokenExhausted: true,
        outputTextPresent: true,
        outputTextCharacterCount: 123,
        outputStructure: [{ type: "message", contentTypes: ["output_text"] }],
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150, reasoningTokens: 12 },
      },
    });
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("question");
    expect(serialized).not.toContain("answer");
    expect(serialized).not.toContain("prompt");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("session");
    expect(serialized).not.toContain("apiKey");
    expect(recorder.serverTimingHeader()).toContain("provider;dur=");
  });
});
