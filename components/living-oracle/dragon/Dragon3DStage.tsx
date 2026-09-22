"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  Euler,
  Group,
  Material,
  Mesh,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  DRAGON_3D_MANIFEST,
  DUNGEON_MAGIC_LIGHTING,
  DRAGON_PROCEDURAL_ALLOWLIST,
  DRAGON_SCENE_PRESENTATION,
  DUNGEON_D20_PRESENTATION,
  getDragonCameraDistance,
  getDragonPoseMagnitude,
  getDragonPresentation,
  type DragonProceduralBone,
} from "@/lib/living-oracle/dragon3d";
import type { CharacterPhase } from "@/lib/living-oracle/machine";

type Props = Readonly<{
  target: HTMLElement;
  phase: CharacterPhase;
  onReady: () => void;
  onError: () => void;
}>;
type Controller = Readonly<{
  setPhase: (phase: CharacterPhase) => void;
  dispose: () => void;
}>;

function disposeObject(root: Object3D) {
  const textures = new Set<Texture>();
  const materials = new Set<Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value);
      }
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}

function scaleToSpan(min: number, max: number, target: number) {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) throw new Error("Dungeon scene asset has invalid bounds.");
  return target / span;
}

function normalizeByHeight(
  root: Object3D,
  group: Group,
  target: { height: number; floorY: number; centerX: number; centerZ: number }
) {
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const scale = scaleToSpan(bounds.min.y, bounds.max.y, target.height);
  group.add(root);
  group.scale.setScalar(scale);
  group.position.set(
    target.centerX - center.x * scale,
    target.floorY - bounds.min.y * scale,
    target.centerZ - center.z * scale
  );
  return scale;
}

function normalizeByWidth(
  root: Object3D,
  group: Group,
  target: { width: number; centerX: number; centerY: number; centerZ: number }
) {
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const scale = scaleToSpan(bounds.min.x, bounds.max.x, target.width);
  group.add(root);
  group.scale.setScalar(scale);
  group.position.set(
    target.centerX - center.x * scale,
    target.centerY - center.y * scale,
    target.centerZ - center.z * scale
  );
  return scale;
}

