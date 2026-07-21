// src/labExperiments/Learning_Solar.tsx
import { useEffect, useRef, useState } from "react";

import texSun from "./assets/textures/solar_texture/2k_sun.jpg";
import texMercury from "./assets/textures/solar_texture/2k_mercury.jpg";
import texVenus from "./assets/textures/solar_texture/2k_venus_atmosphere.jpg";
import texEarth from "./assets/textures/solar_texture/earth_color.jpg";
import texMoon from "./assets/textures/solar_texture/2k_moon.jpg";
import texMars from "./assets/textures/solar_texture/2k_mars.jpg";
import texJupiter from "./assets/textures/solar_texture/2k_jupiter.jpg";
import texSaturn from "./assets/textures/solar_texture/2k_saturn.jpg";
import texSaturnRing from "./assets/textures/solar_texture/2k_saturn_ring_alpha.png";
import texUranus from "./assets/textures/solar_texture/2k_uranus.jpg";
import texNeptune from "./assets/textures/solar_texture/2k_neptune.jpg";

/* ---------- Core tweaks ---------- */
const TWEAKS = {
  dprMax: 1.75,

  texSun,
  texMercury,
  texVenus,
  texEarth,
  texMoon,
  texMars,
  texJupiter,
  texSaturn,
  texSaturnRing,
  texUranus,
  texNeptune,

  camRadiusNear: 4.0,
  camRadiusFar: 28.0,

  // start almost top-down
  camTheta: 0.0,
  camPhi: 0.2,
  camPhiMin: 0.1,
  camPhiMax: 2.7,

  rotSens: 1.2,
  panSens: 0.2,

  earthPhaseX: Math.PI,
  earthPhaseY: 0.0,

  sunSurface: {
    rotSpeed: 0.08,
    selfGlowColor: [1.0, 0.78, 0.3] as [number, number, number],
    selfGlowStrength: 2.55,
    selfGlowPow: 20.2,
  },

  glow: {
    sunColor: [1.0, 0.85, 0.35] as [number, number, number],
    sunGain: 0.22,
    sunMax: 0.35,
    sunPow: 1.35,
    earthColor: [0.18, 0.55, 1.0] as [number, number, number],
    earthStrength: 1.9,
    earthRimPow: 4.2,
  },

  ambient: 0.3,
  diffuseGain: 0.95,

  saturn: {
    orbitSpeed: 0.05,
    orbitPos: [2.05, 0.0, 2.05] as [number, number, number],
    radius: 0.244,
  },

  ring: {
    inner: 0.35,
    outer: 0.55,
    halfH: 0.0012,
    texRot: 0.3,
    flipU: 0,
    flipV: 1,
    quarterTurns: 1,
  },

  spin: {
    mercury: 0.02,
    venus: -0.004,
    earth: 0.5,
    moon: 0.5,
    mars: 0.45,
    jupiter: 1.0,
    saturn: 0.9,
    uranus: -0.7,
    neptune: 0.8,
  },

  orbits: {
    color: [0.28, 0.28, 0.28] as [number, number, number],
    strength: 1.0,
  },
};

/* ---------- planet meta + orbit colors ---------- */
type PlanetKey =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

const PLANET_KEYS: PlanetKey[] = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

const ORBIT_COLOR_HEX: Record<PlanetKey, string> = {
  mercury: "#ff661a",
  venus: "#ffeb55",
  earth: "#5ffc98",
  mars: "#ff5b5b",
  jupiter: "#f7b857",
  saturn: "#a9ffd5",
  uranus: "#02eaff",
  neptune: "#9d7afe",
};

const PLANET_LABELS: Record<PlanetKey, string> = {
  mercury: "Mercury",
  venus: "Venus",
  earth: "Earth",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
};

const PLANET_DATA: {
  key: PlanetKey;
  tilt: string;
  day: string;
  year: string;
  size: string;
  distance: string;
  moons: string;
  temp: string;
  extra: string;
}[] = [
  {
    key: "mercury",
    tilt: "0.034°",
    day: "1,407 hours",
    year: "88 days",
    size: "~38% of Earth's diameter",
    distance: "~58 million km from Sun",
    moons: "0 known moons",
    temp: "-180°C to 430°C",
    extra: "Almost no atmosphere to hold heat.",
  },
  {
    key: "venus",
    tilt: "177.3°",
    day: "5,832 hours",
    year: "224.7 days",
    size: "~95% of Earth's diameter",
    distance: "~108 million km from Sun",
    moons: "0 moons (has quasi-moon Zoozve)",
    temp: "~465°C; hottest planet",
    extra: "Thick CO₂ clouds; strong greenhouse effect.",
  },
  {
    key: "earth",
    tilt: "23.26°",
    day: "23.9 hours",
    year: "365.2 days",
    size: "12,756 km across",
    distance: "~150 million km from Sun",
    moons: "1 moon",
    temp: "-89°C to 58°C",
    extra: "Only known world with surface liquid water.",
  },
  {
    key: "mars",
    tilt: "25.2°",
    day: "24.6 hours",
    year: "687 days",
    size: "~53% of Earth's diameter",
    distance: "~228 million km from Sun",
    moons: "2 moons (Phobos, Deimos)",
    temp: "~-60°C average",
    extra: "Iron-rich dust gives its red color.",
  },
  {
    key: "jupiter",
    tilt: "3.1°",
    day: "9.9 hours",
    year: "4,331 days",
    size: "Largest planet; 11× Earth diameter",
    distance: "~778 million km from Sun",
    moons: ">90 known moons",
    temp: "~-110°C cloud tops",
    extra: "Has the Great Red Spot storm.",
  },
  {
    key: "saturn",
    tilt: "26.7°",
    day: "10.7 hours",
    year: "10,747 days",
    size: "9× Earth's diameter",
    distance: "~1.4 billion km from Sun",
    moons: ">80 known moons",
    temp: "~-140°C cloud tops",
    extra: "Famous for its bright icy rings.",
  },
  {
    key: "uranus",
    tilt: "97.8°",
    day: "17.2 hours",
    year: "30,589 days",
    size: "4× Earth's diameter",
    distance: "~2.9 billion km from Sun",
    moons: "27 known moons",
    temp: "~-195°C",
    extra: "Spins on its side (~98° tilt).",
  },
  {
    key: "neptune",
    tilt: "28.3°",
    day: "16.1 hours",
    year: "59,800 days",
    size: "4× Earth's diameter",
    distance: "~4.5 billion km from Sun",
    moons: "14 known moons",
    temp: "~-200°C",
    extra: "Farthest major planet; cold blue ice giant.",
  },
];

// radii in shader torus SDFs (Mercury..Neptune)
const ORBIT_RADII = [0.63, 0.92, 1.2, 1.55, 2.05, 2.9, 3.6, 3.95] as const;
// 1.0 => exactly on the orbit radius
const ORBIT_LABEL_RADIUS_SCALE = 1.0;
// per–orbit label angle (radians)
const ORBIT_LABEL_ANGLES = [
  0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85,
] as const;

type OrbitLabel = { x: number; y: number; visible: boolean };

