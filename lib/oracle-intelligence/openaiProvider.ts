import OpenAI from "openai";
import type { ProviderDiagnosticRecorder, QualificationProfile, QualificationReasoningEffort } from "./diagnostics";
import { buildCompactIntentSchema, expandCompactIntent, validateCompactIntent } from "./compactIntent";
import { buildCompactOracleInstructions, buildOracleInstructions, buildVisitorQuestionInput } from "./prompt";
import type { OracleIntelligenceProvider, ProviderResult } from "./provider";
import { validateProviderOutput } from "./schema";
import { buildOracleStructuredOutputSchema } from "./structuredOutput";
import type { OracleIntelligenceRequestV1 } from "./types";

export const DEFAULT_ORACLE_INTELLIGENCE_MODEL = "gpt-5.6-luna";
// This budget includes invisible reasoning and formatting tokens as well as the
// visible structured response. Answer length remains bounded by the schema and
// local 320-character / 70-word validation contract.
export const ORACLE_PROVIDER_MAX_OUTPUT_TOKENS = 512;

type ResponseLike = Readonly<{
  id?: string;
  status?: string;
  incomplete_details?: Readonly<Record<string, unknown> & { reason?: string }>;
  output_text?: string;
  output?: readonly { type?: string; content?: readonly { type?: string }[] }[];
  usage?: Readonly<{
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    output_tokens_details?: Readonly<{ reasoning_tokens?: number }>;
  }>;
}>;

export type OpenAIResponsesClient = Readonly<{
  responses: Readonly<{
    create: (body: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<ResponseLike>;
  }>;
}>;

export class OpenAIOracleIntelligenceProvider implements OracleIntelligenceProvider {
  constructor(
    private readonly client: OpenAIResponsesClient,
    readonly model = DEFAULT_ORACLE_INTELLIGENCE_MODEL,
    readonly reasoningEffort?: QualificationReasoningEffort
  ) {}

  async generate(
    request: OracleIntelligenceRequestV1,
    signal: AbortSignal,
    diagnostics?: ProviderDiagnosticRecorder
  ): Promise<ProviderResult> {
    if (signal.aborted) return { ok: false, kind: "cancelled" };
    try {
      const instructions = buildOracleInstructions(request.oracleId);
      const schema = buildOracleStructuredOutputSchema(request.oracleId);
      diagnostics?.markProviderRequestStart();
      const response = await this.client.responses.create({
        model: this.model,
        store: false,
        instructions,
        input: [{ role: "user", content: [{ type: "input_text", text: buildVisitorQuestionInput(request.question) }] }],
        ...(this.reasoningEffort ? { reasoning: { effort: this.reasoningEffort } } : {}),
        text: {
          format: {
            type: "json_schema",
            name: `oracle_${request.oracleId}_response_v1`,
            strict: true,
            schema,
          },
        },
        max_output_tokens: ORACLE_PROVIDER_MAX_OUTPUT_TOKENS,
        tools: [],
      }, { signal });
      diagnostics?.markProviderResponseReceived({
        requestId: response.id,
        status: response.status,
        incompleteReason: response.incomplete_details?.reason,
        incompleteDetails: response.incomplete_details
          ? { reason: response.incomplete_details.reason ?? null }
          : undefined,
        configuredMaxOutputTokens: ORACLE_PROVIDER_MAX_OUTPUT_TOKENS,
        outputTokenExhausted: response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens",
        outputTextPresent: Boolean(response.output_text),
        outputTextCharacterCount: response.output_text?.length ?? 0,
        outputStructure: response.output?.map((item) => ({
          type: item.type ?? null,
          contentTypes: item.content?.map((content) => content.type ?? "unknown") ?? [],
        })),
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
        reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens,
      });

      if (response.status === "incomplete") return { ok: false, kind: "malformed_output" };

      const refused = response.output?.some((item) =>
        item.content?.some((content) => content.type === "refusal")
      );
      if (refused) return { ok: false, kind: "refusal", safetyCategory: "refusal" };
      if (!response.output_text) return { ok: false, kind: "malformed_output" };
      let parsed: unknown;
      const parseStartedAt = performance.now();
      try {
        parsed = JSON.parse(response.output_text);
      } catch {
        diagnostics?.recordProviderParse(performance.now() - parseStartedAt);
        return { ok: false, kind: "malformed_output" };
      }
      diagnostics?.recordProviderParse(performance.now() - parseStartedAt);
      const validationStartedAt = performance.now();
      const validated = validateProviderOutput(parsed, request.oracleId);
      diagnostics?.recordProviderValidation(performance.now() - validationStartedAt);
      return validated.ok
        ? { ok: true, output: validated.value }
        : { ok: false, kind: "malformed_output" };
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        return { ok: false, kind: "cancelled" };
      }
      return { ok: false, kind: "provider_error" };
    } finally {
      diagnostics?.markProviderFinished();
    }
  }
}

