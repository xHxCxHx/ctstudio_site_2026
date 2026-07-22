// src/pages/work/WorkPage.tsx

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ErrorInfo, ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import "./WorkPage.css";

const WORK_SCENE_URL = "/3d_models/work/scene.gltf";
const CTS_LOGO_URL = "/cts_brand/cts_logo_black.png";
const WORK_AMBIENT_AUDIO_URL = "/pages/work_page/Briefcase.mp3";
const WORK_FOG_ENABLED = false;

const WORK_INTRO_SCREEN_ONLY_MS = 3000;
const WORK_INTRO_ENVIRONMENT_FADE_MS = 2000;
const WORK_INTRO_GLASS_DELAY_MS = 900;
const WORK_INTRO_GLASS_FADE_MS = 1200;
const WORK_GPU_PRELOAD_DELAY_MS = 2400;
const WORK_AUDIO_VOLUME = 0.12;
const WORK_GLASS_LAYER = 2;
const WORK_CAMERA_TUNER_VISIBLE = false;
const WORK_COMPOSER_MULTISAMPLING = 2;

let workAmbientAudioSingleton: HTMLAudioElement | null = null;

function isWorkPagePath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return normalizedPath === "/work";
}

function stopWorkAmbientAudio() {
  const audio = workAmbientAudioSingleton;
  if (!audio) return;

  audio.autoplay = false;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = WORK_AUDIO_VOLUME;
}

function getWorkAmbientAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (workAmbientAudioSingleton) return workAmbientAudioSingleton;

  const audio = new window.Audio(WORK_AMBIENT_AUDIO_URL);
  audio.loop = true;
  audio.autoplay = false;
  audio.preload = "auto";
  audio.defaultMuted = false;
  audio.muted = false;
  audio.volume = WORK_AUDIO_VOLUME;
  audio.load();
  workAmbientAudioSingleton = audio;
  return audio;
}

// دانلود فایل صدا از زمان بارگذاری ماژول شروع می‌شود تا هنگام دیده‌شدن صفحه
// Work، پخش منتظر دریافت فایل نماند. خود پخش همچنان تابع Autoplay Policy مرورگر است.
if (typeof window !== "undefined") {
  const existingPreload = document.querySelector<HTMLLinkElement>(
    'link[data-work-ambient-preload="true"]',
  );
  if (!existingPreload) {
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "audio";
    preloadLink.type = "audio/mpeg";
    preloadLink.href = WORK_AMBIENT_AUDIO_URL;
    preloadLink.dataset.workAmbientPreload = "true";
    document.head.appendChild(preloadLink);
  }
  const eagerAudio = getWorkAmbientAudio();
  if (eagerAudio && isWorkPagePath(window.location.pathname)) {
    eagerAudio.autoplay = true;
    void eagerAudio.play().catch(() => {
      // اگر Autoplay Policy مرورگر پخش را مسدود کند، کامپوننت صفحه
      // بلافاصله دوباره تلاش می‌کند و fallback تعاملی را آماده نگه می‌دارد.
    });
  }
}

type WorkIntroProgressRef = {
  current: number;
};

type WorkProjectId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type WorkProject = {
  id: WorkProjectId;
  number: string;
  name: string;
  screenLabel: string;
  selectorDescription?: string;
  selectorCompactDescription?: string;
  posterUrl?: string;
  mediaUrl?: string;
  href?: string;
  accent: string;
  accentSecondary: string;
  emission: string;
  ceilingEmission?: string;
  ceilingEmissionIntensity?: number;
  lightLeft: string;
  lightRight: string;
  lightBack: string;
  environmentCardA: [number, number, number];
  environmentCardB: [number, number, number];
  background: string;
  fog: string;
  ambient: string;
  hemisphere: string;
  hemisphereGround: string;
};

const WORK_PROJECTS: WorkProject[] = [
  {
    id: 0,
    number: "00",
    name: "CTSTUDIO",
    screenLabel: "",
    accent: "#a6f8ff",
    accentSecondary: "#b9f6fc",
    emission: "#c6f6fa",
    lightLeft: "#c6f6fc",
    lightRight: "#e3edf0",
    lightBack: "#bcdde2",
    environmentCardA: [0.5, 0.92, 1.0],
    environmentCardB: [0.16, 0.52, 0.68],
    background: "#020609",
    fog: "#010305",
    ambient: "#b9d6dc",
    hemisphere: "#5d9099",
    hemisphereGround: "#020305",
  },
  {
    id: 1,
    number: "01",
    name: "GEMAK",
    screenLabel: "GEMAK",
    selectorDescription: "Custom 3D application and visual explainers that make complex machinery and its operating process easy to understand.",
    selectorCompactDescription: "3D applications and visual explainers for complex machinery.",
    posterUrl: "/pages/work_page/Gemak Glass Poster.webp",
    mediaUrl: "/pages/work_page/Gemak Media Card.webp",
    href: "/work/Gemak",
    accent: "#5975ff",
    accentSecondary: "#b04dff",
    emission: "#ac3df7",
    lightLeft: "#c775ff",
    lightRight: "#8798ff",
    lightBack: "#6965ff",
    environmentCardA: [0.36, 0.44, 1.0],
    environmentCardB: [0.61, 0.16, 0.92],
    background: "#03040a",
    fog: "#070516",
    ambient: "#c2c8ff",
    hemisphere: "#09105a",
    hemisphereGround: "#02020a",
  },
  {
    id: 2,
    number: "02",
    name: "OLEOCON",
    screenLabel: "OLEOCON",
    selectorDescription: "A digital library of every product model, with a detailed 3D viewer and clear video explainers for every system.",
    selectorCompactDescription: "A 3D product library with detailed viewers and video explainers.",
    posterUrl: "/pages/work_page/Oleocon Glass Poster.webp",
    mediaUrl: "/pages/work_page/Oleocon Media Card.webp",
    href: "/work/Oleocon",
    accent: "#dfff55",
    accentSecondary: "#a9f24f",
    emission: "#dfff55",
    ceilingEmission: "#dfff55",
    ceilingEmissionIntensity: 1.58,
    lightLeft: "#dfff55",
    lightRight: "#0548a0",
    lightBack: "#0b1f4f",
    environmentCardA: [0.3, 0.92, 0.44],
    environmentCardB: [0.5, 0.86, 0.2],
    background: "#020905",
    fog: "#031008",
    ambient: "#c0f2cf",
    hemisphere: "#55b978",
    hemisphereGround: "#010704",
  },
  {
    id: 3,
    number: "03",
    name: "AKIS",
    screenLabel: "AKIS",
    selectorDescription: "A self-service product asset library with video explainers and an assembly training application for customers and teams.",
    selectorCompactDescription: "Product assets, video explainers, and assembly training.",
    posterUrl: "/pages/work_page/Akis Glass Poster.webp",
    mediaUrl: "/pages/work_page/Akis Media Card.webp",
    accent: "#ffad3d",
    accentSecondary: "#ffe06a",
    emission: "#ff982f",
    lightLeft: "#ffc06e",
    lightRight: "#a4c1ff",
    lightBack: "#ff8a24",
    environmentCardA: [1.0, 0.48, 0.12],
    environmentCardB: [1.0, 0.74, 0.2],
    background: "#0a0501",
    fog: "#130801",
    ambient: "#f1c79e",
    hemisphere: "#c07a3a",
    hemisphereGround: "#070301",
  },
  {
    id: 4,
    number: "04",
    name: "ALLSTAR",
    screenLabel: "ALLSTAR",
    selectorDescription: "A large 3D education library combining animated lessons, virtual production, VFX, and field shoots for complex exam topics.",
    selectorCompactDescription: "Animated lessons, VFX, virtual production, and field shoots.",
    posterUrl: "/pages/work_page/Allstar Glass Poster.webp",
    mediaUrl: "/pages/work_page/Allstar Media Card.webp",
    accent: "#ff4fd8",
    accentSecondary: "#8b5cff",
    emission: "#ed42d2",
    lightLeft: "#ff8dea",
    lightRight: "#aa91ff",
    lightBack: "#d83eff",
    environmentCardA: [1.0, 0.24, 0.78],
    environmentCardB: [0.42, 0.18, 1.0],
    background: "#080208",
    fog: "#120316",
    ambient: "#eab6e4",
    hemisphere: "#a84eaa",
    hemisphereGround: "#060107",
  },
  {
    id: 5,
    number: "05",
    name: "CAYIROVA",
    screenLabel: "CAYIROVA",
    selectorDescription: "Exhibition video explainers and a 3D sales application for clearer meetings, stronger presentations, and better results.",
    selectorCompactDescription: "Video explainers and a 3D sales application.",
    posterUrl: "/pages/work_page/Cayirova Glass Poster.webp",
    mediaUrl: "/pages/work_page/Cayirova Media Card.webp",
    accent: "#35df72",
    accentSecondary: "#ff8a26",
    emission: "#27cc60",
    lightLeft: "#7af0a1",
    lightRight: "#ffad55",
    lightBack: "#ff7a22",
    environmentCardA: [0.16, 0.88, 0.36],
    environmentCardB: [1.0, 0.36, 0.08],
    background: "#070703",
    fog: "#100704",
    ambient: "#e2d3a6",
    hemisphere: "#7ba557",
    hemisphereGround: "#060301",
  },
  {
    id: 6,
    number: "06",
    name: "CIMUKA",
    screenLabel: "CIMUKA",
    selectorDescription: "A large parts asset library with sales support, assembly guides, video explainers, and catalog-ready product visuals.",
    selectorCompactDescription: "Parts assets, assembly guides, explainers, and product visuals.",
    posterUrl: "/pages/work_page/Cimuka Glass Poster.webp",
    mediaUrl: "/pages/work_page/Cimuka Media Card.webp",
    accent: "#ff3038",
    accentSecondary: "#ffd500",
    emission: "#ff3038",
    lightLeft: "#ff6269",
    lightRight: "#ffd500",
    lightBack: "#ffdf27",
    environmentCardA: [1.0, 0.08, 0.1],
    environmentCardB: [1.0, 0.72, 0.0],
    background: "#0a0203",
    fog: "#150304",
    ambient: "#f0c490",
    hemisphere: "#bd5b32",
    hemisphereGround: "#070102",
  },
];

const EMPTY_CRT_PROJECT: WorkProject = {
  ...WORK_PROJECTS[3],
  name: "",
  screenLabel: "",
  posterUrl: undefined,
};

const SELECTABLE_WORK_PROJECTS = WORK_PROJECTS.filter(
  (project) => project.id !== 0,
);

const PROJECT_LIGHT_COLOR_LERP_SPEED = 3.8;
const CRT_MAIN_FADE_OUT_SECONDS = 0.5;
const CRT_MAIN_FADE_IN_SECONDS = 0.62;
const GLASS_POSTER_TRANSITION_SECONDS = 0.96;
const WORK_MAX_DEVICE_PIXEL_RATIO = 1.5;
const WORK_MAX_TEXTURE_ANISOTROPY = 8;
const CRT_TEXTURE_SCALE = 0.75;

const glassPosterTextureCache = new Map<string, THREE.Texture>();
const glassPosterTextureLoads = new Map<string, Promise<THREE.Texture>>();

function loadGlassPosterTexture(posterUrl: string): Promise<THREE.Texture> {
  const resolvedUrl = encodeURI(posterUrl);
  const cachedTexture = glassPosterTextureCache.get(resolvedUrl);
  if (cachedTexture) return Promise.resolve(cachedTexture);

  const pendingLoad = glassPosterTextureLoads.get(resolvedUrl);
  if (pendingLoad) return pendingLoad;

  const loadPromise = new Promise<THREE.Texture>((resolve, reject) => {
    const isolatedManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(isolatedManager);

    loader.load(
      resolvedUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.x = -1;
        texture.offset.x = 1;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = WORK_MAX_TEXTURE_ANISOTROPY;
        texture.needsUpdate = true;
        glassPosterTextureCache.set(resolvedUrl, texture);
        glassPosterTextureLoads.delete(resolvedUrl);
        resolve(texture);
      },
      undefined,
      (error) => {
        glassPosterTextureLoads.delete(resolvedUrl);
        reject(error);
      },
    );
  });

  glassPosterTextureLoads.set(resolvedUrl, loadPromise);
  return loadPromise;
}

RectAreaLightUniformsLib.init();

const GLASS_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = modelViewPosition.xyz;
    vNormalView = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

