import type { OracleIntelligenceProvider, ProviderResult } from "./provider";
import type { OracleIntelligenceRequestV1 } from "./types";

export const ORACLE_INTELLIGENCE_TIMEOUT_MS = 1550;

export async function generateWithTimeout({
  provider,
  request,
  parentSignal,
  timeoutMs = ORACLE_INTELLIGENCE_TIMEOUT_MS,
}: {
  provider: OracleIntelligenceProvider;
  request: OracleIntelligenceRequestV1;
  parentSignal?: AbortSignal;
  timeoutMs?: number;
}): Promise<ProviderResult> {
  const controller = new AbortController();
  let timedOut = false;
  const onParentAbort = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", onParentAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ProviderResult>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error("oracle-intelligence-timeout"));
      resolve({ ok: false, kind: "timeout" });
    }, Math.max(1, Math.min(timeoutMs, ORACLE_INTELLIGENCE_TIMEOUT_MS)));
  });
  try {
    const result = await Promise.race([provider.generate(request, controller.signal), timeout]);
    if (timedOut) return { ok: false, kind: "timeout" };
    if (parentSignal?.aborted) return { ok: false, kind: "cancelled" };
    return result;
  } finally {
    if (timer) clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}
