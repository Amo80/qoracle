"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ACESFilmicToneMapping, AmbientLight, AnimationMixer, Clock, Color,
  Box3, DirectionalLight, Euler, Group, Material, Mesh, MeshStandardMaterial,
  Object3D, PerspectiveCamera, Quaternion, Scene, SRGBColorSpace, Texture,
  Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  LOVE_3D_MANIFEST, LOVE_SCENE_PRESENTATION, getLoveProceduralPose,
  getApprovedLoveBoneName, getLoveCameraDistance, getLoveViewportSize,
  getLovePoseMagnitude,
  applyLovePresentationToPose,
  scaleToSpan,
  type LovePose,
} from "@/lib/living-oracle/love3d";
import type { CharacterPhase } from "@/lib/living-oracle/machine";
import type { LovePresentation } from "@/lib/oracle-intelligence/types";

type Props = Readonly<{ target: HTMLElement; phase: CharacterPhase; presentation?: LovePresentation | null; onReady: () => void; onError: () => void }>;
type Controller = Readonly<{ setPhase: (phase: CharacterPhase) => void; setPresentation: (presentation: LovePresentation | null) => void; dispose: () => void }>;

function disposeObject(root: Object3D) {
  const textures = new Set<Texture>();
  const materials = new Set<Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}

const boneChannels = {
  Spine2: ["spineX", "spineY", "spineZ"],
  Neck: ["neckX", "neckY", "neckZ"],
  Head: ["headX", "headY", "headZ"],
  LeftArm: ["leftArmX", "leftArmY", "leftArmZ"],
  RightArm: ["rightArmX", "rightArmY", "rightArmZ"],
  LeftForeArm: ["leftForearmX", "leftForearmY", "leftForearmZ"],
  RightForeArm: ["rightForearmX", "rightForearmY", "rightForearmZ"],
} as const;

