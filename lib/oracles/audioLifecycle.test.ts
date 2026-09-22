import { describe, expect, it, vi } from "vitest";
import { stopOracleAudio, type OracleAudio } from "./audioLifecycle";

describe("Oracle audio lifecycle", () => {
  it("pauses and rewinds every mounted Oracle audio element", () => {
    const first = { pause: vi.fn(), currentTime: 18 };
    const second = { pause: vi.fn(), currentTime: 4 };
    stopOracleAudio([first, null, second]);
    expect(first.pause).toHaveBeenCalledOnce();
    expect(second.pause).toHaveBeenCalledOnce();
    expect(first.currentTime).toBe(0);
    expect(second.currentTime).toBe(0);
  });

  it("keeps teardown nonfatal when an unloaded media element rejects seeking", () => {
    const audio = {
      pause: vi.fn(),
      set currentTime(_value: number) { throw new Error("metadata unavailable"); },
      get currentTime() { return 0; },
    } satisfies OracleAudio;
    expect(() => stopOracleAudio([audio])).not.toThrow();
    expect(audio.pause).toHaveBeenCalledOnce();
  });
});
