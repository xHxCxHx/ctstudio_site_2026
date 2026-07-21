// src/pages/Work/Oleocon/OleoconPage.tsx
// OLEOCON_DIRECT_MODEL_CONTROL_V17_2026_06_01 — fixed-camera 3D world + predictable section 05 model controls
// OLEOCON_DIRECT_CONTROL_NOTE — Section 01 layout uses OleoconDS tokens; Section 05 model keeps direct controls below
import { type ChangeEvent, type CSSProperties, type FormEvent as ReactFormEvent, type MouseEvent, type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import OleoconHeader from "./OleoconHeader";
import "../../../styles/OleoconDS.css";
import "./OleoconPage.css";

type Vec3 = [number, number, number];
type ResponsiveBreakpoint = "desktop" | "laptop" | "tablet" | "mobile";

type StageScreenControl = {
  x: number; // -100 = left edge, 0 = center, 100 = right edge. Beyond that intentionally goes off-screen.
  y: number; // -100 = top edge, 0 = center, 100 = bottom edge. Beyond that intentionally goes off-screen.
  scale: number;
  planeZ?: number;
};

type StageScreenPlacement = {
  screenX: number;
  screenY: number;
  screenScale: number;
  screenPlaneZ?: number;
};

type StagePose = {
  pivotPosition: Vec3;
  pivotRotation: Vec3;
  pivotScale: number;
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  explode: number;
  explodeSpread?: number;
  explodeLayout?: "scatter" | "vertical";
  materialOpacity?: number;
  ghost: number;
  callouts: number;
  autoSpin: number;
  floatAmp: number;
  screen?: StageScreenPlacement;
};

type StageTextValues = {
  copyX?: number;
  copyY?: number;
  eyebrowX?: number;
  eyebrowY?: number;
  titleX?: number;
  titleY?: number;
  bodyX?: number;
  bodyY?: number;
  statsX?: number;
  statsY?: number;
};

type StageTextControls = StageTextValues & {
  responsive?: Partial<Record<ResponsiveBreakpoint, StageTextValues>>;
};

type ResponsiveCopyValue = string | readonly string[] | Partial<Record<ResponsiveBreakpoint, string | readonly string[]>>;

type StageDataPoint = {
  label: string;
  value: string;
};

type StageConfig = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  side: "left" | "right" | "center";
  label: string;
  banner?: boolean;
  poster?: boolean;
  posterUrls?: string[];
  video?: boolean;
  videoUrl?: string;
  videoPosterUrl?: string;
  loopVideo?: boolean;
  loopVideoUrl?: string;
  hideCopy?: boolean;
  lines?: string[];
  data?: StageDataPoint[];
  stats?: string[];
  statLinks?: string[];
  text?: StageTextControls;
  pose: StagePose;
};

type PartLabel = {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  side: "left" | "right";
  opacity: number;
  kind?: "part" | "note";
};

type PartRecord = {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  originalPosition: THREE.Vector3;
  targetOffset: THREE.Vector3;
  verticalExplodeOffset: THREE.Vector3;
  materialList: THREE.Material[];
  volume: number;
};

/* --------------------------------------------------
   GLOBAL CONFIG / SHARED DATA
   مدل فقط یک بار در fixed Three.js world لود می‌شود.
   sectionها فقط pose، متن و offset خودشان را عوض می‌کنند.
-------------------------------------------------- */

const BANNER_URL = "/pages/oleocon_page/Section%2001/oleocon_hero.webp"; // [تغییر تصویر هیرو] همان پوستر قبلی هیرو؛ تصویر reference جدید جایگزین این نشود
const SECTION_02_POSTER_URLS = [
  "/pages/oleocon_page/Section%2002/oleocon_render01.jpg", // [پوستر اصلی سکشن ۲] مسیر دقیق داخل public؛ همین را عوض کن اگر اسم فایل تغییر کرد
  
]; // [تغییر پوستر سکشن ۲] اولین مسیر سالم نمایش داده می‌شود
const SECTION_04_VIDEO_URL = "/pages/oleocon_page/Section%2004/Oleocon.webm"; // [ویدئوی سکشن ۴] داخل public/pages/oleocon_page/Oleocon.mp4
const SECTION_04_VIDEO_POSTER_URL = "/pages/oleocon_page/Section%2004/Tumbnail.jpg"; // [thumbnail ویدئوی سکشن ۴] داخل public/pages/oleocon_page/Section%2004/Tumbnail.jpg
const SECTION_03_LOOP_VIDEO_URL = "/pages/oleocon_page/Section%2003/oleocon_loop.webm"; // [ویدئوی بک‌گراند سکشن ۳] مسیر webm موجود
const MODEL_URL = "/3d_models/oleocon/oleocon.fbx"; // [تغییر مدل] مسیر مدل اصلی FBX
const HDR_URL = "/hdri/urban_street_01_1k.hdr"; // [تغییر HDRI] مسیر نور/reflection
const TEXTURE_BASE = "/3d_models/oleocon/texture/"; // [تغییر تکسچر] پوشه bump/roughness/textures

const MODEL_TARGET_SIZE = 3.55; // [اندازه مدل] بزرگ‌تر = مدل بزرگ‌تر بعد از normalize
const REPAIR_NORMALS_FOR_WEB = true; // [اصلاح نرمال] اگر edgeها خراب شد true بماند
const CREASE_ANGLE_DEGREES = 34; // [شدت hard/smooth] زاویه شکست نرمال‌ها
const MAX_VISIBLE_LABELS = 12; // [تعداد label] تعداد calloutها در حالت exploded

const EXPLODE_WIDTH = 8.4; // [باز شدن افقی] فاصله قطعات در exploded view
const EXPLODE_DEPTH = 2.05; // [عمق قطعات] فاصله جلو/عقب در exploded view
const EXPLODE_HEIGHT = 0.9; // [ارتفاع قطعات] بالا/پایین رفتن قطعات
const SECTION_06_VERTICAL_EXPLODE_GAP = 0.52; // [سکشن ۶] فاصله پایه بین قطعات؛ بیشتر = بازتر، کمتر = فشرده‌تر
const SECTION_06_VERTICAL_EXPLODE_MIN_HALF_HEIGHT = 0.13; // [سکشن ۶] حداقل فضای بصری برای قطعات نازک مثل واشر/کون/دیسک تا داخل قطعه بعدی نروند
const SECTION_06_VERTICAL_EXPLODE_RADIAL_HALF_FACTOR = 0.16; // [سکشن ۶] قطعات پهن ولی کم‌ارتفاع فضای بیشتری می‌گیرند تا به قطعه بعدی نچسبند
const SECTION_06_VERTICAL_TOP_GROUP_START_Y = 0.82; // [سکشن ۶] هر چیزی بالاتر از این مقدار جزو گروه بالایی حساب می‌شود
const SECTION_06_VERTICAL_TOP_GROUP_PULL_DOWN = 0.86; // [سکشن ۶] کل گروه بالایی را پایین‌تر می‌آورد تا از بقیه مدل دور و جداافتاده نباشد
const SECTION_06_VERTICAL_EXPLODE_X_RELATIVE = 0; // [سکشن ۶] 0 یعنی محور تمیز و عمدی؛ بیشتر یعنی حفظ X اصلی قطعات
const SECTION_06_VERTICAL_EXPLODE_Z_RELATIVE = 0.04; // [سکشن ۶] مقدار خیلی کم عمق برای طبیعی ماندن، بدون شلوغی
const SECTION_06_BALLS_Z_EXPAND = 0.00; // [سکشن ۶] فقط گروه توپ‌های کوچک را در محور Z از مدل بیرون می‌کشد؛ بیشتر = توپ‌ها جلو/عقب‌تر
const SECTION_06_BALLS_MAX_SIZE = 0.72; // [سکشن ۶] تشخیص توپ/گروه توپ؛ اگر توپ‌ها پیدا نشدند این را بیشتر کن

const BASE_BUMP_SCALE = 0.012; // [شدت bump فلز] مقدار بیشتر = سطح زبرتر
const LOGO_BUMP_SCALE = 0.034; // [شدت bump لوگو] مقدار بیشتر = لوگو برجسته‌تر
const PATTERN_BUMP_SCALE = 0.022; // [شدت bump pattern] مقدار بیشتر = grip واضح‌تر
const OLEOCON_GLOBAL_BUMP_SCALE = 1.12; // [شدت bump جدید oleoconBump.png] طبق درخواست فعلی؛ خیلی قوی است، اگر خرد شد کمش کن
const OLEOCON_BUMP_ROTATION_DEGREES = 0; // [چرخش bump/logo] فعلاً 0؛ اگر لازم شد فقط همین را کم/زیاد کن
const OLEOCON_BUMP_INVERT_Y = true; // [برعکس کردن Y/V تکسچر bump] true یعنی محور عمودی bump برعکس می‌شود؛ اگر دوباره بد شد false کن
const OLEOCON_BUMP_OFFSET_U = 0; // [جابجایی افقی bump/logo روی UV] مثبت = حرکت در محور U، مقدارهای کوچک مثل 0.02 تست کن
const OLEOCON_BUMP_OFFSET_V = 0; // [جابجایی عمودی bump/logo روی UV] مثبت = حرکت در محور V، مقدارهای کوچک مثل 0.02 تست کن

const WEBGL_BACKGROUND = "#2b2c29"; // [رنگ پشت مدل] خاکستری صنعتی؛ با CSS noise ترکیب می‌شود
const OLEOCON_GREEN = "#76b900"; // [رنگ accent] سبز نزدیک به Nvidia
const MODEL_GLOBAL_SCREEN_LIFT_Y = 0; // [قانون جدید] هیچ lift مخفی روی مدل اضافه نمی‌شود؛ اگر مدل را بالا می‌خواهی، فقط y همان سکشن را تغییر بده

const LOCK_OLEOCON_CAMERA = true; // [قانون دوربین] true = دوربین ثابت می‌ماند و فقط مدل pose عوض می‌شود؛ این برای Oleocon درست‌تر است
const OLEOCON_LOCKED_CAMERA_POSITION: Vec3 = [3.15, 1.72, 5.15]; // [دوربین ثابت] Z کمتر = کل مدل بزرگ‌تر، X کمتر = زاویه کمتر از راست
const OLEOCON_LOCKED_CAMERA_TARGET: Vec3 = [0, 1.05, 0]; // [نقطه نگاه ثابت] Y بیشتر = دوربین بالاتر نگاه می‌کند، مدل پایین‌تر دیده می‌شود

/* --------------------------------------------------
   MODEL SCREEN CONTROL SYSTEM
   x/y system: -100 = far left/top, 0 = center, 100 = far right/bottom.
   این‌ها به screenX/screenY تبدیل می‌شوند تا روی مانیتورهای مختلف قابل فهم بمانند.
-------------------------------------------------- */
function makeScreenPlacement(control: StageScreenControl): StageScreenPlacement {
  return {
    // Exact screen-range control:
    // x: -100 -> left edge, x: 0 -> center, x: 100 -> right edge.
    // Values beyond that intentionally leave the image: x: -130 goes outside left, x: 130 outside right.
    screenX: 0.5 + control.x / 200,
    // y: -100 -> top edge, y: 0 -> center, y: 100 -> bottom edge.
    screenY: 0.5 + control.y / 200,
    screenScale: control.scale,
    screenPlaneZ: control.planeZ ?? 0,
  };
}

const OLEOCON_SCREEN_PLACEMENT_DEFAULT: Required<StageScreenPlacement> = {
  screenX: 0.5,
  screenY: 0.5,
  screenScale: 0.72,
  screenPlaneZ: 0,
};

const OLEOCON_SECTION_05_SCREEN = makeScreenPlacement({
  x: -36, // [سکشن ۵ X دسکتاپ/لپ‌تاپ] -100 چپ، 0 وسط، 100 راست
  y: -1, // [سکشن ۵ Y] -100 بالا، 0 وسط، 100 پایین
  scale: 0.92, // [سکشن ۵ SIZE] بزرگ‌تر = مدل بزرگ‌تر
  planeZ: 0,
});
const OLEOCON_SECTION_05_TABLET_X_SHIFT = 6; // [سکشن ۵ تبلت] حرکت کم مدل به راست، برحسب واحد کنترل صفحه
const OLEOCON_SECTION_05_MOBILE_X_SHIFT = 36; // [سکشن ۵ موبایل] حرکت واقعی و واضح مدل به راست، برحسب واحد کنترل صفحه

const OLEOCON_SECTION_06_MODEL_VIEW = {
  x: -20, // [سکشن ۶ / کنترل جای مدل] -100 چپ، 0 وسط، 100 راست
  y: -4, // [سکشن ۶ / کنترل ارتفاع مدل] منفی = بالاتر، مثبت = پایین‌تر
  scale: 0.6, // [سکشن ۶ / کنترل بزرگی مدل] بیشتر = بزرگ‌تر/نزدیک‌تر به دوربین
  rotationX: 11.5, // [سکشن ۶ / چرخش محور X] درجه؛ برای tilt بالا/پایین مدل
  rotationY: 65, // [سکشن ۶ / چرخش محور Y] درجه؛ برای چرخاندن مدل به چپ/راست
  rotationZ: -65, // [سکشن ۶ / چرخش محور Z] درجه؛ مثبت/منفی کن تا diagonal مدل عوض شود
};

const OLEOCON_SECTION_06_SCREEN = makeScreenPlacement({
  x: OLEOCON_SECTION_06_MODEL_VIEW.x,
  y: OLEOCON_SECTION_06_MODEL_VIEW.y,
  scale: OLEOCON_SECTION_06_MODEL_VIEW.scale,
  planeZ: 0,
});

const OLEOCON_SECTION_05_LOGO_FRONT_ROTATION_Y_DEGREES = 65; // [سکشن ۵ / آوردن نوشته به جلو] مقدار تاییدشده فعلی
const OLEOCON_SECTION_06_LOGO_FRONT_ROTATION_Y_DEGREES = 25; // [سکشن ۶ / آوردن نوشته به جلو] مستقل از سکشن ۵ و ۷
const OLEOCON_SECTION_07_LOGO_FRONT_ROTATION_Y_DEGREES = 0; // [سکشن ۷ / آوردن نوشته به جلو] مقدار اولیه بدون تغییر؛ کم/زیاد کن

const OLEOCON_SECTION_07_SCREEN = makeScreenPlacement({
  x: -10, // [سکشن ۷ X] مدل وسط صفحه، کمی مایل به چپ مثل رفرنس
  y: 0, // [سکشن ۷ Y] وسط عمودی صفحه
  scale: 0.9, // [سکشن ۷ SIZE] مدل خوابیده باید بزرگ و خوانا باشد
  planeZ: 0,
});

const OLEOCON_SECTION_08_SCREEN = makeScreenPlacement({
  x: 0,
  y: -2,
  scale: 0.78,
  planeZ: 0,
});

const OLEOCON_SECTION_09_SCREEN = makeScreenPlacement({
  x: 0,
  y: 0,
  scale: 0.74,
  planeZ: 0,
});

const SECTION_09_HERO_IMAGE_URL = "/pages/oleocon_page/Section%2009/sec9_hero_transparent.webp";
const SECTION_09_HERO_MOBILE_IMAGE_URL = "/pages/oleocon_page/Section%2009/sec9_hero_mobile.webp";

const SECTION_09_TOP_FEATURES = [
  {
    icon: "/icons/blockchain-02-stroke-rounded.svg",
    title: "ONE DIGITAL FOUNDATION",
    body: ["A single 3D model powers everything", "across your business."],
  },
  {
    icon: "/icons/blockchain-06-stroke-rounded.svg",
    title: "ALWAYS UP TO DATE",
    body: ["Ensure accuracy with real-time", "updates everywhere."],
  },
  {
    icon: "/icons/database-expand-stroke-rounded.svg",
    title: "SCALABLE FOR THE FUTURE",
    body: ["Adapt, grow, and expand without", "rebuilding from scratch."],
  },
] as const;

const SECTION_09_SHOWCASE_CARDS = [
  {
    image: "/pages/oleocon_page/Section%2009/section09_box_01.webp",
    eyebrow: "3D PRODUCT EXPERIENCE",
    title: "Interactive 3D\nmodels that engage.",
    body: "Let your customers explore products\nin real-time from any angle, any device.",
    cta: "EXPLORE EXAMPLE →",
    align: "center",
  },
  {
    image: "/pages/oleocon_page/Section%2009/section09_box_02.webp",
    eyebrow: "AR / VR EXPERIENCES",
    title: "No more paper,\nBring products to life.",
    body: "Immersive AR / VR experiences\nthat create understanding and confidence.",
    cta: "SEE AR / VR IN ACTION →",
    align: "left",
  },
  {
    image: "/pages/oleocon_page/Section%2009/section09_box_03.webp",
    eyebrow: "TRAINING & EDUCATION",
    title: "Knowledge\nthat performs.",
    body: "Perfect for technical training, assembly\ninstructions, and product understanding.",
    cta: "VIEW TRAINING DEMO",
    align: "center",
  },
  {
    image: "/pages/oleocon_page/Section%2009/section09_box_04.webp",
    eyebrow: "MARKETING & EXHIBITIONS",
    title: "Make an impact\neverywhere.",
    body: "High-impact presentations for trade\nshows, events, and product launches.",
    cta: "SEE IT IN ACTION →→",
    align: "left",
  },
] as const;

const SECTION_09_SUPPORT_ITEMS = [
  {
    icon: "cloud",
    title: "CLOUD-FIRST DIGITAL ASSETS",
    body: "Secure, centralized storage.\nmanage, edit, or update accessible 24/7",
  },
  {
    icon: "shield",
    title: "BUILT FOR RELIABILITY",
    body: "High-quality visual data and robust,\ntechnology you can depend on long term.",
  },
  {
    icon: "target",
    title: "CONSISTENT & ACCURATE",
    body: "Deliver the same accurate\nproduct information across every channel.",
  },
  {
    icon: "lock",
    title: "SECURE & CONTROLLED",
    body: "Your data is safe with role-based\naccess and enterprise-grade security.",
  },
  {
    icon: "globe",
    title: "GLOBAL & ACCESSIBLE",
    body: "Available anytime, anywhere, on any device.",
  },
] as const;

/* --------------------------------------------------
   SECTION 05 MODEL POSITION — مدل اولین reveal را از اینجا تنظیم کن
-------------------------------------------------- */
const SECTION_05_MODEL_VIEW = {
  // این‌ها direct هستند. دیگر clamp و safe range مخفی نداریم.
  // اگر عدد خیلی افراطی بدهی، مدل از کادر بیرون می‌رود؛ ولی عدد واقعاً اعمال می‌شود.
  x: -3.15, // [چپ/راست مدل سکشن ۵] منفی = چپ، مثبت = راست
  y: 9.18, // [بالا/پایین مدل سکشن ۵] بیشتر = بالاتر
  z: 0, // [عمق مدل سکشن ۵] معمولاً صفر بماند
  scale: .55, // [بزرگی مدل سکشن ۵] بیشتر = بزرگ‌تر
  rotationX: 0.18, // [چرخش مدل سکشن ۵] بالا/پایین کردن زاویه قطعه
  rotationY: 1.16, // [چرخش مدل سکشن ۵] چرخش دور خودش
  rotationZ: -0.055, // [چرخش مدل سکشن ۵] کج کردن نرم مدل
};

const SECTION_05_MODEL_DIRECT_VIEW = SECTION_05_MODEL_VIEW;

const SECTION_05_DRAG_ROTATION_SPEED_X = 0.00093; // [سکشن ۵ drag speed YAW] یک‌سوم نسخه قبل؛ کمتر = چرخش آرام‌تر دور محور Y
const SECTION_05_DRAG_ROTATION_SPEED_Y = 0.00125; // [سکشن ۵ drag speed PITCH] یک‌سوم نسخه قبل؛ کمتر = چرخش آرام‌تر روی محور X
const SECTION_05_DRAG_MAX_TILT = Number.POSITIVE_INFINITY; // [سکشن ۵ drag X] بدون محدودیت مصنوعی؛ مدل می‌تواند کامل روی محور X بچرخد
const SECTION_05_DRAG_TARGET_DAMPING = 0.085; // [سکشن ۵ drag ramp-in] کمتر = شروع حرکت نرم‌تر و کنترل‌پذیرتر
const SECTION_05_DRAG_ROTATION_LERP = 0.065; // [سکشن ۵ drag ease] کمتر = حرکت مدل نرم‌تر و کمتر عصبی
const SECTION_05_DRAG_STOP_DECAY = 0.94; // [سکشن ۵ drag ramp-stop] بیشتر = توقف نرم‌تر بعد از رها کردن موس

const DEFAULT_POSE: StagePose = {
  pivotPosition: [0, -0.06, 0],
  pivotRotation: [0.12, -0.55, 0],
  pivotScale: 1,
  cameraPosition: [3.9, 1.45, 7.2],
  cameraTarget: [0, 0.02, 0],
  explode: 0,
  explodeSpread: 1,
  materialOpacity: 1,
  ghost: 0,
  callouts: 0,
  autoSpin: 0.04,
  floatAmp: 0.055,
};

/* --------------------------------------------------
   SECTION 01
-------------------------------------------------- */

const OLEOCON_SECTION_01_HERO: StageConfig = {
  id: "banner",
  eyebrow: "OLEOCON / INDUSTRIAL PRODUCT SYSTEM",
  title: "Industrial clarity.\nEngineered to sell.",
  body:
    "A full-screen industrial hero first. The product stays cinematic, the message stays selectable, and the next sections turn the asset into a technical sales system.",
  side: "left",
  label: "Banner + Slogan",
  banner: true,
  stats: ["FBX product model", "HDRI metal reflection", "Scroll-driven stages"],
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [1.18, 0.38, 0],
    pivotRotation: [0.06, -0.75, -0.02],
    pivotScale: 0.78,
    cameraPosition: [4.4, 1.65, 8.2],
    cameraTarget: [0.18, 0.34, 0],
    autoSpin: 0.018,
    floatAmp: 0.035,
  },
};

const OLEOCON_PRODUCT_DATA: StageDataPoint[] = [
  { label: "Product", value: "Hydraulic Quick Couplings QC Series with Poppet" },
  { label: "Compatibility", value: "ISO 7241-A" },
  { label: "Valve System", value: "Ball" },
  { label: "Nut / Screw Measure", value: "BSP-NPT-M" },
  { label: "Tightness", value: "NBR leakproof sealing" },
  { label: "Operating Temperature", value: "-30°C to +110°C" },
  { label: "Coating", value: "Electroless Nickel" },
  { label: "Thermal Treatment", value: "Male Taper" },
  { label: "Material", value: "Carbon Steel" },
  { label: "Usage Fields", value: "General Industrial Areas" },
];

const OLEOCON_CATALOG_FEATURES: StageDataPoint[] = [
  { label: "Working Temperature", value: "-20°C / +100°C" },
  { label: "Operating Pressure", value: "Up to 350 bar" },
  { label: "Available Sizes", value: "From 1/4 in to 2 in" },
  { label: "Locking Mechanism", value: "Locking ball system" },
  { label: "Interchange", value: "ISO 7241-1 A" },
  { label: "Available Threads", value: "BSP - NPT" },
  { label: "Sealing Description", value: "Nitrile NBR" },
  { label: "Flow Rate", value: "Up to 753 l/min" },
  { label: "Material", value: "High strength carbon steel" },
];

const OLEOCON_MODEL_ACCURACY_NOTES = [
  "Created by professional 3D artists through hours of meticulous modeling and obsessive attention to detail, every product is rebuilt with uncompromising accuracy, down to the last screw.",
  "When CAD or measured drawings are available, dimensions can be matched precisely; when only catalog data exists, assumptions stay controlled and visible.",
  "One clean 3D model can feed catalog renders, product animations, expo screens, website explainers, and future interactive part callouts.",
];

const OLEOCON_CATALOG_APPLICATIONS = [
  "Agriculture",
  "Hydraulic industry",
  "Earth moving",
  "Vehicles",
  "Chemical industry",
  "Concrete vehicles",
  "Oil & gas",
  "Hydraulic equipment",
];

/* --------------------------------------------------
   SECTION 02 — FULL-SCREEN POSTER / ART STATEMENT
   این سکشن فقط پوستر رندر را می‌فروشد؛ data box از اینجا حذف شد.
-------------------------------------------------- */

const OLEOCON_SECTION_02_POSTER_ART: StageConfig = {
  id: "poster",
  eyebrow: "PRECISION IN EVERY FRAME",
  title: "The art of precision, rendered in steel.",
  body:
    "Every detail shown here was created as part of a complete visualization pipeline developed for Oleocon. From product rendering and technical storytelling to interactive presentations and real-time experiences, the goal was not simply to show a product, but to help communicate its value across sales, marketing and exhibition environments.",
  side: "left",
  label: "Product Visualization",
  poster: true,
  posterUrls: SECTION_02_POSTER_URLS,
  stats: ["Watch the film", "See the challenge", "Open the model"],
  statLinks: ["#video", "#problem", "#after"],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [0, 0.12, 0],
    pivotRotation: [0.08, -0.35, 0],
    pivotScale: 0.78,
    cameraPosition: [4.4, 1.65, 8.2],
    cameraTarget: [0.18, 0.24, 0],
    autoSpin: 0,
    floatAmp: 0,
  },
};

