export type QualificationReasoningProfile = "default" | "low" | "none";
export type QualificationReasoningEffort = "low" | "none";
export type QualificationProfile = QualificationReasoningProfile | "full-standard" | "compact-standard" | "jester-integration" | "love-integration" | "dungeon-integration" | "chaos-integration";

export type CompletedProviderMetadata = Readonly<{
  requestId?: string;
  status?: string;
  incompleteReason?: string;
  incompleteDetails?: Readonly<{ reason: string | null }>;
  configuredMaxOutputTokens?: number;
  outputTokenExhausted?: boolean;
  outputTextPresent?: boolean;
  outputTextCharacterCount?: number;
  outputStructure?: readonly Readonly<{
    type: string | null;
    contentTypes: readonly string[];
  }>[];
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
}>;

export interface ProviderDiagnosticRecorder {
  markProviderRequestStart(): void;
  markProviderResponseReceived(metadata: CompletedProviderMetadata): void;
  recordProviderParse(durationMs: number): void;
  recordProviderValidation(durationMs: number): void;
  markProviderFinished(): void;
  markTimeoutAbort(): void;
}

const rounded = (value: number | null) => value === null ? null : Math.round(value * 10) / 10;

export class PreviewIntelligenceDiagnosticRecorder implements ProviderDiagnosticRecorder {
  readonly routeStartedAt = new Date().toISOString();
  private readonly routeStart = performance.now();
  private providerRequestStart: number | null = null;
  private providerResponseReceived: number | null = null;
  private providerFinished: number | null = null;
  private timeoutAbort: number | null = null;
  private providerParseMs: number | null = null;
  private providerValidationMs: number | null = null;
  private finalServiceValidationMs: number | null = null;
  private totalServerMs: number | null = null;
  private completedProvider: CompletedProviderMetadata = {};

  constructor(
    readonly instanceId: string,
    readonly invocationCount: number,
    readonly profile: QualificationProfile,
    readonly timeoutMs: number
  ) {}

  markProviderRequestStart() {
    this.providerRequestStart = performance.now();
  }

  markProviderResponseReceived(metadata: CompletedProviderMetadata) {
    this.providerResponseReceived = performance.now();
    this.completedProvider = { ...metadata };
  }

  recordProviderParse(durationMs: number) {
    this.providerParseMs = durationMs;
  }

  recordProviderValidation(durationMs: number) {
    this.providerValidationMs = durationMs;
  }

  recordFinalServiceValidation(durationMs: number) {
    this.finalServiceValidationMs = durationMs;
  }

  markProviderFinished() {
    this.providerFinished = performance.now();
  }

  markTimeoutAbort() {
    this.timeoutAbort = performance.now();
  }

  finish() {
    this.totalServerMs = performance.now() - this.routeStart;
  }

  snapshot() {
    const providerEnd = this.providerResponseReceived ?? this.timeoutAbort ?? this.providerFinished;
    const providerElapsedMs = this.providerRequestStart !== null && providerEnd !== null
      ? providerEnd - this.providerRequestStart
      : null;
    return {
      mode: "preview-qualification-v1" as const,
      instanceId: this.instanceId,
      invocationCount: this.invocationCount,
      profile: this.profile,
      reasoningEffort: this.profile,
      timeoutMs: this.timeoutMs,
      routeStartedAt: this.routeStartedAt,
      timings: {
        routeStartMs: 0,
        preProviderMs: rounded(this.providerRequestStart === null ? null : this.providerRequestStart - this.routeStart),
        providerRequestStartMs: rounded(this.providerRequestStart === null ? null : this.providerRequestStart - this.routeStart),
        providerResponseReceivedMs: rounded(this.providerResponseReceived === null ? null : this.providerResponseReceived - this.routeStart),
        providerElapsedMs: rounded(providerElapsedMs),
        providerParseMs: rounded(this.providerParseMs),
        providerValidationMs: rounded(this.providerValidationMs),
        finalServiceValidationMs: rounded(this.finalServiceValidationMs),
        timeoutAbortMs: rounded(this.timeoutAbort === null ? null : this.timeoutAbort - this.routeStart),
        totalServerMs: rounded(this.totalServerMs),
      },
      openAI: {
        requestId: this.completedProvider.requestId ?? null,
        status: this.completedProvider.status ?? null,
        incompleteReason: this.completedProvider.incompleteReason ?? null,
        incompleteDetails: this.completedProvider.incompleteDetails ?? null,
        configuredMaxOutputTokens: this.completedProvider.configuredMaxOutputTokens ?? null,
        outputTokenExhausted: this.completedProvider.outputTokenExhausted ?? false,
        outputTextPresent: this.completedProvider.outputTextPresent ?? false,
        outputTextCharacterCount: this.completedProvider.outputTextCharacterCount ?? 0,
        outputStructure: this.completedProvider.outputStructure ?? null,
        usage: this.providerResponseReceived === null ? null : {
          inputTokens: this.completedProvider.inputTokens ?? null,
          outputTokens: this.completedProvider.outputTokens ?? null,
          totalTokens: this.completedProvider.totalTokens ?? null,
          reasoningTokens: this.completedProvider.reasoningTokens ?? null,
        },
      },
    };
  }

  serverTimingHeader() {
    const timings = this.snapshot().timings;
    const entries = [
      ["pre-provider", timings.preProviderMs],
      ["provider", timings.providerElapsedMs],
      ["provider-parse", timings.providerParseMs],
      ["provider-validation", timings.providerValidationMs],
      ["final-validation", timings.finalServiceValidationMs],
      ["total", timings.totalServerMs],
    ] as const;
    return entries
      .flatMap(([name, duration]) => duration === null ? [] : [`${name};dur=${duration}`])
      .join(", ");
  }
}

export function isPreviewIntelligenceDiagnosticsEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env
) {
  const nonProductionRuntime = environment.VERCEL_ENV === "preview" || environment.NODE_ENV === "development";
  return nonProductionRuntime && environment.ORACLE_INTELLIGENCE_DIAGNOSTICS_ENABLED?.trim().toLowerCase() === "true";
}

export function parseQualificationReasoningProfile(value: string): QualificationReasoningProfile | null {
  return value === "default" || value === "low" || value === "none" ? value : null;
}

export function parseQualificationProfile(value: string): QualificationProfile | null {
  return value === "full-standard" || value === "compact-standard"
    ? value
    : parseQualificationReasoningProfile(value);
}