/* ==================== VERTEX SHADER ==================== */
const VERT = `#version 300 es
layout(location=0) in vec2 pos;
void main(){
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

/* ==================== FRAGMENT SHADER ==================== */
const FRAG = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCamPos;
uniform vec3 uCamAt;

uniform sampler2D uSunTex, uMercuryTex, uVenusTex, uEarthTex, uMoonTex, uMarsTex, uJupiterTex, uSaturnTex, uSaturnRingTex, uUranusTex, uNeptuneTex;

uniform float uAmbient, uDiffuseGain;
uniform float uSaturnSpeed;
uniform vec3 uSaturnOrbitPos;
uniform float uSaturnRadius;
uniform float uRingInner, uRingOuter, uRingHalfH;
uniform float uRingTexRot;
uniform vec2 uRingFlipUV;
uniform float uRingQuarterTurns;

uniform vec3 uSunGlowColor;
uniform float uSunGlowGain, uSunGlowMax, uSunGlowPow;
uniform float uSunRotSpeed;
uniform vec3 uSunSelfGlowColor;
uniform float uSunSelfGlowStrength, uSunSelfGlowPow;
uniform vec3 uEarthGlowColor;
uniform float uEarthGlowStrength, uEarthRimPow;

uniform vec3 uOrbitColor;
uniform float uOrbitStrength;

uniform float uSpinMercury, uSpinVenus, uSpinEarth, uSpinMoon, uSpinMars, uSpinJupiter, uSpinSaturn, uSpinUranus, uSpinNeptune;
uniform float uEarthPhaseX;
uniform float uEarthPhaseY;

// per-planet visibility (1 = visible, 0 = hidden)
uniform float uShowMercury;
uniform float uShowVenus;
uniform float uShowEarth;
uniform float uShowMars;
uniform float uShowJupiter;
uniform float uShowSaturn;
uniform float uShowUranus;
uniform float uShowNeptune;

// active orbit index (1..8, or <=0 for none)
uniform float uActiveOrbit;

#define EPS 0.001
#define MAX_DIST 50.0
#define PI 3.141592

#define ID_SUN          0.0
#define ID_MERCURY      1.0
#define ID_VENUS        2.0
#define ID_EARTH        3.0
#define ID_MOON         4.0
#define ID_MARS         5.0
#define ID_JUPITER      6.0
#define ID_SATURN       7.0
#define ID_SATURN_RING  8.0
#define ID_URANUS       9.0
#define ID_NEPTUNE      10.0
#define ID_URANUS_RING  11.0
#define ID_NEPTUNE_RING 12.0

#define ID_ORBIT1 20.0
#define ID_ORBIT2 21.0
#define ID_ORBIT3 22.0
#define ID_ORBIT4 23.0
#define ID_ORBIT5 24.0
#define ID_ORBIT6 25.0
#define ID_ORBIT7 26.0
#define ID_ORBIT8 27.0

const float SUN_RADIUS = 0.42;

// axial tilts (in radians)
const float SATURN_TILT = radians(26.7);
const float URANUS_TILT = radians(97.8);
const float NEPTUNE_TILT = radians(28.3);

// Saturn ring brightness control (>1.0 = brighter)
const float SATURN_RING_GAIN = 1.6;

struct SdfHit { float id; float d; };

float sdSphere(vec3 p, float r){ return length(p) - r; }

float sdTorus(vec3 p, float bR){
  return length(vec2(length(p.xz) - bR, p.y)) - 0.0015;
}

float sdRing(vec3 p, float rInner, float rOuter, float h){
  float y = abs(p.y) - h;
  float r = length(p.xz);
  float dr = max(rInner - r, r - rOuter);
  return max(y, dr);
}

SdfHit minHit(SdfHit a, SdfHit b){
  SdfHit r = a;
  if (b.d < a.d) {
    r = b;
  }
  return r;
}

mat3 rotateX(float k){
  float c=cos(k), s=sin(k);
  return mat3(
    1.,0.,0.,
    0.,c,-s,
    0.,s,c
  );
}
mat3 rotateY(float k){
  float c=cos(k), s=sin(k);
  return mat3(
    c,0.,-s,
    0.,1.,0.,
    s,0.,c
  );
}
mat2 rot2(float a){
  float c=cos(a), s=sin(a);
  return mat2(c,-s,s,c);
}

mat3 calcLookAtMatrix(vec3 camPos, vec3 at){
  vec3 zAxis = normalize(at - camPos);
  vec3 xAxis = normalize(cross(zAxis, vec3(0., 1., 0.)));
  vec3 yAxis = normalize(cross(xAxis, zAxis));
  return mat3(xAxis, yAxis, zAxis);
}

vec3 orbitCenter(float speed, vec3 orbitVec){
  return rotateY(iTime * speed) * orbitVec;
}

/* ---------- planets SDF ---------- */

struct RM { float d; float id; };

SdfHit scenePlanetsSDF(vec3 p){
  SdfHit h;
  h.id = -999.;
  h.d = 1e9;

  // Sun (always visible)
  h = minHit(h, SdfHit(ID_SUN, sdSphere(p, SUN_RADIUS)));

  vec3 c;

  // Mercury
  c = orbitCenter(2.0, vec3(0.45,0.,0.45));
  float dMerc = sdSphere(p - c, 0.03);
  if (uShowMercury > 0.5) {
    h = minHit(h, SdfHit(ID_MERCURY, dMerc));
  }

  // Venus
  c = orbitCenter(1.0, vec3(0.65,0.,0.65));
  float dVen = sdSphere(p - c, 0.072);
  if (uShowVenus > 0.5) {
    h = minHit(h, SdfHit(ID_VENUS, dVen));
  }

  // Earth + Moon
  vec3 cE = orbitCenter(0.3, vec3(0.85,0.,0.85));
  float dE = sdSphere(p - cE, 0.078);
  if (uShowEarth > 0.5) {
    h = minHit(h, SdfHit(ID_EARTH, dE));

    vec2 mOff = rot2(iTime * 1.6) * vec2(0.12, 0.0);
    vec3 cM = cE + vec3(mOff.x, 0.0, mOff.y);
    float dM = sdSphere(p - cM, 0.020);
    h = minHit(h, SdfHit(ID_MOON, dM));
  }

  // Mars
  c = orbitCenter(0.2, vec3(1.10,0.,1.10));
  float dMars = sdSphere(p - c, 0.060);
  if (uShowMars > 0.5) {
    h = minHit(h, SdfHit(ID_MARS, dMars));
  }

  // Jupiter
  c = orbitCenter(0.1, vec3(1.45,0.,1.45));
  float dJ = sdSphere(p - c, 0.330);
  if (uShowJupiter > 0.5) {
    h = minHit(h, SdfHit(ID_JUPITER, dJ));
  }

  // Saturn + ring (tilted)
  vec3 cSat = orbitCenter(uSaturnSpeed, uSaturnOrbitPos);
  vec3 qSat = p - cSat;
  float dSat = sdSphere(qSat, uSaturnRadius);
  vec3 qSatRing = rotateX(SATURN_TILT) * qSat;
  float dRing = sdRing(qSatRing, uRingInner, uRingOuter, uRingHalfH);
  if (uShowSaturn > 0.5) {
    h = minHit(h, SdfHit(ID_SATURN, dSat));
    h = minHit(h, SdfHit(ID_SATURN_RING, dRing));
  }

  // Uranus + ring (tilted, blue)
  c = orbitCenter(0.01, vec3(2.55,0.,2.55));
  vec3 qU = p - c;
  float dU = sdSphere(qU, 0.150);
  if (uShowUranus > 0.5) {
    h = minHit(h, SdfHit(ID_URANUS, dU));
    vec3 qUR = rotateX(URANUS_TILT) * qU;
    float dURing = sdRing(qUR, 0.18, 0.32, 0.0012);
    h = minHit(h, SdfHit(ID_URANUS_RING, dURing));
  }

  // Neptune + ring (tilted، آبی)
  c = orbitCenter(0.005, vec3(2.80,0.,2.80));
  vec3 qN = p - c;
  float dN = sdSphere(qN, 0.100);
  if (uShowNeptune > 0.5) {
    h = minHit(h, SdfHit(ID_NEPTUNE, dN));
    vec3 qNR = rotateX(NEPTUNE_TILT) * qN;
    float dNRing = sdRing(qNR, 0.14, 0.26, 0.0012);
    h = minHit(h, SdfHit(ID_NEPTUNE_RING, dNRing));
  }

  return h;
}

/* ---------- orbits SDF ---------- */

SdfHit sceneOrbitsSDF(vec3 p){
  SdfHit h;
  h.id = -999.;
  h.d = 1e9;

  h = minHit(h, SdfHit(ID_ORBIT1, sdTorus(p, 0.63)));
  h = minHit(h, SdfHit(ID_ORBIT2, sdTorus(p, 0.92)));
  h = minHit(h, SdfHit(ID_ORBIT3, sdTorus(p, 1.20)));
  h = minHit(h, SdfHit(ID_ORBIT4, sdTorus(p, 1.55)));
  h = minHit(h, SdfHit(ID_ORBIT5, sdTorus(p, 2.05)));
  h = minHit(h, SdfHit(ID_ORBIT6, sdTorus(p, 2.90)));
  h = minHit(h, SdfHit(ID_ORBIT7, sdTorus(p, 3.60)));
  h = minHit(h, SdfHit(ID_ORBIT8, sdTorus(p, 3.95)));

  return h;
}

vec2 sphereUV(vec3 q){
  float len = length(q);
  if (len < 1e-6) return vec2(0.0);
  vec3 v = q / len;
  float u = atan(v.z, v.x) / (2.0 * PI) + 0.5;
  float vv = asin(clamp(v.y, -1.0, 1.0)) / PI + 0.5;
  return vec2(u, vv);
}

vec3 lambert(vec3 n, vec3 worldPos, vec3 albedo){
  vec3 L = normalize(-worldPos);
  float diff = max(dot(normalize(n), L), 0.0);
  return albedo * (uAmbient + uDiffuseGain * diff);
}

vec3 shadeSphereTex(vec3 p, vec3 center, sampler2D tex, float spinSpeed){
  vec3 q = p - center;
  vec3 qRot = rotateY(iTime * spinSpeed) * q;
  vec2 uv = sphereUV(qRot);
  vec3 texCol = texture(tex, uv).rgb;
  return lambert(q, center + q, texCol);
}

// tilted version for Saturn & Uranus
vec3 shadeSphereTexTilted(vec3 p, vec3 center, sampler2D tex, float spinSpeed, float tiltRad){
  vec3 q = p - center;
  vec3 qTilt = rotateX(tiltRad) * q;
  vec3 qRot = rotateY(iTime * spinSpeed) * qTilt;
  vec2 uv = sphereUV(qRot);
  vec3 texCol = texture(tex, uv).rgb;
  return lambert(q, center + q, texCol);
}

/* ---------- Saturn ring shader (procedural, tilted) ---------- */
vec3 shadeSaturnRing(vec3 p){
  vec3 cSat = orbitCenter(uSaturnSpeed, uSaturnOrbitPos);
  vec3 q = p - cSat;
  vec3 qTilt = rotateX(SATURN_TILT) * q;

  float r = length(qTilt.xz);
  float t = clamp((r - uRingInner) / max(uRingOuter - uRingInner, 1.0e-5), 0.0, 1.0);

  float stripe1 = 0.5 + 0.5 * sin(80.0 * t);
  float stripe2 = 0.5 + 0.5 * sin(25.0 * t + 1.5);
  float stripe3 = 0.5 + 0.5 * sin(10.0 * t + 3.2);
  float mixStripe = stripe1 * 0.4 + stripe2 * 0.4 + stripe3 * 0.2;

  vec3 innerCol = vec3(0.78, 0.72, 0.66);
  vec3 outerCol = vec3(0.40, 0.36, 0.32);
  vec3 col = mix(innerCol, outerCol, t);
  col *= 0.65 + 0.35 * mixStripe;

  float alphaInner = smoothstep(0.02, 0.08, t);
  float alphaOuter = 1.0 - smoothstep(0.92, 0.98, t);
  float alpha = alphaInner * alphaOuter;

  vec3 nLocal = vec3(0.0, 1.0, 0.0);
  vec3 nWorld = rotateX(-SATURN_TILT) * nLocal;

  vec3 lit = lambert(nWorld, cSat + q, col);
  // کنترل روشنایی حلقه‌های زحل با SATURN_RING_GAIN
  return lit * alpha * SATURN_RING_GAIN;
}

/* ---------- Uranus ring shader (procedural, blue, tilted, 2+gap+2+gap+2) ---------- */
vec3 shadeUranusRing(vec3 p){
  vec3 cU = orbitCenter(0.01, vec3(2.55,0.,2.55));
  vec3 q = p - cU;
  vec3 qTilt = rotateX(URANUS_TILT) * q;

  float innerR = 0.18;
  float outerR = 0.32;
  float r = length(qTilt.xz);
  float t = clamp((r - innerR) / max(outerR - innerR, 1.0e-5), 0.0, 1.0);

  // الگو: 2 حلقه نزدیک + گپ + 2 حلقه + گپ + 2 حلقه
  float bandWidth = 0.035;
  float m = 0.0;

  float d0 = abs(t - 0.15);
  float d1 = abs(t - 0.20);
  float d2 = abs(t - 0.45);
  float d3 = abs(t - 0.50);
  float d4 = abs(t - 0.80);
  float d5 = abs(t - 0.85);

  m = max(m, smoothstep(bandWidth, 0.0, d0));
  m = max(m, smoothstep(bandWidth, 0.0, d1));
  m = max(m, smoothstep(bandWidth, 0.0, d2));
  m = max(m, smoothstep(bandWidth, 0.0, d3));
  m = max(m, smoothstep(bandWidth, 0.0, d4));
  m = max(m, smoothstep(bandWidth, 0.0, d5));

  vec3 innerCol = vec3(0.78, 0.90, 0.96); // آبی روشن
  vec3 outerCol = vec3(0.36, 0.54, 0.62); // آبی مایل به سبز
  vec3 col = mix(innerCol, outerCol, t);
  col *= 0.35 + 0.65 * m;

  float fadeInner = smoothstep(0.02, 0.10, t);
  float fadeOuter = 1.0 - smoothstep(0.88, 0.98, t);
  float alpha = fadeInner * fadeOuter * m * 2.0;

  vec3 nLocal = vec3(0.0, 1.0, 0.0);
  vec3 nWorld = rotateX(-URANUS_TILT) * nLocal;

  vec3 lit = lambert(nWorld, cU + q, col);
  return lit * alpha;
}

/* ---------- Neptune ring shader (procedural, bright blue, 2+gap+2) ---------- */
vec3 shadeNeptuneRing(vec3 p){
  vec3 cN = orbitCenter(0.005, vec3(2.80,0.,2.80));
  vec3 q = p - cN;
  vec3 qTilt = rotateX(NEPTUNE_TILT) * q;

  float innerR = 0.14;
  float outerR = 0.26;
  float r = length(qTilt.xz);
  float t = clamp((r - innerR) / max(outerR - innerR, 1.0e-5), 0.0, 1.0);

  // الگو: 2 حلقه نزدیک هم + گپ + 2 حلقه نزدیک هم (آبی روشن)
  float bandWidth = 0.030;
  float m = 0.0;

  float d0 = abs(t - 0.25); // جفت داخلی
  float d1 = abs(t - 0.30);
  float d2 = abs(t - 0.70); // جفت بیرونی
  float d3 = abs(t - 0.75);

  m = max(m, smoothstep(bandWidth, 0.0, d0));
  m = max(m, smoothstep(bandWidth, 0.0, d1));
  m = max(m, smoothstep(bandWidth, 0.0, d2));
  m = max(m, smoothstep(bandWidth, 0.0, d3));

  vec3 innerCol = vec3(0.40, 0.72, 1.05); // آبی خیلی روشن
  vec3 outerCol = vec3(0.10, 0.32, 0.95); // آبی تیره‌تر
  vec3 col = mix(innerCol, outerCol, t);
  col *= 0.50 + 0.80 * m; // روشن‌تر روی خود حلقه‌ها

  float fadeInner = smoothstep(0.03, 0.08, t);
  float fadeOuter = 1.0 - smoothstep(0.85, 0.98, t);
  float alpha = fadeInner * fadeOuter * m * 2.4;

  vec3 nLocal = vec3(0.0, 1.0, 0.0);
  vec3 nWorld = rotateX(-NEPTUNE_TILT) * nLocal;

  vec3 lit = lambert(nWorld, cN + q, col);
  return lit * alpha;
}

/* ---------- stars ---------- */

float rand3(vec3 p){
  p = fract(p * vec3(.1031, .11369, .13787));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float starLayer(vec3 d, float density, float size){
  vec3 cell = floor(d * density);
  float rnd = rand3(cell);
  float mask = step(0.991, rnd);
  vec3 local = fract(d * density) - 0.5;
  float dist2 = dot(local, local);
  float falloff = exp(-dist2 * size);
  return mask * falloff;
}

vec3 bgColor(vec3 rd){
  rd = normalize(rd);
  float s1 = starLayer(rd, 40.0, 60.0);
  float s2 = starLayer(rd, 80.0, 90.0);
  float s3 = starLayer(rd, 140.0, 120.0);
  float s4 = starLayer(rd, 260.0, 180.0);
  vec3 base = vec3(0.01, 0.012, 0.02);
  vec3 col = base
    + s1 * vec3(1.0, 1.05, 1.1)
    + s2 * vec3(0.9, 1.0, 1.1)
    + s3 * vec3(1.2, 1.15, 1.0)
    + s4 * vec3(1.1, 1.15, 1.2);
  return col;
}

bool isOrbitId(float id) {
  return (id >= ID_ORBIT1 && id <= ID_ORBIT8);
}

vec3 orbitColorForId(float id) {
  if (id == ID_ORBIT1) return vec3(1.00, 0.40, 0.10); // Mercury #ff661a
  if (id == ID_ORBIT2) return vec3(1.00, 0.92, 0.33); // Venus #ffeb55
  if (id == ID_ORBIT3) return vec3(0.37, 0.99, 0.60); // Earth #5ffc98
  if (id == ID_ORBIT4) return vec3(1.00, 0.36, 0.36); // Mars #ff5b5b
  if (id == ID_ORBIT5) return vec3(0.97, 0.72, 0.34); // Jupiter #f7b857
  if (id == ID_ORBIT6) return vec3(0.66, 1.00, 0.83); // Saturn #a9ffd5
  if (id == ID_ORBIT7) return vec3(0.01, 0.92, 1.00); // Uranus #02eaff
  if (id == ID_ORBIT8) return vec3(0.62, 0.48, 0.99); // Neptune #9d7afe
  return vec3(0.9, 0.9, 0.9);
}

/* ---------- raymarches ---------- */

RM rayMarchPlanets(vec3 ro, vec3 rd){
  RM res;
  res.d = 0.;
  res.id = -1.;
  for(int i=0; i<140; i++){
    vec3 pos = ro + rd * res.d;
    SdfHit hit = scenePlanetsSDF(pos);
    if (hit.d < EPS || res.d > MAX_DIST) {
      res.id = hit.id;
      break;
    }
    res.d += hit.d;
  }
  return res;
}

RM rayMarchOrbits(vec3 ro, vec3 rd){
  RM res;
  res.d = 0.;
  res.id = -1.;
  for(int i=0; i<140; i++){
    vec3 pos = ro + rd * res.d;
    SdfHit hit = sceneOrbitsSDF(pos);
    if (hit.d < EPS || res.d > MAX_DIST) {
      res.id = hit.id;
      break;
    }
    res.d += hit.d;
  }
  return res;
}

void main(){
  vec2 xy = (gl_FragCoord.xy - iResolution * 0.5) / min(iResolution.x, iResolution.y);

  mat3 cam = calcLookAtMatrix(uCamPos, uCamAt);
  mat3 camInv = transpose(cam);

  vec3 sunDirWorld = normalize(-uCamPos);
  vec3 sunDirCam = normalize(camInv * sunDirWorld);
  vec2 xySun = (sunDirCam.z > 0.0) ? (sunDirCam.xy / sunDirCam.z) * 2.0 : vec2(1e5);
  float camDist = length(uCamPos);
  float alpha = asin(clamp(SUN_RADIUS / max(camDist, 1e-6), 0.0, 1.0));
  float sunScreenR = (sunDirCam.z > 0.0) ? 2.0 * tan(alpha) : 0.0;
  sunScreenR = max(sunScreenR, 1e-3);

  vec3 rd = cam * normalize(vec3(xy, 2.0));
  vec3 col = vec3(0.0);

  // planets & sun
  RM rmP = rayMarchPlanets(uCamPos, rd);
  bool drewPlanet = false;
  if (rmP.d < MAX_DIST) {
    vec3 p = uCamPos + rd * rmP.d;

    if (rmP.id == ID_SUN) {
      vec3 qRot = rotateY(iTime * uSunRotSpeed) * p;
      vec2 uv = sphereUV(qRot);
      uv.x = fract(uv.x + 0.25);
      vec3 base = texture(uSunTex, uv).rgb;
      vec3 n = normalize(p);
      vec3 viewDir = normalize(uCamPos - p);
      float rim = pow(clamp(1.0 - dot(n, viewDir), 0.0, 1.0), uSunSelfGlowPow) * uSunSelfGlowStrength;
      col = base + uSunSelfGlowColor * rim;
      drewPlanet = true;
    } else if (rmP.id == ID_MERCURY) {
      vec3 c = orbitCenter(2.0, vec3(0.45,0.,0.45));
      col = shadeSphereTex(p, c, uMercuryTex, uSpinMercury);
      drewPlanet = true;
    } else if (rmP.id == ID_VENUS) {
      vec3 c = orbitCenter(1.0, vec3(0.65,0.,0.65));
      col = shadeSphereTex(p, c, uVenusTex, uSpinVenus);
      drewPlanet = true;
    } else if (rmP.id == ID_EARTH) {
      vec3 c = orbitCenter(0.3, vec3(0.85,0.,0.85));
      vec3 q = p - c;
      vec3 qRot = rotateY(iTime * uSpinEarth + uEarthPhaseY) * (rotateX(uEarthPhaseX) * q);
      vec2 uv = sphereUV(qRot);
      vec3 baseTex = texture(uEarthTex, uv).rgb;
      vec3 base = lambert(q, c + q, baseTex);
      vec3 n = normalize(q);
      vec3 viewDir = normalize(uCamPos - p);
      float rim = pow(clamp(1.0 - dot(n, viewDir), 0.0, 1.0), uEarthRimPow) * uEarthGlowStrength;
      col = base + uEarthGlowColor * rim;
      drewPlanet = true;
    } else if (rmP.id == ID_MOON) {
      vec3 cE = orbitCenter(0.3, vec3(0.85,0.,0.85));
      vec2 mOff = rot2(iTime * 1.6) * vec2(0.12, 0.0);
      vec3 cM = cE + vec3(mOff.x, 0.0, mOff.y);
      col = shadeSphereTex(p, cM, uMoonTex, uSpinMoon);
      drewPlanet = true;
    } else if (rmP.id == ID_MARS) {
      vec3 c = orbitCenter(0.2, vec3(1.10,0.,1.10));
      col = shadeSphereTex(p, c, uMarsTex, uSpinMars);
      drewPlanet = true;
    } else if (rmP.id == ID_JUPITER) {
      vec3 c = orbitCenter(0.1, vec3(1.45,0.,1.45));
      col = shadeSphereTex(p, c, uJupiterTex, uSpinJupiter);
      drewPlanet = true;
    } else if (rmP.id == ID_SATURN) {
      vec3 c = orbitCenter(uSaturnSpeed, uSaturnOrbitPos);
      col = shadeSphereTexTilted(p, c, uSaturnTex, uSpinSaturn, SATURN_TILT);
      drewPlanet = true;
    } else if (rmP.id == ID_SATURN_RING) {
      col = shadeSaturnRing(p);
      drewPlanet = true;
    } else if (rmP.id == ID_URANUS) {
      vec3 c = orbitCenter(0.01, vec3(2.55,0.,2.55));
      col = shadeSphereTexTilted(p, c, uUranusTex, uSpinUranus, URANUS_TILT);
      drewPlanet = true;
    } else if (rmP.id == ID_URANUS_RING) {
      col = shadeUranusRing(p);
      drewPlanet = true;
    } else if (rmP.id == ID_NEPTUNE) {
      vec3 c = orbitCenter(0.005, vec3(2.80,0.,2.80));
      col = shadeSphereTexTilted(p, c, uNeptuneTex, uSpinNeptune, NEPTUNE_TILT);
      drewPlanet = true;
    } else if (rmP.id == ID_NEPTUNE_RING) {
      col = shadeNeptuneRing(p);
      drewPlanet = true;
    }
  }

  if (!drewPlanet) {
    RM rmO = rayMarchOrbits(uCamPos, rd);
    if (rmO.d < MAX_DIST && isOrbitId(rmO.id)) {
      vec3 p = uCamPos + rd * rmO.d;
      float edge = exp(-abs(p.y) * 580.0);

      vec3 baseCol = orbitColorForId(rmO.id);

      float orbitIdx = rmO.id - ID_ORBIT1 + 1.0;
      float isActive = (uActiveOrbit > 0.5 && abs(orbitIdx - uActiveOrbit) < 0.5) ? 1.0 : 0.0;
      float glowBoost = 1.0 + isActive * 1.6;

      float inten = (0.35 + 0.65 * edge) * glowBoost;
      col = baseCol * inten;
    } else {
      col = bgColor(rd);
    }
  }

  float r = length(xy - xySun) / max(sunScreenR, 1e-6);
  float halo = clamp(uSunGlowGain / pow(max(r, 1e-3), uSunGlowPow), 0.0, uSunGlowMax);
  col += uSunGlowColor * halo;

  fragColor = vec4(col, 1.0);
}
`;

