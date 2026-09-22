// Paste this entire file into the authenticated Vercel Preview browser console.
void (async () => {
  const questions = [
    ["simple_yes_no", "Will taking this chance actually change my life?"],
    ["relationship", "Is this relationship asking me to grow with this person, or am I holding on because I am afraid to begin again?"],
    ["career_life", "Should I leave the security of my current job to pursue the work that feels more meaningful, even though the outcome is uncertain?"],
    ["playful_absurd", "If a raccoon in a velvet cape offered me a map to buried treasure, should I follow it or ask who handles its accounting?"],
    ["sensitive_non_crisis", "I keep doubting myself after a painful setback. What should I remember before I decide whether I am ready to try again?"],
    ["long", "I have spent years building a safe and predictable life, but a new opportunity would require moving, changing careers, and trusting myself. What truth should guide my choice?"],
  ];
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const plan = [1, 2].flatMap((repeat) =>
    shuffle(questions.map(([category, question]) => ({ category, question, repeat })))
  );
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = [];

  for (let index = 0; index < plan.length; index += 1) {
    if (index > 0 && index % 5 === 0) {
      console.log("Waiting 65 seconds before next batch...");
      await sleep(65_000);
    }
    const item = plan[index];
    const nonce = crypto.randomUUID().replaceAll("-", "");
    console.log(`Request ${index + 1}/12 — ${item.category}`);
    const started = performance.now();
    try {
      const response = await fetch("/api/oracle/intelligence/qualification/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          schemaVersion: "1",
          requestId: `reliability_${index + 1}_${nonce}`,
          cycleId: `cycle_${index + 1}_${nonce}`,
          oracleId: "jester",
          question: item.question,
        }),
      });
      const body = await response.json();
      const diagnostic = body.diagnostic ?? {};
      const openAI = diagnostic.openAI ?? {};
      results.push({
        sequence: index + 1,
        category: item.category,
        repeat: item.repeat,
        httpStatus: response.status,
        browserLatencyMs: Math.round((performance.now() - started) * 10) / 10,
        providerElapsedMs: diagnostic.timings?.providerElapsedMs ?? null,
        totalServerElapsedMs: diagnostic.timings?.totalServerMs ?? null,
        ok: body.ok === true,
        action: body.action ?? null,
        source: body.response?.source ?? null,
        fallbackUsed: body.response?.fallback?.used ?? body.action === "use_protected_library",
        fallbackReason: body.response?.fallback?.reason ?? body.reason ?? null,
        schemaValid: body.ok === true && body.action === "use_response",
        answer: body.response?.answer ?? null,
        presentation: body.response?.presentation ?? null,
        safety: body.response?.safety ?? null,
        providerStatus: openAI.status ?? null,
        incompleteReason: openAI.incompleteReason ?? null,
        incompleteDetails: openAI.incompleteDetails ?? null,
        configuredMaxOutputTokens: openAI.configuredMaxOutputTokens ?? null,
        outputTokenExhausted: openAI.outputTokenExhausted ?? false,
        outputTextPresent: openAI.outputTextPresent ?? false,
        outputTextCharacterCount: openAI.outputTextCharacterCount ?? 0,
        outputStructure: openAI.outputStructure ?? null,
        openAIRequestId: openAI.requestId ?? null,
        inputTokens: openAI.usage?.inputTokens ?? null,
        outputTokens: openAI.usage?.outputTokens ?? null,
        reasoningTokens: openAI.usage?.reasoningTokens ?? null,
        totalTokens: openAI.usage?.totalTokens ?? null,
        error: null,
      });
    } catch (error) {
      results.push({
        sequence: index + 1,
        category: item.category,
        repeat: item.repeat,
        browserLatencyMs: Math.round((performance.now() - started) * 10) / 10,
        ok: false,
        fallbackUsed: true,
        fallbackReason: "browser_error",
        schemaValid: false,
        outputTokenExhausted: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const count = (predicate) => results.filter(predicate).length;
  const summary = {
    total: results.length,
    validAISuccess: count((row) => row.ok && row.action === "use_response"),
    malformedOutput: count((row) => row.fallbackReason === "malformed_output"),
    timeout: count((row) => row.fallbackReason === "timeout"),
    outputTokenExhaustion: count((row) => row.outputTokenExhausted === true),
    schemaInvalidCompleted: count((row) => row.providerStatus === "completed" && !row.schemaValid),
  };
  const report = {
    reportVersion: "phase6-reliability-v1",
    generatedAt: new Date().toISOString(),
    endpoint: "/api/oracle/intelligence/qualification/default",
    profile: "default",
    diagnosticTimeoutMs: 5000,
    summary,
    results,
  };
  window.__QRYSTAL_JESTER_RELIABILITY_QUALIFICATION__ = report;
  console.log("RELIABILITY QUALIFICATION COMPLETE");
  console.table(results.map(({ sequence, category, repeat, browserLatencyMs, providerElapsedMs, ok, fallbackReason, outputTokens, reasoningTokens, outputTokenExhausted }) => ({ sequence, category, repeat, browserLatencyMs, providerElapsedMs, ok, fallbackReason, outputTokens, reasoningTokens, outputTokenExhausted })));
  console.log(summary);
  console.log(JSON.stringify(report, null, 2));
})();
