"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, AnimationMixer,
  BackSide, Box3, BufferGeometry, CanvasTexture, Clock, Color, DirectionalLight,
  DoubleSide, Euler, Group, LinearFilter, Material, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight,
  Quaternion, RingGeometry, Scene, ShaderMaterial, SphereGeometry, Sprite,
  SpriteMaterial, SRGBColorSpace, Texture, TorusGeometry, Vector3, WebGLRenderer,
  type Bone, type SkinnedMesh,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  ECLIPSE_3D_MANIFEST, ECLIPSE_CAMERA_FRAMING, ECLIPSE_PROCEDURAL_BONES,
  getEclipseCelestialPresentation, getEclipsePose, getEclipseViewportProfile,
} from "@/lib/living-oracle/eclipse3d";
import type { CharacterPhase } from "@/lib/living-oracle/machine";

type Props = Readonly<{ target: HTMLElement; phase: CharacterPhase; onReady: () => void; onError: () => void }>;
type Controller = Readonly<{ setPhase: (phase: CharacterPhase) => void; dispose: () => void }>;

function disposeObject(root: Object3D) {
  const textures = new Set<Texture>(); const materials = new Set<Material>(); const geometries = new Set<BufferGeometry>();
  root.traverse((object) => {
    if (!(object instanceof Mesh) && !(object instanceof Sprite)) return;
    if (object instanceof Mesh) geometries.add(object.geometry);
    const source = object.material; const list = Array.isArray(source) ? source : [source];
    for (const material of list) { materials.add(material); for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value); }
  });
  textures.forEach((texture) => texture.dispose()); materials.forEach((material) => material.dispose()); geometries.forEach((geometry) => geometry.dispose());
}

function radialTexture(stops: readonly [number, string][]) {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext("2d")!; const gradient = context.createRadialGradient(256, 256, 12, 256, 256, 252);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color)); context.fillStyle = gradient; context.fillRect(0, 0, 512, 512);
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.minFilter = LinearFilter; return texture;
}

function noise2(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothNoise(x: number, y: number) {
  const x0 = Math.floor(x); const y0 = Math.floor(y); const fx = x - x0; const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = noise2(x0, y0); const b = noise2(x0 + 1, y0); const c = noise2(x0, y0 + 1); const d = noise2(x0 + 1, y0 + 1);
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
}

function fbm(x: number, y: number) {
  let value = 0; let amplitude = .55; let frequency = 1;
  for (let octave = 0; octave < 5; octave++) { value += smoothNoise(x * frequency, y * frequency) * amplitude; frequency *= 2.08; amplitude *= .47; }
  return value;
}

function makeSolarTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 384; const c = canvas.getContext("2d")!;
  const image = c.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const i = (y * canvas.width + x) * 4;
    const warp = fbm(x / 94, y / 94); const fine = fbm(x / 22 + warp * 2.6, y / 22 - warp * 1.8); const cells = fbm(x / 7.5, y / 7.5);
    const filament = Math.abs(Math.sin((fine * 8.5 + warp * 3.2) * Math.PI));
    const spotField = fbm(x / 54 + 19, y / 54 + 31); const spot = spotField > .83 ? Math.max(.62, 1 - (spotField - .83) * 2.1) : 1;
    const heat = Math.max(0, Math.min(1, .58 + fine * .27 + cells * .1 + filament * .16)) * spot;
    image.data[i] = 242 + 13 * heat;
    image.data[i + 1] = 72 + 174 * heat;
    image.data[i + 2] = 3 + 74 * Math.pow(heat, 2.4);
    image.data[i + 3] = 255;
  }
  c.putImageData(image, 0, 0); const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
}

function makeLunarTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 384; const c = canvas.getContext("2d")!;
  const image = c.createImageData(canvas.width, canvas.height);
  for (let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;const terrain=fbm(x/52+71,y/52+17);const fine=fbm(x/13+9,y/13+43);const light=Math.max(0,Math.min(1,.18+terrain*.48+fine*.13));image.data[i]=17+40*light;image.data[i+1]=15+34*light;image.data[i+2]=27+69*light;image.data[i+3]=255;} c.putImageData(image,0,0);
  for (let i = 0; i < 92; i++) { const x = (i * 223 + 41) % canvas.width; const y = (i * 137 + 29) % canvas.height; const r = 4 + ((i * 19) % 27); const g = c.createRadialGradient(x-r*.24,y-r*.22,r*.12,x,y,r); g.addColorStop(0,"rgba(134,118,174,.32)"); g.addColorStop(.38,"rgba(25,20,42,.78)"); g.addColorStop(.72,"rgba(6,5,15,.72)"); g.addColorStop(.86,"rgba(120,99,168,.3)"); g.addColorStop(1,"rgba(0,0,0,0)"); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
}