async function createController({ canvas, container, initialPhase, initialPresentation, onReady, onError }: {
  canvas: HTMLCanvasElement; container: HTMLElement; initialPhase: CharacterPhase;
  initialPresentation: LovePresentation | null;
  onReady: () => void; onError: () => void;
}): Promise<Controller> {
  let disposed = false;
  let phase = initialPhase;
  let phaseElapsed = 0;
  let elapsed = 0;
  let presentation = initialPresentation;
  const loader = new GLTFLoader();
  const clock = new Clock();
  const scene = new Scene();
  const camera = new PerspectiveCamera(
    LOVE_SCENE_PRESENTATION.camera.fieldOfView,
    1,
    0.1,
    100
  );
  const characterGroup = new Group();
  const podiumGroup = new Group();
  const heartGroup = new Group();
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(new Color(0x000000), 0);
  camera.position.set(0, 0.94, 4.8);
  camera.lookAt(0, 0.94, 0.35);
  scene.add(new AmbientLight(0xffd8e8, 1.55));
  const key = new DirectionalLight(0xffc0d9, 2.35); key.position.set(2.4, 3.2, 3.8); scene.add(key);
  const fill = new DirectionalLight(0xb72c73, 1.5); fill.position.set(-2.5, 1.8, 2.1); scene.add(fill);
  scene.add(characterGroup, podiumGroup, heartGroup);

  let compositionBounds: Box3 | null = null;
  const resize = () => {
    const displayBounds = container.getBoundingClientRect();
    const { width, height } = getLoveViewportSize({
      displayWidth: displayBounds.width,
      displayHeight: displayBounds.height,
      fallbackWidth: window.innerWidth,
      fallbackHeight: window.innerHeight,
    });
    renderer.setSize(width, height, false); camera.aspect = width / height;
    if (compositionBounds) {
      const size = compositionBounds.getSize(new Vector3());
      const center = compositionBounds.getCenter(new Vector3());
      const distance = getLoveCameraDistance({ width: size.x, height: size.y, aspect: camera.aspect });
      camera.position.set(center.x, center.y, compositionBounds.max.z + distance);
      camera.lookAt(center.x, center.y, center.z);
    }
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); resize();
  const contextLost = (event: Event) => { event.preventDefault(); onError(); };
  canvas.addEventListener("webglcontextlost", contextLost);

  let base: GLTF; let heart: GLTF; let podium: GLTF;
  try {
    [base, heart, podium] = await Promise.all([
      loader.loadAsync(LOVE_3D_MANIFEST.model), loader.loadAsync(LOVE_3D_MANIFEST.heart), loader.loadAsync(LOVE_3D_MANIFEST.podium),
    ]);
  } catch (error) {
    resizeObserver.disconnect(); canvas.removeEventListener("webglcontextlost", contextLost); renderer.dispose(); throw error;
  }
  if (disposed) {
    disposeObject(base.scene); disposeObject(heart.scene); disposeObject(podium.scene); throw new Error("Love stage disposed while loading.");
  }

  const normalizeByHeight = (
    root: Object3D,
    group: Group,
    target: { height: number; floorY: number; centerZ: number }
  ) => {
    root.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(root);
    const center = bounds.getCenter(new Vector3());
    const scale = scaleToSpan({ min: bounds.min.y, max: bounds.max.y }, target.height);
    group.add(root);
    group.scale.setScalar(scale);
    group.position.set(
      -center.x * scale,
      target.floorY - bounds.min.y * scale,
      target.centerZ - center.z * scale
    );
    return scale;
  };
  const normalizeByWidth = (
    root: Object3D,
    group: Group,
    target: { width: number; centerY: number; centerZ: number }
  ) => {
    root.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(root);
    const center = bounds.getCenter(new Vector3());
    const scale = scaleToSpan({ min: bounds.min.x, max: bounds.max.x }, target.width);
    group.add(root);
    group.scale.setScalar(scale);
    group.position.set(
      -center.x * scale,
      target.centerY - center.y * scale,
      target.centerZ - center.z * scale
    );
    return scale;
  };

  normalizeByHeight(base.scene, characterGroup, LOVE_SCENE_PRESENTATION.character);
  normalizeByHeight(podium.scene, podiumGroup, LOVE_SCENE_PRESENTATION.podium);
  const heartBaseScale = normalizeByWidth(
    heart.scene,
    heartGroup,
    LOVE_SCENE_PRESENTATION.heart
  );
  const heartBaseY = heartGroup.position.y;
  scene.updateMatrixWorld(true);
  compositionBounds = new Box3()
    .setFromObject(characterGroup)
    .union(new Box3().setFromObject(podiumGroup))
    .union(new Box3().setFromObject(heartGroup));
  resize();

  const heartMaterials: MeshStandardMaterial[] = [];
  const podiumMaterials: MeshStandardMaterial[] = [];
  const collectMaterials = (root: Object3D, list: MeshStandardMaterial[], color: number) => root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material instanceof MeshStandardMaterial) { material.emissive.set(color); list.push(material); }
    }
  });
  collectMaterials(heart.scene, heartMaterials, 0xc52a72);
  collectMaterials(podium.scene, podiumMaterials, 0x5b123a);

  const idle = base.animations.find((clip) => clip.name === LOVE_3D_MANIFEST.baseClip);
  const failAfterLoad = (message: string): never => {
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    disposeObject(base.scene); disposeObject(heart.scene); disposeObject(podium.scene);
    renderer.dispose();
    throw new Error(message);
  };
  if (!idle) return failAfterLoad("Optimized Love model is missing Idle_7.");
  const mixer = new AnimationMixer(base.scene);
  mixer.clipAction(idle, base.scene).play();

  const bones = new Map<string, Object3D>();
  base.scene.traverse((object) => {
    const approvedName = getApprovedLoveBoneName(object.name);
    if (approvedName) bones.set(approvedName, object);
  });
  const missing = Object.keys(boneChannels).filter((name) => !bones.has(name));
  if (missing.length) failAfterLoad(`Love rig is missing approved procedural bones: ${missing.join(", ")}`);
  const saved = new Map<string, Quaternion>();
  for (const name of Object.keys(boneChannels)) saved.set(name, new Quaternion());
  const offset = new Quaternion();
  const euler = new Euler(0, 0, 0, "XYZ");

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (phase !== "paused") { elapsed += delta; phaseElapsed += delta; mixer.update(delta); }
    const pose: LovePose = applyLovePresentationToPose(
      getLoveProceduralPose(phase, phaseElapsed),
      phase,
      presentation
    );
    canvas.dataset.lovePhase = phase;
    canvas.dataset.lovePhaseElapsed = phaseElapsed.toFixed(3);
    canvas.dataset.lovePoseMagnitude = getLovePoseMagnitude(pose).toFixed(5);
    for (const [name, channels] of Object.entries(boneChannels)) {
      const bone = bones.get(name)!; saved.get(name)!.copy(bone.quaternion);
      euler.set(pose[channels[0]], pose[channels[1]], pose[channels[2]]); offset.setFromEuler(euler); bone.quaternion.multiply(offset);
    }
    const float = Math.sin(elapsed * 1.7) * (LOVE_SCENE_PRESENTATION.heart.floatAmplitude + pose.heartPulse);
    heartGroup.position.y = heartBaseY + float;
    heartGroup.rotation.y += delta * 0.28;
    const pulse = 1 + Math.sin(elapsed * 3.1) * pose.heartPulse;
    heartGroup.scale.setScalar(heartBaseScale * pulse);
    for (const material of heartMaterials) material.emissiveIntensity = pose.heartIntensity;
    for (const material of podiumMaterials) material.emissiveIntensity = 0.12 + pose.heartIntensity * 0.08;
    renderer.render(scene, camera);
    for (const [name, quaternion] of saved) bones.get(name)!.quaternion.copy(quaternion);
  };

  renderer.setAnimationLoop(render); render(); onReady();
  return {
    setPhase(next) {
      if (disposed || next === phase) return;
      const wasPaused = phase === "paused"; phase = next; phaseElapsed = 0;
      if (next === "paused") { mixer.timeScale = 0; renderer.setAnimationLoop(null); render(); }
      else { mixer.timeScale = 1; if (wasPaused) { clock.start(); renderer.setAnimationLoop(render); } }
    },
    setPresentation(next) { presentation = next; },
    dispose() {
      disposed = true; renderer.setAnimationLoop(null); resizeObserver.disconnect(); canvas.removeEventListener("webglcontextlost", contextLost);
      mixer.stopAllAction(); disposeObject(base.scene); disposeObject(heart.scene); disposeObject(podium.scene); renderer.dispose();
    },
  };
}

export function Love3DStage({ target, phase, presentation = null, onReady, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    let active = true; let controller: Controller | null = null;
    void createController({ canvas, container: stage, initialPhase: phase, initialPresentation: presentation, onReady, onError }).then((created) => {
      if (!active) { created.dispose(); return; } controller = created; controllerRef.current = created;
    }).catch(() => { if (active) onError(); });
    return () => { active = false; controller?.dispose(); if (controllerRef.current === controller) controllerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError, onReady, target]);
  useEffect(() => { controllerRef.current?.setPhase(phase); }, [phase]);
  useEffect(() => { controllerRef.current?.setPresentation(presentation); }, [presentation]);
  return createPortal(<div ref={stageRef} className="love-3d-stage" aria-hidden="true"><canvas ref={canvasRef} tabIndex={-1} /></div>, target);
}