const GLASS_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform float uRadius;
  uniform float uAspect;
  uniform vec2 uResolution;

  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;

  #define R uResolution.xy

  float Cir(vec2 uv, float r, bool blur) {
    float a = blur ? 0.01 : 0.0;
    float b = blur ? 0.13 : 5.0 / R.y;
    return smoothstep(a, b, length(uv) - r);
  }

  float roundedBoxSdf(vec2 point, vec2 halfSize, float radius) {
    vec2 q = abs(point) - halfSize + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  void main() {
    vec2 panelPoint = (vUv - 0.5) * vec2(uAspect, 1.0);
    float panelSdf = roundedBoxSdf(
      panelPoint,
      vec2(uAspect * 0.5, 0.5),
      uRadius
    );

    float edgeSoftness = max(fwidth(panelSdf) * 2.35, 0.0018);
    float panelMask = 1.0 - smoothstep(0.0, edgeSoftness, panelSdf);

    // Keep the supplied shader's front-material density profile, but discard
    // its RGB tint. It now influences only neutral glass density/reflection.
    vec2 frontCircleLocal = (vUv - 0.5) * 2.0;
    vec2 t = vec2(0.0, cos(1.0) * 0.1);
    vec2 uv = t + frontCircleLocal * 0.2;

    vec3 Col1 = vec3(
      0.1 + uv.y * 2.0,
      0.4 + uv.x * -1.1,
      0.8
    ) * 0.828;
    vec3 Col2 = vec3(0.86);

    float cir2B = Cir(uv + t, 0.15, true);
    vec3 sourceMaterial = mix(
      Col1 + vec3(0.3, 0.1, 0.0),
      Col2,
      cir2B
    );
    float sourceLuma = clamp(
      dot(sourceMaterial, vec3(0.2126, 0.7152, 0.0722)),
      0.0,
      1.0
    );

    vec3 viewDirection = normalize(-vViewPosition);
    float fresnel = pow(
      1.0 - abs(dot(normalize(vNormalView), viewDirection)),
      3.35
    );

    float diagonalReflection = pow(
      1.0 - abs((vUv.x * 0.82 + vUv.y * 0.18) - 0.56),
      24.0
    );

    float density = mix(0.72, 1.08, sourceLuma);
    vec3 finalColor = vec3(0.12) * density;
    finalColor += vec3(0.48) * diagonalReflection * 0.075;
    finalColor += vec3(0.72) * fresnel * 0.1;

    float alpha = uOpacity * (
      0.035 +
      sourceLuma * 0.024 +
      diagonalReflection * 0.042 +
      fresnel * 0.085
    );

    alpha *= panelMask;

    if (alpha < 0.0015) discard;

    gl_FragColor = vec4(
      clamp(finalColor, 0.0, 1.0),
      clamp(alpha, 0.0, 0.12)
    );
  }
`;

const GLASS_EDGE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uAspect;
  uniform float uIntroOpacity;
  uniform vec3 uAccent;
  uniform vec3 uAccentSecondary;

  varying vec2 vUv;

  void main() {
    vec2 inset = min(vUv, 1.0 - vUv);
    float edgeDistance = min(inset.x * uAspect, inset.y);
    float antiAlias = max(fwidth(edgeDistance) * 1.5, 0.00045);
    float coreWidth = 0.0028;
    float glowWidth = 0.015;

    float core = 1.0 - smoothstep(
      coreWidth - antiAlias,
      coreWidth + antiAlias,
      edgeDistance
    );
    float glow = 1.0 - smoothstep(coreWidth, glowWidth, edgeDistance);
    float intensity = (core * 1.22 + glow * 0.34) * uIntroOpacity;
    float alpha = (core * 0.84 + glow * 0.24) * uIntroOpacity;

    if (alpha < 0.004) discard;

    vec3 edgeColor = mix(uAccent, uAccentSecondary, smoothstep(0.12, 0.88, vUv.x));
    gl_FragColor = vec4(edgeColor * intensity, clamp(alpha, 0.0, 1.0));
  }
`;

const GLASS_POSTER_TRANSITION_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLASS_POSTER_TRANSITION_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uCurrentMap;
  uniform sampler2D uIncomingMap;
  uniform float uCurrentVisible;
  uniform float uIncomingVisible;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSeed;
  uniform float uTransitioning;
  uniform float uIntroOpacity;

  varying vec2 vUv;

  float digitalHash(vec2 point) {
    vec3 p = fract(vec3(point.xyx) * vec3(0.127, 0.113, 0.137));
    p += dot(p, p.yzx + 23.71);
    return fract((p.x + p.y) * p.z);
  }

  vec2 safePosterUv(vec2 uv) {
    return vec2(fract(uv.x), clamp(uv.y, 0.002, 0.998));
  }

  void main() {
    // Existing poster orientation is preserved explicitly because a custom
    // shader does not apply MeshBasicMaterial's texture transform for us.
    vec2 baseUv = vec2(1.0 - vUv.x, vUv.y);

    if (uTransitioning < 0.5) {
      if (uCurrentVisible < 0.001) discard;

      vec4 stillFrame = texture2D(uCurrentMap, baseUv);
      float stillAlpha = stillFrame.a * uCurrentVisible * 0.96 * uIntroOpacity;
      if (stillAlpha < 0.002) discard;
      gl_FragColor = vec4(stillFrame.rgb, stillAlpha);
      return;
    }

    float progress = clamp(uProgress, 0.0, 1.0);
    float burst = pow(max(sin(progress * 3.14159265), 0.0), 0.72);
    float timeCell = floor((uTime + uSeed) * 26.0);
    float row = floor(baseUv.y * 36.0);
    float column = floor(baseUv.x * 11.0);

    float blockNoise = digitalHash(
      vec2(column + row * 0.37, floor(timeCell * 0.5) + uSeed)
    );

    // Every tile receives a stable random reveal moment, so the incoming
    // poster appears in scattered regions across the entire glass instead
    // of travelling through it in one direction.
    vec2 revealCell = floor(baseUv * vec2(13.0, 29.0));
    float revealOrder = 0.055 + 0.89 * digitalHash(
      revealCell + vec2(uSeed * 0.71, uSeed * 1.13)
    );
    float reveal = smoothstep(
      revealOrder - 0.065,
      revealOrder + 0.065,
      progress
    );
    float transitionBand = 1.0 - smoothstep(
      0.025,
      0.16,
      abs(progress - revealOrder)
    );

    float rowGate = step(
      0.43,
      digitalHash(vec2(row * 1.71 + uSeed, timeCell + 4.0))
    );
    float horizontalShift = (
      digitalHash(vec2(row + 8.0, timeCell + uSeed)) - 0.5
    ) * 0.22 * burst * rowGate * (0.22 + transitionBand * 0.78);

    float blockGate = step(0.80, blockNoise);
    float verticalShift = (
      digitalHash(vec2(column + 17.0, row + timeCell)) - 0.5
    ) * 0.085 * burst * transitionBand * blockGate;

    vec2 outgoingUv = safePosterUv(
      baseUv + vec2(horizontalShift, verticalShift)
    );
    vec2 incomingUv = safePosterUv(
      baseUv - vec2(horizontalShift * 0.68, verticalShift * 0.55)
    );

    vec4 outgoingFrame = texture2D(uCurrentMap, outgoingUv);
    vec4 incomingFrame = texture2D(uIncomingMap, incomingUv);
    vec3 color = mix(outgoingFrame.rgb, incomingFrame.rgb, reveal);
    float visibility = mix(uCurrentVisible, uIncomingVisible, reveal);
    float sourceAlpha = mix(outgoingFrame.a, incomingFrame.a, reveal);

    float channelBurst = burst * transitionBand * rowGate;
    if (channelBurst > 0.01) {
      float channelOffset = 0.004 + channelBurst * 0.011;
      float red = mix(
        texture2D(
          uCurrentMap,
          safePosterUv(outgoingUv + vec2(channelOffset, 0.0))
        ).r,
        texture2D(
          uIncomingMap,
          safePosterUv(incomingUv + vec2(channelOffset, 0.0))
        ).r,
        reveal
      );
      float blue = mix(
        texture2D(
          uCurrentMap,
          safePosterUv(outgoingUv - vec2(channelOffset, 0.0))
        ).b,
        texture2D(
          uIncomingMap,
          safePosterUv(incomingUv - vec2(channelOffset, 0.0))
        ).b,
        reveal
      );
      color = mix(
        color,
        vec3(red, color.g, blue),
        channelBurst * 0.72
      );
    }

    vec2 grainCell = floor(baseUv * vec2(260.0, 390.0));
    float grain = digitalHash(grainCell + vec2(timeCell, uSeed)) - 0.5;
    float grainGate = step(
      0.58,
      digitalHash(vec2(row + 31.0, timeCell + uSeed))
    );
    color += grain * 0.16 * burst * transitionBand * grainGate;

    float signalDrop = step(
      0.90,
      digitalHash(vec2(column + timeCell, row + uSeed * 3.0))
    );
    color *= 1.0 - signalDrop * burst * transitionBand * 0.48;

    float alpha = sourceAlpha * visibility * 0.96 * uIntroOpacity;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
  }
`;

const VOID_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VOID_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec2 uAspect;

  varying vec2 vUv;

  float hash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.11369, 0.13787));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise31(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float x00 = mix(n000, n100, f.x);
    float x10 = mix(n010, n110, f.x);
    float x01 = mix(n001, n101, f.x);
    float x11 = mix(n011, n111, f.x);

    return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
  }

  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.56;

    for (int i = 0; i < 3; i++) {
      v += noise31(p) * a;
      p = p * 2.05 + vec3(2.71, -1.87, 1.43);
      a *= 0.47;
    }

    return v;
  }

  float fastPlume(
    vec2 p,
    float center,
    float width,
    float height,
    float phase,
    float macro,
    float curl,
    float time
  ) {
    float y = p.y;
    float lift = smoothstep(0.08, height + 0.08, y);
    float drift = (macro - 0.5) * 0.15 + (curl - 0.5) * 0.07;
    drift *= lift;
    drift += sin(y * 7.2 + phase * 1.53 + time * 1.04) * 0.024 * lift;
    drift += sin(y * 13.0 - phase * 0.71 + time * 0.72) * 0.010 * lift;

    float qx = p.x - center - drift;
    float spread = width * mix(0.58, 1.35, smoothstep(0.14, height + 0.18, y));
    float body = exp(-pow(qx / max(spread, 0.001), 2.0));
    float core = exp(-pow(qx / max(spread * 0.48, 0.001), 2.0));

    float start = smoothstep(0.05, 0.18, y);
    float top = 1.0 - smoothstep(height - 0.10, height + 0.30, y + (macro - 0.5) * 0.10);
    float shoulder = exp(-pow((y - height * 0.72) * 2.30, 2.0));
    float source = exp(-pow((y - 0.20) * 5.10, 2.0));

    return (body * 0.76 + core * 0.24) * start * top * (shoulder * 0.62 + source * 0.40);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);
    float time = uTime / 20.5;
    float drive = time * 13.5;

    float sideFade = smoothstep(0.05, 0.20, uv.x) * (1.0 - smoothstep(0.80, 0.95, uv.x));
    sideFade *= 1.0 - smoothstep(0.64, 0.96, abs(p.x));
    sideFade = pow(clamp(sideFade, 0.0, 1.0), 1.55);

    float arcLift = pow(max(0.0, 1.0 - abs(p.x)), 1.22) * 0.082;
    p.y -= arcLift;

    float baseWarp = fbm3(vec3(p.x * 0.62 + uSeed * 0.12, p.y * 0.92 - drive * 0.24, drive * 0.10));
    float midWarp  = fbm3(vec3(p.x * 1.28 - uSeed * 0.08, p.y * 1.74 - drive * 0.38, drive * 0.14 + 2.4));
    float detWarp  = fbm3(vec3(p.x * 2.34 + uSeed * 0.04, p.y * 2.74 - drive * 0.58, drive * 0.19 + 5.1));

    vec2 q = p;
    float heightLift = smoothstep(0.08, 0.62, q.y);
    q.x += (baseWarp - 0.5) * 0.24;
    q.x += (midWarp - 0.5) * 0.14;
    q.x += sin(q.y * 7.8 + drive * 1.95) * 0.064 * (0.35 + heightLift);
    q.x += sin(q.y * 13.8 - drive * 3.25 + detWarp * 4.9) * 0.034 * (0.25 + heightLift);
    q.x += sin(q.y * 3.6 + q.x * 4.2 + drive * 1.15) * 0.032 * heightLift;
    q.y += (midWarp - 0.5) * 0.046;
    q.y += sin(q.x * 8.6 + drive * 1.25) * 0.018;
    q.y += sin(q.x * 4.0 - drive * 0.72 + baseWarp * 3.7) * 0.012;

    float macro = fbm3(vec3(q.x * 0.60 + uSeed * 0.14, q.y * 0.98 - drive * 0.26, drive * 0.10 + 1.3));
    float mid = fbm3(vec3(q.x * 1.14 - uSeed * 0.07, q.y * 1.82 - drive * 0.46, drive * 0.17 + 4.7));
    float detail = fbm3(vec3(q.x * 2.34 + uSeed * 0.05, q.y * 2.88 - drive * 0.70, drive * 0.26 + 7.8));

    float rollingA = 0.5 + 0.5 * sin(q.x * 5.6 + drive * 1.85 + macro * 4.6);
    float rollingB = 0.5 + 0.5 * sin(q.x * 10.2 - drive * 2.95 + mid * 5.1);
    float rollingC = 0.5 + 0.5 * sin(q.x * 16.8 + drive * 4.25 + detail * 6.3);

    float topLine = 0.50;
    topLine += (rollingA - 0.5) * 0.10;
    topLine += (rollingB - 0.5) * 0.054;
    topLine += (macro - 0.5) * 0.12 + (mid - 0.5) * 0.062;

    float bottomFade = smoothstep(0.082, 0.22, q.y);
    float topOpen = 1.0 - smoothstep(topLine - 0.12, topLine + 0.24, q.y + (detail - 0.5) * 0.14);
    float heightFade = 1.0 - smoothstep(0.56, 0.91, q.y);
    float verticalMask = bottomFade * topOpen * heightFade;

    float baseSource = exp(-pow((q.y - 0.228) * 7.1, 2.0));
    float bodyMist = exp(-pow((q.y - 0.308) * 3.55, 2.0));
    float upperMist = exp(-pow((q.y - 0.402) * 4.9, 2.0));

    float plumeA = fastPlume(q, -0.74, 0.120, 0.48, 1.3, macro, mid, drive);
    float plumeB = fastPlume(q, -0.46, 0.152, 0.63, 2.7, mid, detail, drive);
    float plumeC = fastPlume(q, -0.18, 0.140, 0.56, 3.8, macro, detail, drive);
    float plumeD = fastPlume(q,  0.11, 0.176, 0.67, 5.1, mid, macro, drive);
    float plumeE = fastPlume(q,  0.39, 0.150, 0.58, 6.2, detail, mid, drive);
    float plumeF = fastPlume(q,  0.68, 0.114, 0.46, 7.4, macro, detail, drive);

    float plumes = plumeA * 0.44 + plumeB * 0.66 + plumeC * 0.56 + plumeD * 0.76 + plumeE * 0.60 + plumeF * 0.36;

    float curlMask = mix(0.80, 1.34, rollingA * 0.38 + rollingB * 0.34 + rollingC * 0.28);
    float bodyShape = smoothstep(0.31, 0.77, macro * 0.56 + mid * 0.44);
    float wispyShape = smoothstep(0.39, 0.84, mid * 0.52 + detail * 0.48);
    float swirlShape = smoothstep(0.47, 0.79, detail * 0.55 + rollingC * 0.45);

    float alpha = 0.0;
    alpha += baseSource * 0.040 * mix(0.92, 1.10, macro);
    alpha += bodyMist * 0.058 * bodyShape;
    alpha += upperMist * 0.020 * wispyShape;
    alpha += plumes * 0.176 * curlMask;
    alpha += plumes * baseSource * 0.036;
    alpha += swirlShape * upperMist * 0.026 * rollingB;

    alpha *= verticalMask * sideFade * uOpacity;
    alpha = smoothstep(0.004, 0.145, alpha);
    alpha *= 0.58;
    alpha = clamp(alpha, 0.0, 0.22);

    vec3 coldDark = vec3(0.026, 0.060, 0.070);
    vec3 steamBlue = vec3(0.162, 0.320, 0.338);
    vec3 brightSteam = vec3(0.250, 0.438, 0.454);
    float colorAmount = clamp(baseSource * 0.18 + bodyMist * 0.28 + plumes * 0.58 + upperMist * 0.10, 0.0, 1.0);
    vec3 fogColor = mix(coldDark, steamBlue, colorAmount);
    fogColor = mix(fogColor, brightSteam, clamp(plumes * 0.38 + curlMask * 0.09 + rollingC * 0.07, 0.0, 0.34));

    if (alpha < 0.0010) discard;

    gl_FragColor = vec4(fogColor, alpha);
  }
`;



const FOG_PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSway;
  attribute float aRise;
  attribute float aAlpha;

  varying float vLife;
  varying float vAlpha;
  varying float vPhase;
  varying float vDepth;

  void main() {
    float life = fract(uTime * aSpeed + aPhase);
    float appear = smoothstep(0.02, 0.20, life);
    float disappear = 1.0 - smoothstep(0.72, 1.0, life);
    float lift = sin(life * 3.14159265);

    vec3 animatedPosition = position;
    animatedPosition.y += life * aRise;
    animatedPosition.x += sin(uTime * 0.42 + aPhase * 6.2831) * aSway;
    animatedPosition.x += sin(uTime * 0.86 + aPhase * 10.91 + position.y * 1.7) * aSway * 0.32;
    animatedPosition.z += cos(uTime * 0.34 + aPhase * 8.17) * 0.055;

    vec4 modelViewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    float perspectiveSize = 240.0 / max(2.0, -modelViewPosition.z);

    gl_PointSize = aSize * perspectiveSize * uPixelRatio * (1.0 + lift * 0.34);
    gl_Position = projectionMatrix * modelViewPosition;

    vLife = life;
    vAlpha = aAlpha * appear * disappear;
    vPhase = aPhase;
    vDepth = clamp((-modelViewPosition.z - 2.0) / 12.0, 0.0, 1.0);
  }
`;

const FOG_PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;

  varying float vLife;
  varying float vAlpha;
  varying float vPhase;
  varying float vDepth;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm2(vec2 p) {
    float value = 0.0;
    float amplitude = 0.55;

    for (int i = 0; i < 5; i++) {
      value += noise21(p) * amplitude;
      p = p * 2.04 + vec2(1.7, -2.3);
      amplitude *= 0.48;
    }

    return value;
  }

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float radius = length(uv);

    float edge = 1.0 - smoothstep(0.34, 1.0, radius);
    float softCore = 1.0 - smoothstep(0.02, 0.82, radius);

    float time = uTime * 0.48;
    vec2 curl = uv;
    curl.x += sin(uv.y * 3.8 + time * 1.7 + vPhase * 6.2831) * 0.18;
    curl.y += cos(uv.x * 3.2 - time * 1.25 + vPhase * 4.1) * 0.14;

    float low = fbm2(curl * 1.35 + vec2(time * 0.28 + vPhase, -time * 0.18));
    float mid = fbm2(curl * 2.55 + vec2(-time * 0.46, time * 0.30 + vPhase * 2.0));
    float high = fbm2(curl * 4.40 + vec2(time * 0.62, -time * 0.54));

    float rolling = sin((uv.x + low * 0.38) * 5.2 + time * 3.4 + vPhase * 6.2831) * 0.5 + 0.5;
    float openHoles = smoothstep(0.24, 0.88, low * 0.52 + mid * 0.36 + high * 0.12);
    float wispyEdge = smoothstep(0.12, 0.86, mid * 0.62 + rolling * 0.38);

    float lifeTop = smoothstep(0.0, 0.28, vLife) * (1.0 - smoothstep(0.78, 1.0, vLife));
    float alpha = edge;
    alpha *= mix(0.28, 1.0, openHoles);
    alpha *= mix(0.62, 1.18, wispyEdge);
    alpha += softCore * 0.20 * low;
    alpha *= vAlpha * lifeTop;
    alpha = clamp(alpha, 0.0, 0.30);

    vec3 cold = vec3(0.030, 0.070, 0.078);
    vec3 steam = vec3(0.170, 0.335, 0.352);
    vec3 bright = vec3(0.285, 0.470, 0.488);
    float lightAmount = clamp(edge * 0.42 + low * 0.28 + rolling * 0.20, 0.0, 1.0);
    vec3 color = mix(cold, steam, lightAmount);
    color = mix(color, bright, clamp(softCore * 0.32 + wispyEdge * 0.10, 0.0, 0.40));

    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

const VOLUMETRIC_BEAM_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VOLUMETRIC_BEAM_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.58;

    for (int octave = 0; octave < 5; octave++) {
      value += noise21(p) * amplitude;
      p = p * 2.04 + vec2(3.41, -1.79);
      amplitude *= 0.48;
    }

    return value;
  }

  void main() {
    vec2 point = (vUv - 0.5) * 2.0;
    float topToBottom = 1.0 - vUv.y;
    float beamWidth = mix(0.18, 1.08, pow(topToBottom, 0.82));
    float core = 1.0 - smoothstep(beamWidth * 0.18, beamWidth, abs(point.x));
    float softEdge = 1.0 - smoothstep(beamWidth * 0.72, beamWidth * 1.28, abs(point.x));
    float vertical = smoothstep(0.02, 0.18, topToBottom) *
      (1.0 - smoothstep(0.92, 1.0, topToBottom));

    float time = uTime * 0.075;
    float cloud = fbm(
      vec2(point.x * 1.35 + uSeed, vUv.y * 3.6 - time)
    );
    float streaks = fbm(
      vec2(point.x * 4.2 - time * 0.6 + uSeed, vUv.y * 7.4 + time)
    );
    float density = smoothstep(0.28, 0.86, cloud * 0.68 + streaks * 0.32);

    float alpha = (
      core * 0.17 +
      softEdge * 0.09 +
      density * softEdge * 0.2
    ) * vertical * uOpacity;

    vec3 color = mix(
      vec3(0.035, 0.13, 0.15),
      vec3(0.38, 0.9, 0.96),
      clamp(core * 0.7 + density * 0.35, 0.0, 1.0)
    );

    if (alpha < 0.004) discard;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.34));
  }
`;

const FLOOR_MIST_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLOOR_MIST_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(271.13, 127.77));
    p += dot(p, p + 31.71);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.58;

    for (int octave = 0; octave < 5; octave++) {
      value += noise21(p) * amplitude;
      p = p * 2.05 + vec2(-1.7, 2.9);
      amplitude *= 0.48;
    }

    return value;
  }

  void main() {
    vec2 point = (vUv - 0.5) * 2.0;
    point.x *= 1.15;

    float radius = length(point);
    float time = uTime * 0.052;
    float cloud = fbm(point * 2.4 + vec2(time + uSeed, -time * 0.7));
    float detail = fbm(point * 6.6 + vec2(-time * 1.1, time + uSeed));

    float centerMist = 1.0 - smoothstep(0.05, 0.96, radius);
    float stageRingMist = exp(-abs(radius - 0.43) * 5.2) * 0.62;
    float outerMist = exp(-abs(radius - 0.76) * 7.5) * 0.34;
    float broken = smoothstep(0.34, 0.82, cloud * 0.72 + detail * 0.28);

    float alpha = (
      centerMist * 0.08 +
      stageRingMist * 0.11 +
      outerMist * 0.08 +
      broken * centerMist * 0.15
    ) * uOpacity;

    alpha *= 1.0 - smoothstep(0.82, 1.08, radius);

    vec3 color = mix(
      vec3(0.025, 0.08, 0.09),
      vec3(0.27, 0.7, 0.78),
      clamp(stageRingMist + broken * 0.42, 0.0, 1.0)
    );

    if (alpha < 0.004) discard;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.28));
  }
