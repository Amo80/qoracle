import type { OracleIntelligenceProvider, ProviderResult } from "./provider";
import type { ProviderDiagnosticRecorder } from "./diagnostics";
import type { OracleIntelligenceRequestV1 } from "./types";

export const ORACLE_INTELLIGENCE_TIMEOUT_MS = 1550;
export const ORACLE_INTELLIGENCE_QUALIFICATION_TIMEOUT_MS = 5000;

async function generateWithBoundedTimeout({
  provider,
  request,
  parentSignal,
  timeoutMs,
  timeoutCeilingMs,
  diagnostics,
}: {
  provider: OracleIntelligenceProvider;
  request: OracleIntelligenceRequestV1;
  parentSignal?: AbortSignal;
  timeoutMs: number;
  timeoutCeilingMs: number;
  diagnostics?: ProviderDiagnosticRecorder;
}): Promise<ProviderResult> {
  const controller = new AbortController();
  let timedOut = false;
  const onParentAbort = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", onParentAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ProviderResult>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      diagnostics?.markTimeoutAbort();
      controller.abort(new Error("oracle-intelligence-timeout"));
      resolve({ ok: false, kind: "timeout" });
    }, Math.max(1, Math.min(timeoutMs, timeoutCeilingMs)));
  });
  try {
    const result = await Promise.race([provider.generate(request, controller.signal, diagnostics), timeout]);
    if (timedOut) return { ok: false, kind: "timeout" };
    if (parentSignal?.aborted) return { ok: false, kind: "cancelled" };
    return result;
  } finally {
    if (timer) clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}

export async function generateWithTimeout({
  provider,
  request,
  parentSignal,
  timeoutMs = ORACLE_INTELLIGENCE_TIMEOUT_MS,
  diagnostics,
}: {
  provider: OracleIntelligenceProvider;
  request: OracleIntelligenceRequestV1;
  parentSignal?: AbortSignal;
  timeoutMs?: number;
  diagnostics?: ProviderDiagnosticRecorder;
}): Promise<ProviderResult> {
  return generateWithBoundedTimeout({ provider, request, parentSignal, timeoutMs, timeoutCeilingMs: ORACLE_INTELLIGENCE_TIMEOUT_MS, diagnostics });
}

export function generateWithQualificationTimeout({
  provider,
  request,
  parentSignal,
  timeoutMs = ORACLE_INTELLIGENCE_QUALIFICATION_TIMEOUT_MS,
  diagnostics,
}: {
  provider: OracleIntelligenceProvider;
  request: OracleIntelligenceRequestV1;
  parentSignal?: AbortSignal;
  timeoutMs?: number;
  diagnostics?: ProviderDiagnosticRecorder;
}) {
  return generateWithBoundedTimeout({
    provider,
    request,
    parentSignal,
    timeoutMs,
    timeoutCeilingMs: ORACLE_INTELLIGENCE_QUALIFICATION_TIMEOUT_MS,
    diagnostics,
  });
}
