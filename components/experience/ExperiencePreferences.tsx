"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_EXPERIENCE_PREFERENCES,
  initializeExperiencePreferences,
  persistExperiencePreferences,
  type AudioPreference,
  type MotionPreference,
} from "@/lib/experience/preferences";

type ExperiencePreferencesValue = {
  motion: MotionPreference;
  audio: AudioPreference;
  setMotion: (preference: MotionPreference) => void;
  setAudio: (preference: AudioPreference) => void;
};

const ExperiencePreferencesContext =
  createContext<ExperiencePreferencesValue | null>(null);

export function ExperiencePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(
    DEFAULT_EXPERIENCE_PREFERENCES
  );
  const [initialized, setInitialized] = useState(false);
  const { motion, audio } = preferences;

  useEffect(() => {
    setPreferences(
      initializeExperiencePreferences({
        storage: window.localStorage,
        prefersReducedMotion: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches,
      })
    );
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    document.documentElement.dataset.motion = motion;
    document.documentElement.dataset.audio = audio;
    persistExperiencePreferences(window.localStorage, preferences);

    const syncAudio = () => {
      document.querySelectorAll("audio").forEach((element) => {
        element.muted = audio === "off";
        if (audio === "off") element.pause();
      });
    };

    syncAudio();
    const observer = new MutationObserver(syncAudio);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [initialized, preferences, motion, audio]);

  const setMotion = useCallback((preference: MotionPreference) => {
    setPreferences((current) => ({ ...current, motion: preference }));
  }, []);

  const setAudio = useCallback((preference: AudioPreference) => {
    setPreferences((current) => ({ ...current, audio: preference }));
  }, []);

  const value = useMemo(
    () => ({ motion, audio, setMotion, setAudio }),
    [motion, audio, setMotion, setAudio]
  );

  return (
    <ExperiencePreferencesContext.Provider value={value}>
      {children}
    </ExperiencePreferencesContext.Provider>
  );
}

export function useExperiencePreferences() {
  const value = useContext(ExperiencePreferencesContext);

  if (!value) {
    throw new Error(
      "useExperiencePreferences must be used inside ExperiencePreferencesProvider"
    );
  }

  return value;
}
