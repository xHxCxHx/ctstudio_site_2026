// src/labExperiments/Solar_System.tsx
import { useEffect, useRef, useState, type CSSProperties } from "react";

const TWEAKS = {
  dprMax: 1.75,

  texSun: new URL("./assets/textures/solar_texture/2k_sun.jpg", import.meta.url).href,
  texMercury: new URL("./assets/textures/solar_texture/2k_mercury.jpg", import.meta.url).href,
  texVenus: new URL("./assets/textures/solar_texture/2k_venus_atmosphere.jpg", import.meta.url).href,
  texEarth: new URL("./assets/textures/solar_texture/earth_color.jpg", import.meta.url).href,
  texMoon: new URL("./assets/textures/solar_texture/2k_moon.jpg", import.meta.url).href,
  texMars: new URL("./assets/textures/solar_texture/2k_mars.jpg", import.meta.url).href,
  texJupiter: new URL("./assets/textures/solar_texture/2k_jupiter.jpg", import.meta.url).href,
  texSaturn: new URL("./assets/textures/solar_texture/2k_saturn.jpg", import.meta.url).href,
  texSaturnRing: new URL("./assets/textures/solar_texture/2k_saturn_ring_alpha.png", import.meta.url).href,
  texUranus: new URL("./assets/textures/solar_texture/2k_uranus.jpg", import.meta.url).href,
  texNeptune: new URL("./assets/textures/solar_texture/2k_neptune.jpg", import.meta.url).href,

  camRadiusNear: 4.0,
  camRadiusFar: 28.0,
  camTheta: -2.3,
  camPhi: 1.0,
  camPhiMin: 0.15,
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

  ambient: 0.5,
  diffuseGain: 0.95,

  saturn: {
    orbitSpeed: 0.05,
    orbitPos: [2.05, 0.0, 2.05] as [number, number, number],
    radius: 0.264,
  },

  ring: {
    inner: 0.30, // فاصله داخلی حلقه زحل از مرکز
    outer: 0.47, // بیرونی حلقه
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
    strength: 1.25,
  },

  RED_AREA: { x: 24, y: 200 },
  TEXT_POS: { dx: -20, dy: -10 },

  panelBg: "rgba(0,0,0,0.15)",
  blurPx: 8,
  panelRadius: 16,
  panelPadding: 60,
  panelMaxWidth: 600,

  titleSize: 48,
  bodySize: 26,
  lineHeight: 1.4,
  titleWeight: 800,
  bodyWeight: 400,

  fontFamily:
    `"Gotham", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
  textColor: "#ffffff",

  panelTitle: "Gravity Rules the\nSolar System",
  panelBody:
    "Gravity pulls all masses together. The Sun’s huge mass gives it the strongest pull in our system.\n\n" +
    "Closer orbits feel a stronger pull, so they must move faster to avoid falling inward.\n" +
    "Farther orbits feel a weaker pull, so they move slower and take longer to finish a lap.\n\n" +
    "Quick facts:\n" +
    "• Mercury ≈ 47 km/s → 88 days per orbit\n" +
    "• Earth ≈ 30 km/s → 365 days per orbit\n" +
    "• Neptune ≈ 5.4 km/s → 165 years per orbit\n\n" +
    "In space there’s no air to slow planets; inertia keeps them moving while gravity bends their path into an orbit.",
};

const VERT = `#version 300 es
layout(location=0) in vec2 pos;
void main(){ gl_Position = vec4(pos, 0.0, 1.0); }
`;

// FRAG: rings/tilts same logic family as Image_15
const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  iResolution;
uniform float iTime;
uniform vec3  uCamPos;
uniform vec3  uCamAt;

uniform sampler2D uSunTex, uMercuryTex, uVenusTex, uEarthTex, uMoonTex, uMarsTex, uJupiterTex, uSaturnTex, uSaturnRingTex, uUranusTex, uNeptuneTex;

uniform float uAmbient, uDiffuseGain;

uniform float uSaturnSpeed;
uniform vec3  uSaturnOrbitPos;
uniform float uSaturnRadius;
uniform float uRingInner, uRingOuter, uRingHalfH;
uniform float uRingTexRot;
uniform vec2  uRingFlipUV;
uniform float uRingQuarterTurns;

uniform vec3  uSunGlowColor;
uniform float uSunGlowGain, uSunGlowMax, uSunGlowPow;
uniform float uSunRotSpeed;
uniform vec3  uSunSelfGlowColor;
uniform float uSunSelfGlowStrength, uSunSelfGlowPow;

uniform vec3  uEarthGlowColor;
uniform float uEarthGlowStrength, uEarthRimPow;

uniform vec3  uOrbitColor;
uniform float uOrbitStrength;

uniform float uSpinMercury, uSpinVenus, uSpinEarth, uSpinMoon, uSpinMars, uSpinJupiter, uSpinSaturn, uSpinUranus, uSpinNeptune;

uniform float uEarthPhaseX;
uniform float uEarthPhaseY;

#define EPS 0.001
#define MAX_DIST 50.0
#define PI 3.141592

#define ID_ORBIT        -1.0
#define ID_SUN           0.0
#define ID_MERCURY       1.0
#define ID_VENUS         2.0
#define ID_EARTH         3.0
#define ID_MOON          4.0
#define ID_MARS          5.0
#define ID_JUPITER       6.0
#define ID_SATURN        7.0
#define ID_SATURN_RING   8.0
#define ID_URANUS_RING   9.0
#define ID_URANUS       10.0
#define ID_NEPTUNE      11.0
#define ID_NEPTUNE_RING 12.0

const float SUN_RADIUS = 0.42;

// axial tilts
const float TILT_MERCURY = radians(0.034);
const float TILT_VENUS   = radians(177.3);
const float TILT_EARTH   = radians(23.26);
const float TILT_MARS    = radians(25.2);
const float TILT_JUPITER = radians(3.1);
const float TILT_SATURN  = radians(26.7);
const float TILT_URANUS  = radians(97.8);
const float TILT_NEPTUNE = radians(28.3);

// Saturn ring brightness
const float SATURN_RING_GAIN = 1.6;

struct SdfHit { float id; float d; };

float sdSphere(vec3 p, float r){ return length(p) - r; }
float sdTorus(vec3 p, float bR){ return length(vec2(length(p.xz) - bR, p.y)) - 0.0015; }
float sdRing(vec3 p, float rInner, float rOuter, float h){
  float y = abs(p.y) - h;
  float r = length(p.xz);
  float dr = max(rInner - r, r - rOuter);
  return max(y, dr);
}

SdfHit minHit(SdfHit a, SdfHit b){
  SdfHit r = a;
  if (b.d < a.d) { r = b; }
  return r;
}

mat3 rotateX(float k){ float c=cos(k), s=sin(k); return mat3(1.,0.,0., 0.,c,-s, 0.,s,c); }
mat3 rotateY(float k){ float c=cos(k), s=sin(k); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotateZ(float k){ float c=cos(k), s=sin(k); return mat3(c,-s,0., s,c,0., 0.,0.,1.); }
mat2 rot2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

mat3 calcLookAtMatrix(vec3 camPos, vec3 at){
  vec3 zAxis = normalize(at - camPos);
  vec3 xAxis = normalize(cross(zAxis, vec3(0., 1., 0.)));
  vec3 yAxis = normalize(cross(xAxis, zAxis));
  return mat3(xAxis, yAxis, zAxis);
}

vec3 orbitCenter(float speed, vec3 orbitVec){ return rotateY(iTime * speed) * orbitVec; }

// small helper for AA on band edges
float aaSmooth(float d, float w){
  float fw = fwidth(d);
  return smoothstep(w + fw, 0.0, d);
}

// scene
SdfHit sceneSDF(vec3 p){
  SdfHit h; h.id = -999.; h.d = 1e9;

  // Sun
  h = minHit(h, SdfHit(ID_SUN, sdSphere(p, SUN_RADIUS)));

  vec3 c;

  // Mercury
  c = orbitCenter(2.0,  vec3(0.45,0.,0.45));
  h = minHit(h, SdfHit(ID_MERCURY, sdSphere(p - c, 0.03)));

  // Venus
  c = orbitCenter(1.0,  vec3(0.65,0.,0.65));
  h = minHit(h, SdfHit(ID_VENUS,   sdSphere(p - c, 0.072)));

  // Earth + Moon
  vec3 cE = orbitCenter(0.3, vec3(0.85,0.,0.85));
  h = minHit(h, SdfHit(ID_EARTH, sdSphere(p - cE, 0.078)));

  vec2 mOff = rot2(iTime * 1.6) * vec2(0.12, 0.0);
  vec3 cM = cE + vec3(mOff.x, 0.0, mOff.y);
  h = minHit(h, SdfHit(ID_MOON, sdSphere(p - cM, 0.020)));

  // Mars
  c = orbitCenter(0.2,  vec3(1.10,0.,1.10));
  h = minHit(h, SdfHit(ID_MARS, sdSphere(p - c, 0.060)));

  // Jupiter
  c = orbitCenter(0.1,  vec3(1.45,0.,1.45));
  h = minHit(h, SdfHit(ID_JUPITER, sdSphere(p - c, 0.330)));

  // Saturn + ring (tilt X)
  vec3 cSat = orbitCenter(uSaturnSpeed, uSaturnOrbitPos);
  vec3 qSat = p - cSat;
  h = minHit(h, SdfHit(ID_SATURN, sdSphere(qSat, uSaturnRadius)));
  vec3 qSatRing = rotateX(TILT_SATURN) * qSat;
  h = minHit(h, SdfHit(ID_SATURN_RING, sdRing(qSatRing, uRingInner, uRingOuter, uRingHalfH)));

  // Uranus + ring (blue, 2+gap+2+gap+2)
  vec3 cU = orbitCenter(0.01, vec3(2.55,0.,2.55));
  vec3 qU = p - cU;
  h = minHit(h, SdfHit(ID_URANUS, sdSphere(qU, 0.150)));
  vec3 qUR = rotateX(TILT_URANUS) * qU;
  h = minHit(h, SdfHit(ID_URANUS_RING, sdRing(qUR, 0.18, 0.32, 0.0012)));

  // Neptune + ring (2 close + gap + 2 close)
  vec3 cN = orbitCenter(0.005, vec3(2.80,0.,2.80));
  vec3 qN = p - cN;
  h = minHit(h, SdfHit(ID_NEPTUNE, sdSphere(qN, 0.100)));
  vec3 qNR = rotateX(TILT_NEPTUNE) * qN;
  h = minHit(h, SdfHit(ID_NEPTUNE_RING, sdRing(qNR, 0.14, 0.26, 0.0012)));

  // Orbits
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 0.63)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 0.92)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 1.20)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 1.55)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 2.05)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 2.90)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 3.60)));
  h = minHit(h, SdfHit(ID_ORBIT, sdTorus(p, 3.95)));

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

vec3 shadeSphereTexTilt(vec3 p, vec3 center, sampler2D tex, float spinSpeed, float tiltRad){
  vec3 q = p - center;
  vec3 qTilt = rotateX(tiltRad) * q;
  vec3 qRot = rotateY(iTime * spinSpeed) * qTilt;
  vec2 uv = sphereUV(qRot);
  vec3 texCol = texture(tex, uv).rgb;
  return lambert(q, center + q, texCol);
}

// Saturn ring
vec3 shadeSaturnRing(vec3 p){
  vec3 cSat = orbitCenter(uSaturnSpeed, uSaturnOrbitPos);
  vec3 q = p - cSat;
  vec3 qTilt = rotateX(TILT_SATURN) * q;

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
  vec3 nWorld = rotateX(-TILT_SATURN) * nLocal;

  vec3 lit = lambert(nWorld, cSat + q, col);
  return lit * alpha * SATURN_RING_GAIN;
}

// Uranus ring (blue multi-band) with AA smoothing
vec3 shadeUranusRing(vec3 p){
  vec3 cU = orbitCenter(0.01, vec3(2.55,0.,2.55));
  vec3 q = p - cU;
  vec3 qTilt = rotateX(TILT_URANUS) * q;

  float innerR = 0.18;
  float outerR = 0.32;
  float r = length(qTilt.xz);
  float t = clamp((r - innerR) / max(outerR - innerR, 1.0e-5), 0.0, 1.0);

  float bandWidth = 0.035;
  float m = 0.0;

  float d0 = abs(t - 0.15);
  float d1 = abs(t - 0.20);
  float d2 = abs(t - 0.45);
  float d3 = abs(t - 0.50);
  float d4 = abs(t - 0.80);
  float d5 = abs(t - 0.85);

  // fwidth-based smooth for less shimmering from distance
  m = max(m, aaSmooth(d0, bandWidth));
  m = max(m, aaSmooth(d1, bandWidth));
  m = max(m, aaSmooth(d2, bandWidth));
  m = max(m, aaSmooth(d3, bandWidth));
  m = max(m, aaSmooth(d4, bandWidth));
  m = max(m, aaSmooth(d5, bandWidth));

  vec3 innerCol = vec3(0.78, 0.90, 0.96);
  vec3 outerCol = vec3(0.36, 0.54, 0.62);
  vec3 col = mix(innerCol, outerCol, t);
  col *= 0.35 + 0.65 * m;

  float fadeInner = smoothstep(0.02, 0.10, t);
  float fadeOuter = 1.0 - smoothstep(0.88, 0.98, t);
  float alpha = fadeInner * fadeOuter * m * 2.0;

  vec3 nLocal = vec3(0.0, 1.0, 0.0);
  vec3 nWorld = rotateX(-TILT_URANUS) * nLocal;

  vec3 lit = lambert(nWorld, cU + q, col);
  return lit * alpha;
}

// Neptune ring (2 close + gap + 2 close) with AA smoothing
vec3 shadeNeptuneRing(vec3 p){
  vec3 cN = orbitCenter(0.005, vec3(2.80,0.,2.80));
  vec3 q = p - cN;
  vec3 qTilt = rotateX(TILT_NEPTUNE) * q;

  float innerR = 0.14;
  float outerR = 0.26;
  float r = length(qTilt.xz);
  float t = clamp((r - innerR) / max(outerR - innerR, 1.0e-5), 0.0, 1.0);

  float bandWidth = 0.030;
  float m = 0.0;

  float d0 = abs(t - 0.25);
  float d1 = abs(t - 0.30);
  float d2 = abs(t - 0.70);
  float d3 = abs(t - 0.75);

  // fwidth-based smooth here too
  m = max(m, aaSmooth(d0, bandWidth));
  m = max(m, aaSmooth(d1, bandWidth));
  m = max(m, aaSmooth(d2, bandWidth));
  m = max(m, aaSmooth(d3, bandWidth));

  vec3 innerCol = vec3(0.40, 0.72, 1.05);
  vec3 outerCol = vec3(0.10, 0.32, 0.95);
  vec3 col = mix(innerCol, outerCol, t);
  col *= 0.50 + 0.80 * m;

  float fadeInner = smoothstep(0.03, 0.08, t);
  float fadeOuter = 1.0 - smoothstep(0.85, 0.98, t);
  float alpha = fadeInner * fadeOuter * m * 2.4;

  vec3 nLocal = vec3(0.0, 1.0, 0.0);
  vec3 nWorld = rotateX(-TILT_NEPTUNE) * nLocal;

  vec3 lit = lambert(nWorld, cN + q, col);
  return lit * alpha;
}

// stars
float rand3(vec3 p){
  p = fract(p * vec3(.1031, .11369, .13787));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float starLayer(vec3 d, float density, float size){
  vec3 cell = floor(d * density);
  float rnd = rand3(cell);
  float mask = step(0.996, rnd);
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

  vec3 base = vec3(0.01, 0.015, 0.03);
  vec3 col =
    base +
    s1 * vec3(0.8, 0.9, 1.0) +
    s2 * vec3(0.7, 0.8, 1.0) +
    s3 * vec3(1.0, 0.96, 0.9) +
    s4 * vec3(0.9, 0.95, 1.0);

  return col;
}

struct RM { float d; float id; };
RM rayMarch(vec3 ro, vec3 rd){
  RM res; res.d = 0.; res.id = -1.;
  for(int i=0; i<120; i++){
    SdfHit hit = sceneSDF(ro + rd * res.d);
    if (hit.d < EPS || res.d > MAX_DIST) { res.id = hit.id; break; }
    res.d += hit.d;
  }
  return res;
}

void main(){
  vec2 xy = (gl_FragCoord.xy - iResolution * 0.5) / min(iResolution.x, iResolution.y);
  mat3 cam = calcLookAtMatrix(uCamPos, uCamAt);
  mat3 camInv = transpose(cam);
  vec3 sunDirWorld = normalize(-uCamPos);
  vec3 sunDirCam   = normalize(camInv * sunDirWorld);
  vec2 xySun = (sunDirCam.z > 0.0) ? (sunDirCam.xy / sunDirCam.z) * 2.0 : vec2(1e5);
  float camDist = length(uCamPos);
  float alpha = asin(clamp(SUN_RADIUS / max(camDist, 1e-6), 0.0, 1.0));
  float sunScreenR = (sunDirCam.z > 0.0) ? 2.0 * tan(alpha) : 0.0;
  sunScreenR = max(sunScreenR, 1e-3);

  vec3 rd = cam * normalize(vec3(xy, 2.0));
  RM rm = rayMarch(uCamPos, rd);
  vec3 col = vec3(0.0);

  if (rm.d < MAX_DIST){
    vec3 p = uCamPos + rd * rm.d;
    if (rm.id == ID_SUN) {
      vec3 qRot = rotateY(iTime * uSunRotSpeed) * p;
      vec2 uv = sphereUV(qRot);
      vec3 base = texture(uSunTex, uv).rgb;
      vec3 n = normalize(p);
      vec3 viewDir = normalize(uCamPos - p);
      float rim = pow(clamp(1.0 - dot(n, viewDir), 0.0, 1.0), uSunSelfGlowPow) * uSunSelfGlowStrength;
      col = base + uSunSelfGlowColor * rim;
    } else if (rm.id == ID_MERCURY) {
      vec3 c = orbitCenter(2.0, vec3(0.45,0.,0.45));
      col = shadeSphereTexTilt(p, c, uMercuryTex, uSpinMercury, TILT_MERCURY);
    } else if (rm.id == ID_VENUS) {
      vec3 c = orbitCenter(1.0, vec3(0.65,0.,0.65));
      col = shadeSphereTexTilt(p, c, uVenusTex, uSpinVenus, TILT_VENUS);
    } else if (rm.id == ID_EARTH) {
      vec3 c = orbitCenter(0.3, vec3(0.85,0.,0.85));
      vec3 q = p - c;
      vec3 qTilt = rotateX(TILT_EARTH) * q;
      vec3 qRot = rotateY(iTime * uSpinEarth + uEarthPhaseY) * qTilt;
      vec2 uv = sphereUV(qRot);
      vec3 baseTex = texture(uEarthTex, uv).rgb;
      vec3 base = lambert(q, c + q, baseTex);
      vec3 n = normalize(q);
      vec3 viewDir = normalize(uCamPos - p);
      float rim = pow(clamp(1.0 - dot(n, viewDir), 0.0, 1.0), uEarthRimPow) * uEarthGlowStrength;
      col = base + uEarthGlowColor * rim;
    } else if (rm.id == ID_MOON) {
      vec3 cE = orbitCenter(0.3, vec3(0.85,0.,0.85));
      vec2 mOff = rot2(iTime * 1.6) * vec2(0.12, 0.0);
      vec3 cM = cE + vec3(mOff.x, 0.0, mOff.y);
      col = shadeSphereTexTilt(p, cM, uMoonTex, uSpinMoon, 0.0);
    } else if (rm.id == ID_MARS) {
      vec3 c = orbitCenter(0.2, vec3(1.10,0.,1.10));
      col = shadeSphereTexTilt(p, c, uMarsTex, uSpinMars, TILT_MARS);
    } else if (rm.id == ID_JUPITER) {
      vec3 c = orbitCenter(0.1, vec3(1.45,0.,1.45));
      col = shadeSphereTexTilt(p, c, uJupiterTex, uSpinJupiter, TILT_JUPITER);
    } else if (rm.id == ID_SATURN) {
      vec3 c = orbitCenter(uSaturnSpeed, uSaturnOrbitPos);
      col = shadeSphereTexTilt(p, c, uSaturnTex, uSpinSaturn, TILT_SATURN);
    } else if (rm.id == ID_SATURN_RING) {
      col = shadeSaturnRing(p);
    } else if (rm.id == ID_URANUS) {
      vec3 c = orbitCenter(0.01, vec3(2.55,0.,2.55));
      col = shadeSphereTexTilt(p, c, uUranusTex, uSpinUranus, TILT_URANUS);
    } else if (rm.id == ID_URANUS_RING) {
      col = shadeUranusRing(p);
    } else if (rm.id == ID_NEPTUNE) {
      vec3 c = orbitCenter(0.005, vec3(2.80,0.,2.80));
      col = shadeSphereTexTilt(p, c, uNeptuneTex, uSpinNeptune, TILT_NEPTUNE);
    } else if (rm.id == ID_NEPTUNE_RING) {
      col = shadeNeptuneRing(p);
    } else if (rm.id == ID_ORBIT) {
      col = uOrbitColor * uOrbitStrength;
    }
  } else {
    col = bgColor(rd);
  }

  float r = length(xy - xySun) / max(sunScreenR, 1e-6);
  float halo = clamp(uSunGlowGain / pow(max(r, 1e-3), uSunGlowPow), 0.0, uSunGlowMax);
  col += uSunGlowColor * halo;

  fragColor = vec4(col, 1.0);
}
`;

// helpers
function compile(gl: WebGL2RenderingContext, type: number, src: string){
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    const log = gl.getShaderInfoLog(sh) || "unknown compile error";
    const numbered = src
      .split("\n")
      .map((l, i) => `${String(i + 1).padStart(4, " ")}| ${l}`)
      .join("\n");
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed:\n${log}\n----- source -----\n${numbered}`);
  }
  return sh;
}
function link(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader){
  const pr = gl.createProgram()!;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr, gl.LINK_STATUS)){
    const log = gl.getProgramInfoLog(pr) || "unknown link error";
    gl.deleteProgram(pr);
    throw new Error(`Program link failed:\n${log}`);
  }
  return pr;
}

export default function Solar_System(){
  const ref = useRef<HTMLCanvasElement|null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomUI, setZoomUI] = useState(0.4);
  const [showPanel, setShowPanel] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const zoomRef = useRef(zoomUI);
  const pausedRef = useRef(isPaused);
  useEffect(()=>{ zoomRef.current = zoomUI; },[zoomUI]);
  useEffect(()=>{ pausedRef.current = isPaused; },[isPaused]);
  const isVisible = true;

  useEffect(() => {
    if (!ref.current || !isVisible) return;
    const canvas = ref.current!;
    const preventCtx = (e: MouseEvent) => e.preventDefault();
    canvas.addEventListener("contextmenu", preventCtx);

    const gl = canvas.getContext("webgl2", { antialias:true, alpha:false }) as WebGL2RenderingContext | null;
    if(!gl){ throw new Error("WebGL2 not available"); }

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    );

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = link(gl, vs, fs);
    gl.useProgram(prog);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);

    const uRes   = gl.getUniformLocation(prog, "iResolution");
    const uTime  = gl.getUniformLocation(prog, "iTime");
    const uCamPos= gl.getUniformLocation(prog, "uCamPos");
    const uCamAt = gl.getUniformLocation(prog, "uCamAt");

    const uAmbient     = gl.getUniformLocation(prog, "uAmbient");
    const uDiffuseGain = gl.getUniformLocation(prog, "uDiffuseGain");

    const uSaturnSpeed   = gl.getUniformLocation(prog, "uSaturnSpeed");
    const uSaturnOrbitPos= gl.getUniformLocation(prog, "uSaturnOrbitPos");
    const uSaturnRadius  = gl.getUniformLocation(prog, "uSaturnRadius");

    const uRingInner     = gl.getUniformLocation(prog, "uRingInner");
    const uRingOuter     = gl.getUniformLocation(prog, "uRingOuter");
    const uRingHalfH     = gl.getUniformLocation(prog, "uRingHalfH");
    const uRingTexRot    = gl.getUniformLocation(prog, "uRingTexRot");
    const uRingFlipUV    = gl.getUniformLocation(prog, "uRingFlipUV");
    const uRingQuarterTurns = gl.getUniformLocation(prog, "uRingQuarterTurns");

    const uSunGlowColor = gl.getUniformLocation(prog, "uSunGlowColor");
    const uSunGlowGain  = gl.getUniformLocation(prog, "uSunGlowGain");
    const uSunGlowMax   = gl.getUniformLocation(prog, "uSunGlowMax");
    const uSunGlowPow   = gl.getUniformLocation(prog, "uSunGlowPow");

    const uSunRotSpeed        = gl.getUniformLocation(prog, "uSunRotSpeed");
    const uSunSelfGlowColor   = gl.getUniformLocation(prog, "uSunSelfGlowColor");
    const uSunSelfGlowStrength= gl.getUniformLocation(prog, "uSunSelfGlowStrength");
    const uSunSelfGlowPow     = gl.getUniformLocation(prog, "uSunSelfGlowPow");

    const uEarthGlowColor    = gl.getUniformLocation(prog, "uEarthGlowColor");
    const uEarthGlowStrength = gl.getUniformLocation(prog, "uEarthGlowStrength");
    const uEarthRimPow       = gl.getUniformLocation(prog, "uEarthRimPow");

    const uOrbitColor    = gl.getUniformLocation(prog, "uOrbitColor");
    const uOrbitStrength = gl.getUniformLocation(prog, "uOrbitStrength");

    const uSpinMercury = gl.getUniformLocation(prog, "uSpinMercury");
    const uSpinVenus   = gl.getUniformLocation(prog, "uSpinVenus");
    const uSpinEarth   = gl.getUniformLocation(prog, "uSpinEarth");
    const uSpinMoon    = gl.getUniformLocation(prog, "uSpinMoon");
    const uSpinMars    = gl.getUniformLocation(prog, "uSpinMars");
    const uSpinJupiter = gl.getUniformLocation(prog, "uSpinJupiter");
    const uSpinSaturn  = gl.getUniformLocation(prog, "uSpinSaturn");
    const uSpinUranus  = gl.getUniformLocation(prog, "uSpinUranus");
    const uSpinNeptune = gl.getUniformLocation(prog, "uSpinNeptune");

    const uEarthPhaseX = gl.getUniformLocation(prog, "uEarthPhaseX");
    const uEarthPhaseY = gl.getUniformLocation(prog, "uEarthPhaseY");

    const u = {
      sun:        gl.getUniformLocation(prog, "uSunTex"),
      mercury:    gl.getUniformLocation(prog, "uMercuryTex"),
      venus:      gl.getUniformLocation(prog, "uVenusTex"),
      earth:      gl.getUniformLocation(prog, "uEarthTex"),
      moon:       gl.getUniformLocation(prog, "uMoonTex"),
      mars:       gl.getUniformLocation(prog, "uMarsTex"),
      jupiter:    gl.getUniformLocation(prog, "uJupiterTex"),
      saturn:     gl.getUniformLocation(prog, "uSaturnTex"),
      saturnRing: gl.getUniformLocation(prog, "uSaturnRingTex"),
      uranus:     gl.getUniformLocation(prog, "uUranusTex"),
      neptune:    gl.getUniformLocation(prog, "uNeptuneTex")
    };

    type TexSpec = {
      unit:number;
      uniform:WebGLUniformLocation|null;
      src:string;
      flip?:boolean;
      placeholder?:[number,number,number,number];
    };

    const texSpecs: TexSpec[] = [
      { unit:0,  uniform:u.sun,        src:TWEAKS.texSun },
      { unit:1,  uniform:u.mercury,    src:TWEAKS.texMercury },
      { unit:2,  uniform:u.venus,      src:TWEAKS.texVenus },
      { unit:3,  uniform:u.earth,      src:TWEAKS.texEarth, flip:true },
      { unit:4,  uniform:u.moon,       src:TWEAKS.texMoon },
      { unit:5,  uniform:u.mars,       src:TWEAKS.texMars },
      { unit:6,  uniform:u.jupiter,    src:TWEAKS.texJupiter },
      { unit:7,  uniform:u.saturn,     src:TWEAKS.texSaturn },
      { unit:8,  uniform:u.saturnRing, src:TWEAKS.texSaturnRing, placeholder:[255,255,255,0] },
      { unit:9,  uniform:u.uranus,     src:TWEAKS.texUranus },
      { unit:10, uniform:u.neptune,    src:TWEAKS.texNeptune }
    ];

    const createdTextures: WebGLTexture[] = [];
    function createTexture(spec: TexSpec){
      const tex = gl.createTexture();
      if (!tex) return;
      createdTextures.push(tex);
      gl.activeTexture(gl.TEXTURE0 + spec.unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const ph = spec.placeholder ?? [180,180,180,255];
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
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, spec.flip ? 1 : 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    }
    texSpecs.forEach(createTexture);

    if (uAmbient) gl.uniform1f(uAmbient, TWEAKS.ambient);
    if (uDiffuseGain) gl.uniform1f(uDiffuseGain, TWEAKS.diffuseGain);

    if (uSaturnSpeed) gl.uniform1f(uSaturnSpeed, TWEAKS.saturn.orbitSpeed);
    if (uSaturnOrbitPos) gl.uniform3f(uSaturnOrbitPos, ...TWEAKS.saturn.orbitPos);
    if (uSaturnRadius) gl.uniform1f(uSaturnRadius, TWEAKS.saturn.radius);

    if (uRingInner)  gl.uniform1f(uRingInner,  TWEAKS.ring.inner);
    if (uRingOuter)  gl.uniform1f(uRingOuter,  TWEAKS.ring.outer);
    if (uRingHalfH)  gl.uniform1f(uRingHalfH,  TWEAKS.ring.halfH);
    if (uRingTexRot) gl.uniform1f(uRingTexRot, TWEAKS.ring.texRot);
    if (uRingFlipUV) gl.uniform2f(uRingFlipUV, TWEAKS.ring.flipU, TWEAKS.ring.flipV);
    if (uRingQuarterTurns) gl.uniform1f(uRingQuarterTurns, TWEAKS.ring.quarterTurns);

    if (uSunGlowColor) gl.uniform3f(uSunGlowColor, ...TWEAKS.glow.sunColor);
    if (uSunGlowGain)  gl.uniform1f(uSunGlowGain,  TWEAKS.glow.sunGain);
    if (uSunGlowMax)   gl.uniform1f(uSunGlowMax,   TWEAKS.glow.sunMax);
    if (uSunGlowPow)   gl.uniform1f(uSunGlowPow,   TWEAKS.glow.sunPow);

    if (uSunRotSpeed) gl.uniform1f(uSunRotSpeed, TWEAKS.sunSurface.rotSpeed);
    if (uSunSelfGlowColor) gl.uniform3f(uSunSelfGlowColor, ...TWEAKS.sunSurface.selfGlowColor);
    if (uSunSelfGlowStrength) gl.uniform1f(uSunSelfGlowStrength, TWEAKS.sunSurface.selfGlowStrength);
    if (uSunSelfGlowPow) gl.uniform1f(uSunSelfGlowPow, TWEAKS.sunSurface.selfGlowPow);

    if (uEarthGlowColor) gl.uniform3f(uEarthGlowColor, ...TWEAKS.glow.earthColor);
    if (uEarthGlowStrength) gl.uniform1f(uEarthGlowStrength, TWEAKS.glow.earthStrength);
    if (uEarthRimPow)       gl.uniform1f(uEarthRimPow,       TWEAKS.glow.earthRimPow);

    if (uOrbitColor) gl.uniform3f(uOrbitColor, ...TWEAKS.orbits.color);
    if (uOrbitStrength) gl.uniform1f(uOrbitStrength, TWEAKS.orbits.strength);

    if (uSpinMercury) gl.uniform1f(uSpinMercury, TWEAKS.spin.mercury);
    if (uSpinVenus)   gl.uniform1f(uSpinVenus,   TWEAKS.spin.venus);
    if (uSpinEarth)   gl.uniform1f(uSpinEarth,   TWEAKS.spin.earth);
    if (uSpinMoon)    gl.uniform1f(uSpinMoon,    TWEAKS.spin.moon);
    if (uSpinMars)    gl.uniform1f(uSpinMars,    TWEAKS.spin.mars);
    if (uSpinJupiter) gl.uniform1f(uSpinJupiter, TWEAKS.spin.jupiter);
    if (uSpinSaturn)  gl.uniform1f(uSpinSaturn,  TWEAKS.spin.saturn);
    if (uSpinUranus)  gl.uniform1f(uSpinUranus,  TWEAKS.spin.uranus);
    if (uSpinNeptune) gl.uniform1f(uSpinNeptune, TWEAKS.spin.neptune);

    if (uEarthPhaseX) gl.uniform1f(uEarthPhaseX, TWEAKS.earthPhaseX);
    if (uEarthPhaseY) gl.uniform1f(uEarthPhaseY, TWEAKS.earthPhaseY);

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, TWEAKS.dprMax);
      const w = Math.max(2, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    let theta = TWEAKS.camTheta, phi = TWEAKS.camPhi;
    const target = { x:0, y:-0.5, z:0 };
    let dragging = false, lastX = 0, lastY = 0;
    let activeButton: number | null = null;

    const onPointerDown = (e: PointerEvent) => {
      // kill default right-click behavior (no menu)
      if ((e as any).button === 2) {
        e.preventDefault();
      }
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      activeButton = (e as any).button ?? 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) / canvas.clientWidth;
      const dy = (e.clientY - lastY) / canvas.clientHeight;
      lastX = e.clientX; lastY = e.clientY;

      if (activeButton === 0 || activeButton === 1 || activeButton == null) {
        theta += dx * Math.PI * TWEAKS.rotSens;
        phi   -= dy * Math.PI * TWEAKS.rotSens;
        const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
        phi = clamp(phi, TWEAKS.camPhiMin, TWEAKS.camPhiMax);
        return;
      }

      if (activeButton === 2) {
        const z = Math.max(0, Math.min(1, zoomRef.current));
        const radius = TWEAKS.camRadiusFar + (TWEAKS.camRadiusNear - TWEAKS.camRadiusFar) * z;
        const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
        const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
        const camPos = {
          x: target.x + radius * sinPhi * cosTheta,
          y: target.y + radius * cosPhi,
          z: target.z + radius * sinPhi * sinTheta
        };
        const view = normalize({
          x: target.x - camPos.x,
          y: target.y - camPos.y,
          z: target.z - camPos.z
        });
        const up = { x:0, y:1, z:0 };
        const right = normalize(cross(view, up));
        const trueUp = normalize(cross(right, view));
        const s = radius * 1.5 * TWEAKS.panSens;
        target.x += (-right.x * dx +  trueUp.x * dy) * s;
        target.y += (-right.y * dx +  trueUp.y * dy) * s;
        target.z += (-right.z * dx +  trueUp.z * dy) * s;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      activeButton = null;
      try{ canvas.releasePointerCapture(e.pointerId); }catch{}
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const nextZoom = Math.max(0, Math.min(1, zoomRef.current - e.deltaY * 0.0015));
      zoomRef.current = nextZoom;
      setZoomUI(nextZoom);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let running = true;
    let animationFrameId: number | null = null;
    let shaderTime = 0;
    let lastFrameTime = performance.now();

    function loop(now = performance.now()){
      if(!running) return;

      const deltaSeconds = Math.min(0.05, Math.max(0, (now - lastFrameTime) * 0.001));
      lastFrameTime = now;

      // چک‌باکس Pause Motion فقط زمان شیدر را فریز می‌کند؛ زوم و دوربین هنوز قابل کنترل می‌مانند.
      if (!pausedRef.current) {
        shaderTime += deltaSeconds;
      }

      setSize();
      const z = Math.max(0, Math.min(1, zoomRef.current));
      const radius = TWEAKS.camRadiusFar + (TWEAKS.camRadiusNear - TWEAKS.camRadiusFar) * z;
      const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
      const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
      const camX = target.x + radius * sinPhi * cosTheta;
      const camY = target.y + radius * cosPhi;
      const camZ = target.z + radius * sinPhi * sinTheta;
      if (uTime) gl.uniform1f(uTime, shaderTime);
      if (uCamPos) gl.uniform3f(uCamPos, camX, camY, camZ);
      if (uCamAt)  gl.uniform3f(uCamAt, target.x, target.y, target.z);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(loop);
    }
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
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

  return (
    <div
      ref={containerRef}
      style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",overscrollBehavior:"none",touchAction:"none"}}
      onContextMenu={(e)=>e.preventDefault()} // extra kill for right-click menu on whole area
    >
      <canvas
        ref={ref}
        style={{width:"100%",height:"100%",display:"block",background:"#03050a",touchAction:"none",cursor:"grab"}}
      />

      <div
        style={{
          position:"absolute",
          right:12,
          top:12,
          padding:"8px 10px",
          background:"rgba(10,12,18,0.7)",
          borderRadius:8,
          backdropFilter:"blur(4px)",
          color:"#cbd5e1",
          fontFamily:"system-ui, -apple-system, Segoe UI, Roboto",
          fontSize:12,
          display:"grid",
          gap:8
        }}
      >
        <label style={{display:"block"}}>
          Zoom
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoomUI}
            onChange={(e)=>setZoomUI(parseFloat(e.target.value))}
            style={{
              width: 180,
              display:"block",
              marginTop:6,
              accentColor: "#2d7fff"
            } as CSSProperties}
          />
        </label>
        <label
          style={{
            display:"flex",
            alignItems:"center",
            gap:8,
            cursor:"pointer",
            userSelect:"text"
          }}
        >
          <input
            type="checkbox"
            checked={showPanel}
            onChange={(e)=>setShowPanel(e.target.checked)}
            style={{ cursor:"pointer", accentColor:"#2d7fff" }}
          />
          Text Box
        </label>

        <label
          style={{
            display:"flex",
            alignItems:"center",
            gap:8,
            cursor:"pointer",
            userSelect:"text"
          }}
        >
          <input
            type="checkbox"
            checked={isPaused}
            onChange={(e)=>setIsPaused(e.target.checked)}
            style={{ cursor:"pointer", accentColor:"#2d7fff" }}
          />
          Pause Motion
        </label>
      </div>

      {showPanel && (
        <div
          style={{
            position:"absolute",
            left:TWEAKS.RED_AREA.x,
            top:"50%",
            transform:"translateY(-50%)",
            pointerEvents:"auto",
            userSelect:"text"
          }}
          onPointerDown={(e)=>e.stopPropagation()}
          onPointerMove={(e)=>e.stopPropagation()}
          onPointerUp={(e)=>e.stopPropagation()}
          onTouchStart={(e)=>e.stopPropagation()}
        >
          <div
            style={{
              display:"inline-block",
              background:TWEAKS.panelBg,
              backdropFilter:`blur(${TWEAKS.blurPx}px)`,
              borderRadius:TWEAKS.panelRadius,
              padding:TWEAKS.panelPadding,
              color:TWEAKS.textColor,
              fontFamily:TWEAKS.fontFamily as any,
              maxWidth:TWEAKS.panelMaxWidth
            }}
          >
            <div
              style={{
                transform:`translate(${TWEAKS.TEXT_POS.dx}px,${TWEAKS.TEXT_POS.dy}px)`
              }}
            >
              <div
                style={{
                  fontSize:TWEAKS.titleSize,
                  fontWeight:TWEAKS.titleWeight,
                  marginBottom:10,
                  lineHeight:TWEAKS.lineHeight,
                  whiteSpace:"pre-line"
                }}
              >
                {TWEAKS.panelTitle}
              </div>
              <div
                style={{
                  fontSize:TWEAKS.bodySize,
                  fontWeight:TWEAKS.bodyWeight,
                  lineHeight:TWEAKS.lineHeight,
                  whiteSpace:"pre-line"
                }}
              >
                {TWEAKS.panelBody}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cross(a:{x:number,y:number,z:number}, b:{x:number,y:number,z:number}){
  return {
    x: a.y*b.z - a.z*b.y,
    y: a.z*b.x - a.x*b.z,
    z: a.x*b.y - a.y*b.x
  };
}
function normalize(v:{x:number,y:number,z:number}){
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x/l, y: v.y/l, z: v.z/l };
}