/* ==================== WebGL helpers ==================== */
function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) || "unknown compile error";
    const numbered = src
      .split("\n")
      .map((l, i) => `${String(i + 1).padStart(4, " ")}| ${l}`)
      .join("\n");
    gl.deleteShader(sh);
    throw new Error(
      `Shader compile failed:\n${log}\n----- source -----\n${numbered}`
    );
  }
  return sh;
}

function link(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
) {
  const pr = gl.createProgram()!;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(pr) || "unknown link error";
    gl.deleteProgram(pr);
    throw new Error(`Program link failed:\n${log}`);
  }
  return pr;
}

/* ==================== React component ==================== */
export default function Learning_Solar() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomUI, setZoomUI] = useState(0.4);

  // global: disable right-click context menu everywhere
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => {
      document.removeEventListener("contextmenu", handler);
    };
  }, []);

  // 1) On load, only Earth visible; others off
  const [planetVis, setPlanetVis] = useState<Record<PlanetKey, boolean>>({
    mercury: false,
    venus: false,
    earth: true,
    mars: false,
    jupiter: false,
    saturn: false,
    uranus: false,
    neptune: false,
  });

  // Earth name ON at load, others OFF
  const [planetNameVis, setPlanetNameVis] = useState<
    Record<PlanetKey, boolean>
  >({
    mercury: false,
    venus: false,
    earth: true,
    mars: false,
    jupiter: false,
    saturn: false,
    uranus: false,
    neptune: false,
  });

  // Not all planets visible at load -> false
  const [allPlanetsChecked, setAllPlanetsChecked] = useState(false);
  // Not all names visible at load -> false
  const [allNamesChecked, setAllNamesChecked] = useState(false);
  // All orbits ON at load
  const [allOrbitsChecked, setAllOrbitsChecked] = useState(true);

  const [activePlanet, setActivePlanet] = useState<PlanetKey>("earth");
  const [orbitLabels, setOrbitLabels] = useState<OrbitLabel[]>(
    () => ORBIT_RADII.map(() => ({ x: 0, y: 0, visible: false }))
  );

  const zoomRef = useRef(zoomUI);
  useEffect(() => {
    zoomRef.current = zoomUI;
  }, [zoomUI]);

  const planetVisRef = useRef(planetVis);
  useEffect(() => {
    planetVisRef.current = planetVis;
  }, [planetVis]);

  // active planet ref for WebGL loop
  const activePlanetRef = useRef<PlanetKey>(activePlanet);
  useEffect(() => {
    activePlanetRef.current = activePlanet;
  }, [activePlanet]);

  const isVisible = true;

  useEffect(() => {
    if (!ref.current || !isVisible) return;
    const canvas = ref.current!;
    const preventCtx = (e: MouseEvent) => e.preventDefault();
    canvas.addEventListener("contextmenu", preventCtx);

    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      throw new Error("WebGL2 not available");
    }

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW
    );

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = link(gl, vs, fs);
    gl.useProgram(prog);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);

    const uRes = gl.getUniformLocation(prog, "iResolution");
    const uTime = gl.getUniformLocation(prog, "iTime");
    const uCamPos = gl.getUniformLocation(prog, "uCamPos");
    const uCamAt = gl.getUniformLocation(prog, "uCamAt");

    const uAmbient = gl.getUniformLocation(prog, "uAmbient");
    const uDiffuseGain = gl.getUniformLocation(prog, "uDiffuseGain");

    const uSaturnSpeed = gl.getUniformLocation(prog, "uSaturnSpeed");
    const uSaturnOrbitPos = gl.getUniformLocation(prog, "uSaturnOrbitPos");
    const uSaturnRadius = gl.getUniformLocation(prog, "uSaturnRadius");
    const uRingInner = gl.getUniformLocation(prog, "uRingInner");
    const uRingOuter = gl.getUniformLocation(prog, "uRingOuter");
    const uRingHalfH = gl.getUniformLocation(prog, "uRingHalfH");
    const uRingTexRot = gl.getUniformLocation(prog, "uRingTexRot");
    const uRingFlipUV = gl.getUniformLocation(prog, "uRingFlipUV");
    const uRingQuarterTurns = gl.getUniformLocation(
      prog,
      "uRingQuarterTurns"
    );

    const uSunGlowColor = gl.getUniformLocation(prog, "uSunGlowColor");
    const uSunGlowGain = gl.getUniformLocation(prog, "uSunGlowGain");
    const uSunGlowMax = gl.getUniformLocation(prog, "uSunGlowMax");
    const uSunGlowPow = gl.getUniformLocation(prog, "uSunGlowPow");

    const uSunRotSpeed = gl.getUniformLocation(prog, "uSunRotSpeed");
    const uSunSelfGlowColor = gl.getUniformLocation(
      prog,
      "uSunSelfGlowColor"
    );
    const uSunSelfGlowStrength = gl.getUniformLocation(
      prog,
      "uSunSelfGlowStrength"
    );
    const uSunSelfGlowPow = gl.getUniformLocation(
      prog,
      "uSunSelfGlowPow"
    );

    const uEarthGlowColor = gl.getUniformLocation(prog, "uEarthGlowColor");
    const uEarthGlowStrength = gl.getUniformLocation(
      prog,
      "uEarthGlowStrength"
    );
    const uEarthRimPow = gl.getUniformLocation(prog, "uEarthRimPow");

    const uOrbitColor = gl.getUniformLocation(prog, "uOrbitColor");
    const uOrbitStrength = gl.getUniformLocation(prog, "uOrbitStrength");

    const uSpinMercury = gl.getUniformLocation(prog, "uSpinMercury");
    const uSpinVenus = gl.getUniformLocation(prog, "uSpinVenus");
    const uSpinEarth = gl.getUniformLocation(prog, "uSpinEarth");
    const uSpinMoon = gl.getUniformLocation(prog, "uSpinMoon");
    const uSpinMars = gl.getUniformLocation(prog, "uSpinMars");
    const uSpinJupiter = gl.getUniformLocation(prog, "uSpinJupiter");
    const uSpinSaturn = gl.getUniformLocation(prog, "uSpinSaturn");
    const uSpinUranus = gl.getUniformLocation(prog, "uSpinUranus");
    const uSpinNeptune = gl.getUniformLocation(prog, "uSpinNeptune");

    const uEarthPhaseX = gl.getUniformLocation(prog, "uEarthPhaseX");
    const uEarthPhaseY = gl.getUniformLocation(prog, "uEarthPhaseY");

    const uShowMercury = gl.getUniformLocation(prog, "uShowMercury");
    const uShowVenus = gl.getUniformLocation(prog, "uShowVenus");
    const uShowEarth = gl.getUniformLocation(prog, "uShowEarth");
    const uShowMars = gl.getUniformLocation(prog, "uShowMars");
    const uShowJupiter = gl.getUniformLocation(prog, "uShowJupiter");
    const uShowSaturn = gl.getUniformLocation(prog, "uShowSaturn");
    const uShowUranus = gl.getUniformLocation(prog, "uShowUranus");
    const uShowNeptune = gl.getUniformLocation(prog, "uShowNeptune");

    const uActiveOrbit = gl.getUniformLocation(prog, "uActiveOrbit");

    const u = {
      sun: gl.getUniformLocation(prog, "uSunTex"),
      mercury: gl.getUniformLocation(prog, "uMercuryTex"),
      venus: gl.getUniformLocation(prog, "uVenusTex"),
      earth: gl.getUniformLocation(prog, "uEarthTex"),
      moon: gl.getUniformLocation(prog, "uMoonTex"),
      mars: gl.getUniformLocation(prog, "uMarsTex"),
      jupiter: gl.getUniformLocation(prog, "uJupiterTex"),
      saturn: gl.getUniformLocation(prog, "uSaturnTex"),
      saturnRing: gl.getUniformLocation(prog, "uSaturnRingTex"),
      uranus: gl.getUniformLocation(prog, "uUranusTex"),
      neptune: gl.getUniformLocation(prog, "uNeptuneTex"),
    };

    type TexSpec = {
      unit: number;
      uniform: WebGLUniformLocation | null;
      src: string;
      flip?: boolean;
      placeholder?: [number, number, number, number];
    };

    const texSpecs: TexSpec[] = [
      { unit: 0, uniform: u.sun, src: TWEAKS.texSun },
      { unit: 1, uniform: u.mercury, src: TWEAKS.texMercury },
      { unit: 2, uniform: u.venus, src: TWEAKS.texVenus },
      { unit: 3, uniform: u.earth, src: TWEAKS.texEarth },
      { unit: 4, uniform: u.moon, src: TWEAKS.texMoon },
      { unit: 5, uniform: u.mars, src: TWEAKS.texMars },
      { unit: 6, uniform: u.jupiter, src: TWEAKS.texJupiter },
      { unit: 7, uniform: u.saturn, src: TWEAKS.texSaturn },
      {
        unit: 8,
        uniform: u.saturnRing,
        src: TWEAKS.texSaturnRing,
        placeholder: [255, 255, 255, 0],
      },
      { unit: 9, uniform: u.uranus, src: TWEAKS.texUranus },
      { unit: 10, uniform: u.neptune, src: TWEAKS.texNeptune },
    ];

    const createdTextures: WebGLTexture[] = [];

    function createTexture(spec: TexSpec) {
      const tex = gl.createTexture();
      if (!tex) return;
      createdTextures.push(tex);

      gl.activeTexture(gl.TEXTURE0 + spec.unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.CLAMP_TO_EDGE
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.CLAMP_TO_EDGE
      );

      const ph = spec.placeholder ?? [180, 180, 180, 255];

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array(ph)
      );

      if (spec.uniform) gl.uniform1i(spec.uniform, spec.unit);

      const img = new Image();
      img.src = spec.src;
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + spec.unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(
          gl.UNPACK_FLIP_Y_WEBGL,
          spec.flip ? 1 : 0
        );
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    }

    texSpecs.forEach(createTexture);

    if (uAmbient) gl.uniform1f(uAmbient, TWEAKS.ambient);
    if (uDiffuseGain) gl.uniform1f(uDiffuseGain, TWEAKS.diffuseGain);

    if (uSaturnSpeed)
      gl.uniform1f(uSaturnSpeed, TWEAKS.saturn.orbitSpeed);
    if (uSaturnOrbitPos)
      gl.uniform3f(uSaturnOrbitPos, ...TWEAKS.saturn.orbitPos);
    if (uSaturnRadius)
      gl.uniform1f(uSaturnRadius, TWEAKS.saturn.radius);

    if (uRingInner) gl.uniform1f(uRingInner, TWEAKS.ring.inner);
    if (uRingOuter) gl.uniform1f(uRingOuter, TWEAKS.ring.outer);
    if (uRingHalfH) gl.uniform1f(uRingHalfH, TWEAKS.ring.halfH);
    if (uRingTexRot) gl.uniform1f(uRingTexRot, TWEAKS.ring.texRot);
    if (uRingFlipUV)
      gl.uniform2f(
        uRingFlipUV,
        TWEAKS.ring.flipU,
        TWEAKS.ring.flipV
      );
    if (uRingQuarterTurns)
      gl.uniform1f(uRingQuarterTurns, TWEAKS.ring.quarterTurns);

    if (uSunGlowColor)
      gl.uniform3f(uSunGlowColor, ...TWEAKS.glow.sunColor);
    if (uSunGlowGain)
      gl.uniform1f(uSunGlowGain, TWEAKS.glow.sunGain);
    if (uSunGlowMax) gl.uniform1f(uSunGlowMax, TWEAKS.glow.sunMax);
    if (uSunGlowPow) gl.uniform1f(uSunGlowPow, TWEAKS.glow.sunPow);

    if (uSunRotSpeed)
      gl.uniform1f(uSunRotSpeed, TWEAKS.sunSurface.rotSpeed);
    if (uSunSelfGlowColor)
      gl.uniform3f(
        uSunSelfGlowColor,
        ...TWEAKS.sunSurface.selfGlowColor
      );
    if (uSunSelfGlowStrength)
      gl.uniform1f(
        uSunSelfGlowStrength,
        TWEAKS.sunSurface.selfGlowStrength
      );
    if (uSunSelfGlowPow)
      gl.uniform1f(uSunSelfGlowPow, TWEAKS.sunSurface.selfGlowPow);

    if (uEarthGlowColor)
      gl.uniform3f(uEarthGlowColor, ...TWEAKS.glow.earthColor);
    if (uEarthGlowStrength)
      gl.uniform1f(uEarthGlowStrength, TWEAKS.glow.earthStrength);
    if (uEarthRimPow)
      gl.uniform1f(uEarthRimPow, TWEAKS.glow.earthRimPow);

    if (uOrbitColor)
      gl.uniform3f(uOrbitColor, ...TWEAKS.orbits.color);
    if (uOrbitStrength)
      gl.uniform1f(uOrbitStrength, TWEAKS.orbits.strength);

    if (uSpinMercury)
      gl.uniform1f(uSpinMercury, TWEAKS.spin.mercury);
    if (uSpinVenus)
      gl.uniform1f(uSpinVenus, TWEAKS.spin.venus);
    if (uSpinEarth)
      gl.uniform1f(uSpinEarth, TWEAKS.spin.earth);
    if (uSpinMoon) gl.uniform1f(uSpinMoon, TWEAKS.spin.moon);
    if (uSpinMars) gl.uniform1f(uSpinMars, TWEAKS.spin.mars);
    if (uSpinJupiter)
      gl.uniform1f(uSpinJupiter, TWEAKS.spin.jupiter);
    if (uSpinSaturn)
      gl.uniform1f(uSpinSaturn, TWEAKS.spin.saturn);
    if (uSpinUranus)
      gl.uniform1f(uSpinUranus, TWEAKS.spin.uranus);
    if (uSpinNeptune)
      gl.uniform1f(uSpinNeptune, TWEAKS.spin.neptune);

    if (uEarthPhaseX)
      gl.uniform1f(uEarthPhaseX, TWEAKS.earthPhaseX);
    if (uEarthPhaseY)
      gl.uniform1f(uEarthPhaseY, TWEAKS.earthPhaseY);

    const setSize = () => {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        TWEAKS.dprMax
      );
      const w = Math.max(
        2,
        Math.floor(canvas.clientWidth * dpr)
      );
      const h = Math.max(
        2,
        Math.floor(canvas.clientHeight * dpr)
      );
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    let theta = TWEAKS.camTheta;
    let phi = TWEAKS.camPhi;
    const target = { x: 0, y: 0.0, z: 0 };

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let activeButton: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      activeButton = (e as any).button ?? 0;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx =
        (e.clientX - lastX) / canvas.clientWidth;
      const dy =
        (e.clientY - lastY) / canvas.clientHeight;
      lastX = e.clientX;
      lastY = e.clientY;

      if (activeButton === 0 || activeButton === 1 || activeButton == null) {
        theta += dx * Math.PI * TWEAKS.rotSens;
        phi -= dy * Math.PI * TWEAKS.rotSens;

        const clampFn = (v: number, a: number, b: number) =>
          Math.max(a, Math.min(b, v));
        phi = clampFn(phi, TWEAKS.camPhiMin, TWEAKS.camPhiMax);
        return;
      }

      if (activeButton === 2) {
        const z = Math.max(
          0,
          Math.min(1, zoomRef.current)
        );
        const radius =
          TWEAKS.camRadiusFar +
          (TWEAKS.camRadiusNear - TWEAKS.camRadiusFar) * z;

        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const camPos = {
          x: target.x + radius * sinPhi * cosTheta,
          y: target.y + radius * cosPhi,
          z: target.z + radius * sinPhi * sinTheta,
        };

        const view = normalize({
          x: target.x - camPos.x,
          y: target.y - camPos.y,
          z: target.z - camPos.z,
        });
        const up = { x: 0, y: 1, z: 0 };
        const right = normalize(cross(view, up));
        const trueUp = normalize(cross(right, view));
        const s = radius * 1.5 * TWEAKS.panSens;

        target.x += (-right.x * dx + trueUp.x * dy) * s;
        target.y += (-right.y * dx + trueUp.y * dy) * s;
        target.z += (-right.z * dx + trueUp.z * dy) * s;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      activeButton = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomStep = e.deltaY > 0 ? -0.045 : 0.045;
      setZoomUI((current) => Math.max(0, Math.min(1, current + zoomStep)));
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });

    const updateOrbitLabels = (
      camPos: { x: number; y: number; z: number },
      forward: { x: number; y: number; z: number },
      right: { x: number; y: number; z: number },
      trueUp: { x: number; y: number; z: number }
    ) => {
      const wCSS =
        canvas.clientWidth || canvas.width;
      const hCSS =
        canvas.clientHeight || canvas.height;
      const mCSS = Math.min(wCSS, hCSS);

      const newLabels: OrbitLabel[] = ORBIT_RADII.map(
        (radius, idx) => {
          const ang = ORBIT_LABEL_ANGLES[idx];
          const labelRadius =
            radius * ORBIT_LABEL_RADIUS_SCALE;
          const worldPoint = {
            x: labelRadius * Math.cos(ang),
            y: 0,
            z: labelRadius * Math.sin(ang),
          };
          const worldDir = normalize({
            x: worldPoint.x - camPos.x,
            y: worldPoint.y - camPos.y,
            z: worldPoint.z - camPos.z,
          });
          const camDir = {
            x: dot(worldDir, right),
            y: dot(worldDir, trueUp),
            z: dot(worldDir, forward),
          };
          if (camDir.z <= 0.01) {
            return { x: 0, y: 0, visible: false };
          }
          const ndcX = (2 * camDir.x) / camDir.z;
          const ndcY = (2 * camDir.y) / camDir.z;

          const sx =
            wCSS * 0.5 + ndcX * mCSS;
          const sy =
            hCSS * 0.5 - ndcY * mCSS;

          const visible =
            sx >= 0 &&
            sx <= wCSS &&
            sy >= 0 &&
            sy <= hCSS;

          return { x: sx, y: sy, visible };
        }
      );
      setOrbitLabels(newLabels);
    };

    let running = true;
    let t0 = performance.now();

    function loop() {
      if (!running) return;
      const t =
        (performance.now() - t0) * 0.001;

      setSize();

      const z = Math.max(
        0,
        Math.min(1, zoomRef.current)
      );
      const radius =
        TWEAKS.camRadiusFar +
        (TWEAKS.camRadiusNear - TWEAKS.camRadiusFar) * z;

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const camX = target.x + radius * sinPhi * cosTheta;
      const camY = target.y + radius * cosPhi;
      const camZ = target.z + radius * sinPhi * sinTheta;

      if (uTime) gl.uniform1f(uTime, t);
      if (uCamPos) gl.uniform3f(uCamPos, camX, camY, camZ);
      if (uCamAt)
        gl.uniform3f(uCamAt, target.x, target.y, target.z);

      const pv = planetVisRef.current;
      if (uShowMercury)
        gl.uniform1f(uShowMercury, pv.mercury ? 1.0 : 0.0);
      if (uShowVenus)
        gl.uniform1f(uShowVenus, pv.venus ? 1.0 : 0.0);
      if (uShowEarth)
        gl.uniform1f(uShowEarth, pv.earth ? 1.0 : 0.0);
      if (uShowMars)
        gl.uniform1f(uShowMars, pv.mars ? 1.0 : 0.0);
      if (uShowJupiter)
        gl.uniform1f(uShowJupiter, pv.jupiter ? 1.0 : 0.0);
      if (uShowSaturn)
        gl.uniform1f(uShowSaturn, pv.saturn ? 1.0 : 0.0);
      if (uShowUranus)
        gl.uniform1f(uShowUranus, pv.uranus ? 1.0 : 0.0);
      if (uShowNeptune)
        gl.uniform1f(uShowNeptune, pv.neptune ? 1.0 : 0.0);

      // active orbit index based on active planet
      if (uActiveOrbit) {
        const key = activePlanetRef.current;
        const idx = PLANET_KEYS.indexOf(key);
        const orbitIndex = idx >= 0 ? idx + 1 : -1;
        gl.uniform1f(uActiveOrbit, orbitIndex);
      }

      const camPos = { x: camX, y: camY, z: camZ };
      const forward = normalize({
        x: target.x - camPos.x,
        y: target.y - camPos.y,
        z: target.z - camPos.z,
      });
      const up = { x: 0, y: 1, z: 0 };
      const right = normalize(cross(forward, up));
      const trueUp = normalize(cross(right, forward));

      updateOrbitLabels(camPos, forward, right, trueUp);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(loop);
    }

    loop();

    return () => {
      running = false;
      ro.disconnect();
      canvas.removeEventListener("contextmenu", preventCtx);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      createdTextures.forEach((tex) => gl.deleteTexture(tex));
    };
  }, [isVisible]);

  const activeData = PLANET_DATA.find(
    (p) => p.key === activePlanet
  )!;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <canvas
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "#03050a",
        }}
      />

      {/* Control panel - left */}
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          padding: "16px 18px 14px 18px",
          background: "rgba(5,8,14,0.9)",
          borderRadius: 14,
          backdropFilter: "blur(6px)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto",
          fontSize: 13,
          color: "#e2e8f0",
          maxWidth: 360,
          minWidth: 320,
          boxShadow: "0 0 26px rgba(0,0,0,0.7)",
          border: "1px solid rgba(148,163,184,0.35)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#f9fafb",
          }}
        >
          KNOW YOUR SOLAR SYSTEM
        </div>

        {/* Zoom slider inside panel */}
        <div
          style={{
            display: "grid",
            rowGap: 4,
            marginTop: 4,
            justifyItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 12,
              color: "#cbd5e1",
            }}
          >
            Zoom
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoomUI}
            onChange={(e) =>
              setZoomUI(parseFloat(e.target.value))
            }
            style={{
              width: "100%",
              accentColor: "#2d7fff",
            }}
          />
        </div>

        {/* global toggles */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 6,
            marginBottom: 4,
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={allPlanetsChecked}
              onChange={(e) => {
                const v = e.target.checked;
                setAllPlanetsChecked(v);
                setPlanetVis((prev) => {
                  const next: Record<PlanetKey, boolean> = {
                    ...prev,
                  };
                  PLANET_KEYS.forEach((k) => {
                    next[k] = v;
                  });
                  return next;
                });
              }}
              style={{
                cursor: "pointer",
                margin: 0,
                accentColor: "#2d7fff",
              }}
            />
            <span>All planets</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={allNamesChecked}
              onChange={(e) => {
                const v = e.target.checked;
                setAllNamesChecked(v);
                setPlanetNameVis((prev) => {
                  const next: Record<PlanetKey, boolean> = {
                    ...prev,
                  };
                  PLANET_KEYS.forEach((k) => {
                    next[k] = v;
                  });
                  return next;
                });
              }}
              style={{
                cursor: "pointer",
                margin: 0,
                accentColor: "#2d7fff",
              }}
            />
            <span>All names</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={allOrbitsChecked}
              onChange={(e) =>
                setAllOrbitsChecked(e.target.checked)
              }
              style={{
                cursor: "pointer",
                margin: 0,
                accentColor: "#2d7fff",
              }}
            />
            <span>All orbits</span>
          </label>
        </div>

        <div
          style={{
            height: 1,
            background: "rgba(148,163,184,0.35)",
            margin: "4px 0 4px 0",
          }}
        />

        {/* header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(60px,auto) minmax(46px,auto) minmax(70px,auto) minmax(90px,1fr) auto",
            fontSize: 10,
            color: "#9ca3af",
            marginBottom: 4,
            columnGap: 8,
            paddingRight: 4,
          }}
        >
          <span style={{ justifySelf: "center" }}>
            Visible
          </span>
          <span style={{ justifySelf: "center" }}>
            Orbit
          </span>
          <span style={{ justifySelf: "center" }}>Name</span>
          <span style={{ justifySelf: "center" }}>
            Planet
          </span>
          <span style={{ justifySelf: "center" }}>Data</span>
        </div>

        {/* per-planet controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            paddingTop: 2,
          }}
        >
          {PLANET_KEYS.map((key, idx) => {
            const checked = planetVis[key];
            const showName = planetNameVis[key];
            const color = ORBIT_COLOR_HEX[key];
            const label = PLANET_LABELS[key];
            const isActive = activePlanet === key;

            const colorSoft = `${color}33`;
            const colorBorder = `${color}66`;
            const colorGlow = `${color}aa`;
            const textColor = showName ? color : colorSoft;

            return (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(60px,auto) minmax(46px,auto) minmax(70px,auto) minmax(90px,1fr) auto",
                  alignItems: "center",
                  columnGap: 8,
                  padding: "2px 0",
                }}
              >
                {/* 1. planet visibility checkbox (number removed) */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    fontSize: 11,
                    justifySelf: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setPlanetVis((prev) => {
                        const next: Record<PlanetKey, boolean> = {
                          ...prev,
                          [key]: v,
                        };
                        const allOn = PLANET_KEYS.every(
                          (k) => next[k]
                        );
                        setAllPlanetsChecked(allOn);
                        return next;
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      margin: 0,
                      accentColor: "#2d7fff",
                    }}
                    title="Show / hide planet"
                  />
                </label>

                {/* 2. colorful orbit number */}
                <span
                  style={{
                    fontWeight: 800,
                    color,
                    minWidth: 22,
                    fontSize: 14,
                    justifySelf: "center",
                  }}
                >
                  {idx + 1}
                </span>

                {/* 3. name checkbox */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showName}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setPlanetNameVis((prev) => {
                        const next: Record<
                          PlanetKey,
                          boolean
                        > = {
                          ...prev,
                          [key]: v,
                        };
                        const allOn = PLANET_KEYS.every(
                          (k) => next[k]
                        );
                        setAllNamesChecked(allOn);
                        return next;
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      margin: 0,
                      accentColor: "#2d7fff",
                    }}
                    title="Show / hide name label"
                  />
                </div>

                {/* 4. planet name (only visible when name checked) */}
                <button
                  type="button"
                  onClick={() => setActivePlanet(key)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    textAlign: "center",
                    cursor: "pointer",
                    color: textColor,
                    fontWeight: 700,
                    fontSize: 13.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    letterSpacing: "0.02em",
                    visibility: showName
                      ? "visible"
                      : "hidden",
                    justifySelf: "center",
                  }}
                >
                  {label}
                </button>

                {/* 5. colorful dot -> selects planet data, only if Name is checked */}
                <span
                  onClick={() => {
                    if (!showName) return;
                    setActivePlanet(key);
                  }}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: isActive
                      ? color
                      : colorSoft,
                    boxShadow: isActive
                      ? `0 0 10px ${color}, 0 0 18px ${colorGlow}`
                      : `0 0 4px ${colorGlow}`,
                    justifySelf: "center",
                    cursor: showName ? "pointer" : "default",
                    border: isActive
                      ? "1px solid #e5e7eb"
                      : `1px solid ${colorBorder}`,
                    transition:
                      "box-shadow 0.15s ease, background 0.15s ease",
                    opacity: showName ? 1 : 0.7,
                  }}
                  title="Select planet for details"
                />
              </div>
            );
          })}
        </div>

        {/* info card for selected planet */}
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background:
              "radial-gradient(circle at 0% 0%, rgba(148,163,255,0.25), transparent 55%), rgba(15,23,42,0.96)",
            border: "1px solid rgba(148,163,184,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 11.5,
            boxShadow: "0 0 18px rgba(15,23,42,0.9)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: ORBIT_COLOR_HEX[activePlanet],
                boxShadow: `0 0 10px ${
                  ORBIT_COLOR_HEX[activePlanet]
                }, 0 0 22px ${
                  ORBIT_COLOR_HEX[activePlanet]
                }aa`,
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {PLANET_LABELS[activePlanet]} — Orbit #{" "}
              {PLANET_KEYS.indexOf(activePlanet) + 1}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              rowGap: 3,
              columnGap: 4,
            }}
          >
            <span style={{ color: "#9ca3af" }}>Tilt</span>
            <span>{activeData.tilt}</span>

            <span style={{ color: "#9ca3af" }}>Day</span>
            <span>{activeData.day}</span>

            <span style={{ color: "#9ca3af" }}>Year</span>
            <span>{activeData.year}</span>

            <span style={{ color: "#9ca3af" }}>Size</span>
            <span>{activeData.size}</span>

            <span style={{ color: "#9ca3af" }}>Distance</span>
            <span>{activeData.distance}</span>

            <span style={{ color: "#9ca3af" }}>Moons</span>
            <span>{activeData.moons}</span>

            <span style={{ color: "#9ca3af" }}>
              Temperature
            </span>
            <span>{activeData.temp}</span>

            <span style={{ color: "#9ca3af" }}>Extra</span>
            <span>{activeData.extra}</span>
          </div>
        </div>
      </div>

      {/* numbers on each orbit line (1..8), locked on the ring */}
      {allOrbitsChecked &&
        orbitLabels.map(
          (lab, idx) =>
            lab.visible && (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: lab.x - 10,
                  top: lab.y - 10,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "rgba(10,10,16,0.95)",
                  border: `1px solid ${
                    ORBIT_COLOR_HEX[PLANET_KEYS[idx]]
                  }`,
                  color: ORBIT_COLOR_HEX[PLANET_KEYS[idx]],
                  fontSize: 13,
                  fontFamily:
                    "system-ui, -apple-system, Segoe UI, Roboto",
                  pointerEvents: "none",
                  boxShadow: `0 0 12px ${
                    ORBIT_COLOR_HEX[PLANET_KEYS[idx]]
                  }55`,
                }}
              >
                {idx + 1}
              </div>
            )
        )}
    </div>
  );
}

/* ---------- small vector helpers ---------- */
function cross(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(v: { x: number; y: number; z: number }) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

function dot(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
