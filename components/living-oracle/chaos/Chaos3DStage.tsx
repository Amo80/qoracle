"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  Box3,
  BufferGeometry,
  CanvasTexture,
  Clock,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  InstancedMesh,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  CHAOS_3D_MANIFEST,
  CHAOS_FRAGMENT_DEFINITIONS,
  CHAOS_SCENE_PRESENTATION,
  getChaosCameraDistance,
  getChaosPresentation,
} from "@/lib/living-oracle/chaos3d";
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
  const geometries = new Set<BufferGeometry>();
  root.traverse((object) => {
    if (!(object instanceof Mesh) && !(object instanceof Sprite)) return;
    if (object instanceof Mesh) geometries.add(object.geometry);
    const source = object.material;
    const list = Array.isArray(source) ? source : [source];
    for (const material of list) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value);
      }
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return new CanvasTexture(canvas);
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(170,245,255,.95)");
  gradient.addColorStop(0.34, "rgba(255,80,235,.55)");
  gradient.addColorStop(0.64, "rgba(55,120,255,.18)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function normalizeByHeight(
  root: Object3D,
  group: Group,
  target: { height: number; floorY: number; centerX: number; centerZ: number }
) {
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error("Chaos pedestal has invalid runtime bounds.");
  }
  const scale = target.height / size.y;
  group.add(root);
  group.scale.setScalar(scale);
  group.position.set(
    target.centerX - center.x * scale,
    target.floorY - bounds.min.y * scale,
    target.centerZ - center.z * scale
  );
}

function shortestAngle(from: number, to: number) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

