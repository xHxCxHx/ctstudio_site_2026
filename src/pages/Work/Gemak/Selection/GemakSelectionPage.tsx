// src/pages/Work/Gemak/Selection/GemakSelectionPage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import "./GemakSelectionPage.css";

type MachineId = "pasteuriser" | "cip";

type Machine = {
  id: MachineId;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  icon: "flow" | "drop";
  accent: "blue" | "violet";
  image: string;
  href: string;
};

const MACHINES: Machine[] = [
  {
    id: "pasteuriser",
    index: "01",
    title: "Pasteurisation",
    subtitle: "System",
    description: "Advanced heat treatment with precise flow control, energy recovery and full traceability.",
    icon: "flow",
    accent: "blue",
    image: "/pages/Gemak_Page/Pasteuriser_Page/Pasteuriser_Selection.png",
    href: "/work/gemak/pasteuriser",
  },
  {
    id: "cip",
    index: "02",
    title: "CIP",
    subtitle: "System",
    description: "Fully automated cleaning in place with smart detergent management and verification.",
    icon: "drop",
    accent: "violet",
    image: "/pages/Gemak_Page/CIP_Page/CIP_Selection.png",
    href: "/work/gemak/cip",
  },
];

const ROUTE_DELAY_MS = 980;

const GEMAK_HALL_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const GEMAK_HALL_FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
  }

  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }

  float sdCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }

  float mapScene(vec3 p) {
    // Floor.
    float d = p.y + 1.02;

    // Back wall and industrial columns/beams, pushed far away.
    vec3 back = p - vec3(0.0, 0.55, -6.8);
    d = min(d, sdBox(back, vec3(8.8, 2.45, 0.045)));

    for (int i = 0; i < 7; i++) {
      float x = -6.0 + float(i) * 2.0;
      vec3 col = p - vec3(x, 0.32, -6.55);
      d = min(d, sdBox(col, vec3(0.045, 2.55, 0.06)));
    }

    for (int j = 0; j < 3; j++) {
      float y = 0.35 + float(j) * 0.82;
      vec3 beam = p - vec3(0.0, y, -6.48);
      d = min(d, sdBox(beam, vec3(8.4, 0.035, 0.055)));
    }

    // Soft distant circular technical platform. Not a hard Tron grid.
    vec3 lp = p - vec3(0.0, -0.97, -2.9);
    float ring = abs(length(lp.xz) - 3.15) - 0.018;
    d = min(d, max(ring, abs(lp.y) - 0.012));

    return d;
  }

  vec3 getRayDir(vec3 ro, vec3 lookAt, vec2 uv) {
    vec3 f = normalize(lookAt - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);
    return normalize(f + r * uv.x + u * uv.y);
  }

  vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    float d = mapScene(p);
    return normalize(vec3(
      mapScene(p + e.xyy) - d,
      mapScene(p + e.yxy) - d,
      mapScene(p + e.yyx) - d
    ));
  }

  float softShadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.05;
    for (int i = 0; i < 42; i++) {
      float h = mapScene(ro + rd * t);
      res = min(res, 7.0 * h / t);
      t += clamp(h, 0.035, 0.28);
      if (res < 0.03 || t > 8.0) break;
    }
    return clamp(res, 0.05, 1.0);
  }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    uv.x *= 1.02;

    vec3 ro = vec3(0.0, 0.58, 5.35);
    ro.x += sin(uTime * 0.18) * 0.05;
    vec3 lookAt = vec3(0.0, -0.12, -2.55);
    vec3 rd = getRayDir(ro, lookAt, uv);

    float t = 0.0;
    float glow = 0.0;
    float hit = 0.0;
    vec3 p;

    for (int i = 0; i < 96; i++) {
      p = ro + rd * t;
      float d = mapScene(p);

      // Volumetric industrial lights in space.
      float leftBeam = exp(-length((p - vec3(-3.75, 0.12, -2.9)) * vec3(0.50, 1.55, 0.42)) * 1.2);
      float rightBeam = exp(-length((p - vec3(3.75, 0.12, -2.9)) * vec3(0.50, 1.55, 0.42)) * 1.2);
      float centerBeam = exp(-length((p - vec3(0.0, 0.05, -3.4)) * vec3(0.72, 1.6, 0.50)) * 1.6);
      glow += (leftBeam + rightBeam + centerBeam * 0.7) * 0.010;

      if (d < 0.0035 * max(t, 1.0)) {
        hit = 1.0;
        break;
      }
      t += clamp(d, 0.025, 0.24);
      if (t > 15.0) break;
    }

    vec3 sky = vec3(0.010, 0.016, 0.026);
    vec3 col = sky;

    vec3 blue = vec3(0.05, 0.46, 1.0);
    vec3 violet = vec3(0.78, 0.18, 1.0);
    vec3 steel = vec3(0.45, 0.55, 0.65);

    if (hit > 0.5) {
      vec3 n = calcNormal(p);
      vec3 l1 = normalize(vec3(-4.0, 2.6, 1.4) - p);
      vec3 l2 = normalize(vec3(4.0, 2.6, 1.4) - p);
      float sh1 = softShadow(p + n * 0.01, l1);
      float sh2 = softShadow(p + n * 0.01, l2);
      float diff1 = max(dot(n, l1), 0.0) * sh1;
      float diff2 = max(dot(n, l2), 0.0) * sh2;
      float rim = pow(max(0.0, 1.0 - dot(n, -rd)), 2.8);

      // Dark industrial material, not white grid.
      vec3 mat = vec3(0.018, 0.022, 0.028);
      if (p.y < -0.94) mat = vec3(0.012, 0.016, 0.021);

      col = mat;
      col += blue * diff1 * 0.34;
      col += violet * diff2 * 0.34;
      col += steel * rim * 0.10;

      // Long soft reflections on the floor only.
      if (p.y < -0.94) {
        float leftPool = exp(-length((p.xz - vec2(-3.45, -2.65)) * vec2(0.55, 0.26)) * 1.15);
        float rightPool = exp(-length((p.xz - vec2(3.45, -2.65)) * vec2(0.55, 0.26)) * 1.15);
        float centerPool = exp(-length((p.xz - vec2(0.0, -3.3)) * vec2(0.70, 0.30)) * 2.0);
        col += blue * leftPool * 0.18;
        col += violet * rightPool * 0.18;
        col += mix(blue, violet, 0.55) * centerPool * 0.12;

        // One extremely subtle perspective line set, kept almost invisible.
        float perspective = abs(fract((p.z + 10.0) * 0.42) - 0.5);
        col += vec3(0.05, 0.08, 0.11) * smoothstep(0.018, 0.0, perspective) * 0.09;
      }
    }

    // Fog/distance fade like the reference shader.
    float fog = 1.0 - exp(-t * 0.12);
    col = mix(col, sky, fog * 0.82);

    col += blue * glow * 0.75;
    col += violet * glow * 0.72;

    // Ambient dust, very subtle.
    float dust = hash(floor((gl_FragCoord.xy + vec2(uTime * 8.0, -uTime * 3.0)) / 5.0));
    col += vec3(0.50, 0.62, 0.75) * step(0.9955, dust) * 0.06;

    // Lens vignette and contrast.
    float vignette = smoothstep(1.22, 0.20, length(uv));
    col *= vignette;
    col = pow(col, vec3(0.4545));

    gl_FragColor = vec4(col, 1.0);
  }
