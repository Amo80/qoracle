"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { shouldLoadJester3D } from "@/lib/living-oracle/jester3d";
import { shouldLoadLove3D } from "@/lib/living-oracle/love3d";
import { shouldLoadDragon3D } from "@/lib/living-oracle/dragon3d";
import { detectWebGLSupport } from "@/lib/living-oracle/webgl";
import { getOracle, ORACLE_IDS, type OracleId } from "@/lib/oracles/registry";
import { Jester3DErrorBoundary } from "./jester/Jester3DErrorBoundary";
import { Love3DErrorBoundary } from "./love/Love3DErrorBoundary";
import { Dragon3DErrorBoundary } from "./dragon/Dragon3DErrorBoundary";

const LazyJester3DStage = lazy(() =>
  import("./jester/Jester3DStage").then((module) => ({
    default: module.Jester3DStage,
  }))
);

const LazyLove3DStage = lazy(() =>
  import("./love/Love3DStage").then((module) => ({ default: module.Love3DStage }))
);

const LazyDragon3DStage = lazy(() =>
  import("./dragon/Dragon3DStage").then((module) => ({ default: module.Dragon3DStage }))
);

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

export function LivingOracleLayer({
  jester3DEnabled = false,
  love3DEnabled = false,
  dragon3DEnabled = false,
}: {
  jester3DEnabled?: boolean;
  love3DEnabled?: boolean;
  dragon3DEnabled?: boolean;
}) {
  const { motion } = useExperiencePreferences();
  const [oracleId, setOracleId] = useState<OracleId | null>(null);
  const [character, setCharacter] = useState<CharacterState>(
    INITIAL_CHARACTER_STATE
  );
  const [assetStatus, setAssetStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [jesterTarget, setJesterTarget] = useState<HTMLElement | null>(null);
  const [loveTarget, setLoveTarget] = useState<HTMLElement | null>(null);
  const [dragonTarget, setDragonTarget] = useState<HTMLElement | null>(null);
  const [webGLSupported, setWebGLSupported] = useState(false);
  const [jester3DStatus, setJester3DStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [love3DStatus, setLove3DStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [dragon3DStatus, setDragon3DStatus] = useState<
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
        setJesterTarget(null);
        setLoveTarget(null);
        setDragonTarget(null);
        root.removeAttribute("data-living-oracle");
        root.removeAttribute("data-living-oracle-id");
        root.removeAttribute("data-living-oracle-phase");
        return;
      }

      const detected = detectOracle(page);
      if (!detected) return;
      setOracleId((current) => (current === detected ? current : detected));
      setJesterTarget((current) => {
        const target =
          detected === "jester"
            ? page.querySelector<HTMLElement>(".jester-crystal")
            : null;
        return current === target ? current : target;
      });
      setLoveTarget((current) => {
        const target = detected === "love" ? page : null;
        return current === target ? current : target;
      });
      setDragonTarget((current) => {
        const target = detected === "dnd" ? page : null;
        return current === target ? current : target;
      });
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

  useEffect(() => {
    if ((!jester3DEnabled && !love3DEnabled && !dragon3DEnabled) || motion === "reduced") {
      setWebGLSupported(false);
      return;
    }
    setWebGLSupported(detectWebGLSupport(document));
  }, [dragon3DEnabled, jester3DEnabled, love3DEnabled, motion]);

  const loadJester3D = shouldLoadJester3D({
    oracleId,
    livingOracleEnabled: true,
    jester3DEnabled,
    motion,
    webGLSupported,
  });
  const loadLove3D = shouldLoadLove3D({
    oracleId,
    livingOracleEnabled: true,
    love3DEnabled,
    motion,
    webGLSupported,
  });
  const loadDragon3D = shouldLoadDragon3D({
    oracleId,
    livingOracleEnabled: true,
    dragon3DEnabled,
    motion,
    webGLSupported,
  });

  useEffect(() => {
    if (!jesterTarget) return;
    jesterTarget.dataset.jester3dStatus = jester3DStatus;
    return () => {
      delete jesterTarget.dataset.jester3dStatus;
    };
  }, [jester3DStatus, jesterTarget]);

  useEffect(() => {
    setJester3DStatus(loadJester3D ? "loading" : "idle");
  }, [loadJester3D, jesterTarget]);

  useEffect(() => {
    if (!loveTarget) return;
    loveTarget.dataset.love3dStatus = love3DStatus;
    return () => { delete loveTarget.dataset.love3dStatus; };
  }, [love3DStatus, loveTarget]);

  useEffect(() => {
    setLove3DStatus(loadLove3D ? "loading" : "idle");
  }, [loadLove3D, loveTarget]);

  useEffect(() => {
    if (!dragonTarget) return;
    dragonTarget.dataset.dragon3dStatus = dragon3DStatus;
    return () => { delete dragonTarget.dataset.dragon3dStatus; };
  }, [dragon3DStatus, dragonTarget]);

  useEffect(() => {
    setDragon3DStatus(loadDragon3D ? "loading" : "idle");
  }, [dragonTarget, loadDragon3D]);

  const handleJesterReady = useCallback(() => {
    setJester3DStatus("ready");
    transition({ type: "ASSET_READY" });
  }, [transition]);

  const handleJesterError = useCallback(() => {
    setJester3DStatus("error");
    transition({ type: "ASSET_ERROR" });
  }, [transition]);

  const handleLoveReady = useCallback(() => {
    setLove3DStatus("ready");
    transition({ type: "ASSET_READY" });
  }, [transition]);

  const handleLoveError = useCallback(() => {
    setLove3DStatus("error");
    transition({ type: "ASSET_ERROR" });
  }, [transition]);

  const handleDragonReady = useCallback(() => {
    setDragon3DStatus("ready");
    transition({ type: "ASSET_READY" });
  }, [transition]);

  const handleDragonError = useCallback(() => {
    setDragon3DStatus("error");
    transition({ type: "ASSET_ERROR" });
  }, [transition]);

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
      {loadJester3D && jesterTarget && jester3DStatus !== "error" ? (
        <Jester3DErrorBoundary onError={handleJesterError}>
          <Suspense fallback={null}>
            <LazyJester3DStage
              target={jesterTarget}
              phase={character.phase}
              onReady={handleJesterReady}
              onError={handleJesterError}
            />
          </Suspense>
        </Jester3DErrorBoundary>
      ) : null}
      {loadLove3D && loveTarget && love3DStatus !== "error" ? (
        <Love3DErrorBoundary onError={handleLoveError}>
          <Suspense fallback={null}>
            <LazyLove3DStage
              target={loveTarget}
              phase={character.phase}
              onReady={handleLoveReady}
              onError={handleLoveError}
            />
          </Suspense>
        </Love3DErrorBoundary>
      ) : null}
      {loadDragon3D && dragonTarget && dragon3DStatus !== "error" ? (
        <Dragon3DErrorBoundary onError={handleDragonError}>
          <Suspense fallback={null}>
            <LazyDragon3DStage
              target={dragonTarget}
              phase={character.phase}
              onReady={handleDragonReady}
              onError={handleDragonError}
            />
          </Suspense>
        </Dragon3DErrorBoundary>
      ) : null}
      <p className="qb-visually-hidden" aria-live="polite" aria-atomic="true">
        {oracle.name} Oracle: {character.phase.replace("-", " ")}
      </p>
    </div>
  );
}