async function createController({
  canvas,
  container,
  initialPhase,
  onReady,
  onError,
  isActive,
}: {
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
  let coreSpin = 0;
  let returnStartCore = 0;
  let narrow = false;
  const fragmentAngles: number[] = CHAOS_FRAGMENT_DEFINITIONS.map(
    ({ phase: angle }) => angle
  );
  let returnStartAngles = [...fragmentAngles];
  const loader = new GLTFLoader();
  const textureLoader = new TextureLoader();
  const clock = new Clock();
  const scene = new Scene();
  const camera = new PerspectiveCamera(
    CHAOS_SCENE_PRESENTATION.camera.fieldOfView,
    1,
    0.1,
    100
  );
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(new Color(0), 0);

  scene.add(new AmbientLight(0xb9b0e8, 1.7));
  const key = new DirectionalLight(0xffffff, 3.2);
  key.position.set(3.5, 5, 5);
  const fill = new DirectionalLight(0x57cfff, 2.1);
  fill.position.set(-4, 2, 2);
  scene.add(key, fill);

  const content = new Group();
  const core = new Group();
  const coreArtwork = new Group();
  const pedestalGroup = new Group();
  content.add(core, pedestalGroup);
  core.add(coreArtwork);
  core.position.set(
    CHAOS_SCENE_PRESENTATION.core.centerX,
    CHAOS_SCENE_PRESENTATION.core.centerY,
    CHAOS_SCENE_PRESENTATION.core.centerZ
  );
  scene.add(content);

  let compositionBounds: Box3 | null = null;
  let fragmentInstances: InstancedMesh | null = null;
  const resize = () => {
    const bounds = container.getBoundingClientRect();
    const width = bounds.width > 1 ? bounds.width : Math.max(1, window.innerWidth);
    const height = bounds.height > 1 ? bounds.height : Math.max(1, window.innerHeight);
    narrow = width <= 520 || width / height < 0.72;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (compositionBounds) {
      const size = compositionBounds.getSize(new Vector3());
      const center = compositionBounds.getCenter(new Vector3());
      const distance = getChaosCameraDistance({
        width: size.x,
        height: size.y,
        aspect: camera.aspect,
      });
      const targetY =
        center.y + CHAOS_SCENE_PRESENTATION.camera.verticalTargetOffset;
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

  let vortexTexture: Texture | null = null;
  let pedestal: GLTF | null = null;
  let rift: GLTF | null = null;
  try {
    vortexTexture = await textureLoader.loadAsync(CHAOS_3D_MANIFEST.vortex);
    if (!isActive()) {
      vortexTexture.dispose();
      throw new Error("Chaos stage superseded while loading the vortex.");
    }
    [pedestal, rift] = await Promise.all([
      loader.loadAsync(CHAOS_3D_MANIFEST.pedestal),
      loader.loadAsync(CHAOS_3D_MANIFEST.rift),
    ]);
  } catch (error) {
    vortexTexture?.dispose();
    if (pedestal) disposeObject(pedestal.scene);
    if (rift) disposeObject(rift.scene);
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    renderer.dispose();
    throw error;
  }
  if (disposed || !isActive() || !vortexTexture || !pedestal || !rift) {
    vortexTexture?.dispose();
    if (pedestal) disposeObject(pedestal.scene);
    if (rift) disposeObject(rift.scene);
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    renderer.dispose();
    throw new Error("Chaos stage disposed while loading.");
  }

  vortexTexture.colorSpace = SRGBColorSpace;
  const artworkMaterial = new MeshBasicMaterial({
    map: vortexTexture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const artwork = new Mesh(new PlaneGeometry(2, 2), artworkMaterial);
  artwork.position.z = 0.02;
  artwork.renderOrder = 2;
  coreArtwork.add(artwork);

  const shellMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uOpacity: { value: 0.62 } },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vView;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        vNormal=normalize(mat3(modelMatrix)*normal);
        vView=normalize(cameraPosition-world.xyz);
        gl_Position=projectionMatrix*viewMatrix*world;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal; varying vec3 vView; uniform float uOpacity;
      void main(){
        float fresnel=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.0);
        vec3 rainbow=mix(vec3(.08,.55,1.0),vec3(1.0,.12,.75),fresnel);
        gl_FragColor=vec4(rainbow,fresnel*.58*uOpacity);
      }
    `,
  });
  const shell = new Mesh(new SphereGeometry(1.04, 48, 32), shellMaterial);
  shell.renderOrder = 4;
  core.add(shell);

  const energyMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { uOpacity: { value: 0.32 } },
    vertexShader:
      "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `
      varying vec2 vUv; uniform float uOpacity;
      void main(){
        vec2 p=vUv-.5; float a=atan(p.y,p.x); float r=length(p)*2.0;
        float bands=.5+.5*sin(a*7.0-r*18.0);
        float edge=smoothstep(1.0,.25,r)*smoothstep(.12,.34,r);
        vec3 c=.5+.5*cos(a+vec3(0.0,2.1,4.2));
        gl_FragColor=vec4(c,bands*edge*uOpacity);
      }
    `,
  });
  const energy = new Mesh(new RingGeometry(0.28, 0.98, 96), energyMaterial);
  energy.position.z = 0.045;
  energy.renderOrder = 3;
  coreArtwork.add(energy);

  const glowTexture = makeGlowTexture();
  const singularityMaterial = new SpriteMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
  const singularity = new Sprite(singularityMaterial);
  singularity.position.z = 0.1;
  singularity.renderOrder = 5;
  core.add(singularity);
  const externalGlowMaterial = new SpriteMaterial({
    map: glowTexture,
    color: 0x7c46ff,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    opacity: 0.22,
  });
  const externalGlow = new Sprite(externalGlowMaterial);
  externalGlow.scale.setScalar(2.8);
  externalGlow.position.z = -0.12;
  externalGlow.renderOrder = 0;
  core.add(externalGlow);

  normalizeByHeight(
    pedestal.scene,
    pedestalGroup,
    CHAOS_SCENE_PRESENTATION.pedestal
  );
  const pedestalLight = new PointLight(0xffd7ff, 0, 2.7, 2);
  pedestalLight.position.set(0, 0.72, 0.08);
  pedestalGroup.add(pedestalLight);

  const primaryRift = rift.scene.getObjectByProperty("type", "Mesh") as
    | Mesh
    | undefined;
  if (!primaryRift) {
    disposeObject(scene);
    disposeObject(rift.scene);
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    renderer.dispose();
    throw new Error("Chaos Rift asset does not contain a mesh.");
  }
  primaryRift.updateWorldMatrix(true, false);
  const riftBounds = new Box3().setFromObject(primaryRift);
  const riftCenter = riftBounds.getCenter(new Vector3());
  const riftGeometry = primaryRift.geometry.clone();
  riftGeometry.applyMatrix4(primaryRift.matrixWorld);
  riftGeometry.translate(-riftCenter.x, -riftCenter.y, -riftCenter.z);
  primaryRift.geometry.dispose();
  fragmentInstances = new InstancedMesh(
    riftGeometry,
    primaryRift.material,
    CHAOS_FRAGMENT_DEFINITIONS.length
  );
  content.add(fragmentInstances);

  const dummy = new Object3D();
  const updateFragments = (
    delta: number,
    presentation: ReturnType<typeof getChaosPresentation>
  ) => {
    const visibleCount = narrow
      ? CHAOS_3D_MANIFEST.fragmentInstancesNarrow
      : CHAOS_3D_MANIFEST.fragmentInstancesDesktop;
    for (let index = 0; index < CHAOS_FRAGMENT_DEFINITIONS.length; index += 1) {
      const definition = CHAOS_FRAGMENT_DEFINITIONS[index];
      if (index >= visibleCount) {
        dummy.position.set(0, 0, 0);
        dummy.scale.setScalar(0);
      } else {
        if (phase === "returning") {
          const target = shortestAngle(returnStartAngles[index], definition.phase);
          fragmentAngles[index] =
            returnStartAngles[index] +
            (target - returnStartAngles[index]) * presentation.returnProgress;
        } else if (phase !== "paused" && phase !== "asset-error") {
          const reverse = presentation.reverseOdd && index % 2 === 1 ? -1 : 1;
          fragmentAngles[index] +=
            delta *
            definition.speed *
            definition.direction *
            presentation.fragmentSpeed *
            reverse;
        }
        const angle = fragmentAngles[index];
        const radius = definition.radius * presentation.fragmentRadius;
        const verticalWobble =
          Math.sin(elapsed * (0.9 + index * 0.07) + definition.phase) *
          definition.wobble *
          presentation.fragmentElevation;
        dummy.position.set(
          Math.cos(angle) * radius,
          definition.elevation * presentation.fragmentElevation +
            verticalWobble +
            0.18,
          Math.sin(angle) * radius * 0.42 + 0.12
        );
        dummy.rotation.set(
          definition.phase * 0.43 + elapsed * definition.spin,
          angle * 0.7 + elapsed * definition.spin * 0.8,
          definition.phase * 0.22 - elapsed * definition.spin * 0.54
        );
        dummy.scale.setScalar(definition.scale);
      }
      dummy.updateMatrix();
      fragmentInstances!.setMatrixAt(index, dummy.matrix);
    }
    fragmentInstances!.instanceMatrix.needsUpdate = true;
    fragmentInstances!.computeBoundingBox();
  };

  const initialPresentation = getChaosPresentation(phase, 0);
  updateFragments(0, initialPresentation);
  scene.updateMatrixWorld(true);
  compositionBounds = new Box3()
    .setFromObject(core)
    .union(new Box3().setFromObject(pedestalGroup))
    .union(new Box3().setFromObject(fragmentInstances))
    .expandByScalar(0.28);
  resize();

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (phase !== "paused") {
      elapsed += delta;
      phaseElapsed += delta;
    }
    const presentation = getChaosPresentation(phase, phaseElapsed);
    canvas.dataset.chaosPhase = phase;
    canvas.dataset.chaosPhaseElapsed = phaseElapsed.toFixed(3);
    canvas.dataset.chaosFragmentCount = String(
      narrow
        ? CHAOS_3D_MANIFEST.fragmentInstancesNarrow
        : CHAOS_3D_MANIFEST.fragmentInstancesDesktop
    );

    if (phase === "returning") {
      coreSpin = returnStartCore * (1 - presentation.returnProgress);
    } else if (phase !== "paused" && phase !== "asset-error") {
      coreSpin = (coreSpin + delta * presentation.coreSpeed) % (Math.PI * 2);
    }
    coreArtwork.rotation.z = coreSpin;
    energy.rotation.z += delta * presentation.counterSpeed;
    core.position.y = CHAOS_SCENE_PRESENTATION.core.centerY + presentation.coreLift;
    core.rotation.x = presentation.wobbleX;
    core.rotation.y = presentation.wobbleY;
    core.scale.setScalar(presentation.coreScale);
    shellMaterial.uniforms.uOpacity.value = presentation.shell;
    energyMaterial.uniforms.uOpacity.value = 0.3 + presentation.singularity * 0.08;
    singularityMaterial.opacity = Math.min(1, presentation.singularity * 0.72);
    singularity.scale.setScalar(0.72 + presentation.singularity * 0.19);
    externalGlowMaterial.opacity = 0.12 + presentation.singularity * 0.08;
    pedestalLight.intensity = presentation.pedestalGlow * 0.32;
    updateFragments(delta, presentation);
    renderer.render(scene, camera);
  };

  renderer.setAnimationLoop(render);
  render();
  if (!isActive()) {
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost);
    disposeObject(scene);
    renderer.dispose();
    throw new Error("Chaos stage superseded before handoff.");
  }
  onReady();

  return {
    setPhase(next) {
      if (disposed || next === phase) return;
      const wasPaused = phase === "paused";
      if (next === "returning") {
        returnStartAngles = [...fragmentAngles];
        returnStartCore = coreSpin;
      }
      phase = next;
      phaseElapsed = 0;
      if (next === "idle") {
        coreSpin = 0;
        energy.rotation.z = 0;
        CHAOS_FRAGMENT_DEFINITIONS.forEach((definition, index) => {
          fragmentAngles[index] = definition.phase;
        });
      }
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
      disposeObject(scene);
      renderer.dispose();
    },
  };
}

export function Chaos3DStage({ target, phase, onReady, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    let active = true;
    let controller: Controller | null = null;
    const frame = window.requestAnimationFrame(() => {
      if (!active) return;
      void createController({
        canvas,
        container: stage,
        initialPhase: phase,
        onReady: () => {
          if (active) onReady();
        },
        onError: () => {
          if (active) onError();
        },
        isActive: () => active,
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
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      controller?.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError, onReady, target]);

  useEffect(() => {
    controllerRef.current?.setPhase(phase);
  }, [phase]);

  return createPortal(
    <div ref={stageRef} className="chaos-3d-stage" aria-hidden="true">
      <canvas ref={canvasRef} tabIndex={-1} />
    </div>,
    target
  );
}