/* --------------------------------------------------
   SECTION 03 — PRODUCT PROBLEM / LOOP VIDEO
   این سکشن هنوز مدل 3D را نشان نمی‌دهد؛ فقط use-case و شک مشتری را می‌فروشد.
-------------------------------------------------- */

const OLEOCON_SECTION_03_PRODUCT_PROBLEM: StageConfig = {
  id: "problem",
  eyebrow: "WHY STATIC PRODUCT CONTENT FALLS SHORT",
  title: "Seeing is\nBelieving",
  body:
    "A hydraulic coupling is hard to sell with flat numbers alone. Buyers need to see where it is used, how it behaves, and why the mechanism matters before the technical data starts to mean anything.",
  side: "left",
  label: "The Challenge",
  loopVideo: true,
  loopVideoUrl: SECTION_03_LOOP_VIDEO_URL,
  lines: [
    "Most industrial products are still presented as static catalog pages.",
    "That hides the real value: material, sealing, connection behavior, pressure range, and use case.",
    "An explanatory 3D animation makes the part readable before a salesperson says a word.",
    "The same product model can become catalog renders, website sections, expo screens, and interactive explainers.",
    "When the buyer sees the mechanism, belief becomes easier than explanation.",
  ],
  stats: ["Explanatory animation", "3D render for catalog use", "3D models of all products for explanation"],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [0, 0.34, 0],
    pivotRotation: [0.08, 0.28, 0],
    pivotScale: 0.72,
    cameraPosition: [4.2, 1.7, 7.2],
    cameraTarget: [0, 0.32, 0],
    explode: 0,
    ghost: 0,
    callouts: 0,
    autoSpin: 0,
    floatAmp: 0,
  },
};

/* --------------------------------------------------
   SECTION 04 — AUTOPLAY VIDEO
   ویدئو از public/pages/oleocon_page/Oleocon.mp4 پخش می‌شود.
-------------------------------------------------- */

const OLEOCON_SECTION_04_VIDEO: StageConfig = {
  id: "video",
  eyebrow: "WORK / OLEOCON",
  title: "Built once.\nReused everywhere.",
  body:
    "A serious product model becomes a reusable visual asset for catalogs, product videos, trade-show screens, and interactive experiences.",
  side: "left",
  label: "Video + Catalog Data",
  video: true,
  videoUrl: SECTION_04_VIDEO_URL,
  videoPosterUrl: SECTION_04_VIDEO_POSTER_URL,
  data: OLEOCON_CATALOG_FEATURES,
  lines: OLEOCON_MODEL_ACCURACY_NOTES,
  stats: OLEOCON_CATALOG_APPLICATIONS,
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
    responsive: {
      desktop: { titleX: 0, titleY: 0, bodyX: 0, bodyY: 0 },
      laptop: { titleX: 0, titleY: 0, bodyX: 0, bodyY: 0 },
      tablet: { titleX: 0, titleY: 0, bodyX: 0, bodyY: 0 },
      mobile: { titleX: 0, titleY: 0, bodyX: 0, bodyY: 0 },
    },
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [0.1, 0.48, 0],
    pivotRotation: [0.1, 0.7, 0],
    pivotScale: 0.82,
    cameraPosition: [3.6, 1.5, 6.4],
    cameraTarget: [0, 0.4, 0],
    explode: 0,
    ghost: 0,
    callouts: 0,
    autoSpin: 0,
    floatAmp: 0,
  },
};


const SECTION_04_RESPONSIVE_COPY = {
  title: {
    desktop: ["Built once.", "Reused everywhere."],
    laptop: ["Built once.", "Reused everywhere."],
    tablet: "Built\u00A0once.\u00A0Reused\u00A0everywhere.",
    mobile: ["Built once.", "Reused", "everywhere."],
  },
  body: {
    desktop:
      "A serious product model becomes a reusable visual asset for catalogs, product videos, trade-show screens, and interactive experiences.",
    laptop:
      "A serious product model becomes a reusable visual asset for catalogs, product videos, trade-show screens, and interactive experiences.",
    tablet:
      "A serious product model becomes a reusable visual asset for catalogs, product videos, trade-show screens, and interactive experiences.",
    mobile:
      "A serious product model becomes a reusable visual asset for catalogs, product videos, trade-show screens, and interactive experiences.",
  },
  proofTitles: {
    model: {
      desktop: "One clean 3D model",
      laptop: "One clean 3D model",
      tablet: "One clean 3D model",
      mobile: "One clean 3D model",
    },
    outputs: "Many outputs",
    reuse: "Long-term value",
  },
  cardTitles: {
    renders: "Photoreal renders",
    communication: "Clear communication",
    video: "Video that sells",
  },
} as const;

/* --------------------------------------------------
   SECTION 05 — FIRST 3D MODEL REVEAL
   مدل فقط از این سکشن برای اولین بار ظاهر می‌شود.
-------------------------------------------------- */

const OLEOCON_SECTION_05_FLOATING_MODEL: StageConfig = {
  id: "model",
  eyebrow: "EVERY COMPONENT. EVERY DETAIL. ON YOUR COMMAND",
  title: "Interact\nby Design,\nUnderstand\nby Experience",
  body:
    "Experience any product like never before. Our interactive 3D ecosystem lets you explore every detail, understand every component, and see engineering come to life.",
  side: "right",
  label: "INTRODUCING SOMETHING NEW",
  stats: ["Explore without limits", "Real product clarity", "Engineering you can trust"],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [SECTION_05_MODEL_DIRECT_VIEW.x, SECTION_05_MODEL_DIRECT_VIEW.y, SECTION_05_MODEL_DIRECT_VIEW.z],
    pivotRotation: [
      SECTION_05_MODEL_DIRECT_VIEW.rotationX,
      SECTION_05_MODEL_DIRECT_VIEW.rotationY + THREE.MathUtils.degToRad(OLEOCON_SECTION_05_LOGO_FRONT_ROTATION_Y_DEGREES),
      SECTION_05_MODEL_DIRECT_VIEW.rotationZ,
    ],
    pivotScale: SECTION_05_MODEL_DIRECT_VIEW.scale,
    cameraPosition: OLEOCON_LOCKED_CAMERA_POSITION,
    cameraTarget: OLEOCON_LOCKED_CAMERA_TARGET,
    explode: 0,
    ghost: 0,
    callouts: 0,
    autoSpin: 0.05,
    floatAmp: 0.07,
    screen: OLEOCON_SECTION_05_SCREEN,
  },
};

/* --------------------------------------------------
   SECTION 06 — UNIFIED DIGITAL CATALOG SYSTEM
   باکس سمت چپ، مدل expanded سمت راست.
-------------------------------------------------- */

const OLEOCON_SECTION_06_DIGITAL_CATALOG: StageConfig = {
  id: "digital-catalog",
  eyebrow: "UNIFIED 3D PRODUCT SYSTEM",
  title: "One model. Every part. One digital catalog.",
  body:
    "Every Oleocon component can live inside one unified digital product system: modeled in 3D, organized as a searchable catalog, and ready to open during a meeting anywhere in the world. No sample case. No shipping delay. Just a laptop, the right part, and a presentation that makes the product easy to understand and easy to sell.",
  side: "left",
  label: "Digital Catalog System",
  stats: ["All parts 3D modeled", "Digital catalog ready", "Meeting-ready on laptop"],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [0.62, 0.62, 0],
    pivotRotation: [
      THREE.MathUtils.degToRad(OLEOCON_SECTION_06_MODEL_VIEW.rotationX),
      THREE.MathUtils.degToRad(OLEOCON_SECTION_06_MODEL_VIEW.rotationY),
      THREE.MathUtils.degToRad(OLEOCON_SECTION_06_MODEL_VIEW.rotationZ),
    ],
    pivotScale: 0.9,
    cameraPosition: OLEOCON_LOCKED_CAMERA_POSITION,
    cameraTarget: OLEOCON_LOCKED_CAMERA_TARGET,
    explode: 1.22,
    explodeSpread: 1,
    explodeLayout: "vertical",
    ghost: 0,
    callouts: 0,
    autoSpin: 0,
    floatAmp: 0.025,
    screen: OLEOCON_SECTION_06_SCREEN,
  },
};

const OLEOCON_SECTION_04_TECH_SPECS: StageConfig = {
  id: "specs",
  eyebrow: "ONE SYSTEM. MANY CONTEXTS.",
  title: "Inspect the\nproduct.\nPresent it\nanywhere.",
  body:
    "Our 3D product system delivers a consistent, high-fidelity experience across multiple devices. Use the custom design software dedicated to your needs. Explore with the help of many tools designed for your product to understand every component, and share the same product system in meetings, remote calls, and expo environments.",
  side: "left",
  label: "Product Experience",
  data: OLEOCON_PRODUCT_DATA,
  stats: ["Desktop / laptop", "Mobile", "Expo / sales presentation"],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [0.56, 0.62, 0],
    pivotRotation: [0.08, 1.08 + THREE.MathUtils.degToRad(OLEOCON_SECTION_07_LOGO_FRONT_ROTATION_Y_DEGREES), 1.56],
    pivotScale: 0.94,
    cameraPosition: OLEOCON_LOCKED_CAMERA_POSITION,
    cameraTarget: OLEOCON_LOCKED_CAMERA_TARGET,
    explode: 0,
    materialOpacity: 0.58,
    ghost: 0,
    callouts: 0,
    autoSpin: 0.015,
    floatAmp: 0.025,
    screen: OLEOCON_SECTION_07_SCREEN,
  },
};

/* --------------------------------------------------
   SECTION 08 — MATERIAL / SURFACE DETAIL
-------------------------------------------------- */

const OLEOCON_SECTION_05_MATERIALS: StageConfig = {
  id: "materials",
  eyebrow: "SURFACE DETAIL BECOMES PRODUCT PROOF",
  title: "Metal, grooves, logo, and grip become the story.",
  body:
    "This section is for close technical copy: finish, texture, machining, surface behavior, and why the product deserves trust before a buyer even touches it.",
  side: "left",
  label: "Material Detail",
  hideCopy: true,
  stats: ["HDRI reflection", "Bump texture support", "Close-up framing"],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [-0.34, 0.74, 0],
    pivotRotation: [0.28, 1.36, -0.08],
    pivotScale: 1.3,
    cameraPosition: [2.2, 1.55, 4.65],
    cameraTarget: [-0.1, 0.58, 0],
    explode: 0.12,
    ghost: 0.04,
    callouts: 0,
    autoSpin: 0.018,
    floatAmp: 0.04,
    screen: OLEOCON_SECTION_08_SCREEN,
  },
};

/* --------------------------------------------------
   SECTION 09 — FINAL CASE STUDY CLOSE
-------------------------------------------------- */

const OLEOCON_SECTION_06_FINAL: StageConfig = {
  id: "final",
  eyebrow: "SECTION 09 / FINAL CASE STUDY CLOSE",
  title: "",
  body: "",
  side: "center",
  label: "Final Hero Pose",
  hideCopy: true,
  stats: [],
  text: {
    copyX: 0,
    copyY: 0,
    eyebrowX: 0,
    eyebrowY: 0,
    titleX: 0,
    titleY: 0,
    bodyX: 0,
    bodyY: 0,
    statsX: 0,
    statsY: 0,
  },
  pose: {
    ...DEFAULT_POSE,
    pivotPosition: [0, -0.05, 0],
    pivotRotation: [0.08, 2.2, 0],
    pivotScale: 0.98,
    cameraPosition: [3.7, 1.22, 6.85],
    cameraTarget: [0, 0.02, 0],
    autoSpin: 0.035,
    floatAmp: 0.06,
    screen: OLEOCON_SECTION_09_SCREEN,
  },
};

/* --------------------------------------------------
   SECTION LIST — برای اضافه/حذف/مرتب‌سازی section فقط این آرایه را عوض کن.
-------------------------------------------------- */

const STAGES: StageConfig[] = [
  OLEOCON_SECTION_01_HERO,
  OLEOCON_SECTION_02_POSTER_ART,
  OLEOCON_SECTION_03_PRODUCT_PROBLEM,
  OLEOCON_SECTION_04_VIDEO,
  OLEOCON_SECTION_05_FLOATING_MODEL,
  OLEOCON_SECTION_06_DIGITAL_CATALOG,
  OLEOCON_SECTION_04_TECH_SPECS,
  OLEOCON_SECTION_05_MATERIALS,
  OLEOCON_SECTION_06_FINAL,
];

const OLEOCON_CENTERED_TEXT_BOX_STAGE_IDS = new Set(["model", "digital-catalog", "specs", "materials"]);


type Section06FeatureItem = {
  icon: string;
  title: string;
  body: string;
};

type Section06LibraryItem = {
  title: string;
  image: string;
};

const SECTION_06_LIBRARY_IMAGE_BASE = "/pages/oleocon_page/Section%2006";

const SECTION_06_FEATURE_ITEMS: Section06FeatureItem[] = [
  {
    icon: "/icons/perplexity-ai-stroke-rounded.svg",
    title: "Every product 3D modeled",
    body: "Accurate to exact specifications.",
  },
  {
    icon: "/icons/ai-learning-stroke-rounded.svg",
    title: "One digital catalog for the full range",
    body: "Every product, one library.",
  },
  {
    icon: "/icons/algorithm-stroke-rounded.svg",
    title: "Open any item instantly in the app",
    body: "Filter, configure, and view in 3D.",
  },
  {
    icon: "/icons/account-recovery-stroke-rounded.svg",
    title: "Built for sales, export, and meetings",
    body: "Share. Close deals.",
  },
  {
    icon: "/icons/ai-laptop-stroke-rounded.svg",
    title: "Travel with a laptop, not samples",
    body: "No shipping, no extra baggage.",
  },
];

const SECTION_06_CTA_ITEMS: Section06FeatureItem[] = [
  {
    icon: "/icons/augmented-reality-ar-stroke-rounded.svg",
    title: "AR READY",
    body: "View products in your real environment.",
  },
  {
    icon: "/icons/vr-glasses-stroke-rounded.svg",
    title: "VR READY",
    body: "Immersive product exploration.",
  },
];

