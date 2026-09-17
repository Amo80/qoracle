export type MotionPreference = "full" | "reduced";
export type AudioPreference = "on" | "off";

export type ExperiencePreferences = Readonly<{
  motion: MotionPreference;
  audio: AudioPreference;
}>;

export type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export const EXPERIENCE_PREFERENCES_STORAGE_KEY =
  "qrystal-experience-preferences-v1";

export const DEFAULT_EXPERIENCE_PREFERENCES: ExperiencePreferences = {
  motion: "full",
  audio: "on",
};

export function parseStoredPreferences(
  rawValue: string | null
): Partial<ExperiencePreferences> {
  if (!rawValue) return {};

  try {
    const value: unknown = JSON.parse(rawValue);
    if (!value || typeof value !== "object") return {};

    const candidate = value as Record<string, unknown>;
    return {
      ...(candidate.motion === "full" || candidate.motion === "reduced"
        ? { motion: candidate.motion }
        : {}),
      ...(candidate.audio === "on" || candidate.audio === "off"
        ? { audio: candidate.audio }
        : {}),
    };
  } catch {
    return {};
  }
}

export function resolveInitialPreferences({
  rawValue,
  prefersReducedMotion,
}: {
  rawValue: string | null;
  prefersReducedMotion: boolean;
}): ExperiencePreferences {
  const stored = parseStoredPreferences(rawValue);

  return {
    motion:
      stored.motion || (prefersReducedMotion ? "reduced" : "full"),
    audio: stored.audio || "on",
  };
}

export function initializeExperiencePreferences({
  storage,
  prefersReducedMotion,
}: {
  storage: PreferenceStorage;
  prefersReducedMotion: boolean;
}): ExperiencePreferences {
  let rawValue: string | null = null;

  try {
    rawValue = storage.getItem(EXPERIENCE_PREFERENCES_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }

  return resolveInitialPreferences({ rawValue, prefersReducedMotion });
}

export function persistExperiencePreferences(
  storage: PreferenceStorage,
  preferences: ExperiencePreferences
) {
  try {
    storage.setItem(
      EXPERIENCE_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  } catch {
    // Preferences remain active for the current visit when storage is blocked.
  }
}
