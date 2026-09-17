"use client";

import { useExperiencePreferences } from "./ExperiencePreferences";

export function ExperienceControls() {
  const { audio, motion, setAudio, setMotion } = useExperiencePreferences();

  return (
    <aside className="experience-controls" aria-label="Experience settings">
      <button
        type="button"
        aria-pressed={audio === "off"}
        onClick={() => setAudio(audio === "on" ? "off" : "on")}
      >
        {audio === "on" ? "Sound on" : "Sound off"}
      </button>
      <button
        type="button"
        aria-pressed={motion === "reduced"}
        onClick={() => setMotion(motion === "full" ? "reduced" : "full")}
      >
        {motion === "full" ? "Motion on" : "Motion reduced"}
      </button>
    </aside>
  );
}
