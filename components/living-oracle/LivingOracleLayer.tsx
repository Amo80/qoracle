"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useExperiencePreferences } from "@/components/experience/ExperiencePreferences";
import {
  INITIAL_CHARACTER_STATE,
  characterReducer,
  getCharacterTimings,
  type CharacterEvent,
  type CharacterState,
} from "@/lib/living-oracle/machine";
import { getCharacterManifest } from "@/lib/living-oracle/manifests";
import { getOracle, ORACLE_IDS, type OracleId } from "@/lib/oracles/registry";

const BUSY_SELECTOR = [
  ".shaking",
  ".love-stage-two",
  ".dnd-stage-two",
  ".eclipse-stage-two",
].join(",");

const ANSWER_SELECTOR = [
  ".result strong",
  ".love-answer-text",
  ".dnd-answer-text",
  ".eclipse-answer-overlay",
  ".chaos-answer-reveal",
].join(",");

function detectOracle(page: HTMLElement): OracleId | null {
  return ORACLE_IDS.find((oracleId) => page.classList.contains(`theme-${oracleId}`)) || null;
}

function hasRenderedAnswer(page: HTMLElement) {
  return Array.from(page.querySelectorAll<HTMLElement>(ANSWER_SELECTOR)).some(
    (element) => Boolean(element.textContent?.trim())
  );
}

export function LivingOracleLayer() {
  const { motion } = useExperiencePreferences();
  const [oracleId, setOracleId] = useState<OracleId | null>(null);
  const [character, setCharacter] = useState<CharacterState>(
    INITIAL_CHARACTER_STATE
  );
  const [assetStatus, setAssetStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const characterRef = useRef(character);
  const scheduledRef = useRef(new Set<string>());
  const timersRef = useRef<number[]>([]);

  const transition = useCallback((event: CharacterEvent) => {
    const next = characterReducer(characterRef.current, event);
    if (next !== characterRef.current) {
      characterRef.current = next;
      setCharacter(next);
    }
    return next;
  }, []);

  const schedule = useCallback(
    (key: string, delay: number, event: CharacterEvent) => {
      if (scheduledRef.current.has(key)) return;
      scheduledRef.current.add(key);
      const timer = window.setTimeout(() => {
        scheduledRef.current.delete(key);
        transition(event);
      }, delay);
      timersRef.current.push(timer);
    },
    [transition]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const timings = getCharacterTimings(motion);

    const synchronize = () => {
      const page = document.querySelector<HTMLElement>(".oracle-page");
      if (!page) {
        setOracleId(null);
        root.removeAttribute("data-living-oracle");
        root.removeAttribute("data-living-oracle-id");
        root.removeAttribute("data-living-oracle-phase");
        return;
      }

      const detected = detectOracle(page);
      if (!detected) return;
      setOracleId((current) => (current === detected ? current : detected));
      root.dataset.livingOracle = "true";
      root.dataset.livingOracleId = detected;

      const busy = Boolean(page.querySelector(BUSY_SELECTOR));
      const answered = hasRenderedAnswer(page);
      let current = characterRef.current;

      if (busy && (current.phase === "idle" || current.phase === "listening" || current.phase === "returning")) {
        current = transition({ type: "SUBMIT" });
        schedule(
          `${current.cycle}:awakened`,
          timings.awakening,
          { type: "AWAKENED", cycle: current.cycle }
        );
      }

      current = characterRef.current;
      if (
        answered &&
        (current.phase === "awakening" || current.phase === "anticipating")
      ) {
        current = transition({ type: "REVEAL", cycle: current.cycle });
        schedule(
          `${current.cycle}:speech`,
          timings.speaking,
          { type: "SPEECH_COMPLETE", cycle: current.cycle }
        );
        schedule(
          `${current.cycle}:reaction`,
          timings.speaking + timings.reaction,
          { type: "REACTION_COMPLETE", cycle: current.cycle }
        );
        schedule(
          `${current.cycle}:return`,
          timings.speaking + timings.reaction + timings.returning,
          { type: "RETURN_COMPLETE", cycle: current.cycle }
        );
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.closest(".oracle-page")) {
        transition({ type: "FOCUS" });
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.closest(".oracle-page")) {
        transition({ type: "BLUR" });
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        transition({ type: "HIDDEN" });
        return;
      }

      const resumed = transition({ type: "VISIBLE" });
      synchronize();
      if (resumed.phase === "awakening") {
        schedule(
          `${resumed.cycle}:awakened:resume`,
          timings.awakening,
          { type: "AWAKENED", cycle: resumed.cycle }
        );
      }
      if (resumed.phase === "speaking") {
        schedule(
          `${resumed.cycle}:speech:resume`,
          timings.speaking,
          { type: "SPEECH_COMPLETE", cycle: resumed.cycle }
        );
        schedule(
          `${resumed.cycle}:reaction:resume`,
          timings.speaking + timings.reaction,
          { type: "REACTION_COMPLETE", cycle: resumed.cycle }
        );
        schedule(
          `${resumed.cycle}:return:resume`,
          timings.speaking + timings.reaction + timings.returning,
          { type: "RETURN_COMPLETE", cycle: resumed.cycle }
        );
      }
    };

    synchronize();
    const observer = new MutationObserver(synchronize);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeAttribute("data-living-oracle");
      root.removeAttribute("data-living-oracle-id");
      root.removeAttribute("data-living-oracle-phase");
    };
  }, [motion, schedule, transition]);

  useEffect(() => {
    document.documentElement.dataset.livingOraclePhase = character.phase;
  }, [character.phase]);

  useEffect(() => {
    if (!oracleId) {
      setAssetStatus("idle");
      return;
    }

    let current = true;
    const manifest = getCharacterManifest(oracleId);
    const image = new Image();
    setAssetStatus("loading");
    image.onload = () => {
      if (!current) return;
      setAssetStatus("ready");
      transition({ type: "ASSET_READY" });
    };
    image.onerror = () => {
      if (!current) return;
      setAssetStatus("error");
      transition({ type: "ASSET_ERROR" });
    };
    image.src = manifest.primaryAsset;

    return () => {
      current = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [oracleId, transition]);

  if (!oracleId) return null;

  const oracle = getOracle(oracleId);
  return (
    <div
      className="living-oracle-shell"
      data-oracle={oracleId}
      data-phase={character.phase}
      data-asset-status={assetStatus}
    >
      <Link className="living-oracle-home" href="/">
        <span aria-hidden="true">←</span> Return to Homepage
      </Link>
      <div className="living-oracle-aura" aria-hidden="true" />
      <p className="qb-visually-hidden" aria-live="polite" aria-atomic="true">
        {oracle.name} Oracle: {character.phase.replace("-", " ")}
      </p>
    </div>
  );
}
