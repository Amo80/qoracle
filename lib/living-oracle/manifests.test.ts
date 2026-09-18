import { describe, expect, it } from "vitest";
import { ORACLE_IDS } from "../oracles/registry";
import {
  CHARACTER_MANIFESTS,
  getSelectedCharacterAssets,
} from "./manifests";

describe("Living Oracle character manifests", () => {
  it("preserves all five production identities including Dragon as dnd", () => {
    expect(Object.keys(CHARACTER_MANIFESTS)).toEqual([...ORACLE_IDS]);
    expect(CHARACTER_MANIFESTS.dnd.oracleId).toBe("dnd");
  });

  it("loads assets for only the selected Oracle", () => {
    const assets = getSelectedCharacterAssets("jester");
    expect(assets).toEqual(["/themes/jester-oracle.png"]);
    expect(assets).not.toContain(CHARACTER_MANIFESTS.chaos.primaryAsset);
    expect(assets).not.toContain(CHARACTER_MANIFESTS.love.primaryAsset);
  });

  it("reserves the full performance vocabulary for the Jester vertical slice", () => {
    expect(CHARACTER_MANIFESTS.jester.capabilities).toContain(
      "apparent-speaking"
    );
    for (const oracleId of ["chaos", "love", "eclipse", "dnd"] as const) {
      expect(CHARACTER_MANIFESTS[oracleId].capabilities).not.toContain(
        "apparent-speaking"
      );
    }
  });
});