function normalize(root: Object3D, group: Group, height: number, floorY: number, z: number) {
  root.updateMatrixWorld(true); const bounds = new Box3().setFromObject(root); const size = bounds.getSize(new Vector3()); const center = bounds.getCenter(new Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error("Eclipse asset has invalid runtime bounds.");
  const scale = height / size.y; group.add(root); group.scale.setScalar(scale); group.position.set(-center.x * scale, floorY - bounds.min.y * scale, z - center.z * scale); group.updateMatrixWorld(true);
}

function resolveActiveBones(root: Object3D) {
  const meshes: SkinnedMesh[] = []; root.traverse((object) => { if ((object as SkinnedMesh).isSkinnedMesh && (object as SkinnedMesh).skeleton) meshes.push(object as SkinnedMesh); });
  for (const mesh of meshes) { const bones = new Map<string, Bone>(); for (const bone of mesh.skeleton.bones) { const exported = typeof bone.userData.name === "string" ? bone.userData.name : bone.name; if ((ECLIPSE_PROCEDURAL_BONES as readonly string[]).includes(exported)) bones.set(exported, bone); } if (bones.size === ECLIPSE_PROCEDURAL_BONES.length) return { mesh, bones }; }
  throw new Error(`Eclipse active skin did not resolve ${ECLIPSE_PROCEDURAL_BONES.length} approved bones.`);
}

async function createController({ canvas, container, initialPhase, onReady, onError, isActive, registerCleanup }: { canvas: HTMLCanvasElement; container: HTMLElement; initialPhase: CharacterPhase; onReady: () => void; onError: () => void; isActive: () => boolean; registerCleanup: (cleanup: () => void) => void }): Promise<Controller> {
  let disposed = false; let phase = initialPhase; let phaseElapsed = 0; let elapsed = 0;
  const loader = new GLTFLoader(); const clock = new Clock(); const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, .05, 100); const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.setClearColor(new Color(0), 0);
  let mixer: AnimationMixer | null = null; let observer: ResizeObserver | null = null; let contextLost: ((event: Event) => void) | null = null; let cleaned = false;
  const loadedRoots = new Set<Object3D>();
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true; disposed = true; renderer.setAnimationLoop(null); observer?.disconnect();
    if (contextLost) canvas.removeEventListener("webglcontextlost", contextLost);
    mixer?.stopAllAction(); disposeObject(scene);
    loadedRoots.forEach((root) => { if (!root.parent) disposeObject(root); });
    renderer.dispose();
  };
  registerCleanup(cleanup);
  try {
  scene.add(new AmbientLight(0x8a79b9, 1.45)); const key = new DirectionalLight(0xffd49a, 2.4); key.position.set(3,5,5); const fill = new DirectionalLight(0x7955ff, 2); fill.position.set(-4,3,3); scene.add(key, fill);
  const content = new Group(); const empressGroup = new Group(); const altarGroup = new Group(); const celestial = new Group(); content.add(empressGroup, altarGroup, celestial); scene.add(content);
  const loads = await Promise.allSettled([loader.loadAsync(ECLIPSE_3D_MANIFEST.empress), loader.loadAsync(ECLIPSE_3D_MANIFEST.altar)]);
  loads.forEach((result) => { if (result.status === "fulfilled") { if (cleaned) disposeObject(result.value.scene); else loadedRoots.add(result.value.scene); } });
  const rejected = loads.find((result) => result.status === "rejected"); if (rejected?.status === "rejected") throw rejected.reason;
  const empressGltf = loads[0].status === "fulfilled" ? loads[0].value : null; const altarGltf = loads[1].status === "fulfilled" ? loads[1].value : null;
  if (!empressGltf || !altarGltf) throw new Error("Eclipse runtime assets did not load.");
  if (disposed || !isActive()) throw new Error("Eclipse initialization superseded.");
  const forbidden = empressGltf.animations.filter((clip) => ECLIPSE_3D_MANIFEST.excludedClips.includes(clip.name as "Running" | "Walking"));
  const rest = empressGltf.animations.find((clip) => clip.name === ECLIPSE_3D_MANIFEST.neutralClip); if (!rest || forbidden.length) throw new Error("Eclipse runtime derivative clip contract failed.");
  mixer = new AnimationMixer(empressGltf.scene); mixer.clipAction(rest).play(); mixer.setTime(0); mixer.update(0);
  const { mesh: activeMesh, bones } = resolveActiveBones(empressGltf.scene); if (activeMesh.skeleton.bones.length !== 28) throw new Error("Eclipse runtime skin is not the approved 28-joint skeleton.");
  const neutral = new Map<string, Quaternion>(); bones.forEach((bone, name) => neutral.set(name, bone.quaternion.clone()));
  normalize(empressGltf.scene, empressGroup, 3.5, -1.64, -0.72); normalize(altarGltf.scene, altarGroup, 1.48, -1.64, 0.3);
  content.updateMatrixWorld(true);
  const leftHandAnchor = content.worldToLocal(bones.get("mixamorig:LeftHand")!.getWorldPosition(new Vector3()));
  const rightHandAnchor = content.worldToLocal(bones.get("mixamorig:RightHand")!.getWorldPosition(new Vector3()));
  const celestialCenter = leftHandAnchor.clone().add(rightHandAnchor).multiplyScalar(.5);
  celestialCenter.z = .62;

  const solarTexture = makeSolarTexture(); const lunarTexture = makeLunarTexture();
  const sun = new Mesh(new SphereGeometry(.34, 72, 48), new MeshStandardMaterial({ map: solarTexture, emissiveMap: solarTexture, emissive: 0xff6a00, emissiveIntensity: 1.35, roughness: .66 }));
  const solarPlasma = new Mesh(new SphereGeometry(.358, 64, 40), new ShaderMaterial({ transparent:true, depthWrite:false, blending:AdditiveBlending, uniforms:{uTime:{value:0}}, vertexShader:`varying vec3 vN;varying vec2 vUv;void main(){vN=normalize(normalMatrix*normal);vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader:`uniform float uTime;varying vec3 vN;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1)),f.x),f.y);}void main(){float a=n(vUv*42.+vec2(uTime*.25,-uTime*.16));float b=n(vUv*91.-vec2(uTime*.18,uTime*.22));float rim=pow(1.-abs(vN.z),2.15);float plasma=smoothstep(.62,.94,a*.62+b*.38);gl_FragColor=vec4(1.,.42+.4*plasma,.035,(.035+.16*plasma+.68*rim));}` }));
  const hotLimb = new Mesh(new SphereGeometry(.366,56,36),new ShaderMaterial({transparent:true,side:BackSide,depthWrite:false,blending:AdditiveBlending,vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),3.2);gl_FragColor=vec4(1.,.67,.12,f*.95);}`}));
  const moon = new Mesh(new SphereGeometry(.325, 72, 48), new MeshStandardMaterial({ map:lunarTexture, bumpMap:lunarTexture, bumpScale:.045, color:0xb0a5c4, roughness:.93, metalness:.015, emissive:0x120724, emissiveIntensity:.2 }));
  const moonRim = new Mesh(new SphereGeometry(.342,56,36), new ShaderMaterial({transparent:true,side:BackSide,depthWrite:false,blending:AdditiveBlending,uniforms:{uStrength:{value:.82}},vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uStrength;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.05);gl_FragColor=vec4(.42,.2,1.,f*uStrength);}`}));
  const coronaTexture = radialTexture([[0,"rgba(0,0,0,0)"],[.34,"rgba(0,0,0,0)"],[.43,"rgba(255,255,240,1)"],[.49,"rgba(255,192,63,.82)"],[.61,"rgba(166,71,255,.5)"],[.8,"rgba(255,150,40,.15)"],[1,"rgba(0,0,0,0)"]]);
  const corona = new Sprite(new SpriteMaterial({map:coronaTexture,transparent:true,depthWrite:false,blending:AdditiveBlending,opacity:.3}));
  const sharpCorona = new Group();
  sharpCorona.add(new Mesh(new RingGeometry(.37,.405,128),new MeshBasicMaterial({color:0xfff8d8,transparent:true,opacity:.9,depthWrite:false,blending:AdditiveBlending,side:DoubleSide})),new Mesh(new RingGeometry(.405,.455,128),new MeshBasicMaterial({color:0xff9b27,transparent:true,opacity:.55,depthWrite:false,blending:AdditiveBlending,side:DoubleSide})));
  const prominences = new Group(); const prominenceAngles=[.18,1.12,2.54,3.66,5.18];
  prominenceAngles.forEach((angle,index)=>{const flare=new Mesh(new TorusGeometry(.43,.018+index*.002,8,32,.72+index*.06),new MeshBasicMaterial({color:index%2?0x9d55ff:0xffb33c,transparent:true,opacity:.62,depthWrite:false,blending:AdditiveBlending}));flare.rotation.z=angle;prominences.add(flare);});
  const rays = new Group(); const rayTexture = radialTexture([[0,"rgba(255,255,255,.96)"],[.07,"rgba(255,218,128,.82)"],[.38,"rgba(158,75,255,.22)"],[1,"rgba(0,0,0,0)"]]);
  for(let i=0;i<16;i++){const ray=new Mesh(new PlaneGeometry(i%3===0?.085:.045,i%3===0?1.9:1.5),new MeshBasicMaterial({map:rayTexture,transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide,opacity:i%3===0?.24:.14}));ray.rotation.z=i*Math.PI/8;ray.position.z=-.03;rays.add(ray);}
  const orbitLine = new Mesh(new TorusGeometry(.76,.008,8,96),new MeshBasicMaterial({color:0xb987ff,transparent:true,opacity:.28,blending:AdditiveBlending,depthWrite:false}));
  const sunLight = new PointLight(0xff9a35,3.2,5,2); const altarLight = new PointLight(0x8c4dff,1.2,4,2); altarLight.position.set(0,-.5,.6);
  celestial.add(rays, corona, sharpCorona, prominences, orbitLine, sun, solarPlasma, hotLimb, sunLight, moon, moonRim, altarLight);

  const compositionBounds = new Box3().setFromObject(content); let narrow = false; let stageAspect = 1;
  const resize = () => { const rect=container.getBoundingClientRect(); const width=rect.width>1?rect.width:window.innerWidth; const height=rect.height>1?rect.height:window.innerHeight; renderer.setSize(width,height,false); camera.aspect=width/height; stageAspect=camera.aspect; narrow=width<=520||camera.aspect<.72; const framing=narrow?ECLIPSE_CAMERA_FRAMING.narrow:ECLIPSE_CAMERA_FRAMING.desktop; camera.position.set(0,framing.positionY,framing.distance); camera.lookAt(0,framing.targetY,0); camera.updateProjectionMatrix(); };
  observer = new ResizeObserver(resize); observer.observe(container); resize();
  contextLost=(event:Event)=>{event.preventDefault();onError();}; canvas.addEventListener("webglcontextlost",contextLost);

  const render=()=>{
    if(disposed||!isActive())return;
    const delta=Math.min(clock.getDelta(),.05);elapsed+=delta;phaseElapsed+=delta;mixer!.update(delta);
    bones.forEach((bone,name)=>{const q=neutral.get(name);if(q)bone.quaternion.copy(q);});
    const pose=getEclipsePose(phase,phaseElapsed);
    for(const [name,offset] of Object.entries(pose)){const bone=bones.get(name);if(bone)bone.quaternion.multiply(new Quaternion().setFromEuler(new Euler(offset.x,offset.y,offset.z,"XYZ")));}
    empressGltf.scene.updateMatrixWorld(true);
    const p=getEclipseCelestialPresentation(phase,phaseElapsed);const spin=p.orbit;const profile=getEclipseViewportProfile(stageAspect,phase);
    const separation=Math.min(1,Math.abs(p.sunX-p.moonX)/1.56);const convergence=1-separation;const orbitRadius=(narrow?.022:.035)*profile.separateOrbit*separation;
    const sunAnchor=rightHandAnchor.clone().lerp(celestialCenter,convergence);const moonAnchor=leftHandAnchor.clone().lerp(celestialCenter,convergence);
    sunAnchor.x=celestialCenter.x+(sunAnchor.x-celestialCenter.x)*profile.separateOrbit;moonAnchor.x=celestialCenter.x+(moonAnchor.x-celestialCenter.x)*profile.separateOrbit;
    sunAnchor.y+=Math.sin(spin)*orbitRadius;moonAnchor.y-=Math.sin(spin)*orbitRadius;sunAnchor.x+=Math.cos(spin)*orbitRadius;moonAnchor.x-=Math.cos(spin)*orbitRadius;
    sunAnchor.z=.44+(p.sunZ-.12);moonAnchor.z=.48+(p.moonZ-.34);sun.position.copy(sunAnchor);moon.position.copy(moonAnchor);solarPlasma.position.copy(sun.position);hotLimb.position.copy(sun.position);moonRim.position.copy(moon.position);
    const responsiveScale=p.scale*(profile.separateScale+(profile.climaxScale-profile.separateScale)*convergence);
    sun.scale.setScalar(responsiveScale);solarPlasma.scale.copy(sun.scale);hotLimb.scale.copy(sun.scale);moon.scale.setScalar(responsiveScale);moonRim.scale.copy(moon.scale);
    solarPlasma.rotation.y+=delta*.48;sun.rotation.y+=delta*.14;moon.rotation.y+=delta*.045;
    const eclipsePoint=sun.position.clone().add(moon.position).multiplyScalar(.5);eclipsePoint.z=.18;
    corona.position.copy(eclipsePoint);corona.scale.setScalar(1.28*responsiveScale*p.corona);corona.material.opacity=Math.min(.92,.06+p.corona*.4);
    sharpCorona.position.copy(eclipsePoint);sharpCorona.scale.setScalar(responsiveScale*(.72+p.corona*.2));prominences.position.copy(eclipsePoint);prominences.scale.copy(sharpCorona.scale);prominences.rotation.z+=delta*.025;
    rays.position.copy(eclipsePoint);rays.scale.setScalar(Math.max(.42,responsiveScale*p.rays));rays.rotation.z+=delta*.035;sharpCorona.visible=convergence>.34;prominences.visible=convergence>.45;rays.visible=convergence>.18;
    for(const child of sharpCorona.children){const material=(child as Mesh).material as MeshBasicMaterial;material.opacity=(child===sharpCorona.children[0] ? .7 : .42)*Math.min(1,convergence*1.8);}
    for(const child of prominences.children){((child as Mesh).material as MeshBasicMaterial).opacity=.62*Math.min(1,convergence*1.7);}
    orbitLine.position.copy(celestialCenter);orbitLine.rotation.z=spin*.25;orbitLine.scale.setScalar(profile.separateOrbit);orbitLine.material.opacity=(.1+Math.min(.28,p.rays*.14))*separation;
    sunLight.position.copy(sun.position);sunLight.intensity=2.4+p.corona*1.8;altarLight.intensity=.5+p.altarGlow*3.1;(solarPlasma.material as ShaderMaterial).uniforms.uTime.value=elapsed;
    renderer.render(scene,camera);bones.forEach((bone,name)=>{const q=neutral.get(name);if(q)bone.quaternion.copy(q);});
  };
  renderer.setAnimationLoop(render); onReady();
  return {setPhase(next){if(next===phase)return;phase=next;phaseElapsed=0;if(next==="idle")elapsed=0;if(next==="paused")renderer.setAnimationLoop(null);else renderer.setAnimationLoop(render);},dispose(){cleanup();void compositionBounds;}};
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function Eclipse3DStage({target,phase,onReady,onError}:Props){const canvasRef=useRef<HTMLCanvasElement>(null);const stageRef=useRef<HTMLDivElement>(null);const controllerRef=useRef<Controller|null>(null);
  useEffect(()=>{const canvas=canvasRef.current,stage=stageRef.current;if(!canvas||!stage)return;let active=true;let controller:Controller|null=null;let pendingCleanup:(()=>void)|null=null;const frame=window.requestAnimationFrame(()=>{if(!active)return;void createController({canvas,container:stage,initialPhase:phase,onReady:()=>{if(active)onReady();},onError:()=>{if(active)onError();},isActive:()=>active,registerCleanup:(cleanup)=>{pendingCleanup=cleanup;if(!active)cleanup();}}).then(created=>{pendingCleanup=null;if(!active){created.dispose();return;}controller=created;controllerRef.current=created;}).catch(()=>{pendingCleanup=null;if(active)onError();});});return()=>{active=false;window.cancelAnimationFrame(frame);pendingCleanup?.();controller?.dispose();if(controllerRef.current===controller)controllerRef.current=null;};
    // The controller receives subsequent phases through setPhase below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[onError,onReady,target]);
  useEffect(()=>{controllerRef.current?.setPhase(phase);},[phase]);
  return createPortal(<div ref={stageRef} className="eclipse-3d-stage" aria-hidden="true"><canvas ref={canvasRef} tabIndex={-1}/></div>,target);
}
