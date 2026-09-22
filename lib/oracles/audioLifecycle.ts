export type OracleAudio = Pick<HTMLAudioElement, "pause" | "currentTime">;

export function stopOracleAudio(elements: readonly (OracleAudio | null)[]) {
  for (const element of elements) {
    if (!element) continue;
    element.pause();
    try {
      element.currentTime = 0;
    } catch {
      // Some browser media implementations reject seeks before metadata loads.
    }
  }
}
