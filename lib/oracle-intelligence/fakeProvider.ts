import { validateProviderOutput } from "./schema";
import type { OracleIntelligenceRequestV1, ProviderOracleOutputV1 } from "./types";
import type { OracleIntelligenceProvider, ProviderResult } from "./provider";

export type FakeProviderFixture =
  | "valid"
  | "timeout"
  | "provider_failure"
  | "benign_refusal"
  | "safety_response"
  | "malformed"
  | "wrong_oracle"
  | "oversized_answer"
  | "invalid_cue";

const ANSWERS = {
  jester: "A contradiction has slipped into your question wearing a very convincing hat. Laugh at it once, then choose the answer that still makes sense when the costume falls away.",
  love: "Your heart is asking for closeness, but closeness without honesty becomes a beautiful locked door. Speak clearly, listen carefully, and let mutual respect decide what opens next.",
  dnd: "The trial before you does not demand reckless courage. Gather what you know, prepare for what you do not, and take the next deliberate step like a guardian entering ancient ground.",
  chaos: "The straight road is arguing loudly for your attention, which is exactly why the side path matters. Change one assumption, watch what rearranges itself, and keep the insight that survives.",
  eclipse: "One truth asks you to advance while another asks you to wait. Honor both long enough to see their consequences, then choose the measured action that preserves possibility without surrendering yourself.",
} as const;

const PRESENTATIONS = {
  jester: { oracleId: "jester", emotion: "mischievous", intensity: 2, delivery: "teasing", gesture: "open_hands", reveal: "standard", reaction: "playful", environment: "ball_standard" },
  love: { oracleId: "love", emotion: "warm", intensity: 2, delivery: "tender", gesture: "gentle_present", reveal: "standard", reaction: "warm", environment: "heart_standard" },
  dnd: { oracleId: "dnd", emotion: "watchful", intensity: 2, delivery: "mythic", gesture: "guardian_focus", reveal: "dramatic", reaction: "restrained", environment: "d20_standard" },
  chaos: { oracleId: "chaos", emotion: "strange", intensity: 2, delivery: "lateral", gesture: "controlled_instability", reveal: "dramatic", reaction: "restrained_burst", environment: "orbit_standard" },
  eclipse: { oracleId: "eclipse", emotion: "contemplative", intensity: 2, delivery: "dual", gesture: "celestial_guidance", reveal: "dramatic", reaction: "restrained", environment: "balanced" },
} as const;

function validOutput(request: OracleIntelligenceRequestV1): ProviderOracleOutputV1 {
  return {
    schemaVersion: "1",
    oracleId: request.oracleId,
    answer: ANSWERS[request.oracleId],
    presentation: { ...PRESENTATIONS[request.oracleId] },
    safety: { category: "standard", deliveryMode: "in_character" },
  };
}

export class DeterministicFakeOracleProvider implements OracleIntelligenceProvider {
  constructor(private readonly fixture: FakeProviderFixture = "valid") {}

  async generate(request: OracleIntelligenceRequestV1, signal: AbortSignal): Promise<ProviderResult> {
    if (signal.aborted) return { ok: false, kind: "cancelled" };
    if (this.fixture === "timeout") return { ok: false, kind: "timeout" };
    if (this.fixture === "provider_failure") return { ok: false, kind: "provider_error" };
    if (this.fixture === "benign_refusal") return { ok: false, kind: "refusal", safetyCategory: "standard" };
    if (this.fixture === "safety_response") return { ok: false, kind: "refusal", safetyCategory: "crisis" };

    const output: unknown = validOutput(request);
    if (this.fixture === "malformed") return { ok: false, kind: "malformed_output" };
    if (this.fixture === "wrong_oracle") (output as { oracleId: string }).oracleId = request.oracleId === "love" ? "jester" : "love";
    if (this.fixture === "oversized_answer") (output as { answer: string }).answer = `${"word ".repeat(71)}.`;
    if (this.fixture === "invalid_cue") (output as { presentation: { gesture: string } }).presentation.gesture = "rotate_bone_42";
    const validated = validateProviderOutput(output, request.oracleId);
    return validated.ok
      ? { ok: true, output: validated.value }
      : { ok: false, kind: "malformed_output" };
  }
}
