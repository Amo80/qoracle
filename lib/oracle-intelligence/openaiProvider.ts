import OpenAI from "openai";
import { buildOracleInstructions, buildVisitorQuestionInput } from "./prompt";
import type { OracleIntelligenceProvider, ProviderResult } from "./provider";
import { validateProviderOutput } from "./schema";
import { buildOracleStructuredOutputSchema } from "./structuredOutput";
import type { OracleIntelligenceRequestV1 } from "./types";

export const DEFAULT_ORACLE_INTELLIGENCE_MODEL = "gpt-5.6-luna";
export const ORACLE_PROVIDER_MAX_OUTPUT_TOKENS = 220;

type ResponseLike = Readonly<{
  output_text?: string;
  output?: readonly { type?: string; content?: readonly { type?: string }[] }[];
}>;

export type OpenAIResponsesClient = Readonly<{
  responses: Readonly<{
    create: (body: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<ResponseLike>;
  }>;
}>;

export class OpenAIOracleIntelligenceProvider implements OracleIntelligenceProvider {
  constructor(
    private readonly client: OpenAIResponsesClient,
    readonly model = DEFAULT_ORACLE_INTELLIGENCE_MODEL
  ) {}

  async generate(request: OracleIntelligenceRequestV1, signal: AbortSignal): Promise<ProviderResult> {
    if (signal.aborted) return { ok: false, kind: "cancelled" };
    try {
      const response = await this.client.responses.create({
        model: this.model,
        store: false,
        instructions: buildOracleInstructions(request.oracleId),
        input: [{ role: "user", content: [{ type: "input_text", text: buildVisitorQuestionInput(request.question) }] }],
        text: {
          format: {
            type: "json_schema",
            name: `oracle_${request.oracleId}_response_v1`,
            strict: true,
            schema: buildOracleStructuredOutputSchema(request.oracleId),
          },
        },
        max_output_tokens: ORACLE_PROVIDER_MAX_OUTPUT_TOKENS,
        tools: [],
      }, { signal });

      const refused = response.output?.some((item) =>
        item.content?.some((content) => content.type === "refusal")
      );
      if (refused) return { ok: false, kind: "refusal", safetyCategory: "refusal" };
      if (!response.output_text) return { ok: false, kind: "malformed_output" };
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.output_text);
      } catch {
        return { ok: false, kind: "malformed_output" };
      }
      const validated = validateProviderOutput(parsed, request.oracleId);
      return validated.ok
        ? { ok: true, output: validated.value }
        : { ok: false, kind: "malformed_output" };
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        return { ok: false, kind: "cancelled" };
      }
      return { ok: false, kind: "provider_error" };
    }
  }
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
