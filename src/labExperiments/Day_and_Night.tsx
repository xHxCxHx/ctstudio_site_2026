// src/labExperiments/Day_and_Night.tsx
import { useEffect, useRef } from "react";
import type React from "react";
import * as THREE from "three";
import earthMinimalTexture from "./assets/textures/earth_texture/Earth_Minimal.jpg";

/* --------- مقادیر قابل تنظیم پوزیشن/اسکیل --------- */
const TWEAKS = {
  topEarthOffsetX: 0,   // ← جابه‌جایی افقی کره‌ی بزرگ بالا (px)
  topEarthOffsetY: 80,  // ← جابه‌جایی عمودی کره‌ی بزرگ بالا (px)
  topEarthScale: 1.3,   // ← مقیاس کره‌ی بزرگ بالا

  orbit2dOffsetX: 0,    // ← جابه‌جایی افقی مدار افقی ۲بعدی (px)
  orbit2dOffsetY: 60,   // ← جابه‌جایی عمودی مدار افقی ۲بعدی (px)
  orbit2dScale: 1.5,    // ← اسکیل مدار افقی

  orbit3dOffsetX: 150,  // ← جابه‌جایی افقی مدار ۳بعدی (px)
  orbit3dOffsetY: 0,    // ← جابه‌جایی عمودی مدار ۳بعدی (px)

  textBoxOffsetX: 100,  // ← جابه‌جایی افقی باکس متن سمت چپ (px)
  textBoxOffsetY: 0,    // ← فاین‌تیون عمودی باکس متن سمت چپ (px)

  orbitLabelsGap: 90,   // ← فاصله بین سه ستون Winter/Equinox/Summer (px)
};

/* --------- رنگ خطوط (فقط در کد عوض کن) --------- */
const LINE_COLORS = {
  dayBright: "#ffffff",
  dayDim: "rgba(255, 165, 80, 0.7)",
  eqBright: "#e41266ff",
  eqDim: "rgba(255, 183, 0, 0.8)",
};