`;


const CRT_WALL_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CRT_WALL_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uBaseMap;
  uniform float uOpacity;
  uniform float uMainOpacity;
  uniform float uPanelOpacity;
  uniform float uScroll;
  uniform float uTileRepeat;

  varying vec2 vUv;

  void main() {
    vec2 baseUv = vUv;

    if (!gl_FrontFacing) {
      baseUv.x = 1.0 - baseUv.x;
    }

    vec2 uv = vec2(
      fract(baseUv.x * uTileRepeat + uScroll),
      clamp(baseUv.y, 0.001, 0.999)
    );

    vec4 activeTex = texture2D(uMap, uv);
    vec4 tex = activeTex;
    if (uMainOpacity < 0.999) {
      vec4 baseTex = texture2D(uBaseMap, uv);
      tex = mix(baseTex, activeTex, uMainOpacity);
    }
    float textMask = smoothstep(0.18, 0.72, max(max(tex.r, tex.g), tex.b));
    float mainBand = smoothstep(0.20, 0.28, uv.y) *
      (1.0 - smoothstep(0.52, 0.60, uv.y));

    if (textMask > 0.01) {
      vec2 splitUvR = vec2(fract(uv.x - 0.00135), uv.y);
      vec2 splitUvB = vec2(fract(uv.x + 0.00135), uv.y);
      vec4 texR = texture2D(uMap, splitUvR);
      vec4 texB = texture2D(uMap, splitUvB);
      vec3 rgbSplit = vec3(texR.r, tex.g, texB.b);
      float splitOpacity = mix(1.0, uMainOpacity, mainBand);
      tex.rgb = mix(tex.rgb, rgbSplit, textMask * 0.34 * splitOpacity);
    }

    float scanA = sin(uv.y * 1506.0);
    float scanB = sin(uv.y * 753.0 + 0.45);
    float scanline = 0.82 + scanA * 0.105 + scanB * 0.045;
    tex.rgb *= mix(1.0, scanline, textMask * 0.74);

    float grille = 0.94 + 0.06 * sin(uv.x * 2140.0);
    tex.rgb *= mix(1.0, grille, textMask * 0.38);

    tex.rgb += textMask * vec3(0.018, 0.040, 0.044);

    float sideFade = smoothstep(0.0, 0.145, vUv.x) * (1.0 - smoothstep(0.855, 1.0, vUv.x));
    sideFade = pow(clamp(sideFade, 0.0, 1.0), 1.65);

    vec3 color = tex.rgb * mix(0.04, 1.0, sideFade);
    float brightPixel = max(max(tex.r, tex.g), tex.b);
    float textOnlyAlpha = smoothstep(0.012, 0.18, brightPixel);
    float alpha = uOpacity * sideFade * mix(
      textOnlyAlpha,
      1.0,
      clamp(uPanelOpacity, 0.0, 1.0)
    );

    if (alpha < 0.012) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

function createCurvedBackdropGeometry(
  width: number,
  height: number,
  bowDepth: number,
  widthSegments = 128,
  heightSegments = 28,
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  const positions = geometry.attributes.position;
  const halfWidth = Math.max(width * 0.5, 0.0001);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const normalizedX = THREE.MathUtils.clamp(x / halfWidth, -1, 1);
    const circularArc = 1 - Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));
    positions.setZ(index, circularArc * bowDepth);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

function createCrtWallTexture(project: WorkProject) {
  const canvas = document.createElement("canvas");
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  const height = Math.round(640 * CRT_TEXTURE_SCALE);

  if (!measureCtx) {
    const fallback = new THREE.Texture();
    fallback.needsUpdate = true;
    return fallback;
  }

  const projectLabel = project.screenLabel || project.name;
  const mainItems: Array<string | null> = project.id === 0
    ? ["VISUAL SYSTEMS", null, "INTERACTIVE", null]
    : projectLabel
      ? Array.from({ length: 4 }, () => projectLabel)
      : [];
  const subTexts = [
    "3D MODELING",
    "RENDERING",
    "ANIMATION",
    "SIMULATION",
    "INTERACTIVE SYSTEMS",
    "UI / UX",
    "VFX INTEGRATION",
    "DELIVERY ASSETS",
    "PRODUCT VIEWERS",
    "TRAINING TOOLS",
  ];
  const mainFont = `900 ${Math.round(168 * CRT_TEXTURE_SCALE)}px Gotham, Arial, Helvetica, sans-serif`;
  const subFont = `800 ${Math.round(68 * CRT_TEXTURE_SCALE)}px Gotham, Arial, Helvetica, sans-serif`;
  const minimumMainGap = 260 * CRT_TEXTURE_SCALE;
  const minimumSubGap = 150 * CRT_TEXTURE_SCALE;
  const logoSource = { x: 68, y: 144, width: 1969, height: 305 };
  const logoHeight = 150 * CRT_TEXTURE_SCALE;
  const logoWidth = logoHeight * (logoSource.width / logoSource.height);

  measureCtx.font = mainFont;
  const mainWidths = mainItems.map((text) => (
    text === null ? logoWidth : measureCtx.measureText(text).width
  ));
  const mainContentWidth = mainWidths.reduce((sum, textWidth) => sum + textWidth, 0);

  measureCtx.font = subFont;
  const subWidths = subTexts.map((text) => measureCtx.measureText(text).width);
  const subContentWidth = subWidths.reduce((sum, textWidth) => sum + textWidth, 0);

  const width = Math.ceil(Math.max(
    mainContentWidth + (
      mainItems.length > 0 ? minimumMainGap * mainItems.length : 0
    ),
    subContentWidth + minimumSubGap * subTexts.length,
  ));

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.Texture();
    fallback.needsUpdate = true;
    return fallback;
  }

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#04080b");
  bg.addColorStop(0.48, "#071015");
  bg.addColorStop(1, "#03070a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.56,
    30 * CRT_TEXTURE_SCALE,
    width * 0.5,
    height * 0.56,
    width * 0.46,
  );
  glow.addColorStop(0, "rgba(220,246,255,0.10)");
  glow.addColorStop(0.45, "rgba(110,165,180,0.05)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const mainY = height * 0.60;
  const mainGap = mainItems.length > 0
    ? (width - mainContentWidth) / mainItems.length
    : 0;
  const logoPositions: number[] = [];
  let mainX = mainGap * 0.5;
  ctx.font = mainFont;
  ctx.fillStyle = "#f6fdff";
  ctx.shadowColor = "rgba(240,250,255,0.92)";
  ctx.shadowBlur = 42 * CRT_TEXTURE_SCALE;
  mainItems.forEach((text, index) => {
    if (text === null) {
      logoPositions.push(mainX);
    } else {
      ctx.fillText(text, mainX, mainY);
    }
    mainX += mainWidths[index] + mainGap;
  });

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.font = subFont;
  ctx.fillStyle = "#f6fdff";
  ctx.shadowColor = "rgba(240,250,255,0.42)";
  ctx.shadowBlur = 15 * CRT_TEXTURE_SCALE;

  const subY = height * 0.34;
  const subGap = (width - subContentWidth) / subTexts.length;
  let subX = subGap * 0.5;

  subTexts.forEach((text, index) => {
    ctx.fillText(text, subX, subY);
    subX += subWidths[index] + subGap;
  });
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  const scanlineStep = Math.max(2, Math.round(3 * CRT_TEXTURE_SCALE));
  for (let y = 0; y < height; y += scanlineStep) {
    ctx.fillStyle = y % (scanlineStep * 2) === 0
      ? "rgba(255,255,255,0.060)"
      : "rgba(0,0,0,0.074)";
    ctx.fillRect(0, y, width, 1);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  if (logoPositions.length > 0) {
    const logoImage = new Image();
    logoImage.decoding = "async";
    logoImage.onload = () => {
      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = Math.ceil(logoWidth);
      logoCanvas.height = Math.ceil(logoHeight);

      const logoCtx = logoCanvas.getContext("2d");
      if (!logoCtx) return;

      const sourceScaleX = logoImage.naturalWidth / 2149;
      const sourceScaleY = logoImage.naturalHeight / 592;
      logoCtx.drawImage(
        logoImage,
        logoSource.x * sourceScaleX,
        logoSource.y * sourceScaleY,
        logoSource.width * sourceScaleX,
        logoSource.height * sourceScaleY,
        0,
        0,
        logoCanvas.width,
        logoCanvas.height,
      );
      logoCtx.globalCompositeOperation = "source-in";
      logoCtx.fillStyle = "#f6fdff";
      logoCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowColor = "rgba(240,250,255,0.92)";
      ctx.shadowBlur = 42 * CRT_TEXTURE_SCALE;
      logoPositions.forEach((x) => {
        ctx.drawImage(
          logoCanvas,
          x,
          mainY - logoHeight * 0.5,
          logoWidth,
          logoHeight,
        );
      });
      ctx.restore();

      texture.needsUpdate = true;
    };
    logoImage.onerror = () => {
      ctx.save();
      ctx.font = mainFont;
      ctx.fillStyle = "#f6fdff";
      ctx.shadowColor = "rgba(240,250,255,0.92)";
      ctx.shadowBlur = 42 * CRT_TEXTURE_SCALE;
      logoPositions.forEach((x) => ctx.fillText("CTSTUDIO", x, mainY));
      ctx.restore();
      texture.needsUpdate = true;
    };
    logoImage.src = CTS_LOGO_URL;
  }

  return texture;
}

const crtWallTextureCache = new Map<string, THREE.Texture>();

function getCrtWallTextureKey(project: WorkProject): string {
  if (project.id === 0) return "ctstudio";
  return project.screenLabel || project.name || "empty";
}

function getCrtWallTexture(project: WorkProject): THREE.Texture {
  const key = getCrtWallTextureKey(project);
  const cachedTexture = crtWallTextureCache.get(key);
  if (cachedTexture) return cachedTexture;

  const texture = createCrtWallTexture(project);
  crtWallTextureCache.set(key, texture);
  return texture;
}


type SceneErrorBoundaryProps = {
  children: ReactNode;
};

type SceneErrorBoundaryState = {
  hasError: boolean;
};

class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  public state: SceneErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[WorkPage] The 3D work scene failed to render.",
      error,
      info,
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="work-scene-error" role="alert">
          <strong>3D SCENE FAILED TO LOAD</strong>
          <span>
            Check <code>public/3d_models/work/scene.gltf</code> and every
            external texture or <code>.bin</code> file referenced by it.
          </span>
        </div>
      );
    }

    return this.props.children;
  }
}

type ImportedCameraData = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  fov: number;
};

type CameraSettings = {
  moveX: number;
  moveY: number;
  moveZ: number;
  rotateX: number;
  rotateY: number;
  lensMm: number;
};

// راهنمای فارسی تنظیم دوربین:
// moveX: چپ و راست | moveY: پایین و بالا | moveZ: عقب و جلو
// rotateX: چرخش عمودی | rotateY: چرخش افقی | lensMm: لنز بالاتر = نمای تخت‌تر و بسته‌تر
// DEFAULT_CAMERA_SETTINGS نمای عادی و PROJECT_CAMERA_SETTINGS نمای پروژه‌ی انتخاب‌شده است.
// برای نمایش دوباره پنل تنظیمات، WORK_CAMERA_TUNER_VISIBLE را true کنید.
const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  moveX: 0,
  moveY: -0.4,
  moveZ: -14.3,
  rotateX: -7,
  rotateY: 0,
  lensMm: 18,
};

const PROJECT_CAMERA_SETTINGS: CameraSettings = {
  moveX: 0,
  moveY: -0.4,
  moveZ: -13.6,
  rotateX: -3,
  rotateY: 0,
  lensMm: 18,
};

const CAMERA_TRANSITION_SECONDS = 1.8;
const CAMERA_SETTING_KEYS: Array<keyof CameraSettings> = [
  "moveX",
  "moveY",
  "moveZ",
  "rotateX",
  "rotateY",
  "lensMm",
];

const CAMERA_STORAGE_KEY = "cts-work-camera-tuner-v2";

type EmissiveLightData = {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  intensity: number;
  distance: number;
  angle: number;
};

type StageEdgeRing = {
  radius: number;
  y: number;
  x: number;
  z: number;
};

type PreparedScene = {
  scene: THREE.Group;
  bounds: THREE.Box3;
  size: THREE.Vector3;
  center: THREE.Vector3;
  importedCamera: ImportedCameraData | null;
  emissiveLights: EmissiveLightData[];
  stageEdgeRings: StageEdgeRing[];
};

type ShowcaseMetrics = {
  floorY: number;
  mainWidth: number;
  mainHeight: number;
  mainX: number;
  centerZ: number;
  totalWidth: number;
};

type GlassShowcaseProps = {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY: number;
  project: WorkProject;
  introGlassProgress: WorkIntroProgressRef;
  active?: boolean;
};

const EMITTER_NAME =
  /(^|[\s_.-])(led|emissive|emission|lamp|luminaire|light[\s_.-]?source|ceiling[\s_.-]?light|panel[\s_.-]?light)([\s_.-]|$)/i;

const REMOVED_SCENE_OBJECT_NAMES = new Set(["cylinder0"]);

function normalizeSceneObjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isActualEmitter(
  mesh: THREE.Mesh,
  material: THREE.Material,
): boolean {
  if (!(material instanceof THREE.MeshStandardMaterial)) return false;

  const hasRealEmission =
    Boolean(material.emissiveMap) || material.emissive.getHex() !== 0;
  const hasEmitterName = EMITTER_NAME.test(`${mesh.name} ${material.name}`);

  return hasRealEmission || hasEmitterName;
}

type BrushedMetalMaps = {
  roughness: THREE.DataTexture;
  normal: THREE.DataTexture;
};

let brushedMetalMaps: BrushedMetalMaps | null = null;

function getBrushedMetalMaps(): BrushedMetalMaps {
  if (brushedMetalMaps) return brushedMetalMaps;

  const size = 256;
  const roughnessData = new Uint8Array(size * size * 4);
  const normalData = new Uint8Array(size * size * 4);
  let seed = 1299709;

  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let y = 0; y < size; y += 1) {
    const broadGrain = Math.sin(y * 0.071) * 3.5;
    const mediumGrain = Math.sin(y * 0.41 + 1.2) * 2.2;

    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const micro = (random() - 0.5) * 10;
      const crossNoise = Math.sin(x * 0.37 + y * 0.023) * 1.6;
      const roughness = THREE.MathUtils.clamp(
        164 + broadGrain + mediumGrain + crossNoise + micro,
        142,
        190,
      );

      roughnessData[offset] = roughness;
      roughnessData[offset + 1] = roughness;
      roughnessData[offset + 2] = roughness;
      roughnessData[offset + 3] = 255;

      const nx = (random() - 0.5) * 0.035;
      const ny =
        Math.sin(y * 0.72 + x * 0.018) * 0.018 +
        (random() - 0.5) * 0.02;
      const nz = Math.sqrt(Math.max(0.001, 1 - nx * nx - ny * ny));

      normalData[offset] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[offset + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[offset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[offset + 3] = 255;
    }
  }

  const roughness = new THREE.DataTexture(
    roughnessData,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(14, 14);
  roughness.minFilter = THREE.LinearMipmapLinearFilter;
  roughness.magFilter = THREE.LinearFilter;
  roughness.anisotropy = 8;
  roughness.colorSpace = THREE.NoColorSpace;
  roughness.needsUpdate = true;

  const normal = new THREE.DataTexture(
    normalData,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(16, 16);
  normal.minFilter = THREE.LinearMipmapLinearFilter;
  normal.magFilter = THREE.LinearFilter;
  normal.anisotropy = 8;
  normal.colorSpace = THREE.NoColorSpace;
  normal.needsUpdate = true;

  brushedMetalMaps = { roughness, normal };
  return brushedMetalMaps;
}

function prepareScene(source: THREE.Group): PreparedScene {
  const scene = source.clone(true) as THREE.Group;
  const accentEmission = new THREE.Color("#31e7f3");
  const brushed = getBrushedMetalMaps();
  const objectsToRemove: THREE.Object3D[] = [];

  scene.traverse((object) => {
    if (
      REMOVED_SCENE_OBJECT_NAMES.has(normalizeSceneObjectName(object.name))
    ) {
      objectsToRemove.push(object);
    }

    if ((object as THREE.Light).isLight) {
      const light = object as THREE.Light;
      light.visible = false;
      light.intensity = 0;
      return;
    }

    if (!(object as THREE.Mesh).isMesh) return;

    const mesh = object as THREE.Mesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const sourceMaterials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const materials = sourceMaterials.map((material) => material.clone());

    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
  });

  scene.updateMatrixWorld(true);

  let bounds = new THREE.Box3().setFromObject(scene);
  const rawSize = bounds.getSize(new THREE.Vector3());
  const rawFootprint = Math.max(rawSize.x, rawSize.z, 0.001);
  const scale = 12 / rawFootprint;

  scene.scale.setScalar(scale);
  scene.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(scene);
  const initialCenter = bounds.getCenter(new THREE.Vector3());

  scene.position.x -= initialCenter.x;
  scene.position.y -= bounds.min.y;
  scene.position.z -= initialCenter.z;
  scene.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const emissiveLights: EmissiveLightData[] = [];
  const stageEdgeCandidates: StageEdgeRing[] = [];
  let importedCamera: ImportedCameraData | null = null;

  scene.traverse((object) => {
    if (!importedCamera && object instanceof THREE.PerspectiveCamera) {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();

      object.getWorldPosition(position);
      object.getWorldQuaternion(quaternion);

      importedCamera = {
        position,
        quaternion,
        fov: object.fov,
      };
    }

    if (!(object as THREE.Mesh).isMesh) return;

    const mesh = object as THREE.Mesh;
    const meshBounds = new THREE.Box3().setFromObject(mesh);
    const meshSize = meshBounds.getSize(new THREE.Vector3());
    const meshCenter = meshBounds.getCenter(new THREE.Vector3());
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const label = `${mesh.name} ${materials.map((material) => material.name).join(" ")}`;
    const horizontalSlab =
      meshSize.y <= Math.max(meshSize.x, meshSize.z) * 0.12 &&
      Math.max(meshSize.x, meshSize.z) >= Math.max(size.x, size.z) * 0.18;
    const verticalSurface =
      meshSize.y >= size.y * 0.28 &&
      Math.min(meshSize.x, meshSize.z) <= Math.max(meshSize.x, meshSize.z) * 0.16;
    const lowInRoom = meshCenter.y <= bounds.min.y + size.y * 0.34;
    const highInRoom = meshCenter.y >= bounds.min.y + size.y * 0.64;
    const floorLike =
      /(floor|ground|stage|platform|base|pedestal)/i.test(label) ||
      (horizontalSlab && lowInRoom);
    const ceilingLike =
      /(ceiling|roof|top|canopy)/i.test(label) ||
      (horizontalSlab && highInRoom);
    const structural = /(frame|rail|trim|structure|column|support|ring)/i.test(label);
    const wallLike = /(wall|backdrop|panel)/i.test(label) || verticalSurface;
    const ceilingEmitter = meshCenter.y >= bounds.min.y + size.y * 0.52;
    const centeredOnStage =
      Math.hypot(meshCenter.x - center.x, meshCenter.z - center.z) <=
      Math.max(size.x, size.z) * 0.085;
    const circularFootprint =
      Math.min(meshSize.x, meshSize.z) /
        Math.max(meshSize.x, meshSize.z, 0.001) >=
      0.82;
    const stageRadius = Math.max(meshSize.x, meshSize.z) * 0.5;
    const stageEdgeCandidate =
      horizontalSlab &&
      lowInRoom &&
      centeredOnStage &&
      circularFootprint &&
      stageRadius >= Math.max(size.x, size.z) * 0.12 &&
      stageRadius <= Math.max(size.x, size.z) * 0.49;

    if (stageEdgeCandidate) {
      stageEdgeCandidates.push({
        radius: stageRadius,
        y: meshBounds.max.y + 0.012,
        x: meshCenter.x,
        z: meshCenter.z,
      });
    }

    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        material.needsUpdate = true;
        return;
      }

      const emitter = isActualEmitter(mesh, material);
      const sourceColor = material.color.clone();
      material.dithering = true;

      if (emitter) {
        material.color.copy(new THREE.Color("#17242a")).lerp(sourceColor, 0.18);

        if (material.emissive.getHex() === 0) {
          material.emissive.copy(accentEmission);
        } else {
          material.emissive.lerp(accentEmission, 0.52);
        }

        material.emissiveIntensity = THREE.MathUtils.clamp(
          material.emissiveIntensity || 1,
          0.82,
          1.18,
        );
        material.metalness = THREE.MathUtils.clamp(material.metalness, 0.08, 0.5);
        material.roughness = THREE.MathUtils.clamp(
          Math.max(material.roughness, 0.3),
          0.3,
          0.52,
        );
        material.envMapIntensity = 0.78;
        material.userData.workSceneEmitter = true;
        material.userData.workSceneCeilingEmitter = ceilingEmitter;
        material.userData.workSceneDefaultEmissive = material.emissive.toArray();
        material.userData.workSceneDefaultEmissiveIntensity =
          material.emissiveIntensity;
      } else {
        const target = floorLike
          ? new THREE.Color("#10191d")
          : ceilingLike
            ? new THREE.Color("#10161d")
            : structural
              ? new THREE.Color("#090f15")
              : wallLike
                ? new THREE.Color("#04070b")
                : new THREE.Color("#111821");

        const preserveOriginal = floorLike
          ? 0.14
          : ceilingLike
            ? 0.12
            : structural
              ? 0.08
              : wallLike
                ? 0.04
                : 0.14;

        material.color.copy(target).lerp(sourceColor, preserveOriginal);
        material.metalness = floorLike
          ? 0.62
          : ceilingLike
            ? 0.52
            : structural
              ? 0.82
              : wallLike
                ? 0.12
                : 0.48;
        material.roughness = floorLike
          ? 0.38
          : ceilingLike
            ? 0.42
            : structural
              ? 0.34
              : wallLike
                ? 0.78
                : 0.44;
        material.envMapIntensity = floorLike
          ? 1.34
          : ceilingLike
            ? 0.82
            : structural
              ? 1.08
              : wallLike
                ? 0.2
                : 0.86;

        if (
          (floorLike || structural || ceilingLike) &&
          mesh.geometry.getAttribute("uv")
        ) {
          material.roughnessMap = brushed.roughness;
          material.normalMap = brushed.normal;
          material.normalScale.set(
            floorLike ? 0.032 : structural ? 0.035 : 0.025,
            floorLike ? 0.032 : structural ? 0.035 : 0.025,
          );
        }

        if (material.aoMap) {
          material.aoMapIntensity = floorLike ? 0.72 : 1.25;
        }
      }

      material.needsUpdate = true;
    });

    if (!materials.some((material) => isActualEmitter(mesh, material))) {
      return;
    }

    if (meshBounds.isEmpty()) return;

    if (!ceilingEmitter) return;

    emissiveLights.push({
      id: `${mesh.uuid}-${emissiveLights.length}`,
      position: [meshCenter.x, meshCenter.y - 0.06, meshCenter.z],
      target: [meshCenter.x, bounds.min.y + size.y * 0.22, meshCenter.z],
      intensity: THREE.MathUtils.clamp(
        Math.max(meshSize.x, meshSize.z) * 1.8,
        2.2,
        5.5,
      ),
      distance: Math.max(size.y * 1.8, 8),
      angle: THREE.MathUtils.degToRad(55),
    });
  });

  objectsToRemove.forEach((object) => {
    object.parent?.remove(object);
  });

  scene.updateMatrixWorld(true);

  const stageEdgeRings = stageEdgeCandidates
    .sort((a, b) => a.radius - b.radius)
    .reduce<StageEdgeRing[]>((rings, candidate) => {
      const duplicate = rings.some(
        (ring) => Math.abs(ring.radius - candidate.radius) < 0.18,
      );

      if (!duplicate) rings.push(candidate);
      return rings;
    }, []);

  return {
    scene,
    bounds,
    size,
    center,
    importedCamera,
    emissiveLights: emissiveLights.slice(0, 2),
    stageEdgeRings,
  };
}

function getShowcaseMetrics(prepared: PreparedScene): ShowcaseMetrics {
  const roomHeight = Math.max(prepared.size.y, 5.2);
  const mainHeight = THREE.MathUtils.clamp(roomHeight * 0.4, 2.25, 3.15);
  const mainWidth = mainHeight * 0.74;

  return {
    floorY: prepared.bounds.min.y + 0.035,
    mainWidth,
    mainHeight,
    mainX: prepared.center.x,
    centerZ: prepared.center.z - prepared.size.z * 0.07,
    totalWidth: mainWidth,
  };
}

function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const shape = new THREE.Shape();
  const left = -width * 0.5;
  const right = width * 0.5;
  const bottom = -height * 0.5;
  const top = height * 0.5;

  if (radius <= 0.0001) {
    shape.moveTo(left, bottom);
    shape.lineTo(right, bottom);
    shape.lineTo(right, top);
    shape.lineTo(left, top);
    shape.closePath();
    return shape;
  }

  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  shape.closePath();

  return shape;
}

function bowAmountAtX(x: number, width: number, bow: number): number {
  const normalizedX = THREE.MathUtils.clamp(x / (width * 0.5), -1, 1);
  return bow * (1 - normalizedX * normalizedX);
}

function createBowedGlassGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bow: number,
): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(
    createRoundedRectShape(width, height, radius),
    {
      depth,
      steps: 1,
      curveSegments: radius <= 0.0001 ? 1 : 20,
      bevelEnabled: true,
      bevelSegments: radius <= 0.0001 ? 3 : 5,
      bevelSize:
        radius <= 0.0001
          ? Math.min(0.007, depth * 0.08)
          : Math.min(0.045, depth * 0.32),
      bevelThickness:
        radius <= 0.0001
          ? Math.min(0.007, depth * 0.08)
          : Math.min(0.035, depth * 0.26),
    },
  );

  geometry.translate(0, 0, -depth * 0.5);

  const positions = geometry.attributes.position;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    positions.setZ(index, z + bowAmountAtX(x, width, bow));
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

function createBowedFilmGeometry(
  width: number,
  height: number,
  bow: number,
  profileWidth = width,
): THREE.PlaneGeometry {
  const widthSegments = Math.abs(bow) <= 0.0001 ? 1 : 64;
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, 1);
  const positions = geometry.attributes.position;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    positions.setZ(index, bowAmountAtX(x, profileWidth, bow));
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

function RealSpotLight({ data }: { data: EmissiveLightData }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    target.position.set(...data.target);
    target.updateMatrixWorld(true);

    if (!lightRef.current) return;

    lightRef.current.target = target;
    lightRef.current.target.updateMatrixWorld(true);
    lightRef.current.shadow.autoUpdate = false;
    lightRef.current.shadow.needsUpdate = true;
  }, [data.target, target]);

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={lightRef}
        position={data.position}
        color="#bdf7ff"
        intensity={data.intensity}
        distance={data.distance}
        angle={data.angle}
        penumbra={0.96}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
      />
    </>
  );
}

function getFallbackCamera(prepared: PreparedScene): ImportedCameraData {
  const roomDepth = Math.max(prepared.size.z, 0.001);
  const roomHeight = Math.max(prepared.size.y, 0.001);
  const position = new THREE.Vector3(
    prepared.center.x,
    prepared.bounds.min.y + roomHeight * 0.42,
    prepared.bounds.max.z + roomDepth * 0.12,
  );
  const target = new THREE.Vector3(
    prepared.center.x,
    prepared.bounds.min.y + roomHeight * 0.39,
    prepared.bounds.min.z + roomDepth * 0.42,
  );
  const helper = new THREE.Object3D();

  helper.position.copy(position);
  helper.lookAt(target);

  return {
    position,
    quaternion: helper.quaternion.clone(),
    fov: 45,
  };
}

function CameraSetup({
  prepared,
  settings,
}: {
  prepared: PreparedScene;
  settings: CameraSettings;
}) {
  const { camera, size: viewport } = useThree();

  const baseCamera = useMemo(
    () => prepared.importedCamera ?? getFallbackCamera(prepared),
    [prepared],
  );
  const currentSettingsRef = useRef<CameraSettings>({ ...settings });
  const transitionFromRef = useRef<CameraSettings>({ ...settings });
  const transitionTargetRef = useRef<CameraSettings>({ ...settings });
  const transitionElapsedRef = useRef(CAMERA_TRANSITION_SECONDS);
  const initializedRef = useRef(false);
  const cameraVectors = useMemo(
    () => ({
      right: new THREE.Vector3(1, 0, 0).applyQuaternion(
        baseCamera.quaternion,
      ),
      forward: new THREE.Vector3(0, 0, -1).applyQuaternion(
        baseCamera.quaternion,
      ),
      worldUp: new THREE.Vector3(0, 1, 0),
      localEuler: new THREE.Euler(0, 0, 0, "YXZ"),
      localRotation: new THREE.Quaternion(),
    }),
    [baseCamera],
  );

  const applySettings = (nextSettings: CameraSettings) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    camera.position
      .copy(baseCamera.position)
      .addScaledVector(cameraVectors.right, nextSettings.moveX)
      .addScaledVector(cameraVectors.worldUp, nextSettings.moveY)
      .addScaledVector(cameraVectors.forward, nextSettings.moveZ);

    cameraVectors.localEuler.set(
      THREE.MathUtils.degToRad(nextSettings.rotateX),
      THREE.MathUtils.degToRad(-nextSettings.rotateY),
      0,
      "YXZ",
    );
    cameraVectors.localRotation.setFromEuler(cameraVectors.localEuler);

    camera.quaternion
      .copy(baseCamera.quaternion)
      .multiply(cameraVectors.localRotation);
    camera.aspect = viewport.width / Math.max(viewport.height, 1);
    camera.filmGauge = 35;
    camera.setFocalLength(nextSettings.lensMm);
    camera.near = 0.02;
    camera.far = 300;
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
  };

  useLayoutEffect(() => {
    applySettings(currentSettingsRef.current);
    initializedRef.current = true;
  }, [baseCamera, camera, cameraVectors, viewport.height, viewport.width]);

  useEffect(() => {
    transitionFromRef.current = { ...currentSettingsRef.current };
    transitionTargetRef.current = { ...settings };
    transitionElapsedRef.current = 0;
  }, [settings]);

  useFrame((_, delta) => {
    if (!initializedRef.current) return;
    if (transitionElapsedRef.current >= CAMERA_TRANSITION_SECONDS) return;

    transitionElapsedRef.current = Math.min(
      transitionElapsedRef.current + Math.min(delta, 0.05),
      CAMERA_TRANSITION_SECONDS,
    );

    const progress = transitionElapsedRef.current / CAMERA_TRANSITION_SECONDS;
    const easedProgress = progress * progress * progress * (
      progress * (progress * 6 - 15) + 10
    );
    const nextSettings = currentSettingsRef.current;

    CAMERA_SETTING_KEYS.forEach((key) => {
      nextSettings[key] = THREE.MathUtils.lerp(
        transitionFromRef.current[key],
        transitionTargetRef.current[key],
        easedProgress,
      );
    });

    applySettings(nextSettings);
  });

  return null;
}

function GlassFilm({
  width,
  height,
  radius,
  depth,
  bow,
  active,
  introGlassProgress,
}: {
  width: number;
  height: number;
  radius: number;
  depth: number;
  bow: number;
  active: boolean;
  introGlassProgress: WorkIntroProgressRef;
}) {
  const geometry = useMemo(
    () => createBowedFilmGeometry(
      width * 0.968,
      height * 0.968,
      bow,
      width,
    ),
    [bow, height, width],
  );
  const uniforms = useMemo(
    () => ({
      uOpacity: {
        value: (active ? 0.52 : 0.32) * introGlassProgress.current,
      },
      uRadius: { value: radius / height },
      uAspect: { value: width / height },
      uResolution: {
        value: new THREE.Vector2(width * 720, height * 720),
      },
    }),
    [active, height, introGlassProgress, radius, width],
  );

  useFrame(() => {
    uniforms.uOpacity.value =
      (active ? 0.52 : 0.32) * introGlassProgress.current;
  });

  return (
    <mesh
      geometry={geometry}
      position={[0, 0, depth * 0.5 + 0.004]}
      renderOrder={4}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={GLASS_VERTEX_SHADER}
        fragmentShader={GLASS_FRAGMENT_SHADER}
        transparent
        alphaToCoverage
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function GlassPoster({
  width,
  height,
  depth,
  bow,
  posterUrl,
  introGlassProgress,
}: {
  width: number;
  height: number;
  depth: number;
  bow: number;
  posterUrl?: string;
  introGlassProgress: WorkIntroProgressRef;
}) {
  const { gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const emptyTexture = useMemo(() => {
    const texture = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 0]),
      1,
      1,
      THREE.RGBAFormat,
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  }, []);
  const initialCachedTexture = posterUrl
    ? glassPosterTextureCache.get(encodeURI(posterUrl))
    : undefined;
  const currentTextureRef = useRef<THREE.Texture>(
    initialCachedTexture ?? emptyTexture,
  );
  const currentVisibilityRef = useRef(initialCachedTexture ? 1 : 0);
  const incomingTextureRef = useRef<THREE.Texture>(
    initialCachedTexture ?? emptyTexture,
  );
  const incomingVisibilityRef = useRef(initialCachedTexture ? 1 : 0);
  const requestedPosterUrlRef = useRef<string | undefined>(posterUrl);
  const transitionElapsedRef = useRef(GLASS_POSTER_TRANSITION_SECONDS);
  const transitionActiveRef = useRef(false);
  const transitionSeedRef = useRef(3.7);
  const uniforms = useMemo(
    () => ({
      uCurrentMap: { value: currentTextureRef.current },
      uIncomingMap: { value: incomingTextureRef.current },
      uCurrentVisible: { value: currentVisibilityRef.current },
      uIncomingVisible: { value: incomingVisibilityRef.current },
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uSeed: { value: transitionSeedRef.current },
      uTransitioning: { value: 0 },
      uIntroOpacity: { value: introGlassProgress.current },
    }),
    [introGlassProgress],
  );
  const geometry = useMemo(
    () => createBowedFilmGeometry(
      width * 0.97,
      height * 0.97,
      bow,
      width,
    ),
    [bow, height, width],
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useEffect(() => {
    return () => {
      emptyTexture.dispose();
    };
  }, [emptyTexture]);

  useEffect(() => {
    requestedPosterUrlRef.current = posterUrl;
    let cancelled = false;
    const nextVisibility = posterUrl ? 1 : 0;
    const textureRequest = posterUrl
      ? loadGlassPosterTexture(posterUrl)
      : Promise.resolve(emptyTexture);

    void textureRequest
      .then((nextTexture) => {
        if (
          cancelled ||
          requestedPosterUrlRef.current !== posterUrl ||
          !materialRef.current
        ) {
          return;
        }

        if (posterUrl) {
          const maximumAnisotropy = Math.min(
            gl.capabilities.getMaxAnisotropy(),
            WORK_MAX_TEXTURE_ANISOTROPY,
          );
          const needsTextureUpdate =
            nextTexture.anisotropy !== maximumAnisotropy ||
            !nextTexture.generateMipmaps ||
            nextTexture.minFilter !== THREE.LinearMipmapLinearFilter ||
            nextTexture.magFilter !== THREE.LinearFilter;

          nextTexture.anisotropy = maximumAnisotropy;
          nextTexture.generateMipmaps = true;
          nextTexture.minFilter = THREE.LinearMipmapLinearFilter;
          nextTexture.magFilter = THREE.LinearFilter;
          if (needsTextureUpdate) nextTexture.needsUpdate = true;
        }

        const material = materialRef.current;
        const activeProgress = material.uniforms.uProgress.value as number;

        if (transitionActiveRef.current && activeProgress >= 0.5) {
          currentTextureRef.current = incomingTextureRef.current;
          currentVisibilityRef.current = incomingVisibilityRef.current;
        }

        if (
          currentTextureRef.current === nextTexture &&
          currentVisibilityRef.current === nextVisibility
        ) {
          transitionActiveRef.current = false;
          material.uniforms.uCurrentMap.value = nextTexture;
          material.uniforms.uCurrentVisible.value = nextVisibility;
          material.uniforms.uProgress.value = 1;
          material.uniforms.uTransitioning.value = 0;
          uniforms.uCurrentMap.value = nextTexture;
          uniforms.uCurrentVisible.value = nextVisibility;
          uniforms.uProgress.value = 1;
          uniforms.uTransitioning.value = 0;
          return;
        }

        incomingTextureRef.current = nextTexture;
        incomingVisibilityRef.current = nextVisibility;
        transitionSeedRef.current = (
          transitionSeedRef.current + 13.17 + nextTexture.id * 0.37
        ) % 997;
        transitionElapsedRef.current = 0;
        transitionActiveRef.current = true;
        if (meshRef.current) meshRef.current.visible = true;

        material.uniforms.uCurrentMap.value = currentTextureRef.current;
        material.uniforms.uIncomingMap.value = nextTexture;
        material.uniforms.uCurrentVisible.value = currentVisibilityRef.current;
        material.uniforms.uIncomingVisible.value = nextVisibility;
        material.uniforms.uProgress.value = 0;
        material.uniforms.uSeed.value = transitionSeedRef.current;
        material.uniforms.uTransitioning.value = 1;
        material.uniformsNeedUpdate = true;

        uniforms.uCurrentMap.value = currentTextureRef.current;
        uniforms.uIncomingMap.value = nextTexture;
        uniforms.uCurrentVisible.value = currentVisibilityRef.current;
        uniforms.uIncomingVisible.value = nextVisibility;
        uniforms.uProgress.value = 0;
        uniforms.uSeed.value = transitionSeedRef.current;
        uniforms.uTransitioning.value = 1;
      })
      .catch((error) => {
        if (!cancelled && posterUrl) {
          console.warn(
            `[WorkPage] Failed to load glass poster: ${posterUrl}`,
            error,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [emptyTexture, gl, posterUrl, uniforms]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uIntroOpacity.value = introGlassProgress.current;
    uniforms.uIntroOpacity.value = introGlassProgress.current;
    if (!transitionActiveRef.current) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uTime.value = state.clock.elapsedTime;

    transitionElapsedRef.current = Math.min(
      transitionElapsedRef.current + Math.min(delta, 0.05),
      GLASS_POSTER_TRANSITION_SECONDS,
    );
    const linearProgress =
      transitionElapsedRef.current / GLASS_POSTER_TRANSITION_SECONDS;
    const easedProgress = linearProgress * linearProgress * (
      3 - 2 * linearProgress
    );

    material.uniforms.uProgress.value = easedProgress;
    uniforms.uProgress.value = easedProgress;

    if (linearProgress >= 1) {
      currentTextureRef.current = incomingTextureRef.current;
      currentVisibilityRef.current = incomingVisibilityRef.current;
      transitionActiveRef.current = false;

      material.uniforms.uCurrentMap.value = currentTextureRef.current;
      material.uniforms.uCurrentVisible.value = currentVisibilityRef.current;
      material.uniforms.uProgress.value = 1;
      material.uniforms.uTransitioning.value = 0;
      material.uniformsNeedUpdate = true;

      uniforms.uCurrentMap.value = currentTextureRef.current;
      uniforms.uCurrentVisible.value = currentVisibilityRef.current;
      uniforms.uProgress.value = 1;
      uniforms.uTransitioning.value = 0;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, 0, depth * 0.5 + 0.001]}
      renderOrder={3}
      visible
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={GLASS_POSTER_TRANSITION_VERTEX_SHADER}
        fragmentShader={GLASS_POSTER_TRANSITION_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function GlassEdgeLight({
  width,
  height,
  depth,
  bow,
  accent,
  accentSecondary,
  introGlassProgress,
}: {
  width: number;
  height: number;
  depth: number;
  bow: number;
  accent: string;
  accentSecondary: string;
  introGlassProgress: WorkIntroProgressRef;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetAccent = useMemo(() => new THREE.Color(accent), [accent]);
  const targetAccentSecondary = useMemo(
    () => new THREE.Color(accentSecondary),
    [accentSecondary],
  );
  const geometry = useMemo(
    () => createBowedFilmGeometry(width, height, bow, width),
    [bow, height, width],
  );
  const uniforms = useMemo(
    () => ({
      uAspect: { value: width / height },
      uIntroOpacity: { value: introGlassProgress.current },
      uAccent: { value: new THREE.Color(accent) },
      uAccentSecondary: { value: new THREE.Color(accentSecondary) },
    }),
    [height, introGlassProgress, width],
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    const colorMix = 1 - Math.exp(
      -Math.min(delta, 0.05) * PROJECT_LIGHT_COLOR_LERP_SPEED,
    );
    materialRef.current.uniforms.uAccent.value.lerp(
      targetAccent,
      colorMix,
    );
    materialRef.current.uniforms.uAccentSecondary.value.lerp(
      targetAccentSecondary,
      colorMix,
    );
    materialRef.current.uniforms.uIntroOpacity.value =
      introGlassProgress.current;
  });

  return (
    <mesh
      geometry={geometry}
      position={[0, 0, depth * 0.5 + 0.009]}
      renderOrder={6}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={GLASS_VERTEX_SHADER}
        fragmentShader={GLASS_EDGE_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function GlassShowcase({
  width,
  height,
  position,
  rotationY,
  project,
  introGlassProgress,
  active = false,
}: GlassShowcaseProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glassMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const backMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const depth = active ? 0.15 : 0.11;
  const radius = 0;
  const bow = 0;
  const glassGeometry = useMemo(
    () => createBowedGlassGeometry(width, height, depth, radius, bow),
    [bow, depth, height, radius, width],
  );

  useLayoutEffect(() => {
    groupRef.current?.traverse((object) => {
      object.layers.set(WORK_GLASS_LAYER);
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const introProgress = introGlassProgress.current;
    const time = state.clock.elapsedTime;
    groupRef.current.position.set(
      position[0],
      position[1] + Math.sin(time * 0.72) * 0.045,
      position[2],
    );
    groupRef.current.rotation.set(
      Math.sin(time * 0.41) * 0.004,
      rotationY + Math.sin(time * 0.5) * 0.007,
      Math.sin(time * 0.36 + 0.8) * 0.003,
    );

    if (glassMaterialRef.current) {
      glassMaterialRef.current.opacity = introProgress;
      glassMaterialRef.current.envMapIntensity = 1.28 * introProgress;
    }
    if (backMaterialRef.current) {
      backMaterialRef.current.opacity = 0.018 * introProgress;
      backMaterialRef.current.envMapIntensity = introProgress;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={glassGeometry} castShadow receiveShadow renderOrder={2}>
        <meshPhysicalMaterial
          ref={glassMaterialRef}
          color="#ffffff"
          transmission={1}
          thickness={0.48}
          ior={1.5}
          roughness={0.032}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.026}
          envMapIntensity={1.28}
          attenuationColor="#ffffff"
          attenuationDistance={20}
          specularIntensity={0.9}
          specularColor="#ffffff"
          transparent
          opacity={1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, -depth * 0.5 - 0.014]} renderOrder={1}>
        <planeGeometry args={[width * 0.955, height * 0.955, 1, 1]} />
        <meshPhysicalMaterial
          ref={backMaterialRef}
          color="#ffffff"
          transmission={0.96}
          thickness={0.08}
          ior={1.46}
          roughness={0.09}
          metalness={0}
          attenuationColor="#ffffff"
          attenuationDistance={20}
          transparent
          opacity={0.018}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <GlassFilm
        width={width}
        height={height}
        radius={radius}
        depth={depth}
        bow={bow}
        active={active}
        introGlassProgress={introGlassProgress}
      />

      <GlassPoster
        width={width}
        height={height}
        depth={depth}
        bow={bow}
        posterUrl={project.posterUrl}
        introGlassProgress={introGlassProgress}
      />

      <GlassEdgeLight
        width={width}
        height={height}
        depth={depth}
        bow={bow}
        accent={project.accent}
        accentSecondary={project.accentSecondary}
        introGlassProgress={introGlassProgress}
      />
    </group>
  );
}

function ShowcaseInstallation({
  prepared,
  project,
  introGlassProgress,
}: {
  prepared: PreparedScene;
  project: WorkProject;
  introGlassProgress: WorkIntroProgressRef;
}) {
  const metrics = useMemo(() => getShowcaseMetrics(prepared), [prepared]);
  const glassY = metrics.floorY + metrics.mainHeight * 0.5 + 0.12;

  return (
    <GlassShowcase
      width={metrics.mainWidth}
      height={metrics.mainHeight}
      position={[metrics.mainX, glassY, metrics.centerZ]}
      rotationY={0}
      project={project}
      introGlassProgress={introGlassProgress}
      active
    />
  );
}

function createBackWallFogRibbonGeometry(
  width: number,
  height: number,
  bowDepth: number,
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, height, 96, 14);
  const positions = geometry.attributes.position;
  const halfWidth = Math.max(width * 0.5, 0.0001);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const normalizedX = THREE.MathUtils.clamp(x / halfWidth, -1, 1);
    const circularArc = 1 - Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));
    const edgePushForward = circularArc * bowDepth;

    positions.setZ(index, edgePushForward);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

type VoidFogLayerProps = {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY?: number;
  bowDepth?: number;
  seed: number;
  opacity: number;
  renderOrder: number;
};

function VoidFogLayer({
  width,
  height,
  position,
  rotationY = 0,
  bowDepth = 0,
  seed,
  opacity,
  renderOrder,
}: VoidFogLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(
    () => createBackWallFogRibbonGeometry(width, height, bowDepth),
    [bowDepth, height, width],
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uAspect: { value: new THREE.Vector2(width, height) },
    }),
    [height, opacity, seed, width],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      renderOrder={renderOrder}
      frustumCulled={false}
    >
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VOID_VERTEX_SHADER}
        fragmentShader={VOID_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function createSmokePuffTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.Texture();
    fallback.needsUpdate = true;
    return fallback;
  }

  ctx.clearRect(0, 0, size, size);

  const puffs = [
    [0.43, 0.58, 0.36, 0.48],
    [0.54, 0.54, 0.40, 0.42],
    [0.34, 0.48, 0.28, 0.26],
    [0.64, 0.46, 0.30, 0.24],
    [0.49, 0.40, 0.28, 0.20],
    [0.28, 0.62, 0.24, 0.20],
    [0.72, 0.61, 0.24, 0.18],
  ];

  for (const [x, y, radius, alpha] of puffs) {
    const cloud = ctx.createRadialGradient(
      size * x,
      size * y,
      size * radius * 0.08,
      size * x,
      size * y,
      size * radius,
    );
    cloud.addColorStop(0.00, `rgba(255,255,255,${alpha})`);
    cloud.addColorStop(0.32, `rgba(255,255,255,${alpha * 0.72})`);
    cloud.addColorStop(0.68, `rgba(255,255,255,${alpha * 0.24})`);
    cloud.addColorStop(1.00, "rgba(255,255,255,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, size, size);
  }

  ctx.globalCompositeOperation = "destination-in";
  const vertical = ctx.createLinearGradient(0, 0, 0, size);
  vertical.addColorStop(0.00, "rgba(255,255,255,0)");
  vertical.addColorStop(0.18, "rgba(255,255,255,0.74)");
  vertical.addColorStop(0.50, "rgba(255,255,255,1)");
  vertical.addColorStop(0.78, "rgba(255,255,255,0.58)");
  vertical.addColorStop(1.00, "rgba(255,255,255,0)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

type FogPuffFieldProps = {
  centerX: number;
  baseY: number;
  backZ: number;
  width: number;
  height: number;
};

type FogPuff = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  phase: number;
  speed: number;
  sway: number;
  opacity: number;
};

function FogPuffField({ centerX, baseY, backZ, width, height }: FogPuffFieldProps) {
  const texture = useMemo(() => createSmokePuffTexture(), []);
  const puffRefs = useRef<Array<THREE.Mesh | null>>([]);
  const puffs = useMemo<FogPuff[]>(() => {
    const values: FogPuff[] = [];
    const count = 58;

    for (let index = 0; index < count; index += 1) {
      const normalized = count <= 1 ? 0 : index / (count - 1);
      const row = index % 7;
      const rowMix = row / 6;
      const randomA = Math.sin(index * 12.9898) * 43758.5453;
      const randomB = Math.sin(index * 78.233) * 24634.6345;
      const randomC = Math.sin(index * 37.719) * 13519.341;
      const rA = randomA - Math.floor(randomA);
      const rB = randomB - Math.floor(randomB);
      const rC = randomC - Math.floor(randomC);
      const sideFade = Math.pow(Math.sin(normalized * Math.PI), 1.15);
      const clump = Math.sin(index * 2.31) * 0.26 + Math.sin(index * 5.17) * 0.15;

      values.push({
        x: (normalized - 0.5) * width * 0.58 + clump * sideFade,
        y: -height * 0.20 + rowMix * height * 0.115 + (rB - 0.5) * height * 0.045,
        z: (rC - 0.5) * 0.16,
        width: width * (0.085 + rA * 0.060) * (0.70 + sideFade * 0.48),
        height: height * (0.145 + rB * 0.085),
        phase: rA * Math.PI * 2 + index * 0.41,
        speed: 0.050 + rC * 0.045,
        sway: (0.060 + rA * 0.110) * sideFade,
        opacity: (0.045 + rC * 0.060) * sideFade,
      });
    }

    return values;
  }, [height, width]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    puffs.forEach((puff, index) => {
      const mesh = puffRefs.current[index];
      if (!mesh) return;

      const cycle = (elapsed * puff.speed + puff.phase) % 1;
      const rise = Math.sin(cycle * Math.PI);
      const drift = Math.sin(elapsed * 0.44 + puff.phase) * puff.sway;
      const curl = Math.sin(elapsed * 0.90 + puff.phase * 1.7) * puff.sway * 0.42;
      const breathe = 0.90 + Math.sin(elapsed * 0.38 + puff.phase * 0.8) * 0.10;

      mesh.position.set(
        centerX + puff.x + drift + curl,
        baseY + puff.y + rise * height * 0.105,
        backZ + puff.z,
      );
      mesh.scale.set(1.0 + rise * 0.22, 0.92 + rise * 0.34, 1);
      mesh.rotation.z = Math.sin(elapsed * 0.22 + puff.phase) * 0.085;

      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = puff.opacity * breathe * (0.78 + rise * 0.28);
    });
  });

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group renderOrder={6}>
      {puffs.map((puff, index) => (
        <mesh
          key={`fog-puff-${index}`}
          ref={(node) => {
            puffRefs.current[index] = node;
          }}
          position={[centerX + puff.x, baseY + puff.y, backZ + puff.z]}
          renderOrder={6 + index * 0.001}
          frustumCulled={false}
        >
          <planeGeometry args={[puff.width, puff.height, 1, 1]} />
          <meshBasicMaterial
            map={texture}
            color="#a8cbd0"
            transparent
            opacity={puff.opacity}
            depthTest
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}


type FogParticleFieldProps = {
  centerX: number;
  baseY: number;
  backZ: number;
  width: number;
  height: number;
};

function FogParticleField({ centerX, baseY, backZ, width, height }: FogParticleFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const count = 92;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sways = new Float32Array(count);
    const rises = new Float32Array(count);
    const alphas = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const normalized = count <= 1 ? 0 : index / (count - 1);
      const row = index % 9;
      const lane = row / 8;
      const randomA = Math.sin(index * 12.9898) * 43758.5453;
      const randomB = Math.sin(index * 78.233) * 24634.6345;
      const randomC = Math.sin(index * 37.719) * 13519.341;
      const rA = randomA - Math.floor(randomA);
      const rB = randomB - Math.floor(randomB);
      const rC = randomC - Math.floor(randomC);
      const sideFade = Math.sin(normalized * Math.PI);
      const plume = Math.sin(index * 2.17) * 0.34 + Math.sin(index * 5.41) * 0.16;

      positions[index * 3 + 0] = centerX + (normalized - 0.5) * width * 0.70 + plume * sideFade;
      positions[index * 3 + 1] = baseY - height * 0.26 + lane * height * 0.20 + (rB - 0.5) * height * 0.070;
      positions[index * 3 + 2] = backZ + (rC - 0.5) * 0.18;

      sizes[index] = 64 + rA * 88 + sideFade * 38;
      phases[index] = rB;
      speeds[index] = 0.020 + rC * 0.020;
      sways[index] = (0.040 + rA * 0.160) * sideFade;
      rises[index] = height * (0.14 + rB * 0.18);
      alphas[index] = (0.070 + rC * 0.072) * Math.pow(sideFade, 0.42);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    buffer.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    buffer.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    buffer.setAttribute('aSway', new THREE.BufferAttribute(sways, 1));
    buffer.setAttribute('aRise', new THREE.BufferAttribute(rises, 1));
    buffer.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    buffer.computeBoundingSphere();

    return buffer;
  }, [backZ, baseY, centerX, height, width]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.75) },
    }),
    [gl],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points geometry={geometry} renderOrder={6} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={FOG_PARTICLE_VERTEX_SHADER}
        fragmentShader={FOG_PARTICLE_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  );
}

function VoidBackdrop({ prepared }: { prepared: PreparedScene }) {
  const metrics = getShowcaseMetrics(prepared);
  const width = Math.max(prepared.size.x * 1.62, metrics.mainWidth * 2.88, 14.8);
  const height = Math.max(metrics.mainHeight * 1.30, 2.96);
  const backZ = prepared.bounds.min.z + prepared.size.z * 1.02;
  const baseY = metrics.floorY + metrics.mainHeight * 0.36;
  const fogYOffset = metrics.mainHeight * 0.22;
  const fogY = baseY + fogYOffset;

  return (
    <FogPuffField
      centerX={prepared.center.x}
      baseY={fogY}
      backZ={backZ - 0.045}
      width={width}
      height={height}
    />
  );
}



type CrtWallProps = {
  prepared: PreparedScene;
  project: WorkProject;
  introScreenProgress: WorkIntroProgressRef;
  introEnvironmentProgress: WorkIntroProgressRef;
  allowGpuPreload: boolean;
};

const CRT_WALL_TILE_REPEAT = 1.4;
type CrtMainTransitionPhase = "idle" | "out" | "in";

function CrtWall({
  prepared,
  project,
  introScreenProgress,
  introEnvironmentProgress,
  allowGpuPreload,
}: CrtWallProps) {
  const { gl } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [initialTexture] = useState(() => getCrtWallTexture(project));
  const [baseTexture] = useState(() => getCrtWallTexture(EMPTY_CRT_PROJECT));
  const pendingTextureRef = useRef<THREE.Texture | null>(null);
  const requestedProjectIdRef = useRef(project.id);
  const transitionPhaseRef = useRef<CrtMainTransitionPhase>("idle");
  const transitionElapsedRef = useRef(0);
  const transitionStartOpacityRef = useRef(1);
  const metrics = useMemo(() => getShowcaseMetrics(prepared), [prepared]);
  const width = Math.max(prepared.size.x * 1.28, metrics.mainWidth * 2.46, 12.4);
  const height = Math.max(metrics.mainHeight * 0.78, 2.34);
  const crtWallBackOffset = 1.12;
  const crtWallCurveDepth = -0.94;
  const backZ = prepared.bounds.min.z + prepared.size.z * crtWallBackOffset;
  const wallY = metrics.floorY + metrics.mainHeight * 0.72;
  const bowDepth = prepared.size.z * crtWallCurveDepth;
  const geometry = useMemo(
    () => createCurvedBackdropGeometry(width, height, bowDepth, 96, 12),
    [bowDepth, height, width],
  );
  const uniforms = useMemo(
    () => ({
      uMap: { value: initialTexture },
      uBaseMap: { value: baseTexture },
      uOpacity: { value: introScreenProgress.current },
      uMainOpacity: { value: 1 },
      uPanelOpacity: { value: introEnvironmentProgress.current },
      uScroll: { value: 0 },
      uTileRepeat: { value: CRT_WALL_TILE_REPEAT },
    }),
    [
      baseTexture,
      initialTexture,
      introEnvironmentProgress,
      introScreenProgress,
    ],
  );

  useEffect(() => {
    if (requestedProjectIdRef.current === project.id) return;

    requestedProjectIdRef.current = project.id;
    pendingTextureRef.current = getCrtWallTexture(project);
    transitionStartOpacityRef.current =
      materialRef.current?.uniforms.uMainOpacity.value ??
      uniforms.uMainOpacity.value;
    transitionElapsedRef.current = 0;
    transitionPhaseRef.current = "out";
  }, [project, uniforms]);

  useEffect(() => {
    if (!allowGpuPreload) return;

    const browserWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    const textureRenderer = gl as THREE.WebGLRenderer & {
      initTexture?: (texture: THREE.Texture) => void;
    };
    const warmedKeys = new Set<string>();
    const textureQueue = SELECTABLE_WORK_PROJECTS.filter((workProject) => {
      const key = getCrtWallTextureKey(workProject);
      if (warmedKeys.has(key)) return false;
      warmedKeys.add(key);
      return true;
    });
    let textureIndex = 0;

    const warmNextTexture = () => {
      idleHandle = undefined;
      timeoutHandle = undefined;
      if (cancelled || textureIndex >= textureQueue.length) return;

      textureRenderer.initTexture?.(
        getCrtWallTexture(textureQueue[textureIndex]),
      );
      textureIndex += 1;

      if (textureIndex < textureQueue.length) {
        timeoutHandle = window.setTimeout(scheduleNextTexture, 90);
      }
    };

    const scheduleNextTexture = () => {
      timeoutHandle = undefined;
      if (cancelled) return;

      if (browserWindow.requestIdleCallback) {
        idleHandle = browserWindow.requestIdleCallback(warmNextTexture, {
          timeout: 1200,
        });
      } else {
        timeoutHandle = window.setTimeout(warmNextTexture, 160);
      }
    };

    scheduleNextTexture();

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) {
        browserWindow.cancelIdleCallback?.(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [allowGpuPreload, gl]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uOpacity.value = introScreenProgress.current;
    material.uniforms.uPanelOpacity.value = introEnvironmentProgress.current;
    material.uniforms.uScroll.value = (
      state.clock.elapsedTime * 0.018 * CRT_WALL_TILE_REPEAT
    ) % 1;

    const phase = transitionPhaseRef.current;
    if (phase === "idle") return;

    const duration = phase === "out"
      ? CRT_MAIN_FADE_OUT_SECONDS
      : CRT_MAIN_FADE_IN_SECONDS;
    transitionElapsedRef.current = Math.min(
      transitionElapsedRef.current + Math.min(delta, 0.05),
      duration,
    );

    const progress = transitionElapsedRef.current / duration;
    const easedProgress = progress * progress * (3 - 2 * progress);

    if (phase === "out") {
      const nextOpacity = THREE.MathUtils.lerp(
        transitionStartOpacityRef.current,
        0,
        easedProgress,
      );
      material.uniforms.uMainOpacity.value = nextOpacity;
      uniforms.uMainOpacity.value = nextOpacity;

      if (progress >= 1) {
        const nextTexture = pendingTextureRef.current;
        if (!nextTexture) {
          transitionPhaseRef.current = "idle";
          return;
        }

        pendingTextureRef.current = null;
        material.uniforms.uMap.value = nextTexture;
        material.uniforms.uMainOpacity.value = 0;
        material.uniformsNeedUpdate = true;
        uniforms.uMap.value = nextTexture;
        uniforms.uMainOpacity.value = 0;
        transitionElapsedRef.current = 0;
        transitionPhaseRef.current = "in";
      }

      return;
    }

    material.uniforms.uMainOpacity.value = easedProgress;
    uniforms.uMainOpacity.value = easedProgress;

    if (progress >= 1) {
      material.uniforms.uMainOpacity.value = 1;
      uniforms.uMainOpacity.value = 1;
      transitionPhaseRef.current = "idle";
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group>
      <mesh
        geometry={geometry}
        position={[prepared.center.x, wallY, backZ]}
        renderOrder={1}
        frustumCulled={false}
      >
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={CRT_WALL_VERTEX_SHADER}
          fragmentShader={CRT_WALL_FRAGMENT_SHADER}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <SoftAreaLight
        position={[
          prepared.center.x,
          wallY + height * 0.04,
          backZ - 0.08,
        ]}
        target={[
          metrics.mainX,
          metrics.floorY + 0.22,
          metrics.centerZ + prepared.size.z * 0.015,
        ]}
        color="#effcff"
        intensity={1.95}
        width={width * 0.54}
        height={height * 0.62}
        intensityScale={introEnvironmentProgress}
      />

      <FadingPointLight
        position={[
          prepared.center.x - width * 0.16,
          wallY - height * 0.04,
          backZ - 0.05,
        ]}
        color="#f2fcff"
        intensity={0.28}
        distance={Math.max(width * 0.36, 5.1)}
        decay={2}
        intensityScale={introEnvironmentProgress}
      />

      <FadingPointLight
        position={[
          prepared.center.x + width * 0.18,
          wallY - height * 0.03,
          backZ - 0.05,
        ]}
        color="#effcff"
        intensity={0.24}
        distance={Math.max(width * 0.34, 4.9)}
        decay={2}
        intensityScale={introEnvironmentProgress}
      />
    </group>
  );
}

type VolumetricBeamPlaneProps = {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY: number;
  seed: number;
  opacity: number;
};

function VolumetricBeamPlane({
  width,
  height,
  position,
  rotationY,
  seed,
  opacity,
}: VolumetricBeamPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
    }),
    [opacity, seed],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      renderOrder={12}
      frustumCulled={false}
    >
      <planeGeometry args={[width, height, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VOLUMETRIC_BEAM_VERTEX_SHADER}
        fragmentShader={VOLUMETRIC_BEAM_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function FloorMist({ prepared }: { prepared: PreparedScene }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const metrics = useMemo(() => getShowcaseMetrics(prepared), [prepared]);
  const size = Math.max(prepared.size.x * 1.72, prepared.size.z * 1.72, 18);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1.08 },
      uSeed: { value: 8.41 },
    }),
    [],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      position={[metrics.mainX, metrics.floorY + 0.075, metrics.centerZ]}
      rotation={[-Math.PI * 0.5, 0, 0]}
      renderOrder={10}
      frustumCulled={false}
    >
      <planeGeometry args={[size, size, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={FLOOR_MIST_VERTEX_SHADER}
        fragmentShader={FLOOR_MIST_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function WorkAtmosphere({ prepared: _prepared }: { prepared: PreparedScene }) {
  return null;
}

function CenterFloorCap({
  prepared,
  introEnvironmentProgress,
}: {
  prepared: PreparedScene;
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const metrics = useMemo(() => getShowcaseMetrics(prepared), [prepared]);
  const innerStageRing = prepared.stageEdgeRings[0];
  const radius = innerStageRing
    ? innerStageRing.radius * 0.98
    : Math.max(metrics.mainWidth * 1.22, 1.86);
  const capX = innerStageRing ? innerStageRing.x : metrics.mainX;
  const capZ = innerStageRing ? innerStageRing.z : metrics.centerZ;
  const topY = innerStageRing
    ? innerStageRing.y + 0.010
    : metrics.floorY + 0.038;
  const thickness = 0.032;
  const brushed = useMemo(() => getBrushedMetalMaps(), []);
  const normalScale = useMemo(() => new THREE.Vector2(0.018, 0.018), []);

  useFrame(() => {
    if (!materialRef.current) return;
    materialRef.current.envMapIntensity =
      1.46 * introEnvironmentProgress.current;
  });

  return (
    <mesh
      position={[capX, topY - thickness * 0.5, capZ]}
      receiveShadow
    >
      <cylinderGeometry args={[radius, radius, thickness, 192, 1, false]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#242f33"
        metalness={0.58}
        roughness={0.30}
        clearcoat={0.24}
        clearcoatRoughness={0.40}
        envMapIntensity={1.46}
        roughnessMap={brushed.roughness}
        normalMap={brushed.normal}
        normalScale={normalScale}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}

function StageEdgeLeds({ prepared }: { prepared: PreparedScene }) {
  const stepLights = useMemo(() => {
    const metrics = getShowcaseMetrics(prepared);
    const detected = prepared.stageEdgeRings
      .filter((ring) => ring.radius > metrics.mainWidth * 0.42)
      .sort((a, b) => a.radius - b.radius);

    const baseRings = detected.length >= 3
      ? detected
      : prepared.stageEdgeRings.sort((a, b) => a.radius - b.radius);

    if (baseRings.length < 2) return [];

    const outerRadius = Math.max(
      baseRings[baseRings.length - 1]?.radius ?? 1,
      metrics.mainWidth * 2.7,
    );

    return baseRings.slice(-5).map((ring, index, rings) => {
      const radiusRatio = THREE.MathUtils.clamp(
        ring.radius / Math.max(outerRadius, 0.001),
        0,
        1,
      );
      const isOuter = index === rings.length - 1;

      return {
        radius: Math.max(
          ring.radius - THREE.MathUtils.lerp(0.040, 0.074, radiusRatio),
          0.08,
        ),
        x: ring.x,
        z: ring.z,
        // Manual control: this is the vertical position of the side-face light band.
        // Less negative = moves up. More negative = moves deeper under the step lip.
        y: ring.y - THREE.MathUtils.lerp(0.032, 0.058, radiusRatio),
        sideHeight: THREE.MathUtils.lerp(0.034, 0.054, radiusRatio),
        coreHeight: THREE.MathUtils.lerp(0.006, 0.009, radiusRatio),
        underTube: THREE.MathUtils.lerp(0.0045, 0.0075, radiusRatio),
        continuityTube: THREE.MathUtils.lerp(0.0032, 0.0058, radiusRatio),
        glowOpacity: isOuter ? 0.16 : THREE.MathUtils.lerp(0.085, 0.130, radiusRatio),
        coreOpacity: isOuter ? 0.54 : THREE.MathUtils.lerp(0.36, 0.50, radiusRatio),
        underOpacity: isOuter ? 0.19 : THREE.MathUtils.lerp(0.095, 0.155, radiusRatio),
        continuityOpacity: isOuter ? 0.16 : THREE.MathUtils.lerp(0.080, 0.125, radiusRatio),
        lightPower: isOuter ? 0.82 : THREE.MathUtils.lerp(0.40, 0.62, radiusRatio),
      };
    });
  }, [prepared]);

  if (stepLights.length < 2) return null;

  return (
    <group>
      {stepLights.map((ring, index) => {
        const key = `${index}-${ring.radius.toFixed(3)}-${ring.y.toFixed(3)}`;

        return (
          <group key={key}>
            {/* Soft glow living on the vertical side face of each floor step. */}
            <mesh
              position={[ring.x, ring.y, ring.z]}
              renderOrder={10 + index}
              frustumCulled={false}
            >
              <cylinderGeometry
                args={[
                  ring.radius,
                  ring.radius,
                  ring.sideHeight,
                  384,
                  1,
                  true,
                ]}
              />
              <meshBasicMaterial
                color={new THREE.Color(0.015, 0.74, 0.92)}
                transparent
                opacity={ring.glowOpacity}
                blending={THREE.AdditiveBlending}
                depthTest
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>

            {/* Thin integrated emitter line, not a fat top-surface neon stripe. */}
            <mesh
              position={[ring.x, ring.y + ring.sideHeight * 0.18, ring.z]}
              renderOrder={12 + index}
              frustumCulled={false}
            >
              <cylinderGeometry
                args={[
                  ring.radius + 0.002,
                  ring.radius + 0.002,
                  ring.coreHeight,
                  384,
                  1,
                  true,
                ]}
              />
              <meshBasicMaterial
                color={new THREE.Color(0.17, 2.35, 2.85)}
                transparent
                opacity={ring.coreOpacity}
                blending={THREE.AdditiveBlending}
                depthTest
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>

            {/* Under-lip glancing light: creates the green-arrow style edge depth. */}
            <mesh
              position={[ring.x, ring.y - ring.sideHeight * 0.58, ring.z]}
              rotation={[Math.PI * 0.5, 0, 0]}
              renderOrder={9 + index}
              frustumCulled={false}
            >
              <torusGeometry
                args={[
                  Math.max(ring.radius - 0.012, 0.06),
                  ring.underTube,
                  6,
                  384,
                ]}
              />
              <meshBasicMaterial
                color={new THREE.Color(0.025, 1.18, 1.42)}
                transparent
                opacity={ring.underOpacity}
                blending={THREE.AdditiveBlending}
                depthTest
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            {/* Very thin under-lip continuity glint.
                It is below the step edge, not on the floor surface, so the previous look stays intact
                while helping the ring read as circular from wider camera angles. */}
            <mesh
              position={[ring.x, ring.y - ring.sideHeight * 0.70, ring.z]}
              rotation={[Math.PI * 0.5, 0, 0]}
              renderOrder={18 + index}
              frustumCulled={false}
            >
              <torusGeometry
                args={[
                  Math.max(ring.radius - 0.026, 0.06),
                  ring.continuityTube,
                  5,
                  384,
                ]}
              />
              <meshBasicMaterial
                color={new THREE.Color(0.08, 1.45, 1.72)}
                transparent
                opacity={ring.continuityOpacity}
                blending={THREE.AdditiveBlending}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>

            {/* Very small local fill, no shadows, just enough to catch nearby metal. */}
            {index % 2 === 0 ? (
              <pointLight
                position={[ring.x, ring.y - ring.sideHeight * 0.46, ring.z + ring.radius]}
                color="#40f4ff"
                intensity={0.18 * ring.lightPower}
                distance={Math.max(ring.radius * 0.34, 1.15)}
                decay={2}
              />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function ReflectiveFloor({
  prepared,
  introEnvironmentProgress,
}: {
  prepared: PreparedScene;
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const metrics = useMemo(() => getShowcaseMetrics(prepared), [prepared]);
  const floorSize = Math.max(
    metrics.totalWidth * 2.25,
    prepared.size.x * 2.2,
    120,
  );
  const brushed = useMemo(() => getBrushedMetalMaps(), []);
  const normalScale = useMemo(() => new THREE.Vector2(0.05, 0.05), []);

  useFrame(() => {
    if (!materialRef.current) return;
    materialRef.current.envMapIntensity =
      1.18 * introEnvironmentProgress.current;
  });

  return (
    <mesh
      position={[prepared.center.x, metrics.floorY - 0.18, prepared.center.z]}
      rotation={[-Math.PI * 0.5, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[floorSize, floorSize, 1, 1]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#0d171b"
        metalness={0.62}
        roughness={0.36}
        clearcoat={0.08}
        clearcoatRoughness={0.70}
        envMapIntensity={1.18}
        roughnessMap={brushed.roughness}
        normalMap={brushed.normal}
        normalScale={normalScale}
      />
    </mesh>
  );
}

type SoftAreaLightProps = {
  position: [number, number, number];
  target: [number, number, number];
  color: string;
  intensity: number;
  width: number;
  height: number;
  intensityScale?: WorkIntroProgressRef;
};

function SoftAreaLight({
  position,
  target,
  color,
  intensity,
  width,
  height,
  intensityScale,
}: SoftAreaLightProps) {
  const lightRef = useRef<THREE.RectAreaLight>(null);
  const initializedRef = useRef(false);
  const initialColorRef = useRef(new THREE.Color(color));
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  useLayoutEffect(() => {
    if (!lightRef.current) return;
    lightRef.current.lookAt(target[0], target[1], target[2]);

    if (!initializedRef.current) {
      lightRef.current.color.copy(initialColorRef.current);
      initializedRef.current = true;
    }
  }, [target]);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    const colorMix = 1 - Math.exp(
      -Math.min(delta, 0.05) * PROJECT_LIGHT_COLOR_LERP_SPEED,
    );
    lightRef.current.color.lerp(targetColor, colorMix);
    lightRef.current.intensity =
      intensity * (intensityScale?.current ?? 1);
  });

  return (
    <rectAreaLight
      ref={lightRef}
      position={position}
      intensity={intensity * (intensityScale?.current ?? 1)}
      width={width}
      height={height}
    />
  );
}

type FadingPointLightProps = {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
  decay: number;
  intensityScale: WorkIntroProgressRef;
};

function FadingPointLight({
  position,
  color,
  intensity,
  distance,
  decay,
  intensityScale,
}: FadingPointLightProps) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.intensity = intensity * intensityScale.current;
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity * intensityScale.current}
      distance={distance}
      decay={decay}
    />
  );
}

function ShadowKeyLight({
  prepared,
  introEnvironmentProgress,
}: {
  prepared: PreparedScene;
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const baseIntensityRef = useRef<number | null>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const targetPosition = useMemo<[number, number, number]>(
    () => [
      prepared.center.x,
      prepared.bounds.min.y + prepared.size.y * 0.28,
      prepared.center.z - prepared.size.z * 0.04,
    ],
    [prepared],
  );

  useLayoutEffect(() => {
    target.position.set(...targetPosition);
    target.updateMatrixWorld(true);

    if (lightRef.current) {
      if (baseIntensityRef.current === null) {
        baseIntensityRef.current = lightRef.current.intensity;
      }
      lightRef.current.intensity =
        baseIntensityRef.current * introEnvironmentProgress.current;
      lightRef.current.target = target;
      lightRef.current.target.updateMatrixWorld(true);
      lightRef.current.shadow.autoUpdate = false;
      lightRef.current.shadow.needsUpdate = true;
    }
  }, [introEnvironmentProgress, target, targetPosition]);

  useFrame(() => {
    if (!lightRef.current || baseIntensityRef.current === null) return;
    lightRef.current.intensity =
      baseIntensityRef.current * introEnvironmentProgress.current;
  });

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={lightRef}
        position={[
          prepared.center.x - prepared.size.x * 0.24,
          prepared.bounds.max.y - prepared.size.y * 0.12,
          prepared.center.z + prepared.size.z * 0.26,
        ]}
        color="#d9f4f7"
        intensity={0.78}
        distance={Math.max(prepared.size.y * 2.2, 12)}
        angle={THREE.MathUtils.degToRad(44)}
        penumbra={1}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00018}
        shadow-normalBias={0.024}
      />
    </>
  );
}

function FrontCameraFloorFill({
  prepared,
  introEnvironmentProgress,
}: {
  prepared: PreparedScene;
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const metrics = useMemo(() => getShowcaseMetrics(prepared), [prepared]);

  return (
    <SoftAreaLight
      position={[
        prepared.center.x,
        prepared.bounds.min.y + prepared.size.y * 0.34,
        prepared.bounds.max.z + prepared.size.z * 0.58,
      ]}
      target={[
        metrics.mainX,
        metrics.floorY + 0.055,
        metrics.centerZ + prepared.size.z * 0.03,
      ]}
      color="#d8f0f2"
      intensity={2.35}
      width={prepared.size.x * 0.92}
      height={prepared.size.y * 0.20}
      intensityScale={introEnvironmentProgress}
    />
  );
}

function WorkEnvironment({
  settings,
  project,
  introScreenProgress,
  introEnvironmentProgress,
  introGlassProgress,
  allowGpuPreload,
  onSceneReady,
}: {
  settings: CameraSettings;
  project: WorkProject;
  introScreenProgress: WorkIntroProgressRef;
  introEnvironmentProgress: WorkIntroProgressRef;
  introGlassProgress: WorkIntroProgressRef;
  allowGpuPreload: boolean;
  onSceneReady: () => void;
}) {
  const { camera, gl, scene } = useThree();
  const gltf = useGLTF(WORK_SCENE_URL);
  const prepared = useMemo(() => prepareScene(gltf.scene), [gltf.scene]);
  const emitterMaterials = useMemo(() => {
    const emitters: Array<{
      material: THREE.MeshStandardMaterial;
      target: THREE.Color;
      intensity: number;
      ceiling: boolean;
    }> = [];

    prepared.scene.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return;

      const material = (object as THREE.Mesh).material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((item) => {
        if (!(item instanceof THREE.MeshStandardMaterial)) return;
        if (!item.userData.workSceneEmitter) return;
        const defaultIntensity = item.userData
          .workSceneDefaultEmissiveIntensity as number | undefined;
        emitters.push({
          material: item,
          target: item.emissive.clone(),
          intensity: defaultIntensity ?? item.emissiveIntensity,
          ceiling: Boolean(item.userData.workSceneCeilingEmitter),
        });
      });
    });

    return emitters;
  }, [prepared]);
  const environmentMaterials = useMemo(() => {
    const materials = new Map<THREE.MeshStandardMaterial, number>();

    prepared.scene.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return;

      const material = (object as THREE.Mesh).material;
      const objectMaterials = Array.isArray(material) ? material : [material];
      objectMaterials.forEach((item) => {
        if (!(item instanceof THREE.MeshStandardMaterial)) return;
        if (!materials.has(item)) {
          materials.set(item, item.envMapIntensity);
        }
      });
    });

    return Array.from(materials, ([material, intensity]) => ({
      material,
      intensity,
    }));
  }, [prepared]);

  useEffect(() => {
    const renderer = gl as THREE.WebGLRenderer & {
      compileAsync?: (
        targetScene: THREE.Scene,
        targetCamera: THREE.Camera,
      ) => Promise<unknown>;
    };
    let cancelled = false;
    let settleFrame = 0;

    const prepareVisibleIntro = async () => {
      const compileCamera = camera.clone();
      compileCamera.layers.enableAll();

      try {
        if (renderer.compileAsync) {
          await renderer.compileAsync(scene, compileCamera);
        } else {
          renderer.compile(scene, compileCamera);
        }
      } catch (error) {
        console.warn("[WorkPage] Scene shader warmup was skipped.", error);
      }

      if (cancelled) return;
      settleFrame = window.requestAnimationFrame(() => {
        settleFrame = window.requestAnimationFrame(() => {
          if (!cancelled) onSceneReady();
        });
      });
    };

    void prepareVisibleIntro();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(settleFrame);
    };
  }, [camera, gl, onSceneReady, scene]);

  useEffect(() => {
    const projectEmission = new THREE.Color(project.emission);
    const ceilingEmission = new THREE.Color(project.ceilingEmission ?? project.emission);
    const ceilingIntensity = project.ceilingEmissionIntensity ?? 1;
    const useStudioEmission = project.id === 0;

    emitterMaterials.forEach(({ material, target, intensity, ceiling }) => {
      const defaultEmissive = material.userData
        .workSceneDefaultEmissive as number[] | undefined;

      if (useStudioEmission && defaultEmissive) {
        target.fromArray(defaultEmissive);
      } else if (ceiling) {
        target.copy(ceilingEmission);
      } else {
        target.copy(projectEmission);
      }

      material.userData.workSceneTargetIntensity =
        intensity * (ceiling ? ceilingIntensity : 1);
    });
  }, [
    emitterMaterials,
    project.ceilingEmission,
    project.ceilingEmissionIntensity,
    project.emission,
    project.id,
  ]);

  useFrame((_, delta) => {
    const environmentProgress = introEnvironmentProgress.current;
    if (introGlassProgress.current > 0.001) {
      camera.layers.enable(WORK_GLASS_LAYER);
    } else {
      camera.layers.disable(WORK_GLASS_LAYER);
    }
    const colorMix = 1 - Math.exp(
      -Math.min(delta, 0.05) * PROJECT_LIGHT_COLOR_LERP_SPEED,
    );
    emitterMaterials.forEach(({ material, target, intensity }) => {
      material.emissive.lerp(target, colorMix);
      const targetIntensity =
        (material.userData.workSceneTargetIntensity as number | undefined) ??
        intensity;
      material.emissiveIntensity = targetIntensity * environmentProgress;
    });
    environmentMaterials.forEach(({ material, intensity }) => {
      material.envMapIntensity = intensity * environmentProgress;
    });
  });

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<THREE.Material>();

      prepared.scene.traverse((object) => {
        if (!(object as THREE.Mesh).isMesh) return;

        const material = (object as THREE.Mesh).material;
        const materials = Array.isArray(material) ? material : [material];
        materials.forEach((item) => {
          if (disposedMaterials.has(item)) return;
          disposedMaterials.add(item);
          item.dispose();
        });
      });
    };
  }, [prepared]);

  return (
    <>
      <CameraSetup prepared={prepared} settings={settings} />
      {WORK_FOG_ENABLED ? <VoidBackdrop prepared={prepared} /> : null}
      <CrtWall
        prepared={prepared}
        project={project}
        introScreenProgress={introScreenProgress}
        introEnvironmentProgress={introEnvironmentProgress}
        allowGpuPreload={allowGpuPreload}
      />
      <primitive object={prepared.scene} />
      <ReflectiveFloor
        prepared={prepared}
        introEnvironmentProgress={introEnvironmentProgress}
      />
      <CenterFloorCap
        prepared={prepared}
        introEnvironmentProgress={introEnvironmentProgress}
      />
      <FrontCameraFloorFill
        prepared={prepared}
        introEnvironmentProgress={introEnvironmentProgress}
      />
      <ShowcaseInstallation
        prepared={prepared}
        project={project}
        introGlassProgress={introGlassProgress}
      />
      <WorkAtmosphere prepared={prepared} />

      <SoftAreaLight
        position={[
          prepared.bounds.min.x - prepared.size.x * 0.28,
          prepared.bounds.min.y + prepared.size.y * 0.66,
          prepared.bounds.max.z + prepared.size.z * 0.2,
        ]}
        target={[
          prepared.center.x,
          prepared.bounds.min.y + prepared.size.y * 0.34,
          prepared.center.z,
        ]}
        color={project.lightLeft}
        intensity={5.2}
        width={prepared.size.x * 0.42}
        height={prepared.size.y * 0.34}
        intensityScale={introEnvironmentProgress}
      />

      <SoftAreaLight
        position={[
          prepared.bounds.max.x + prepared.size.x * 0.24,
          prepared.bounds.min.y + prepared.size.y * 0.56,
          prepared.center.z + prepared.size.z * 0.06,
        ]}
        target={[
          prepared.center.x,
          prepared.bounds.min.y + prepared.size.y * 0.3,
          prepared.center.z,
        ]}
        color={project.lightRight}
        intensity={3.4}
        width={prepared.size.x * 0.34}
        height={prepared.size.y * 0.3}
        intensityScale={introEnvironmentProgress}
      />

      <SoftAreaLight
        position={[
          prepared.center.x + prepared.size.x * 0.08,
          prepared.bounds.min.y + prepared.size.y * 0.72,
          prepared.bounds.min.z - prepared.size.z * 0.3,
        ]}
        target={[
          prepared.center.x,
          prepared.bounds.min.y + prepared.size.y * 0.38,
          prepared.center.z,
        ]}
        color={project.lightBack}
        intensity={4.1}
        width={prepared.size.x * 0.46}
        height={prepared.size.y * 0.18}
        intensityScale={introEnvironmentProgress}
      />

      <ShadowKeyLight
        prepared={prepared}
        introEnvironmentProgress={introEnvironmentProgress}
      />

      <ContactShadows
        position={[
          prepared.center.x,
          prepared.bounds.min.y + 0.032,
          prepared.center.z,
        ]}
        opacity={0.42}
        scale={12}
        blur={3.4}
        far={7}
        resolution={256}
        frames={1}
        color="#000000"
      />
    </>
  );
}

function WorkSceneLoader() {
  const { active } = useProgress();

  if (!active) return null;

  return (
    <div
      className="work-scene-loader"
      role="status"
      aria-label="Loading 3D scene"
      aria-live="polite"
    />
  );
}

function LocalStudioEnvironment({
  introEnvironmentProgress,
}: {
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const { gl, scene } = useThree();
  const studioProject = WORK_PROJECTS[0];
  const sceneWithEnvironmentIntensity = scene as THREE.Scene & {
    environmentIntensity?: number;
  };

  useFrame(() => {
    sceneWithEnvironmentIntensity.environmentIntensity =
      introEnvironmentProgress.current;
  });

  useLayoutEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(studioProject.fog);

    const disposableObjects: THREE.Object3D[] = [];
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(18, 48, 24),
      new THREE.MeshBasicMaterial({
        color: "#02060a",
        side: THREE.BackSide,
      }),
    );
    studio.add(shell);
    disposableObjects.push(shell);

    const addCard = (
      size: [number, number],
      position: [number, number, number],
      rotation: [number, number, number],
      color: [number, number, number],
    ) => {
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0], size[1]),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setRGB(color[0], color[1], color[2]),
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      card.position.set(...position);
      card.rotation.set(...rotation);
      studio.add(card);
      disposableObjects.push(card);
    };

    addCard(
      [5.4, 2.4],
      [-6.3, 2.5, 1.4],
      [0, Math.PI * 0.45, 0],
      studioProject.environmentCardA,
    );
    addCard(
      [4.6, 2.1],
      [5.8, 1.9, -1.8],
      [0, -Math.PI * 0.47, 0],
      [0.62, 0.7, 0.76],
    );
    addCard(
      [6.4, 1.5],
      [0.8, 5.8, -2.6],
      [Math.PI * 0.5, 0, 0],
      [0.48, 0.56, 0.62],
    );
    addCard(
      [3.4, 4.8],
      [-1.8, 2.6, -6.4],
      [0, 0, 0],
      studioProject.environmentCardB,
    );

    const environmentRenderTarget = pmremGenerator.fromScene(studio, 0.055);
    const environmentTexture = environmentRenderTarget.texture;
    const previousEnvironment = scene.environment;
    const previousEnvironmentIntensity =
      sceneWithEnvironmentIntensity.environmentIntensity;

    scene.environment = environmentTexture;
    sceneWithEnvironmentIntensity.environmentIntensity =
      introEnvironmentProgress.current;

    return () => {
      scene.environment = previousEnvironment;
      sceneWithEnvironmentIntensity.environmentIntensity =
        previousEnvironmentIntensity;
      disposableObjects.forEach((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      studio.clear();
      environmentRenderTarget.dispose();
      pmremGenerator.dispose();
    };
  }, [
    gl,
    introEnvironmentProgress,
    scene,
    sceneWithEnvironmentIntensity,
    studioProject,
  ]);

  return null;
}

function TransitioningAmbientLights({
  project,
  introEnvironmentProgress,
}: {
  project: WorkProject;
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemisphereRef = useRef<THREE.HemisphereLight>(null);
  const initializedRef = useRef(false);
  const initialAmbientRef = useRef(new THREE.Color(project.ambient));
  const initialHemisphereRef = useRef(new THREE.Color(project.hemisphere));
  const initialGroundRef = useRef(new THREE.Color(project.hemisphereGround));
  const targetAmbient = useMemo(
    () => new THREE.Color(project.ambient),
    [project.ambient],
  );
  const targetHemisphere = useMemo(
    () => new THREE.Color(project.hemisphere),
    [project.hemisphere],
  );
  const targetGround = useMemo(
    () => new THREE.Color(project.hemisphereGround),
    [project.hemisphereGround],
  );

  useLayoutEffect(() => {
    if (initializedRef.current) return;
    ambientRef.current?.color.copy(initialAmbientRef.current);
    hemisphereRef.current?.color.copy(initialHemisphereRef.current);
    hemisphereRef.current?.groundColor.copy(initialGroundRef.current);
    initializedRef.current = true;
  }, []);

  useFrame((_, delta) => {
    const introProgress = introEnvironmentProgress.current;
    const colorMix = 1 - Math.exp(
      -Math.min(delta, 0.05) * PROJECT_LIGHT_COLOR_LERP_SPEED,
    );
    ambientRef.current?.color.lerp(targetAmbient, colorMix);
    hemisphereRef.current?.color.lerp(targetHemisphere, colorMix);
    hemisphereRef.current?.groundColor.lerp(targetGround, colorMix);
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.028 * introProgress;
    }
    if (hemisphereRef.current) {
      hemisphereRef.current.intensity = 0.075 * introProgress;
    }
  });

  return (
    <>
      <ambientLight
        ref={ambientRef}
        intensity={0}
      />
      <hemisphereLight
        ref={hemisphereRef}
        intensity={0}
      />
    </>
  );
}

function TransitioningBackground({
  project,
  introEnvironmentProgress,
}: {
  project: WorkProject;
  introEnvironmentProgress: WorkIntroProgressRef;
}) {
  const { scene } = useThree();
  const currentColorRef = useRef(new THREE.Color(project.background));
  const displayColorRef = useRef(new THREE.Color(0, 0, 0));
  const targetColor = useMemo(
    () => new THREE.Color(project.background),
    [project.background],
  );

  useLayoutEffect(() => {
    const previousBackground = scene.background;
    scene.background = displayColorRef.current;

    return () => {
      scene.background = previousBackground;
    };
  }, [scene]);

  useFrame((_, delta) => {
    const colorMix = 1 - Math.exp(
      -Math.min(delta, 0.05) * PROJECT_LIGHT_COLOR_LERP_SPEED,
    );
    currentColorRef.current.lerp(targetColor, colorMix);
    displayColorRef.current
      .copy(currentColorRef.current)
      .multiplyScalar(introEnvironmentProgress.current);
  });

  return null;
}

function PosterTextureGpuPreloader({
  enabled,
}: {
  enabled: boolean;
}) {
  const { gl } = useThree();

  useEffect(() => {
    if (!enabled) return;

    const browserWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    let textureQueue: THREE.Texture[] = [];
    let textureIndex = 0;
    const textureRenderer = gl as THREE.WebGLRenderer & {
      initTexture?: (texture: THREE.Texture) => void;
    };
    const maximumAnisotropy = Math.min(
      gl.capabilities.getMaxAnisotropy(),
      WORK_MAX_TEXTURE_ANISOTROPY,
    );

    const warmNextTexture = () => {
      idleHandle = undefined;
      timeoutHandle = undefined;
      if (cancelled || textureIndex >= textureQueue.length) return;

      const texture = textureQueue[textureIndex];
      const needsTextureUpdate =
        texture.anisotropy !== maximumAnisotropy ||
        !texture.generateMipmaps ||
        texture.minFilter !== THREE.LinearMipmapLinearFilter ||
        texture.magFilter !== THREE.LinearFilter;

      texture.anisotropy = maximumAnisotropy;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (needsTextureUpdate) texture.needsUpdate = true;
      textureRenderer.initTexture?.(texture);
      textureIndex += 1;

      if (textureIndex < textureQueue.length) {
        timeoutHandle = window.setTimeout(scheduleNextTexture, 90);
      }
    };

    const scheduleNextTexture = () => {
      timeoutHandle = undefined;
      if (cancelled || textureIndex >= textureQueue.length) return;

      if (browserWindow.requestIdleCallback) {
        idleHandle = browserWindow.requestIdleCallback(warmNextTexture, {
          timeout: 1200,
        });
      } else {
        timeoutHandle = window.setTimeout(warmNextTexture, 160);
      }
    };

    const posterUrls = SELECTABLE_WORK_PROJECTS.flatMap((project) =>
      project.posterUrl ? [project.posterUrl] : [],
    );

    const preloadPosterTextures = async () => {
      for (const posterUrl of posterUrls) {
        if (cancelled) return;

        try {
          const texture = await loadGlassPosterTexture(posterUrl);
          if (cancelled) return;

          textureQueue.push(texture);
          if (
            textureIndex < textureQueue.length &&
            idleHandle === undefined &&
            timeoutHandle === undefined
          ) {
            scheduleNextTexture();
          }
        } catch (error) {
          if (!cancelled) {
            console.warn(
              `[WorkPage] Failed to prewarm poster texture: ${posterUrl}`,
              error,
            );
          }
        }
      }
    };

    void preloadPosterTextures();

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) {
        browserWindow.cancelIdleCallback?.(idleHandle);
      }
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [enabled, gl]);

  return null;
}

function WorkSceneContent({
  settings,
  project,
  introScreenProgress,
  introEnvironmentProgress,
  introGlassProgress,
  allowGpuPreload,
  onSceneReady,
}: {
  settings: CameraSettings;
  project: WorkProject;
  introScreenProgress: WorkIntroProgressRef;
  introEnvironmentProgress: WorkIntroProgressRef;
  introGlassProgress: WorkIntroProgressRef;
  allowGpuPreload: boolean;
  onSceneReady: () => void;
}) {
  return (
    <>
      <TransitioningBackground
        project={project}
        introEnvironmentProgress={introEnvironmentProgress}
      />
      <PosterTextureGpuPreloader enabled={allowGpuPreload} />
      {WORK_FOG_ENABLED ? (
        <fog attach="fog" args={[project.fog, 4.8, 18.5]} />
      ) : null}
      <TransitioningAmbientLights
        project={project}
        introEnvironmentProgress={introEnvironmentProgress}
      />
      <LocalStudioEnvironment
        introEnvironmentProgress={introEnvironmentProgress}
      />
      <WorkEnvironment
        settings={settings}
        project={project}
        introScreenProgress={introScreenProgress}
        introEnvironmentProgress={introEnvironmentProgress}
        introGlassProgress={introGlassProgress}
        allowGpuPreload={allowGpuPreload}
        onSceneReady={onSceneReady}
      />
    </>
  );
}

function WorkCanvas({
  settings,
  project,
  introScreenProgress,
  introEnvironmentProgress,
  introGlassProgress,
  allowGpuPreload,
  onSceneReady,
}: {
  settings: CameraSettings;
  project: WorkProject;
  introScreenProgress: WorkIntroProgressRef;
  introEnvironmentProgress: WorkIntroProgressRef;
  introGlassProgress: WorkIntroProgressRef;
  allowGpuPreload: boolean;
  onSceneReady: () => void;
}) {
  return (
    <Canvas
      className="work-canvas"
      shadows
      dpr={[1, WORK_MAX_DEVICE_PIXEL_RATIO]}
      camera={{ position: [0, 2.2, 6], fov: 45, near: 0.02, far: 300 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        precision: "highp",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.70;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <WorkSceneContent
          settings={settings}
          project={project}
          introScreenProgress={introScreenProgress}
          introEnvironmentProgress={introEnvironmentProgress}
          introGlassProgress={introGlassProgress}
          allowGpuPreload={allowGpuPreload}
          onSceneReady={onSceneReady}
        />
      </Suspense>

      <EffectComposer
        multisampling={WORK_COMPOSER_MULTISAMPLING}
        enableNormalPass={false}
      >
        <Bloom
          intensity={0.34}
          luminanceThreshold={0.92}
          luminanceSmoothing={0.22}
        />
        <Vignette eskil={false} offset={0.17} darkness={0.54} />
      </EffectComposer>
    </Canvas>
  );
}

type CameraControlDefinition = {
  key: keyof CameraSettings;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
};

const CAMERA_CONTROLS: CameraControlDefinition[] = [
  {
    key: "moveX",
    label: "MOVE X",
    hint: "− LEFT / + RIGHT",
    min: -20,
    max: 20,
    step: 0.1,
  },
  {
    key: "moveY",
    label: "MOVE Y",
    hint: "− DOWN / + UP",
    min: -20,
    max: 20,
    step: 0.1,
  },
  {
    key: "moveZ",
    label: "DOLLY Z",
    hint: "− BACK / + FORWARD",
    min: -40,
    max: 40,
    step: 0.1,
  },
  {
    key: "rotateX",
    label: "ROTATE X",
    hint: "− DOWN / + UP",
    min: -89,
    max: 89,
    step: 0.5,
  },
  {
    key: "rotateY",
    label: "ROTATE Y",
    hint: "− LEFT / + RIGHT",
    min: -180,
    max: 180,
    step: 0.5,
  },
  {
    key: "lensMm",
    label: "LENS",
    hint: "HIGHER = FLATTER / NARROWER",
    min: 18,
    max: 120,
    step: 1,
  },
];

function readStoredCameraSettings(): CameraSettings {
  if (typeof window === "undefined") return DEFAULT_CAMERA_SETTINGS;

  try {
    const stored = window.localStorage.getItem(CAMERA_STORAGE_KEY);

    if (!stored) return DEFAULT_CAMERA_SETTINGS;

    return {
      ...DEFAULT_CAMERA_SETTINGS,
      ...(JSON.parse(stored) as Partial<CameraSettings>),
    };
  } catch {
    return DEFAULT_CAMERA_SETTINGS;
  }
}

function CameraTuner({
  settings,
  onChange,
  onReset,
}: {
  settings: CameraSettings;
  onChange: (key: keyof CameraSettings, value: number) => void;
  onReset: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyValues = async () => {
    const output = JSON.stringify(settings, null, 2);

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      console.info("[WorkPage] Camera settings", output);
    }
  };

  if (collapsed) {
    return (
      <button
        className="work-camera-tuner__open"
        type="button"
        onClick={() => setCollapsed(false)}
      >
        CAMERA
      </button>
    );
  }

  return (
    <aside className="work-camera-tuner" aria-label="Camera tuner">
      <header className="work-camera-tuner__header">
        <div>
          <strong>CAMERA TUNER</strong>
          <span>LINEAR LOCAL CAMERA CONTROLS</span>
        </div>
        <button type="button" onClick={() => setCollapsed(true)}>
          —
        </button>
      </header>

      <div className="work-camera-tuner__controls">
        {CAMERA_CONTROLS.map((control) => (
          <label className="work-camera-control" key={control.key}>
            <span className="work-camera-control__label">
              <strong>{control.label}</strong>
              <small>{control.hint}</small>
            </span>

            <span className="work-camera-control__input">
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={settings[control.key]}
                onChange={(event) =>
                  onChange(control.key, Number(event.currentTarget.value))
                }
              />
              <input
                type="number"
                min={control.min}
                max={control.max}
                step={control.step}
                value={settings[control.key]}
                onChange={(event) =>
                  onChange(control.key, Number(event.currentTarget.value))
                }
              />
            </span>
          </label>
        ))}
      </div>

      <footer className="work-camera-tuner__footer">
        <button type="button" onClick={onReset}>
          RESET
        </button>
        <button type="button" onClick={copyValues}>
          {copied ? "COPIED" : "COPY VALUES"}
        </button>
      </footer>
    </aside>
  );
}

function WorkProjectTextMaterial() {
  return (
    <span
      className="work-project-card__copy-glass"
      aria-hidden="true"
    />
  );
}

function WorkAudioToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef(0);
  const userPausedRef = useRef(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const audio = getWorkAmbientAudio();
    if (!audio) return;

    audio.loop = true;
    audio.autoplay = true;
    audio.preload = "auto";
    audio.defaultMuted = false;
    audio.muted = false;
    audio.volume = WORK_AUDIO_VOLUME;
    if (audio.paused) audio.currentTime = 0;
    userPausedRef.current = false;
    audioRef.current = audio;

    return () => {
      window.cancelAnimationFrame(fadeFrameRef.current);
      stopWorkAmbientAudio();
      audioRef.current = null;
    };
  }, []);

  const fadeAudio = useCallback((targetVolume: number, pauseAtEnd: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    window.cancelAnimationFrame(fadeFrameRef.current);
    const startVolume = audio.volume;
    const startTime = performance.now();
    const duration = 680;

    const updateVolume = (now: number) => {
      const linearProgress = THREE.MathUtils.clamp(
        (now - startTime) / duration,
        0,
        1,
      );
      const easedProgress = linearProgress * linearProgress * (
        3 - 2 * linearProgress
      );
      audio.volume = THREE.MathUtils.lerp(
        startVolume,
        targetVolume,
        easedProgress,
      );

      if (linearProgress < 1) {
        fadeFrameRef.current = window.requestAnimationFrame(updateVolume);
      } else if (pauseAtEnd) {
        audio.pause();
      }
    };

    fadeFrameRef.current = window.requestAnimationFrame(updateVolume);
  }, []);

  const startAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || userPausedRef.current) return false;
    audio.muted = false;
    audio.volume = WORK_AUDIO_VOLUME;
    if (!audio.paused) {
      setEnabled(true);
      return true;
    }

    try {
      await audio.play();
      if (userPausedRef.current) {
        audio.pause();
        return false;
      }
      setEnabled(true);
      return true;
    } catch {
      setEnabled(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    function addAutoplayFallback() {
      window.addEventListener("pointerdown", resumeAfterBrowserBlock, {
        capture: true,
      });
      window.addEventListener("keydown", resumeAfterBrowserBlock, {
        capture: true,
      });
    }
    function removeAutoplayFallback() {
      window.removeEventListener("pointerdown", resumeAfterBrowserBlock, true);
      window.removeEventListener("keydown", resumeAfterBrowserBlock, true);
    }
    function resumeAfterBrowserBlock() {
      void startAudio().then((started) => {
        if (started) removeAutoplayFallback();
      });
    }
    function beginWorkAudio() {
      if (!audioRef.current || userPausedRef.current) return;

      audioRef.current.volume = WORK_AUDIO_VOLUME;
      if (!audioRef.current.paused) {
        setEnabled(true);
        removeAutoplayFallback();
        return;
      }

      audioRef.current.currentTime = 0;
      setEnabled(false);
      addAutoplayFallback();
      resumeAfterBrowserBlock();
    }
    function restartAfterBackForwardCache(event: PageTransitionEvent) {
      if (!event.persisted || !audioRef.current) return;

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      beginWorkAudio();
    }
    function retryWhenPageCanPlay() {
      if (
        document.visibilityState === "visible" &&
        audioRef.current?.paused &&
        !userPausedRef.current
      ) {
        resumeAfterBrowserBlock();
      }
    }
    function stopBeforeLeavingWork(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const destination = new URL(anchor.href, window.location.href);
      if (isWorkPagePath(destination.pathname)) return;

      userPausedRef.current = true;
      removeAutoplayFallback();
      stopWorkAmbientAudio();
      setEnabled(false);
    }
    function stopOnDocumentExit() {
      userPausedRef.current = true;
      removeAutoplayFallback();
      stopWorkAmbientAudio();
    }
    function stopIfRouteChanged() {
      if (!isWorkPagePath(window.location.pathname)) stopOnDocumentExit();
    }

    addAutoplayFallback();
    beginWorkAudio();
    window.addEventListener("pageshow", restartAfterBackForwardCache);
    window.addEventListener("load", retryWhenPageCanPlay);
    window.addEventListener("focus", retryWhenPageCanPlay);
    window.addEventListener("pagehide", stopOnDocumentExit);
    window.addEventListener("popstate", stopIfRouteChanged);
    document.addEventListener("visibilitychange", retryWhenPageCanPlay);
    document.addEventListener("click", stopBeforeLeavingWork, true);
    audio?.addEventListener("loadeddata", retryWhenPageCanPlay);
    audio?.addEventListener("canplay", retryWhenPageCanPlay);

    return () => {
      removeAutoplayFallback();
      window.removeEventListener("pageshow", restartAfterBackForwardCache);
      window.removeEventListener("load", retryWhenPageCanPlay);
      window.removeEventListener("focus", retryWhenPageCanPlay);
      window.removeEventListener("pagehide", stopOnDocumentExit);
      window.removeEventListener("popstate", stopIfRouteChanged);
      document.removeEventListener(
        "visibilitychange",
        retryWhenPageCanPlay,
      );
      document.removeEventListener("click", stopBeforeLeavingWork, true);
      audio?.removeEventListener("loadeddata", retryWhenPageCanPlay);
      audio?.removeEventListener("canplay", retryWhenPageCanPlay);
    };
  }, [startAudio]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      userPausedRef.current = true;
      setEnabled(false);
      fadeAudio(0, true);
      return;
    }

    userPausedRef.current = false;
    void startAudio();
  };

  return (
    <button
      className={`work-audio-toggle${enabled ? " work-audio-toggle--enabled" : ""}`}
      type="button"
      aria-label={enabled ? "Fade out ambient sound" : "Play ambient sound"}
      aria-pressed={enabled}
      onClick={toggleAudio}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 17.2V6.6l9-1.8v10.6" />
        <circle cx="6.4" cy="17.7" r="2.6" />
        <circle cx="15.4" cy="15.9" r="2.6" />
      </svg>
    </button>
  );
}

function ProjectSelector({
  selectedProjectId,
  onSelect,
}: {
  selectedProjectId: WorkProjectId;
  onSelect: (projectId: WorkProjectId) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const loopResetTimerRef = useRef(0);
  const leavingTimerRef = useRef(0);
  const [leavingProjectId, setLeavingProjectId] = useState<WorkProjectId | null>(
    null,
  );

  const getLoopGeometry = useCallback(() => {
    const track = trackRef.current;
    if (!track) return null;

    const primaryCards = Array.from(
      track.querySelectorAll<HTMLElement>('[data-loop-copy="0"]'),
    );
    const repeatedFirstCard = track.querySelector<HTMLElement>(
      '[data-loop-copy="1"]',
    );
    const firstCard = primaryCards[0];
    if (!firstCard || !repeatedFirstCard) return null;

    const trackStyles = window.getComputedStyle(track);
    const gap = Number.parseFloat(trackStyles.columnGap) || 10;
    const cardStep = primaryCards[1]
      ? primaryCards[1].offsetLeft - firstCard.offsetLeft
      : firstCard.offsetWidth + gap;
    const loopWidth = repeatedFirstCard.offsetLeft - firstCard.offsetLeft;

    return { track, cardStep, loopWidth };
  }, []);

  const normalizeLoopPosition = useCallback(() => {
    const geometry = getLoopGeometry();
    if (!geometry || geometry.loopWidth <= 0) return;

    const { track, loopWidth } = geometry;
    if (track.scrollLeft < loopWidth - 1) return;

    const previousInlineScrollBehavior = track.style.scrollBehavior;
    track.style.scrollBehavior = "auto";
    track.scrollLeft %= loopWidth;
    track.style.scrollBehavior = previousInlineScrollBehavior;
  }, [getLoopGeometry]);

  useEffect(() => {
    return () => {
      window.clearTimeout(loopResetTimerRef.current);
      window.clearTimeout(leavingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let resizeFrame = 0;
    const alignCardsAfterResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        normalizeLoopPosition();
        const geometry = getLoopGeometry();
        if (!geometry || geometry.cardStep <= 0) return;

        const alignedLeft = Math.round(
          geometry.track.scrollLeft / geometry.cardStep,
        ) * geometry.cardStep;
        const previousInlineScrollBehavior = geometry.track.style.scrollBehavior;
        geometry.track.style.scrollBehavior = "auto";
        geometry.track.scrollLeft = alignedLeft;
        geometry.track.style.scrollBehavior = previousInlineScrollBehavior;
      });
    };

    const resizeObserver = new ResizeObserver(alignCardsAfterResize);
    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(resizeFrame);
    };
  }, [getLoopGeometry, normalizeLoopPosition]);

  const moveTrack = (direction: -1 | 1) => {
    window.clearTimeout(loopResetTimerRef.current);
    normalizeLoopPosition();
    const geometry = getLoopGeometry();
    if (!geometry) return;

    geometry.track.scrollBy({
      left: direction * geometry.cardStep,
      behavior: "smooth",
    });
    loopResetTimerRef.current = window.setTimeout(
      normalizeLoopPosition,
      560,
    );
  };

  const selectVisibleCard = (projectId: WorkProjectId) => {
    window.clearTimeout(loopResetTimerRef.current);

    if (selectedProjectId !== 0 && selectedProjectId !== projectId) {
      window.clearTimeout(leavingTimerRef.current);
      setLeavingProjectId(selectedProjectId);
      leavingTimerRef.current = window.setTimeout(() => {
        setLeavingProjectId(null);
      }, 720);
    }

    onSelect(projectId);
  };

  return (
    <nav className="work-project-selector" aria-label="Work projects">
      <button
        className="work-project-selector__arrow"
        type="button"
        aria-label="Move project cards left"
        onClick={() => moveTrack(-1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>

      <div className="work-project-selector__viewport">
        <div className="work-project-selector__track" ref={trackRef}>
          {Array.from({ length: 2 }, (_, copyIndex) =>
            SELECTABLE_WORK_PROJECTS.map((project) => {
              const active = selectedProjectId === project.id;
              const leaving = leavingProjectId === project.id && !active;
              const label = [
                project.number,
                project.name,
                project.selectorDescription,
              ].filter(Boolean).join(" ");
              const primaryCopy = copyIndex === 0;

              return (
                <article
                  className={`work-project-card${active ? " work-project-card--active" : ""}${leaving ? " work-project-card--leaving" : ""}`}
                  data-project-id={project.id}
                  data-loop-copy={copyIndex}
                  key={`${copyIndex}-${project.id}`}
                  style={{
                    "--work-card-accent": project.accent,
                    "--work-card-accent-secondary": project.accentSecondary,
                    "--work-card-media": project.mediaUrl
                      ? `url("${encodeURI(project.mediaUrl)}")`
                      : "none",
                  } as CSSProperties}
                  aria-hidden={primaryCopy ? undefined : true}
                >
                  <button
                    className="work-project-card__select"
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    tabIndex={primaryCopy ? 0 : -1}
                    onClick={() => selectVisibleCard(project.id)}
                  />
                  <span className="work-project-card__glass" aria-hidden="true" />
                  <span className="work-project-card__number">
                    {project.number}
                  </span>
                  <span className="work-project-card__media" aria-hidden="true" />
                  <span className="work-project-card__copy">
                    <WorkProjectTextMaterial />
                    <strong>{project.name}</strong>
                    <small className="work-project-card__description work-project-card__description--full">
                      {project.selectorDescription}
                    </small>
                    <small className="work-project-card__description work-project-card__description--compact">
                      {project.selectorCompactDescription ?? project.selectorDescription}
                    </small>
                    {project.href ? (
                      <a
                        className="work-project-card__action"
                        href={project.href}
                        tabIndex={active && primaryCopy ? 0 : -1}
                        aria-label={`Explore ${project.name} project`}
                      >
                        EXPLORE
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3 8h9M9 4l4 4-4 4" />
                        </svg>
                      </a>
                    ) : (
                      <span
                        className="work-project-card__action work-project-card__action--disabled"
                        aria-disabled="true"
                      >
                        EXPLORE
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3 8h9M9 4l4 4-4 4" />
                        </svg>
                      </span>
                    )}
                  </span>
                </article>
              );
            }),
          )}
        </div>
      </div>

      <button
        className="work-project-selector__arrow"
        type="button"
        aria-label="Move project cards right"
        onClick={() => moveTrack(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

export default function WorkPage() {
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(
    readStoredCameraSettings,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<WorkProjectId>(0);
  const [projectCameraActive, setProjectCameraActive] = useState(false);
  const [introScreenReady, setIntroScreenReady] = useState(false);
  const [introUiVisible, setIntroUiVisible] = useState(false);
  const [gpuPreloadEnabled, setGpuPreloadEnabled] = useState(false);
  const introScreenProgress = useRef(1);
  const introEnvironmentProgress = useRef(0);
  const introGlassProgress = useRef(0);
  const introStartedRef = useRef(false);
  const introUiShownRef = useRef(false);
  const introFrameRef = useRef(0);
  const gpuPreloadTimerRef = useRef(0);
  const selectedProject = WORK_PROJECTS.find(
    (project) => project.id === selectedProjectId,
  ) ?? WORK_PROJECTS[0];
  const activeCameraSettings = projectCameraActive && selectedProjectId !== 0
    ? PROJECT_CAMERA_SETTINGS
    : cameraSettings;
  const projectStyle = {
    "--work-accent": selectedProject.accent,
    "--work-accent-secondary": selectedProject.accentSecondary,
  } as CSSProperties;

  useLayoutEffect(() => {
    const documentRoot = document.documentElement;
    documentRoot.classList.add("work-page-intro-active");
    documentRoot.classList.remove("work-page-intro-ui-visible");

    return () => {
      window.cancelAnimationFrame(introFrameRef.current);
      window.clearTimeout(gpuPreloadTimerRef.current);
      documentRoot.classList.remove(
        "work-page-intro-active",
        "work-page-intro-ui-visible",
      );
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "work-page-intro-ui-visible",
      introUiVisible,
    );
  }, [introUiVisible]);

  const startIntro = useCallback(() => {
    if (introStartedRef.current) return;
    introStartedRef.current = true;
    introScreenProgress.current = 1;
    setIntroScreenReady(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      introEnvironmentProgress.current = 1;
      introGlassProgress.current = 1;
      introUiShownRef.current = true;
      setIntroUiVisible(true);
      setGpuPreloadEnabled(true);
      return;
    }

    const timelineStart = performance.now();
    const environmentStart = WORK_INTRO_SCREEN_ONLY_MS;
    const uiStart = environmentStart + WORK_INTRO_ENVIRONMENT_FADE_MS;
    const glassStart = uiStart + WORK_INTRO_GLASS_DELAY_MS;
    const glassEnd = glassStart + WORK_INTRO_GLASS_FADE_MS;

    const smoothProgress = (
      elapsed: number,
      start: number,
      duration: number,
    ) => {
      const linearProgress = THREE.MathUtils.clamp(
        (elapsed - start) / duration,
        0,
        1,
      );
      return linearProgress * linearProgress * (3 - 2 * linearProgress);
    };

    const updateIntro = (now: number) => {
      const elapsed = now - timelineStart;
      introEnvironmentProgress.current = smoothProgress(
        elapsed,
        environmentStart,
        WORK_INTRO_ENVIRONMENT_FADE_MS,
      );
      introGlassProgress.current = smoothProgress(
        elapsed,
        glassStart,
        WORK_INTRO_GLASS_FADE_MS,
      );

      if (elapsed >= uiStart && !introUiShownRef.current) {
        introUiShownRef.current = true;
        setIntroUiVisible(true);
        gpuPreloadTimerRef.current = window.setTimeout(() => {
          setGpuPreloadEnabled(true);
        }, WORK_GPU_PRELOAD_DELAY_MS);
      }

      if (elapsed < glassEnd) {
        introFrameRef.current = window.requestAnimationFrame(updateIntro);
        return;
      }

      introEnvironmentProgress.current = 1;
      introGlassProgress.current = 1;
    };

    introFrameRef.current = window.requestAnimationFrame(updateIntro);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      CAMERA_STORAGE_KEY,
      JSON.stringify(cameraSettings),
    );
  }, [cameraSettings]);

  const changeCameraSetting = (
    key: keyof CameraSettings,
    value: number,
  ) => {
    if (!Number.isFinite(value)) return;

    setCameraSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetCamera = () => {
    setCameraSettings(DEFAULT_CAMERA_SETTINGS);
  };

  const selectProject = (projectId: WorkProjectId) => {
    setSelectedProjectId(projectId);
    setProjectCameraActive(projectId !== 0);
  };

  return (
    <main
      className={`work-page${introScreenReady ? " work-page--screen-ready" : ""}${introUiVisible ? " work-page--ui-visible" : ""}`}
      style={projectStyle}
    >
      <div
        className="work-scene-interaction"
        onClick={() => setProjectCameraActive(false)}
      >
        <SceneErrorBoundary>
          <WorkCanvas
            settings={activeCameraSettings}
            project={selectedProject}
            introScreenProgress={introScreenProgress}
            introEnvironmentProgress={introEnvironmentProgress}
            introGlassProgress={introGlassProgress}
            allowGpuPreload={gpuPreloadEnabled}
            onSceneReady={startIntro}
          />
        </SceneErrorBoundary>
      </div>
      <WorkSceneLoader />
      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onSelect={selectProject}
      />
      <WorkAudioToggle />
      {WORK_CAMERA_TUNER_VISIBLE ? (
        <CameraTuner
          settings={cameraSettings}
          onChange={changeCameraSetting}
          onReset={resetCamera}
        />
      ) : null}
    </main>
  );
}

useGLTF.preload(WORK_SCENE_URL);
