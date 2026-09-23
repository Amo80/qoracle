(async () => {
  const questions = [
    ["simple_yes_no", "Will taking this chance actually change my life?"],
    ["relationship", "Is this relationship asking me to grow with this person, or am I holding on because I am afraid to begin again?"],
    ["career_life", "Should I leave the security of my current job to pursue the work that feels more meaningful, even though the outcome is uncertain?"],
    ["playful_absurd", "If a raccoon in a velvet cape offered me a map to buried treasure, should I follow it or ask who handles its accounting?"],
    ["sensitive_non_crisis", "I keep doubting myself after a painful setback. What should I remember before I decide whether I am ready to try again?"],
    ["long", "I have spent years building a safe and predictable life, but a new opportunity would require moving, changing careers, and trusting myself. What truth should guide my choice?"],
  ];
  const shuffle = (values) => {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const target = random[0] % (index + 1);
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  };
  const jobs = [1, 2].flatMap((round) =>
    shuffle(questions).map(([category, question]) => ({ round, category, question }))
  );
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = [];
  for (let index = 0; index < jobs.length; index++) {
    const job = jobs[index];
    const sequence = index + 1;
    console.log(`Request ${sequence}/12 — ${job.category}`);
    const started = performance.now();
    try {
      const response = await fetch("/api/oracle/intelligence/qualification/compact-standard", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          schemaVersion: "1",
          requestId: `completion_${sequence}_${crypto.randomUUID()}`.slice(0, 80),
          cycleId: `completion_cycle_${sequence}_${crypto.randomUUID()}`.slice(0, 80),
          oracleId: "jester",
          question: job.question,
        }),
      });
      const body = await response.json().catch(() => null);
      const answer = body?.response?.answer ?? null;
      const diagnostic = body?.diagnostic ?? {};
      const openAI = diagnostic.openAI ?? {};
      const timings = diagnostic.timings ?? {};
      const completedEnding = typeof answer === "string" && /[.!?](?:["'”’)}\]]+)?$/u.test(answer.trim());
      const corruptedEnding = typeof answer === "string" && (answer.includes("\uFFFD") || /(?:\p{Script=Arabic}|\p{Script=Cyrillic}|\p{Script=Hebrew}|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}){1,2}[.!?](?:["'”’)}\]]+)?$/u.test(answer.trim()));
      results.push({
        sequence,
        round: job.round,
        category: job.category,
        httpStatus: response.status,
        success: body?.ok === true && body?.action === "use_response" && body?.response?.source === "oracle-ai",
        fallbackReason: body?.reason ?? body?.response?.fallback?.reason ?? null,
        browserLatencyMs: Math.round((performance.now() - started) * 10) / 10,
        providerElapsedMs: timings.providerElapsedMs ?? null,
        inputTokens: openAI.usage?.inputTokens ?? null,
        outputTokens: openAI.usage?.outputTokens ?? null,
        reasoningTokens: openAI.usage?.reasoningTokens ?? null,
        outputTokenExhausted: openAI.outputTokenExhausted === true,
        answer,
        answerCharacters: typeof answer === "string" ? answer.length : 0,
        answerWords: typeof answer === "string" ? answer.trim().split(/\s+/).filter(Boolean).length : 0,
        completedEnding,
        corruptedEnding,
        safetyCategory: body?.response?.safety?.category ?? null,
        semanticIntent: body?.response?.presentation ? {
          emotion: body.response.presentation.emotion,
          intensity: body.response.presentation.intensity,
          delivery: body.response.presentation.delivery,
        } : null,
      });
    } catch (error) {
      results.push({ sequence, round: job.round, category: job.category, success: false, fallbackReason: "browser_request_error", error: error instanceof Error ? error.message : String(error) });
    }
    if ((index + 1) % 5 === 0 && index + 1 < jobs.length) {
      console.log("Waiting 65 seconds before next batch...");
      await wait(65_000);
    }
  }
  const successes = results.filter((result) => result.success);
  const summary = {
    total: results.length,
    validAISuccesses: successes.length,
    timeouts: results.filter((result) => result.fallbackReason === "timeout").length,
    malformed: results.filter((result) => result.fallbackReason === "malformed_output").length,
    schemaInvalid: results.filter((result) => result.fallbackReason === "validation_rejection").length,
    outputTokenExhaustion: results.filter((result) => result.outputTokenExhausted).length,
    incompleteOrCorruptedAcceptedAnswers: successes.filter((result) => !result.completedEnding || result.corruptedEnding).length,
    over320Characters: successes.filter((result) => result.answerCharacters > 320).length,
    exact320Characters: successes.filter((result) => result.answerCharacters === 320).length,
  };
  const report = {
    metadata: {
      createdAt: new Date().toISOString(),
      origin: location.origin,
      endpoint: "/api/oracle/intelligence/qualification/compact-standard",
      profile: "compact-standard",
      reasoning: "default",
      serviceTier: "standard",
      maxOutputTokens: 512,
      qualificationTimeoutMs: 5000,
      batchSize: 5,
      interBatchWaitSeconds: 65,
    },
    summary,
    results,
  };
  window.__QRYSTAL_COMPACT_COMPLETION__ = report;
  console.log("COMPACT COMPLETION QUALIFICATION COMPLETE");
  console.table([summary]);
  console.log(JSON.stringify(report, null, 2));
})();