const CSS = (c: typeof LINE_COLORS, earthTextureUrl: string) => `
.image11-root {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-family: "Times New Roman", serif;
  font-weight: 100;
  font-style: italic;
  background: radial-gradient(circle at 10% -10%, #500265ff 0%, #050b22 40%, #22021dff 80%);
  min-height: 100vh;
  padding: 0 40px 40px;
  box-sizing: border-box;
}

/* پیش‌فرض: هیچ‌چیز انتخاب‌پذیر نباشد */
.image11-root * {
  user-select: none;
}

/* فقط باکس متن و محتوایش انتخاب‌پذیر باشد */
.image11-text-panel,
.image11-text-panel * {
  user-select: text;
}

/* ---------- لایوت اصلی ---------- */
.image11-layout {
  min-height: 100vh;
  display: flex;
  gap: 40px;
}

/* ستون چپ: باکس متن، همیشه وسط Y */
.image11-text-panel-wrapper {
  flex: 0 0 25%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* ★ باکس متن */
.image11-text-panel {
  width: 100%;
  max-width: 600px;
  background: rgba(66, 57, 63, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(102px);
  border-radius: 4px;
  padding: 22px 26px;
  box-shadow: 0 18px 45px rgba(2, 2, 2, 0.7);
  font-family: "Gotham-Book", "Gotham", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-style: normal;
  font-size: 20px;
  line-height: 1.6;
  color: #ffffff;
}

.image11-text-panel h2 {
  margin: 0 0 12px;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.image11-text-panel p {
  margin: 8px 0;
  font-weight: 400;
}

/* ستون راست: بالا کره، پایین دو مدار */
.image11-visual-column {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
}

.image11-top {
  flex: 1 0 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 20px;
}

.image11-bottom {
  flex: 1 0 50%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding-top: 20px;
  box-sizing: border-box;
}

/* ---------- بلوک زمین بالا ---------- */
.image11-root .earth-container {
  position: relative;
  height: 380px;
  width: 380px;
  background:
    linear-gradient(
      90deg,
      #020510 190px,
      #0000 190px
    ),
    linear-gradient(#0000 0, #020818 0.5%, #020818 98.5%, #0000 100%);
  cursor: pointer;
}

.image11-root .earth-container .globe {
  position: absolute;
  width: 380px;
  height: 100%;
  border-radius: 100%;
  background:
    url("${earthTextureUrl}") 0 0 / 250% 100%,
    radial-gradient(circle at 30% 30%, #5fd4ff 0%, #3560b5 40%, #020b33 80%);
  /* تکسچر و تیلت هر دو به زاویه لینک هستند */
  background-position: var(--earthBgX, 0px) 0;
  transform: rotate(calc(-23.4deg * var(--ang)));
  box-shadow: 0 0 35px rgba(80, 170, 255, 0.9);
}

.image11-root .earth-container .globe::before,
.image11-root .earth-container .globe::after {
  content: "";
  position: absolute;
  inset: 100% 50% -80px;
  width: 1px;
  border-left: 2px solid #fff8;
}

.image11-root .earth-container .globe::after {
  inset: -40px 50% 100%;
}

/* ---------- خطوط روز (بالا/پایین) – DOTTED ---------- */
.image11-root .earth-container .day-label {
  position: absolute;
  left: -280px;
  z-index: 10;
  width: 260px;
  text-align: right;
  color: #fff;
  pointer-events: none;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 14px;
}

.image11-root .earth-container .day-label::after {
  content: "";
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  width: 260px;
  border-bottom: 2px dotted ${c.dayBright};
}

.image11-root .earth-container .day-label.north-label {
  top: 8%;
}

.image11-root .earth-container .day-label.south-label {
  bottom: 10%;
}

/* ---------- خط استوا + متن ---------- */
.image11-root .earth-container .equator-label {
  position: absolute;
  left: -320px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 300px;
  text-align: right;
  color: #fff;
  pointer-events: none;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 14px;
}

.image11-root .earth-container .equator-label::after {
  content: "";
  position: absolute;
  left: calc(100% + 16px);
  top: 50%;
  transform: translateY(-50%);
  width: 320px;
  border-bottom: 2px dotted ${c.eqBright};
}

/* ---------- سایه نیم‌کره و لیبل زاویه/ماه ---------- */
.image11-root .earth-container .shadow {
  position: absolute;
  width: 380px;
  height: 100%;
  z-index: 20;
  pointer-events: none;
}

/* سایه نرم‌تر + ادامه‌دار روی سمت شب، نقشه هنوز دیده می‌شود */
.image11-root .earth-container .shadow::before {
  content: "";
  position: absolute;
  inset: -200px 0;
  clip-path: circle(191px);
  box-shadow: inset -180px 0 20px 0 #000d;
  border-radius: 100%;
}

.image11-root .earth-container .shadow::after {
  content: "";
  position: absolute;
  inset: 100% 50% -80px;
  width: 1px;
  border-left: 2px solid #fff8;
}

.image11-root .earth-container .shadow .label {
  position: absolute;
  height: 16px;
  width: fit-content;
  bottom: -55px;
  left: calc(50% + 8px);
  color: #fff;
  font-family: Helvetica, Arial, sans-serif;
}

/* دایره‌ی نقطه‌چین تیلت، مثل نسخه‌ی SCSS قدیمی */
.image11-root .earth-container .shadow .label::before {
  content: "";
  position: absolute;
  bottom: 22px;
  left: -238px;      /* 380 * -0.625 */
  padding: 228px;    /* 380 * 0.6 */
  border: 2px dotted #fff8;
  border-radius: 100%;
  clip-path: circle(
    calc(46.8px * max(var(--ang), -1 * var(--ang)))
    at
    calc(50% + (46.8px * var(--ang))) 100%
  );
}

/* ---------- ردیف پایین: دو مدار ---------- */
.image11-root .orbits-row {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 60px;
}

.image11-root .orbit2d-wrapper,
.image11-root .orbit3d-wrapper {
  flex: 1 1 0;
  cursor: pointer;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* ---------- مدار افقی ۲D ---------- */
@keyframes image11-earthBg {
  0%    { background: linear-gradient(90deg, #6dd6ff 50%, #2e4fac 50%);  }
  49.9% { background: linear-gradient(90deg, #6dd6ff 50%, #2e4fac 50%);  }
  50%   { background: linear-gradient(-90deg, #6dd6ff 50%, #2e4fac 50%); }
  100%  { background: linear-gradient(-90deg, #6dd6ff 50%, #2e4fac 50%); }
}

@keyframes image11-earthFg {
  0%   { transform: scale(1, 1);  background: #6dd6ff; }
  24.9%{ transform: scale(0, 1);  background: #6dd6ff; }
  25%  { transform: scale(0, 1);  background: #2e4fac; }
  49.9%{ transform: scale(-1, 1); background: #2e4fac; }
  50%  { transform: scale(1, 1);  background: #2e4fac; }
  74.9%{ transform: scale(0, 1);  background: #2e4fac; }
  75%  { transform: scale(0, 1);  background: #6dd6ff; }
  100% { transform: scale(-1, 1); background: #6dd6ff; }
}

.image11-root .orbit-container {
  position: relative;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}

.image11-root .orbit-container::before,
.image11-root .orbit-container::after {
  content: "";
  position: absolute;
  inset: 37px 0 auto 0;
  height: 8px;
  border-radius: 100%;
  border: 2px dashed rgba(255,255,255,0.55);
}

.image11-root .orbit-container::before {
  border-bottom-width: 0;
  z-index: -10;
}

.image11-root .orbit-container::after {
  border-top-width: 0;
  z-index: 5;
}

.image11-root .orbit-container .earth {
  position: absolute;
  top: 10px;
  left: calc((var(--ang) * 50%) + 50% - 30px);
  z-index: var(--ang-z);
  border-radius: 100%;
  padding: 30px;
  animation: image11-earthBg linear infinite;
  animation-duration: 1s;
  animation-delay: calc((1s * var(--ang-full)) - 1.75s);
  animation-play-state: paused;
  pointer-events: none;
  box-shadow: 0 0 22px rgba(110, 190, 255, 0.9);
}

.image11-root .orbit-container .earth::before {
  content: "";
  position: absolute;
  inset: -15px 50%;
  width: 1px;
  transform: rotate(-23.4deg);
  border-left: 1px solid #fff8;
  z-index: 20;
}

.image11-root .orbit-container .earth::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: image11-earthFg linear infinite;
  animation-duration: inherit;
  animation-delay: inherit;
  animation-play-state: inherit;
}

/* ---------- خورشید ۲D (نمای افقی) ---------- */
.image11-root .orbit-container .sun {
  position: absolute;
  top: 0;
  z-index: 5;
  left: calc(50% - 40px);
  border-radius: 100%;
  background:
    radial-gradient(circle at 30% 30%, #fffdf1 0%, #ffe8a3 35%, #f4b53b 70%, #b96f1c 100%);
  padding: 40px;
  pointer-events: none;
  box-shadow:
    0 0 40px rgba(255, 220, 130, 0.95),
    0 0 80px rgba(255, 200, 90, 0.8);
}

/* ---------- خورشید نمای عمودی: همان استایل، وسط مدار ---------- */
.image11-root .sun-vertical {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 100%;
  background:
    radial-gradient(circle at 30% 30%, #fffdf1 0%, #ffe8a3 35%, #f4b53b 70%, #b96f1c 100%);
  pointer-events: none;
  box-shadow:
    0 0 40px rgba(255, 220, 130, 0.95),
    0 0 80px rgba(255, 200, 90, 0.8);
  z-index: 20;
}

/* ---------- لیبل‌های مدار ۲D ---------- */
.image11-root .orbit-container .labels {
  padding: 120px 0 20px;
  display: flex;
  justify-content: center;
  gap: var(--orbitLabelGap, 60px); /* فاصله بین سه ستون */
}

.image11-root .orbit-container .labels .label-group {
  display: flex;
  flex-direction: column;
  align-items: center; /* تیتر و تاریخ دقیقاً زیر هم */
}

.image11-root .orbit-container .labels .label-title {
  display: inline-block;
  font-style: normal;
  border-bottom: 1px solid #fff8;
  padding: 0 3px;
  height: 16px;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 13px;
}

.image11-root .orbit-container .labels .label-date {
  padding-top: 6px;
  font-size: 12px;
  font-family: Helvetica, Arial, sans-serif;
  font-style: italic;
}

/* ---------- کانواس ۳D (نمای عمودی) ---------- */
.image11-root .orbit3d-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
`;