`;

function GemakRaymarchHall() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={GEMAK_HALL_VERTEX_SHADER}
        fragmentShader={GEMAK_HALL_FRAGMENT_SHADER}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function GemakWebGLStage() {
  return (
    <div className="gemak-webgl-stage" aria-hidden="true">
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], zoom: 1, near: 0.1, far: 10 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <GemakRaymarchHall />
      </Canvas>
    </div>
  );
}

function MachineIcon({ type }: { type: Machine["icon"] }) {
  if (type === "drop") {
    return (
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <path d="M21 4C15.5 12.2 11 17.9 11 25.2C11 32.1 15.5 37 21 37C26.5 37 31 32.1 31 25.2C31 17.9 26.5 12.2 21 4Z" />
        <path d="M17.2 27.8C18 30.2 19.7 31.4 22.3 31.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 50 36" aria-hidden="true">
      <path d="M2 8C8 3 13 3 19 8C25 13 31 13 37 8C41 4.7 45 3.7 48 5" />
      <path d="M2 18C8 13 13 13 19 18C25 23 31 23 37 18C41 14.7 45 13.7 48 15" />
      <path d="M2 28C8 23 13 23 19 28C25 33 31 33 37 28C41 24.7 45 23.7 48 25" />
    </svg>
  );
}

export default function GemakSelectionPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<MachineId | null>(null);
  const [selected, setSelected] = useState<MachineId | null>(null);
  const routeTimerRef = useRef<number | null>(null);

  const activeMachine = useMemo(() => selected ?? hovered, [hovered, selected]);

  useEffect(() => {
    MACHINES.forEach((machine) => {
      const img = new Image();
      img.src = machine.image;
    });

    return () => {
      if (routeTimerRef.current) window.clearTimeout(routeTimerRef.current);
    };
  }, []);

  const handleSelect = (machine: Machine) => {
    if (selected) return;
    setSelected(machine.id);
    setHovered(machine.id);

    routeTimerRef.current = window.setTimeout(() => {
      navigate(machine.href);
    }, ROUTE_DELAY_MS);
  };

  return (
    <main
      className={`gemak-selection ${activeMachine ? `has-active has-${activeMachine}` : ""} ${
        selected ? `is-transitioning selected-${selected}` : ""
      }`}
    >
      <GemakWebGLStage />
      <div className="gemak-selection-bg" aria-hidden="true" />
      <div className="gemak-selection-atmosphere" aria-hidden="true" />
      <div className="gemak-selection-blueprint gemak-selection-blueprint-left" aria-hidden="true" />
      <div className="gemak-selection-blueprint gemak-selection-blueprint-right" aria-hidden="true" />
      <div className="gemak-selection-floor" aria-hidden="true" />
      <div className="gemak-selection-center-line" aria-hidden="true" />
      <div className="gemak-selection-sweep" aria-hidden="true" />

      <section className="gemak-selection-stage" aria-label="Choose a Gemak industrial system">
        <div className="gemak-selection-brand">
          <span>OUR WORK WITH</span>
          <img src="/pages/Gemak_Page/Gemak Logo.png" alt="Gemak Industrial Systems" draggable={false} />
        </div>

        <div className="gemak-selection-title" aria-hidden="true">
          <span>Complex systems. Clearly understood.</span>
          <h1>
            Two machines.
            <br />
            <strong>Two masterpieces.</strong>
          </h1>
          <p>
            Reverse-engineered. 3D modelled.
            <br />
            Technically understood.
            <br />
            Visually explained.
          </p>
          <em>Engineered for clarity.</em>
        </div>

        <div className="gemak-selection-machine-layer">
          {MACHINES.map((machine) => {
            const isActive = activeMachine === machine.id;
            const isMuted = Boolean(activeMachine) && !isActive;

            return (
              <button
                key={machine.id}
                type="button"
                className={`gemak-machine gemak-machine-${machine.id} gemak-machine-${machine.accent} ${
                  isActive ? "is-active" : ""
                } ${isMuted ? "is-muted" : ""} ${selected === machine.id ? "is-selected" : ""}`}
                onMouseEnter={() => {
                  if (!selected) setHovered(machine.id);
                }}
                onMouseLeave={() => {
                  if (!selected) setHovered(null);
                }}
                onFocus={() => {
                  if (!selected) setHovered(machine.id);
                }}
                onBlur={() => {
                  if (!selected) setHovered(null);
                }}
                onClick={() => handleSelect(machine)}
                aria-label={`Explore ${machine.title} ${machine.subtitle}`}
              >
                <span className="gemak-machine-energy" aria-hidden="true" />
                <span className="gemak-machine-plinth" aria-hidden="true" />
                <span className="gemak-machine-number" aria-hidden="true">
                  {machine.index}
                </span>

                <span className="gemak-machine-image-wrap">
                  <img className="gemak-machine-reflection" src={machine.image} alt="" draggable={false} aria-hidden="true" />
                  <img className="gemak-machine-image" src={machine.image} alt="" draggable={false} />
                </span>

                <span className="gemak-machine-copy">
                  <strong>{machine.title}</strong>
                  <b>{machine.subtitle}</b>
                  <i />
                  <MachineIcon type={machine.icon} />
                  <small>{machine.description}</small>
                  <em>Explore system <span>→</span></em>
                </span>
              </button>
            );
          })}
        </div>

        <div className="gemak-selection-mid-control" aria-hidden="true">
          <span className="gemak-mid-arrow">‹</span>
          <strong>Choose your<br />system</strong>
          <span className="gemak-mid-arrow">›</span>
        </div>

        <div className="gemak-selection-scroll" aria-hidden="true">
          <span />
          <small>{selected ? "Loading selected system" : "Scroll to explore"}</small>
        </div>

        <div className="gemak-selection-diagram gemak-selection-diagram-left" aria-hidden="true">
          <span>View diagram</span>
        </div>
        <div className="gemak-selection-diagram gemak-selection-diagram-right" aria-hidden="true">
          <span>View diagram</span>
        </div>

        <div className="gemak-selection-proofbar" aria-hidden="true">
          <div>
            <i className="proof-icon proof-cube" />
            <strong>100%</strong>
            <span>Accurate 3D model</span>
            <small>Built to real-world scale</small>
          </div>
          <div>
            <i className="proof-icon proof-play" />
            <strong>Zero</strong>
            <span>Review video</span>
            <small>Accepted without a single change</small>
          </div>
          <div>
            <i className="proof-icon proof-gear" />
            <strong>Thousands</strong>
            <span>Of components</span>
            <small>Understood and connected</small>
          </div>
          <div>
            <i className="proof-icon proof-globe" />
            <strong>Used</strong>
            <span>Worldwide</span>
            <small>On their website, sales and internal training</small>
          </div>
          <div>
            <i className="proof-icon proof-target" />
            <strong>One goal</strong>
            <span>Make complexity understandable</span>
            <small>That’s what we do</small>
          </div>
        </div>
      </section>
    </main>
  );
}
