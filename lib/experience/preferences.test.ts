import { describe, expect, it, vi } from "vitest";
import {
  EXPERIENCE_PREFERENCES_STORAGE_KEY,
  initializeExperiencePreferences,
  parseStoredPreferences,
  persistExperiencePreferences,
  resolveInitialPreferences,
} from "./preferences";

function createStorage(value: string | null) {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  };
}

describe("ExperiencePreferences initialization", () => {
  it("protects a stored audio preference", () => {
    const preferences = resolveInitialPreferences({
      rawValue: JSON.stringify({ audio: "off" }),
      prefersReducedMotion: false,
    });

    expect(preferences).toEqual({ audio: "off", motion: "full" });
  });

  it("protects a stored motion preference over the system fallback", () => {
    expect(
      resolveInitialPreferences({
        rawValue: JSON.stringify({ motion: "full" }),
        prefersReducedMotion: true,
      }).motion
    ).toBe("full");
    expect(
      resolveInitialPreferences({
        rawValue: JSON.stringify({ motion: "reduced" }),
        prefersReducedMotion: false,
      }).motion
    ).toBe("reduced");
  });

  it("uses prefers-reduced-motion when no stored motion choice exists", () => {
    expect(
      resolveInitialPreferences({
        rawValue: null,
        prefersReducedMotion: true,
      })
    ).toEqual({ audio: "on", motion: "reduced" });
  });

  it("handles missing, malformed, and invalid stored data safely", () => {
    expect(parseStoredPreferences(null)).toEqual({});
    expect(parseStoredPreferences("{not-json")).toEqual({});
    expect(
      parseStoredPreferences(JSON.stringify({ audio: "loud", motion: 7 }))
    ).toEqual({});
  });

  it("reads existing storage without overwriting it during initialization", () => {
    const storage = createStorage(
      JSON.stringify({ audio: "off", motion: "reduced" })
    );

    const initialized = initializeExperiencePreferences({
      storage,
      prefersReducedMotion: false,
    });

    expect(storage.getItem).toHaveBeenCalledWith(
      EXPERIENCE_PREFERENCES_STORAGE_KEY
    );
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(initialized).toEqual({ audio: "off", motion: "reduced" });

    persistExperiencePreferences(storage, initialized);
    expect(storage.setItem).toHaveBeenCalledWith(
      EXPERIENCE_PREFERENCES_STORAGE_KEY,
      JSON.stringify(initialized)
    );
  });

  it("falls back safely when localStorage access throws", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(),
    };

    expect(
      initializeExperiencePreferences({
        storage,
        prefersReducedMotion: true,
      })
    ).toEqual({ audio: "on", motion: "reduced" });
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