const MAX_ANG = 23.4;
const MONTHS = [
  "December",
  "January",
  "Feburary",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
];

type DragState = {
  width: number;
  startX: number;
  startFrame: number;
};

const Day_and_Night = () => {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const northLabelRef = useRef<HTMLDivElement | null>(null);
  const southLabelRef = useRef<HTMLDivElement | null>(null);

  const isDragRef = useRef(false);
  const frameRef = useRef(0);
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  const setAngleRef = useRef<((v: number) => void) | null>(null);

  const dragStateRef = useRef<DragState | null>(null);

  const orbit3DRef = useRef<HTMLDivElement | null>(null);

  /* --------- منطق زاویه مشترک + آپدیت لیبل‌ها --------- */
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleElRef.current = styleEl;
    document.head.prepend(styleEl);

    const easeAng = (angValue: number) => {
      let eased = (angValue > 0.5 ? 1 - angValue : angValue) * 2;
      eased = -0.5 * (Math.cos(Math.PI * eased) - 1);
      return 2 * eased - 1;
    };

    const setAngle = (angValue: number) => {
      const ang = easeAng(angValue);

      if (styleElRef.current) {
        styleElRef.current.innerText = `
          .image11-root {
            --ang: ${ang};
            --ang-full: ${angValue};
            --ang-z: ${10 - Math.floor(angValue * 10)};
            --earthBgX: ${angValue * 950}px;
          }
        `;
      }

      if (labelRef.current && northLabelRef.current && southLabelRef.current) {
        const labelEl = labelRef.current;
        const northEl = northLabelRef.current;
        const southEl = southLabelRef.current;

        const rawDeg = Math.abs(ang * MAX_ANG);
        const degValue = rawDeg < 0.05 ? "0.0" : rawDeg.toFixed(1);
        const monthIndex = Math.floor(((angValue * 12) + 0.5) % 12);
        const month = MONTHS[monthIndex];

        labelEl.innerHTML = `${degValue}&deg;<br/>${month}`;

        const hrs = Math.round(7 + 5 * (1 + ang));
        const hrsOpposite = 24 - hrs;

        northEl.innerText = `Day: ${hrs} hrs`;
        southEl.innerText = `Day: ${hrsOpposite} hrs`;
      }
    };

         setAngleRef.current = setAngle;

        // شروع از 0.25 چرخه = نقطه‌ای که ang = 0 → 0 درجه (اولین اعتدال، March)
        frameRef.current = 62.5;    // 0.25 * 250
        setAngle(0.25);


    const interval = window.setInterval(() => {
      if (!isDragRef.current) {
        frameRef.current = (frameRef.current + 1) % 250;
        setAngle(frameRef.current / 250);
      }
    }, 40);

    return () => {
      window.clearInterval(interval);
      if (styleElRef.current && styleElRef.current.parentNode) {
        styleElRef.current.parentNode.removeChild(styleElRef.current);
      }
    };
  }, []);

  /* --------- درگ سراسری با delta (بدون جامپ) ---------- */
  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      if (!isDragRef.current || !dragStateRef.current || !setAngleRef.current) return;

      const { width, startX, startFrame } = dragStateRef.current;
      if (width <= 0) return;

      const dx = ev.clientX - startX;

      // جهت صحیح: موس به راست → سال جلو می‌رود (در مدار)
      const deltaFrames = -(-dx / width) * 250;

      let newFrame = startFrame + deltaFrames;

      // wrap به ۰–۲۵۰
      newFrame = ((newFrame % 250) + 250) % 250;

      frameRef.current = newFrame;
      setAngleRef.current(newFrame / 250);
    };

    const onUp = () => {
      isDragRef.current = false;
      dragStateRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* --------- صحنه ۳D: مدار عمودی + زمین با سایه پشت ---------- */
  useEffect(() => {
    const container = orbit3DRef.current;
    if (!container) return;

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 320;
    const orbitRadius = 140;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.OrthographicCamera(
      -200,
      200,
      200,
      -200,
      0.1,
      1000
    );
    camera.position.set(0, 0, 260);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const pivot = new THREE.Group();
    pivot.rotation.x = -Math.PI * 0.5; // نمای عمودی مدار (from top)
    scene.add(pivot);

    // مدار
    const segments = 256;
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      orbitPoints.push(
        new THREE.Vector3(
          Math.cos(t) * orbitRadius,
          0,
          Math.sin(t) * orbitRadius
        )
      );
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineDashedMaterial({
      color: new THREE.Color("#ffffff"),
      dashSize: 10,
      gapSize: 10,
      linewidth: 1,
    });
    const orbit = new THREE.LineLoop(orbitGeo, orbitMat);
    orbit.computeLineDistances();
    pivot.add(orbit);

    // زمین با شیدر روز/شب
    const earthGeo = new THREE.SphereGeometry(16, 64, 64);
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uDayColor: { value: new THREE.Color("#6dd6ff") },
        uNightColor: { value: new THREE.Color("#020518") },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        uniform vec3 uDayColor;
        uniform vec3 uNightColor;

        void main() {
          vec3 N = normalize(vNormal);

          vec3 lightPos = vec3(0.0, 0.0, 0.0);
          vec3 L = normalize(lightPos - vWorldPos);

          float ndl = dot(N, L);

          float dayFactor = smoothstep(-0.1, 0.2, ndl);
          vec3 col = mix(uNightColor, uDayColor, dayFactor);

          float rim = 1.0 - abs(ndl);
          rim = smoothstep(0.0, 0.6, rim);
          col += vec3(0.15, 0.25, 0.5) * rim * 0.7;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    pivot.add(earth);

    // ستون سایه پشت زمین
    const shadowLength = orbitRadius * 3;
    const earthShadowGeo = new THREE.PlaneGeometry(shadowLength, 60);
    const earthShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.85,
    });
    const earthShadow = new THREE.Mesh(earthShadowGeo, earthShadowMat);
    pivot.add(earthShadow);

    let animId: number;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      const angValue = frameRef.current / 250;
      const theta = angValue * Math.PI * 2;

      const ex = -Math.cos(theta) * orbitRadius;
      const ez = Math.sin(theta) * orbitRadius;

      earth.position.set(ex, 0, ez);
      earth.rotation.z = THREE.MathUtils.degToRad(-23.4);

      const dirToSun = new THREE.Vector3(-ex, 0, -ez).normalize();
      const dirAwayFromSun = dirToSun.clone().multiplyScalar(-1);

      earthShadow.position
        .copy(earth.position)
        .add(dirAwayFromSun.clone().multiplyScalar(shadowLength * 0.5));

      earthShadow.rotation.set(0, 0, 0);
      earthShadow.rotateY(Math.PI / 2);
      const angleInPlane = Math.atan2(dirAwayFromSun.z, dirAwayFromSun.x);
      earthShadow.rotation.z = -angleInPlane;

      renderer.render(scene, camera);
    };

    renderLoop();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      earthShadowGeo.dispose();
      earthShadowMat.dispose();
    };
  }, []);

  /* --------- شروع درگ روی هرکدام از سه بلوک (delta-based) ---------- */
  const startDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width || 1;

    dragStateRef.current = {
      width,
      startX: e.clientX,
      startFrame: frameRef.current,
    };
    isDragRef.current = true;
  };

  const renderOrbitHorizontal = () => (
    <div className="orbit-container">
      <div className="sun"></div>
      <div className="earth"></div>
      <div
        className="labels"
        style={
          {
            "--orbitLabelGap": `${TWEAKS.orbitLabelsGap}px`,
          } as React.CSSProperties
        }
      >
        <div className="label-group">
          <div className="label-title">Winter Solstice</div>
          <div className="label-date">
            Dec 21<small>st</small>
          </div>
        </div>
        <div className="label-group">
          <div className="label-title">Equinoxes</div>
          <div className="label-date">
            Mar 20<small>th</small>
            <br />
            Sep 23<small>rd</small>
          </div>
        </div>
        <div className="label-group">
          <div className="label-title">Summer Solstice</div>
          <div className="label-date">
            Jun 21<small>st</small>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="image11-root">
      <style>{CSS(LINE_COLORS, earthMinimalTexture)}</style>

      <div className="image11-layout">
        {/* ستون چپ: متن اصلی */}
        <div
          className="image11-text-panel-wrapper"
          style={{
            transform: `translate(${TWEAKS.textBoxOffsetX}px, ${TWEAKS.textBoxOffsetY}px)`,
          }}
        >
          <div className="image11-text-panel">
            <h2>Daylight Cycles of Earth</h2>
            <p>
              Earth’s rotation on its axis is the primary reason we experience
              day and night. The planet completes one full rotation every 24
              hours, causing different regions to face the Sun or turn away from
              it. When a location is facing the Sun, it receives sunlight and
              experiences daytime; when it rotates into the shadowed side, it
              enters nighttime.
            </p>
            <p>
              Earth’s axis is tilted about 23.5 degrees, and this tilt makes the
              daylight cycle more complex. Because of the tilt, different
              latitudes receive different amounts of sunlight throughout the
              year. This is why day length changes and why seasons exist. The
              hemisphere tilted toward the Sun experiences longer days and
              shorter nights, while the opposite hemisphere gets shorter days
              and longer nights.
            </p>
            <p>
              At higher latitudes, the variation becomes extreme. Near the
              poles, there are times of the year when the Sun never sets (polar
              day) and times when it never rises (polar night). In contrast,
              regions near the equator have the most stable daylight cycle, with
              nearly equal day and night lengths year-round.
            </p>
            <p>
              These shifts in light and darkness form one of the fundamental
              rhythms of life on Earth. They influence sleep cycles, plant
              growth, animal migration, and countless biological and
              environmental processes.
            </p>
          </div>
        </div>

        {/* ستون راست: کره بالا + مدارها پایین */}
        <div className="image11-visual-column">
          {/* کره‌ی بزرگ بالا */}
          <div className="image11-top">
            <div
              className="earth-container"
              style={{
                transform: `translate(${TWEAKS.topEarthOffsetX}px, ${TWEAKS.topEarthOffsetY}px) scale(${TWEAKS.topEarthScale})`,
                transformOrigin: "50% 50%",
              }}
              onMouseDown={startDrag}
            >
              <div className="globe">
                <div
                  id="northLabel"
                  className="day-label north-label"
                  ref={northLabelRef}
                />
                <div
                  id="southLabel"
                  className="day-label south-label"
                  ref={southLabelRef}
                />
                <div className="equator-label">Equator – Day: 12 hrs</div>
              </div>
              <div className="shadow">
                <span id="label" className="label" ref={labelRef}></span>
              </div>
            </div>
          </div>

          {/* نیمه‌ی پایین: مدار افقی + مدار ۳D */}
          <div className="image11-bottom">
            <div className="orbits-row">
              {/* نمای افقی */}
              <div
                className="orbit2d-wrapper"
                style={{
                  transform: `translate(${TWEAKS.orbit2dOffsetX}px, ${TWEAKS.orbit2dOffsetY}px) scale(${TWEAKS.orbit2dScale})`,
                  transformOrigin: "50% 50%",
                }}
                onMouseDown={startDrag}
              >
                {renderOrbitHorizontal()}
              </div>

              {/* نمای عمودی ۳D + خورشید وسط مدار */}
              <div
                className="orbit3d-wrapper"
                style={{
                  transform: `translate(${TWEAKS.orbit3dOffsetX}px, ${TWEAKS.orbit3dOffsetY}px)`,
                }}
                onMouseDown={startDrag}
              >
                <div className="sun-vertical" />
                <div ref={orbit3DRef} className="orbit3d-canvas" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Day_and_Night;