async function createController({ canvas, container, initialPhase, onReady, onError, isActive }: {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  initialPhase: CharacterPhase;
  onReady: () => void;
  onError: () => void;
  isActive: () => boolean;
}): Promise<Controller> {
  let disposed = false;
  let phase = initialPhase;
  let phaseElapsed = 0;
  let elapsed = 0;
  let d20Spin = 0;
  const loader = new GLTFLoader();
  const clock = new Clock();
  const scene = new Scene();
  const camera = new PerspectiveCamera(DRAGON_SCENE_PRESENTATION.camera.fieldOfView, 1, 0.1, 100);
  const dragonGroup = new Group();
  const d20Group = new Group();
  const altarGroup = new Group();
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(new Color(0), 0);
  // Match the neutral/warm qualification lighting that preserved the D20's
  // black, purple, and gold material separation.
  scene.add(new AmbientLight(0xe8d9ff, 2.3));
  const key = new DirectionalLight(0xffd5a6, 4.5);
  key.position.set(4, 6, 5);
  scene.add(key);
  const fill = new DirectionalLight(0x8b5cff, 3.2);
  fill.position.set(-4, 3, -3);
  scene.add(fill, dragonGroup, altarGroup, d20Group);

  let compositionBounds: Box3 | null = null;
  const resize = () => {
    const bounds = container.getBoundingClientRect();
    const width = bounds.width > 1 ? bounds.width : Math.max(1, window.innerWidth);
    const height = bounds.height > 1 ? bounds.height : Math.max(1, window.innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (compositionBounds) {
      const size = compositionBounds.getSize(new Vector3());
      const center = compositionBounds.getCenter(new Vector3());
      const distance = getDragonCameraDistance({ width: size.x, height: size.y, aspect: camera.aspect });
      const targetY = center.y + DRAGON_SCENE_PRESENTATION.camera.verticalTargetOffset;
      camera.position.set(center.x, targetY, compositionBounds.max.z + distance);
      camera.lookAt(center.x, targetY, center.z);
    }
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

  let dragon: GLTF;
  let d20: GLTF;
  let altar: GLTF;
  try {
    // Prioritize the guardian download; the independent focal objects follow.
    dragon = await loader.loadAsync(DRAGON_3D_MANIFEST.model);
    if (!isActive()) {
      disposeObject(dragon.scene);
      throw new Error("Dungeon stage superseded while loading the Dragon.");
    }
    [d20, altar] = await Promise.all([
      loader.loadAsync(DRAGON_3D_MANIFEST.d20),
      loader.loadAsync(DRAGON_3D_MANIFEST.altar),
    ]);
  } catch (error) {
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    renderer.dispose();
    throw error;
  }
  if (disposed || !isActive()) {
    disposeObject(dragon.scene);
    disposeObject(d20.scene);
    disposeObject(altar.scene);
    throw new Error("Dungeon stage disposed while loading.");
  }

  normalizeByHeight(dragon.scene, dragonGroup, DRAGON_SCENE_PRESENTATION.dragon);
  normalizeByHeight(altar.scene, altarGroup, DRAGON_SCENE_PRESENTATION.altar);
  const d20BaseScale = normalizeByWidth(d20.scene, d20Group, DRAGON_SCENE_PRESENTATION.d20);
  const d20BaseY = d20Group.position.y;
  const idleQuaternion = new Quaternion().setFromEuler(new Euler(
    DUNGEON_D20_PRESENTATION.idleEuler.x,
    DUNGEON_D20_PRESENTATION.idleEuler.y,
    DUNGEON_D20_PRESENTATION.idleEuler.z,
    "XYZ"
  ));
  const revealQuaternion = new Quaternion().setFromEuler(new Euler(
    DUNGEON_D20_PRESENTATION.revealEuler.x,
    DUNGEON_D20_PRESENTATION.revealEuler.y,
    DUNGEON_D20_PRESENTATION.revealEuler.z,
    "XYZ"
  ));
  const spinAxis = new Vector3(
    DUNGEON_D20_PRESENTATION.spinAxis.x,
    DUNGEON_D20_PRESENTATION.spinAxis.y,
    DUNGEON_D20_PRESENTATION.spinAxis.z
  ).normalize();
  let phaseStartD20 = idleQuaternion.clone();

  scene.updateMatrixWorld(true);
  compositionBounds = new Box3()
    .setFromObject(dragonGroup)
    .union(new Box3().setFromObject(altarGroup))
    .union(new Box3().setFromObject(d20Group));
  resize();

  // Preserve the qualified assets' original opaque PBR materials. Lifecycle
  // magic is external lighting so gold numerals and dark facets stay readable.
  const d20MagicLight = new PointLight(
    DUNGEON_MAGIC_LIGHTING.d20.color,
    0,
    DUNGEON_MAGIC_LIGHTING.d20.distance,
    DUNGEON_MAGIC_LIGHTING.d20.decay
  );
  const altarMagicLight = new PointLight(
    DUNGEON_MAGIC_LIGHTING.altar.color,
    0,
    DUNGEON_MAGIC_LIGHTING.altar.distance,
    DUNGEON_MAGIC_LIGHTING.altar.decay
  );
  d20Group.add(d20MagicLight);
  altarGroup.add(altarMagicLight);

  const bones = new Map<DragonProceduralBone, Object3D>();
  dragon.scene.traverse((object) => {
    if (!DRAGON_PROCEDURAL_ALLOWLIST.includes(object.name as DragonProceduralBone)) return;
    const name = object.name as DragonProceduralBone;
    bones.set(name, object);
  });
  const missing = DRAGON_PROCEDURAL_ALLOWLIST.filter((name) => !bones.has(name));
  if (missing.length) {
    disposeObject(dragon.scene); disposeObject(d20.scene); disposeObject(altar.scene);
    resizeObserver.disconnect(); canvas.removeEventListener("webglcontextlost", contextLost); renderer.dispose();
    throw new Error(`Dragon rig is missing qualified bones: ${missing.join(", ")}`);
  }

  const saved = new Map<DragonProceduralBone, Quaternion>();
  for (const name of DRAGON_PROCEDURAL_ALLOWLIST) saved.set(name, new Quaternion());
  const offset = new Quaternion();
  const euler = new Euler(0, 0, 0, "XYZ");
  const spinQuaternion = new Quaternion();
  const smoothstep = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (phase !== "paused") { elapsed += delta; phaseElapsed += delta; }
    const presentation = getDragonPresentation(phase, phaseElapsed);
    canvas.dataset.dragonPhase = phase;
    canvas.dataset.dragonPhaseElapsed = phaseElapsed.toFixed(3);
    canvas.dataset.dragonPoseMagnitude = getDragonPoseMagnitude(presentation).toFixed(5);

    for (const [name, quaternion] of saved) quaternion.copy(bones.get(name)!.quaternion);
    for (const [name, value] of presentation.bones) {
      const bone = bones.get(name)!;
      euler.set(value.x, value.y, value.z, "XYZ");
      offset.setFromEuler(euler);
      bone.quaternion.multiply(offset);
    }

    if (!["reacting", "returning", "paused", "asset-error"].includes(phase)) {
      d20Spin += delta * presentation.d20Speed;
      spinQuaternion.setFromAxisAngle(spinAxis, d20Spin);
      d20Group.quaternion.copy(idleQuaternion).multiply(spinQuaternion);
    } else if (phase === "reacting") {
      d20Group.quaternion.copy(phaseStartD20).slerp(revealQuaternion, smoothstep(phaseElapsed / 0.65));
    } else if (phase === "returning") {
      d20Group.quaternion.copy(phaseStartD20).slerp(idleQuaternion, smoothstep(phaseElapsed / 0.45));
    }
    const float = Math.sin(elapsed * 1.65) * (0.012 + presentation.d20Pulse);
    d20Group.position.y = d20BaseY + presentation.d20Lift + float;
    const pulse = 1 + Math.sin(elapsed * 3.4) * presentation.d20Pulse;
    d20Group.scale.setScalar(d20BaseScale * pulse);
    d20MagicLight.intensity =
      presentation.d20Glow * DUNGEON_MAGIC_LIGHTING.d20.idleScale;
    altarMagicLight.intensity =
      presentation.altarGlow * DUNGEON_MAGIC_LIGHTING.altar.idleScale;

    renderer.render(scene, camera);
    for (const [name, quaternion] of saved) bones.get(name)!.quaternion.copy(quaternion);
  };

  renderer.setAnimationLoop(render);
  render();
  if (!isActive()) {
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    disposeObject(dragon.scene);
    disposeObject(d20.scene);
    disposeObject(altar.scene);
    renderer.dispose();
    throw new Error("Dungeon stage superseded before handoff.");
  }
  onReady();
  return {
    setPhase(next) {
      if (disposed || next === phase) return;
      phaseStartD20 = d20Group.quaternion.clone();
      const wasPaused = phase === "paused";
      phase = next;
      phaseElapsed = 0;
      if (next === "idle") d20Spin = 0;
      if (next === "paused") {
        renderer.setAnimationLoop(null);
        render();
      } else if (wasPaused) {
        clock.start();
        renderer.setAnimationLoop(render);
      }
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", contextLost);
      disposeObject(dragon.scene);
      disposeObject(d20.scene);
      disposeObject(altar.scene);
      renderer.dispose();
    },
  };
}

export function Dragon3DStage({ target, phase, onReady, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    let active = true;
    let controller: Controller | null = null;
    // Deferring one frame prevents React development/Preview effect probing
    // from starting two large GLB pipelines against the same canvas. Any
    // superseded pipeline is additionally barred from publishing readiness.
    const frame = window.requestAnimationFrame(() => {
      if (!active) return;
      void createController({
        canvas,
        container: stage,
        initialPhase: phase,
        onReady: () => { if (active) onReady(); },
        onError: () => { if (active) onError(); },
        isActive: () => active,
      })
        .then((created) => {
          if (!active) { created.dispose(); return; }
          controller = created;
          controllerRef.current = created;
        })
        .catch(() => { if (active) onError(); });
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      controller?.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError, onReady, target]);

  useEffect(() => { controllerRef.current?.setPhase(phase); }, [phase]);

  return createPortal(
    <div ref={stageRef} className="dragon-3d-stage" aria-hidden="true">
      <canvas ref={canvasRef} tabIndex={-1} />
    </div>,
    target
  );
}