/** Isolated Preview qualification provider for the compact semantic-intent arm. */
export class OpenAICompactIntentQualificationProvider implements OracleIntelligenceProvider {
  constructor(
    private readonly client: OpenAIResponsesClient,
    readonly model = DEFAULT_ORACLE_INTELLIGENCE_MODEL
  ) {}

  async generate(
    request: OracleIntelligenceRequestV1,
    signal: AbortSignal,
    diagnostics?: ProviderDiagnosticRecorder
  ): Promise<ProviderResult> {
    if (signal.aborted) return { ok: false, kind: "cancelled" };
    try {
      diagnostics?.markProviderRequestStart();
      const response = await this.client.responses.create({
        model: this.model,
        store: false,
        instructions: buildCompactOracleInstructions(request.oracleId),
        input: [{ role: "user", content: [{ type: "input_text", text: buildVisitorQuestionInput(request.question) }] }],
        text: {
          format: {
            type: "json_schema",
            name: `oracle_${request.oracleId}_compact_intent_v1`,
            strict: true,
            schema: buildCompactIntentSchema(request.oracleId),
          },
        },
        max_output_tokens: ORACLE_PROVIDER_MAX_OUTPUT_TOKENS,
        tools: [],
      }, { signal });
      diagnostics?.markProviderResponseReceived({
        requestId: response.id,
        status: response.status,
        incompleteReason: response.incomplete_details?.reason,
        incompleteDetails: response.incomplete_details
          ? { reason: response.incomplete_details.reason ?? null }
          : undefined,
        configuredMaxOutputTokens: ORACLE_PROVIDER_MAX_OUTPUT_TOKENS,
        outputTokenExhausted: response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens",
        outputTextPresent: Boolean(response.output_text),
        outputTextCharacterCount: response.output_text?.length ?? 0,
        outputStructure: response.output?.map((item) => ({
          type: item.type ?? null,
          contentTypes: item.content?.map((content) => content.type ?? "unknown") ?? [],
        })),
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
        reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens,
      });
      if (response.status === "incomplete") return { ok: false, kind: "malformed_output" };
      const refused = response.output?.some((item) =>
        item.content?.some((content) => content.type === "refusal")
      );
      if (refused) return { ok: false, kind: "refusal", safetyCategory: "refusal" };
      if (!response.output_text) return { ok: false, kind: "malformed_output" };
      let parsed: unknown;
      const parseStartedAt = performance.now();
      try {
        parsed = JSON.parse(response.output_text);
      } catch {
        diagnostics?.recordProviderParse(performance.now() - parseStartedAt);
        return { ok: false, kind: "malformed_output" };
      }
      diagnostics?.recordProviderParse(performance.now() - parseStartedAt);
      const validationStartedAt = performance.now();
      const compact = validateCompactIntent(parsed, request.oracleId);
      diagnostics?.recordProviderValidation(performance.now() - validationStartedAt);
      return compact
        ? { ok: true, output: expandCompactIntent(request.oracleId, compact) }
        : { ok: false, kind: "malformed_output" };
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        return { ok: false, kind: "cancelled" };
      }
      return { ok: false, kind: "provider_error" };
    } finally {
      diagnostics?.markProviderFinished();
    }
  }
}

export function createOpenAIProviderForQualification(
  environment: Readonly<Record<string, string | undefined>>,
  profile: QualificationProfile
) {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  if (profile === "compact-standard") {
    return new OpenAICompactIntentQualificationProvider(
      client as unknown as OpenAIResponsesClient,
      environment.ORACLE_INTELLIGENCE_MODEL?.trim() || DEFAULT_ORACLE_INTELLIGENCE_MODEL
    );
  }
  const effort = profile === "low" || profile === "none" ? profile : undefined;
  return new OpenAIOracleIntelligenceProvider(
    client as unknown as OpenAIResponsesClient,
    environment.ORACLE_INTELLIGENCE_MODEL?.trim() || DEFAULT_ORACLE_INTELLIGENCE_MODEL,
    effort
  );
}

export function createOpenAIProviderFromEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env
) {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  return new OpenAIOracleIntelligenceProvider(
    client as unknown as OpenAIResponsesClient,
    environment.ORACLE_INTELLIGENCE_MODEL?.trim() || DEFAULT_ORACLE_INTELLIGENCE_MODEL
  );
}

/** Compact provider used only by the gated visitor-facing Jester Preview route. */
export function createOpenAICompactProviderFromEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env
) {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  return new OpenAICompactIntentQualificationProvider(
    client as unknown as OpenAIResponsesClient,
    environment.ORACLE_INTELLIGENCE_MODEL?.trim() || DEFAULT_ORACLE_INTELLIGENCE_MODEL
  );
}