const SECTION_06_LIBRARY_ITEMS: Section06LibraryItem[] = [
  { title: "BALL VALVES", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/ballvalves.webp` },
  { title: "BALL VALVES 2", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/ballvalves2.webp` },
  { title: "COUPLINGS", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/couplings.webp` },
  { title: "DUST COVERS", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/dustcovers.webp` },
  { title: "FLOW CONTROL VALVES", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/flowcontrol%20valves.webp` },
  { title: "FLOW CONTROL VALVES 2", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/flowcontrolvalves.webp` },
  { title: "HAND PUMP", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/handpump.webp` },
  { title: "MULTI COUPLINGS", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/multicouplings.webp` },
  { title: "OTHERS", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/others.webp` },
  { title: "SWIVEL JOINTS", image: `${SECTION_06_LIBRARY_IMAGE_BASE}/swiveljoints.webp` },
];

const SECTION_06_LEFT_TECHNICAL_ITEMS: Section06FeatureItem[] = [
  {
    icon: "/icons/certificate-01-stroke-rounded.svg",
    title: "STANDARD",
    body: "ISO 7241-A",
  },
  {
    icon: "/icons/material-and-texture-stroke-rounded.svg",
    title: "MATERIAL",
    body: "Carbon Steel",
  },
  {
    icon: "/icons/security-check-stroke-rounded.svg",
    title: "SEALING",
    body: "NBR",
  },
  {
    icon: "/icons/temperature-stroke-rounded.svg",
    title: "TEMPERATURE RANGE",
    body: "-30°C to +110°C",
  },
  {
    icon: "/icons/layer-mask-01-stroke-rounded.svg",
    title: "COATING",
    body: "Electroless Nickel",
  },
  {
    icon: "/icons/installing-updates-01-stroke-rounded.svg",
    title: "VALVE SYSTEM",
    body: "Ball",
  },
];

const SECTION_05_EXPERIENCE_ITEMS: Section06FeatureItem[] = [
  {
    icon: "/icons/perplexity-ai-stroke-rounded.svg",
    title: "EXPLORE WITHOUT LIMITS",
    body: "Interact freely with the 3D model to examine every angle, surface, and feature in exceptional detail.",
  },
  {
    icon: "/icons/material-and-texture-stroke-rounded.svg",
    title: "REAL PRODUCT CLARITY",
    body: "Gain a deeper understanding of how every component fits, functions, and delivers reliable performance.",
  },
  {
    icon: "/icons/security-check-stroke-rounded.svg",
    title: "ENGINEERING YOU CAN TRUST",
    body: "Visualize precision, materials, and construction to validate quality and make confident technical decisions.",
  },
  {
    icon: "/icons/account-recovery-stroke-rounded.svg",
    title: "BUILT FOR COMPLEX DECISIONS",
    body: "Reduce uncertainty, align teams, and accelerate approvals with a more intuitive way to evaluate products.",
  },
];

function Section05Box({ index, label, style }: { index: number; label: string; style?: CSSProperties }) {
  return (
    <section className="section05-text" style={style} aria-label="Oleocon interactive 3D product introduction">
      <div className="section05-text-index">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <i />
        <span>{label}</span>
      </div>

      <p className="section05-text-eyebrow">Every component. Every detail. On your command.</p>

      <h1
        className="section05-text-title"
        data-oleocon-type="title-1"
        aria-label="Interact by Design, Understand by Experience"
      >
        <span className="section05-title-line">Interact</span>
        <span className="section05-title-line">by Design,</span>
        <span className="section05-title-line"><em>Understand</em></span>
        <span className="section05-title-line">by Experience</span>
      </h1>

      <p className="section05-text-lead">
        Experience any product like never before. Our interactive 3D ecosystem lets you explore every detail,
        understand every component, and see engineering come to life.
      </p>

      <div className="section05-feature-list" aria-label="Interactive 3D product benefits">
        {SECTION_05_EXPERIENCE_ITEMS.map((item) => (
          <article
            className="section05-feature-item"
            data-section05-reveal-item
            key={item.title}
          >
            <span className="section05-feature-icon" aria-hidden="true">
              <img src={item.icon} alt="" />
            </span>
            <span className="section05-feature-copy">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

type Section07ContextItem = {
  id: string;
  title: string;
  autoTitle?: string;
  cardTitle?: string;
  subtitle: string;
  laptopSubtitle?: string;
  description: string;
  laptopDescription?: string;
  cardDescription: string;
  device: "desktop" | "mobile" | "expo";
  icon: string;
};

type Section07BottomItem = {
  title: string;
  body: string;
  icon: "model" | "clarity" | "devices";
};
type Section07InspectionMode = "default" | "opacity" | "xray" | "wireframe" | "part-selection" | "add-note";

type Section07MaterialSnapshot = {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  envMapIntensity?: number;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  depthTest: boolean;
  blending: THREE.Blending;
  side: THREE.Side;
  wireframe?: boolean;
};


const SECTION_07_AUTO_PLAY_DURATION = 7000;

const SECTION_07_CONTEXT_ITEMS: Section07ContextItem[] = [
  {
    id: "01",
    title: "DESKTOP /\nLAPTOP",
    autoTitle: "One Experience. Every Device.",
    cardTitle: "DESKTOP /\nLAPTOP",
    subtitle: "Custom workflow access",
    description: "Thoughtfully designed, custom-built, and flawlessly\nadapted to your workflow—no matter the screen.",
    laptopDescription: "Custom-built for every screen and workflow.",
    cardDescription: "Full-featured interactive access with all data and the entire company library at your fingertips.",
    device: "desktop",
    icon: "/icons/monitor-stroke-rounded.svg",
  },
  {
    id: "02",
    title: "MOBILE /\nTABLET",
    autoTitle: "One Model. Multiple Deliverables.",
    cardTitle: "MOBILE /\nTABLET",
    subtitle: "Built once. Adapted everywhere.",
    laptopSubtitle: "Adapted everywhere.",
    description: "Catalogues, videos, renders, and sales assets\nacross every touchpoint.",
    laptopDescription: "Catalogues, videos, renders, and sales assets.",
    cardDescription: "iOS or Android: inspect on the go. Access the key modes of the 3D viewer application and product information anytime, anywhere.",
    device: "mobile",
    icon: "/icons/smart-phone-02-stroke-rounded.svg",
  },
  {
    id: "03",
    title: "EXPO / SALES\nPRESENTATION",
    autoTitle: "One Source. Every Team.",
    cardTitle: "EXPO / SALES\nPRESENTATION",
    subtitle: "Knowledge that stays",
    description: "Assembly, service, training, and expertise\nconnected in one system.",
    laptopDescription: "Service, training, and expertise in one system.",
    cardDescription: "Bring the product to life on the large displays. Touch the display. Engage, explore, and inspire confidence.",
    device: "expo",
    icon: "/icons/tv-02-stroke-rounded.svg",
  },
];

const SECTION_07_MODE_ITEMS: Array<{
  id: Section07InspectionMode;
  title: string;
  image: string;
  imageScale: number;
  imagePosition: string;
}> = [
  {
    id: "default",
    title: "DEFAULT",
    image: "/pages/oleocon_page/Section%2007/3D%20Viewer/normal.webp",
    imageScale: 1.18,
    imagePosition: "center center",
  },
  {
    id: "opacity",
    title: "OPACITY",
    image: "/pages/oleocon_page/Section%2007/3D%20Viewer/Opacity.webp",
    imageScale: 1.22,
    imagePosition: "center center",
  },
  {
    id: "xray",
    title: "X-RAY",
    image: "/pages/oleocon_page/Section%2007/3D%20Viewer/X%20Ray.webp",
    imageScale: 1.2,
    imagePosition: "center center",
  },
  {
    id: "part-selection",
    title: "SELECTION",
    image: "/pages/oleocon_page/Section%2007/3D%20Viewer/Part%20Selection.webp",
    imageScale: 1.24,
    imagePosition: "center center",
  },
  {
    id: "wireframe",
    title: "WIREFRAME",
    image: "/pages/oleocon_page/Section%2007/3D%20Viewer/Wireframe.webp",
    imageScale: 1.28,
    imagePosition: "center center",
  },
  {
    id: "add-note",
    title: "ADD NOTE",
    image: "/pages/oleocon_page/Section%2007/3D%20Viewer/Add%20Note.webp",
    imageScale: 1.18,
    imagePosition: "center center",
  },
];

const SECTION_07_BOTTOM_ITEMS: Section07BottomItem[] = [
  {
    icon: "model",
    title: "ONE MODEL SYSTEM",
    body: "A single accurate 3D source for every configuration and component.",
  },
  {
    icon: "clarity",
    title: "MODES FOR CLARITY",
    body: "Use X-Ray, Opacity, Wireframe, and part focus to reveal what matters.",
  },
  {
    icon: "devices",
    title: "ONE EXPERIENCE ACROSS DEVICES",
    body: "Consistent, interactive, and optimized for app, web, mobile, and large displays.",
  },
];

const SECTION_07_PART_SELECTION_TARGET_NAME = "locking ball cage";
const SECTION_07_PART_SELECTION_COLORS = ["#76b900", "#b6ff4a", "#00a6ff", "#f5c451", "#ff6a3d"];
const SECTION_07_PART_SELECTION_COLOR_DURATION = 0.72;
const SECTION_07_ADD_NOTE_TARGET_NAME = "main coupling sleeve";
const SECTION_07_ADD_NOTE_TEXT =
  "CLIENT NOTE\nCan you confirm whether the main coupling sleeve keeps the same surface protection after repeated connect/disconnect cycles, especially around the sleeve travel area?";

const SECTION_07_MATERIAL_SNAPSHOTS = new WeakMap<THREE.Material, Section07MaterialSnapshot>();

function captureSection07MaterialSnapshot(material: THREE.Material) {
  if (SECTION_07_MATERIAL_SNAPSHOTS.has(material)) return;

  const maybePhysical = material as THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    metalness?: number;
    roughness?: number;
    clearcoat?: number;
    envMapIntensity?: number;
    polygonOffset?: boolean;
    polygonOffsetFactor?: number;
    polygonOffsetUnits?: number;
    wireframe?: boolean;
  };

  SECTION_07_MATERIAL_SNAPSHOTS.set(material, {
    color: maybePhysical.color?.clone(),
    emissive: maybePhysical.emissive?.clone(),
    emissiveIntensity: maybePhysical.emissiveIntensity,
    metalness: maybePhysical.metalness,
    roughness: maybePhysical.roughness,
    clearcoat: maybePhysical.clearcoat,
    envMapIntensity: maybePhysical.envMapIntensity,
    polygonOffset: maybePhysical.polygonOffset,
    polygonOffsetFactor: maybePhysical.polygonOffsetFactor,
    polygonOffsetUnits: maybePhysical.polygonOffsetUnits,
    transparent: material.transparent,
    opacity: material.opacity,
    depthWrite: material.depthWrite,
    depthTest: material.depthTest,
    blending: material.blending,
    side: material.side,
    wireframe: maybePhysical.wireframe,
  });
}

function restoreSection07MaterialStyle(materials: THREE.Material[]) {
  materials.forEach((material) => {
    captureSection07MaterialSnapshot(material);
    const snapshot = SECTION_07_MATERIAL_SNAPSHOTS.get(material);
    if (!snapshot) return;

    const maybePhysical = material as THREE.Material & {
      color?: THREE.Color;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      metalness?: number;
      roughness?: number;
      clearcoat?: number;
      envMapIntensity?: number;
      polygonOffset?: boolean;
      polygonOffsetFactor?: number;
      polygonOffsetUnits?: number;
      wireframe?: boolean;
    };

    if (snapshot.color && maybePhysical.color) maybePhysical.color.copy(snapshot.color);
    if (snapshot.emissive && maybePhysical.emissive) maybePhysical.emissive.copy(snapshot.emissive);
    if (typeof snapshot.emissiveIntensity === "number") maybePhysical.emissiveIntensity = snapshot.emissiveIntensity;
    if (typeof snapshot.metalness === "number") maybePhysical.metalness = snapshot.metalness;
    if (typeof snapshot.roughness === "number") maybePhysical.roughness = snapshot.roughness;
    if (typeof snapshot.clearcoat === "number") maybePhysical.clearcoat = snapshot.clearcoat;
    if (typeof snapshot.envMapIntensity === "number") maybePhysical.envMapIntensity = snapshot.envMapIntensity;
    if (typeof snapshot.polygonOffset === "boolean") maybePhysical.polygonOffset = snapshot.polygonOffset;
    if (typeof snapshot.polygonOffsetFactor === "number") maybePhysical.polygonOffsetFactor = snapshot.polygonOffsetFactor;
    if (typeof snapshot.polygonOffsetUnits === "number") maybePhysical.polygonOffsetUnits = snapshot.polygonOffsetUnits;
    if (typeof snapshot.wireframe === "boolean") maybePhysical.wireframe = snapshot.wireframe;

    material.transparent = snapshot.transparent;
    material.opacity = snapshot.opacity;
    material.depthWrite = snapshot.depthWrite;
    material.depthTest = snapshot.depthTest;
    material.blending = snapshot.blending;
    material.side = snapshot.side;
    material.needsUpdate = true;
  });
}

function applySection07XrayStyle(materials: THREE.Material[]) {
  // Matches the standalone 3D Viewer X Ray button: technical edge overlay + low material opacity.
  materials.forEach((material) => {
    captureSection07MaterialSnapshot(material);
    const editable = material as THREE.Material & {
      wireframe?: boolean;
      polygonOffset?: boolean;
      polygonOffsetFactor?: number;
      polygonOffsetUnits?: number;
      needsUpdate: boolean;
    };

    if ("wireframe" in editable) editable.wireframe = false;

    material.transparent = true;
    material.opacity = 0.28;
    material.depthWrite = false;
    material.depthTest = true;
    material.blending = THREE.NormalBlending;
    material.side = THREE.DoubleSide;
    editable.polygonOffset = true;
    editable.polygonOffsetFactor = 0.7;
    editable.polygonOffsetUnits = 0.7;
    editable.needsUpdate = true;
  });
}

function applySection07WireframeStyle(materials: THREE.Material[]) {
  // Matches the standalone 3D Viewer Wireframe button: inspection-line edge overlay over a very light ghost material.
  materials.forEach((material) => {
    captureSection07MaterialSnapshot(material);
    const editable = material as THREE.Material & {
      wireframe?: boolean;
      polygonOffset?: boolean;
      polygonOffsetFactor?: number;
      polygonOffsetUnits?: number;
      needsUpdate: boolean;
    };

    if ("wireframe" in editable) editable.wireframe = false;

    material.transparent = true;
    material.opacity = 0.18;
    material.depthWrite = false;
    material.depthTest = true;
    material.blending = THREE.NormalBlending;
    material.side = THREE.DoubleSide;
    editable.polygonOffset = true;
    editable.polygonOffsetFactor = 1.4;
    editable.polygonOffsetUnits = 1.4;
    editable.needsUpdate = true;
  });
}

function disposeSection07LookEdgeOverlays(overlays: Map<string, THREE.LineSegments>) {
  overlays.forEach((overlay) => {
    overlay.parent?.remove(overlay);
    overlay.geometry.dispose();
    const material = overlay.material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material.dispose();
  });
  overlays.clear();
}

function syncSection07LookEdgeOverlays(
  parts: PartRecord[],
  mode: Section07InspectionMode | "inactive",
  overlays: Map<string, THREE.LineSegments>
) {
  const shouldShowEdges = mode === "xray" || mode === "wireframe";

  if (!shouldShowEdges) {
    disposeSection07LookEdgeOverlays(overlays);
    return;
  }

  const activePartIds = new Set(parts.map((part) => part.id));
  overlays.forEach((overlay, partId) => {
    if (activePartIds.has(partId)) return;
    overlay.parent?.remove(overlay);
    overlay.geometry.dispose();
    const material = overlay.material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material.dispose();
    overlays.delete(partId);
  });

  parts.forEach((part) => {
    const edgeMode = mode === "wireframe" ? "inspectionLine" : "technicalEdges";
    let overlay = overlays.get(part.id);

    if (overlay && overlay.userData.ctsSection07EdgeMode !== edgeMode) {
      overlay.parent?.remove(overlay);
      overlay.geometry.dispose();
      const material = overlay.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
      overlays.delete(part.id);
      overlay = undefined;
    }

    if (!overlay) {
      const geometry = new THREE.EdgesGeometry(part.mesh.geometry, edgeMode === "inspectionLine" ? 1 : 18);
      const material = new THREE.LineBasicMaterial({
        color: edgeMode === "inspectionLine" ? 0xb6ff4a : 0xe8f4dc,
        transparent: true,
        opacity: edgeMode === "inspectionLine" ? 0.98 : 0.86,
        depthTest: false,
        depthWrite: false,
      });

      overlay = new THREE.LineSegments(geometry, material);
      overlay.name = `cts_section07_${edgeMode}_edge_overlay_${part.mesh.name || part.id}`;
      overlay.userData.ctsSection07EdgeMode = edgeMode;
      overlay.renderOrder = edgeMode === "inspectionLine" ? 20 : 12;
      overlay.frustumCulled = false;
      overlay.raycast = () => undefined;
      part.mesh.add(overlay);
      overlays.set(part.id, overlay);
    }

    const overlayMaterial = overlay.material as THREE.LineBasicMaterial;
    overlay.visible = part.mesh.visible;
    overlay.renderOrder = edgeMode === "inspectionLine" ? 20 : 12;
    overlayMaterial.color.set(edgeMode === "inspectionLine" ? 0xb6ff4a : 0xe8f4dc);
    overlayMaterial.opacity = edgeMode === "inspectionLine" ? 0.98 : 0.86;
    overlayMaterial.depthTest = false;
    overlayMaterial.depthWrite = false;
    overlayMaterial.needsUpdate = true;
  });
}

function getSection07PartSelectionScore(part: PartRecord) {
  const searchableName = `${part.name} ${part.mesh.name || ""}`
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (searchableName.includes(SECTION_07_PART_SELECTION_TARGET_NAME)) return 100;

  let score = 0;
  if (searchableName.includes("locking")) score += 28;
  if (searchableName.includes("lock")) score += 18;
  if (searchableName.includes("ball")) score += 26;
  if (searchableName.includes("cage")) score += 26;

  // Turkish/source-model fallbacks, because the FBX mesh names may not be the final English UI names.
  if (searchableName.includes("kilit")) score += 28;
  if (searchableName.includes("kilitleme")) score += 28;
  if (searchableName.includes("bilye") || searchableName.includes("bilya")) score += 26;
  if (searchableName.includes("kafes") || searchableName.includes("kafesi")) score += 26;

  return score;
}

function getSection07PartSelectionTargetPart(parts: PartRecord[]) {
  let bestPart: PartRecord | null = null;
  let bestScore = 0;

  parts.forEach((part) => {
    const score = getSection07PartSelectionScore(part);
    if (score <= bestScore) return;
    bestScore = score;
    bestPart = part;
  });

  return bestScore >= 26 ? bestPart : null;
}

function restoreSection07PartSelectionTarget(parts: PartRecord[]) {
  const targetPart = getSection07PartSelectionTargetPart(parts);
  if (!targetPart) return;
  restoreSection07MaterialStyle(targetPart.materialList);
}

function getSection07MainCouplingSleeveScore(part: PartRecord) {
  const searchableName = `${part.name} ${part.mesh.name || ""}`
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (searchableName.includes(SECTION_07_ADD_NOTE_TARGET_NAME)) return 100;

  let score = 0;
  if (searchableName.includes("main")) score += 26;
  if (searchableName.includes("coupling")) score += 28;
  if (searchableName.includes("coupler")) score += 22;
  if (searchableName.includes("sleeve")) score += 32;

  // Turkish/source-model fallbacks.
  if (searchableName.includes("ana")) score += 22;
  if (searchableName.includes("kaplin")) score += 28;
  if (searchableName.includes("kovan")) score += 32;
  if (searchableName.includes("manşon") || searchableName.includes("manson")) score += 32;

  return score;
}

function getSection07MainCouplingSleeveTargetPart(parts: PartRecord[]) {
  let bestPart: PartRecord | null = null;
  let bestScore = 0;

  parts.forEach((part) => {
    const score = getSection07MainCouplingSleeveScore(part);
    if (score <= bestScore) return;
    bestScore = score;
    bestPart = part;
  });

  return bestScore >= 32 ? bestPart : null;
}

function getSection07LoopColor(elapsed: number) {
  const colorCount = SECTION_07_PART_SELECTION_COLORS.length;
  const raw = elapsed / SECTION_07_PART_SELECTION_COLOR_DURATION;
  const baseIndex = Math.floor(raw) % colorCount;
  const nextIndex = (baseIndex + 1) % colorCount;
  const local = smoothstep(0, 1, raw - Math.floor(raw));

  return new THREE.Color(SECTION_07_PART_SELECTION_COLORS[baseIndex]).lerp(
    new THREE.Color(SECTION_07_PART_SELECTION_COLORS[nextIndex]),
    local
  );
}

function applySection07PartSelectionColorLoop(part: PartRecord, elapsed: number) {
  const loopColor = getSection07LoopColor(elapsed);

  part.materialList.forEach((material) => {
    captureSection07MaterialSnapshot(material);
    const editable = material as THREE.Material & {
      color?: THREE.Color;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
      clearcoat?: number;
      envMapIntensity?: number;
      needsUpdate: boolean;
    };

    if (editable.color) editable.color.copy(loopColor);
    if (editable.emissive) editable.emissive.copy(loopColor).multiplyScalar(0.35);
    if (typeof editable.emissiveIntensity === "number") editable.emissiveIntensity = 0.22;
    if (typeof editable.roughness === "number") editable.roughness = 0.22;
    if (typeof editable.metalness === "number") editable.metalness = 0.82;
    if (typeof editable.clearcoat === "number") editable.clearcoat = 0.38;
    if (typeof editable.envMapIntensity === "number") editable.envMapIntensity = 1.75;

    material.transparent = true;
    material.opacity = 0.94;
    material.depthWrite = true;
    material.depthTest = true;
    material.blending = THREE.NormalBlending;
    material.side = THREE.DoubleSide;

    editable.needsUpdate = true;
  });
}

function Section07BottomIcon({ icon }: { icon: Section07BottomItem["icon"] }) {
  return (
    <span className={`section07-bottom-icon section07-bottom-icon-${icon}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function Section07ModePreview({ mode }: { mode: (typeof SECTION_07_MODE_ITEMS)[number] }) {
  return (
    <span className={`section07-mode-preview section07-mode-preview-${mode.id}`} aria-hidden="true">
      <img
        src={mode.image}
        alt=""
        loading="lazy"
        style={{
          "--mode-image-scale": String(mode.imageScale),
          "--mode-image-position": mode.imagePosition,
        } as CSSProperties}
      />
    </span>
  );
}

const SECTION_07_DEVICE_IMAGES: Record<Section07ContextItem["device"], string> = {
  desktop: "/pages/oleocon_page/Section%2007/Laptop.webp",
  mobile: "/pages/oleocon_page/Section%2007/Cellphone.webp",
  expo: "/pages/oleocon_page/Section%2007/Expo.webp",
};

const SECTION_07_PAUSE_ICON = "/icons/pause-stroke-hard.svg";

const SECTION_07_CONTEXT_BY_DEVICE: Record<Section07ContextItem["device"], Section07ContextItem> = {
  desktop: SECTION_07_CONTEXT_ITEMS[0],
  mobile: SECTION_07_CONTEXT_ITEMS[1],
  expo: SECTION_07_CONTEXT_ITEMS[2],
};

type Section07DeviceSetCard = {
  device: Section07ContextItem["device"];
  image: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardDescription?: string;
  laptopCardDescription?: string;
  icon?: string;
  hideIcon?: boolean;
};

type Section07DeviceSet = {
  id: string;
  cards: Section07DeviceSetCard[];
};

const SECTION_07_DEVICE_SETS: Section07DeviceSet[] = [
  {
    id: "01",
    cards: [
      {
        device: "desktop",
        image: SECTION_07_DEVICE_IMAGES.desktop,
        laptopCardDescription: "Access complete product data, technical details, and the full digital library from one workspace.",
      },
      {
        device: "mobile",
        image: SECTION_07_DEVICE_IMAGES.mobile,
        laptopCardDescription: "Inspect products, review key information, and continue the conversation wherever work takes you.",
      },
      {
        device: "expo",
        image: SECTION_07_DEVICE_IMAGES.expo,
        laptopCardDescription: "Present products live on large displays, answer questions clearly, and build customer confidence.",
      },
    ],
  },
  {
    id: "02",
    cards: [
      {
        device: "desktop",
        image: "/pages/oleocon_page/Section%2007/Autoplay2_1.webp",
        cardTitle: "ONE SOURCE.\nENDLESS\u00A0OUTPUTS.",
        cardDescription:
          "From technical documentation to customer-ready content, transform one model into every asset needed across print, digital, and motion.",
        laptopCardDescription: "Turn one accurate model into technical documentation, catalog visuals, digital content, and motion assets.",
        hideIcon: true,
      },
      {
        device: "mobile",
        image: "/pages/oleocon_page/Section%2007/Autoplay2_2.webp",
        cardTitle: "ONE MODEL.\nEVERY STAGE.",
        cardDescription:
          "From design to after-sales, one digital foundation supports the entire product lifecycle. From engineering and production to training and maintenance.",
        laptopCardDescription: "Use one digital foundation from design and production through sales, training, service, and after-sales.",
        hideIcon: true,
      },
      {
        device: "expo",
        image: "/pages/oleocon_page/Section%2007/Autoplay2_3.webp",
        cardTitle: "PRODUCT KNOWLEDGE\nTHAT NEVER GETS LOST.",
        cardDescription:
          "Capture expertise once and make it accessible to every team through time. No one remembers years later what was discussed behind closed doors.",
        laptopCardDescription: "Capture product expertise once and keep it organized, searchable, and accessible to every team over time.",
        hideIcon: true,
      },
    ],
  },
  {
    id: "03",
    cards: [
      {
        device: "desktop",
        image: "/pages/oleocon_page/Section%2007/Autoplay3_1.webp",
        cardTitle: "ENGINEERING TEAM",
        cardDescription: "Access accurate product data, documentation, and technical insights from a single source.",
        hideIcon: true,
      },
      {
        device: "mobile",
        image: "/pages/oleocon_page/Section%2007/Autoplay3_2.webp",
        cardTitle: "SALES & MARKETING",
        cardDescription: "Present products consistently across every customer touchpoint.",
        hideIcon: true,
      },
      {
        device: "expo",
        image: "/pages/oleocon_page/Section%2007/Autoplay3_3.webp",
        cardTitle: "SERVICE & TRAINING",
        cardDescription: "Turn expertise into structured knowledge that every technician can access.",
        hideIcon: true,
      },
    ],
  },
];

function getSection07DeviceSet(activeContext: number) {
  return SECTION_07_DEVICE_SETS[activeContext] ?? SECTION_07_DEVICE_SETS[0];
}

function Section07DeviceMockup({ device, image }: { device: Section07ContextItem["device"]; image: string }) {
  const imageLayerIdRef = useRef(0);
  const cleanupTimerRef = useRef<number | null>(null);
  const [imageLayers, setImageLayers] = useState<Array<{ id: number; src: string; state: "current" | "exiting" }>>([
    { id: 0, src: image, state: "current" },
  ]);

  useEffect(() => {
    setImageLayers((previousLayers) => {
      const currentLayer = previousLayers.find((layer) => layer.state === "current");
      if (currentLayer?.src === image) return previousLayers;

      imageLayerIdRef.current += 1;
      return [
        ...previousLayers.map((layer) => ({ ...layer, state: "exiting" as const })),
        { id: imageLayerIdRef.current, src: image, state: "current" as const },
      ];
    });

    if (cleanupTimerRef.current !== null) window.clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = window.setTimeout(() => {
      setImageLayers((previousLayers) => previousLayers.filter((layer) => layer.state === "current"));
      cleanupTimerRef.current = null;
    }, 1500);

    return () => {
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, [image]);

  return (
    <div className={`section07-device section07-device-${device}`} aria-hidden="true">
      {imageLayers.map((layer) => (
        <img
          key={layer.id}
          className={`section07-device-image section07-device-image-layer section07-device-image-layer-${layer.state}`}
          src={layer.src}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

function Section07ProductExperience({
  stage,
  index,
  isActive,
  selectedMode,
  onSelectMode,
}: {
  stage: StageConfig;
  index: number;
  isActive: boolean;
  selectedMode: Section07InspectionMode;
  onSelectMode: (mode: Section07InspectionMode) => void;
}) {
  const [activeContext, setActiveContext] = useState(0);
  const [isSection07AutoPaused, setIsSection07AutoPaused] = useState(false);
  const section07AutoStartedAtRef = useRef(0);
  const section07AutoRemainingRef = useRef(SECTION_07_AUTO_PLAY_DURATION);
  const section07LayoutRef = useRef<HTMLDivElement | null>(null);
  const section07LeftColumnRef = useRef<HTMLDivElement | null>(null);
  const section07StoryEyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const section07RightHeaderRef = useRef<HTMLDivElement | null>(null);
  const activeDeviceSet = getSection07DeviceSet(activeContext);

  useEffect(() => {
    if (!isActive || isSection07AutoPaused) return;
    if (window.matchMedia("(min-width: 761px) and (max-width: 1180px)").matches) return;

    section07AutoStartedAtRef.current = window.performance.now();

    const timeoutId = window.setTimeout(() => {
      section07AutoRemainingRef.current = SECTION_07_AUTO_PLAY_DURATION;
      setActiveContext((previous) => (previous + 1) % SECTION_07_CONTEXT_ITEMS.length);
    }, section07AutoRemainingRef.current);

    return () => window.clearTimeout(timeoutId);
  }, [activeContext, isActive, isSection07AutoPaused]);

  useLayoutEffect(() => {
    const layout = section07LayoutRef.current;
    const leftColumn = section07LeftColumnRef.current;
    const storyEyebrow = section07StoryEyebrowRef.current;
    const rightHeader = section07RightHeaderRef.current;

    if (!layout || !leftColumn || !storyEyebrow || !rightHeader) return;

    const storyBodyLaptop = layout.querySelector<HTMLElement>(".section07-story-body-laptop");
    const autoPanel = layout.querySelector<HTMLElement>(".section07-auto-panel");
    const modeShell = layout.querySelector<HTMLElement>(".section07-mode-shell");
    const laptopSpacingQuery = window.matchMedia(
      "(min-width: 1181px) and (max-width: 1800px), (min-width: 1181px) and (max-height: 1000px)"
    );

    const syncSection07Columns = () => {
      const layoutRect = layout.getBoundingClientRect();
      const leftRect = leftColumn.getBoundingClientRect();
      const eyebrowRect = storyEyebrow.getBoundingClientRect();
      const headerRect = rightHeader.getBoundingClientRect();
      const eyebrowCenterY = eyebrowRect.top + eyebrowRect.height / 2 - layoutRect.top;
      const rightTop = Math.max(0, eyebrowCenterY - headerRect.height / 2);
      const rightHeight = Math.max(0, leftRect.bottom - layoutRect.top - rightTop);

      if (!laptopSpacingQuery.matches) {
        layout.style.setProperty("--section07-measured-left-width", `${Math.round(leftRect.width)}px`);
        layout.style.setProperty("--section07-right-top", `${Math.round(rightTop)}px`);
        layout.style.setProperty("--section07-right-height", `${Math.round(rightHeight)}px`);
        layout.style.setProperty("--section07-right-header-height", `${Math.round(headerRect.height)}px`);
      } else {
        // Laptop geometry is fully CSS-locked. Never write measured right-column
        // dimensions here, because those inline values caused the visible load shift.
        layout.style.removeProperty("--section07-measured-left-width");
        layout.style.removeProperty("--section07-right-top");
        layout.style.removeProperty("--section07-right-height");
        layout.style.removeProperty("--section07-right-header-height");
      }

      if (laptopSpacingQuery.matches && storyBodyLaptop && autoPanel && modeShell) {
        layout.style.setProperty("--section07-laptop-autoplay-balanced-y-v19", "0px");

        const bodyRect = storyBodyLaptop.getBoundingClientRect();
        const autoRect = autoPanel.getBoundingClientRect();
        const modeRect = modeShell.getBoundingClientRect();
        const availableHeight = modeRect.top - bodyRect.bottom;
        const equalGap = Math.max(0, (availableHeight - autoRect.height) / 2);
        const targetTop = bodyRect.bottom + equalGap;
        const offsetY = targetTop - autoRect.top;

        layout.style.setProperty(
          "--section07-laptop-autoplay-balanced-y-v19",
          `${Math.round(offsetY)}px`
        );
      } else {
        layout.style.removeProperty("--section07-laptop-autoplay-balanced-y-v19");
      }
    };

    // Lock the laptop geometry before paint and do not re-measure it while
    // fonts, images, transitions, or inspection modes settle. This prevents
    // the right cards from visibly resizing after the page has loaded.
    syncSection07Columns();

    const handleWindowResize = () => syncSection07Columns();
    window.addEventListener("resize", handleWindowResize);

    // Desktop keeps responsive element observation. Laptop intentionally does
    // not, because its final V34 geometry is fixed and must remain motionless.
    let resizeObserver: ResizeObserver | null = null;
    if (!laptopSpacingQuery.matches) {
      resizeObserver = new ResizeObserver(syncSection07Columns);
      resizeObserver.observe(layout);
      resizeObserver.observe(leftColumn);
      resizeObserver.observe(storyEyebrow);
      resizeObserver.observe(rightHeader);
      if (storyBodyLaptop) resizeObserver.observe(storyBodyLaptop);
      if (autoPanel) resizeObserver.observe(autoPanel);
      if (modeShell) resizeObserver.observe(modeShell);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [isActive]);

  const handleSection07ContextSelect = (itemIndex: number) => {
    section07AutoRemainingRef.current = SECTION_07_AUTO_PLAY_DURATION;
    setActiveContext(itemIndex);
  };

  const handleSection07AutoToggle = () => {
    if (isSection07AutoPaused) {
      setIsSection07AutoPaused(false);
      return;
    }

    const elapsed = window.performance.now() - section07AutoStartedAtRef.current;
    section07AutoRemainingRef.current = Math.max(180, section07AutoRemainingRef.current - elapsed);
    setIsSection07AutoPaused(true);
  };

  return (
    <div ref={section07LayoutRef} className="section07-layout" style={stageTextStyle(stage)}>
      <div ref={section07LeftColumnRef} className="section07-left-column">
        <div className="section07-story-block">
          <div className="section07-story-index">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <i />
            <span>{stage.label.toUpperCase()}</span>
          </div>

          <p ref={section07StoryEyebrowRef} className="section07-story-eyebrow">{stage.eyebrow}</p>
          <h1 className="section07-story-title-default" aria-label="Inspect the product. Present it anywhere.">
            <span className="section07-story-title-line">Inspect &</span>
            <span className="section07-story-title-line">Present the</span>
            <span className="section07-story-title-line">products</span>
            <span className="section07-story-title-line">
              anywhere<span className="section07-title-dot">.</span>
            </span>
          </h1>
          <h1 className="section07-story-title-laptop" aria-label="Inspect. Present.">
            <span className="section07-story-title-line">Inspect<span className="section07-title-dot">.</span></span>
            <span className="section07-story-title-line">Present<span className="section07-title-dot">.</span></span>
          </h1>
          <p className="section07-story-body section07-story-body-default">{stage.body}</p>
          <p className="section07-story-body section07-story-body-laptop">
            Explore every component with purpose-built tools, then use the same 3D product system across devices,
            meetings, remote calls, and expos.
          </p>
        </div>

        <div className="section07-auto-panel" aria-label="Product usage contexts" data-section07-auto-paused={isSection07AutoPaused ? "true" : "false"}>
          {SECTION_07_CONTEXT_ITEMS.map((item, itemIndex) => {
            const isCurrent = itemIndex === activeContext;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={`section07-auto-item ${isCurrent ? "is-active" : ""}`}
                onClick={() => handleSection07ContextSelect(itemIndex)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  handleSection07ContextSelect(itemIndex);
                }}
                aria-pressed={isCurrent}
              >
                <span className="section07-auto-progress-track" aria-hidden="true">
                  {isCurrent && isActive ? (
                    <span
                      key={`${item.id}-${activeContext}`}
                      className="section07-auto-progress-fill"
                      style={{
                        animationDuration: `${SECTION_07_AUTO_PLAY_DURATION}ms`,
                        animationPlayState: isSection07AutoPaused ? "paused" : "running",
                      }}
                    />
                  ) : null}
                </span>

                <span className="section07-auto-id-stack">
                  <span className="section07-auto-item-id">/{item.id}</span>
                  {isCurrent ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className="section07-auto-toggle"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSection07AutoToggle();
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        event.stopPropagation();
                        handleSection07AutoToggle();
                      }}
                      aria-pressed={isSection07AutoPaused}
                      aria-label={isSection07AutoPaused ? "Play product usage autoplay" : "Pause product usage autoplay"}
                    >
                      <span className={`section07-auto-toggle-icon ${isSection07AutoPaused ? "" : "section07-auto-toggle-icon-pause"}`} aria-hidden="true">
                        {isSection07AutoPaused ? "▶" : <span style={{ "--section07-pause-icon": `url(${SECTION_07_PAUSE_ICON})` } as CSSProperties} />}
                      </span>
                    </span>
                  ) : null}
                </span>

                <span className="section07-auto-copy">
                  <strong>{item.autoTitle ?? item.title}</strong>
                  {item.subtitle ? (
                    <>
                      <em className="section07-auto-copy-default">{item.subtitle}</em>
                      <em className="section07-auto-copy-laptop">{item.laptopSubtitle ?? item.subtitle}</em>
                    </>
                  ) : null}
                  {item.description ? (
                    <>
                      <small className="section07-auto-copy-default">{item.description}</small>
                      <small className="section07-auto-copy-laptop">{item.laptopDescription ?? item.description}</small>
                    </>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section07-center-column">
        <div className="section07-mode-shell">
          <p className="section07-panel-eyebrow">INSPECTION MODES</p>
          <div className="section07-mode-panel">
            <div className="section07-mode-grid">
              {SECTION_07_MODE_ITEMS.map((mode) => (
                <button
                  key={mode.title}
                  type="button"
                  className={`section07-mode-card section07-mode-card-${mode.id} ${selectedMode === mode.id ? "is-active" : ""}`}
                  onClick={() => onSelectMode(mode.id)}
                  aria-pressed={selectedMode === mode.id}
                >
                  <span className="section07-mode-title">{mode.title}</span>
                  <Section07ModePreview mode={mode} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section07-right-column">
        <div ref={section07RightHeaderRef} className="section07-right-header">USE IT WHERE YOU WORK AND PRESENT.</div>

        <div className="section07-device-card-stack" data-section07-device-set={activeDeviceSet.id}>
          {activeDeviceSet.cards.map((card, cardIndex) => {
            const item = SECTION_07_CONTEXT_BY_DEVICE[card.device];
            const cardTitle = card.cardTitle ?? item.cardTitle ?? item.title;
            const cardSubtitle = card.cardSubtitle;
            const cardDescription = card.cardDescription ?? item.cardDescription;
            const cardIcon = card.icon ?? item.icon;

            return (
              <article
                key={`section07-device-card-${card.device}-${cardIndex}`}
                className={`section07-device-card section07-device-set-card section07-device-card-${card.device} ${cardIndex === activeContext ? "is-active" : ""}`}
                style={{ "--section07-device-card-delay": `${cardIndex * 58}ms` } as CSSProperties}
              >
                <div key={`section07-device-copy-${activeDeviceSet.id}-${cardIndex}`} className="section07-device-copy">
                  <div
                    className={`section07-device-mini-icon section07-device-mini-icon-${item.device}`}
                    aria-hidden="true"
                    data-section07-icon-hidden={card.hideIcon ? "true" : undefined}
                  >
                    <img src={cardIcon} alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3>{cardTitle}</h3>
                  {cardSubtitle ? <em>{cardSubtitle}</em> : null}
                  <p className="section07-device-body-default">{cardDescription}</p>
                  <p className="section07-device-body-laptop">{card.laptopCardDescription ?? cardDescription}</p>
                </div>
                <Section07DeviceMockup device={card.device} image={card.image} />
              </article>
            );
          })}
        </div>
      </div>

      <div className="section07-mobile-column-stack" aria-label="Oleocon mobile product experience cards">
        {SECTION_07_DEVICE_SETS.map((deviceSet, setIndex) => {
          const context = SECTION_07_CONTEXT_ITEMS[setIndex];

          return (
            <section key={`section07-mobile-group-${deviceSet.id}`} className="section07-mobile-group">
              <div className="section07-mobile-group-header">
                <span className="section07-mobile-group-number">/{deviceSet.id}</span>
                <h2>{context.autoTitle ?? context.title}</h2>
                {context.subtitle ? <p>{context.subtitle}</p> : null}
                {context.description ? <p className="section07-tablet-group-description">{context.description}</p> : null}
              </div>

              <div className="section07-mobile-card-list">
                {deviceSet.cards.map((card, cardIndex) => {
                  const item = SECTION_07_CONTEXT_BY_DEVICE[card.device];
                  const cardTitle = card.cardTitle ?? item.cardTitle ?? item.title;
                  const cardSubtitle = card.cardSubtitle ?? item.subtitle;
                  const cardDescription = card.cardDescription ?? item.cardDescription;

                  return (
                    <article key={`section07-mobile-card-${deviceSet.id}-${card.device}-${cardIndex}`} className="section07-mobile-card">
                      <div className="section07-mobile-card-image-wrap">
                        <img src={card.image} alt="" loading="lazy" decoding="async" />
                      </div>
                      <div className="section07-mobile-card-copy">
                        {cardSubtitle ? <p className="section07-mobile-card-eyebrow">{cardSubtitle}</p> : null}
                        <h3>{cardTitle}</h3>
                        <p className="section07-mobile-card-body">{cardDescription}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="section07-mobile-inspection-modes" aria-label="Inspection modes previews">
        <div className="section07-mobile-inspection-heading">
          <span>INSPECTION MODES</span>
        </div>

        <div className="section07-mobile-inspection-grid">
          {SECTION_07_MODE_ITEMS.map((mode) => (
            <article key={`section07-mobile-inspection-${mode.id}`} className={`section07-mobile-inspection-card section07-mobile-inspection-card-${mode.id}`}>
              <img src={mode.image} alt={mode.title} loading="lazy" decoding="async" />
              <span>{mode.title}</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}


type Section08SalesCard = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
};

const SECTION_08_SALES_CARDS: Section08SalesCard[] = [
  {
    eyebrow: "PRESENT",
    title: "Bring the product into any room.",
    body: "Use one visual system to explain complex products clearly in meetings, remote calls, and presentations. Give your team a clearer way to introduce the product, align the room, and start the conversation with confidence.",
    image: "/pages/oleocon_page/Section%2008/image2_meeting.webp",
  },
  {
    eyebrow: "PROVE",
    title: "Answer questions in the moment.",
    body: "Use interactive visuals in real conversations to answer questions faster, explain technical value, and build trust on the spot. Bring the product into real working conversations. Show what matters, explain it visually, and reduce friction before doubt slows the sale.",
    image: "/pages/oleocon_page/Section%2008/image3_sell.webp",
  },
  {
    eyebrow: "CLOSE",
    title: "Walk in prepared. Leave with momentum.",
    body: "When the product is already easy to understand, sales conversations move faster and opportunities move forward with less friction.. When the customer already understands the product, your team can focus on decision-making.",
    image: "/pages/oleocon_page/Section%2008/iamge4_mine.webp",
  },
];

function Section08SalesWeapon({ stage, index }: { stage: StageConfig; index: number }) {
  return (
    <div className="section08-layout" style={stageTextStyle(stage)}>
      <section className="section08-top-grid" aria-label="Oleocon sales enablement hero">
        <article className="section08-copy-panel">
          <div className="section08-index">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <i />
            <span>SALES WEAPON</span>
          </div>

          <p className="section08-eyebrow">SALES ENABLEMENT</p>
          <h1>
            <span>SELL MORE.</span>
            <span>
              TALK <em>LESS</em>.
            </span>
            <span>
              GROW FASTER<em>.</em>
            </span>
          </h1>
          <p className="section08-body">{`Give your team the most powerful weapon in their arsenal.
Smart tools. Instant answers. Automated support.
So they can sell more-with less effort, less travel,
and less time spent chasing information.

Your clients can handle more on their own.
Automated tools, instant answers, and self-service
features mean less time on calls, less back-and-forth,
and more deals closed.`}</p>
        </article>

        <article className="section08-hero-panel" aria-label="Sales output visual system">
          <img
            className="section08-hero-media"
            src="/pages/oleocon_page/Section%2008/image1_hero.webp"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className="section08-hero-answer-box" aria-label="Product platform answers">
            <h2>
              <span>ONE PLATFORM.</span>
              <span>EVERY ANSWER.</span>
            </h2>
            <ul>
              <li>Instant product information</li>
              <li>Interactive 3D models</li>
              <li>Technical data &amp; drawings</li>
              <li>Compatibility checks</li>
              <li>Price &amp; availability</li>
              <li>Resources &amp; downloads</li>
              <li>And much more ...</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="section08-bottom-grid" aria-label="Oleocon sales workflow cards">
        <div className="section08-card-row">
          {SECTION_08_SALES_CARDS.map((card) => (
            <article key={card.title} className="section08-sales-card">
              <img
                className="section08-card-image"
                src={card.image}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <div className="section08-card-copy">
                <p>{card.eyebrow}</p>
                <h3>{card.title}</h3>
                <span>{card.body}</span>
              </div>
            </article>
          ))}
        </div>

        <article className="section08-wide-panel">
          <div>
            <p>
              <span>ONE PRODUCT EXPERIENCE.</span>
              <span>EVERY SALES MOMENT.</span>
            </p>
            <h2>
              <span className="section08-wide-copy-default">
                <span>From the meeting room to the field to the final conversation, the same digital product </span>
                <span>experience helps your team present clearly, prove value faster, and close with more confidence.</span>
              </span>
              <span className="section08-wide-copy-laptop">
                One product experience helps teams explain clearly, prove value, and close with confidence.
              </span>
            </h2>
          </div>
          <a href="#after" aria-label="Open Oleocon model experience section">
            Experience the model <span>→</span>
          </a>
        </article>
      </section>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

function getStageScreenPlacement(stage: StageConfig): Required<StageScreenPlacement> {
  const placement = {
    ...OLEOCON_SCREEN_PLACEMENT_DEFAULT,
    ...(stage.pose.screen ?? {}),
  };

  // فقط سکشن ۰۵ در موبایل و تبلت کمی به راست می‌رود؛ دسکتاپ و لپ‌تاپ بدون تغییر می‌مانند.
  if (stage.id === "model" && typeof window !== "undefined" && window.innerWidth <= 1180) {
    const responsiveShift = window.innerWidth <= 620
      ? OLEOCON_SECTION_05_MOBILE_X_SHIFT
      : OLEOCON_SECTION_05_TABLET_X_SHIFT;
    placement.screenX += responsiveShift / 200;
  }

  return placement;
}

function getBlendedScreenPlacement(stageProgress: number): Required<StageScreenPlacement> {
  const maxIndex = STAGES.length - 1;
  const baseIndex = clamp(Math.floor(stageProgress), 0, maxIndex);
  const nextIndex = clamp(baseIndex + 1, 0, maxIndex);
  const rawLocal = clamp01(stageProgress - baseIndex);

  /*
    IMPORTANT:
    Screen placement must NOT blend during the whole section.
    If it blends from section 05 to 06 across the full section, changing section 05 X feels broken
    because the next section keeps pulling the model back.

    This creates a HOLD zone:
    - 0% to 72% of the section: keep the current section placement exactly.
    - 72% to 100%: transition to the next section.

    Result: when you edit OLEOCON_SECTION_05_SCREEN.x, section 05 actually moves by that value.
  */
  const a = getStageScreenPlacement(STAGES[baseIndex]);
  const b = getStageScreenPlacement(STAGES[nextIndex]);

  if (STAGES[baseIndex]?.id === "specs") {
    return a;
  }

  const t = STAGES[baseIndex]?.id === "digital-catalog"
    ? smoothstep(0.92, 1, rawLocal)
    : smoothstep(0.72, 1, rawLocal);

  return {
    screenX: mix(a.screenX, b.screenX, t),
    screenY: mix(a.screenY, b.screenY, t),
    screenScale: mix(a.screenScale, b.screenScale, t),
    screenPlaneZ: mix(a.screenPlaneZ, b.screenPlaneZ, t),
  };
}

function getSection05RotationWeight(stageProgress: number) {
  const maxIndex = STAGES.length - 1;
  const baseIndex = clamp(Math.floor(stageProgress), 0, maxIndex);
  const rawLocal = clamp01(stageProgress - baseIndex);

  if (STAGES[baseIndex]?.id !== "model") return 0;

  // فقط در سکشن ۵ فعال است؛ نزدیک خروج به سکشن ۶ نرم صفر می‌شود تا pose بعدی خراب نشود.
  return 1 - smoothstep(0.84, 1, rawLocal);
}

function screenPointToWorld(
  camera: THREE.PerspectiveCamera,
  screenX: number,
  screenY: number,
  planeZ: number
) {
  const ndc = new THREE.Vector3(screenX * 2 - 1, 1 - screenY * 2, 0.5);
  ndc.unproject(camera);

  const direction = ndc.sub(camera.position).normalize();
  const denominator = Math.abs(direction.z) < 0.0001 ? 0.0001 : direction.z;
  const distance = (planeZ - camera.position.z) / denominator;

  return camera.position.clone().add(direction.multiplyScalar(distance));
}

function getBlendedPose(stageProgress: number): StagePose {
  const maxIndex = STAGES.length - 1;
  const baseIndex = clamp(Math.floor(stageProgress), 0, maxIndex);
  const nextIndex = clamp(baseIndex + 1, 0, maxIndex);
  const rawLocal = clamp01(stageProgress - baseIndex);

  const a = STAGES[baseIndex].pose;
  const b = STAGES[nextIndex].pose;

  // سکشن ۰۵ باید مثل یک shot ثابت کنترل شود، نه اینکه وسط اسکرول با سکشن بعدی mix شود.
  // قبلاً عددهای SECTION_05_MODEL_VIEW کار می‌کردند اما بلافاصله با pose بعدی blend می‌شدند؛ برای همین حس می‌کردی هیچ کنترلی نداری.
  if (STAGES[baseIndex]?.id === "model") {
    if (rawLocal < 0.88) return a;
    const t = smoothstep(0.88, 1, rawLocal);
    const isEnteringDigitalCatalog = STAGES[nextIndex]?.id === "digital-catalog";

    return {
      pivotPosition: mixVec3(a.pivotPosition, b.pivotPosition, t),
      pivotRotation: mixVec3(a.pivotRotation, b.pivotRotation, t),
      pivotScale: mix(a.pivotScale, b.pivotScale, t),
      cameraPosition: mixVec3(a.cameraPosition, b.cameraPosition, t),
      cameraTarget: mixVec3(a.cameraTarget, b.cameraTarget, t),
      explode: mix(a.explode, b.explode, t),
      explodeSpread: mix(a.explodeSpread ?? 1, b.explodeSpread ?? 1, t),
      // سکشن ۶ vertical explode دارد. موقع ورود نباید layout بین scatter/vertical عوض شود؛ همان باعث جهش دیوانه‌وار قطعات می‌شد.
      explodeLayout: isEnteringDigitalCatalog ? b.explodeLayout : t < 0.5 ? a.explodeLayout : b.explodeLayout,
      materialOpacity: mix(a.materialOpacity ?? 1, b.materialOpacity ?? 1, t),
      ghost: mix(a.ghost, b.ghost, t),
      callouts: mix(a.callouts, b.callouts, t),
      autoSpin: mix(a.autoSpin, b.autoSpin, t),
      floatAmp: mix(a.floatAmp, b.floatAmp, t),
    };
  }

  // سکشن ۷ آخرین سکشن مدل است. در fade-out نباید به pose سکشن ۸ حرکت کند؛
  // فقط opacity کل canvas کم می‌شود و مدل در همان pose خودش می‌ماند.
  if (STAGES[baseIndex]?.id === "specs") {
    return a;
  }

  if (STAGES[baseIndex]?.id === "digital-catalog" && rawLocal < 0.92) {
    return a;
  }

  const isLeavingDigitalCatalog = STAGES[baseIndex]?.id === "digital-catalog";
  const t = isLeavingDigitalCatalog
    ? smoothstep(0.92, 1, rawLocal)
    : smoothstep(0.72, 1, rawLocal);

  return {
    pivotPosition: mixVec3(a.pivotPosition, b.pivotPosition, t),
    pivotRotation: mixVec3(a.pivotRotation, b.pivotRotation, t),
    pivotScale: mix(a.pivotScale, b.pivotScale, t),
    cameraPosition: mixVec3(a.cameraPosition, b.cameraPosition, t),
    cameraTarget: mixVec3(a.cameraTarget, b.cameraTarget, t),
    explode: mix(a.explode, b.explode, t),
    explodeSpread: mix(a.explodeSpread ?? 1, b.explodeSpread ?? 1, t),
    // موقع خروج از سکشن ۶ هم layout باید vertical بماند تا قطعات ناگهان به scatter نپرند.
    explodeLayout: isLeavingDigitalCatalog ? a.explodeLayout : t < 0.5 ? a.explodeLayout : b.explodeLayout,
    materialOpacity: mix(a.materialOpacity ?? 1, b.materialOpacity ?? 1, t),
    ghost: mix(a.ghost, b.ghost, t),
    callouts: mix(a.callouts, b.callouts, t),
    autoSpin: mix(a.autoSpin, b.autoSpin, t),
    floatAmp: mix(a.floatAmp, b.floatAmp, t),
  };
}

function cleanPartName(name: string) {
  return name
    .replace(/_/g, " ")
    .replace(/polySurface/gi, "Part ")
    .replace(/mesh/gi, "Part")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 34);
}

function getMaterials(mesh: THREE.Mesh) {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function setMaterialOpacity(materials: THREE.Material[], opacity: number) {
  materials.forEach((mat) => {
    mat.transparent = opacity < 0.995;
    mat.opacity = opacity;
    mat.depthWrite = opacity > 0.72;
  });
}

function loadTexture(
  loader: THREE.TextureLoader,
  url: string,
  colorSpace: THREE.ColorSpace,
  repeatX = 1,
  repeatY = 1
) {
  const texture = loader.load(
    url,
    (tex) => {
      tex.colorSpace = colorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      tex.needsUpdate = true;
    },
    undefined,
    () => {
      // تکسچر missing نباید کل صفحه را خراب کند.
    }
  );

  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);

  return texture;
}

function configureOleoconBumpTexture(texture: THREE.Texture) {
  const repeatY = OLEOCON_BUMP_INVERT_Y ? -1 : 1;
  const offsetY = OLEOCON_BUMP_INVERT_Y ? 1 + OLEOCON_BUMP_OFFSET_V : OLEOCON_BUMP_OFFSET_V;

  texture.center.set(0.5, 0.5);
  texture.repeat.set(1, repeatY);
  texture.rotation = THREE.MathUtils.degToRad(OLEOCON_BUMP_ROTATION_DEGREES);
  texture.offset.set(OLEOCON_BUMP_OFFSET_U, offsetY);
  texture.needsUpdate = true;
}

const SECTION_06_HOVER_ORIGINAL_COLOR_KEY = "oleoconSection06OriginalColor";
const SECTION_06_HOVER_COLOR_PALETTE = [
  "#ff2d55",
  "#00c7be",
  "#ff9500",
  "#5856d6",
  "#34c759",
  "#af52de",
  "#ffcc00",
  "#007aff",
  "#f72585",
  "#06d6a0",
  "#f97316",
  "#4cc9f0",
  "#a3e635",
  "#7209b7",
  "#ef4444",
  "#22d3ee",
  "#e879f9",
  "#84cc16",
  "#fb7185",
  "#14b8a6",
  "#facc15",
  "#3b82f6",
  "#c084fc",
  "#10b981",
  "#fb923c",
  "#38bdf8",
  "#d946ef",
  "#65a30d",
] as const;
let section06HoverColorBag: string[] = [];
let section06LastHoverColor = "";

function getMaterialColor(material: THREE.Material) {
  const coloredMaterial = material as THREE.Material & { color?: THREE.Color };
  return coloredMaterial.color instanceof THREE.Color ? coloredMaterial.color : null;
}

function shuffleSection06HoverColors() {
  const bag = [...SECTION_06_HOVER_COLOR_PALETTE];

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }

  if (bag[0] === section06LastHoverColor && bag.length > 1) {
    [bag[0], bag[1]] = [bag[1], bag[0]];
  }

  return bag;
}

function createSection06FreshHoverColor() {
  if (section06HoverColorBag.length === 0) {
    section06HoverColorBag = shuffleSection06HoverColors();
  }

  const nextColor = section06HoverColorBag.shift() ?? "#76b900";
  section06LastHoverColor = nextColor;

  return new THREE.Color(nextColor);
}

function applySection06RandomHoverColor(part: PartRecord) {
  const hoverColor = createSection06FreshHoverColor();

  part.materialList.forEach((material) => {
    const materialColor = getMaterialColor(material);
    if (!materialColor) return;

    if (!material.userData[SECTION_06_HOVER_ORIGINAL_COLOR_KEY]) {
      material.userData[SECTION_06_HOVER_ORIGINAL_COLOR_KEY] = materialColor.clone();
    }

    materialColor.copy(hoverColor);
    material.needsUpdate = true;
  });
}

function restoreSection06HoverColor(part: PartRecord | null) {
  if (!part) return;

  part.materialList.forEach((material) => {
    const materialColor = getMaterialColor(material);
    const originalColor = material.userData[SECTION_06_HOVER_ORIGINAL_COLOR_KEY] as THREE.Color | undefined;

    if (!materialColor || !originalColor) return;

    materialColor.copy(originalColor);
    material.needsUpdate = true;
  });
}

function makeOleoconMaterial(
  meshName: string,
  sourceMaterial: THREE.Material | null | undefined,
  fallbackIndex: number,
  textures: {
    oleoconBump: THREE.Texture;
  }
) {
  const sourceAny = sourceMaterial as
    | (THREE.Material & {
        name?: string;
        color?: THREE.Color;
      })
    | undefined;

  const materialName = sourceAny?.name || `Oleocon_Material_${fallbackIndex + 1}`;
  const key = `${meshName} ${materialName}`.toLowerCase();

  const isBaseNoise = key.includes("base_metal_noise") || key.includes("noise");
  const isBaseMetal = key.includes("base_metal") || key.includes("metal");
  const isShiny = key.includes("shiny") || key.includes("chrome") || key.includes("silver");
  const isLogo = key.includes("logo") || key.includes("oleocon") || key.includes("text");
  const isPattern = key.includes("pattern") || key.includes("knurl") || key.includes("grip");
  const isInner = key.includes("inner") || key.includes("inside") || key.includes("black");
  const isPin = key.includes("pin") || key.includes("ball") || key.includes("sphere");

  const material = new THREE.MeshPhysicalMaterial({
    name: materialName,
    color: new THREE.Color("#969b9e"),
    metalness: 0.88,
    roughness: 0.28,
    clearcoat: 0.34,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.85,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });

  // New model-wide maps from /public/3d_models/oleocon/texture/
  // oleoconBump.png gives the surface detail. No roughness map is applied here.
  material.bumpMap = textures.oleoconBump;
  material.bumpScale = OLEOCON_GLOBAL_BUMP_SCALE;

  if (isBaseMetal) {
    material.color = new THREE.Color("#8e9496");
    material.metalness = 0.9;
    material.roughness = 0.31;
  }

  if (isShiny) {
    material.color = new THREE.Color("#c9ced0");
    material.metalness = 0.96;
    material.roughness = 0.16;
    material.clearcoat = 0.62;
    material.clearcoatRoughness = 0.16;
    material.envMapIntensity = 2.15;
  }

  if (isBaseNoise) {
    material.color = new THREE.Color("#858b8d");
    material.bumpMap = textures.oleoconBump;
    material.bumpScale = Math.max(OLEOCON_GLOBAL_BUMP_SCALE, BASE_BUMP_SCALE);
    material.roughness = 0.36;
  }

  if (isLogo) {
    material.color = new THREE.Color("#aeb4b6");
    material.bumpMap = textures.oleoconBump;
    material.bumpScale = Math.max(OLEOCON_GLOBAL_BUMP_SCALE, LOGO_BUMP_SCALE);
    material.roughness = 0.25;
  }

  if (isPattern) {
    material.color = new THREE.Color("#9aa0a2");
    material.bumpMap = textures.oleoconBump;
    material.bumpScale = Math.max(OLEOCON_GLOBAL_BUMP_SCALE, PATTERN_BUMP_SCALE);
    material.roughness = 0.27;
  }

  if (isInner) {
    material.color = new THREE.Color("#14171b");
    material.metalness = 0.52;
    material.roughness = 0.58;
    material.clearcoat = 0.04;
    material.envMapIntensity = 1;
  }

  if (isPin) {
    material.color = new THREE.Color("#f1f1eb");
    material.metalness = 1;
    material.roughness = 0.15;
    material.clearcoat = 0.72;
  }

  return material;
}

const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = ["desktop", "laptop", "tablet", "mobile"];

function isResponsiveLineArray(value: string | readonly string[]): value is readonly string[] {
  return Array.isArray(value);
}

function valueToLines(value: string | readonly string[]): string[] {
  return isResponsiveLineArray(value) ? [...value] : value.split("\n");
}

function isResponsiveCopyMap(
  value: ResponsiveCopyValue,
): value is Partial<Record<ResponsiveBreakpoint, string | readonly string[]>> {
  return typeof value === "object" && !Array.isArray(value);
}

function responsiveCopyVariants(value: ResponsiveCopyValue) {
  if (!isResponsiveCopyMap(value)) {
    const lines = valueToLines(value);
    return RESPONSIVE_BREAKPOINTS.map((breakpoint) => ({ breakpoint, lines }));
  }

  const fallbackValue = value.desktop ?? value.laptop ?? value.tablet ?? value.mobile ?? "";

  return RESPONSIVE_BREAKPOINTS.map((breakpoint) => ({
    breakpoint,
    lines: valueToLines(value[breakpoint] ?? fallbackValue),
  }));
}

function renderResponsiveLine(line: string, greenSentenceDot: boolean) {
  if (!greenSentenceDot || !line.endsWith(".")) return line;

  return (
    <>
      {line.slice(0, -1)}
      <span className="oleocon-title-green-dot">.</span>
    </>
  );
}

function ResponsiveCopy({ value, greenSentenceDot = false }: { value: ResponsiveCopyValue; greenSentenceDot?: boolean }) {
  return (
    <>
      {responsiveCopyVariants(value).map(({ breakpoint, lines }) => (
        <span key={breakpoint} className={`oleocon-responsive-copy oleocon-responsive-copy-${breakpoint}`}>
          {lines.map((line, lineIndex) => (
            <span key={`${breakpoint}-${lineIndex}`} className="oleocon-responsive-copy-line">
              {renderResponsiveLine(line, greenSentenceDot)}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

function textValue(text: StageTextControls, breakpoint: ResponsiveBreakpoint, key: keyof StageTextValues) {
  return text.responsive?.[breakpoint]?.[key] ?? text[key] ?? 0;
}

function stageTextStyle(stage: StageConfig): CSSProperties {
  const text = stage.text ?? {};

  return {
    "--copy-x": `${text.copyX ?? 0}px`,
    "--copy-y": `${text.copyY ?? 0}px`,
    "--eyebrow-x": `${text.eyebrowX ?? 0}px`,
    "--eyebrow-y": `${text.eyebrowY ?? 0}px`,
    "--title-x": `${text.titleX ?? 0}px`,
    "--title-y": `${text.titleY ?? 0}px`,
    "--body-x": `${text.bodyX ?? 0}px`,
    "--body-y": `${text.bodyY ?? 0}px`,
    "--stats-x": `${text.statsX ?? 0}px`,
    "--stats-y": `${text.statsY ?? 0}px`,
    "--copy-x-desktop": `${textValue(text, "desktop", "copyX")}px`,
    "--copy-y-desktop": `${textValue(text, "desktop", "copyY")}px`,
    "--title-x-desktop": `${textValue(text, "desktop", "titleX")}px`,
    "--title-y-desktop": `${textValue(text, "desktop", "titleY")}px`,
    "--body-x-desktop": `${textValue(text, "desktop", "bodyX")}px`,
    "--body-y-desktop": `${textValue(text, "desktop", "bodyY")}px`,
    "--copy-x-laptop": `${textValue(text, "laptop", "copyX")}px`,
    "--copy-y-laptop": `${textValue(text, "laptop", "copyY")}px`,
    "--title-x-laptop": `${textValue(text, "laptop", "titleX")}px`,
    "--title-y-laptop": `${textValue(text, "laptop", "titleY")}px`,
    "--body-x-laptop": `${textValue(text, "laptop", "bodyX")}px`,
    "--body-y-laptop": `${textValue(text, "laptop", "bodyY")}px`,
    "--copy-x-tablet": `${textValue(text, "tablet", "copyX")}px`,
    "--copy-y-tablet": `${textValue(text, "tablet", "copyY")}px`,
    "--title-x-tablet": `${textValue(text, "tablet", "titleX")}px`,
    "--title-y-tablet": `${textValue(text, "tablet", "titleY")}px`,
    "--body-x-tablet": `${textValue(text, "tablet", "bodyX")}px`,
    "--body-y-tablet": `${textValue(text, "tablet", "bodyY")}px`,
    "--copy-x-mobile": `${textValue(text, "mobile", "copyX")}px`,
    "--copy-y-mobile": `${textValue(text, "mobile", "copyY")}px`,
    "--title-x-mobile": `${textValue(text, "mobile", "titleX")}px`,
    "--title-y-mobile": `${textValue(text, "mobile", "titleY")}px`,
    "--body-x-mobile": `${textValue(text, "mobile", "bodyX")}px`,
    "--body-y-mobile": `${textValue(text, "mobile", "bodyY")}px`,
  } as CSSProperties;
}

function ResponsiveImageWithFallback({
  urls,
  alt,
  className,
}: {
  urls: string[];
  alt: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const src = urls[index];

  if (!src) {
    return (
      <div className="oleocon-banner-fallback">
        <span>Missing image</span>
        <small>Check the image path in OleoconPage.tsx</small>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}

function BannerImage() {
  return <ResponsiveImageWithFallback urls={[BANNER_URL]} alt="Oleocon industrial product banner" />;
}

function PosterImage({ urls }: { urls: string[] }) {
  return (
    <ResponsiveImageWithFallback
      urls={urls}
      alt="Oleocon uploaded industrial poster"
      className="oleocon-poster-image"
    />
  );
}

function ProductVideo({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      className="oleocon-video-media"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      aria-label="Oleocon product render video"
    />
  );
}

function usePlayOnlyWhenVisible(videoRef: RefObject<HTMLVideoElement | null>, shouldLoop = true) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const setPaused = () => {
      if (cancelled) return;
      video.pause();
    };

    const setPlaying = () => {
      if (cancelled) return;
      video.loop = shouldLoop;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
          // مرورگر ممکن است autoplay را reject کند؛ کلیک کاربر هنوز play/pause را فعال می‌کند.
        });
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.28) {
          setPlaying();
        } else {
          setPaused();
        }
      },
      { threshold: [0, 0.28, 0.62] }
    );

    observer.observe(video);

    return () => {
      cancelled = true;
      observer.disconnect();
      video.pause();
    };
  }, [videoRef, shouldLoop]);
}

function LoopVideoProblemBlock({ stage, index }: { stage: StageConfig; index: number }) {
  const videoUrl = stage.loopVideoUrl ?? SECTION_03_LOOP_VIDEO_URL;
  const loopVideoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="oleocon-loop-proof-layout">
      <video
        ref={loopVideoRef}
        className="oleocon-loop-proof-video"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        aria-label="Oleocon looped product use-case video"
      />
      <div className="oleocon-loop-proof-shade" aria-hidden="true" />

      <div className="oleocon-loop-proof-panel" style={stageTextStyle(stage)}>
        <div className="oleocon-section-index">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <i />
          <span>{stage.label}</span>
        </div>

        <p className="oleocon-eyebrow">{stage.eyebrow}</p>
        {stage.id === "problem" ? (
          <h1 className="section03-problem-title" aria-label="Seeing is Believing">
            <span className="section03-problem-title-line section03-problem-title-seeing">Seeing is</span>
            <span className="section03-problem-title-line section03-problem-title-believing">Believing<span className="section03-problem-title-green-dot">.</span></span>
          </h1>
        ) : (
          <h1>{stage.title}</h1>
        )}
        <p className="oleocon-body">{stage.body}</p>

        {stage.lines && (
          <ul className="oleocon-line-proof-list">
            {stage.lines.map((line, lineIndex) => (
              <li
                key={line}
                className="oleocon-line-proof-item"
                style={{ "--line-delay": `${lineIndex * 155}ms` } as CSSProperties}
              >
                {line}
              </li>
            ))}
          </ul>
        )}

        {stage.stats && (
          <ul className="oleocon-stat-list">
            {stage.stats.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" />
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4Zm11.6-1.4-1.4 1.4A4.2 4.2 0 0 1 15.5 12a4.2 4.2 0 0 1-1.3 3l1.4 1.4A6.1 6.1 0 0 0 17.5 12a6.1 6.1 0 0 0-1.9-4.4Zm2.6-2.6-1.4 1.4A8 8 0 0 1 19.5 12a8 8 0 0 1-2.7 5.9l1.4 1.4A10 10 0 0 0 21.5 12a10 10 0 0 0-3.3-7Z" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4Zm12.2.2L14.8 10.6 16.2 12l-1.4 1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4L19 12l1.4-1.4-1.4-1.4-1.4 1.4-1.4-1.4Z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 4h7v2H7.4l4.05 4.05-1.4 1.4L6 7.4V11H4V4Zm9 0h7v7h-2V7.4l-4.05 4.05-1.4-1.4L16.6 6H13V4ZM6 16.6l4.05-4.05 1.4 1.4L7.4 18H11v2H4v-7h2v3.6Zm7.95-4.05L18 16.6V13h2v7h-7v-2h3.6l-4.05-4.05 1.4-1.4Z" />
    </svg>
  );
}

function CatalogVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const volumeControlRef = useRef<HTMLDivElement | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tapFeedback, setTapFeedback] = useState<"play" | "pause" | null>(null);

  const flashTapFeedback = (state: "play" | "pause") => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setTapFeedback(state);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setTapFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 820);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      flashTapFeedback("play");
      void video.play();
      setIsPlaying(true);
    } else {
      flashTapFeedback("pause");
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleVolumeControl = () => {
    setIsVolumeOpen((previous) => !previous);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const nextVolume = Math.min(1, Math.max(0, Number(event.target.value)));
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(video.muted);
  };

  const enterFullscreen = () => {
    const player = playerRef.current;
    const video = videoRef.current;
    if (!player || !video) return;

    const fullscreenTarget = player as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    if (fullscreenTarget.requestFullscreen) {
      void fullscreenTarget.requestFullscreen();
      return;
    }

    if (fullscreenTarget.webkitRequestFullscreen) {
      void fullscreenTarget.webkitRequestFullscreen();
      return;
    }

    if (iosVideo.webkitEnterFullscreen) {
      iosVideo.webkitEnterFullscreen();
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVolumeOpen) return;

    const closeOnOutsideSelection = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!volumeControlRef.current?.contains(target)) setIsVolumeOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsVolumeOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideSelection);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideSelection);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isVolumeOpen]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const safeDuration = Number.isFinite(video.duration) ? video.duration : 0;
    setCurrentTime(video.currentTime);
    setDuration(safeDuration);
    setProgress(safeDuration > 0 ? (video.currentTime / safeDuration) * 100 : 0);
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;

    const nextProgress = Number(event.target.value);
    video.currentTime = (nextProgress / 100) * video.duration;
    setProgress(nextProgress);
  };

  return (
    <div className="oleocon-catalog-video-player" ref={playerRef}>
      <video
        ref={videoRef}
        className="oleocon-catalog-video-media"
        src={src}
        poster={poster}
        muted={false}
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) {
            video.volume = volume;
            video.muted = volume === 0;
            setIsMuted(video.muted);
          }
          handleTimeUpdate();
        }}
        onTimeUpdate={handleTimeUpdate}
        aria-label="Oleocon technical product video"
      />

      <div className={`oleocon-video-tap-feedback ${tapFeedback ? "is-visible" : ""}`} aria-hidden="true">
        {tapFeedback === "pause" ? <PauseIcon /> : <PlayIcon />}
      </div>


      <div className="oleocon-catalog-video-controls" aria-label="Video controls">
        <button className="oleocon-video-icon-button" type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause video" : "Play video"}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span>{formatVideoTime(currentTime)}</span>

        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          aria-label="Video progress"
        />

        <span>{formatVideoTime(duration)}</span>

        <div
          ref={volumeControlRef}
          className={`oleocon-video-volume-control ${isVolumeOpen ? "is-open" : ""}`}
        >
          <button
            className="oleocon-video-icon-button"
            type="button"
            onClick={toggleVolumeControl}
            aria-label={isVolumeOpen ? "Close volume control" : "Open volume control"}
            aria-expanded={isVolumeOpen}
          >
            {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeOnIcon />}
          </button>

          <div className="oleocon-video-volume-popover" aria-hidden={!isVolumeOpen}>
            <input
              className="oleocon-video-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ "--oleocon-volume-level": `${(isMuted ? 0 : volume) * 100}%` } as CSSProperties}
              aria-label="Video volume"
              tabIndex={isVolumeOpen ? 0 : -1}
            />
          </div>
        </div>

        <button className="oleocon-video-icon-button" type="button" onClick={enterFullscreen} aria-label="Fullscreen video">
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}

type CatalogPanelIconName = "model" | "outputs" | "reuse";

function CatalogPanelIcon({ name }: { name: CatalogPanelIconName }) {
  if (name === "model") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.8 4.6 6.9v8.2l7.4 4.1 7.4-4.1V6.9L12 2.8Zm0 2.25 4.25 2.35L12 9.75 7.75 7.4 12 5.05ZM6.6 9.12l4.4 2.44v4.72l-4.4-2.44V9.12Zm6.4 7.16v-4.72l4.4-2.44v4.72L13 16.28Z" />
      </svg>
    );
  }

  if (name === "outputs") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 5.2v13.6L18.7 12 8 5.2Zm2 3.65L14.95 12 10 15.15v-6.3Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17.8 7.2A7.8 7.8 0 0 0 4.35 10H2.1l3.4 4.05L8.9 10H6.45a5.75 5.75 0 0 1 9.85-1.35l1.5-1.45ZM18.5 9.95 15.1 14h2.45a5.75 5.75 0 0 1-9.85 1.35l-1.5 1.45A7.8 7.8 0 0 0 19.65 14h2.25l-3.4-4.05Z" />
    </svg>
  );
}

function Section06LeftStory() {
  const storyRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const story = storyRef.current;
    const stage = story?.closest<HTMLElement>("#digital-catalog");
    const platform = stage?.querySelector<HTMLElement>(".section06-platform-shell");
    const title = story?.querySelector<HTMLElement>(".section06-left-story-title");

    if (!story || !stage || !platform || !title) return;

    let frame = 0;

    const syncSection06LeftStory = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const desktopOrLaptop = window.matchMedia("(min-width: 1181px)").matches;

        if (!desktopOrLaptop) {
          story.style.removeProperty("--section06-left-story-title-width");
          story.style.removeProperty("--section06-left-story-top");
          delete story.dataset.section06TitleWidthMeasured;
          delete story.dataset.section06LaptopTopAligned;
          return;
        }

        const measuredTitleWidth = Array.from(title.children).reduce((widest, line) => {
          const range = document.createRange();
          range.selectNodeContents(line);
          const width = range.getBoundingClientRect().width;
          range.detach();
          return Math.max(widest, width);
        }, 0);

        if (measuredTitleWidth > 0) {
          story.style.setProperty("--section06-left-story-title-width", `${Math.ceil(measuredTitleWidth)}px`);
          story.dataset.section06TitleWidthMeasured = "true";
        }

        const laptop = window.matchMedia(
          "(min-width: 1181px) and (max-width: 1600px), (min-width: 1181px) and (max-height: 900px)",
        ).matches;

        if (!laptop) {
          story.style.removeProperty("--section06-left-story-top");
          delete story.dataset.section06LaptopTopAligned;
          return;
        }

        const stageRect = stage.getBoundingClientRect();
        const platformRect = platform.getBoundingClientRect();
        const platformStyle = window.getComputedStyle(platform);
        const platformMatrix =
          platformStyle.transform === "none" ? null : new DOMMatrixReadOnly(platformStyle.transform);
        const currentTransformY = platformMatrix?.m42 ?? 0;
        const activeCopyY = Number.parseFloat(platformStyle.getPropertyValue("--copy-y")) || 0;
        const platformLayoutTop = platformRect.top - stageRect.top - currentTransformY;

        story.style.setProperty(
          "--section06-left-story-top",
          `${Math.round(platformLayoutTop + activeCopyY)}px`,
        );
        story.dataset.section06LaptopTopAligned = "true";
      });
    };

    const resizeObserver = new ResizeObserver(syncSection06LeftStory);
    resizeObserver.observe(stage);
    resizeObserver.observe(platform);
    resizeObserver.observe(title);
    window.addEventListener("resize", syncSection06LeftStory, { passive: true });
    void document.fonts?.ready.then(syncSection06LeftStory);
    syncSection06LeftStory();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncSection06LeftStory);
    };
  }, []);

  return (
    <section ref={storyRef} className="section06-left-story" aria-label="Engineering clarity introduction">
      <div className="section06-left-story-index">
        <span>06</span>
        <i />
        <span>ENGINEERING CLARITY</span>
      </div>

      <p className="section06-left-story-eyebrow">EXPLORE. UNDERSTAND. TRUST.</p>

      <h1 className="section06-left-story-title" aria-label="Inspect the product. Trust the data.">
        <span>Inspect</span>
        <span>the product.</span>
        <span>
          Trust the data
          <span className="section06-left-story-title-dot">.</span>
        </span>
      </h1>

      <p className="section06-left-story-body">
        One accurate 3D pipeline powers an entire family of couplings, adapters, fittings, and related parts
        organized into a single digital catalog. Present any item, anywhere in the world, from a laptop through
        custom software, on a mobile phone through a custom-made app, or directly in any browser on the web.
      </p>

      <div className="section06-left-story-data-list" aria-label="Technical product data">
        {SECTION_06_LEFT_TECHNICAL_ITEMS.map((item) => (
          <article key={item.title} className="section06-left-story-data-item">
            <div className="section06-left-story-data-icon" aria-hidden="true">
              {item.title === "TEMPERATURE RANGE" ? (
                <svg className="section06-left-story-data-icon-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path
                    d="M12 4.25a2.75 2.75 0 0 0-2.75 2.75v7.29a4.75 4.75 0 1 0 5.5 0V7A2.75 2.75 0 0 0 12 4.25Zm0 1.5A1.25 1.25 0 0 1 13.25 7v8.08l.38.22a3.25 3.25 0 1 1-3.26 0l.38-.22V7A1.25 1.25 0 0 1 12 5.75Zm-.75 4.5a.75.75 0 0 1 1.5 0v5.1a1.8 1.8 0 1 1-1.5 0v-5.1Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <img src={item.icon} alt="" />
              )}
            </div>

            <div className="section06-left-story-data-copy">
              <strong>{item.title}</strong>
              <small>{item.body}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function setSection06LibraryCardTilt(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const relativeX = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
  const relativeY = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;

  // Real 3D tilt: the card surface rotates, not the image position.
  // Opposite-direction response: cursor right -> card rotates left, cursor down -> card rotates up.
  card.style.setProperty("--section06-card-rotate-x", `${(relativeY * 18).toFixed(2)}deg`);
  card.style.setProperty("--section06-card-rotate-y", `${(-relativeX * 18).toFixed(2)}deg`);
  card.style.setProperty("--section06-card-shadow-x", `${(-relativeX * 22).toFixed(2)}px`);
  card.style.setProperty("--section06-card-shadow-y", `${(-relativeY * 22).toFixed(2)}px`);
  card.style.setProperty("--section06-card-glow-x", `${((relativeX + 0.5) * 100).toFixed(1)}%`);
  card.style.setProperty("--section06-card-glow-y", `${((relativeY + 0.5) * 100).toFixed(1)}%`);
}

function resetSection06LibraryCardTilt(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  card.style.setProperty("--section06-card-rotate-x", "0deg");
  card.style.setProperty("--section06-card-rotate-y", "0deg");
  card.style.setProperty("--section06-card-shadow-x", "0px");
  card.style.setProperty("--section06-card-shadow-y", "0px");
  card.style.setProperty("--section06-card-glow-x", "50%");
  card.style.setProperty("--section06-card-glow-y", "50%");
}

function Section06CatalogPanel({ style }: { style?: CSSProperties }) {
  const shellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const stage = shell?.closest<HTMLElement>("#digital-catalog");
    const page = shell?.closest<HTMLElement>(".oleocon-page");

    if (!shell || !stage || !page) return;

    let frame = 0;

    const syncSection06ViewportCenter = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const isLaptop = page.dataset.laptop === "true";
        const isActive = stage.classList.contains("is-active");

        if (!isLaptop || !isActive) {
          shell.style.removeProperty("--section06-viewport-center-y");
          return;
        }

        const computed = window.getComputedStyle(shell);
        const currentOffset = Number.parseFloat(
          computed.getPropertyValue("--section06-viewport-center-y"),
        ) || 0;
        const shellRect = shell.getBoundingClientRect();
        const shellCenter = shellRect.top + shellRect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const nextOffset = currentOffset + viewportCenter - shellCenter;

        shell.style.setProperty(
          "--section06-viewport-center-y",
          `${Math.round(nextOffset)}px`,
        );
      });
    };

    const resizeObserver = new ResizeObserver(syncSection06ViewportCenter);
    resizeObserver.observe(shell);
    resizeObserver.observe(stage);

    const stageObserver = new MutationObserver(syncSection06ViewportCenter);
    stageObserver.observe(stage, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", syncSection06ViewportCenter, { passive: true });
    window.addEventListener("scroll", syncSection06ViewportCenter, { passive: true });
    void document.fonts?.ready.then(syncSection06ViewportCenter);
    syncSection06ViewportCenter();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      stageObserver.disconnect();
      window.removeEventListener("resize", syncSection06ViewportCenter);
      window.removeEventListener("scroll", syncSection06ViewportCenter);
      shell.style.removeProperty("--section06-viewport-center-y");
    };
  }, []);

  return (
    <div ref={shellRef} className="section06-platform-shell" style={style}>
      <div className="section06-platform-panel">
        <div className="section06-platform-grid">
          <div className="section06-platform-copy-column">
            <div className="section06-platform-copy-top">
              <div className="section06-platform-index">
                <span>LIVE 3D PRODUCT PLATFORM</span>
              </div>

              <h1
                className="section06-platform-title"
                aria-label="One model system. A whole product library ready to travel."
              >
                <span className="section06-platform-title-wide" aria-hidden="true">
                  <span>One model system.</span>
                  <span>A whole product library</span>
                  <span>
                    ready to travel<i className="section06-platform-title-dot">.</i>
                  </span>
                </span>

                <span className="section06-platform-title-narrow" aria-hidden="true">
                  <span>One model</span>
                  <span>system. A whole</span>
                  <span>product library</span>
                  <span>
                    ready to travel<i className="section06-platform-title-dot">.</i>
                  </span>
                </span>
              </h1>

              <p className="section06-platform-body">
                The 3D platform turns into;<br />
                one accurate model system into a scalable{" "}<br className="section06-platform-body-laptop-break" />
                library of compatible products. Explore,{" "}<br className="section06-platform-body-laptop-break" />
                configure, and present the full range from{" "}<br className="section06-platform-body-laptop-break" />
                anywhere—no physical samples required.
              </p>
            </div>

            <div className="section06-platform-copy-middle">
              <div className="section06-platform-feature-list">
                {SECTION_06_FEATURE_ITEMS.map((item) => (
                  <article key={item.title} className="section06-platform-feature-item">
                    <div className="section06-platform-feature-icon" aria-hidden="true">
                      <img src={item.icon} alt="" />
                    </div>

                    <div className="section06-platform-feature-copy">
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="section06-platform-copy-bottom">
              <div className="section06-platform-cta-stack">
                {SECTION_06_CTA_ITEMS.map((item) => (
                  <article key={item.title} className="section06-platform-cta-card">
                    <div className="section06-platform-cta-icon" aria-hidden="true">
                      <img src={item.icon} alt="" />
                    </div>

                    <div className="section06-platform-cta-copy">
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className="section06-platform-library-column">
            <p className="section06-platform-library-eyebrow">SCALABLE PRODUCT LIBRARY</p>

            <div className="section06-platform-library-grid">
              {SECTION_06_LIBRARY_ITEMS.map((item) => (
                <article
                  key={item.title}
                  className="section06-platform-library-card"
                  onMouseMove={setSection06LibraryCardTilt}
                  onMouseLeave={resetSection06LibraryCardTilt}
                >
                  <img src={item.image} alt={item.title} loading="lazy" />
                </article>
              ))}

              <article className="section06-platform-library-more-card">
                <div className="section06-platform-library-more-icon" aria-hidden="true">
                  <img src="/icons/trolley-01-stroke-rounded.svg" alt="" />
                </div>
                <div className="section06-platform-library-more-copy">
                  <strong>ADD MORE</strong>
                  <small>Expanding every day.</small>
                </div>
              </article>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CatalogVideoDataBlock({ stage, index: _index }: { stage: StageConfig; index: number }) {
  const valueNotes = stage.lines ?? OLEOCON_MODEL_ACCURACY_NOTES;

  const panelItems: Array<{ icon: CatalogPanelIconName; title: ResponsiveCopyValue; body: ResponsiveCopyValue }> = [
    {
      icon: "model",
      title: SECTION_04_RESPONSIVE_COPY.proofTitles.model,
      body:
        "Created by professional 3D artists through hours of meticulous modeling and obsessive attention to detail, every product is rebuilt with uncompromising accuracy, down to the last screw.",
    },
    {
      icon: "outputs",
      title: SECTION_04_RESPONSIVE_COPY.proofTitles.outputs,
      body: "Catalog renders, animations, videos, and interactive product views from the same 3D foundation.",
    },
    {
      icon: "reuse",
      title: SECTION_04_RESPONSIVE_COPY.proofTitles.reuse,
      body: "Reusable across channels. Easy updates. Consistent results.",
    },
  ];

  return (
    <div className="oleocon-catalog-video-layout oleocon-catalog-video-layout-laptop-locked">
      <div className="oleocon-catalog-video-column oleocon-catalog-video-column-laptop-locked">
        <CatalogVideoPlayer
          src={stage.videoUrl ?? SECTION_04_VIDEO_URL}
          poster={stage.videoPosterUrl ?? SECTION_04_VIDEO_POSTER_URL}
        />
      </div>

      <aside className="oleocon-catalog-data-panel" style={stageTextStyle(stage)}>
        <h1 className="oleocon-catalog-data-title oleocon-type2-title" data-oleocon-type="title-2" aria-label="Built once. Reused everywhere.">
          <ResponsiveCopy value={SECTION_04_RESPONSIVE_COPY.title} greenSentenceDot />
        </h1>
        <span className="oleocon-catalog-title-rule" aria-hidden="true" />
        <p className="oleocon-body">
          <ResponsiveCopy value={SECTION_04_RESPONSIVE_COPY.body} />
        </p>

        <div className="oleocon-catalog-panel-proof-list" aria-label="Reusable model value">
          {panelItems.map((item) => (
            <article key={item.icon} className="oleocon-catalog-panel-proof-item">
              <span className="oleocon-catalog-panel-icon">
                <CatalogPanelIcon name={item.icon} />
              </span>
              <div>
                <h2 className="oleocon-type3-title" data-oleocon-type="title-3">
                  <ResponsiveCopy value={item.title} />
                </h2>
                <p className="oleocon-type1-body-desktop-only oleocon-type1-body-tablet-mobile oleocon-type2-body" data-oleocon-type="body-2"><ResponsiveCopy value={item.body} /></p>
              </div>
            </article>
          ))}
        </div>

        <a className="oleocon-catalog-panel-cta" href="#model" aria-label="Jump to Oleocon 3D model section">
          <span>See how we build it</span>
          <i aria-hidden="true">→</i>
        </a>
      </aside>

      <div className="oleocon-catalog-card-grid oleocon-catalog-card-grid-laptop-full" aria-label="Oleocon supporting case-study cards">
        <article className="oleocon-catalog-support-card">
          <div className="oleocon-catalog-media-slot" aria-label="Catalog render image placeholder" />

          <div className="oleocon-catalog-card-copy">
            <p className="oleocon-catalog-card-kicker">Catalog render</p>
            <h2 className="oleocon-type3-title" data-oleocon-type="title-3"><ResponsiveCopy value={SECTION_04_RESPONSIVE_COPY.cardTitles.renders} /></h2>
            <p className="oleocon-catalog-card-body oleocon-type1-body-desktop-only oleocon-type1-body-tablet-mobile oleocon-type2-body" data-oleocon-type="body-2">High-detail product renders ready for print and digital catalogs.</p>
            <a className="oleocon-catalog-card-link" href="#specs">View example <span>→</span></a>
          </div>
        </article>

        <article className="oleocon-catalog-support-card">
          <div className="oleocon-catalog-media-slot" aria-label="Technical detail image placeholder" />

          <div className="oleocon-catalog-card-copy">
            <p className="oleocon-catalog-card-kicker">Technical detail</p>
            <h2 className="oleocon-type3-title" data-oleocon-type="title-3"><ResponsiveCopy value={SECTION_04_RESPONSIVE_COPY.cardTitles.communication} /></h2>
            <p className="oleocon-catalog-card-body oleocon-type1-body-desktop-only oleocon-type1-body-tablet-mobile oleocon-type2-body" data-oleocon-type="body-2">Cutaways and close-ups that make the engineering easy to understand.</p>
            <a className="oleocon-catalog-card-link" href="#materials">View example <span>→</span></a>
          </div>
        </article>

        <article className="oleocon-catalog-support-card">
          <div className="oleocon-catalog-media-slot" aria-label="Product video image placeholder" />

          <div className="oleocon-catalog-card-copy">
            <p className="oleocon-catalog-card-kicker">Product video</p>
            <h2 className="oleocon-type3-title" data-oleocon-type="title-3"><ResponsiveCopy value={SECTION_04_RESPONSIVE_COPY.cardTitles.video} /></h2>
            <p className="oleocon-catalog-card-body oleocon-type1-body-desktop-only oleocon-type1-body-tablet-mobile oleocon-type2-body" data-oleocon-type="body-2">Cinematic product videos built from the same 3D foundation.</p>
            <a className="oleocon-catalog-card-link" href="#final">View example <span>→</span></a>
          </div>
        </article>
      </div>
    </div>
  );
}


function Section09SupportIcon({ icon }: { icon: (typeof SECTION_09_SUPPORT_ITEMS)[number]["icon"] }) {
  switch (icon) {
    case "cloud":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.4 17.8h9.5a4.1 4.1 0 0 0 .5-8.2 5.5 5.5 0 0 0-10.5 1.5 3.35 3.35 0 0 0 .5 6.7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 14.2h6M10.3 11.9h3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 19 6v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6l7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.15" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 1.8v3.1M12 19.1v3.1M1.8 12h3.1M19.1 12h3.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5.3" y="10.4" width="13.4" height="9.2" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8.4 10.4V8.2a3.6 3.6 0 0 1 7.2 0v2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 13.7v2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.8 12h16.4M12 3c2.1 2.3 3.3 5.4 3.3 9s-1.2 6.7-3.3 9M12 3c-2.1 2.3-3.3 5.4-3.3 9s1.2 6.7 3.3 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function Section09LongTermInvestment() {
  const [activeFutureItem, setActiveFutureItem] = useState(0);
  const [isFutureItemVisible, setIsFutureItemVisible] = useState(true);

  useEffect(() => {
    const holdDuration = 3500;
    const fadeDuration = 640;
    let holdTimer = 0;
    let swapTimer = 0;
    let fadeFrameOne = 0;
    let fadeFrameTwo = 0;
    let isDisposed = false;

    const queueNextFutureItem = () => {
      holdTimer = window.setTimeout(() => {
        setIsFutureItemVisible(false);

        swapTimer = window.setTimeout(() => {
          if (isDisposed) return;

          setActiveFutureItem((current) => (current + 1) % SECTION_09_TOP_FEATURES.length);
          fadeFrameOne = window.requestAnimationFrame(() => {
            fadeFrameTwo = window.requestAnimationFrame(() => {
              if (isDisposed) return;
              setIsFutureItemVisible(true);
              queueNextFutureItem();
            });
          });
        }, fadeDuration);
      }, holdDuration);
    };

    queueNextFutureItem();

    return () => {
      isDisposed = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(swapTimer);
      window.cancelAnimationFrame(fadeFrameOne);
      window.cancelAnimationFrame(fadeFrameTwo);
    };
  }, []);

  return (
    <>
      <div className="section09-top-layout">
        <div className="section09-top-copy">
          <div className="section09-story-index">
            <span>09</span>
            <i />
            <span>A LONG-TERM INVESTMENT</span>
          </div>
          <p className="section09-story-eyebrow">BUILT TO SCALE FOR THE FUTURE</p>
          <h2 className="section09-story-title" aria-label="Built for today, ready for tomorrow.">
            <span className="section09-story-title-part">Built for</span>
            <span className="section09-story-title-part">today,</span>
            <span className="section09-story-title-part">ready for</span>
            <span className="section09-story-title-part is-green">tomorrow.</span>
            <span className="section09-story-title-tablet-line">Built for today,</span>
            <span className="section09-story-title-tablet-line">ready for <em>tomorrow.</em></span>
          </h2>
          <p className="section09-story-body">
            <span>From a 3D model to immersive experiences.</span>
            <span>One digital foundation, endless possibilities.</span>
          </p>
        </div>

        <div className="section09-top-visual">
          <picture>
            <source media="(max-width: 760px)" srcSet={SECTION_09_HERO_MOBILE_IMAGE_URL} />
            <img className="section09-hero-image" src={SECTION_09_HERO_IMAGE_URL} alt="" draggable={false} />
          </picture>

          <aside className="section09-future-panel" aria-label="Long-term system benefits">
            <div className="section09-future-dots" aria-hidden="true">
              {SECTION_09_TOP_FEATURES.map((item, itemIndex) => (
                <span
                  key={`section09-future-dot-${item.title}`}
                  className={`section09-future-dot ${itemIndex === activeFutureItem ? "is-active" : ""}`}
                />
              ))}
            </div>

            {SECTION_09_TOP_FEATURES.map((item, itemIndex) => (
              <article
                key={item.title}
                className={`section09-future-item ${itemIndex === activeFutureItem ? "is-current" : ""} ${itemIndex === activeFutureItem && isFutureItemVisible ? "is-visible" : ""}`}
                aria-hidden={itemIndex !== activeFutureItem}
              >
                <img className="section09-future-icon" src={item.icon} alt="" aria-hidden="true" draggable={false} />
                <div className="section09-future-copy">
                  <h3>{item.title}</h3>
                  <p>
                    {item.body.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </aside>
        </div>
      </div>

      <div className="section09-bottom-showcase">
        <div className="section09-card-grid">
          {SECTION_09_SHOWCASE_CARDS.map((card) => (
            <article key={card.title} className={`section09-showcase-card is-${card.align}`} aria-label={card.title.replace(/\n/g, " ")}>
              <div className="section09-showcase-media">
                <img className="section09-showcase-image" src={card.image} alt="" draggable={false} />
              </div>
              <div className="section09-showcase-overlay section09-showcase-info">
                <div className="section09-showcase-copy">
                  <h3>{card.title}</h3>
                  <p className="section09-showcase-body">{card.body}</p>
                </div>
                <p className="section09-showcase-cta">{card.eyebrow}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="section09-support-row">
          {SECTION_09_SUPPORT_ITEMS.map((item) => (
            <article key={item.title} className="section09-support-card">
              <span className="section09-support-icon" aria-hidden="true">
                <Section09SupportIcon icon={item.icon} />
              </span>
              <div className="section09-support-copy">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}


/* --------------------------------------------------
   SECTION 10 — INDUSTRIAL VIEWER ACCESS REQUEST
   Copied from the standalone 3D Viewer access-code/request flow.
-------------------------------------------------- */
type Section10AccessRequestStatus = "idle" | "loading" | "success" | "error";

const SECTION10_ACCESS_REQUEST_SLIDE_DISTANCE = 94;
const SECTION10_APPROVED_ACCESS_CODES = ["R34"] as const;
const SECTION10_APPROVED_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "yahoo.com",
  "protonmail.com",
  "zoho.com",
  "aol.com",
  "mail.com",
] as const;

const SECTION10_INDUSTRIAL_ACCESS_COPY = {
  eyebrow: "Model Library",
  title: "Enter code",
  body: "Browse more models is part of the full CTS interactive model library. Enter the access code to continue to the entire library.",
  passwordLabel: "Library access code",
  placeholder: "Enter code",
  requestButton: "Request Access",
  lockedMessage: "This code is not authorized for the model library. Please enter the access code provided by CTS Studio.",
} as const;

function normalizeSection10AccessRequestIdentity(value: string) {
  return value.trim();
}

function isApprovedSection10AccessCode(value: string) {
  const normalizedValue = value.trim().toUpperCase();
  return /^[A-Z]\d{2}$/.test(normalizedValue) && SECTION10_APPROVED_ACCESS_CODES.includes(normalizedValue as (typeof SECTION10_APPROVED_ACCESS_CODES)[number]);
}

function looksLikeSection10AccessCode(value: string) {
  return /^[A-Za-z]\d{2}$/.test(value.trim());
}

function isValidSection10DotComEmail(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/^([a-z0-9._%+-]+)@([a-z0-9.-]+\.com)$/i);
  if (!match) return false;

  const localPart = match[1] ?? "";
  const domain = match[2] ?? "";
  const domainName = domain.split(".")[0] ?? "";

  if (localPart.length < 2 || domainName.length < 4) return false;

  return SECTION10_APPROVED_EMAIL_DOMAINS.includes(domain as (typeof SECTION10_APPROVED_EMAIL_DOMAINS)[number]);
}



function OleoconDesktopScrollRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;

    let frame = 0;
    let dragging = false;
    let startPointerY = 0;
    let startScrollY = 0;
    let activePointerId = -1;

    const readMetrics = () => {
      const viewportHeight = Math.max(1, window.innerHeight);
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        viewportHeight
      );
      const maxScroll = Math.max(0, documentHeight - viewportHeight);
      const railHeight = Math.max(1, rail.clientHeight || viewportHeight);
      const thumbHeight = maxScroll > 0
        ? Math.max(72, Math.min(railHeight, railHeight * (viewportHeight / documentHeight)))
        : railHeight;
      const maxThumbTop = Math.max(0, railHeight - thumbHeight);

      return { maxScroll, thumbHeight, maxThumbTop };
    };

    const paint = () => {
      frame = 0;
      const { maxScroll, thumbHeight, maxThumbTop } = readMetrics();
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translate3d(0, ${progress * maxThumbTop}px, 0)`;
      rail.classList.toggle('is-disabled', maxScroll <= 0);
    };

    const requestPaint = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (window.innerWidth <= 1180 || event.button !== 0) return;
      dragging = true;
      activePointerId = event.pointerId;
      startPointerY = event.clientY;
      startScrollY = window.scrollY;
      thumb.classList.add('is-dragging');
      thumb.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      const { maxScroll, maxThumbTop } = readMetrics();
      if (maxScroll <= 0 || maxThumbTop <= 0) return;

      const deltaY = event.clientY - startPointerY;
      window.scrollTo({
        top: Math.min(maxScroll, Math.max(0, startScrollY + (deltaY / maxThumbTop) * maxScroll)),
        behavior: 'auto',
      });
      event.preventDefault();
    };

    const endDrag = (event?: PointerEvent) => {
      if (!dragging) return;
      if (event && event.pointerId !== activePointerId) return;
      dragging = false;
      thumb.classList.remove('is-dragging');
      if (activePointerId >= 0 && thumb.hasPointerCapture?.(activePointerId)) {
        thumb.releasePointerCapture?.(activePointerId);
      }
      activePointerId = -1;
    };

    thumb.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('scroll', requestPaint, { passive: true });
    window.addEventListener('resize', requestPaint);

    paint();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      thumb.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('scroll', requestPaint);
      window.removeEventListener('resize', requestPaint);
    };
  }, []);

  return (
    <div className="oleocon-desktop-scroll-rail" ref={railRef} aria-hidden="true">
      <div className="oleocon-desktop-scroll-thumb" ref={thumbRef} />
    </div>
  );
}

export default function OleoconPage() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const afterSectionRef = useRef<HTMLElement | null>(null);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const ledRigRef = useRef<THREE.Group | null>(null);
  const partsRef = useRef<PartRecord[]>([]);
  const stageProgressRef = useRef(0);
  const calloutOpacityRef = useRef(0);
  const frameRef = useRef(0);
  const section05RotationRef = useRef({
    isDragging: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    targetX: 0,
    targetY: 0,
    smoothTargetX: 0,
    smoothTargetY: 0,
    currentX: 0,
    currentY: 0,
    velocityX: 0,
    velocityY: 0,
  });

  const [activeStage, setActiveStage] = useState(0);
  const activeStageRef = useRef(0);
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(false);
  const lastScrollYRef = useRef(0);
  const [isSection09MotionReady, setIsSection09MotionReady] = useState(false);
  const [loadState, setLoadState] = useState("Loading Oleocon FBX...");
  const [labels, setLabels] = useState<PartLabel[]>([]);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOrTabletViewport, setIsMobileOrTabletViewport] = useState(false);
  const [isLaptopViewport, setIsLaptopViewport] = useState(false);
  const [section07InspectionMode, setSection07InspectionMode] = useState<Section07InspectionMode>("default");
  const section07InspectionModeRef = useRef<Section07InspectionMode>("default");
  const isMobileRef = useRef(false);
  const lastAppliedSection07InspectionModeRef = useRef<Section07InspectionMode | "inactive">("inactive");
  const section07LookEdgeOverlaysRef = useRef<Map<string, THREE.LineSegments>>(new Map());

  const [isSection10IndustrialAccessOpen, setIsSection10IndustrialAccessOpen] = useState(false);
  const [section10IndustrialAccessPassword, setSection10IndustrialAccessPassword] = useState("");
  const [section10IndustrialAccessMessage, setSection10IndustrialAccessMessage] = useState("");
  const [isSection10AccessRequestOpen, setIsSection10AccessRequestOpen] = useState(false);
  const [section10AccessRequestIdentity, setSection10AccessRequestIdentity] = useState("");
  const [section10AccessRequestStatus, setSection10AccessRequestStatus] = useState<Section10AccessRequestStatus>("idle");
  const [section10AccessRequestProgress, setSection10AccessRequestProgress] = useState(0);
  const section10AccessRequestDragRef = useRef<{ pointerId: number | null; startX: number; startProgress: number }>({ pointerId: null, startX: 0, startProgress: 0 });

  const active = useMemo(() => STAGES[activeStage], [activeStage]);


  const resetSection10IndustrialAccessFlow = () => {
    section10AccessRequestDragRef.current = { pointerId: null, startX: 0, startProgress: 0 };
    setIsSection10AccessRequestOpen(false);
    setSection10AccessRequestIdentity("");
    setSection10AccessRequestStatus("idle");
    setSection10AccessRequestProgress(0);
  };

  const openSection10IndustrialAccess = () => {
    setIsSection10IndustrialAccessOpen(true);
    setSection10IndustrialAccessPassword("");
    setSection10IndustrialAccessMessage("");
    resetSection10IndustrialAccessFlow();
  };

  const closeSection10IndustrialAccess = () => {
    setIsSection10IndustrialAccessOpen(false);
    setSection10IndustrialAccessPassword("");
    setSection10IndustrialAccessMessage("");
    resetSection10IndustrialAccessFlow();
  };

  const submitSection10IndustrialAccess = (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSection10IndustrialAccessMessage(SECTION10_INDUSTRIAL_ACCESS_COPY.lockedMessage);
  };

  const sendSection10AccessRequest = () => {
    if (section10AccessRequestStatus === "loading" || section10AccessRequestStatus === "success") return;

    const identity = normalizeSection10AccessRequestIdentity(section10AccessRequestIdentity);
    const approvedCode = isApprovedSection10AccessCode(identity);
    const validEmail = isValidSection10DotComEmail(identity);

    if (!identity) {
      setSection10AccessRequestStatus("error");
      setSection10AccessRequestProgress(0);
      setSection10IndustrialAccessMessage("Please enter your email or client account ID so CTS can prepare the access request for you.");
      return;
    }

    if (!approvedCode && !validEmail) {
      setSection10AccessRequestStatus("error");
      setSection10AccessRequestProgress(0);
      setSection10IndustrialAccessMessage(
        looksLikeSection10AccessCode(identity)
          ? "This access code has the right format, but it is not approved. Use the code provided by CTS."
          : "Enter an approved access code, or a supported .com email address."
      );
      return;
    }

    setSection10AccessRequestStatus("loading");
    setSection10IndustrialAccessMessage("Checking your access request for CTS.");

    window.setTimeout(() => {
      setSection10AccessRequestStatus("success");
      setSection10AccessRequestProgress(1);
      setSection10IndustrialAccessMessage(
        approvedCode
          ? `Request sent with approved code ${identity.toUpperCase()}. CTS will continue the access process.`
          : `Request sent. CTS will use ${identity} to follow up with access details.`
      );
    }, 900);
  };

  const requestSection10IndustrialAccess = () => {
    setIsSection10AccessRequestOpen(true);
    setSection10AccessRequestStatus("idle");
    setSection10AccessRequestProgress(0);
    setSection10IndustrialAccessMessage("Please enter your email or client account ID. We will automate the access request message for you.");
  };

  const startSection10AccessRequestSlide = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSection10AccessRequestOpen || section10AccessRequestStatus === "loading" || section10AccessRequestStatus === "success") return;

    event.preventDefault();
    section10AccessRequestDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startProgress: section10AccessRequestProgress };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Touch browsers can reject pointer capture; local pointer events still continue while the control is held.
    }
  };

  const moveSection10AccessRequestSlide = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = section10AccessRequestDragRef.current;
    if (drag.pointerId !== event.pointerId || section10AccessRequestStatus === "loading" || section10AccessRequestStatus === "success") return;

    event.preventDefault();
    const nextProgress = clamp(drag.startProgress + (event.clientX - drag.startX) / SECTION10_ACCESS_REQUEST_SLIDE_DISTANCE, 0, 1);
    setSection10AccessRequestProgress(nextProgress);
  };

  const finishSection10AccessRequestSlide = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = section10AccessRequestDragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const finalProgress = event.type === "pointercancel"
      ? 0
      : clamp(drag.startProgress + (event.clientX - drag.startX) / SECTION10_ACCESS_REQUEST_SLIDE_DISTANCE, 0, 1);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may already be released by the browser.
    }

    section10AccessRequestDragRef.current = { pointerId: null, startX: 0, startProgress: 0 };
    setSection10AccessRequestProgress(finalProgress);

    if (finalProgress >= 0.9) {
      sendSection10AccessRequest();
      return;
    }

    setSection10AccessRequestProgress(0);
  };


  useEffect(() => {
    section07InspectionModeRef.current = section07InspectionMode;
  }, [section07InspectionMode]);

  useEffect(() => {
    const isFinalStage = STAGES[activeStage]?.id === "final";
    const isAfterSectionActive = activeNavIndex === STAGES.length;

    if (!isFinalStage || isAfterSectionActive) {
      setIsSection09MotionReady(false);
      return;
    }

    setIsSection09MotionReady(false);
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setIsSection09MotionReady(true);
      });
    });

    return () => {
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [activeStage, activeNavIndex]);

  useEffect(() => {
    const checkMobile = () => {
      const viewportWidthNow = window.innerWidth;
      const nextIsMobile = viewportWidthNow <= 480;
      const nextIsMobileOrTablet = viewportWidthNow <= 1180;
      const nextIsLaptop = viewportWidthNow >= 1181 && (viewportWidthNow <= 1600 || window.innerHeight <= 900);
      isMobileRef.current = nextIsMobile;
      setIsMobile(nextIsMobile);
      setIsMobileOrTabletViewport(nextIsMobileOrTablet);
      setIsLaptopViewport(nextIsLaptop);

      if (!nextIsMobileOrTablet) {
        setIsMobileHeaderVisible(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // صفحه Oleocon نباید Header را force-style کند.
    // Header باید در SiteHeader خودش theme بگیرد؛ نه از داخل این صفحه.
    // این کار جلوی پریدن لوگو، گیر کردن underline، و ماندن glass island را می‌گیرد.
    document.body.classList.add("ctsOleoconPageActive");
    document.body.setAttribute("data-cts-oleocon-version", "header-safe-v4");
    document.documentElement.classList.add("ctsOleoconPageScrollActive");

    return () => {
      document.body.classList.remove("ctsOleoconPageActive");
      document.body.removeAttribute("data-cts-oleocon-version");
      document.documentElement.classList.remove("ctsOleoconPageScrollActive");
    };
  }, []);

  useEffect(() => {
    const section05 = pageRef.current?.querySelector<HTMLElement>("#model");
    if (!section05) return;

    const featureItems = Array.from(
      section05.querySelectorAll<HTMLElement>("[data-section05-reveal-item]")
    );

    if (featureItems.length === 0) return;

    featureItems.forEach((item) => item.classList.remove("is-section05-in-view"));

    if (!("IntersectionObserver" in window)) {
      featureItems.forEach((item) => item.classList.add("is-section05-in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.52) return;

          const item = entry.target as HTMLElement;
          item.classList.add("is-section05-in-view");
          observer.unobserve(item);
        });
      },
      {
        threshold: [0, 0.18, 0.35, 0.52, 0.72, 1],
        rootMargin: "0px 0px -8% 0px",
      }
    );

    featureItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let resizeFrame = 0;
    let scrollFrame = 0;
    let upwardTravel = 0;
    let downwardTravel = 0;

    const updateScroll = () => {
      scrollFrame = 0;

      const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
      if (sections.length === 0) return;

      const currentScrollY = Math.max(0, window.scrollY);
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (Math.abs(scrollDelta) > 0.25) {
        const nextDirection = scrollDelta < 0 ? "up" : "down";
        setScrollDirection((prev) => (prev === nextDirection ? prev : nextDirection));
      }

      const marker = currentScrollY + window.innerHeight * 0.45;
      let index = 0;

      for (let i = 0; i < sections.length; i += 1) {
        if (marker >= sections[i].offsetTop) index = i;
      }

      const isMobileOrTabletNow = window.innerWidth <= 1180;

      if (isMobileOrTabletNow) {
        if (index === 0 || currentScrollY <= 4) {
          upwardTravel = 0;
          downwardTravel = 0;
          setIsMobileHeaderVisible(true);
        } else if (scrollDelta < -0.25) {
          upwardTravel += Math.abs(scrollDelta);
          downwardTravel = 0;

          if (upwardTravel >= 4) {
            setIsMobileHeaderVisible(true);
            upwardTravel = 0;
          }
        } else if (scrollDelta > 0.25) {
          downwardTravel += scrollDelta;
          upwardTravel = 0;

          if (downwardTravel >= 8) {
            setIsMobileHeaderVisible(false);
            downwardTravel = 0;
          }
        }
      } else {
        upwardTravel = 0;
        downwardTravel = 0;
        setIsMobileHeaderVisible(false);
      }

      const current = sections[index];
      const next = sections[Math.min(index + 1, sections.length - 1)];
      const span = Math.max(1, next.offsetTop - current.offsetTop);
      const local = current === next ? 0 : clamp01((marker - current.offsetTop) / span);
      const afterSection = afterSectionRef.current;
      const afterTop = afterSection ? afterSection.offsetTop : Number.POSITIVE_INFINITY;
      const afterHeight = afterSection ? Math.max(afterSection.offsetHeight, window.innerHeight) : window.innerHeight;
      const viewportBottom = currentScrollY + window.innerHeight;
      const afterVisibleEnough = Boolean(
        afterSection && viewportBottom >= afterTop + Math.min(afterHeight * 0.22, window.innerHeight * 0.28)
      );
      const afterAtMarker = Boolean(afterSection && marker >= afterTop - window.innerHeight * 0.04);
      const navIndex = afterVisibleEnough || afterAtMarker ? STAGES.length : index;

      lastScrollYRef.current = currentScrollY;
      activeStageRef.current = index;
      stageProgressRef.current = clamp(index + local, 0, STAGES.length - 1);
      setActiveStage((prev) => (prev === index ? prev : index));
      setActiveNavIndex((prev) => (prev === navIndex ? prev : navIndex));
    };

    const requestScrollUpdate = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateScroll);
    };

    const updateScrollOnResize = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        updateScroll();
      });
    };

    lastScrollYRef.current = Math.max(0, window.scrollY);
    updateScroll();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", updateScrollOnResize);

    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", updateScrollOnResize);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null; // بدون fog؛ پس‌زمینه باید خاکستری noisy و شفاف بماند.

    const camera = new THREE.PerspectiveCamera(
      31,
      Math.max(1, viewport.clientWidth) / Math.max(1, viewport.clientHeight),
      0.01,
      100
    );
    camera.position.set(...OLEOCON_LOCKED_CAMERA_POSITION);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // canvas شفاف است تا background خاکستری/noisy CSS دیده شود.
      powerPreference: "high-performance",
    });
    renderer.setClearColor(new THREE.Color(WEBGL_BACKGROUND), 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2)); // [PERFORMANCE] کمتر = سبک‌تر؛ 1.2 برای صفحه ویدئویی امن‌تر از 1.55 است.
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = false; // [PERFORMANCE] صفحه چند ویدئو دارد؛ shadow map خاموش است تا lag کمتر شود.
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    let currentEnvMap: THREE.Texture | null = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = currentEnvMap;

    new RGBELoader().load(
      HDR_URL,
      (hdr) => {
        const hdrEnvMap = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();

        if (currentEnvMap) currentEnvMap.dispose();
        currentEnvMap = hdrEnvMap;
        scene.environment = hdrEnvMap;
      },
      undefined,
      () => {
        setLoadState((prev) => `${prev} / HDRI fallback active`);
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = false; // سکشن ۵ مدل را می‌چرخاند، نه دوربین را؛ بقیه سکشن‌ها هم interactive نیستند.
    controls.rotateSpeed = 0.42;
    controls.target.set(...OLEOCON_LOCKED_CAMERA_TARGET);
    controlsRef.current = controls;

    const ambient = new THREE.HemisphereLight("#ffffff", "#20211f", 0.9);
    scene.add(ambient);

    const key = new THREE.DirectionalLight("#ffffff", 2.55);
    key.position.set(4.8, 5.8, 4.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); // [PERFORMANCE] اگر سایه را روشن کردی، از 1024 شروع کن نه 2048.
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 22;
    scene.add(key);

    const coldRim = new THREE.DirectionalLight(OLEOCON_GREEN, 1.65);
    coldRim.position.set(-5.8, 1.9, -4.7);
    scene.add(coldRim);

    const hotRim = new THREE.DirectionalLight("#e8f4df", 0.62);
    hotRim.position.set(5.8, 0.5, -4.2);
    scene.add(hotRim);

    // Floor intentionally removed: the product must float in space, not sit on a table.

    const ledRig = new THREE.Group();
    ledRig.name = "oleocon_led_depth_rig";

    const blueLed = new THREE.MeshBasicMaterial({
      color: OLEOCON_GREEN,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
    });
    const redLed = new THREE.MeshBasicMaterial({
      color: "#f2f7ed",
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 14; i += 1) {
      const geo = new THREE.BoxGeometry(0.018, 0.018, 4.2);
      const rail = new THREE.Mesh(geo, i % 3 === 0 ? redLed : blueLed);
      const side = i % 2 === 0 ? -1 : 1;
      rail.position.set(side * (3.2 + (i % 4) * 0.55), -1.18 + (i % 3) * 0.18, -4.5 - i * 0.34);
      rail.rotation.y = side * 0.28;
      ledRig.add(rail);
    }
    scene.add(ledRig);
    ledRigRef.current = ledRig;

    const pivot = new THREE.Group();
    pivot.name = "oleocon_universal_center_pivot";
    scene.add(pivot);
    pivotRef.current = pivot;

    const textureLoader = new THREE.TextureLoader();
    const oleoconBump = loadTexture(textureLoader, `${TEXTURE_BASE}oleoconBump.png`, THREE.NoColorSpace);
    configureOleoconBumpTexture(oleoconBump);

    const loader = new FBXLoader();
    loader.setResourcePath(TEXTURE_BASE);
    loader.load(
      MODEL_URL,
      (fbx) => {
        fbx.name = "oleocon_fbx_root";

        const model = new THREE.Group();
        model.name = "oleocon_centered_model";
        model.add(fbx);
        pivot.add(model);
        modelRef.current = model;

        fbx.updateMatrixWorld(true);
        const rawBox = new THREE.Box3().setFromObject(fbx);
        const rawCenter = rawBox.getCenter(new THREE.Vector3());
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;

        // [CRITICAL FIX] مرکز مدل باید بعد از scale درست روی pivot بنشیند.
        // Three.js position را با scale ضرب نمی‌کند؛ پس اگر rawCenter را قبل از scale کم کنیم، مدل از pivot پرت می‌شود.
        const normalizeScale = MODEL_TARGET_SIZE / maxAxis;
        fbx.scale.setScalar(normalizeScale);
        fbx.position.copy(rawCenter).multiplyScalar(-normalizeScale);
        fbx.updateMatrixWorld(true);

        const meshItems: THREE.Mesh[] = [];
        const debugRows: string[] = [];
        let meshIndex = 0;

        fbx.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;

          if (mesh.geometry) {
            mesh.geometry.computeBoundingBox();
            mesh.geometry.computeBoundingSphere();

            if (REPAIR_NORMALS_FOR_WEB) {
              const repaired = toCreasedNormals(
                mesh.geometry,
                THREE.MathUtils.degToRad(CREASE_ANGLE_DEGREES)
              );
              mesh.geometry.dispose();
              mesh.geometry = repaired;
              mesh.geometry.computeBoundingBox();
              mesh.geometry.computeBoundingSphere();
            }
          }

          const oldMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const newMaterials = oldMaterials.map((mat, matIndex) => {
            const sourceName = mat?.name || `Material_${matIndex + 1}`;
            debugRows.push(`${mesh.name || `Mesh_${meshIndex + 1}`} | ${sourceName}`);

            return makeOleoconMaterial(mesh.name || `Mesh_${meshIndex + 1}`, mat, meshIndex + matIndex, {
              oleoconBump,
            });
          });

          mesh.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials;
          meshItems.push(mesh);
          meshIndex += 1;
        });

        console.group("Oleocon FBX mesh/material names");
        debugRows.forEach((row) => console.log(row));
        console.groupEnd();

        const sorted = meshItems
          .map((mesh) => {
            const box = new THREE.Box3().setFromObject(mesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const volume = Math.max(0.0001, size.x * size.y * size.z);
            return { mesh, center, size, volume };
          })
          .sort((a, b) => a.center.x - b.center.x || b.volume - a.volume);

        const verticalSorted = [...sorted].sort((a, b) => b.center.y - a.center.y || b.volume - a.volume);
        const verticalOffsets = new Map<THREE.Mesh, THREE.Vector3>();
        let stackCursor = 0;
        let previousHalfHeight = 0;
        const desiredYValues: number[] = [];

        verticalSorted.forEach((item, index) => {
          const radialSize = Math.max(item.size.x, item.size.z);
          const visualHalfHeight = radialSize * SECTION_06_VERTICAL_EXPLODE_RADIAL_HALF_FACTOR;
          const halfHeight = Math.max(
            SECTION_06_VERTICAL_EXPLODE_MIN_HALF_HEIGHT,
            item.size.y * 0.5,
            visualHalfHeight
          );

          if (index === 0) {
            stackCursor = 0;
          } else {
            stackCursor -= previousHalfHeight + halfHeight + SECTION_06_VERTICAL_EXPLODE_GAP;
          }

          desiredYValues.push(stackCursor);
          previousHalfHeight = halfHeight;
        });

        const stackCenter = desiredYValues.length > 0
          ? (Math.max(...desiredYValues) + Math.min(...desiredYValues)) * 0.5
          : 0;

        verticalSorted.forEach((item, index) => {
          const centeredTargetY = desiredYValues[index] - stackCenter;
          const targetY = centeredTargetY > SECTION_06_VERTICAL_TOP_GROUP_START_Y
            ? centeredTargetY - SECTION_06_VERTICAL_TOP_GROUP_PULL_DOWN
            : centeredTargetY;
          const centeredTargetX = item.center.x * SECTION_06_VERTICAL_EXPLODE_X_RELATIVE;
          const centeredTargetZ = item.center.z * SECTION_06_VERTICAL_EXPLODE_Z_RELATIVE;
          const lowerName = (item.mesh.name || "").toLowerCase();
          const ballLikeByName = lowerName.includes("ball") || lowerName.includes("sphere");
          const ballLikeByShape =
            item.size.x <= SECTION_06_BALLS_MAX_SIZE &&
            item.size.y <= SECTION_06_BALLS_MAX_SIZE &&
            item.size.z <= SECTION_06_BALLS_MAX_SIZE &&
            Math.max(item.size.x, item.size.y, item.size.z) / Math.max(0.0001, Math.min(item.size.x, item.size.y, item.size.z)) < 2.2;
          const ballClusterByShape =
            item.size.y <= SECTION_06_BALLS_MAX_SIZE * 0.34 &&
            item.size.z <= SECTION_06_BALLS_MAX_SIZE * 0.52 &&
            item.size.x <= SECTION_06_BALLS_MAX_SIZE * 2.2;
          const isBallClusterPart = ballLikeByName || ballLikeByShape || ballClusterByShape;
          const ballZDirection = item.center.z < -0.03 ? -1 : 1;
          const targetZ = isBallClusterPart ? ballZDirection * SECTION_06_BALLS_Z_EXPAND : centeredTargetZ;

          verticalOffsets.set(
            item.mesh,
            new THREE.Vector3(
              centeredTargetX - item.center.x,
              targetY - item.center.y,
              targetZ - item.center.z
            )
          );
        });

        const total = sorted.length;
        const spacing = total <= 1 ? 0 : EXPLODE_WIDTH / Math.max(1, total - 1);

        partsRef.current = sorted.map((item, index) => {
          const normalizedIndex = index - (total - 1) / 2;
          return {
            id: `${item.mesh.uuid}-${index}`,
            name: cleanPartName(item.mesh.name || `Part ${index + 1}`),
            mesh: item.mesh,
            originalPosition: item.mesh.position.clone(),
            targetOffset: new THREE.Vector3(
              normalizedIndex * spacing,
              Math.sin(index * 1.75) * EXPLODE_HEIGHT,
              Math.cos(index * 1.18) * EXPLODE_DEPTH
            ),
            verticalExplodeOffset: verticalOffsets.get(item.mesh) ?? new THREE.Vector3(0, 0, 0),
            materialList: getMaterials(item.mesh),
            volume: item.volume,
          };
        });

        setLoadState(`FBX loaded / ${partsRef.current.length} mesh parts detected`);
      },
      (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setLoadState(`Loading Oleocon FBX... ${percent}%`);
      },
      (error) => {
        console.error(error);
        setLoadState("FBX failed. Check /public/3d_models/oleocon/oleocon.fbx");
      }
    );

    const updateLabels = () => {
      const cameraNow = cameraRef.current;
      const viewportNow = viewportRef.current;
      const parts = partsRef.current;
      const calloutOpacity = calloutOpacityRef.current;
      const width = viewportNow?.clientWidth ?? 0;
      const height = viewportNow?.clientHeight ?? 0;
      const baseStageIndex = clamp(Math.floor(stageProgressRef.current), 0, STAGES.length - 1);
      const isSection07AddNoteActive =
        STAGES[baseStageIndex]?.id === "specs" && section07InspectionModeRef.current === "add-note";

      if (!cameraNow || !viewportNow || parts.length === 0) {
        setLabels([]);
        return;
      }

      if (isSection07AddNoteActive) {
        const targetPart = getSection07MainCouplingSleeveTargetPart(parts);
        if (!targetPart) {
          setLabels([]);
          return;
        }

        const box = new THREE.Box3().setFromObject(targetPart.mesh);
        const world = box.getCenter(new THREE.Vector3());
        const projected = world.clone().project(cameraNow);
        const x1 = (projected.x * 0.5 + 0.5) * width;
        const y1 = (-projected.y * 0.5 + 0.5) * height;
        const noteHalfWidth = Math.min(340, width * 0.26) * 0.5;
        const x2 = clamp(width * 0.52, 24 + noteHalfWidth, Math.max(24 + noteHalfWidth, width - noteHalfWidth - 24));
        const y2 = clamp(height * 0.36, height * 0.16, height * 0.72);

        setLabels([
          {
            id: `section07-note-${targetPart.id}`,
            name: SECTION_07_ADD_NOTE_TEXT,
            x1,
            y1,
            x2,
            y2,
            side: "right",
            opacity: 1,
            kind: "note",
          },
        ]);
        return;
      }

      if (calloutOpacity < 0.08) {
        setLabels([]);
        return;
      }

      const selected = [...parts].sort((a, b) => b.volume - a.volume).slice(0, MAX_VISIBLE_LABELS);

      const rightRows = selected.filter((_, i) => i % 2 === 0).length;
      const leftRows = selected.length - rightRows;
      let rightIndex = 0;
      let leftIndex = 0;

      const nextLabels: PartLabel[] = selected.map((part, i) => {
        const box = new THREE.Box3().setFromObject(part.mesh);
        const world = box.getCenter(new THREE.Vector3());
        const projected = world.clone().project(cameraNow);

        const x1 = (projected.x * 0.5 + 0.5) * width;
        const y1 = (-projected.y * 0.5 + 0.5) * height;

        const side: "left" | "right" = i % 2 === 0 ? "right" : "left";
        const rowCount = side === "right" ? rightRows : leftRows;
        const rowIndex = side === "right" ? rightIndex++ : leftIndex++;

        const startY = height * 0.18;
        const endY = height * 0.82;
        const y2 = rowCount <= 1 ? height * 0.5 : startY + (rowIndex / Math.max(1, rowCount - 1)) * (endY - startY);
        const x2 = side === "right" ? width - Math.min(310, width * 0.22) : Math.min(310, width * 0.22);

        return {
          id: part.id,
          name: part.name,
          x1,
          y1,
          x2,
          y2,
          side,
          opacity: calloutOpacity,
        };
      });

      setLabels(nextLabels);
    };

    let rafId = 0;
    const clock = new THREE.Clock();
    let section06HoveredPart: PartRecord | null = null;
    let section06TappedPart: PartRecord | null = null;
    const section06Pointer = new THREE.Vector2();
    const section06Raycaster = new THREE.Raycaster();

    const isSection05RotationStageActive = () => {
      if (isMobileRef.current || window.innerWidth <= 480) return false;
      return getSection05RotationWeight(stageProgressRef.current) > 0.08;
    };

    const updateSection05Cursor = () => {
      if (!isSection05RotationStageActive()) {
        if (!section06HoveredPart) renderer.domElement.style.cursor = "";
        return;
      }

      renderer.domElement.style.cursor = section05RotationRef.current.isDragging ? "grabbing" : "grab";
    };

    const endSection05Drag = (event?: PointerEvent) => {
      const drag = section05RotationRef.current;

      if (event && drag.pointerId !== event.pointerId) return;

      if (drag.isDragging && event) {
        try {
          renderer.domElement.releasePointerCapture(event.pointerId);
        } catch {
          // Pointer may already be released by the browser.
        }
      }

      drag.isDragging = false;
      drag.pointerId = -1;
      updateSection05Cursor();
    };

    const handleSection05PointerDown = (event: PointerEvent) => {
      if (!isSection05RotationStageActive() || event.button !== 0) return;

      const drag = section05RotationRef.current;
      drag.isDragging = true;
      drag.pointerId = event.pointerId;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.velocityX = 0;
      drag.velocityY = 0;

      try {
        renderer.domElement.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers skip capture on non-primary touch; window listeners still handle movement.
      }

      renderer.domElement.style.cursor = "grabbing";
      event.preventDefault();
    };

    const handleSection05PointerMove = (event: PointerEvent) => {
      const drag = section05RotationRef.current;

      if (!drag.isDragging || drag.pointerId !== event.pointerId) return;

      if (!isSection05RotationStageActive()) {
        endSection05Drag(event);
        return;
      }

      const deltaX = event.clientX - drag.lastX;
      const deltaY = event.clientY - drag.lastY;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;

      drag.velocityY = deltaX * SECTION_05_DRAG_ROTATION_SPEED_X;
      drag.velocityX = deltaY * SECTION_05_DRAG_ROTATION_SPEED_Y;
      drag.targetY += drag.velocityY;
      drag.targetX = THREE.MathUtils.clamp(
        drag.targetX + drag.velocityX,
        -SECTION_05_DRAG_MAX_TILT,
        SECTION_05_DRAG_MAX_TILT
      );

      event.preventDefault();
    };

    const isSection06HoverStageActive = () => {
      const baseIndex = clamp(Math.floor(stageProgressRef.current), 0, STAGES.length - 1);
      return STAGES[baseIndex]?.id === "digital-catalog";
    };

    const clearSection06HoveredPart = () => {
      const hoveredPart = section06HoveredPart;
      const tappedPart = section06TappedPart;

      if (hoveredPart) restoreSection06HoverColor(hoveredPart);
      if (tappedPart && tappedPart !== hoveredPart) restoreSection06HoverColor(tappedPart);

      section06HoveredPart = null;
      section06TappedPart = null;

      if (!isSection05RotationStageActive()) {
        renderer.domElement.style.cursor = "";
      }
    };

    const handleSection06PointerMove = (event: PointerEvent) => {
      const viewportNow = viewportRef.current;
      const cameraNow = cameraRef.current;
      const pivotNow = pivotRef.current;
      const parts = partsRef.current;

      const isTabletSection06Viewport = window.innerWidth >= 621 && window.innerWidth <= 1180;

      if (!viewportNow || !cameraNow || parts.length === 0 || !isSection06HoverStageActive()) {
        clearSection06HoveredPart();
        return;
      }

      // Tablet uses persistent tap selection instead of hover. Do not clear the tapped color on touch movement.
      if (isTabletSection06Viewport) return;

      const rect = viewportNow.getBoundingClientRect();
      const isInsideViewport =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInsideViewport) {
        clearSection06HoveredPart();
        return;
      }

      section06Pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      section06Pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;

      pivotNow?.updateMatrixWorld(true);
      section06Raycaster.setFromCamera(section06Pointer, cameraNow);

      const hits = section06Raycaster.intersectObjects(
        parts.map((part) => part.mesh),
        false
      );
      const hitMesh = hits[0]?.object as THREE.Mesh | undefined;
      const nextHoveredPart = hitMesh ? parts.find((part) => part.mesh === hitMesh) ?? null : null;

      if (!nextHoveredPart) {
        clearSection06HoveredPart();
        return;
      }

      if (section06HoveredPart?.id !== nextHoveredPart.id) {
        restoreSection06HoverColor(section06HoveredPart);
        section06HoveredPart = nextHoveredPart;
        applySection06RandomHoverColor(nextHoveredPart);
      }

      renderer.domElement.style.cursor = "crosshair";
    };

    const handleSection06TabletPointerDown = (event: PointerEvent) => {
      const isTabletViewport = window.innerWidth >= 621 && window.innerWidth <= 1180;
      if (!isTabletViewport || !isSection06HoverStageActive() || !event.isPrimary) return;

      const target = event.target as Element | null;
      if (
        target?.closest(
          ".section06-platform-library-column, .section06-platform-cta-card, button, a, input, select, textarea"
        )
      ) {
        return;
      }

      const viewportNow = viewportRef.current;
      const cameraNow = cameraRef.current;
      const pivotNow = pivotRef.current;
      const parts = partsRef.current;
      if (!viewportNow || !cameraNow || parts.length === 0) return;

      const rect = viewportNow.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }

      section06Pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      section06Pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;

      pivotNow?.updateMatrixWorld(true);
      section06Raycaster.setFromCamera(section06Pointer, cameraNow);

      const exactHits = section06Raycaster.intersectObjects(
        parts.map((part) => part.mesh),
        false
      );
      const exactMesh = exactHits[0]?.object as THREE.Mesh | undefined;
      let nextTappedPart = exactMesh ? parts.find((part) => part.mesh === exactMesh) ?? null : null;

      // Expanded screen-space hit area: fills small gaps between exploded pieces and works through text overlays.
      if (!nextTappedPart) {
        let modelMinX = Number.POSITIVE_INFINITY;
        let modelMinY = Number.POSITIVE_INFINITY;
        let modelMaxX = Number.NEGATIVE_INFINITY;
        let modelMaxY = Number.NEGATIVE_INFINITY;
        let nearestPart: PartRecord | null = null;
        let nearestDistanceSq = Number.POSITIVE_INFINITY;
        const corner = new THREE.Vector3();
        const projected = new THREE.Vector3();
        const center = new THREE.Vector3();

        parts.forEach((part) => {
          const geometry = part.mesh.geometry;
          if (!geometry.boundingBox) geometry.computeBoundingBox();
          const box = geometry.boundingBox;
          if (!box) return;

          const xs = [box.min.x, box.max.x];
          const ys = [box.min.y, box.max.y];
          const zs = [box.min.z, box.max.z];

          xs.forEach((x) => {
            ys.forEach((y) => {
              zs.forEach((z) => {
                corner.set(x, y, z).applyMatrix4(part.mesh.matrixWorld);
                projected.copy(corner).project(cameraNow);
                const screenX = rect.left + (projected.x * 0.5 + 0.5) * rect.width;
                const screenY = rect.top + (-projected.y * 0.5 + 0.5) * rect.height;
                modelMinX = Math.min(modelMinX, screenX);
                modelMinY = Math.min(modelMinY, screenY);
                modelMaxX = Math.max(modelMaxX, screenX);
                modelMaxY = Math.max(modelMaxY, screenY);
              });
            });
          });

          box.getCenter(center).applyMatrix4(part.mesh.matrixWorld).project(cameraNow);
          const centerX = rect.left + (center.x * 0.5 + 0.5) * rect.width;
          const centerY = rect.top + (-center.y * 0.5 + 0.5) * rect.height;
          const distanceSq = (event.clientX - centerX) ** 2 + (event.clientY - centerY) ** 2;
          if (distanceSq < nearestDistanceSq) {
            nearestDistanceSq = distanceSq;
            nearestPart = part;
          }
        });

        const hitPadding = 42;
        const isInsideExpandedModelBounds =
          event.clientX >= modelMinX - hitPadding &&
          event.clientX <= modelMaxX + hitPadding &&
          event.clientY >= modelMinY - hitPadding &&
          event.clientY <= modelMaxY + hitPadding;

        if (isInsideExpandedModelBounds) nextTappedPart = nearestPart;
      }

      if (!nextTappedPart) return;

      if (section06TappedPart && section06TappedPart.id !== nextTappedPart.id) {
        restoreSection06HoverColor(section06TappedPart);
      }
      if (section06HoveredPart && section06HoveredPart.id !== nextTappedPart.id) {
        restoreSection06HoverColor(section06HoveredPart);
        section06HoveredPart = null;
      }

      section06TappedPart = nextTappedPart;
      applySection06RandomHoverColor(nextTappedPart);
      event.preventDefault();
    };

    renderer.domElement.addEventListener("pointerdown", handleSection05PointerDown);
    window.addEventListener("pointermove", handleSection05PointerMove, { passive: false });
    window.addEventListener("pointerup", endSection05Drag);
    window.addEventListener("pointercancel", endSection05Drag);
    window.addEventListener("pointermove", handleSection06PointerMove, { passive: true });
    window.addEventListener("pointerdown", handleSection06TabletPointerDown, { capture: true, passive: false });
    window.addEventListener("pointerleave", clearSection06HoveredPart);

    const section05BaseQuaternion = new THREE.Quaternion();
    const section05PitchQuaternion = new THREE.Quaternion();
    const section05YawQuaternion = new THREE.Quaternion();
    const section05AutoSpinQuaternion = new THREE.Quaternion();
    const section05TargetQuaternion = new THREE.Quaternion();
    const section05BaseEuler = new THREE.Euler(0, 0, 0, "XYZ");
    const section05ScreenXAxis = new THREE.Vector3(1, 0, 0);
    const section05ScreenYAxis = new THREE.Vector3(0, 1, 0);

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const pose = getBlendedPose(stageProgressRef.current);
      const modelFadeIn = smoothstep(4.0, 4.28, stageProgressRef.current); // [سکشن ۵] fade-in فقط از سکشن ۵ شروع می‌شود و نرم‌تر وارد می‌شود
      const modelFadeOutAfterSection7 = 1 - smoothstep(6.78, 7.0, stageProgressRef.current); // [پایان سکشن ۷] مدل قبل از سکشن ۸ کامل به opacity صفر می‌رسد
      const modelReveal = modelFadeIn * modelFadeOutAfterSection7;
      renderer.domElement.style.opacity = `${modelReveal}`; // fade روی کل canvas است؛ متریال‌ها در fade-in شفاف نمی‌شوند.

      if (!isSection06HoverStageActive()) {
        clearSection06HoveredPart();
      }

      if (modelReveal <= 0.02 && stageProgressRef.current < 4.0) {
        // [PERFORMANCE] قبل از اولین سکشن مدل، WebGL عملاً دیده نمی‌شود؛ پس رندر سنگین نکن.
        renderer.clear();
        return;
      }

      const pivotNow = pivotRef.current;
      const modelNow = modelRef.current;
      const controlsNow = controlsRef.current;
      const ledRig = ledRigRef.current;
      const parts = partsRef.current;
      const cameraNow = cameraRef.current;

      calloutOpacityRef.current = pose.callouts * modelReveal;

      const isModelFadingIn = stageProgressRef.current >= 4.0 && stageProgressRef.current <= 4.62;
      const isModelFadingOut = stageProgressRef.current >= 6.78 && stageProgressRef.current <= 7.0;
      const shouldLockPoseDuringFade = isModelFadingIn || isModelFadingOut;

      const section05RotationWeight = getSection05RotationWeight(stageProgressRef.current);
      const section05Drag = section05RotationRef.current;
      const section05HasManualRotation =
        section05Drag.isDragging || Math.abs(section05Drag.targetX) > 0.0001 || Math.abs(section05Drag.targetY) > 0.0001;

      if (!section05Drag.isDragging) {
        section05Drag.velocityX *= SECTION_05_DRAG_STOP_DECAY;
        section05Drag.velocityY *= SECTION_05_DRAG_STOP_DECAY;

        if (Math.abs(section05Drag.velocityX) < 0.00001) section05Drag.velocityX = 0;
        if (Math.abs(section05Drag.velocityY) < 0.00001) section05Drag.velocityY = 0;

        section05Drag.targetX = THREE.MathUtils.clamp(
          section05Drag.targetX + section05Drag.velocityX,
          -SECTION_05_DRAG_MAX_TILT,
          SECTION_05_DRAG_MAX_TILT
        );
        section05Drag.targetY += section05Drag.velocityY;
      }

      section05Drag.smoothTargetX = THREE.MathUtils.lerp(
        section05Drag.smoothTargetX,
        section05Drag.targetX,
        SECTION_05_DRAG_TARGET_DAMPING
      );
      section05Drag.smoothTargetY = THREE.MathUtils.lerp(
        section05Drag.smoothTargetY,
        section05Drag.targetY,
        SECTION_05_DRAG_TARGET_DAMPING
      );
      section05Drag.currentX = section05Drag.smoothTargetX;
      section05Drag.currentY = section05Drag.smoothTargetY;

      if (!isSection05RotationStageActive() && section05Drag.isDragging) {
        endSection05Drag();
      }

      updateSection05Cursor();

      if (pivotNow && cameraNow) {
        pivotNow.visible = modelReveal > 0.02;
        const float = Math.sin(elapsed * 1.25) * pose.floatAmp;
        const screenPlacement = getBlendedScreenPlacement(stageProgressRef.current);
        const targetScreenPosition = screenPointToWorld(
          cameraNow,
          screenPlacement.screenX,
          screenPlacement.screenY,
          screenPlacement.screenPlaneZ
        );

        targetScreenPosition.y += MODEL_GLOBAL_SCREEN_LIFT_Y + float;

        const section05ManualX = section05Drag.currentX * section05RotationWeight;
        const section05ManualY = section05Drag.currentY * section05RotationWeight;
        const effectiveAutoSpin = section05RotationWeight > 0.01 && section05HasManualRotation ? 0 : pose.autoSpin;
        const section05AutoSpin =
          section05RotationWeight > 0.01 && !shouldLockPoseDuringFade ? Math.sin(elapsed * 0.32) * effectiveAutoSpin : 0;
        const targetRotationX = pose.pivotRotation[0];
        const targetRotationY = shouldLockPoseDuringFade
          ? pose.pivotRotation[1]
          : pose.pivotRotation[1] + (section05RotationWeight > 0.01 ? 0 : Math.sin(elapsed * 0.32) * effectiveAutoSpin);
        const targetScale = screenPlacement.screenScale;

        section05BaseEuler.set(targetRotationX, targetRotationY, pose.pivotRotation[2]);
        section05BaseQuaternion.setFromEuler(section05BaseEuler);

        if (section05RotationWeight > 0.01) {
          // Section 05 uses screen-axis quaternions, not Euler offsets.
          // Result: vertical drag is a real X-axis pitch, horizontal drag is Y-axis yaw, with no hidden Z-axis mixing.
          section05PitchQuaternion.setFromAxisAngle(section05ScreenXAxis, section05ManualX);
          section05YawQuaternion.setFromAxisAngle(section05ScreenYAxis, section05ManualY);
          section05AutoSpinQuaternion.identity();
          if (section05AutoSpin !== 0) {
            section05AutoSpinQuaternion.setFromAxisAngle(section05ScreenYAxis, section05AutoSpin);
          }
          section05TargetQuaternion
            .copy(section05YawQuaternion)
            .multiply(section05PitchQuaternion)
            .multiply(section05AutoSpinQuaternion)
            .multiply(section05BaseQuaternion);
        } else {
          section05TargetQuaternion.copy(section05BaseQuaternion);
        }

        if (shouldLockPoseDuringFade) {
          pivotNow.position.copy(targetScreenPosition);
          pivotNow.quaternion.copy(section05TargetQuaternion);
          pivotNow.scale.setScalar(targetScale);
        } else {
          pivotNow.position.lerp(targetScreenPosition, 0.075);
          pivotNow.quaternion.slerp(section05TargetQuaternion, section05RotationWeight > 0.01 ? SECTION_05_DRAG_ROTATION_LERP : 0.075);
          pivotNow.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.075);
        }
      }

      if (modelNow && !shouldLockPoseDuringFade && !(section05RotationWeight > 0.01 && section05HasManualRotation)) {
        modelNow.rotation.y += pose.autoSpin * 0.0025;
      }

      const targetCameraPosition = LOCK_OLEOCON_CAMERA ? OLEOCON_LOCKED_CAMERA_POSITION : pose.cameraPosition;
      const targetCameraLookAt = LOCK_OLEOCON_CAMERA ? OLEOCON_LOCKED_CAMERA_TARGET : pose.cameraTarget;

      if (cameraNow) {
        cameraNow.position.lerp(new THREE.Vector3(...targetCameraPosition), 0.055);
      }

      if (controlsNow) {
        controlsNow.target.lerp(new THREE.Vector3(...targetCameraLookAt), 0.075);
        controlsNow.update();
      }

      if (ledRig) {
        ledRig.position.y = Math.sin(elapsed * 0.45) * 0.035;
        ledRig.rotation.y = Math.sin(elapsed * 0.18) * 0.04;
      }

      const baseStageIndex = clamp(Math.floor(stageProgressRef.current), 0, STAGES.length - 1);
      const nextStageIndex = clamp(baseStageIndex + 1, 0, STAGES.length - 1);
      const isSection07InspectionStage = STAGES[baseStageIndex]?.id === "specs";
      const isEnteringSection07InspectionStage =
        STAGES[baseStageIndex]?.id === "digital-catalog" && STAGES[nextStageIndex]?.id === "specs";
      const activeSection07InspectionMode = isSection07InspectionStage ? section07InspectionModeRef.current : "inactive";
      const shouldKeepSection07DefaultOriginalMaterial =
        section07InspectionModeRef.current === "default" && (isSection07InspectionStage || isEnteringSection07InspectionStage);

      if (lastAppliedSection07InspectionModeRef.current !== activeSection07InspectionMode) {
        parts.forEach((part) => restoreSection07MaterialStyle(part.materialList));
        lastAppliedSection07InspectionModeRef.current = activeSection07InspectionMode;
      }

      syncSection07LookEdgeOverlays(parts, activeSection07InspectionMode, section07LookEdgeOverlaysRef.current);

      const section07PartSelectionTarget =
        isSection07InspectionStage && activeSection07InspectionMode === "part-selection"
          ? getSection07PartSelectionTargetPart(parts)
          : null;

      if (activeSection07InspectionMode !== "part-selection") {
        restoreSection07PartSelectionTarget(parts);
      }

      parts.forEach((part, index) => {
        const explodeSpread = pose.explodeSpread ?? 1;
        const explodeSource = pose.explodeLayout === "vertical" ? part.verticalExplodeOffset : part.targetOffset;
        const offset = explodeSource.clone().multiplyScalar(pose.explode * explodeSpread);
        part.mesh.position.copy(part.originalPosition).add(offset);

        const ghostTarget = index % 4 === 0 ? 1 : THREE.MathUtils.lerp(1, 0.58, pose.ghost);
        const sectionMaterialOpacity = shouldKeepSection07DefaultOriginalMaterial ? 1 : pose.materialOpacity ?? 1;
        setMaterialOpacity(part.materialList, ghostTarget * sectionMaterialOpacity);

        if (isSection07InspectionStage && activeSection07InspectionMode === "xray") {
          applySection07XrayStyle(part.materialList);
        }

        if (isSection07InspectionStage && activeSection07InspectionMode === "wireframe") {
          applySection07WireframeStyle(part.materialList);
        }

        if (section07PartSelectionTarget?.id === part.id) {
          applySection07PartSelectionColorLoop(part, elapsed);
        }

        if (isSection07InspectionStage && activeSection07InspectionMode === "add-note") {
          setMaterialOpacity(part.materialList, 1);
        }
      });

      renderer.render(scene, camera);

      frameRef.current += 1;
      if (frameRef.current % 5 === 0) updateLabels();
    };

    animate();

    const onResize = () => {
      const viewportNow = viewportRef.current;
      const cameraNow = cameraRef.current;
      if (!viewportNow || !cameraNow) return;

      const width = Math.max(1, viewportNow.clientWidth);
      const height = Math.max(1, viewportNow.clientHeight);

      setViewportWidth(width);
      cameraNow.aspect = width / height;
      cameraNow.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2)); // [PERFORMANCE] کمتر = سبک‌تر؛ 1.2 برای صفحه ویدئویی امن‌تر از 1.55 است.
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", handleSection05PointerDown);
      window.removeEventListener("pointermove", handleSection05PointerMove);
      window.removeEventListener("pointerup", endSection05Drag);
      window.removeEventListener("pointercancel", endSection05Drag);
      window.removeEventListener("pointermove", handleSection06PointerMove);
      window.removeEventListener("pointerdown", handleSection06TabletPointerDown, true);
      window.removeEventListener("pointerleave", clearSection06HoveredPart);
      endSection05Drag();
      clearSection06HoveredPart();
      controls.dispose();
      disposeSection07LookEdgeOverlays(section07LookEdgeOverlaysRef.current);

      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => mat?.dispose());
      });

      oleoconBump.dispose();
      if (currentEnvMap) currentEnvMap.dispose();
      pmrem.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  const isOleoconHeaderVisible = activeStage === 0 || (isMobileOrTabletViewport && isMobileHeaderVisible);

  return (
    <>
      <OleoconDesktopScrollRail />
      <div className={`oleocon-header-fade-shell ${isOleoconHeaderVisible ? "is-visible" : "is-hidden"}`} aria-hidden={isOleoconHeaderVisible ? undefined : true}>
        <OleoconHeader />
      </div>

      <main
        className="oleocon-page"
        ref={pageRef}
        data-active-stage={active.id}
        data-mobile={isMobile ? "true" : "false"}
        data-laptop={isLaptopViewport ? "true" : "false"}
        data-scroll-direction={scrollDirection}
      >
      <div className="oleocon-fixed-world" aria-hidden="true">
        <div className="oleocon-atmosphere oleocon-atmosphere-blue" />
        <div className="oleocon-atmosphere oleocon-atmosphere-red" />
        <div className="oleocon-grid-depth" />
        <div className="oleocon-viewport" ref={viewportRef} />

        <svg className="oleocon-callout-svg">
          {labels.map((label) => (
            <line
              key={`line-${label.id}`}
              className={label.kind === "note" ? "oleocon-callout-line-note" : undefined}
              x1={label.x1}
              y1={label.y1}
              x2={label.x2}
              y2={label.y2}
              style={{ opacity: label.opacity }}
            />
          ))}
        </svg>

        <div className="oleocon-label-layer">
          {labels.map((label) => (
            <div
              key={`label-${label.id}`}
              className={`oleocon-part-label oleocon-part-label-${label.side} ${label.kind === "note" ? "oleocon-part-label-note" : ""}`}
              style={{
                left: label.side === "right" ? `${label.x2}px` : "auto",
                right: label.side === "left" ? `${Math.max(16, viewportWidth - label.x2)}px` : "auto",
                top: `${label.y2}px`,
                opacity: label.opacity,
              }}
            >
              {label.name}
            </div>
          ))}
        </div>
      </div>

      <div className="oleocon-hud">
        <span className="oleocon-back-link" aria-label="Work / Oleocon">
          Work / Oleocon
        </span>
        <div className="oleocon-stage-meter" aria-label="Oleocon page sections">
          {STAGES.map((stage, index) => (
            <a
              key={stage.id}
              href={`#${stage.id}`}
              className={index === activeNavIndex ? "is-active" : ""}
              aria-label={stage.label}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </a>
          ))}
          <a
            href="#after"
            className={activeNavIndex === STAGES.length ? "is-active" : ""}
            aria-label="3D model action section"
          >
            <span>{String(STAGES.length + 1).padStart(2, "0")}</span>
          </a>
        </div>
      </div>

      {STAGES.map((stage, index) => {
        const isStageActive = index === activeStage;
        const isStageMotionActive = isStageActive && (stage.id !== "final" || isSection09MotionReady);

        return (
        <section
          key={stage.id}
          id={stage.id}
          ref={(node) => {
            sectionRefs.current[index] = node;
          }}
          className={`oleocon-stage-section oleocon-stage-${stage.id} oleocon-copy-${stage.side} ${
            OLEOCON_CENTERED_TEXT_BOX_STAGE_IDS.has(stage.id) ? "oleocon-stage-balanced-copy" : ""
          } ${isStageMotionActive ? "is-active" : ""}`}
        >
          {stage.banner && (
            <div className="oleocon-banner-strip">
              <BannerImage />
              <div className="oleocon-banner-shade" />
            </div>
          )}

          {stage.poster ? (
            <div className="oleocon-poster-layout">
              <div className="oleocon-poster-frame">
                <PosterImage urls={stage.posterUrls ?? SECTION_02_POSTER_URLS} />
              </div>

              <div className="oleocon-poster-story-panel" style={stageTextStyle(stage)}>
                <div className="oleocon-section-index">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                  <span>{stage.label}</span>
                </div>

                <p className="oleocon-eyebrow">{stage.eyebrow}</p>
                {stage.id === "poster" ? (
                  <h1 className="section02-poster-title">
                    <span className="section02-poster-title-line section02-poster-title-line-main">The art of precision, rendered</span>
                    <span className="section02-poster-title-line section02-poster-title-line-steel">in steel<span className="section02-poster-title-green-dot">.</span></span>
                  </h1>
                ) : (
                  <h1>{stage.title}</h1>
                )}
                <p className="oleocon-body">{stage.body}</p>

                {stage.stats && (
                  <ul className="oleocon-stat-list">
                    {stage.stats.map((item, itemIndex) => {
                      const statLink = stage.statLinks?.[itemIndex];

                      return (
                        <li key={item}>
                          {statLink ? <a href={statLink}>{item}</a> : item}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : stage.loopVideo ? (
            <LoopVideoProblemBlock stage={stage} index={index} />
          ) : stage.video ? (
            <CatalogVideoDataBlock stage={stage} index={index} />
          ) : stage.id === "digital-catalog" ? (
            <>
              <Section06LeftStory />
              <Section06CatalogPanel style={stageTextStyle(stage)} />
            </>
          ) : stage.id === "specs" ? (
            <Section07ProductExperience
              stage={stage}
              index={index}
              isActive={index === activeStage}
              selectedMode={section07InspectionMode}
              onSelectMode={setSection07InspectionMode}
            />
          ) : stage.id === "materials" ? (
            <Section08SalesWeapon stage={stage} index={index} />
          ) : stage.id === "final" ? (
            <Section09LongTermInvestment />
          ) : stage.hideCopy ? null : stage.id === "model" ? (
            <Section05Box index={index} label={stage.label} style={stageTextStyle(stage)} />
          ) : (
            <div
              className={`oleocon-section-copy ${
                OLEOCON_CENTERED_TEXT_BOX_STAGE_IDS.has(stage.id) ? "oleocon-section-copy-05-09" : ""
              }`}
              style={stageTextStyle(stage)}
            >
              <div className="oleocon-section-index">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
                <span>{stage.label}</span>
              </div>

              <p className="oleocon-eyebrow">{stage.eyebrow}</p>
              {stage.id === "banner" ? (
                <h1 className="section01-hero-title" aria-label="Industrial clarity. Engineered to sell.">
                  <span className="section01-hero-title-line">Industrial</span>
                  <span className="section01-hero-title-line">clarity.</span>
                  <span className="section01-hero-title-line">Engineered</span>
                  <span className="section01-hero-title-line">to sell<span className="section01-title-green-dot">.</span></span>
                </h1>
              ) : (
                <h1>{stage.title}</h1>
              )}
              <p className="oleocon-body">{stage.body}</p>

              {stage.stats && (
                <ul className="oleocon-stat-list">
                  {stage.stats.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}

              {stage.data && (
                <dl className="oleocon-data-grid oleocon-data-grid-in-copy">
                  {stage.data.map((item) => (
                    <div key={item.label} className="oleocon-data-row">
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {index === activeStage && !stage.banner && !OLEOCON_CENTERED_TEXT_BOX_STAGE_IDS.has(stage.id) && (
                <div className="oleocon-load-state">{loadState}</div>
              )}
            </div>
          )}
        </section>
        );
      })}

      <section id="after" ref={afterSectionRef} className="oleocon-after-section oleocon-after-section-minimal oleocon-section-10-fullpage">
      <div className="oleocon-section10-choice-panel" aria-label="Oleocon viewer access options">
        <div className="oleocon-section10-choice oleocon-section10-choice-full">
          <span className="oleocon-section10-choice-image" aria-hidden="true" />
          <span className="oleocon-section10-choice-copy">
            <span className="oleocon-section10-choice-kicker">FULL ACCESS</span>
            <strong>Industrial viewer</strong>
            <small>Complete Oleocon model library for the full desktop-grade experience.</small>
          </span>
          <button
            type="button"
            className="oleocon-section10-choice-button"
            aria-label="Request Industrial Viewer access"
            onClick={openSection10IndustrialAccess}
          >
            Industrial Viewer
          </button>
        </div>

        <div className="oleocon-section10-choice oleocon-section10-choice-web">
          <span className="oleocon-section10-choice-image" aria-hidden="true" />
          <span className="oleocon-section10-choice-copy">
            <span className="oleocon-section10-choice-kicker">WEB PREVIEW</span>
            <strong>Limited web viewer</strong>
            <small>Launch a focused interactive version directly in the browser.</small>
          </span>
          <a
            href="/work/oleocon/3d"
            className="oleocon-section10-choice-button"
            aria-label="Open Web Viewer"
          >
            Open Web Viewer
          </a>
        </div>
      </div>

      {isSection10IndustrialAccessOpen ? (
        <div className="oleocon-viewer-immersive-access-layer" data-immersive-mode="library" role="dialog" aria-modal="true" aria-labelledby="oleocon-viewer-immersive-access-title">
          <button type="button" className="oleocon-viewer-immersive-access-backdrop" onClick={closeSection10IndustrialAccess} aria-label="Close protected industrial viewer access" />
          <form className="oleocon-viewer-immersive-access-panel" data-access-request-open={isSection10AccessRequestOpen ? "true" : "false"} onSubmit={submitSection10IndustrialAccess}>
            <header className="oleocon-viewer-immersive-access-head">
              <p>{SECTION10_INDUSTRIAL_ACCESS_COPY.eyebrow}</p>
              <h2 id="oleocon-viewer-immersive-access-title">{SECTION10_INDUSTRIAL_ACCESS_COPY.title}</h2>
            </header>
            <p className="oleocon-viewer-immersive-access-body">{SECTION10_INDUSTRIAL_ACCESS_COPY.body}</p>
            <label className="oleocon-viewer-immersive-access-field">
              <span>{SECTION10_INDUSTRIAL_ACCESS_COPY.passwordLabel}</span>
              <input
                type="password"
                value={section10IndustrialAccessPassword}
                onChange={(event) => {
                  setSection10IndustrialAccessPassword(event.target.value);
                  setSection10IndustrialAccessMessage("");
                }}
                placeholder={SECTION10_INDUSTRIAL_ACCESS_COPY.placeholder}
                autoComplete="off"
                autoFocus
              />
            </label>
            {section10IndustrialAccessMessage ? (
              <p className="oleocon-viewer-immersive-access-message">{section10IndustrialAccessMessage}</p>
            ) : null}
            {isSection10AccessRequestOpen ? (
              <div className="oleocon-viewer-access-request-box">
                <label className="oleocon-viewer-access-request-field">
                  <span>Email or Your Client ID</span>
                  <input
                    type="text"
                    value={section10AccessRequestIdentity}
                    onChange={(event) => {
                      setSection10AccessRequestIdentity(event.target.value);
                      if (section10AccessRequestStatus === "error") setSection10AccessRequestStatus("idle");
                    }}
                    placeholder="Email or client ID"
                    autoComplete="email"
                  />
                </label>
              </div>
            ) : null}
            <div className="oleocon-viewer-immersive-access-actions">
              <button type="button" className="is-strong" onClick={closeSection10IndustrialAccess}>
                Cancel
              </button>
              {isSection10AccessRequestOpen ? (
                <div
                  className={`oleocon-viewer-access-slide is-${section10AccessRequestStatus}`}
                  style={{ "--access-slide-progress": section10AccessRequestProgress } as CSSProperties}
                  onPointerDown={startSection10AccessRequestSlide}
                  onPointerMove={moveSection10AccessRequestSlide}
                  onPointerUp={finishSection10AccessRequestSlide}
                  onPointerCancel={finishSection10AccessRequestSlide}
                  role="button"
                  aria-label="Slide to request access"
                  tabIndex={0}
                >
                  <span className="oleocon-viewer-access-slide-fill" />
                  <span className="oleocon-viewer-access-slide-handle" aria-hidden="true">
                    {section10AccessRequestStatus === "loading" ? "…" : section10AccessRequestStatus === "success" ? "✓" : section10AccessRequestStatus === "error" ? "!" : "→"}
                  </span>
                  <span className="oleocon-viewer-access-slide-label">
                    {section10AccessRequestStatus === "success" ? "Sent" : section10AccessRequestStatus === "loading" ? "Checking" : "Slide request"}
                  </span>
                </div>
              ) : null}
              <button type="button" onClick={requestSection10IndustrialAccess}>
                {SECTION10_INDUSTRIAL_ACCESS_COPY.requestButton}
              </button>
              <button type="submit" className="is-strong">
                Continue
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
      </main>
    </>
  );
}
