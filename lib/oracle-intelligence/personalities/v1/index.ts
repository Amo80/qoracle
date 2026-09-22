import type { OracleId } from "../../../oracles/registry";
import { CHAOS_PERSONALITY_V1 } from "./chaos";
import { DUNGEON_PERSONALITY_V1 } from "./dungeon";
import { ECLIPSE_PERSONALITY_V1 } from "./eclipse";
import { JESTER_PERSONALITY_V1 } from "./jester";
import { LOVE_PERSONALITY_V1 } from "./love";

export const ORACLE_PERSONALITIES_V1 = {
  jester: JESTER_PERSONALITY_V1,
  love: LOVE_PERSONALITY_V1,
  dnd: DUNGEON_PERSONALITY_V1,
  chaos: CHAOS_PERSONALITY_V1,
  eclipse: ECLIPSE_PERSONALITY_V1,
} as const;

export function getOraclePersonalityV1(oracleId: OracleId) {
  return ORACLE_PERSONALITIES_V1[oracleId];
}
