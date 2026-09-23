"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Clock,
  Color,
  DirectionalLight,
  Group,
  LoopOnce,
  LoopRepeat,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  JESTER_BALL_PRESENTATION,
  JESTER_3D_MANIFEST,
  getJesterAnimationPlan,
} from "@/lib/living-oracle/jester3d";
import type { CharacterPhase } from "@/lib/living-oracle/machine";
import type { JesterPresentation } from "@/lib/oracle-intelligence/types";

type Jester3DStageProps = Readonly<{
  target: HTMLElement;
  phase: CharacterPhase;
  presentation?: JesterPresentation | null;
  onReady: () => void;
  onError: () => void;
}>;

type JesterController = Readonly<{
  setPhase: (phase: CharacterPhase) => void;
  setPresentation: (presentation: JesterPresentation | null) => void;
  dispose: () => void;
}>;

const clipPaths: Readonly<Record<string, string>> = {
  Talk_with_Hands_Open: JESTER_3D_MANIFEST.clips.speaking.path,
  Big_Heart_Gesture: JESTER_3D_MANIFEST.clips.positiveReaction.path,
};

function disposeObject(root: Object3D) {
  const textures = new Set<Texture>();
  const materials = new Set<Material>();

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const meshMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of meshMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value);
      }
    }
  });

  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}

