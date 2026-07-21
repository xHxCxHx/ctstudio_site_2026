// src/pages/Studio/index.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import "./Studio.css";

type StudioTag =
  | "All"
  | "3D / Product"
  | "Industrial"
  | "Realtime"
  | "Direction"
  | "Motion"
  | "Branding"
  | "VR / AR";

type WorkShape =
  | "ring"
  | "cube"
  | "wave"
  | "grid"
  | "sphere"
  | "torus"
  | "plane";

type StudioWork = {
  title: string;
  tag: Exclude<StudioTag, "All">;
  year: string;
  desc: string;
  skills: string[];
  color: number;
  color2: number;
  shape: WorkShape;
  href: string;
};

type MagicTextProps = {
  text: string;
  className?: string;
};

type MagicWordProps = {
  word: string;
  opacity: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function MagicWord({ word, opacity }: MagicWordProps) {
  return (
    <span className="studio-magic-word">
      <span className="studio-magic-word__ghost" aria-hidden="true">
        {word}
      </span>
      <span
        className="studio-magic-word__solid"
        style={{
          opacity,
          transform: `translateY(${(1 - opacity) * 8}px)`,
        }}
      >
        {word}
      </span>
    </span>
  );
}

function MagicText({ text, className = "" }: MagicTextProps) {
  const containerRef = useRef<HTMLParagraphElement | null>(null);
  const words = useMemo(() => text.split(" ").filter(Boolean), [text]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let frameId = 0;

    // راهنمای تنظیم افکت:
    // مشابه نمونه motion/react، هر کلمه با اسکرول روشن می‌شود.
    // شروع/پایان را کمی بازتر گذاشتم تا افکت کاملاً دیده شود، نه اینکه یک‌باره تمام شود.
    const updateProgress = () => {
      const rect = element.getBoundingClientRect();
      const start = window.innerHeight * 0.84;
      const end = window.innerHeight * 0.18;
      const nextProgress = clamp01(
        (start - rect.top) / Math.max(1, start - end),
      );
      setProgress(nextProgress);
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <p ref={containerRef} className={`studio-magic-text ${className}`.trim()}>
      {words.map((word, index) => {
        const start = index / words.length;
        const end = start + 1 / words.length;
        const wordOpacity = clamp01(
          (progress - start) / Math.max(0.001, end - start),
        );

        return (
          <MagicWord
            key={`${word}-${index}`}
            word={word}
            opacity={wordOpacity}
          />
        );
      })}
    </p>
  );
}

type MeshEntry = {
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  wire: THREE.LineSegments<THREE.WireframeGeometry, THREE.LineBasicMaterial>;
  glow: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  work: StudioWork;
  index: number;
};

// راهنمای تغییر محتوا: هر آیتم این لیست یک پروژه داخل اوربیت سه‌بعدی است.
// title/tag/year/desc/skills را برای متن‌ها عوض کن؛ color/color2 رنگ‌های اصلی هر آبجکت هستند؛ href لینک Case Study است.
const WORKS: StudioWork[] = [
  {
    title: "Oleocon Industrial Product",
    tag: "3D / Product",
    year: "2026",
    desc: "Interactive product storytelling for an industrial component: cinematic material look, technical breakdown logic, realtime inspection, and case-study flow.",
    skills: ["3D Direction", "Realtime", "Product CGI", "WebGL"],
    color: 0x1f5eff,
    color2: 0xff2f2f,
    shape: "ring",
    href: "/work/oleocon",
  },
  {
    title: "CIP Visual Campaign",
    tag: "Industrial",
    year: "2026",
    desc: "A clean industrial visual system for manufacturing communication: product posters, web presentation, motion direction, and rollout assets.",
    skills: ["Industrial", "Art Direction", "Campaign", "CGI"],
    color: 0xff2f2f,
    color2: 0x1f5eff,
    shape: "cube",
    href: "/work",
  },
  {
    title: "Realtime Product Viewer",
    tag: "Realtime",
    year: "2026",
    desc: "Browser-based model viewer logic with centered pivot rotation, background switching, wireframe mode, annotations, and CTS snapshot watermarking.",
    skills: ["Three.js", "Interaction", "Model Viewer", "UX"],
    color: 0x111111,
    color2: 0x1f5eff,
    shape: "torus",
    href: "/work",
  },
  {
    title: "Virtual Production Set",
    tag: "Direction",
    year: "2026",
    desc: "A cinematic production workflow combining set design, 3D planning, lighting logic, camera language, and final brand-facing presentation.",
    skills: ["Direction", "Lighting", "Camera", "Story"],
    color: 0x7c3aed,
    color2: 0xff2f2f,
    shape: "sphere",
    href: "/work",
  },
  {
    title: "Engineering Explainer System",
    tag: "Motion",
    year: "2026",
    desc: "A visual explanation system for complex engineering ideas: simplified motion, clean labels, product-focused timing, and educational clarity.",
    skills: ["Motion", "Explainer", "Design", "Editing"],
    color: 0x00a86b,
    color2: 0xc8ff00,
    shape: "wave",
    href: "/work",
  },
  {
    title: "Brand Frame Language",
    tag: "Branding",
    year: "2026",
    desc: "A flexible visual language for bold brands: typography, composition rules, launch imagery, web sections, and reusable campaign structure.",
    skills: ["Brand System", "Layout", "Typography", "Web"],
    color: 0xc8ff00,
    color2: 0x111111,
    shape: "grid",
    href: "/work",
  },
  {
    title: "AR Training Prototype",
    tag: "VR / AR",
    year: "2026",
    desc: "Prototype logic for industrial training: spatial steps, part isolation, highlighted states, guided interaction, and practical simulation structure.",
    skills: ["AR", "Training", "Simulation", "UX"],
    color: 0xf97316,
    color2: 0xffd166,
    shape: "plane",
    href: "/work",
  },
];

const TAU = Math.PI * 2;

function colorToCss(value: number) {
  return `#${value.toString(16).padStart(6, "0")}`;
}

function createGeometry(shape: WorkShape): THREE.BufferGeometry {
  switch (shape) {
    case "cube":
      return new THREE.BoxGeometry(1.05, 1.05, 1.05, 2, 2, 2);
    case "ring":
      return new THREE.TorusGeometry(0.68, 0.18, 28, 72);
    case "wave":
      return new THREE.IcosahedronGeometry(0.78, 3);
    case "grid":
      return new THREE.OctahedronGeometry(0.82, 0);
    case "sphere":
      return new THREE.SphereGeometry(0.74, 36, 36);
    case "torus":
      return new THREE.TorusKnotGeometry(0.52, 0.16, 120, 18);
    case "plane":
      return new THREE.CylinderGeometry(0.74, 0.9, 0.16, 6);
    default:
      return new THREE.SphereGeometry(0.74, 36, 36);
  }
}

function StudioModalVisual({
  work,
  isOpen,
}: {
  work: StudioWork;
  isOpen: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !isOpen) return;

    let frameId = 0;
    let tick = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerY = height * 0.5;
      tick += 0.03;

      context.clearRect(0, 0, width, height);
      context.lineCap = "round";

      context.globalAlpha = 0.74;
      context.strokeStyle = colorToCss(work.color);
      context.lineWidth = 2;
      context.beginPath();
      for (let x = 0; x <= width; x += 1) {
        const y =
          centerY +
          Math.sin(x * 0.018 + tick) * 34 +
          Math.sin(x * 0.033 - tick * 1.4) * 18;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();

      context.globalAlpha = 0.36;
      context.strokeStyle = colorToCss(work.color2);
      context.lineWidth = 1.5;
      context.beginPath();
      for (let x = 0; x <= width; x += 1) {
        const y =
          centerY +
          Math.sin(x * 0.023 - tick * 0.9) * 24 +
          Math.cos(x * 0.043 + tick) * 15;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();

      const orbX =
        width * 0.5 + Math.sin(tick * 0.7) * Math.min(70, width * 0.18);
      const orbY = centerY + Math.cos(tick * 0.52) * 28;
      context.globalAlpha = 0.88;
      context.fillStyle = colorToCss(work.color);
      context.beginPath();
      context.arc(orbX, orbY, 18, 0, TAU);
      context.fill();

      context.globalAlpha = 1;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(orbX + 5, orbY - 5, 5, 0, TAU);
      context.fill();

      frameId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [isOpen, work]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

export default function Studio() {
  const shellRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const meshEntriesRef = useRef<MeshEntry[]>([]);
  const targetRotYRef = useRef(0);
  const currentRotYRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, lastX: 0 });
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCenterHidden, setIsCenterHidden] = useState(false);
  const [selectedWork, setSelectedWork] = useState<StudioWork | null>(null);

  const safeIndex = WORKS.length > 0 ? currentIndex % WORKS.length : 0;
  const currentWork = WORKS[safeIndex] ?? WORKS[0];

  useEffect(() => {
    currentIndexRef.current = safeIndex;

    const selectedOriginalIndex = WORKS.indexOf(currentWork);
    if (selectedOriginalIndex >= 0) {
      targetRotYRef.current = -(selectedOriginalIndex / WORKS.length) * TAU;
    }
  }, [currentWork, safeIndex]);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    if (!shell || !canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xebe9e2);
    scene.fog = new THREE.Fog(0xebe9e2, 7, 13);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
    camera.position.set(0, 0.1, 5.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.24);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
    keyLight.position.set(4.5, 6, 5);
    const blueLight = new THREE.DirectionalLight(0x89b5ff, 1.4);
    blueLight.position.set(-4, -1.5, 3);
    const redLight = new THREE.PointLight(0xff3b3b, 1.1, 8);
    redLight.position.set(-2.4, 1.2, 3.1);
    scene.add(ambientLight, keyLight, blueLight, redLight);

    const mainGroup = new THREE.Group();
    mainGroupRef.current = mainGroup;
    scene.add(mainGroup);

    const entries: MeshEntry[] = [];
    const spread = 3.15;

    WORKS.forEach((work, index) => {
      const angle = (index / WORKS.length) * TAU;
      const group = new THREE.Group();
      group.position.set(Math.sin(angle) * spread, 0, Math.cos(angle) * spread);

      const geometry = createGeometry(work.shape);
      const material = new THREE.MeshStandardMaterial({
        color: work.color,
        roughness: 0.2,
        metalness: 0.58,
        transparent: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const wireGeometry = new THREE.WireframeGeometry(geometry);
      const wireMaterial = new THREE.LineBasicMaterial({
        color: work.color2,
        transparent: true,
        opacity: 0.2,
      });
      const wire = new THREE.LineSegments(wireGeometry, wireMaterial);

      const glowMaterial = new THREE.MeshStandardMaterial({
        color: work.color,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.16, 20, 20),
        glowMaterial,
      );

      group.add(mesh, wire, glow);
      mainGroup.add(group);
      entries.push({ group, mesh, wire, glow, work, index });
    });

    meshEntriesRef.current = entries;

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 360;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const colorChoices = [
      new THREE.Color(0x1f5eff),
      new THREE.Color(0xff2f2f),
      new THREE.Color(0xc8ff00),
      new THREE.Color(0x111111),
    ];

    for (let index = 0; index < particleCount; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 14;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 7.5;
      particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 10;

      const color =
        colorChoices[Math.floor(Math.random() * colorChoices.length)];
      particleColors[index * 3] = color.r;
      particleColors[index * 3 + 1] = color.g;
      particleColors[index * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3),
    );
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: 0.052,
        vertexColors: true,
        transparent: true,
        opacity: 0.52,
      }),
    );
    scene.add(particles);

    const getActiveEntries = () => entries;

    const tempScale = new THREE.Vector3();
    const activeColor = new THREE.Color();
    const passiveColor = new THREE.Color();
    let frameId = 0;

    const resize = () => {
      const width = Math.max(1, shell.clientWidth);
      const height = Math.max(1, shell.clientHeight);
      camera.aspect = width / height;
      camera.fov = width < 760 ? 68 : 58;
      camera.position.z = width < 760 ? 6.9 : 5.8;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      currentRotYRef.current +=
        (targetRotYRef.current - currentRotYRef.current) * 0.056;
      mainGroup.rotation.y = currentRotYRef.current;

      particles.rotation.y = time * 0.025;
      particles.rotation.x = time * 0.012;

      const activeEntries = getActiveEntries();
      const activeEntry =
        activeEntries[currentIndexRef.current % activeEntries.length];

      entries.forEach((entry) => {
        const isInFilter = activeEntries.includes(entry);
        const isActive = isInFilter && activeEntry?.index === entry.index;
        const targetScale = isActive ? 1.22 : isInFilter ? 0.72 : 0.46;
        const targetY = isActive ? Math.sin(time * 1.38) * 0.08 : 0;

        tempScale.set(targetScale, targetScale, targetScale);
        entry.group.scale.lerp(tempScale, 0.06);
        entry.group.position.y += (targetY - entry.group.position.y) * 0.06;

        entry.mesh.rotation.y += isActive ? 0.008 : 0.003;
        entry.mesh.rotation.x += isActive ? 0.004 : 0.0018;

        activeColor.setHex(isActive ? entry.work.color : entry.work.color2);
        passiveColor.setHex(entry.work.color2);
        entry.mesh.material.color.lerp(
          isInFilter ? activeColor : passiveColor,
          0.045,
        );
        entry.mesh.material.emissive.setHex(
          isActive ? entry.work.color : 0x000000,
        );
        entry.mesh.material.emissiveIntensity = isActive ? 0.16 : 0;
        entry.mesh.material.opacity = isActive ? 1 : isInFilter ? 0.48 : 0.08;
        entry.wire.material.opacity = isActive
          ? 0.28
          : isInFilter
            ? 0.14
            : 0.04;
        entry.glow.material.opacity = isActive
          ? 0.12
          : isInFilter
            ? 0.035
            : 0.015;
      });

      camera.position.x +=
        (mouseRef.current.x * 0.42 - camera.position.x) * 0.04;
      camera.position.y +=
        (-mouseRef.current.y * 0.24 + 0.08 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(shell);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      renderer.dispose();
      particleGeometry.dispose();
      (particles.material as THREE.PointsMaterial).dispose();

      entries.forEach((entry) => {
        entry.mesh.geometry.dispose();
        entry.mesh.material.dispose();
        entry.wire.geometry.dispose();
        entry.wire.material.dispose();
        entry.glow.geometry.dispose();
        entry.glow.material.dispose();
      });

      meshEntriesRef.current = [];
      rendererRef.current = null;
      cameraRef.current = null;
      mainGroupRef.current = null;
    };
  }, []);

  const moveCursor = (clientX: number, clientY: number) => {
    const shell = shellRef.current;
    if (!shell || !cursorRef.current) return;

    const rect = shell.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const normalizedX = localX / Math.max(1, rect.width);
    const normalizedY = localY / Math.max(1, rect.height);

    mouseRef.current.x = (normalizedX - 0.5) * 2;
    mouseRef.current.y = (normalizedY - 0.5) * 2;

    cursorRef.current.style.transform = `translate3d(${localX}px, ${localY}px, 0)`;
  };

  const snapToNearestWork = () => {
    const activeEntries = meshEntriesRef.current;
    if (activeEntries.length === 0) return;

    const angle = ((-currentRotYRef.current % TAU) + TAU) % TAU;
    const nearestIndex =
      Math.round((angle / TAU) * WORKS.length) % WORKS.length;
    const nearest = activeEntries.reduce((best, entry) => {
      const bestDistance = Math.abs(best.index - nearestIndex);
      const entryDistance = Math.abs(entry.index - nearestIndex);
      return entryDistance < bestDistance ? entry : best;
    });

    const nextIndex = activeEntries.indexOf(nearest);
    setCurrentIndex(nextIndex);
    targetRotYRef.current = -(nearest.index / WORKS.length) * TAU;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    moveCursor(event.clientX, event.clientY);

    if (!dragRef.current.active) return;
    const deltaX = event.clientX - dragRef.current.lastX;
    targetRotYRef.current += deltaX * 0.008;
    dragRef.current.lastX = event.clientX;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    // فقط کلیک چپ موس برای چرخاندن مدار استفاده می‌شود.
    // روی تاچ/ترک‌پد اسکرول عمودی صفحه نباید گروگان گرفته شود.
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current.active = true;
    dragRef.current.lastX = event.clientX;
    setIsCenterHidden(true);
    cursorRingRef.current?.classList.add("is-dragging");
  };

  const endDrag = (event?: ReactPointerEvent<HTMLElement>) => {
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsCenterHidden(false);
    cursorRingRef.current?.classList.remove("is-dragging");
    snapToNearestWork();
  };

  const goToWork = (index: number) => {
    setCurrentIndex(index);
    const selected = WORKS[index];
    const originalIndex = WORKS.indexOf(selected);
    if (originalIndex >= 0)
      targetRotYRef.current = -(originalIndex / WORKS.length) * TAU;
  };

  return (
    <main className="studio-page">
      <section
        ref={shellRef}
        className="studio-showcase"
        aria-label="CTS Studio interactive work showcase"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <canvas ref={canvasRef} className="studio-showcase__canvas" />
        <div className="studio-showcase__atmosphere" aria-hidden="true" />
        <div className="studio-showcase__grain" aria-hidden="true" />

        <div ref={cursorRef} className="studio-cursor" aria-hidden="true">
          <div ref={cursorRingRef} className="studio-cursor__ring" />
          <div className="studio-cursor__dot" />
        </div>

        <div className="studio-showcase__ui">
          <div
            className={`studio-showcase__hero${isCenterHidden ? " is-hidden" : ""}`}
          >
            <p className="studio-showcase__eyebrow">
              Creative direction · 3D · realtime web
            </p>
            <h1>
              Work that <em>breaks</em>
              <br />
              the <span>frame.</span>
            </h1>
            <p className="studio-showcase__hint">
              Drag the orbit. Scroll to continue
            </p>
          </div>

          <div className="studio-showcase__info">
            <div
              className="studio-showcase__project"
              key={`${currentWork.title}-${safeIndex}`}
            >
              <p className="studio-showcase__number">
                {String(safeIndex + 1).padStart(2, "0")} /{" "}
                {String(WORKS.length).padStart(2, "0")}
              </p>
              <h2>{currentWork.title}</h2>
              <p>
                {currentWork.tag} — {currentWork.year}
              </p>
            </div>

            <button
              className="studio-showcase__open"
              type="button"
              onClick={() => setSelectedWork(currentWork)}
            >
              Open Project <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="studio-showcase__counter" aria-label="Project selector">
          {WORKS.map((work, index) => (
            <button
              className={`studio-showcase__dot${index === safeIndex ? " is-active" : ""}`}
              key={`${work.title}-${work.year}`}
              type="button"
              aria-label={`Show ${work.title}`}
              onClick={() => goToWork(index)}
            />
          ))}
        </div>

        <div
          className="studio-showcase__progress"
          style={{ width: `${((safeIndex + 1) / WORKS.length) * 100}%` }}
          aria-hidden="true"
        />
      </section>

      <section
        className="studio-statement"
        aria-label="CTS studio capability statement"
      >
        <div className="studio-statement__topline" aria-hidden="true" />

        <div className="studio-statement__header">
          <p>02 / Studio Statement</p>
          <span>
            Industrial CGI, realtime interaction, product storytelling, and web
            systems — built to make technical value easier to understand and sell.
          </span>
        </div>

        <div
          className="studio-statement__magic"
          aria-label="Scroll reveal studio statement"
        >
          <MagicText text="CTS turns heavy industrial products, mechanisms, factory processes, and technical services into visual systems people can understand without a meeting. We direct the story, build the CGI, design the realtime interaction, and connect everything into web pages, case studies, viewers, and launch assets that help sales teams explain faster, look more premium, and close harder." />
        </div>

        <div className="studio-statement__media">
          <div className="studio-statement__shader" aria-hidden="true">
            <div className="studio-statement__shader-field" />
            <span>Shader / image slot</span>
          </div>

          <p>
            Reserved clean space for the shader or image you will send next. No
            glass card, no rounded UI decoration — just a sharp Swiss grid slot.
          </p>
        </div>
      </section>

      <section className="studio-proof-section" aria-label="CTS studio page continuation">
        <div className="studio-proof-section__inner">
          <p>Studio system, not a one-screen trap</p>
          <h2>The page now continues below the WebGL hero.</h2>
          <div className="studio-proof-section__grid">
            <article>
              <span>01</span>
              <h3>Direction</h3>
              <p>We define the camera language, product hierarchy, and the story before touching the render.</p>
            </article>
            <article>
              <span>02</span>
              <h3>CGI</h3>
              <p>Industrial products get clean materials, believable lighting, and visual logic instead of decoration.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Realtime Web</h3>
              <p>Interactive pages, model viewers, shaders, and case-study systems built to sell the work faster.</p>
            </article>
          </div>
        </div>
      </section>

      {selectedWork && (
        <div
          className="studio-modal"
          role="dialog"
          aria-modal="true"
          aria-label={selectedWork.title}
        >
          <button
            className="studio-modal__backdrop"
            type="button"
            aria-label="Close project modal"
            onClick={() => setSelectedWork(null)}
          />

          <article
            className="studio-modal__card"
            style={
              {
                "--studio-modal-color": colorToCss(selectedWork.color),
                "--studio-modal-color-2": colorToCss(selectedWork.color2),
              } as CSSProperties
            }
          >
            <button
              className="studio-modal__close"
              type="button"
              aria-label="Close"
              onClick={() => setSelectedWork(null)}
            >
              ×
            </button>

            <div className="studio-modal__visual">
              <StudioModalVisual
                work={selectedWork}
                isOpen={Boolean(selectedWork)}
              />
            </div>

            <div className="studio-modal__body">
              <div className="studio-modal__meta">
                <span>{selectedWork.tag}</span>
                <span>{selectedWork.year}</span>
              </div>

              <h2>{selectedWork.title}</h2>
              <p>{selectedWork.desc}</p>

              <div className="studio-modal__skills">
                {selectedWork.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              <div className="studio-modal__actions">
                <a className="studio-modal__primary" href={selectedWork.href}>
                  Case Study ↗
                </a>
                <button
                  className="studio-modal__secondary"
                  type="button"
                  onClick={() => setSelectedWork(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