async function createJesterController({
  canvas,
  container,
  initialPhase,
  onReady,
  onError,
  initialPresentation,
}: {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  initialPhase: CharacterPhase;
  onReady: () => void;
  onError: () => void;
  initialPresentation: JesterPresentation | null;
}): Promise<JesterController> {
  let disposed = false;
  let currentPhase = initialPhase;
  let currentAction: AnimationAction | null = null;
  let requestedClip = "";
  let presentation = initialPresentation;
  const loader = new GLTFLoader();
  const clock = new Clock();
  const actions = new Map<string, AnimationAction>();
  const clipPromises = new Map<string, Promise<AnimationClip>>();
  const reportActiveError = () => {
    if (!disposed) onError();
  };
  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  const characterGroup = new Group();
  const ballGroup = new Group();
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(new Color(0x000000), 0);

  camera.position.set(0, 0.95, 3.45);
  camera.lookAt(0, 0.92, 0);
  scene.add(new AmbientLight(0xffe8ce, 1.65));
  const keyLight = new DirectionalLight(0xffd68a, 2.4);
  keyLight.position.set(2.4, 3.1, 3.8);
  scene.add(keyLight);
  const fillLight = new DirectionalLight(0x8759ff, 1.8);
  fillLight.position.set(-2.6, 1.8, 2.2);
  scene.add(fillLight);
  scene.add(characterGroup, ballGroup);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const contextLost = (event: Event) => {
    event.preventDefault();
    onError();
  };
  canvas.addEventListener("webglcontextlost", contextLost);

  let base: GLTF;
  let ball: GLTF;
  try {
    [base, ball] = await Promise.all([
      loader.loadAsync(JESTER_3D_MANIFEST.model),
      loader.loadAsync(JESTER_3D_MANIFEST.crystalBall),
    ]);
  } catch (error) {
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    renderer.dispose();
    throw error;
  }
  if (disposed) {
    disposeObject(base.scene);
    disposeObject(ball.scene);
    throw new Error("Jester stage disposed while loading.");
  }

  characterGroup.add(base.scene);
  characterGroup.position.set(0, 0, 0);
  characterGroup.scale.setScalar(1.02);
  ballGroup.add(ball.scene);
  ballGroup.position.set(
    JESTER_BALL_PRESENTATION.position.x,
    JESTER_BALL_PRESENTATION.position.y,
    JESTER_BALL_PRESENTATION.position.z
  );
  ballGroup.scale.setScalar(JESTER_BALL_PRESENTATION.scale);

  ball.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      material.emissive.set(0x6f35b5);
      material.emissiveIntensity = 0.4;
    }
  });

  const ballMaterials: MeshStandardMaterial[] = [];
  ball.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) ballMaterials.push(material);
    }
  });

  const mixer = new AnimationMixer(base.scene);
  const idle = base.animations.find(
    (clip) => clip.name === JESTER_3D_MANIFEST.clips.idle.name
  );
  if (!idle) {
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    disposeObject(base.scene);
    disposeObject(ball.scene);
    renderer.dispose();
    throw new Error("Optimized Jester is missing Idle_9.");
  }
  actions.set(idle.name, mixer.clipAction(idle, base.scene));

  const loadClip = (name: string) => {
    const existing = clipPromises.get(name);
    if (existing) return existing;
    const path = clipPaths[name];
    if (!path) return Promise.reject(new Error(`Unapproved Jester clip: ${name}`));
    const promise = loader.loadAsync(path).then((gltf) => {
      const clip = gltf.animations.find((candidate) => candidate.name === name);
      if (!clip) throw new Error(`Jester animation ${name} is missing.`);
      return clip;
    });
    clipPromises.set(name, promise);
    return promise;
  };

  const playPhase = async (phase: CharacterPhase) => {
    currentPhase = phase;
    const plan = getJesterAnimationPlan(phase);
    mixer.timeScale = plan.pause ? 0 : 1;
    if (!plan.clip || plan.pause) return;
    requestedClip = plan.clip;

    // Heart is the next bounded presentation state. Warm its tiny animation
    // asset while speaking so network latency cannot consume the reaction.
    if (phase === "speaking") {
      void loadClip(JESTER_3D_MANIFEST.clips.positiveReaction.name).catch(
        reportActiveError
      );
    }

    let action = actions.get(plan.clip);
    if (!action) {
      const clip = await loadClip(plan.clip);
      if (disposed || requestedClip !== plan.clip || currentPhase !== phase) return;
      action = mixer.clipAction(clip, base.scene);
      actions.set(plan.clip, action);
    }

    if (action === currentAction) return;
    action.enabled = true;
    action.reset();
    action.time = Math.min(plan.startAtSeconds, action.getClip().duration);
    const performanceScale = presentation
      ? (presentation.intensity === 1 ? 0.92 : presentation.intensity === 3 ? 1.12 : 1) *
        (presentation.delivery === "theatrical" ? 1.05 : presentation.delivery === "sincere" ? 0.96 : 1)
      : 1;
    action.setEffectiveTimeScale(plan.timeScale * performanceScale);
    action.setLoop(plan.loop ? LoopRepeat : LoopOnce, plan.loop ? Infinity : 1);
    action.clampWhenFinished = !plan.loop;
    action.play();
    if (currentAction) currentAction.crossFadeTo(action, plan.crossFadeSeconds, true);
    currentAction = action;
  };

  let elapsed = 0;
  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (currentPhase !== "paused") {
      elapsed += delta;
      mixer.update(delta);
      const intensity =
        currentPhase === "awakening" || currentPhase === "reacting" ? 1.45 : 1;
      ballGroup.position.y =
        JESTER_BALL_PRESENTATION.position.y +
        Math.sin(elapsed * 1.7) *
          JESTER_BALL_PRESENTATION.floatAmplitude *
          intensity;
      ballGroup.rotation.y += delta * 0.34 * intensity;
      ballGroup.rotation.z = Math.sin(elapsed * 0.7) * 0.035;
      const ballEnergy = !presentation
        ? 0.4
        : presentation.environment === "ball_low"
          ? 0.32
          : presentation.environment === "ball_bright"
            ? 0.68
            : 0.48;
      const emissiveIntensity = presentation ? ballEnergy * intensity : 0.4;
      for (const material of ballMaterials) material.emissiveIntensity = emissiveIntensity;
    }
    renderer.render(scene, camera);
  };

  await playPhase(initialPhase);
  renderer.setAnimationLoop(render);
  render();
  onReady();

  return {
    setPhase(phase) {
      if (disposed) return;
      if (phase === "paused") {
        currentPhase = phase;
        mixer.timeScale = 0;
        renderer.setAnimationLoop(null);
        renderer.render(scene, camera);
        return;
      }
      if (currentPhase === "paused") {
        clock.start();
        renderer.setAnimationLoop(render);
      }
      void playPhase(phase).catch(reportActiveError);
    },
    setPresentation(nextPresentation) {
      presentation = nextPresentation;
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      mixer.stopAllAction();
      disposeObject(base.scene);
      disposeObject(ball.scene);
      renderer.dispose();
    },
  };
}

export function Jester3DStage({
  target,
  phase,
  presentation = null,
  onReady,
  onError,
}: Jester3DStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<JesterController | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    let controller: JesterController | null = null;

    void createJesterController({
      canvas,
      container: target,
      initialPhase: phase,
      onReady,
      onError,
      initialPresentation: presentation,
    })
      .then((created) => {
        if (!active) {
          created.dispose();
          return;
        }
        controller = created;
        controllerRef.current = created;
      })
      .catch(() => {
        if (active) onError();
      });

    return () => {
      active = false;
      controller?.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
    // A new target represents a new Oracle mount; phase changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError, onReady, target]);

  useEffect(() => {
    controllerRef.current?.setPhase(phase);
  }, [phase]);

  useEffect(() => {
    controllerRef.current?.setPresentation(presentation);
  }, [presentation]);

  return createPortal(
    <div className="jester-3d-stage" aria-hidden="true">
      <canvas ref={canvasRef} tabIndex={-1} />
    </div>,
    target
  );
}
