// src/pages/Work/Oleocon/Oleocon3DViewer/Oleocon3DViewerPage.tsx
import { type CSSProperties, type FormEvent, type MouseEvent, type PointerEvent, type WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import SiteHeader from "../../../../features/SiteHeader/SiteHeader";
import "./Oleocon3DViewerPage.css";

const OLEOCON_VIEWER_VERSION = "V36_TEXT_DRAG_ROTATION_CENTER_LOCK";

type PartGroupKind = "plug" | "coupler";

type ViewerPart = {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  originalPosition: THREE.Vector3;
  explodeDirection: THREE.Vector3;
  materials: THREE.Material[];
  visible: boolean;
  groupKind: PartGroupKind;
  groupLabel: string;
};

type PartItem = {
  id: string;
  name: string;
  visible: boolean;
  groupKind: PartGroupKind;
  groupLabel: string;
};

type Annotation = {
  id: string;
  text: string;
  label?: string;
  color: string;
  size?: number;
  kind?: "model" | "screen";
  offset?: { x: number; y: number };
  local: [number, number, number];
  screen: { x: number; y: number; visible: boolean };
};

type PaintPoint = {
  x: number;
  y: number;
};

type PaintMark =
  | {
      id: string;
      kind: "stroke";
      color: string;
      size: number;
      points: PaintPoint[];
    }
  | {
      id: string;
      kind: "arrow";
      color: string;
      size: number;
      tipX: number;
      tipY: number;
      tailX: number;
      tailY: number;
    };

type PaintStrokeState = {
  pointerId: number | null;
  markId: string | null;
  lastX: number;
  lastY: number;
};

type ActiveArrowBrushState = {
  pointerId: number | null;
  markId: string | null;
  tipX: number;
  tipY: number;
};


type ViewerActionSnapshot = {
  selectedPartIds: string[];
  isolatedPartIds: string[];
  visibleById: Record<string, boolean>;
  paintById: Record<string, string | null>;
  paintMarks: PaintMark[];
  annotations: Annotation[];
  explode: number;
  background: string;
  wireframe: boolean;
  toolColor: string;
  currentTool: ViewerTool;
  lookMode: LookMode;
  lookByPartId: Record<string, LookMode>;
};

type ViewerTool = "select" | "text" | "note" | "moveText" | "brush" | "arrowBrush";
type LookMode = "originalMaterial" | "xray" | "technicalEdges" | "inspectionLine";

const OPACITY_MODE_SURFACE_OPACITY = 0.42;
const XRAY_ORIGINAL_MATERIAL_OPACITY = 0.68;
const XRAY_OVERLAY_SURFACE_OPACITY = 0.22;
const XRAY_OVERLAY_RIM_POWER = 2.15;
const XRAY_OVERLAY_RIM_BOOST = 1.85;
const XRAY_OVERLAY_INNER_FOG = 0.38;
const XRAY_ORIGINAL_EMISSIVE_INTENSITY = 0.055;
const WIREFRAME_XRAY_SURFACE_OPACITY = 0.3;
const XRAY_EDGE_THRESHOLD_ANGLE = 38;
const WIREFRAME_EDGE_THRESHOLD_ANGLE = 14;
const XRAY_OVERLAY_COLOR = 0x5aaeff;
const XRAY_EDGE_COLOR = 0xb7e5ff;
const WIREFRAME_EDGE_COLOR = 0xd9ffc2;
const XRAY_EDGE_OPACITY = 0.24;
const WIREFRAME_EDGE_OPACITY = 0.92;
const XRAY_SURFACE_RENDER_ORDER = 12;
const XRAY_EDGE_RENDER_ORDER = 13;
const WIREFRAME_EDGE_RENDER_ORDER = 20;

type LightingPresetId = "productSoft" | "inspectionBright" | "metalContrast";
type ViewerDragMode = "rotate" | "roll" | "pan";
type TourTarget = "canvas" | "parts" | "tools" | "colors" | "snapshot" | "quickActions";
type ImmersiveAccessMode = "ar" | "vr" | "library";
type AccessRequestStatus = "idle" | "loading" | "success" | "error";

type ViewerTourStep = {
  id: string;
  target: TourTarget;
  eyebrow: string;
  title: string;
  body: string;
};

const TOUR_STORAGE_KEY = "CTS_OLEOCON_3D_VIEWER_TOUR_DONE_V7";
const ACCESS_REQUEST_SLIDE_DISTANCE = 94;
const APPROVED_ACCESS_CODES = ["R34"] as const; // [کدهای قابل قبول درخواست دسترسی] فرمت مجاز: یک حرف + دو عدد.
const APPROVED_EMAIL_DOMAINS = [
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
] as const; // [دامین‌های ایمیل قابل قبول برای درخواست دسترسی]
const PRODUCT_NAME_LINE_1 = "Hydraulic Quick Couplings";
const PRODUCT_NAME_LINE_2 = "QC Series with Poppet";
const DEFAULT_ANNOTATION_SIZE = 11;
const MIN_ANNOTATION_SIZE = 8;
const MAX_ANNOTATION_SIZE = 24;
const ANNOTATION_SIZE_STEP = 2;

function formatAnnotationLabel(index: number, prefix = "Text") {
  return `${prefix} ${String(index).padStart(2, "0")}`;
}

function getNextAnnotationLabel(annotations: Annotation[], prefix = "Text") {
  const safePrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const labelPattern = new RegExp(`^${safePrefix}\\s+(\\d+)$`, "i");
  const nextIndex = annotations.reduce((highest, annotation, index) => {
    const match = annotation.label?.match(labelPattern);
    const annotationNumber = match ? Number(match[1]) : index + 1;
    return Number.isFinite(annotationNumber) ? Math.max(highest, annotationNumber) : highest;
  }, 0) + 1;

  return formatAnnotationLabel(nextIndex, prefix);
}


function normalizeAccessRequestIdentity(value: string) {
  return value.trim();
}

function isApprovedAccessCode(value: string) {
  const normalizedValue = value.trim().toUpperCase();
  return /^[A-Z]\d{2}$/.test(normalizedValue) && APPROVED_ACCESS_CODES.includes(normalizedValue as (typeof APPROVED_ACCESS_CODES)[number]);
}

function looksLikeAccessCode(value: string) {
  return /^[A-Za-z]\d{2}$/.test(value.trim());
}

function isValidDotComEmail(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/^([a-z0-9._%+-]+)@([a-z0-9.-]+\.com)$/i);
  if (!match) return false;

  const localPart = match[1] ?? "";
  const domain = match[2] ?? "";
  const domainName = domain.split(".")[0] ?? "";

  if (localPart.length < 2 || domainName.length < 4) return false;

  return APPROVED_EMAIL_DOMAINS.includes(domain as (typeof APPROVED_EMAIL_DOMAINS)[number]);
}

const VIEWER_TOUR_STEPS: ViewerTourStep[] = [
  {
    id: "inspect",
    target: "canvas",
    eyebrow: "Step 01",
    title: "Rotate and inspect",
    body: "Drag the model to rotate it. Use the wheel or pinch to zoom in and inspect the product details.",
  },
  {
    id: "parts",
    target: "parts",
    eyebrow: "Step 02",
    title: "Select separate parts",
    body: "Use the Parts panel to select, isolate, hide, or focus on individual components.",
  },
  {
    id: "tools",
    target: "tools",
    eyebrow: "Step 03",
    title: "Use inspection tools",
    body: "Change wireframe, lighting, background, annotations, and exploded-view controls from the Tools panel.",
  },
  {
    id: "colors",
    target: "colors",
    eyebrow: "Step 04",
    title: "Unified Color System",
    body: "One shared color system controls selected parts, text notes, brush strokes, and arrows for consistent visual markup.",
  },
  {
    id: "snapshot",
    target: "snapshot",
    eyebrow: "Step 05",
    title: "Capture a clean snapshot",
    body: "Use Snapshot to export a clean product image.",
  },
  {
    id: "quick-actions",
    target: "quickActions",
    eyebrow: "Step 06",
    title: "Quick Actions",
    body: "Use Quick Actions for fast viewer controls. Undo is especially helpful when testing looks, notes, colors, or drawing marks—do not forget to use it.",
  },
];

const IMMERSIVE_ACCESS_COPY: Record<ImmersiveAccessMode, { eyebrow: string; title: string; body: string; passwordLabel: string; placeholder: string; requestButton: string; requestMessage: string; lockedMessage: string }> = {
  ar: {
    eyebrow: "Augmented Reality Preview",
    title: "AR client preview is protected",
    body: "This AR preview may include client-specific test scenes, environmental context, inspection checkpoints, and on-site training workflows. To protect operational privacy and project data, AR access is limited to approved viewers with an access password.",
    passwordLabel: "AR access password",
    placeholder: "Enter AR access password",
    requestButton: "Request Access",
    requestMessage: "AR access is approved per client and project. Please contact CTS Studio with your project name to receive the correct access password.",
    lockedMessage: "This AR password is not authorized for this preview. Please use the password provided by CTS Studio or request AR access.",
  },
  vr: {
    eyebrow: "Virtual Reality Preview",
    title: "VR client preview is protected",
    body: "This VR preview may include simulated test procedures, environment data, operator training sequences, safety scenarios, and project-specific interaction logic. To protect client data, VR access is limited to approved viewers with an access password.",
    passwordLabel: "VR access password",
    placeholder: "Enter VR access password",
    requestButton: "Request Access",
    requestMessage: "VR access is approved per client and project. Please contact CTS Studio with your project name to receive the correct access password.",
    lockedMessage: "This VR password is not authorized for this preview. Please use the password provided by CTS Studio or request VR access.",
  },
  library: {
    eyebrow: "Model Library",
    title: "Enter code",
    body: "Browse more models is part of the full CTS interactive model library. Enter the access code to continue to the entire library.",
    passwordLabel: "Library access code",
    placeholder: "Enter code",
    requestButton: "Request Access",
    requestMessage: "Library access is approved by CTS Studio. Please request the code to view the entire interactive model library.",
    lockedMessage: "This code is not authorized for the model library. Please enter the access code provided by CTS Studio.",
  },
};

const CATALOG_SUMMARY_ITEMS = [
  { label: "Product", value: "Hydraulic Quick Couplings QC Series with Poppet" },
  { label: "3D Section", value: "Screw connection system" },
  { label: "Valving Style", value: "Poppet" },
  { label: "Operating Pressure", value: "Up to 350 bar" },
  { label: "Working Temperature", value: "-20 °C to +90 °C" },
  { label: "Available Sizes", value: 'From 1/4" to 1"' },
  { label: "Available Threads", value: "BSP · NPT · Metric · SAE" },
  { label: "Sealing", value: "NBR · FKM" },
] as const;

const CATALOG_TECHNICAL_FEATURES = [
  { title: "Locking Mechanism", value: "Screw to Connect" },
  { title: "Flow Rate", value: "Up to 189 l/min" },
  { title: "Material", value: "Carbon Steel / Stainless Steel" },
  { title: "Working Temperature", value: "-20 °C / +90 °C" },
  { title: "Interchange", value: "ISO 14541" },
  { title: "Connection System", value: "Screw" },
  { title: "Operating Pressure", value: "Up to 350 Bar" },
  { title: "Available Threads", value: "BSP · NPT · Metric · SAE" },
  { title: "Connection Under Pressure", value: "Can be removable under residual pressure" },
  { title: "Available Sizes", value: 'From 1/4" to 1"' },
  { title: "Sealing Description", value: "NBR · FKM" },
  { title: "Valving Style", value: "Poppet" },
] as const;

type CatalogApplicationIconId = "oilGas" | "agriculture" | "hydraulicIndustry" | "earthMoving" | "hydraulicEquipment" | "concreteVehicles" | "vehicles" | "chemicalIndustry";

const CATALOG_APPLICATIONS = [
  { label: "Oil & Gas", icon: "oilGas" },
  { label: "Agriculture", icon: "agriculture" },
  { label: "Hydraulic Industry", icon: "hydraulicIndustry" },
  { label: "Earth Moving", icon: "earthMoving" },
  { label: "Hydraulic Equipment", icon: "hydraulicEquipment" },
  { label: "Concrete Vehicles", icon: "concreteVehicles" },
  { label: "Vehicles", icon: "vehicles" },
  { label: "Chemical Industry", icon: "chemicalIndustry" },
] as const;

const CATALOG_WARNING_ITEMS = [
  "Connection or disconnection during flow and under dynamic pressure is not allowed.",
  "Connection or disconnection is not allowed when the internal circuit temperature is higher than 80 °C / 176 °F.",
  "Usage over the maximum working pressures is not allowed.",
  "Please ensure that the OLEOCON product series you have chosen is compatible with the temperature, material and pressure requirements of your system.",
  "Please contact OLEOCON technical support for any further questions.",
] as const;

const CATALOG_INFORMATION_ITEMS = [
  "Connection or disconnection of the counterparts under residual pressure (max. 100 bar) are allowed.",
  "Top quality sealing rings provide a high level of protection.",
  "The designs are developed to prevent pressure drops and turbulences.",
  "External O-ring ensures the correct connection of the counterparts and prevents disconnection due to vibration.",
  "Durable and simple to use design.",
  "Please ensure the cleanliness of all connection surfaces to avoid dirt or dust accumulation in the circuit.",
  "Please ensure the alignment and full connection of male and female parts.",
] as const;

const CATALOG_DIMENSION_COLUMNS = [
  "Body Size",
  "Description",
  "Coupling Gender",
  "Thread Type",
  "Hex (mm)",
  "Hex (inch)",
  "Thread Size (B)",
  "Diameter",
  "Length (mm)",
  "Length (inch)",
  "Weight (kg)",
  "Weight (lbs)",
] as const;

const CATALOG_DIMENSION_ROWS = [
  ["6.3", "QC-STC-6A-NPT14", "Female", "BSP", "17", "0.66", '1/4"', "M24*2", "61.7", "2.42", "0.14", "0.308"],
  ["6.3", "QC-STC-6B-NPT14", "Male", "BSP", "30", "1.18", '1/4"', "34", "59", "2.32", "0.23", "0.48"],
  ["10", "QC-STC-10A-NPT38", "Female", "BSP", "22", "0.86", '3/8"', "M28*2", "62.9", "2.47", "0.18", "0.37"],
  ["10", "QC-STC-10B-NPT38", "Male", "BSP", "30", "1.18", '3/8"', "34", "60.5", "2.38", "0.23", "0.48"],
  ["12.5", "QC-STC-12A-NPT12", "Female", "BSP", "27", "1.06", '1/2"', "M36*2", "69", "2.71", "0.32", "0.66"],
  ["12.5", "QC-STC-12B-NPT12", "Male", "BSP", "36", "1.41", '1/2"', "42.1", "63.8", "2.51", "0.31", "0.66"],
  ["19", "QC-STC-20A-NPT34", "Female", "BSP", "32", "1.25", '3/4"', "M42*2", "85.5", "3.36", "0.49", "1.05"],
  ["19", "QC-STC-20B-NPT34", "Male", "BSP", "41", "1.61", '3/4"', "48.5", "76", "2.99", "0.47", "1.01"],
  ["25", "QC-STC-25A-NPT1", "Female", "BSP", "41", "1.61", '1"', "M48*3", "97.5", "3.83", "0.72", "1.51"],
  ["25", "QC-STC-25B-NPT1", "Male", "BSP", "50", "1.96", '1"', "54.5", "82", "3.22", "0.68", "1.45"],
] as const;

const CATALOG_PRESSURE_COLUMNS = [
  "Body Size",
  "Working Pressure Couple (MPa)",
  "Working Pressure Couple (PSI)",
  "Working Pressure Female (MPa)",
  "Working Pressure Female (PSI)",
  "Working Pressure Male (MPa)",
  "Working Pressure Male (PSI)",
  "Burst Pressure Couple (MPa)",
  "Burst Pressure Couple (PSI)",
  "Burst Pressure Female (MPa)",
  "Burst Pressure Female (PSI)",
  "Burst Pressure Male (MPa)",
  "Burst Pressure Male (PSI)",
] as const;

const CATALOG_PRESSURE_ROWS = [
  ["6", "35", "5075", "35", "5075", "35", "5075", "140", "20300", "140", "20300", "140", "20300"],
  ["10", "30", "4350", "30", "4350", "30", "4350", "120", "17400", "120", "17400", "120", "17400"],
  ["12.5", "30", "4350", "30", "4350", "30", "4350", "120", "17400", "120", "17400", "120", "17400"],
  ["19", "25", "3625", "25", "3625", "25", "3625", "100", "14500", "100", "14500", "100", "14500"],
  ["25", "20", "2900", "20", "2900", "20", "2900", "80", "11600", "80", "11600", "80", "11600"],
] as const;

const CATALOG_FLOW_COLUMNS = [
  "Body Size",
  "Rated Flow Pressure Drop (kPa)",
  "Rated Flow (l/min)",
  "Rated Flow (GPM)",
  "Fluid Loss per Disconnect (ml)",
  "Connecting Force (N)",
  "Connecting Force (lbf)",
  "Disconnecting Force (N)",
  "Disconnecting Force (lbf)",
] as const;

const CATALOG_FLOW_ROWS = [
  ["6", "250", "12", "2.64", "0.8", "1", "0.74", "0.5", "0.37"],
  ["10", "200", "23", "5.06", "1.4", "1", "0.74", "0.5", "0.37"],
  ["12.5", "150", "45", "9.91", "2.7", "1.5", "1.11", "1.2", "0.88"],
  ["19", "220", "106", "23.34", "9.3", "2.5", "1.84", "2.2", "1.62"],
  ["25", "270", "189", "41.62", "15", "3", "2.22", "2.5", "1.84"],
] as const;

type ViewerPartMaterialMode = "artist" | "hybrid" | "clean" | "original";

type LightingRigRefs = {
  ambientLight: THREE.AmbientLight;
  hemisphereLight: THREE.HemisphereLight;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  topLight: THREE.DirectionalLight;
  leftAreaLight: THREE.RectAreaLight;
  rightAreaLight: THREE.RectAreaLight;
  topCapAreaLight: THREE.RectAreaLight;
  bottomCapAreaLight: THREE.RectAreaLight;
  upperLeftAreaLight: THREE.RectAreaLight;
  upperRightAreaLight: THREE.RectAreaLight;
  lowerLeftAreaLight: THREE.RectAreaLight;
  lowerRightAreaLight: THREE.RectAreaLight;
};

type UniversalRigRefs = {
  pivot: THREE.Group;
  cameraTarget: THREE.Vector3;
  targetCameraTarget: THREE.Vector3;
  cameraDistance: number;
  targetCameraDistance: number;
  rotation: THREE.Quaternion;
  targetRotation: THREE.Quaternion;
  inertiaAxis: THREE.Vector3;
  inertiaSpeed: number;
  inertiaEnabled: boolean;
};

type SeparatePresentationBase = {
  cameraTarget: THREE.Vector3;
  cameraDistance: number;
  rotation: THREE.Quaternion;
};

type ViewerDragState = {
  pointerId: number | null;
  button: number;
  mode: ViewerDragMode | null;
  lastX: number;
  lastY: number;
  moved: boolean;
  totalMotion: number;
};

type AnnotationDragState = {
  pointerId: number | null;
  annotationId: string | null;
  lastX: number;
  lastY: number;
  moved: boolean;
};

type AutoRotateState = {
  active: boolean;
  returningToDefault: boolean;
};

type LoadedModelResult = {
  model: THREE.Object3D;
  source: string;
};

const MODEL_URLS = [
  "/3d_models/oleocon/oleocon.fbx", // public/3d_models/oleocon/oleocon.fbx — same source used on the Oleocon case-study page
];

const MODEL_TEXTURE_BASE_URL = "/3d_models/oleocon/texture/"; // public/3d_models/oleocon/texture
const MODEL_TEXTURE_URLS: Record<string, string> = {
  "oleoconBump.png": `${MODEL_TEXTURE_BASE_URL}oleoconBump.png`,
  "oleoconRough.png": `${MODEL_TEXTURE_BASE_URL}oleoconRough.png`,
};

const BASE_BUMP_SCALE = 0.012; // [FBX material parity] same bump logic as OleoconPage.tsx
const LOGO_BUMP_SCALE = 0.034;
const PATTERN_BUMP_SCALE = 0.022;
const OLEOCON_GLOBAL_BUMP_SCALE = 1.12;
const OLEOCON_BUMP_ROTATION_DEGREES = 0;
const OLEOCON_BUMP_INVERT_Y = false; // Viewer uses loadAsync, so false matches the final bump placement produced on OleoconPage after TextureLoader onLoad normalizes repeat to 1
const OLEOCON_BUMP_OFFSET_U = 0;
const OLEOCON_BUMP_OFFSET_V = 0;

const FBM_TEXTURE_RULES = {
  forceMissingTextures: true, // [اتصال دستی تکسچر] برای GLB جدید Oleocon
  patternMaterialNames: ["pattern", "file1"],
  logoMaterialNames: ["logo", "logo_bump", "file2"],
  baseMetalNoiseMaterialNames: ["base_metal_noise", "invert_bump", "invert", "file3"],
};



type OleoconTextureSet = {
  bump: THREE.Texture | null;
  roughness: THREE.Texture | null;
  pattern: THREE.Texture | null;
  invertBump: THREE.Texture | null;
  logoBump: THREE.Texture | null;
};

const oleoconTextureSet: OleoconTextureSet = {
  bump: null,
  roughness: null,
  pattern: null,
  invertBump: null,
  logoBump: null,
};

let oleoconTextureSetPromise: Promise<void> | null = null;

function prepareLoadedTexture(texture: THREE.Texture, mode: "color" | "data", repeat = false, flipY = false) {
  texture.colorSpace = mode === "color" ? THREE.SRGBColorSpace : THREE.NoColorSpace;

  // Critical for manually assigned textures on a GLB/glTF model.
  // GLTFLoader sets flipY=false automatically for embedded glTF textures,
  // but TextureLoader defaults to flipY=true. If we leave that default,
  // roughness/bump maps look vertically misplaced on the model.
  texture.flipY = flipY;

  // These Oleocon maps behave like model/UV maps, not tiling decals.
  // Clamp avoids accidental wrapping on UV islands near or outside 0..1.
  texture.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function configureOleoconBumpTexture(texture: THREE.Texture) {
  const repeatY = OLEOCON_BUMP_INVERT_Y ? -1 : 1;
  const offsetY = OLEOCON_BUMP_INVERT_Y ? 1 + OLEOCON_BUMP_OFFSET_V : OLEOCON_BUMP_OFFSET_V;

  texture.center.set(0.5, 0.5);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, repeatY);
  texture.rotation = THREE.MathUtils.degToRad(OLEOCON_BUMP_ROTATION_DEGREES);
  texture.offset.set(OLEOCON_BUMP_OFFSET_U, offsetY);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
}

async function loadOleoconTextureSet() {
  if (oleoconTextureSetPromise) return oleoconTextureSetPromise;

  oleoconTextureSetPromise = (async () => {
    const loader = new THREE.TextureLoader(createOleoconLoadingManager());

    const [bump, roughness] = await Promise.allSettled([
      loader.loadAsync(MODEL_TEXTURE_URLS["oleoconBump.png"]),
      loader.loadAsync(MODEL_TEXTURE_URLS["oleoconRough.png"]),
    ]);

    if (bump.status === "fulfilled") {
      const oleoconBump = prepareLoadedTexture(bump.value, "data", true, true);
      configureOleoconBumpTexture(oleoconBump);
      oleoconTextureSet.bump = oleoconBump;
    } else {
      oleoconTextureSet.bump = null;
    }

    // The Oleocon case-study page does not drive the main FBX look with a roughness map.
    // Keep this loaded only as a fallback for non-artist modes; the default FBX artist material uses the same bump-only logic as OleoconPage.tsx.
    oleoconTextureSet.roughness = roughness.status === "fulfilled" ? prepareLoadedTexture(roughness.value, "data", false, false) : null;

    // Backward-compatible aliases for old material-rule helpers.
    oleoconTextureSet.pattern = oleoconTextureSet.bump;
    oleoconTextureSet.invertBump = oleoconTextureSet.bump;
    oleoconTextureSet.logoBump = oleoconTextureSet.bump;

    if (!oleoconTextureSet.bump) console.warn("Missing Oleocon texture: oleoconBump.png");
    if (!oleoconTextureSet.roughness) console.warn("Missing Oleocon texture: oleoconRough.png");
  })();

  return oleoconTextureSetPromise;
}


const CTS_LOGO_URL = "/cts_brand/cts_logo_black.png"; // [لوگوی هدر/خانه] داخل public/cts_brand
const CTS_WATERMARK_URL = "/cts_brand/cts_watermark.png"; // [واترمارک خروجی Snapshot] داخل public/cts_brand
const HDRI_URLS = [
  "/hdri/urban_street_01_1k.hdr", // same HDRI path/order as OleoconPage.tsx
  "/hdri/urban_street_01_2k.hdr",
  "/hdr/urban_street_01_1k.hdr",
  "/hdr/urban_street_01_2k.hdr",
];
const HDRI_ENV_ROTATION_Y = 0; // same environment orientation as OleoconPage.tsx

const USE_URBAN_HDRI_ON_LOAD = true; // Use the same urban HDRI reflection family as OleoconPage.tsx for the FBX metal look


const MODEL_TARGET_SIZE = 4.35; // [اندازه normalize مدل] بیشتر = مدل بزرگ‌تر داخل صحنه
const DEFAULT_CAMERA_DISTANCE = 11.35; // [فاصله دوربین] کمتر = مدل نزدیک‌تر
const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 0, 0]; // [مرکز نگاه دوربین] باید روی مرکز pivot باشد
const DEFAULT_MODEL_FRONT_ROTATION_Y_DEGREES = 80; // [Default logo/front view] چرخش لوگو/سمت اصلی مدل هنگام لود؛ فقط همین عدد را تغییر بده.
const DEFAULT_CAMERA_FOV = 34; // [لنز دوربین] کمتر = product/orthographic-like، بیشتر = پرسپکتیو قوی‌تر
const MOBILE_CAMERA_FOV = 26; // [موبایل فقط] FOV کمتر، مدل را بزرگ‌تر نشان می‌دهد بدون تغییر scale یا منطق تعامل
const MOBILE_VIEWPORT_MAX_WIDTH = 699; // [مرز موبایل] تبلت از این تغییر دوربین تأثیر نمی‌گیرد
const DEFAULT_PART_COLOR = "#c9c8bd"; // [رنگ پیش‌فرض paint]
const EXPLODE_DISTANCE = 1.35; // [قدرت جدا شدن قطعات]
const SEPARATE_PARTS_PRESENTATION_ROTATION_Z = -Math.PI / 2; // [Separate Parts] rotates vertical stack into horizontal layout at full separation
const SEPARATE_PARTS_CAMERA_PULLBACK = 8.5; // [Separate Parts] camera moves back as parts separate so the whole line fits better
const MAX_DEVICE_PIXEL_RATIO = 1.5; // [کیفیت/امنیت رندر] بیشتر = شارپ‌تر ولی سنگین‌تر
const DEFAULT_LIGHTING_PRESET: LightingPresetId = "metalContrast"; // [پریست اولیه نور] page-like metal response, less flat/white than inspectionBright
const DEFAULT_MATERIAL_MODE: ViewerPartMaterialMode = "artist"; // [artist/hybrid/original/clean] artist برای FBX خام تمیزتر است
const OLEOCON_PAGE_ENV_INTENSITY_USER_DATA_KEY = "oleoconPageEnvMapIntensity";
const SPRING_RENDER_MATERIAL = {
  baseColor: "#969b9e", // matched to OleoconPage product metal
  highlightColor: "#c9ced0",
  metalness: 0.9,
  roughness: 0.31,
  envMapIntensity: 1.85,
};

const PAINTED_PART_MATERIAL = {
  // TWEAK HERE ONLY:
  // These values affect ONLY parts after you pick a color.
  // They do NOT change the original loaded material before painting.
  envMapIntensity: 0.3, // lower = less mirror/reflection eating the color
  metalness: 0.5, // higher = more metal feeling
  roughness: 0.4, // higher = softer/wider highlight, lower = sharper metal highlight
};

const SIDE_AREA_LIGHT_CONTROLS = {
  leftIntensity: 1.35, // [نور نرم چپ]
  rightIntensity: 1.25, // [نور نرم راست]
  leftWidth: 5.8,
  leftHeight: 7.4,
  rightWidth: 5.8,
  rightHeight: 7.4,
  leftX: -4.8,
  leftY: 1.4,
  leftZ: 3.0,
  rightX: 4.8,
  rightY: 1.4,
  rightZ: 3.0,
};

const SIDE_ZONE_LIGHT_CONTROLS = {
  upperLeftIntensity: 1.45,
  upperRightIntensity: 1.3,
  lowerLeftIntensity: 1.4,
  lowerRightIntensity: 1.25,

  upperWidth: 5.6,
  upperHeight: 4.6,
  lowerWidth: 5.6,
  lowerHeight: 4.6,

  upperY: 2.75,
  lowerY: -2.75,
  leftX: -4.9,
  rightX: 4.9,
  z: 3.2,

  upperTargetY: 1.55,
  lowerTargetY: -1.55,
};


const CAP_AREA_LIGHT_CONTROLS = {
  topIntensity: 1.15, // [نور قطعه بالایی]
  bottomIntensity: 1.0, // [نور قطعه پایینی]
  topWidth: 5.2,
  topHeight: 3.6,
  bottomWidth: 5.2,
  bottomHeight: 3.6,
  topX: 0.0,
  topY: 3.7,
  topZ: 4.2,
  bottomX: 0.0,
  bottomY: -3.7,
  bottomZ: 4.2,
};

const PREVIEW_GLOBAL_LIGHT_CONTROLS = {
  exposure: 1.0, // [روشنایی نهایی renderer] کمی روشن‌تر برای حس پریمیوم‌تر
  ambient: 2.05, // [نور نرم کل صحنه] کمی بازتر برای خوانایی بیشتر
  hemisphere: 2.95, // [نور گنبدی/محیطی] کمی قوی‌تر اما هنوز طبیعی
  key: 0.88, // [نور اصلی] کمی بیشتر برای فرم‌گیری بهتر
  fill: 0.98, // [نور پرکننده جلو/چپ]
  rim: 0.48, // [نور پشت] کمی بیشتر برای لبه‌ی سینمایی ملایم
  top: 0.26, // [نور عمومی بالا]
};

const INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS = {
  // TWEAK HERE FOR THE DARK LEFT/RIGHT SIDES AT FIRST LOAD.
  // This remains available as a selectable bright preset, but it is no longer the starting preset.
  // It does NOT change the selected-color material numbers above.
  exposure: 1.06, // [روشنایی نهایی renderer] اگر کل مدل تاریک است کمی بالا ببر
  envIntensity: 0.42, // [قدرت محیط/رفلکشن برای متریال اصلی] مهم‌ترین کنترل برای سیاهی دو طرف
  ambient: 3.6, // [نور نرم کلی] سایه‌های خیلی تیره را باز می‌کند
  hemisphere: 5.2, // [نور گنبدی] برای خوانا شدن دو سمت مدل
  key: 0.95, // [نور اصلی جلو/راست]
  fill: 1.2, // [نور پرکننده جلو/چپ]
  rim: 0.24, // [نور پشت] زیادش نکن چون لبه‌ها سینمایی می‌شوند
  top: 0.5, // [نور بالا]
  sideArea: 3.4, // [نور نرم چپ/راست] اگر دو سمت هنوز سیاه است این را بالا ببر
  capArea: 1.45, // [نور قطعه‌های بالا/پایین]
  upperSideArea: 3.1, // [نور نرم نیمه بالایی چپ/راست]
  lowerSideArea: 2.85, // [نور نرم نیمه پایینی چپ/راست]
};

const ROTATION = {
  sensitivity: 0.0048, // [سرعت چرخش X/Y]
  rollSensitivity: 0.0064, // [سرعت چرخش Z با Shift/Alt]
  panSensitivity: 0.00022, // [سرعت pan] عمداً کند و نزدیک به حس چرخش؛ بیشتر = pan سریع‌تر
  zoomSpeed: 0.0032, // [سرعت زوم]
  minDistance: 2.0, // [حداقل فاصله دوربین]
  maxDistance: 38.0, // [حداکثر فاصله دوربین] برای Separate Parts بازتر شد
  easing: 0.16, // [نرمی حرکت]
  dragThreshold: 4, // [تشخیص کلیک/درگ]
  horizontalSign: 1, // [جهت چرخش افقی] اگر خلاف حس طبیعی بود فقط 1 را -1 کن
  verticalSign: 1, // [جهت چرخش عمودی] اگر بالا/پایین خلاف حس طبیعی بود فقط 1 را -1 کن
  arcballBoost: 1.024, // [قدرت Arcball] بیشتر = چرخش شبیه ترک‌بال سریع‌تر
};

const MODEL_IMPORT_ORIENTATION = {
  autoStandLongestAxisOnY: false, // FBX must keep the same import orientation as OleoconPage.tsx
  manualRotationX: 0, // [چرخش دستی ایمپورت X] رادیان؛ فقط اگر FBX خاص نیاز داشت تغییر بده
  manualRotationY: 0, // [چرخش دستی ایمپورت Y]
  manualRotationZ: 0, // [چرخش دستی ایمپورت Z]
};

const ROTATION_INERTIA = {
  enabled: true, // [Smooth stop] true = بعد از رها کردن موس، چرخش نرم کم می‌شود و می‌ایستد
  damping: 0.88, // [اصطکاک توقف] کمتر = زودتر می‌ایستد، بیشتر = دیرتر می‌ایستد
  minSpeed: 0.00035, // [حد توقف کامل] کمتر = دنباله توقف طولانی‌تر
  maxSpeed: 0.042, // [حداکثر سرعت ادامه چرخش] جلوی پرت شدن مدل را می‌گیرد
  dragToInertia: 0.72, // [قدرت انتقال سرعت درگ به توقف نرم] بیشتر = بعد از رها کردن بیشتر ادامه می‌دهد
};

let activeOleoconViewerRenderer: THREE.WebGLRenderer | null = null;

function releaseOleoconViewerRenderer(renderer: THREE.WebGLRenderer | null) {
  if (!renderer) return;

  try {
    renderer.setAnimationLoop(null);
  } catch {
    // Renderer may already be lost.
  }

  try {
    renderer.renderLists.dispose();
  } catch {
    // Best-effort cleanup.
  }

  try {
    renderer.dispose();
  } catch {
    // Dispose can throw after hard context loss.
  }

  try {
    renderer.forceContextLoss();
  } catch {
    // Some browsers block forceContextLoss.
  }

  if (renderer.domElement.parentElement) renderer.domElement.remove();
}

const BACKGROUNDS = [
  { label: "Clean graphite", value: "#242a28" },
  { label: "Warm graphite", value: "#2d2924" },
  { label: "Blue graphite", value: "#202b31" },
  { label: "Deep violet studio", value: "#34263f" },
  { label: "Light blue studio", value: "#dbe7eb" },
  { label: "Bright ivory", value: "#e8e1d4" },
  { label: "Soft white studio", value: "#f1eee7" },
];

const ORIGINAL_PART_COLOR_VALUE = "original";
const DEFAULT_TOOL_COLOR = "#76b900";

const PART_COLOR_PICKER = {
  // TWEAK COLORS HERE ONLY.
  // These are only the color boxes for selected parts; they do not touch the original material.
  warmSteel: "#212930",
  ctsGreen: "#462d02",
  signalRed: "#0b431c",
  processBlue: "#052254",
  industrialYellow: "#6c0000",
  deepGunmetal: "#390b43",
};

const PAINT_COLORS = [
  { label: "Original material", value: ORIGINAL_PART_COLOR_VALUE },
  { label: "Warm Steel", value: PART_COLOR_PICKER.warmSteel },
  { label: "CTS green", value: PART_COLOR_PICKER.ctsGreen },
  { label: "Signal red", value: PART_COLOR_PICKER.signalRed },
  { label: "Process blue", value: PART_COLOR_PICKER.processBlue },
  { label: "Industrial yellow", value: PART_COLOR_PICKER.industrialYellow },
  { label: "Deep Gunmetal", value: PART_COLOR_PICKER.deepGunmetal },
];

const LIGHTING_PRESETS: Array<{
  id: LightingPresetId;
  label: string;
  exposure: number;
  envIntensity: number;
  ambient: number;
  hemisphere: number;
  key: number;
  fill: number;
  rim: number;
  top: number;
  leftArea: number;
  rightArea: number;
  topCap: number;
  bottomCap: number;
  upperLeftArea: number;
  upperRightArea: number;
  lowerLeftArea: number;
  lowerRightArea: number;
}> = [
  {
    id: "productSoft",
    label: "Safe preview",
    exposure: PREVIEW_GLOBAL_LIGHT_CONTROLS.exposure,
    envIntensity: SPRING_RENDER_MATERIAL.envMapIntensity,
    ambient: PREVIEW_GLOBAL_LIGHT_CONTROLS.ambient,
    hemisphere: PREVIEW_GLOBAL_LIGHT_CONTROLS.hemisphere,
    key: PREVIEW_GLOBAL_LIGHT_CONTROLS.key,
    fill: PREVIEW_GLOBAL_LIGHT_CONTROLS.fill,
    rim: PREVIEW_GLOBAL_LIGHT_CONTROLS.rim,
    top: PREVIEW_GLOBAL_LIGHT_CONTROLS.top,
    leftArea: SIDE_AREA_LIGHT_CONTROLS.leftIntensity,
    rightArea: SIDE_AREA_LIGHT_CONTROLS.rightIntensity,
    topCap: CAP_AREA_LIGHT_CONTROLS.topIntensity,
    bottomCap: CAP_AREA_LIGHT_CONTROLS.bottomIntensity,
    upperLeftArea: SIDE_ZONE_LIGHT_CONTROLS.upperLeftIntensity,
    upperRightArea: SIDE_ZONE_LIGHT_CONTROLS.upperRightIntensity,
    lowerLeftArea: SIDE_ZONE_LIGHT_CONTROLS.lowerLeftIntensity,
    lowerRightArea: SIDE_ZONE_LIGHT_CONTROLS.lowerRightIntensity,
  },
  {
    id: "inspectionBright",
    label: "Bright preview",
    exposure: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.exposure,
    envIntensity: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.envIntensity,
    ambient: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.ambient,
    hemisphere: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.hemisphere,
    key: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.key,
    fill: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.fill,
    rim: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.rim,
    top: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.top,
    leftArea: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.sideArea,
    rightArea: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.sideArea,
    topCap: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.capArea,
    bottomCap: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.capArea,
    upperLeftArea: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.upperSideArea,
    upperRightArea: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.upperSideArea,
    lowerLeftArea: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.lowerSideArea,
    lowerRightArea: INITIAL_LEFT_RIGHT_BLACK_FIX_CONTROLS.lowerSideArea,
  },
  {
    id: "metalContrast",
    label: "Oleocon page render",
    exposure: 1.08,
    envIntensity: 1.85,
    ambient: 0.0,
    hemisphere: 0.9,
    key: 2.55,
    fill: 1.65,
    rim: 0.62,
    top: 0.08,
    leftArea: 0.18,
    rightArea: 0.14,
    topCap: 0.12,
    bottomCap: 0.08,
    upperLeftArea: 0.06,
    upperRightArea: 0.05,
    lowerLeftArea: 0.05,
    lowerRightArea: 0.04,
  },
];

function getLightingPreset(id: LightingPresetId) {
  return LIGHTING_PRESETS.find((preset) => preset.id === id) ?? LIGHTING_PRESETS[0];
}

function applyPaintedPartMaterialResponse(material: THREE.Material) {
  const editable = material as THREE.MeshStandardMaterial & {
    emissive?: THREE.Color;
    emissiveMap?: THREE.Texture | null;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
    needsUpdate: boolean;
  };

  // Do NOT touch maps here.
  // Keeping map / roughnessMap / metalnessMap / bumpMap / normalMap preserves the real surface detail.
  if (editable.emissive) editable.emissive.set(0x000000);
  if ("emissiveMap" in editable) editable.emissiveMap = null;
  if (typeof editable.emissiveIntensity === "number") editable.emissiveIntensity = 0;

  if (typeof editable.envMapIntensity === "number") editable.envMapIntensity = PAINTED_PART_MATERIAL.envMapIntensity;
  if (typeof editable.metalness === "number") editable.metalness = PAINTED_PART_MATERIAL.metalness;
  if (typeof editable.roughness === "number") editable.roughness = PAINTED_PART_MATERIAL.roughness;

  editable.needsUpdate = true;
}

function getOleoconPageEnvMapIntensity(material: THREE.Material) {
  const value = material.userData[OLEOCON_PAGE_ENV_INTENSITY_USER_DATA_KEY];
  return typeof value === "number" ? value : null;
}

function applyLightingPreset(
  presetId: LightingPresetId,
  renderer: THREE.WebGLRenderer | null,
  rig: LightingRigRefs | null,
  parts: ViewerPart[]
) {
  const preset = getLightingPreset(presetId);

  if (renderer) renderer.toneMappingExposure = preset.exposure;

  if (rig) {
    rig.ambientLight.intensity = preset.ambient;
    rig.hemisphereLight.intensity = preset.hemisphere;
    rig.keyLight.intensity = preset.key;
    rig.fillLight.intensity = preset.fill;
    rig.rimLight.intensity = preset.rim;
    rig.topLight.intensity = preset.top;
    rig.leftAreaLight.intensity = preset.leftArea;
    rig.rightAreaLight.intensity = preset.rightArea;
    if ("topCap" in preset && rig.topCapAreaLight) rig.topCapAreaLight.intensity = preset.topCap;
    if ("bottomCap" in preset && rig.bottomCapAreaLight) rig.bottomCapAreaLight.intensity = preset.bottomCap;
    rig.upperLeftAreaLight.intensity = preset.upperLeftArea;
    rig.upperRightAreaLight.intensity = preset.upperRightArea;
    rig.lowerLeftAreaLight.intensity = preset.lowerLeftArea;
    rig.lowerRightAreaLight.intensity = preset.lowerRightArea;
  }

  parts.forEach((part) => {
    part.materials.forEach((material) => {
      const editable = material as THREE.MeshStandardMaterial & {
        envMapIntensity?: number;
      };

      if (typeof material.userData.ctsPaintColor === "string") {
        applyPaintedPartMaterialResponse(material);
      } else if ("envMapIntensity" in editable) {
        const pageEnvIntensity = getOleoconPageEnvMapIntensity(material);
        editable.envMapIntensity = pageEnvIntensity ?? preset.envIntensity;
      }

      material.needsUpdate = true;
    });
  });
}

function makePartName(mesh: THREE.Mesh, index: number) {
  const cleanName = (mesh.name || `Part ${index + 1}`)
    .replace(/_/g, " ")
    .replace(/polySurface/gi, "Part ")
    .replace(/mesh/gi, "Part")
    .replace(/node/gi, "Part")
    .replace(/\s+/g, " ")
    .trim();

  return cleanName || `Part ${index + 1}`;
}

function makePartItem(part: ViewerPart): PartItem {
  return {
    id: part.id,
    name: part.name,
    visible: part.visible,
    groupKind: part.groupKind,
    groupLabel: part.groupLabel,
  };
}

function normalizePartSortName(value: string) {
  return value.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}

function getOleoconPartPriority(partName: string, groupKind: PartGroupKind) {
  const name = normalizePartSortName(partName);
  const hasBody = name.includes("body");
  const hasPlug = name.includes("plug");
  const hasCoupler = name.includes("coupler") || name.includes("coupling");
  const hasSleeve = name.includes("sleeve");

  if (groupKind === "plug" && hasPlug && hasBody) return 0;
  if (groupKind === "coupler" && hasCoupler && hasBody) return 0;
  if (groupKind === "coupler" && hasSleeve && (name.includes("main") || hasCoupler)) return 1;

  return 100;
}

function shouldForcePartIntoPlugGroup(partName: string) {
  const name = normalizePartSortName(partName);
  return name.includes("locking washer") && name.includes("top") && name.includes("m");
}

function getOleoconPartGroupObject(mesh: THREE.Mesh, modelRoot: THREE.Object3D) {
  const chain: THREE.Object3D[] = [];
  let current: THREE.Object3D | null = mesh;

  while (current && current !== modelRoot) {
    chain.push(current);
    current = current.parent;
  }

  chain.reverse();

  // FBX usually arrives as: imported model wrapper -> FBX root -> plug group -> mesh.
  // The useful grouping level is therefore the first child under the FBX root.
  if (chain.length >= 3) return chain[1];
  if (chain.length >= 2) return chain[0];

  return mesh;
}

function getObjectSortBox(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();

  box.getCenter(center);
  box.getSize(size);

  return {
    center,
    size,
    volume: Math.max(0.0001, size.x * size.y * size.z),
  };
}


function makeSeparatedPartExplodeDirection(
  part: { mesh: THREE.Mesh; sortX: number; sortY: number; sortZ: number },
  targetCenterY: number
) {
  const sourceWorldCenter = new THREE.Vector3(part.sortX, part.sortY, part.sortZ);
  const targetWorldCenter = new THREE.Vector3(part.sortX, targetCenterY, part.sortZ);

  const parent = part.mesh.parent;
  let localDelta: THREE.Vector3;

  if (parent) {
    parent.updateWorldMatrix(true, false);
    const localSource = parent.worldToLocal(sourceWorldCenter.clone());
    const localTarget = parent.worldToLocal(targetWorldCenter.clone());
    localDelta = localTarget.sub(localSource);
  } else {
    localDelta = targetWorldCenter.sub(sourceWorldCenter);
  }

  return localDelta.divideScalar(EXPLODE_DISTANCE);
}

function rebuildSeparatedExplodeDirections<T extends ViewerPart & { groupKind: PartGroupKind; sortX: number; sortY: number; sortZ: number; partPriority: number }>(
  sortedParts: T[],
  normalizedCenter: THREE.Vector3
) {
  // Separate Parts slider only:
  // Build a real vertical stack with equal empty space between parts.
  // This is position-based, not direction/magnitude guessing:
  // next part center = previous part edge + fixed gap + current part half height.
  const separateSurfaceGap = 0.26; // [Separate Parts] visible empty gap between every two pieces; reduced 40%
  const separateCenterClearance = 0.43; // [Separate Parts] empty area around the middle split; reduced 40%
  const minStackHeight = 0.14; // [Separate Parts] tiny washers/balls still get readable spacing
  const maxStackHeight = 0.95; // [Separate Parts] large bodies do not explode the camera framing too much

  const targetCenterYById = new Map<string, number>();

  (["plug", "coupler"] as const).forEach((groupKind) => {
    const sign = groupKind === "plug" ? 1 : -1;
    const groupParts = sortedParts.filter((part) => part.groupKind === groupKind);
    const innerToOuterParts = [...groupParts].reverse();
    let cursor = separateCenterClearance;

    innerToOuterParts.forEach((part) => {
      const partBox = getObjectSortBox(part.mesh);
      const partHeight = THREE.MathUtils.clamp(partBox.size.y, minStackHeight, maxStackHeight);
      const targetCenterY = normalizedCenter.y + sign * (cursor + partHeight * 0.5);

      targetCenterYById.set(part.id, targetCenterY);
      cursor += partHeight + separateSurfaceGap;
    });
  });

  sortedParts.forEach((part) => {
    part.explodeDirection.copy(makeSeparatedPartExplodeDirection(part, targetCenterYById.get(part.id) ?? part.sortY));
  });
}

function getMaterialList(mesh: THREE.Mesh) {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function isOleoconSharedTexture(value: unknown) {
  return (
    value === oleoconTextureSet.bump ||
    value === oleoconTextureSet.roughness ||
    value === oleoconTextureSet.pattern ||
    value === oleoconTextureSet.invertBump ||
    value === oleoconTextureSet.logoBump
  );
}

function disposeMaterial(material: THREE.Material) {
  const editable = material as THREE.Material & Record<string, unknown>;
  ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "alphaMap"].forEach((key) => {
    const value = editable[key];
    if (value && !isOleoconSharedTexture(value) && typeof (value as THREE.Texture).dispose === "function") {
      (value as THREE.Texture).dispose();
    }
  });
  material.dispose();
}

function cloneMeshMaterials(mesh: THREE.Mesh) {
  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((material) => material.clone());
  } else {
    mesh.material = mesh.material.clone();
  }

  return getMaterialList(mesh);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function setMaterialWireframe(materials: THREE.Material[], enabled: boolean) {
  materials.forEach((material) => {
    const editable = material as THREE.Material & { wireframe?: boolean; needsUpdate: boolean };
    if ("wireframe" in editable) {
      editable.wireframe = enabled;
      editable.needsUpdate = true;
    }
  });
}

function rememberOriginalMaterialColor(materials: THREE.Material[]) {
  materials.forEach((material) => {
    const editable = material as THREE.MeshStandardMaterial & {
      color?: THREE.Color;
      map?: THREE.Texture | null;
      aoMap?: THREE.Texture | null;
      roughnessMap?: THREE.Texture | null;
      metalnessMap?: THREE.Texture | null;
      emissive?: THREE.Color;
      emissiveMap?: THREE.Texture | null;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
      envMapIntensity?: number;
    };

    if (!material.userData.ctsOriginalMaterialState) {
      material.userData.ctsOriginalMaterialState = {
        color: editable.color ? editable.color.getHex() : undefined,
        map: "map" in editable ? editable.map ?? null : undefined,
        aoMap: "aoMap" in editable ? editable.aoMap ?? null : undefined,
        roughnessMap: "roughnessMap" in editable ? editable.roughnessMap ?? null : undefined,
        metalnessMap: "metalnessMap" in editable ? editable.metalnessMap ?? null : undefined,
        emissive: editable.emissive ? editable.emissive.getHex() : undefined,
        emissiveMap: "emissiveMap" in editable ? editable.emissiveMap ?? null : undefined,
        emissiveIntensity: typeof editable.emissiveIntensity === "number" ? editable.emissiveIntensity : undefined,
        roughness: typeof editable.roughness === "number" ? editable.roughness : undefined,
        metalness: typeof editable.metalness === "number" ? editable.metalness : undefined,
        envMapIntensity: typeof editable.envMapIntensity === "number" ? editable.envMapIntensity : undefined,
      };
    }

    if (editable.color && typeof material.userData.ctsOriginalColor !== "number") {
      material.userData.ctsOriginalColor = editable.color.getHex();
    }
  });
}

function restoreMaterialColor(materials: THREE.Material[]) {
  materials.forEach((material) => {
    const editable = material as THREE.MeshStandardMaterial & {
      color?: THREE.Color;
      map?: THREE.Texture | null;
      aoMap?: THREE.Texture | null;
      roughnessMap?: THREE.Texture | null;
      metalnessMap?: THREE.Texture | null;
      emissive?: THREE.Color;
      emissiveMap?: THREE.Texture | null;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
      envMapIntensity?: number;
      needsUpdate: boolean;
    };

    const originalState = material.userData.ctsOriginalMaterialState as
      | {
          color?: number;
          map?: THREE.Texture | null;
          aoMap?: THREE.Texture | null;
          roughnessMap?: THREE.Texture | null;
          metalnessMap?: THREE.Texture | null;
          emissive?: number;
          emissiveMap?: THREE.Texture | null;
          emissiveIntensity?: number;
          roughness?: number;
          metalness?: number;
          envMapIntensity?: number;
        }
      | undefined;

    const originalColor = typeof originalState?.color === "number" ? originalState.color : material.userData.ctsOriginalColor;
    if (editable.color && typeof originalColor === "number") editable.color.setHex(originalColor);
    if ("map" in editable && originalState && "map" in originalState) editable.map = originalState.map ?? null;
    if ("aoMap" in editable && originalState && "aoMap" in originalState) editable.aoMap = originalState.aoMap ?? null;
    if ("roughnessMap" in editable && originalState && "roughnessMap" in originalState) editable.roughnessMap = originalState.roughnessMap ?? null;
    if ("metalnessMap" in editable && originalState && "metalnessMap" in originalState) editable.metalnessMap = originalState.metalnessMap ?? null;
    if (editable.emissive && typeof originalState?.emissive === "number") editable.emissive.setHex(originalState.emissive);
    if ("emissiveMap" in editable && originalState && "emissiveMap" in originalState) editable.emissiveMap = originalState.emissiveMap ?? null;
    if (typeof editable.emissiveIntensity === "number" && typeof originalState?.emissiveIntensity === "number") editable.emissiveIntensity = originalState.emissiveIntensity;
    if (typeof editable.roughness === "number" && typeof originalState?.roughness === "number") editable.roughness = originalState.roughness;
    if (typeof editable.metalness === "number" && typeof originalState?.metalness === "number") editable.metalness = originalState.metalness;
    if (typeof editable.envMapIntensity === "number" && typeof originalState?.envMapIntensity === "number") editable.envMapIntensity = originalState.envMapIntensity;

    delete material.userData.ctsPaintColor;
    editable.needsUpdate = true;
  });
}

function setMaterialColor(materials: THREE.Material[], color: string) {
  rememberOriginalMaterialColor(materials);

  if (color === ORIGINAL_PART_COLOR_VALUE) {
    restoreMaterialColor(materials);
    return;
  }

  materials.forEach((material) => {
    const editable = material as THREE.MeshStandardMaterial & {
      color?: THREE.Color;
      needsUpdate: boolean;
    };

    // Old-code color method: only tint the material color.
    // No map / roughnessMap / metalnessMap / bumpMap / normalMap is removed here.
    if (editable.color) editable.color.set(color);

    material.userData.ctsPaintColor = color;
    applyPaintedPartMaterialResponse(material);

    editable.needsUpdate = true;
  });
}

function getPartPaintColor(part: ViewerPart) {
  const paintedMaterial = part.materials.find((material) => typeof material.userData.ctsPaintColor === "string");
  return typeof paintedMaterial?.userData.ctsPaintColor === "string" ? paintedMaterial.userData.ctsPaintColor : null;
}

function setMaterialOpacity(materials: THREE.Material[], opacity: number) {
  materials.forEach((material) => {
    material.transparent = opacity < 0.98;
    material.opacity = opacity;
    material.depthWrite = opacity > 0.55;
    material.needsUpdate = true;
  });
}

function getLookMaterialOpacity(mode: LookMode) {
  if (mode === "xray") return OPACITY_MODE_SURFACE_OPACITY;
  if (mode === "technicalEdges") return XRAY_ORIGINAL_MATERIAL_OPACITY;
  if (mode === "inspectionLine") return WIREFRAME_XRAY_SURFACE_OPACITY;
  return 1;
}

function setMaterialLookModeFlags(materials: THREE.Material[], mode: LookMode) {
  materials.forEach((material) => {
    const editable = material as THREE.Material & {
      wireframe?: boolean;
      polygonOffset?: boolean;
      polygonOffsetFactor?: number;
      polygonOffsetUnits?: number;
      needsUpdate: boolean;
    };

    if ("wireframe" in editable) editable.wireframe = false;

    material.side = mode === "xray" || mode === "technicalEdges" || mode === "inspectionLine" ? THREE.DoubleSide : THREE.FrontSide;
    material.depthTest = true;
    material.depthWrite = mode === "originalMaterial";

    editable.polygonOffset = mode === "inspectionLine";
    editable.polygonOffsetFactor = mode === "inspectionLine" ? 1.4 : 0;
    editable.polygonOffsetUnits = mode === "inspectionLine" ? 1.4 : 0;

    const standard = material as THREE.MeshStandardMaterial & {
      emissive?: THREE.Color;
      emissiveIntensity?: number;
    };
    const originalState = material.userData.ctsOriginalMaterialState as
      | { emissive?: number; emissiveIntensity?: number }
      | undefined;

    if (mode === "technicalEdges") {
      if (standard.emissive) standard.emissive.setHex(XRAY_OVERLAY_COLOR);
      if (typeof standard.emissiveIntensity === "number") standard.emissiveIntensity = XRAY_ORIGINAL_EMISSIVE_INTENSITY;
    } else {
      if (standard.emissive && typeof originalState?.emissive === "number") standard.emissive.setHex(originalState.emissive);
      if (typeof standard.emissiveIntensity === "number") standard.emissiveIntensity = typeof originalState?.emissiveIntensity === "number" ? originalState.emissiveIntensity : 0;
    }

    editable.needsUpdate = true;
  });
}

function applyPartLookVisualState(part: ViewerPart, mode: LookMode, shouldShow: boolean, force = false) {
  const opacity = shouldShow ? getLookMaterialOpacity(mode) : 0;
  const cacheKey = `${mode}|${shouldShow ? "shown" : "hidden"}|${opacity.toFixed(3)}`;

  if (!force && part.mesh.userData.ctsLookVisualStateKey === cacheKey) return;

  part.mesh.userData.ctsLookVisualStateKey = cacheKey;
  part.mesh.renderOrder = mode === "originalMaterial" ? 0 : 10 + getStableLookRenderOrderOffset(part);
  setMaterialOpacity(part.materials, opacity);
  setMaterialLookModeFlags(part.materials, mode);
}

function clearPartLookVisualStateCache(part: ViewerPart) {
  delete part.mesh.userData.ctsLookVisualStateKey;
}

function getStableLookRenderOrderOffset(part: ViewerPart) {
  const stableOrder = part.mesh.userData.ctsStableLookRenderOrder;
  return typeof stableOrder === "number" ? stableOrder * 0.001 : 0;
}

function getLookEdgeThresholdAngle(mode: LookMode) {
  return mode === "inspectionLine" ? WIREFRAME_EDGE_THRESHOLD_ANGLE : XRAY_EDGE_THRESHOLD_ANGLE;
}

function getLookEdgeColor(mode: LookMode) {
  return mode === "inspectionLine" ? WIREFRAME_EDGE_COLOR : XRAY_EDGE_COLOR;
}

function getLookEdgeOpacity(mode: LookMode) {
  return mode === "inspectionLine" ? WIREFRAME_EDGE_OPACITY : XRAY_EDGE_OPACITY;
}

function getLookEdgeRenderOrder(mode: LookMode) {
  return mode === "inspectionLine" ? WIREFRAME_EDGE_RENDER_ORDER : XRAY_EDGE_RENDER_ORDER;
}

function createXraySurfaceOverlayMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(XRAY_OVERLAY_COLOR) },
      uOpacity: { value: XRAY_OVERLAY_SURFACE_OPACITY },
      uRimPower: { value: XRAY_OVERLAY_RIM_POWER },
      uRimBoost: { value: XRAY_OVERLAY_RIM_BOOST },
      uInnerFog: { value: XRAY_OVERLAY_INNER_FOG },
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldViewDir;
      varying float vViewDepth;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldViewDir = normalize(cameraPosition - worldPosition.xyz);
        vViewDepth = smoothstep(1.0, 7.5, -viewPosition.z);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uRimPower;
      uniform float uRimBoost;
      uniform float uInnerFog;

      varying vec3 vWorldNormal;
      varying vec3 vWorldViewDir;
      varying float vViewDepth;

      void main() {
        float facing = abs(dot(normalize(vWorldNormal), normalize(vWorldViewDir)));
        float rim = pow(1.0 - facing, uRimPower);
        float innerFog = uInnerFog * (1.0 - facing * 0.42);
        float depthFog = mix(0.76, 1.16, vViewDepth);
        float alpha = clamp(uOpacity * (innerFog + rim * uRimBoost) * depthFog, 0.0, 0.46);
        vec3 fogColor = mix(uColor * 0.42, uColor * 1.18, clamp(rim * 1.25 + 0.18, 0.0, 1.0));
        gl_FragColor = vec4(fogColor, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -1.1,
    polygonOffsetUnits: -1.1,
  });
}

function updateXraySurfaceOverlayMaterial(material: THREE.ShaderMaterial) {
  const color = material.uniforms.uColor?.value as THREE.Color | undefined;
  if (color) color.setHex(XRAY_OVERLAY_COLOR);
  if (material.uniforms.uOpacity) material.uniforms.uOpacity.value = XRAY_OVERLAY_SURFACE_OPACITY;
  if (material.uniforms.uRimPower) material.uniforms.uRimPower.value = XRAY_OVERLAY_RIM_POWER;
  if (material.uniforms.uRimBoost) material.uniforms.uRimBoost.value = XRAY_OVERLAY_RIM_BOOST;
  if (material.uniforms.uInnerFog) material.uniforms.uInnerFog.value = XRAY_OVERLAY_INNER_FOG;
  material.depthTest = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;
  material.blending = THREE.AdditiveBlending;
  material.polygonOffset = true;
  material.polygonOffsetFactor = -1.1;
  material.polygonOffsetUnits = -1.1;
  material.needsUpdate = true;
}

function getMaterialLuminance(material: THREE.Material) {
  const color = (material as THREE.MeshStandardMaterial & { color?: THREE.Color }).color;
  if (!color) return 0.72;
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}


function normalizeMaterialName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/\.[0-9]+$/g, "")
    .replace(/^mat[_\-\s]*/g, "")
    .replace(/[\s\-:]+/g, "_");
}

function getExactMaterialName(material: THREE.Material) {
  return normalizeMaterialName(material.name || "");
}

function getMaterialIdentity(mesh: THREE.Mesh, material: THREE.Material) {
  return `${normalizeMaterialName(mesh.name || "")} ${normalizeMaterialName(material.name || "")}`;
}

function materialNameMatchesAny(mesh: THREE.Mesh, material: THREE.Material, targets: string[]) {
  const materialName = getExactMaterialName(material);
  const identity = getMaterialIdentity(mesh, material);

  return targets.some((target) => {
    const normalizedTarget = normalizeMaterialName(target);
    return (
      materialName === normalizedTarget ||
      materialName.endsWith(`_${normalizedTarget}`) ||
      materialName.includes(normalizedTarget) ||
      identity.includes(normalizedTarget)
    );
  });
}

function shouldUsePatternTexture(mesh: THREE.Mesh, material: THREE.Material) {
  if (!FBM_TEXTURE_RULES.forceMissingTextures) return false;
  return materialNameMatchesAny(mesh, material, FBM_TEXTURE_RULES.patternMaterialNames);
}

function shouldUseLogoBumpTexture(mesh: THREE.Mesh, material: THREE.Material) {
  if (!FBM_TEXTURE_RULES.forceMissingTextures) return false;
  return materialNameMatchesAny(mesh, material, FBM_TEXTURE_RULES.logoMaterialNames);
}

function shouldUseInvertBumpTexture(mesh: THREE.Mesh, material: THREE.Material) {
  if (!FBM_TEXTURE_RULES.forceMissingTextures) return false;
  return materialNameMatchesAny(mesh, material, FBM_TEXTURE_RULES.baseMetalNoiseMaterialNames);
}

function getForcedBumpTextureForMaterial(mesh: THREE.Mesh, material: THREE.Material) {
  if (oleoconTextureSet.bump) return oleoconTextureSet.bump;
  if (shouldUsePatternTexture(mesh, material)) return oleoconTextureSet.pattern;
  if (shouldUseLogoBumpTexture(mesh, material)) return oleoconTextureSet.logoBump;
  if (shouldUseInvertBumpTexture(mesh, material)) return oleoconTextureSet.invertBump;
  return null;
}

function getForcedBumpScaleForMaterial(mesh: THREE.Mesh, material: THREE.Material) {
  if (oleoconTextureSet.bump) return 1.0;
  if (shouldUsePatternTexture(mesh, material)) return 0.12;
  if (shouldUseLogoBumpTexture(mesh, material)) return 0.075;
  if (shouldUseInvertBumpTexture(mesh, material)) return 0.045;
  return 0.0;
}

function logTextureRuleResult(mesh: THREE.Mesh, material: THREE.Material, textureName: string) {
  if (!textureName) return;
  console.info(
    `[Oleocon texture rule] ${textureName} applied`,
    {
      mesh: mesh.name,
      material: material.name,
      normalizedMaterial: getExactMaterialName(material),
    }
  );
}

function createCleanMaterial(source: THREE.Material, mesh: THREE.Mesh) {
  const sourceMaterial = source as THREE.MeshStandardMaterial & {
    color?: THREE.Color;
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    bumpMap?: THREE.Texture | null;
    bumpScale?: number;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
    emissive?: THREE.Color;
    emissiveMap?: THREE.Texture | null;
    metalness?: number;
    roughness?: number;
  };
  const materialName = getMaterialIdentity(mesh, source);
  const luminance = getMaterialLuminance(source);
  const isDark = luminance < 0.25 || /black|dark|rubber|seal|gasket/.test(materialName);
  const isMetal = /metal|steel|chrome|ring|knurl|bar|nut|bolt/.test(materialName) || (!isDark && luminance < 0.78);

  const baseColor = new THREE.Color(SPRING_RENDER_MATERIAL.baseColor);

  const forcedBumpMap = sourceMaterial.bumpMap ?? getForcedBumpTextureForMaterial(mesh, source) ?? null;
  const forcedRoughnessMap = sourceMaterial.roughnessMap ?? oleoconTextureSet.roughness ?? null;

  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    map: sourceMaterial.map ?? null,
    normalMap: sourceMaterial.normalMap ?? null,
    bumpMap: forcedBumpMap,
    bumpScale: forcedBumpMap ? getForcedBumpScaleForMaterial(mesh, source) : 0.0,
    roughnessMap: forcedRoughnessMap,
    metalnessMap: sourceMaterial.metalnessMap ?? null,
    aoMap: sourceMaterial.aoMap ?? null,
    emissive: sourceMaterial.emissive ?? new THREE.Color(0x000000),
    emissiveMap: sourceMaterial.emissiveMap ?? null,
    metalness: SPRING_RENDER_MATERIAL.metalness,
    roughness: forcedRoughnessMap ? 0.72 : SPRING_RENDER_MATERIAL.roughness,
    envMapIntensity: SPRING_RENDER_MATERIAL.envMapIntensity,
    side: THREE.FrontSide,
  });

  material.name = `CTS_Clean_${source.name || mesh.name || "material"}`;
  return material;
}


function createArtistMaterial(source: THREE.Material, mesh: THREE.Mesh) {
  const sourceAny = source as
    | (THREE.Material & {
        name?: string;
        color?: THREE.Color;
      })
    | undefined;

  const materialName = sourceAny?.name || mesh.name || "Oleocon_Material";
  const key = `${mesh.name || ""} ${materialName}`.toLowerCase();

  const isBaseNoise = key.includes("base_metal_noise") || key.includes("noise");
  const isBaseMetal = key.includes("base_metal") || key.includes("metal");
  const isShiny = key.includes("shiny") || key.includes("chrome") || key.includes("silver");
  const isLogo = key.includes("logo") || key.includes("oleocon") || key.includes("text");
  const isPattern = key.includes("pattern") || key.includes("knurl") || key.includes("grip");
  const isInner = key.includes("inner") || key.includes("inside") || key.includes("black");
  const isPin = key.includes("pin") || key.includes("ball") || key.includes("sphere");
  const oleoconBump = oleoconTextureSet.bump ?? getForcedBumpTextureForMaterial(mesh, source);

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

  if (oleoconBump) {
    material.bumpMap = oleoconBump;
    material.bumpScale = OLEOCON_GLOBAL_BUMP_SCALE;
  }

  if (isBaseMetal) {
    material.color = new THREE.Color("#8e9496");
    material.metalness = 0.9;
    material.roughness = 0.31;
    material.envMapIntensity = 1.85;
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
    if (oleoconBump) {
      material.bumpMap = oleoconBump;
      material.bumpScale = Math.max(OLEOCON_GLOBAL_BUMP_SCALE, BASE_BUMP_SCALE);
    }
    material.roughness = 0.36;
    material.envMapIntensity = 1.85;
  }

  if (isLogo) {
    material.color = new THREE.Color("#aeb4b6");
    if (oleoconBump) {
      material.bumpMap = oleoconBump;
      material.bumpScale = Math.max(OLEOCON_GLOBAL_BUMP_SCALE, LOGO_BUMP_SCALE);
    }
    material.roughness = 0.25;
    material.envMapIntensity = 1.85;
  }

  if (isPattern) {
    material.color = new THREE.Color("#9aa0a2");
    if (oleoconBump) {
      material.bumpMap = oleoconBump;
      material.bumpScale = Math.max(OLEOCON_GLOBAL_BUMP_SCALE, PATTERN_BUMP_SCALE);
    }
    material.roughness = 0.27;
    material.envMapIntensity = 1.85;
  }

  if (isInner) {
    material.color = new THREE.Color("#14171b");
    material.metalness = 0.52;
    material.roughness = 0.58;
    material.clearcoat = 0.04;
    material.envMapIntensity = 1.0;
  }

  if (isPin) {
    material.color = new THREE.Color("#f1f1eb");
    material.metalness = 1.0;
    material.roughness = 0.15;
    material.clearcoat = 0.72;
    material.clearcoatRoughness = 0.16;
    material.envMapIntensity = 1.85;
  }

  material.userData[OLEOCON_PAGE_ENV_INTENSITY_USER_DATA_KEY] = material.envMapIntensity;

  return material;
}

function prepareMaterialTextures(material: THREE.Material) {
  const editable = material as THREE.MeshStandardMaterial & {
    map?: THREE.Texture | null;
    emissiveMap?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    normalScale?: THREE.Vector2;
    bumpMap?: THREE.Texture | null;
    bumpScale?: number;
    roughnessMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
    aoMapIntensity?: number;
    envMapIntensity?: number;
    flatShading?: boolean;
  };

  if (editable.map) {
    editable.map.colorSpace = THREE.SRGBColorSpace;
    editable.map.needsUpdate = true;
  }

  if (editable.emissiveMap) {
    editable.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    editable.emissiveMap.needsUpdate = true;
  }

  if (editable.normalMap) {
    editable.normalMap.colorSpace = THREE.NoColorSpace;
    editable.normalMap.needsUpdate = true;
    if (!editable.normalScale) editable.normalScale = new THREE.Vector2(1, 1);
    editable.normalScale.multiplyScalar(0.85);
  }

  if (editable.bumpMap) {
    editable.bumpMap.colorSpace = THREE.NoColorSpace;
    editable.bumpMap.needsUpdate = true;
    editable.bumpScale = clamp(editable.bumpScale ?? 1.05, 0.01, 1.5);
  }

  if (editable.roughnessMap) {
    editable.roughnessMap.colorSpace = THREE.NoColorSpace;
    editable.roughnessMap.needsUpdate = true;
  }

  if (editable.aoMap) editable.aoMapIntensity = clamp(editable.aoMapIntensity ?? 1, 0.6, 1.0);
  if ("envMapIntensity" in editable) editable.envMapIntensity = Math.max(editable.envMapIntensity ?? 0, SPRING_RENDER_MATERIAL.envMapIntensity);
  if ("flatShading" in editable) editable.flatShading = false;

  material.needsUpdate = true;
}

function prepareMeshMaterials(mesh: THREE.Mesh, mode: ViewerPartMaterialMode) {
  const cloned = cloneMeshMaterials(mesh);

  if (mode === "original") {
    cloned.forEach(prepareMaterialTextures);
    return cloned;
  }

  if (mode === "artist") {
    const artistMaterials = cloned.map((material) => createArtistMaterial(material, mesh));
    cloned.forEach((material) => material.dispose());
    mesh.material = Array.isArray(mesh.material) ? artistMaterials : artistMaterials[0];
    artistMaterials.forEach(prepareMaterialTextures);
    return getMaterialList(mesh);
  }

  if (mode === "clean") {
    const cleanMaterials = cloned.map((material) => createCleanMaterial(material, mesh));
    cloned.forEach((material) => material.dispose());
    mesh.material = Array.isArray(mesh.material) ? cleanMaterials : cleanMaterials[0];
    cleanMaterials.forEach(prepareMaterialTextures);
    return getMaterialList(mesh);
  }

  const hybridMaterials = cloned.map((material) => createCleanMaterial(material, mesh));
  cloned.forEach((material) => material.dispose());
  mesh.material = Array.isArray(mesh.material) ? hybridMaterials : hybridMaterials[0];
  hybridMaterials.forEach(prepareMaterialTextures);
  return getMaterialList(mesh);
}

function fitRendererToElement(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO));
  camera.aspect = width / height;
  camera.fov = width <= MOBILE_VIEWPORT_MAX_WIDTH ? MOBILE_CAMERA_FOV : DEFAULT_CAMERA_FOV;
  camera.updateProjectionMatrix();
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function loadImageSafe(url: string) {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return image;
  } catch {
    return null;
  }
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3 ? clean.split("").map((item) => item + item).join("") : clean.padEnd(6, "0").slice(0, 6);
  const number = Number.parseInt(value, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function mixHex(base: string, target: string, amount: number) {
  const a = hexToRgb(base);
  const b = hexToRgb(target);
  const t = clamp01(amount);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bValue = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bValue})`;
}

function drawCleanStudioBackground(context: CanvasRenderingContext2D, width: number, height: number, baseColor: string) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, mixHex(baseColor, "#f2f0ea", 0.08));
  gradient.addColorStop(0.48, baseColor);
  gradient.addColorStop(1, mixHex(baseColor, "#121212", 0.34));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const edgeShade = context.createLinearGradient(0, 0, 0, height);
  edgeShade.addColorStop(0, "rgba(18,18,18,0.20)");
  edgeShade.addColorStop(0.18, "rgba(18,18,18,0.00)");
  edgeShade.addColorStop(0.78, "rgba(18,18,18,0.00)");
  edgeShade.addColorStop(1, "rgba(18,18,18,0.24)");
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, width, height);
}


function applyImportOrientation(model: THREE.Object3D) {
  model.rotation.set(
    MODEL_IMPORT_ORIENTATION.manualRotationX,
    MODEL_IMPORT_ORIENTATION.manualRotationY + THREE.MathUtils.degToRad(DEFAULT_MODEL_FRONT_ROTATION_Y_DEGREES),
    MODEL_IMPORT_ORIENTATION.manualRotationZ
  );
  model.updateWorldMatrix(true, true);

  if (!MODEL_IMPORT_ORIENTATION.autoStandLongestAxisOnY) return;

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.x > size.y && size.x >= size.z) {
    model.rotation.z += Math.PI / 2;
  } else if (size.z > size.y && size.z > size.x) {
    model.rotation.x -= Math.PI / 2;
  }

  model.updateWorldMatrix(true, true);
}

function normalizeModelOnPivot(model: THREE.Object3D) {
  applyImportOrientation(model);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxSize = Math.max(size.x, size.y, size.z, 0.0001);
  const scale = MODEL_TARGET_SIZE / maxSize;

  model.position.sub(center);
  model.scale.multiplyScalar(scale);
  model.updateWorldMatrix(true, true);

  const finalBox = new THREE.Box3().setFromObject(model);
  const finalCenter = new THREE.Vector3();
  finalBox.getCenter(finalCenter);
  model.position.sub(finalCenter);
  model.updateWorldMatrix(true, true);

  return {
    box: new THREE.Box3().setFromObject(model),
    center: new THREE.Vector3(0, 0, 0),
  };
}

function mapClientPointToArcball(clientX: number, clientY: number, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
  const y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  const vector = new THREE.Vector3(x, y, 0);
  const lengthSq = x * x + y * y;

  if (lengthSq <= 1) {
    vector.z = Math.sqrt(1 - lengthSq);
  } else {
    vector.normalize();
  }

  return vector;
}

function applyRotationInertia(rig: UniversalRigRefs | null) {
  if (!rig || !ROTATION_INERTIA.enabled || !rig.inertiaEnabled) return;

  if (rig.inertiaSpeed <= ROTATION_INERTIA.minSpeed || rig.inertiaAxis.lengthSq() < 0.000001) {
    rig.inertiaSpeed = 0;
    rig.inertiaEnabled = false;
    return;
  }

  const inertiaRotation = new THREE.Quaternion().setFromAxisAngle(
    rig.inertiaAxis.clone().normalize(),
    rig.inertiaSpeed
  );

  rig.targetRotation.premultiply(inertiaRotation).normalize();
  rig.inertiaSpeed *= ROTATION_INERTIA.damping;
}

function updateUniversalRig(camera: THREE.PerspectiveCamera, rig: UniversalRigRefs | null) {
  if (!rig) return;

  const ease = ROTATION.easing;
  rig.rotation.slerp(rig.targetRotation, ease);
  rig.cameraDistance += (rig.targetCameraDistance - rig.cameraDistance) * ease;
  rig.cameraTarget.lerp(rig.targetCameraTarget, ease);
  rig.pivot.quaternion.copy(rig.rotation);
  camera.position.set(0, 0, rig.cameraDistance).add(rig.cameraTarget);
  camera.lookAt(rig.cameraTarget);
}

function applyArcballRotation(
  rig: UniversalRigRefs,
  camera: THREE.PerspectiveCamera,
  element: HTMLElement,
  previousX: number,
  previousY: number,
  nextX: number,
  nextY: number
) {
  const start = mapClientPointToArcball(previousX, previousY, element);
  const end = mapClientPointToArcball(nextX, nextY, element);
  const axis = new THREE.Vector3().crossVectors(start, end);

  if (axis.lengthSq() < 0.000001) return;

  const angle = start.angleTo(end) * ROTATION.arcballBoost;
  axis.normalize().applyQuaternion(camera.quaternion).normalize();

  const rotation = new THREE.Quaternion().setFromAxisAngle(axis, angle);
  rig.targetRotation.premultiply(rotation).normalize();
  rig.inertiaAxis.copy(axis);
  rig.inertiaSpeed = Math.min(angle * ROTATION_INERTIA.dragToInertia, ROTATION_INERTIA.maxSpeed);
  rig.inertiaEnabled = false;
}

function applyRollRotation(rig: UniversalRigRefs, camera: THREE.PerspectiveCamera, dx: number, dy: number) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const rollAmount = -(dx + dy * 0.35) * ROTATION.rollSensitivity;
  const axis = forward.normalize();
  const roll = new THREE.Quaternion().setFromAxisAngle(axis, rollAmount);
  rig.targetRotation.premultiply(roll).normalize();
  rig.inertiaAxis.copy(axis);
  rig.inertiaSpeed = Math.min(Math.abs(rollAmount) * ROTATION_INERTIA.dragToInertia, ROTATION_INERTIA.maxSpeed);
  rig.inertiaEnabled = false;
}


function createOleoconLoadingManager() {
  const manager = new THREE.LoadingManager();

  manager.setURLModifier((url) => {
    const cleanUrl = url.replace(/\\/g, "/");
    const filename = decodeURIComponent(cleanUrl.split("/").pop() ?? cleanUrl);
    const mappedTexture = Object.entries(MODEL_TEXTURE_URLS).find(
      ([textureName]) => textureName.toLowerCase() === filename.toLowerCase()
    )?.[1];

    if (mappedTexture) return mappedTexture;

    if (cleanUrl.includes("/texture/") || cleanUrl.includes("texture/")) {
      return `${MODEL_TEXTURE_BASE_URL}${filename}`;
    }

    if (cleanUrl.includes("oleoconEmbed.fbm/")) {
      return `/3d_models/oleocon/${cleanUrl.slice(cleanUrl.indexOf("oleoconEmbed.fbm/"))}`;
    }

    return url;
  });

  return manager;
}

function loadModel(url: string) {
  return new Promise<LoadedModelResult>((resolve, reject) => {
    const isFbx = url.toLowerCase().endsWith(".fbx");
    const manager = createOleoconLoadingManager();

    if (isFbx) {
      const loader = new FBXLoader(manager);
      loader.setPath("/3d_models/oleocon/");
      loader.setResourcePath(MODEL_TEXTURE_BASE_URL);
      loader.load(url.replace("/3d_models/oleocon/", ""), (model) => resolve({ model, source: url }), undefined, reject);
      return;
    }

    const loader = new GLTFLoader(manager);
    loader.setResourcePath(MODEL_TEXTURE_BASE_URL);
    loader.load(url, (gltf) => resolve({ model: gltf.scene, source: url }), undefined, reject);
  });
}

function CatalogDataIcon({ kind, index }: { kind: "summary" | "feature"; index: number }) {
  const iconProps = {
    className: "oleocon-viewer-catalog-data-icon",
    viewBox: "0 0 32 32",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  const code = `${kind}-${index}`;

  switch (code) {
    case "summary-0":
      return <svg {...iconProps}><path d="M7 11 16 6l9 5-9 5-9-5Z" /><path d="M7 11v10l9 5 9-5V11" /><path d="M16 16v10" /></svg>;
    case "summary-1":
      return <svg {...iconProps}><circle cx="16" cy="16" r="10" /><path d="M6 16h20M16 6c3 3 4 6 4 10s-1 7-4 10M16 6c-3 3-4 6-4 10s1 7 4 10" /></svg>;
    case "summary-2":
      return <svg {...iconProps}><path d="M8 8h16v16H8V8Z" /><path d="M16 8v16M8 16h16" /><circle cx="16" cy="16" r="4" /></svg>;
    case "summary-3":
    case "feature-6":
      return <svg {...iconProps}><circle cx="16" cy="17" r="10" /><path d="M16 17 22 12" /><path d="M10 22h12" /></svg>;
    case "summary-4":
    case "feature-3":
      return <svg {...iconProps}><path d="M15 7a3 3 0 0 1 6 0v11a7 7 0 1 1-6 0V7Z" /><path d="M18 10v10" /></svg>;
    case "summary-5":
    case "feature-9":
      return <svg {...iconProps}><path d="M6 16h20" /><path d="m10 11-5 5 5 5" /><path d="m22 11 5 5-5 5" /></svg>;
    case "summary-6":
    case "feature-7":
      return <svg {...iconProps}><path d="M8 24 24 8" /><path d="M10 8h6M8 10v6M16 24h6M24 16v6" /><path d="M12 20 20 12" /></svg>;
    case "summary-7":
    case "feature-10":
      return <svg {...iconProps}><circle cx="16" cy="16" r="10" /><circle cx="16" cy="16" r="5" /></svg>;
    case "feature-0":
      return <svg {...iconProps}><path d="M8 11h16" /><path d="M10 11V7h12v4" /><path d="M9 15h14v9H9v-9Z" /></svg>;
    case "feature-1":
      return <svg {...iconProps}><path d="M5 17c4-7 8 7 12 0s8 7 10 0" /><path d="M5 23c4-7 8 7 12 0s8 7 10 0" /></svg>;
    case "feature-2":
      return <svg {...iconProps}><path d="M9 25V7h14v18" /><path d="M13 10h6M13 14h6M13 18h6M13 22h6" /></svg>;
    case "feature-4":
      return <svg {...iconProps}><circle cx="16" cy="16" r="10" /><path d="M11 19c2 3 8 3 10-2" /><path d="M11 13c2-3 8-3 10 2" /><path d="M16 6v20" /></svg>;
    case "feature-5":
      return <svg {...iconProps}><path d="M8 16h16" /><path d="M12 12h8v8h-8z" /><circle cx="16" cy="16" r="3" /></svg>;
    case "feature-8":
      return <svg {...iconProps}><path d="M7 19h8v6H7z" /><path d="M17 7h8v6h-8z" /><path d="M15 22c6 0 8-3 8-9" /><path d="M17 10c-6 0-8 3-8 9" /></svg>;
    case "feature-11":
      return <svg {...iconProps}><path d="M16 6v20" /><path d="M9 9h14" /><path d="M9 23h14" /><circle cx="16" cy="16" r="5" /></svg>;
    default:
      return <svg {...iconProps}><circle cx="16" cy="16" r="10" /></svg>;
  }
}

function CatalogApplicationIcon({ icon }: { icon: CatalogApplicationIconId }) {
  const iconProps = {
    className: "oleocon-viewer-catalog-application-icon",
    viewBox: "0 0 32 32",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  switch (icon) {
    case "oilGas":
      return (
        <svg {...iconProps}>
          <path d="M16 3c4 5 7 9 7 14a7 7 0 0 1-14 0c0-4 3-7 7-14Z" />
          <path d="M16 18c2-2 4-1 4 2a4 4 0 0 1-8 0c0-2 2-4 4-7" />
        </svg>
      );
    case "agriculture":
      return (
        <svg {...iconProps}>
          <path d="M7 21h12l2-6h-7l-2-5H8" />
          <path d="M22 15h4v6" />
          <circle cx="10" cy="23" r="4" />
          <circle cx="24" cy="23" r="2.5" />
        </svg>
      );
    case "hydraulicIndustry":
      return (
        <svg {...iconProps}>
          <path d="M5 25V14l6 4v-4l6 4v-7h10v14H5Z" />
          <path d="M9 25v-4h4v4M17 25v-4h4v4" />
        </svg>
      );
    case "earthMoving":
      return (
        <svg {...iconProps}>
          <path d="M6 22h12l4-7h4l-2 7" />
          <path d="M17 15h-5l-2-5h9l3 5" />
          <circle cx="10" cy="24" r="3" />
          <circle cx="22" cy="24" r="3" />
        </svg>
      );
    case "hydraulicEquipment":
      return (
        <svg {...iconProps}>
          <path d="M7 22 20 9" />
          <path d="m18 7 7 7" />
          <path d="m8 21-3 5 5-3" />
          <path d="M12 17h8l5 5" />
        </svg>
      );
    case "concreteVehicles":
      return (
        <svg {...iconProps}>
          <path d="M5 22h17v-8H5v8Z" />
          <path d="M22 17h4l2 5h-6" />
          <path d="M10 14c4-5 10-2 12 3" />
          <circle cx="10" cy="24" r="2.5" />
          <circle cx="24" cy="24" r="2.5" />
        </svg>
      );
    case "vehicles":
      return (
        <svg {...iconProps}>
          <path d="M4 20h17v-8H4v8Z" />
          <path d="M21 15h4l3 5h-7" />
          <circle cx="10" cy="23" r="3" />
          <circle cx="24" cy="23" r="3" />
        </svg>
      );
    case "chemicalIndustry":
      return (
        <svg {...iconProps}>
          <path d="M13 5h6" />
          <path d="M15 5v8L8 25h16l-7-12V5" />
          <path d="M11 21h10" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Oleocon3DViewerPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLElement | null>(null);
  const rightPanelRef = useRef<HTMLElement | null>(null);
  const partListRef = useRef<HTMLDivElement | null>(null);
  const partRowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const previousSelectedPartIdsForAutoScrollRef = useRef<string[]>([]);
  const previousLeftPanelOpenForAutoScrollRef = useRef(false);
  const lastAutoScrollPartIdRef = useRef<string | null>(null);
  const colorsSectionRef = useRef<HTMLElement | null>(null);
  const quickActionsSectionRef = useRef<HTMLElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const partsRef = useRef<ViewerPart[]>([]);
  const annotationsRef = useRef<Annotation[]>([]);
  const paintMarksRef = useRef<PaintMark[]>([]);
  const activePaintStrokeRef = useRef<PaintStrokeState>({ pointerId: null, markId: null, lastX: 0, lastY: 0 });
  const activeArrowBrushRef = useRef<ActiveArrowBrushState>({ pointerId: null, markId: null, tipX: 0, tipY: 0 });
  const selectedPartIdsRef = useRef<string[]>([]);
  const currentToolRef = useRef<ViewerTool>("select");
  const annotationTextRef = useRef("Inspection note");
  const toolColorRef = useRef(DEFAULT_TOOL_COLOR);
  const wireframeRef = useRef(false);
  const lookModeRef = useRef<LookMode>("originalMaterial");
  const lookByPartIdRef = useRef<Record<string, LookMode>>({});
  const lookEdgeOverlaysRef = useRef<Map<string, THREE.LineSegments>>(new Map());
  const lookSurfaceOverlaysRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const explodeRef = useRef(0);
  const isolatedPartIdsRef = useRef<string[]>([]);
  const backgroundRef = useRef(BACKGROUNDS[0].value);
  const lightingPresetRef = useRef<LightingPresetId>(DEFAULT_LIGHTING_PRESET);
  const lightingRigRef = useRef<LightingRigRefs | null>(null);
  const universalRigRef = useRef<UniversalRigRefs | null>(null);
  const modelPresentationGroupRef = useRef<THREE.Group | null>(null);
  const explodePresentationValueRef = useRef(0);
  const separatePresentationBaseRef = useRef<SeparatePresentationBase | null>(null);
  const separatePresentationDriveRef = useRef(false);
  const dragRef = useRef<ViewerDragState>({ pointerId: null, button: -1, mode: null, lastX: 0, lastY: 0, moved: false, totalMotion: 0 });
  const annotationDragRef = useRef<AnnotationDragState>({ pointerId: null, annotationId: null, lastX: 0, lastY: 0, moved: false });
  const actionPastRef = useRef<ViewerActionSnapshot[]>([]);
  const actionFutureRef = useRef<ViewerActionSnapshot[]>([]);
  const isRestoringActionRef = useRef(false);
  const autoRotateRef = useRef<AutoRotateState>({ active: false, returningToDefault: false });
  const mobilePanelGestureRef = useRef<{
    panel: "left" | "right" | null;
    pointerId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    panelWasOpen: boolean;
    startedExpanded: boolean;
  }>({
    panel: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    panelWasOpen: false,
    startedExpanded: false,
  });
  const suppressMobilePanelToggleClickRef = useRef<"left" | "right" | null>(null);

  const [loadState, setLoadState] = useState("Loading Oleocon model");
  const [loadError, setLoadError] = useState("");
  const [parts, setParts] = useState<PartItem[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<ViewerTool>("select");
  const [lookMode, setLookMode] = useState<LookMode>("originalMaterial");
  const [lookStateVersion, setLookStateVersion] = useState(0);
  const [annotationText, setAnnotationText] = useState("Inspection note");
  const [brushSize, setBrushSize] = useState(8);
  const [paintMarks, setPaintMarks] = useState<PaintMark[]>([]);
  const [toolColor, setToolColor] = useState(DEFAULT_TOOL_COLOR);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [explode, setExplode] = useState(0);
  const explodeSliderRef = useRef<HTMLInputElement | null>(null);
  const [background, setBackground] = useState(BACKGROUNDS[0].value);
  const [lightingPreset, setLightingPreset] = useState<LightingPresetId>(DEFAULT_LIGHTING_PRESET);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [mobileExpandedPanel, setMobileExpandedPanel] = useState<"left" | "right" | null>(null);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isAutoRotateActive, setIsAutoRotateActive] = useState(false);
  const [isCatalogPanelOpen, setIsCatalogPanelOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<"overview" | "tables">("overview");
  const [immersiveAccessMode, setImmersiveAccessMode] = useState<ImmersiveAccessMode | null>(null);
  const [immersiveAccessPassword, setImmersiveAccessPassword] = useState("");
  const [immersiveAccessMessage, setImmersiveAccessMessage] = useState("");
  const [isAccessRequestOpen, setIsAccessRequestOpen] = useState(false);
  const [accessRequestIdentity, setAccessRequestIdentity] = useState("");
  const [accessRequestStatus, setAccessRequestStatus] = useState<AccessRequestStatus>("idle");
  const [accessRequestProgress, setAccessRequestProgress] = useState(0);
  const accessRequestDragRef = useRef<{ pointerId: number | null; startX: number; startProgress: number }>({ pointerId: null, startX: 0, startProgress: 0 });
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourCardStyle, setTourCardStyle] = useState<CSSProperties | undefined>(undefined);
  const [tourCardStyleTarget, setTourCardStyleTarget] = useState<TourTarget | null>(null);
  const [tourCardStyleStepId, setTourCardStyleStepId] = useState<string | null>(null);
  const [canUndoAction, setCanUndoAction] = useState(false);
  const [canRedoAction, setCanRedoAction] = useState(false);

  const selectedParts = useMemo(() => parts.filter((part) => selectedPartIds.includes(part.id)), [parts, selectedPartIds]);
  const selectedPart = selectedParts[0] ?? null;
  const selectedPartSummary = selectedParts.length === 0
    ? "No part selected"
    : selectedParts.length === 1
      ? (selectedPart?.name ?? "1 part selected")
      : `${selectedParts.length} parts selected`;
  const selectedAnnotation = selectedAnnotationId ? annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null : null;
  const selectedAnnotationIndex = selectedAnnotation ? annotations.findIndex((annotation) => annotation.id === selectedAnnotation.id) : -1;
  const selectedAnnotationLabel = selectedAnnotation
    ? selectedAnnotation.label ?? formatAnnotationLabel(Math.max(selectedAnnotationIndex + 1, 1))
    : "";
  const viewerToolSummary = selectedAnnotation ? selectedAnnotationLabel : selectedPartSummary;
  const isPaintToolActive = currentTool === "brush" || currentTool === "arrowBrush";
  const selectedAnnotationReceivesColor = Boolean(selectedAnnotation && !isPaintToolActive);
  const activeColorValue = selectedAnnotationReceivesColor && selectedAnnotation ? selectedAnnotation.color : toolColor;
  const brushSizeProgress = `${((brushSize - 2) / 18) * 100}%`;
  const activeTourStep = isTourOpen ? VIEWER_TOUR_STEPS[tourStepIndex] : null;
  const activeImmersiveAccessCopy = immersiveAccessMode ? IMMERSIVE_ACCESS_COPY[immersiveAccessMode] : null;
  const isTourTarget = (target: TourTarget) => activeTourStep?.target === target;
  const activeTourPanelNeedsOpen = activeTourStep?.target === "parts" || activeTourStep?.target === "tools" || activeTourStep?.target === "colors" || activeTourStep?.target === "quickActions";
  const activeTourPanelIsOpen = !activeTourPanelNeedsOpen
    ? true
    : activeTourStep?.target === "parts"
      ? isLeftPanelOpen
      : isRightPanelOpen;
  const activeTourCardStyle = activeTourStep && activeTourPanelNeedsOpen
    ? (activeTourPanelIsOpen && tourCardStyleTarget === activeTourStep.target && tourCardStyleStepId === activeTourStep.id ? tourCardStyle : ({ opacity: 0 } as CSSProperties))
    : undefined;

  const resetMobilePanelGesture = () => {
    mobilePanelGestureRef.current = {
      panel: null,
      pointerId: null,
      startX: 0,
      startY: 0,
      startTime: 0,
      panelWasOpen: false,
      startedExpanded: false,
    };
  };

  const handleMobilePanelTitlePointerDown = (
    panel: "left" | "right",
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 699px)").matches ||
      event.pointerType === "mouse"
    ) {
      return;
    }

    const panelWasOpen = panel === "left" ? isLeftPanelOpen : isRightPanelOpen;
    mobilePanelGestureRef.current = {
      panel,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: window.performance.now(),
      panelWasOpen,
      startedExpanded: mobileExpandedPanel === panel,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can be unavailable on older mobile browsers.
    }
  };

  const handleMobilePanelTitlePointerUp = (
    panel: "left" | "right",
    event: PointerEvent<HTMLButtonElement>
  ) => {
    const gesture = mobilePanelGestureRef.current;
    resetMobilePanelGesture();

    if (
      gesture.panel !== panel ||
      gesture.pointerId !== event.pointerId ||
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 699px)").matches
    ) {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const verticalDistance = Math.abs(deltaY);
    const holdDuration = window.performance.now() - gesture.startTime;
    const movedPastTapTolerance = verticalDistance > 14 || Math.abs(deltaX) > 14;

    if (movedPastTapTolerance) {
      suppressMobilePanelToggleClickRef.current = panel;
    }

    const isHeldVerticalDrag =
      gesture.panelWasOpen &&
      holdDuration >= 260 &&
      verticalDistance >= 116 &&
      verticalDistance > Math.abs(deltaX) * 1.5;

    if (!isHeldVerticalDrag) return;

    if (deltaY < 0 && !gesture.startedExpanded) {
      setMobileExpandedPanel(panel);
      return;
    }

    if (deltaY > 0 && gesture.startedExpanded) {
      setMobileExpandedPanel(null);
    }
  };

  const handleMobilePanelTitlePointerCancel = () => {
    resetMobilePanelGesture();
  };

  const toggleViewerPanel = (panel: "left" | "right") => {
    setMobileExpandedPanel(null);
    resetMobilePanelGesture();

    if (panel === "left") {
      setIsLeftPanelOpen((value) => !value);
      return;
    }

    setIsRightPanelOpen((value) => !value);
  };

  const handleViewerPanelToggleClick = (
    panel: "left" | "right",
    event: MouseEvent<HTMLButtonElement>
  ) => {
    if (suppressMobilePanelToggleClickRef.current === panel) {
      suppressMobilePanelToggleClickRef.current = null;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    toggleViewerPanel(panel);
  };

  const setExplodeImmediate = (nextExplode: number, syncReactState = false) => {
    const clampedExplode = clamp(nextExplode, 0, 1);
    explodeRef.current = clampedExplode;

    if (separatePresentationBaseRef.current) {
      separatePresentationDriveRef.current = true;
    }

    if (explodeSliderRef.current && explodeSliderRef.current.value !== String(clampedExplode)) {
      explodeSliderRef.current.value = String(clampedExplode);
    }

    if (syncReactState) {
      setExplode(clampedExplode);
    }
  };


  useEffect(() => {
    if (!isModelReady || loadError) return;

    try {
      if (window.localStorage.getItem(TOUR_STORAGE_KEY) === "1") return;
    } catch {
      // localStorage can be unavailable in private/restricted browser modes.
    }

    setTourStepIndex(0);
    setIsTourOpen(true);
  }, [isModelReady, loadError]);

  useEffect(() => {
    setMobileExpandedPanel((currentPanel) => {
      if (currentPanel === "left" && !isLeftPanelOpen) return null;
      if (currentPanel === "right" && !isRightPanelOpen) return null;
      return currentPanel;
    });
  }, [isLeftPanelOpen, isRightPanelOpen]);

  useEffect(() => {
    if (!activeTourStep) return;

    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;

    if (activeTourStep.target === "parts") {
      setIsLeftPanelOpen(true);
      if (isMobile) setIsRightPanelOpen(false);
    }

    if (activeTourStep.target === "tools" || activeTourStep.target === "colors" || activeTourStep.target === "quickActions") {
      setIsRightPanelOpen(true);
      if (isMobile) setIsLeftPanelOpen(false);
    }
  }, [activeTourStep]);

  useEffect(() => {
    const target = activeTourStep?.target;
    const isPanelTourTarget = target === "parts" || target === "tools" || target === "colors" || target === "quickActions";

    if (!activeTourStep || !isPanelTourTarget || typeof window === "undefined") {
      setTourCardStyle(undefined);
      setTourCardStyleTarget(null);
      setTourCardStyleStepId(null);
      return;
    }

    const requiredPanelIsOpen = target === "parts" ? isLeftPanelOpen : isRightPanelOpen;
    if (!requiredPanelIsOpen) {
      setTourCardStyleTarget(target);
      setTourCardStyleStepId(activeTourStep.id);
      setTourCardStyle({ opacity: 0 } as CSSProperties);
      return;
    }

    let animationFrame = 0;
    let settleTimer = 0;

    const updateTourCardPlacement = () => {
      const verticalElement = target === "parts"
        ? leftPanelRef.current
        : target === "colors"
          ? colorsSectionRef.current
          : target === "quickActions"
            ? quickActionsSectionRef.current
            : rightPanelRef.current;
      const horizontalElement = target === "parts" ? leftPanelRef.current : rightPanelRef.current;

      if (!verticalElement || !horizontalElement) {
        setTourCardStyleTarget(target);
        setTourCardStyleStepId(activeTourStep.id);
        setTourCardStyle({ opacity: 0 } as CSSProperties);
        return;
      }

      const verticalRect = verticalElement.getBoundingClientRect();
      const horizontalRect = horizontalElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = Math.round(Math.max(24, Math.min(38, viewportWidth * 0.024)));
      const bottom = Math.round(Math.max(24, viewportHeight - verticalRect.bottom));
      const availableWidth = target === "parts"
        ? viewportWidth - horizontalRect.right - gap - 24
        : horizontalRect.left - gap - 24;
      const width = Math.round(Math.max(300, Math.min(452, availableWidth)));
      const maxHeight = Math.max(260, viewportHeight - bottom - 64);

      const nextStyle = {
        "--viewer-tour-card-left": target === "parts" ? `${Math.round(horizontalRect.right + gap)}px` : "auto",
        "--viewer-tour-card-right": target === "tools" || target === "colors" || target === "quickActions" ? `${Math.round(viewportWidth - horizontalRect.left + gap)}px` : "auto",
        "--viewer-tour-card-bottom": `${bottom}px`,
        "--viewer-tour-card-width": `${width}px`,
        "--viewer-tour-card-max-height": `${Math.round(maxHeight)}px`,
        opacity: 1,
      } as CSSProperties;

      setTourCardStyleTarget(target);
      setTourCardStyleStepId(activeTourStep.id);
      setTourCardStyle(nextStyle);
    };

    const requestTourCardPlacement = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateTourCardPlacement);
    };

    setTourCardStyleTarget(target);
    setTourCardStyleStepId(activeTourStep.id);
    setTourCardStyle({ opacity: 0 } as CSSProperties);
    settleTimer = window.setTimeout(requestTourCardPlacement, 420);

    window.addEventListener("resize", requestTourCardPlacement);
    window.addEventListener("scroll", requestTourCardPlacement, true);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(requestTourCardPlacement) : null;
    if (leftPanelRef.current) resizeObserver?.observe(leftPanelRef.current);
    if (rightPanelRef.current) resizeObserver?.observe(rightPanelRef.current);
    if (colorsSectionRef.current) resizeObserver?.observe(colorsSectionRef.current);
    if (quickActionsSectionRef.current) resizeObserver?.observe(quickActionsSectionRef.current);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", requestTourCardPlacement);
      window.removeEventListener("scroll", requestTourCardPlacement, true);
      resizeObserver?.disconnect();
    };
  }, [activeTourStep?.target, isLeftPanelOpen, isRightPanelOpen]);

  useEffect(() => {
    selectedPartIdsRef.current = selectedPartIds;
  }, [selectedPartIds]);

  useEffect(() => {
    const previousSelectedPartIds = previousSelectedPartIdsForAutoScrollRef.current;
    const newlySelectedPartId = [...selectedPartIds]
      .reverse()
      .find((partId) => !previousSelectedPartIds.includes(partId)) ?? null;
    const panelJustOpened = isLeftPanelOpen && !previousLeftPanelOpenForAutoScrollRef.current;

    previousSelectedPartIdsForAutoScrollRef.current = [...selectedPartIds];
    previousLeftPanelOpenForAutoScrollRef.current = isLeftPanelOpen;

    if (newlySelectedPartId) {
      lastAutoScrollPartIdRef.current = newlySelectedPartId;
    } else if (!selectedPartIds.length) {
      lastAutoScrollPartIdRef.current = null;
    }

    const targetPartId = newlySelectedPartId ?? (panelJustOpened ? lastAutoScrollPartIdRef.current : null);
    if (!targetPartId || !isLeftPanelOpen || typeof window === "undefined") return;

    // Desktop/laptop only. Tablet and mobile panel behavior remains untouched.
    if (!window.matchMedia("(min-width: 1025px)").matches) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const partList = partListRef.current;
      const partRow = partRowRefs.current.get(targetPartId);
      if (!partList || !partRow) return;

      const listRect = partList.getBoundingClientRect();
      const rowRect = partRow.getBoundingClientRect();
      const isFullyVisible = rowRect.top >= listRect.top && rowRect.bottom <= listRect.bottom;
      if (isFullyVisible) return;

      const centeredScrollTop =
        partList.scrollTop +
        (rowRect.top - listRect.top) -
        (partList.clientHeight - partRow.offsetHeight) * 0.5;

      partList.scrollTo({
        top: Math.max(0, centeredScrollTop),
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [selectedPartIds, isLeftPanelOpen]);

  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  useEffect(() => {
    annotationTextRef.current = annotationText;
  }, [annotationText]);

  useEffect(() => {
    toolColorRef.current = toolColor;
  }, [toolColor]);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    paintMarksRef.current = paintMarks;
  }, [paintMarks]);

  useEffect(() => {
    if (!selectedAnnotationId) return;
    if (annotations.some((annotation) => annotation.id === selectedAnnotationId)) return;
    setSelectedAnnotationId(null);
  }, [annotations, selectedAnnotationId]);

  useEffect(() => {
    wireframeRef.current = wireframe;
  }, [wireframe]);

  useEffect(() => {
    lookModeRef.current = lookMode;
    syncLookEdgeOverlays(lookMode);
  }, [lookMode]);

  useEffect(() => {
    explodeRef.current = explode;

    if (explodeSliderRef.current && document.activeElement !== explodeSliderRef.current) {
      explodeSliderRef.current.value = String(explode);
    }
  }, [explode]);

  useEffect(() => {
    backgroundRef.current = background;
  }, [background]);

  useEffect(() => {
    lightingPresetRef.current = lightingPreset;
    applyLightingPreset(lightingPreset, rendererRef.current, lightingRigRef.current, partsRef.current);
  }, [lightingPreset]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let frameId = 0;
    let environmentTexture: THREE.Texture | null = null;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(DEFAULT_CAMERA_FOV, 1, 0.03, 1000);
    camera.position.set(0, 0, DEFAULT_CAMERA_DISTANCE);
    cameraRef.current = camera;

    if (activeOleoconViewerRenderer) {
      releaseOleoconViewerRenderer(activeOleoconViewerRenderer);
      activeOleoconViewerRenderer = null;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setLoadError("WebGL context is blocked by the browser. Close this tab, open a new tab, and reload after replacing this file.");
      setLoadState("WebGL context blocked");
      setIsModelReady(false);
      return undefined;
    }

    activeOleoconViewerRenderer = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    RectAreaLightUniformsLib.init();

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setLoadError("WebGL context was lost. Close this tab and reopen /work/oleocon/3d.");
      setLoadState("WebGL context lost");
      setIsModelReady(false);
    };

    const handleContextRestored = () => {
      setLoadError("WebGL context restored. Reload the page once.");
      setLoadState("WebGL context restored");
    };

    renderer.domElement.addEventListener("webglcontextlost", handleContextLost, false);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored, false);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const fallbackRoomEnvironment = new RoomEnvironment();
    const fallbackEnvironment = pmremGenerator.fromScene(fallbackRoomEnvironment, 0.06).texture;
    fallbackRoomEnvironment.dispose();
    environmentTexture = fallbackEnvironment;
    scene.environment = fallbackEnvironment;

    const loadHdri = (index = 0) => {
      const hdriUrl = HDRI_URLS[index];

      if (!hdriUrl) {
        setLoadError("");
        setLoadState("Fallback studio environment active");
        return;
      }

      const hdrLoader = new RGBELoader();
      setLoadState(`Loading ${hdriUrl}`);

      hdrLoader.load(
        hdriUrl,
        (hdrTexture) => {
          if (disposed) {
            hdrTexture.dispose();
            return;
          }

          const generated = pmremGenerator.fromEquirectangular(hdrTexture).texture;
          hdrTexture.dispose();

          if (environmentTexture && environmentTexture !== generated) {
            environmentTexture.dispose();
          }

          environmentTexture = generated;
          scene.environment = generated;
          scene.background = null;

          if ("environmentRotation" in scene) {
            (scene as THREE.Scene & { environmentRotation?: THREE.Euler }).environmentRotation = new THREE.Euler(0, HDRI_ENV_ROTATION_Y, 0);
          }
          if ("backgroundRotation" in scene) {
            (scene as THREE.Scene & { backgroundRotation?: THREE.Euler }).backgroundRotation = new THREE.Euler(0, HDRI_ENV_ROTATION_Y, 0);
          }

          applyLightingPreset(lightingPresetRef.current, renderer, lightingRigRef.current, partsRef.current);
          setLoadError("");
          setLoadState((current) => current.startsWith("Loaded") || current.includes("Loading") ? current : "urban_street_01 HDRI active");
        },
        undefined,
        () => loadHdri(index + 1)
      );
    };

    if (USE_URBAN_HDRI_ON_LOAD) {
      loadHdri();
    } else {
      setLoadError("");
      setLoadState("Neutral studio environment active");
      applyLightingPreset(lightingPresetRef.current, renderer, lightingRigRef.current, partsRef.current);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x20211f, 0);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0);
    keyLight.position.set(4.8, 5.8, 4.6);

    const fillLight = new THREE.DirectionalLight(0x76b900, 0);
    fillLight.position.set(-5.8, 1.9, -4.7);

    const rimLight = new THREE.DirectionalLight(0xe8f4df, 0);
    rimLight.position.set(5.8, 0.5, -4.2);

    const topLight = new THREE.DirectionalLight(0xffffff, 0);
    topLight.position.set(0, 6.4, 1.2);

    const leftAreaLight = new THREE.RectAreaLight(0xffffff, 0, SIDE_AREA_LIGHT_CONTROLS.leftWidth, SIDE_AREA_LIGHT_CONTROLS.leftHeight);
    leftAreaLight.position.set(SIDE_AREA_LIGHT_CONTROLS.leftX, SIDE_AREA_LIGHT_CONTROLS.leftY, SIDE_AREA_LIGHT_CONTROLS.leftZ);
    leftAreaLight.lookAt(0, 0, 0);

    const rightAreaLight = new THREE.RectAreaLight(0xffffff, 0, SIDE_AREA_LIGHT_CONTROLS.rightWidth, SIDE_AREA_LIGHT_CONTROLS.rightHeight);
    rightAreaLight.position.set(SIDE_AREA_LIGHT_CONTROLS.rightX, SIDE_AREA_LIGHT_CONTROLS.rightY, SIDE_AREA_LIGHT_CONTROLS.rightZ);
    rightAreaLight.lookAt(0, 0, 0);

    const topCapAreaLight = new THREE.RectAreaLight(0xffffff, 0, CAP_AREA_LIGHT_CONTROLS.topWidth, CAP_AREA_LIGHT_CONTROLS.topHeight);
    topCapAreaLight.position.set(CAP_AREA_LIGHT_CONTROLS.topX, CAP_AREA_LIGHT_CONTROLS.topY, CAP_AREA_LIGHT_CONTROLS.topZ);
    topCapAreaLight.lookAt(0, 1.35, 0);

    const bottomCapAreaLight = new THREE.RectAreaLight(0xffffff, 0, CAP_AREA_LIGHT_CONTROLS.bottomWidth, CAP_AREA_LIGHT_CONTROLS.bottomHeight);
    bottomCapAreaLight.position.set(CAP_AREA_LIGHT_CONTROLS.bottomX, CAP_AREA_LIGHT_CONTROLS.bottomY, CAP_AREA_LIGHT_CONTROLS.bottomZ);
    bottomCapAreaLight.lookAt(0, -1.35, 0);

    const upperLeftAreaLight = new THREE.RectAreaLight(0xffffff, 0, SIDE_ZONE_LIGHT_CONTROLS.upperWidth, SIDE_ZONE_LIGHT_CONTROLS.upperHeight);
    upperLeftAreaLight.position.set(SIDE_ZONE_LIGHT_CONTROLS.leftX, SIDE_ZONE_LIGHT_CONTROLS.upperY, SIDE_ZONE_LIGHT_CONTROLS.z);
    upperLeftAreaLight.lookAt(0, SIDE_ZONE_LIGHT_CONTROLS.upperTargetY, 0);

    const upperRightAreaLight = new THREE.RectAreaLight(0xffffff, 0, SIDE_ZONE_LIGHT_CONTROLS.upperWidth, SIDE_ZONE_LIGHT_CONTROLS.upperHeight);
    upperRightAreaLight.position.set(SIDE_ZONE_LIGHT_CONTROLS.rightX, SIDE_ZONE_LIGHT_CONTROLS.upperY, SIDE_ZONE_LIGHT_CONTROLS.z);
    upperRightAreaLight.lookAt(0, SIDE_ZONE_LIGHT_CONTROLS.upperTargetY, 0);

    const lowerLeftAreaLight = new THREE.RectAreaLight(0xffffff, 0, SIDE_ZONE_LIGHT_CONTROLS.lowerWidth, SIDE_ZONE_LIGHT_CONTROLS.lowerHeight);
    lowerLeftAreaLight.position.set(SIDE_ZONE_LIGHT_CONTROLS.leftX, SIDE_ZONE_LIGHT_CONTROLS.lowerY, SIDE_ZONE_LIGHT_CONTROLS.z);
    lowerLeftAreaLight.lookAt(0, SIDE_ZONE_LIGHT_CONTROLS.lowerTargetY, 0);

    const lowerRightAreaLight = new THREE.RectAreaLight(0xffffff, 0, SIDE_ZONE_LIGHT_CONTROLS.lowerWidth, SIDE_ZONE_LIGHT_CONTROLS.lowerHeight);
    lowerRightAreaLight.position.set(SIDE_ZONE_LIGHT_CONTROLS.rightX, SIDE_ZONE_LIGHT_CONTROLS.lowerY, SIDE_ZONE_LIGHT_CONTROLS.z);
    lowerRightAreaLight.lookAt(0, SIDE_ZONE_LIGHT_CONTROLS.lowerTargetY, 0);

    scene.add(
      ambientLight,
      hemisphereLight,
      keyLight,
      fillLight,
      rimLight,
      topLight,
      leftAreaLight,
      rightAreaLight,
      topCapAreaLight,
      bottomCapAreaLight,
      upperLeftAreaLight,
      upperRightAreaLight,
      lowerLeftAreaLight,
      lowerRightAreaLight
    );

    lightingRigRef.current = {
      ambientLight,
      hemisphereLight,
      keyLight,
      fillLight,
      rimLight,
      topLight,
      leftAreaLight,
      rightAreaLight,
      topCapAreaLight,
      bottomCapAreaLight,
      upperLeftAreaLight,
      upperRightAreaLight,
      lowerLeftAreaLight,
      lowerRightAreaLight,
    };

    const pivot = new THREE.Group();
    pivot.name = "oleocon_universal_center_pivot";
    scene.add(pivot);

    const modelPresentationGroup = new THREE.Group();
    modelPresentationGroup.name = "oleocon_separate_parts_presentation_group";
    pivot.add(modelPresentationGroup);
    modelPresentationGroupRef.current = modelPresentationGroup;

    const defaultTarget = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
    const identityRotation = new THREE.Quaternion();
    const spinAxis = new THREE.Vector3(0, 1, 0);
    const spinRotation = new THREE.Quaternion();

    universalRigRef.current = {
      pivot,
      cameraTarget: defaultTarget.clone(),
      targetCameraTarget: defaultTarget.clone(),
      cameraDistance: DEFAULT_CAMERA_DISTANCE,
      targetCameraDistance: DEFAULT_CAMERA_DISTANCE,
      rotation: new THREE.Quaternion(),
      targetRotation: new THREE.Quaternion(),
      inertiaAxis: new THREE.Vector3(0, 1, 0),
      inertiaSpeed: 0,
      inertiaEnabled: false,
    };
    updateUniversalRig(camera, universalRigRef.current);

    const applyExplode = () => {
      const value = explodeRef.current * EXPLODE_DISTANCE;
      partsRef.current.forEach((part) => {
        part.mesh.position.copy(part.originalPosition).addScaledVector(part.explodeDirection, value);
      });
    };

    const applySeparatePartsPresentation = () => {
      const rawExplode = THREE.MathUtils.clamp(explodeRef.current, 0, 1);
      explodePresentationValueRef.current += (rawExplode - explodePresentationValueRef.current) * 0.18;

      if (rawExplode <= 0.001 && explodePresentationValueRef.current <= 0.001) {
        explodePresentationValueRef.current = 0;
        separatePresentationBaseRef.current = null;
        separatePresentationDriveRef.current = false;
        const presentationGroup = modelPresentationGroupRef.current;
        if (presentationGroup) {
          presentationGroup.rotation.z = 0;
          presentationGroup.quaternion.identity();
        }
        return;
      }

      const presentationValue = THREE.MathUtils.smoothstep(explodePresentationValueRef.current, 0, 1);
      const presentationGroup = modelPresentationGroupRef.current;
      const rig = universalRigRef.current;

      if (rig && rawExplode > 0.001 && !separatePresentationBaseRef.current) {
        separatePresentationBaseRef.current = {
          cameraTarget: rig.cameraTarget.clone(),
          cameraDistance: rig.cameraDistance,
          rotation: rig.rotation.clone(),
        };
        separatePresentationDriveRef.current = true;
      }

      if (presentationGroup) {
        presentationGroup.rotation.z = SEPARATE_PARTS_PRESENTATION_ROTATION_Z * presentationValue;
      }

      const base = separatePresentationBaseRef.current;
      if (rig && base && separatePresentationDriveRef.current) {
        rig.targetRotation.copy(base.rotation.clone().slerp(identityRotation, presentationValue));
        rig.targetCameraTarget.copy(base.cameraTarget.clone().lerp(defaultTarget, presentationValue));
        rig.targetCameraDistance = THREE.MathUtils.lerp(
          base.cameraDistance,
          DEFAULT_CAMERA_DISTANCE + SEPARATE_PARTS_CAMERA_PULLBACK,
          presentationValue
        );

        if (Math.abs(rawExplode - explodePresentationValueRef.current) <= 0.003) {
          separatePresentationDriveRef.current = false;
        }
      }
    };

    const applyVisibilityMode = () => {
      const isolatedIds = isolatedPartIdsRef.current;
      const hasIsolation = isolatedIds.length > 0;
      const appliedLooks = lookByPartIdRef.current;

      partsRef.current.forEach((part) => {
        const isIsolatedOut = hasIsolation && !isolatedIds.includes(part.id);
        const shouldShow = hasIsolation ? (!isIsolatedOut && part.visible) : part.visible;
        const partLookMode = appliedLooks[part.id] ?? "originalMaterial";

        if (part.mesh.visible !== shouldShow) part.mesh.visible = shouldShow;
        applyPartLookVisualState(part, partLookMode, shouldShow);
      });
    };

    const projectAnnotations = () => {
      const overlay = overlayRef.current;
      const rig = universalRigRef.current;
      if (!overlay || !rig) return;

      const rect = overlay.getBoundingClientRect();
      const nextAnnotations: Annotation[] = annotationsRef.current.map((annotation): Annotation => {
        if (annotation.kind === "screen") {
          return {
            ...annotation,
            screen: {
              ...annotation.screen,
              visible: true,
            },
          };
        }

        const position = new THREE.Vector3(...annotation.local);
        rig.pivot.localToWorld(position);
        position.project(camera);
        const visible = position.z > -1 && position.z < 1;
        return {
          ...annotation,
          kind: "model" as const,
          screen: {
            x: (position.x * 0.5 + 0.5) * rect.width,
            y: (-position.y * 0.5 + 0.5) * rect.height,
            visible,
          },
        };
      });

      const changed = nextAnnotations.some((annotation, index) => {
        const previous = annotationsRef.current[index];
        if (!previous) return true;
        return previous.screen.visible !== annotation.screen.visible || Math.abs(previous.screen.x - annotation.screen.x) > 0.35 || Math.abs(previous.screen.y - annotation.screen.y) > 0.35;
      });

      if (changed) {
        annotationsRef.current = nextAnnotations;
        setAnnotations(nextAnnotations);
      }
    };

    const renderLoop = () => {
      if (dragRef.current.pointerId === null) {
        applyRotationInertia(universalRigRef.current);
      }

      const autoRotate = autoRotateRef.current;
      if (universalRigRef.current && autoRotate.active) {
        const spinStep = 0.0085;
        spinRotation.setFromAxisAngle(spinAxis, spinStep);
        universalRigRef.current.targetRotation.premultiply(spinRotation).normalize();
      }

      if (universalRigRef.current && autoRotate.returningToDefault) {
        universalRigRef.current.rotation.slerp(identityRotation, 0.24);
        universalRigRef.current.cameraTarget.copy(defaultTarget);
        universalRigRef.current.cameraDistance += (DEFAULT_CAMERA_DISTANCE - universalRigRef.current.cameraDistance) * 0.24;
        universalRigRef.current.targetRotation.copy(identityRotation);
        universalRigRef.current.targetCameraTarget.copy(defaultTarget);
        universalRigRef.current.targetCameraDistance = DEFAULT_CAMERA_DISTANCE;

        const angleToDefault = universalRigRef.current.rotation.angleTo(identityRotation);
        const targetOffset = universalRigRef.current.cameraTarget.distanceTo(defaultTarget);
        const distanceOffset = Math.abs(universalRigRef.current.cameraDistance - DEFAULT_CAMERA_DISTANCE);

        if (angleToDefault < 0.018 && targetOffset < 0.018 && distanceOffset < 0.018) {
          universalRigRef.current.rotation.copy(identityRotation);
          universalRigRef.current.targetRotation.copy(identityRotation);
          universalRigRef.current.cameraTarget.copy(defaultTarget);
          universalRigRef.current.targetCameraTarget.copy(defaultTarget);
          universalRigRef.current.cameraDistance = DEFAULT_CAMERA_DISTANCE;
          universalRigRef.current.targetCameraDistance = DEFAULT_CAMERA_DISTANCE;
          universalRigRef.current.pivot.quaternion.copy(identityRotation);
          autoRotate.returningToDefault = false;
        }
      }

      applySeparatePartsPresentation();
      updateUniversalRig(camera, universalRigRef.current);
      applyExplode();
      applyVisibilityMode();
      projectAnnotations();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderLoop);
    };

    const resize = () => {
      fitRendererToElement(renderer, camera, mount);
      updateUniversalRig(camera, universalRigRef.current);
      renderer.render(scene, camera);
      projectAnnotations();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const loadNextModel = async () => {
      let lastError: unknown = null;
      for (const url of MODEL_URLS) {
        try {
          setLoadState("Loading Oleocon texture maps");
          await loadOleoconTextureSet();

          setLoadState(`Loading ${url.split("/").pop() ?? "Oleocon model"}`);
          const { model, source } = await loadModel(url);
          if (disposed) return;

          model.name = "oleocon_imported_model";
          const presentationGroup = modelPresentationGroupRef.current;
          if (presentationGroup) presentationGroup.add(model);
          else pivot.add(model);
          const normalizedModel = normalizeModelOnPivot(model);
          const normalizedCenter = normalizedModel.center.clone();
          const targetPoint = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);

          if (lightingRigRef.current) {
            const lightTarget = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
            lightingRigRef.current.leftAreaLight.lookAt(lightTarget);
            lightingRigRef.current.rightAreaLight.lookAt(lightTarget);
            lightingRigRef.current.keyLight.lookAt(lightTarget);
            lightingRigRef.current.fillLight.lookAt(lightTarget);
            lightingRigRef.current.rimLight.lookAt(lightTarget);
            lightingRigRef.current.topLight.lookAt(lightTarget);
            lightingRigRef.current.topCapAreaLight.lookAt(new THREE.Vector3(0, 1.35, 0));
            lightingRigRef.current.bottomCapAreaLight.lookAt(new THREE.Vector3(0, -1.35, 0));
            lightingRigRef.current.upperLeftAreaLight.lookAt(new THREE.Vector3(0, SIDE_ZONE_LIGHT_CONTROLS.upperTargetY, 0));
            lightingRigRef.current.upperRightAreaLight.lookAt(new THREE.Vector3(0, SIDE_ZONE_LIGHT_CONTROLS.upperTargetY, 0));
            lightingRigRef.current.lowerLeftAreaLight.lookAt(new THREE.Vector3(0, SIDE_ZONE_LIGHT_CONTROLS.lowerTargetY, 0));
            lightingRigRef.current.lowerRightAreaLight.lookAt(new THREE.Vector3(0, SIDE_ZONE_LIGHT_CONTROLS.lowerTargetY, 0));
          }

          if (universalRigRef.current) {
            universalRigRef.current.cameraTarget.copy(targetPoint);
            universalRigRef.current.targetCameraTarget.copy(targetPoint);
            universalRigRef.current.cameraDistance = DEFAULT_CAMERA_DISTANCE;
            universalRigRef.current.targetCameraDistance = DEFAULT_CAMERA_DISTANCE;
            universalRigRef.current.rotation.identity();
            universalRigRef.current.targetRotation.identity();
            universalRigRef.current.pivot.quaternion.identity();
            updateUniversalRig(camera, universalRigRef.current);
          }

          const records: Array<ViewerPart & { groupOrder: number; groupCenterY: number; sortY: number; sortX: number; sortZ: number; groupVolume: number; partPriority: number }> = [];
          model.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh || !mesh.geometry) return;

            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.frustumCulled = true;

            if (!mesh.geometry.attributes.normal) {
              mesh.geometry.computeVertexNormals();
            }

            const materials = prepareMeshMaterials(mesh, DEFAULT_MATERIAL_MODE);
            rememberOriginalMaterialColor(materials);
            setMaterialWireframe(materials, wireframeRef.current);

            const meshBox = new THREE.Box3().setFromObject(mesh);
            const meshCenter = new THREE.Vector3();
            meshBox.getCenter(meshCenter);
            const worldDirection = meshCenter.clone().sub(normalizedCenter);
            if (worldDirection.lengthSq() < 0.0001) {
              worldDirection.set(Math.random() - 0.5, Math.random() * 0.35, Math.random() - 0.5);
            }
            worldDirection.normalize();

            const parent = mesh.parent;
            const localDirection = worldDirection.clone();
            if (parent) {
              parent.updateWorldMatrix(true, false);
              const inverseParent = new THREE.Matrix4().copy(parent.matrixWorld).invert();
              localDirection.transformDirection(inverseParent).normalize();
            }

            const partName = makePartName(mesh, records.length);
            const groupObject = getOleoconPartGroupObject(mesh, model);
            const groupSortBox = getObjectSortBox(groupObject);
            const groupOrder = shouldForcePartIntoPlugGroup(partName) ? 0 : (groupSortBox.center.y >= normalizedCenter.y ? 0 : 1);
            const groupKind: PartGroupKind = groupOrder === 0 ? "plug" : "coupler";
            const groupLabel = groupKind === "plug" ? "Plug assembly" : "Coupler assembly";

            records.push({
              id: mesh.uuid,
              name: partName,
              mesh,
              originalPosition: mesh.position.clone(),
              explodeDirection: localDirection,
              materials,
              visible: true,
              groupKind,
              groupLabel,
              groupOrder,
              groupCenterY: groupSortBox.center.y,
              sortY: meshCenter.y,
              sortX: meshCenter.x,
              sortZ: meshCenter.z,
              groupVolume: groupSortBox.volume,
              partPriority: getOleoconPartPriority(partName, groupKind),
            });
          });

          const sortedRecords = records.sort((a, b) => (
            a.groupOrder - b.groupOrder ||
            a.partPriority - b.partPriority ||
            b.groupCenterY - a.groupCenterY ||
            b.groupVolume - a.groupVolume ||
            b.sortY - a.sortY ||
            a.sortX - b.sortX ||
            a.sortZ - b.sortZ ||
            a.name.localeCompare(b.name)
          ));
          sortedRecords.forEach((part, index) => {
            part.mesh.userData.ctsStableLookRenderOrder = index;
          });
          rebuildSeparatedExplodeDirections(sortedRecords, normalizedCenter);
          partsRef.current = sortedRecords;
          applyLightingPreset(lightingPresetRef.current, rendererRef.current, lightingRigRef.current, partsRef.current);
          setParts(partsRef.current.map(makePartItem));
          setLoadState(`Loaded ${partsRef.current.length} separate parts from ${source.split("/").pop()}`);
          setIsModelReady(true);
          window.cancelAnimationFrame(frameId);
          renderLoop();
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (!disposed) {
        setLoadError("Model failed. Check public/3d_models/oleocon/oleocon.fbx plus public/3d_models/oleocon/texture/oleoconBump.png.");
        setLoadState("Model failed to load");
        setIsModelReady(false);
        console.error(lastError);
      }
    };

    void loadNextModel();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      disposeLookEdgeOverlays();
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost, false);
      renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored, false);

      partsRef.current.forEach((part) => {
        part.materials.forEach(disposeMaterial);
        if (part.mesh.geometry) part.mesh.geometry.dispose();
      });
      partsRef.current = [];

      if (environmentTexture) environmentTexture.dispose();
      pmremGenerator.dispose();
      scene.environment = null;
      lightingRigRef.current = null;
      universalRigRef.current = null;
      modelPresentationGroupRef.current = null;
      explodePresentationValueRef.current = 0;
      separatePresentationBaseRef.current = null;
      separatePresentationDriveRef.current = false;
      scene.clear();

      if (activeOleoconViewerRenderer === renderer) activeOleoconViewerRenderer = null;
      releaseOleoconViewerRenderer(renderer);
      rendererRef.current = null;
    };
  }, []);

  const syncPartItems = () => {
    setParts(partsRef.current.map(makePartItem));
  };

  const disposeLookEdgeOverlays = () => {
    lookEdgeOverlaysRef.current.forEach((overlay) => {
      overlay.parent?.remove(overlay);
      overlay.geometry.dispose();
      const material = overlay.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
    });
    lookEdgeOverlaysRef.current.clear();

    lookSurfaceOverlaysRef.current.forEach((overlay) => {
      overlay.parent?.remove(overlay);
      const material = overlay.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
    });
    lookSurfaceOverlaysRef.current.clear();
  };

  const syncLookEdgeOverlays = (_activeMode?: LookMode) => {
    const activePartIds = new Set(partsRef.current.map((part) => part.id));
    const appliedLooks = lookByPartIdRef.current;

    lookEdgeOverlaysRef.current.forEach((overlay, partId) => {
      if (activePartIds.has(partId)) return;
      overlay.parent?.remove(overlay);
      overlay.geometry.dispose();
      const material = overlay.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
      lookEdgeOverlaysRef.current.delete(partId);
    });

    lookSurfaceOverlaysRef.current.forEach((overlay, partId) => {
      if (activePartIds.has(partId)) return;
      overlay.parent?.remove(overlay);
      const material = overlay.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
      lookSurfaceOverlaysRef.current.delete(partId);
    });

    partsRef.current.forEach((part) => {
      const partMode = appliedLooks[part.id] ?? "originalMaterial";
      const stableRenderOrderOffset = getStableLookRenderOrderOffset(part);
      const shouldShowXraySurface = partMode === "technicalEdges";
      let surfaceOverlay = lookSurfaceOverlaysRef.current.get(part.id);

      if (shouldShowXraySurface && !surfaceOverlay) {
        const material = createXraySurfaceOverlayMaterial();

        surfaceOverlay = new THREE.Mesh(part.mesh.geometry, material);
        surfaceOverlay.name = `cts_xray_surface_overlay_${part.mesh.name || part.id}`;
        surfaceOverlay.renderOrder = XRAY_SURFACE_RENDER_ORDER + stableRenderOrderOffset;
        surfaceOverlay.frustumCulled = false;
        surfaceOverlay.raycast = () => undefined;
        part.mesh.add(surfaceOverlay);
        lookSurfaceOverlaysRef.current.set(part.id, surfaceOverlay);
      }

      if (surfaceOverlay) {
        const material = surfaceOverlay.material as THREE.ShaderMaterial;
        surfaceOverlay.visible = shouldShowXraySurface;
        surfaceOverlay.renderOrder = XRAY_SURFACE_RENDER_ORDER + stableRenderOrderOffset;
        updateXraySurfaceOverlayMaterial(material);
      }

      const shouldShowPartEdges = partMode === "technicalEdges" || partMode === "inspectionLine";
      const edgeColor = getLookEdgeColor(partMode);
      const edgeOpacity = getLookEdgeOpacity(partMode);
      const edgeThresholdAngle = getLookEdgeThresholdAngle(partMode);
      const edgeRenderOrder = getLookEdgeRenderOrder(partMode) + stableRenderOrderOffset;
      const edgeDepthTest = partMode === "technicalEdges";
      let overlay = lookEdgeOverlaysRef.current.get(part.id);

      if (shouldShowPartEdges && !overlay) {
        const geometry = new THREE.EdgesGeometry(part.mesh.geometry, edgeThresholdAngle);
        const material = new THREE.LineBasicMaterial({
          color: edgeColor,
          transparent: true,
          opacity: edgeOpacity,
          depthTest: edgeDepthTest,
          depthWrite: false,
        });

        overlay = new THREE.LineSegments(geometry, material);
        overlay.name = `cts_${partMode}_edge_overlay_${part.mesh.name || part.id}`;
        overlay.userData.ctsLookEdgeMode = partMode;
        overlay.userData.ctsLookEdgeThresholdAngle = edgeThresholdAngle;
        overlay.renderOrder = edgeRenderOrder;
        overlay.frustumCulled = false;
        overlay.raycast = () => undefined;
        part.mesh.add(overlay);
        lookEdgeOverlaysRef.current.set(part.id, overlay);
      }

      if (!overlay) return;

      if (shouldShowPartEdges && (overlay.userData.ctsLookEdgeMode !== partMode || overlay.userData.ctsLookEdgeThresholdAngle !== edgeThresholdAngle)) {
        overlay.geometry.dispose();
        overlay.geometry = new THREE.EdgesGeometry(part.mesh.geometry, edgeThresholdAngle);
        overlay.userData.ctsLookEdgeMode = partMode;
        overlay.userData.ctsLookEdgeThresholdAngle = edgeThresholdAngle;
        overlay.name = `cts_${partMode}_edge_overlay_${part.mesh.name || part.id}`;
      }

      const material = overlay.material as THREE.LineBasicMaterial;
      overlay.visible = shouldShowPartEdges;
      overlay.renderOrder = edgeRenderOrder;
      material.color.set(edgeColor);
      material.opacity = edgeOpacity;
      material.depthTest = edgeDepthTest;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  };

  const applyLookMode = (nextMode: LookMode) => {
    const selectedLookPartIds = [...selectedPartIdsRef.current];
    const hasSelectedParts = selectedLookPartIds.length > 0;
    const isOriginalMaterialRequest = nextMode === "originalMaterial";

    // Part-level modes and whole-model modes must stay separated:
    // - If one or more parts are selected, Original Material affects only those selected parts.
    // - If nothing is selected, Original Material resets the whole model only after a whole-model mode was applied.
    // - If nothing is selected and only individual parts have custom modes, Original Material does nothing.
    if (!hasSelectedParts && isOriginalMaterialRequest && lookModeRef.current === "originalMaterial") {
      return;
    }

    const targetPartIds = hasSelectedParts
      ? selectedLookPartIds
      : partsRef.current.map((part) => part.id);

    wireframeRef.current = false;
    setWireframe(false);

    if (!hasSelectedParts) {
      lookModeRef.current = nextMode;
      setLookMode(nextMode);
    }

    if (targetPartIds.length === 0) {
      syncLookEdgeOverlays(lookModeRef.current);
      return;
    }

    recordViewerAction();

    const targetPartIdSet = new Set(targetPartIds);
    const nextLookByPartId = { ...lookByPartIdRef.current };
    targetPartIds.forEach((partId) => {
      if (isOriginalMaterialRequest) delete nextLookByPartId[partId];
      else nextLookByPartId[partId] = nextMode;
    });
    lookByPartIdRef.current = nextLookByPartId;
    setLookStateVersion((version) => version + 1);

    partsRef.current.forEach((part) => {
      if (!targetPartIdSet.has(part.id)) return;

      const partLookMode = nextLookByPartId[part.id] ?? "originalMaterial";
      setMaterialWireframe(part.materials, false);
      applyPartLookVisualState(part, partLookMode, part.mesh.visible, true);
    });

    syncLookEdgeOverlays(lookModeRef.current);
  };

  const cloneAnnotationsForHistory = (items: Annotation[]) =>
    items.map((annotation) => ({
      ...annotation,
      kind: annotation.kind ?? "model",
      offset: annotation.offset ? { ...annotation.offset } : undefined,
      local: [...annotation.local] as [number, number, number],
      screen: { ...annotation.screen },
    }));

  const clonePaintMarksForHistory = (items: PaintMark[]): PaintMark[] =>
    items.map((mark) => {
      if (mark.kind === "stroke") return { ...mark, points: mark.points.map((point) => ({ ...point })) };
      return { ...mark };
    });

  const createViewerActionSnapshot = (): ViewerActionSnapshot => ({
    selectedPartIds: [...selectedPartIdsRef.current],
    isolatedPartIds: [...isolatedPartIdsRef.current],
    visibleById: Object.fromEntries(partsRef.current.map((part) => [part.id, part.visible])),
    paintById: Object.fromEntries(
      partsRef.current.map((part) => [
        part.id,
        typeof part.materials[0]?.userData.ctsPaintColor === "string" ? part.materials[0].userData.ctsPaintColor : null,
      ])
    ),
    paintMarks: clonePaintMarksForHistory(paintMarksRef.current),
    annotations: cloneAnnotationsForHistory(annotationsRef.current),
    explode: explodeRef.current,
    background: backgroundRef.current,
    wireframe: wireframeRef.current,
    toolColor: toolColorRef.current,
    currentTool: currentToolRef.current,
    lookMode,
    lookByPartId: { ...lookByPartIdRef.current },
  });

  const updateActionHistoryAvailability = () => {
    setCanUndoAction(actionPastRef.current.length > 0);
    setCanRedoAction(actionFutureRef.current.length > 0);
  };

  const recordViewerAction = () => {
    if (isRestoringActionRef.current) return;
    actionPastRef.current = [...actionPastRef.current.slice(-49), createViewerActionSnapshot()];
    actionFutureRef.current = [];
    updateActionHistoryAvailability();
  };

  const restoreViewerActionSnapshot = (snapshot: ViewerActionSnapshot) => {
    isRestoringActionRef.current = true;

    isolatedPartIdsRef.current = [...snapshot.isolatedPartIds];
    selectedPartIdsRef.current = [...snapshot.selectedPartIds];
    annotationsRef.current = cloneAnnotationsForHistory(snapshot.annotations);
    paintMarksRef.current = clonePaintMarksForHistory(snapshot.paintMarks ?? []);
    explodeRef.current = snapshot.explode;
    backgroundRef.current = snapshot.background;
    wireframeRef.current = false;
    lookModeRef.current = snapshot.lookMode;
    lookByPartIdRef.current = { ...(snapshot.lookByPartId ?? {}) };
    toolColorRef.current = snapshot.toolColor;
    currentToolRef.current = snapshot.currentTool;

    const appliedLooks = lookByPartIdRef.current;
    const isolatedSet = new Set(snapshot.isolatedPartIds);
    partsRef.current.forEach((part) => {
      part.visible = snapshot.visibleById[part.id] ?? true;

      const paintColor = snapshot.paintById[part.id];
      if (paintColor) setMaterialColor(part.materials, paintColor);
      else restoreMaterialColor(part.materials);

      const partLookMode = appliedLooks[part.id] ?? "originalMaterial";
      const shouldShow = part.visible && (isolatedSet.size === 0 || isolatedSet.has(part.id));
      setMaterialWireframe(part.materials, false);
      part.mesh.position.copy(part.originalPosition.clone().add(part.explodeDirection.clone().multiplyScalar(snapshot.explode * EXPLODE_DISTANCE)));
      part.mesh.visible = shouldShow;
      applyPartLookVisualState(part, partLookMode, shouldShow, true);
    });

    setSelectedPartIds([...snapshot.selectedPartIds]);
    setAnnotations(cloneAnnotationsForHistory(snapshot.annotations));
    setPaintMarks(clonePaintMarksForHistory(snapshot.paintMarks ?? []));
    setExplodeImmediate(snapshot.explode, true);
    setBackground(snapshot.background);
    setWireframe(false);
    setToolColor(snapshot.toolColor);
    setCurrentTool(snapshot.currentTool);
    setLookMode(snapshot.lookMode);
    setLookStateVersion((version) => version + 1);
    syncLookEdgeOverlays(snapshot.lookMode);
    setParts(partsRef.current.map(makePartItem));

    window.setTimeout(() => {
      isRestoringActionRef.current = false;
    }, 0);
  };

  const undoViewerAction = () => {
    const previous = actionPastRef.current.pop();
    if (!previous) {
      updateActionHistoryAvailability();
      return;
    }

    actionFutureRef.current = [createViewerActionSnapshot(), ...actionFutureRef.current].slice(0, 50);
    restoreViewerActionSnapshot(previous);
    updateActionHistoryAvailability();
  };

  const redoViewerAction = () => {
    const next = actionFutureRef.current.shift();
    if (!next) {
      updateActionHistoryAvailability();
      return;
    }

    actionPastRef.current = [...actionPastRef.current.slice(-49), createViewerActionSnapshot()];
    restoreViewerActionSnapshot(next);
    updateActionHistoryAvailability();
  };

  const selectPart = (partId: string | null, mode: "replace" | "toggle" | "add" = "toggle", shouldRecord = false) => {
    if (shouldRecord) recordViewerAction();

    if (!partId) {
      selectedPartIdsRef.current = [];
      setSelectedPartIds([]);
      return;
    }

    setSelectedAnnotationId(null);

    setSelectedPartIds((current) => {
      const next = mode === "replace"
        ? [partId]
        : mode === "add"
          ? (current.includes(partId) ? current : [...current, partId])
          : (current.includes(partId) ? current.filter((id) => id !== partId) : [...current, partId]);

      selectedPartIdsRef.current = next;
      return next;
    });
  };

  const setPartVisible = (partIds: string | string[], visible: boolean) => {
    const targetIds = Array.isArray(partIds) ? partIds : [partIds];
    if (!targetIds.length) return;

    recordViewerAction();

    partsRef.current.forEach((part) => {
      if (!targetIds.includes(part.id)) return;
      part.visible = visible;
      if (!visible) part.mesh.visible = false;
    });

    if (!visible) {
      isolatedPartIdsRef.current = isolatedPartIdsRef.current.filter((id) => !targetIds.includes(id));
    }

    syncPartItems();
  };

  const togglePartIsolation = (partId: string) => {
    const target = partsRef.current.find((part) => part.id === partId);
    if (!target) return;

    recordViewerAction();

    target.visible = true;
    target.mesh.visible = true;

    const isolatedSet = new Set(isolatedPartIdsRef.current);
    if (isolatedSet.has(partId)) isolatedSet.delete(partId);
    else isolatedSet.add(partId);

    isolatedPartIdsRef.current = Array.from(isolatedSet);
    selectPart(partId, "add", false);
    syncPartItems();
  };

  const isolateSelectedParts = () => {
    if (!selectedPartIdsRef.current.length) return;

    recordViewerAction();

    const selectedSet = new Set(selectedPartIdsRef.current);
    partsRef.current.forEach((part) => {
      if (selectedSet.has(part.id)) {
        part.visible = true;
        part.mesh.visible = true;
      }
    });

    isolatedPartIdsRef.current = Array.from(selectedSet);
    syncPartItems();
  };

  const showAllParts = () => {
    recordViewerAction();

    isolatedPartIdsRef.current = [];
    partsRef.current.forEach((part) => {
      const partLookMode = lookByPartIdRef.current[part.id] ?? "originalMaterial";
      part.visible = true;
      part.mesh.visible = true;
      applyPartLookVisualState(part, partLookMode, true, true);
    });
    syncPartItems();
  };

  const deselectParts = () => {
    selectedPartIdsRef.current = [];
    setSelectedPartIds([]);
  };

  const hideSelectedParts = () => {
    if (!selectedPartIdsRef.current.length) return;
    setPartVisible(selectedPartIdsRef.current, false);
  };

  const applyWireframe = (enabled: boolean) => {
    recordViewerAction();
    setWireframe(enabled);
    partsRef.current.forEach((part) => setMaterialWireframe(part.materials, enabled));
  };

  const paintSelectedPart = (color: string) => {
    if (!selectedPartIdsRef.current.length) return false;

    const selectedSet = new Set(selectedPartIdsRef.current);
    let didPaint = false;

    partsRef.current.forEach((part) => {
      if (!selectedSet.has(part.id)) return;

      const currentColor = getPartPaintColor(part);
      const nextColor = color === ORIGINAL_PART_COLOR_VALUE ? null : color || DEFAULT_PART_COLOR;
      if (currentColor === nextColor) return;

      didPaint = true;
      setMaterialColor(part.materials, color || DEFAULT_PART_COLOR);
    });

    if (didPaint) syncLookEdgeOverlays(lookModeRef.current);

    return didPaint;
  };

  const chooseToolColor = (color: string) => {
    const nextToolColor = color === ORIGINAL_PART_COLOR_VALUE ? DEFAULT_TOOL_COLOR : color;
    const selectedAnnotation = selectedAnnotationId
      ? annotationsRef.current.find((annotation) => annotation.id === selectedAnnotationId) ?? null
      : null;
    const isPaintToolColorOnly = currentToolRef.current === "brush" || currentToolRef.current === "arrowBrush";

    const shouldUpdateSelectedAnnotation = Boolean(!isPaintToolColorOnly && selectedAnnotation && selectedAnnotation.color !== nextToolColor);
    const selectedPartsHavePaint = selectedPartIdsRef.current.some((partId) => {
      const part = partsRef.current.find((item) => item.id === partId);
      return typeof part?.materials[0]?.userData.ctsPaintColor === "string";
    });
    const shouldPaintSelectedParts = !isPaintToolColorOnly && selectedPartIdsRef.current.length > 0 && color !== ORIGINAL_PART_COLOR_VALUE;
    const selectedPartsNeedColor = shouldPaintSelectedParts && selectedPartIdsRef.current.some((partId) => {
      const part = partsRef.current.find((item) => item.id === partId);
      return part && part.materials[0]?.userData.ctsPaintColor !== color;
    });
    const shouldResetSelectedParts = color === ORIGINAL_PART_COLOR_VALUE && selectedPartsHavePaint;

    if (shouldUpdateSelectedAnnotation || selectedPartsNeedColor || shouldResetSelectedParts) recordViewerAction();

    if (toolColorRef.current !== nextToolColor) {
      toolColorRef.current = nextToolColor;
      setToolColor(nextToolColor);
    }

    if (shouldUpdateSelectedAnnotation && selectedAnnotation) {
      setAnnotations((current) => {
        const nextAnnotations = current.map((annotation) => (annotation.id === selectedAnnotation.id ? { ...annotation, color: nextToolColor } : annotation));
        annotationsRef.current = nextAnnotations;
        return nextAnnotations;
      });
    }

    if (shouldResetSelectedParts) {
      paintSelectedPart(ORIGINAL_PART_COLOR_VALUE);
      return;
    }

    if (shouldPaintSelectedParts) paintSelectedPart(color);
  };

  const toggleAutoRotate = () => {
    const rig = universalRigRef.current;
    if (!rig) return;

    rig.inertiaEnabled = false;
    rig.inertiaSpeed = 0;

    const camera = cameraRef.current;
    const defaultTarget = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
    const identity = new THREE.Quaternion();
    const isSeparateActive = explodeRef.current > 0.001 || explodePresentationValueRef.current > 0.001;

    if (isSeparateActive) {
      separatePresentationDriveRef.current = false;
    } else {
      rig.cameraTarget.copy(defaultTarget);
      rig.targetCameraTarget.copy(defaultTarget);
      rig.targetCameraDistance = DEFAULT_CAMERA_DISTANCE;
    }

    if (autoRotateRef.current.active) {
      autoRotateRef.current.active = false;
      setIsAutoRotateActive(false);

      if (isSeparateActive) {
        autoRotateRef.current.returningToDefault = false;
        rig.targetRotation.copy(rig.rotation);
      } else {
        autoRotateRef.current.returningToDefault = true;
        rig.targetRotation.copy(identity);
      }

      if (camera) updateUniversalRig(camera, rig);
      return;
    }

    if (!isSeparateActive) {
      rig.cameraDistance = DEFAULT_CAMERA_DISTANCE;
    }

    rig.targetRotation.copy(rig.rotation);
    if (camera) updateUniversalRig(camera, rig);

    autoRotateRef.current.active = true;
    autoRotateRef.current.returningToDefault = false;
    setIsAutoRotateActive(true);
  };

  const resetAppliedLooksToOriginal = () => {
    lookByPartIdRef.current = {};
    lookModeRef.current = "originalMaterial";
    setLookMode("originalMaterial");
    setLookStateVersion((version) => version + 1);
    setWireframe(false);
    wireframeRef.current = false;

    partsRef.current.forEach((part) => {
      setMaterialWireframe(part.materials, false);
      applyPartLookVisualState(part, "originalMaterial", part.mesh.visible, true);
    });

    syncLookEdgeOverlays("originalMaterial");
  };

  const resetView = () => {
    resetAppliedLooksToOriginal();
    autoRotateRef.current.returningToDefault = false;
    const camera = cameraRef.current;
    const rig = universalRigRef.current;
    if (!camera || !rig) return;
    const target = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
    rig.cameraTarget.copy(target);
    rig.targetCameraTarget.copy(target);
    rig.cameraDistance = DEFAULT_CAMERA_DISTANCE;
    rig.targetCameraDistance = DEFAULT_CAMERA_DISTANCE;
    rig.rotation.identity();
    rig.targetRotation.identity();
    rig.pivot.quaternion.identity();
    rig.inertiaSpeed = 0;
    rig.inertiaEnabled = false;
    rig.inertiaAxis.set(0, 1, 0);
    setExplodeImmediate(0, true);
    explodeRef.current = 0;
    explodePresentationValueRef.current = 0;
    separatePresentationBaseRef.current = null;
    separatePresentationDriveRef.current = false;
    partsRef.current.forEach((part) => {
      part.mesh.position.copy(part.originalPosition);
    });
    const presentationGroup = modelPresentationGroupRef.current;
    if (presentationGroup) {
      presentationGroup.rotation.z = 0;
      presentationGroup.quaternion.identity();
    }
    updateUniversalRig(camera, rig);
  };

  const resetAll = () => {
    recordViewerAction();

    autoRotateRef.current.active = false;
    autoRotateRef.current.returningToDefault = false;
    setIsAutoRotateActive(false);

    isolatedPartIdsRef.current = [];
    selectedPartIdsRef.current = [];
    setSelectedPartIds([]);
    setExplodeImmediate(0, true);
    explodeRef.current = 0;
    explodePresentationValueRef.current = 0;
    separatePresentationBaseRef.current = null;
    separatePresentationDriveRef.current = false;
    const presentationGroup = modelPresentationGroupRef.current;
    if (presentationGroup) {
      presentationGroup.rotation.z = 0;
      presentationGroup.quaternion.identity();
    }
    setAnnotations([]);
    setSelectedAnnotationId(null);
    annotationsRef.current = [];
    setPaintMarks([]);
    paintMarksRef.current = [];
    setToolColor(DEFAULT_TOOL_COLOR);
    toolColorRef.current = DEFAULT_TOOL_COLOR;
    lookModeRef.current = "originalMaterial";
    lookByPartIdRef.current = {};
    wireframeRef.current = false;
    partsRef.current.forEach((part) => {
      part.visible = true;
      part.mesh.visible = true;
      part.mesh.position.copy(part.originalPosition);
      clearPartLookVisualStateCache(part);
      setMaterialWireframe(part.materials, false);
      applyPartLookVisualState(part, "originalMaterial", true, true);
      restoreMaterialColor(part.materials);
    });
    syncLookEdgeOverlays("originalMaterial");
    setWireframe(false);
    setLookMode("originalMaterial");
    setLookStateVersion((version) => version + 1);
    setCurrentTool("select");
    setParts(partsRef.current.map(makePartItem));
    resetView();
  };

  const createAnnotation = (options: {
    text: string;
    labelPrefix: "Text" | "Note";
    kind: "model" | "screen";
    local?: THREE.Vector3;
    screen: { x: number; y: number; visible: boolean };
  }) => {
    recordViewerAction();

    const nextAnnotation: Annotation = {
      id: `${Date.now()}-${Math.round(Math.random() * 10000)}`,
      text: options.text,
      label: getNextAnnotationLabel(annotationsRef.current, options.labelPrefix),
      color: toolColorRef.current,
      size: DEFAULT_ANNOTATION_SIZE,
      kind: options.kind,
      offset: { x: 0, y: 0 },
      local: options.local ? [options.local.x, options.local.y, options.local.z] : [0, 0, 0],
      screen: options.screen,
    };

    selectedPartIdsRef.current = [];
    setSelectedPartIds([]);
    setSelectedAnnotationId(nextAnnotation.id);
    setAnnotations((current) => [...current, nextAnnotation]);
  };

  const getPaintScreenPoint = (clientX: number, clientY: number) => {
    const mount = mountRef.current;
    if (!mount) return null;

    const rect = mount.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const beginArrowBrush = (event: PointerEvent<HTMLDivElement>) => {
    const point = getPaintScreenPoint(event.clientX, event.clientY);
    if (!point) return;

    recordViewerAction();

    const markId = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const nextMark: PaintMark = {
      id: markId,
      kind: "arrow",
      color: toolColorRef.current,
      size: brushSize,
      tailX: point.x,
      tailY: point.y,
      tipX: point.x,
      tipY: point.y,
    };

    activeArrowBrushRef.current = {
      pointerId: event.pointerId,
      markId,
      tipX: point.x,
      tipY: point.y,
    };

    setPaintMarks((current) => [...current, nextMark]);
  };

  const updateArrowBrush = (event: PointerEvent<HTMLDivElement>) => {
    const arrow = activeArrowBrushRef.current;
    if (arrow.pointerId !== event.pointerId || !arrow.markId) return false;

    const point = getPaintScreenPoint(event.clientX, event.clientY);
    if (!point) return true;

    setPaintMarks((current) => current.map((mark) => {
      if (mark.kind !== "arrow" || mark.id !== arrow.markId) return mark;
      return {
        ...mark,
        tipX: point.x,
        tipY: point.y,
      };
    }));

    return true;
  };

  const finishArrowBrush = (pointerId?: number) => {
    const arrow = activeArrowBrushRef.current;
    if (typeof pointerId === "number" && arrow.pointerId !== pointerId) return false;
    if (!arrow.markId) return false;

    activeArrowBrushRef.current = { pointerId: null, markId: null, tipX: 0, tipY: 0 };
    return true;
  };

  const beginPaintStroke = (event: PointerEvent<HTMLDivElement>) => {
    const point = getPaintScreenPoint(event.clientX, event.clientY);
    if (!point) return;

    recordViewerAction();

    const markId = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const nextMark: PaintMark = {
      id: markId,
      kind: "stroke",
      color: toolColorRef.current,
      size: brushSize,
      points: [point],
    };

    activePaintStrokeRef.current = {
      pointerId: event.pointerId,
      markId,
      lastX: point.x,
      lastY: point.y,
    };

    setPaintMarks((current) => [...current, nextMark]);
  };

  const appendPaintStrokePoint = (event: PointerEvent<HTMLDivElement>) => {
    const stroke = activePaintStrokeRef.current;
    if (stroke.pointerId !== event.pointerId || !stroke.markId) return false;

    const point = getPaintScreenPoint(event.clientX, event.clientY);
    if (!point) return true;

    const minDistance = Math.max(2, brushSize * 0.28);
    if (Math.hypot(point.x - stroke.lastX, point.y - stroke.lastY) < minDistance) return true;

    stroke.lastX = point.x;
    stroke.lastY = point.y;

    setPaintMarks((current) => current.map((mark) => {
      if (mark.kind !== "stroke" || mark.id !== stroke.markId) return mark;
      return { ...mark, points: [...mark.points, point] };
    }));

    return true;
  };

  const finishPaintStroke = (pointerId?: number) => {
    const stroke = activePaintStrokeRef.current;
    if (typeof pointerId === "number" && stroke.pointerId !== pointerId) return false;
    if (!stroke.markId) return false;

    activePaintStrokeRef.current = { pointerId: null, markId: null, lastX: 0, lastY: 0 };
    return true;
  };

  const selectPartAtClientPoint = (clientX: number, clientY: number, options?: { toggle?: boolean; additive?: boolean }) => {
    const mount = mountRef.current;
    const camera = cameraRef.current;
    const rig = universalRigRef.current;
    if (!mount || !camera || !rig) return;

    const rect = mount.getBoundingClientRect();
    const screenPoint = { x: clientX - rect.left, y: clientY - rect.top, visible: true };
    const tool = currentToolRef.current;
    const text = tool === "text" || tool === "note" ? annotationTextRef.current.trim() : "";

    if (tool === "note") {
      if (!text) return;
      createAnnotation({
        text,
        labelPrefix: "Note",
        kind: "screen",
        screen: screenPoint,
      });
      return;
    }

    pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(pointerRef.current, camera);

    const candidates = partsRef.current.filter((part) => part.mesh.visible).map((part) => part.mesh);
    const hits = raycasterRef.current.intersectObjects(candidates, true);
    const hit = hits[0];
    if (!hit) return;

    const hitPart = partsRef.current.find((part) => part.mesh === hit.object || part.mesh.uuid === hit.object.uuid);
    if (!hitPart) return;

    if (tool === "text") {
      if (!text) return;

      const local = hit.point.clone();
      rig.pivot.worldToLocal(local);
      createAnnotation({
        text,
        labelPrefix: "Text",
        kind: "model",
        local,
        screen: screenPoint,
      });
      return;
    }

    if (tool === "moveText") return;

    const selectionMode = options?.toggle ? "toggle" : options?.additive ? "add" : "replace";
    selectPart(hitPart.id, selectionMode);
  };

  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && ![0, 1, 2].includes(event.button)) return;

    const activeTool = currentToolRef.current;
    if (event.button === 0 && activeTool === "brush") {
      event.preventDefault();
      beginPaintStroke(event);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort.
      }
      return;
    }

    if (event.button === 0 && activeTool === "arrowBrush") {
      event.preventDefault();
      beginArrowBrush(event);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort.
      }
      return;
    }

    const mode: ViewerDragMode = event.button === 1 || event.button === 2 ? "pan" : event.shiftKey || event.altKey ? "roll" : "rotate";
    const rig = universalRigRef.current;
    if (rig) {
      rig.inertiaEnabled = false;
      rig.inertiaSpeed = 0;
    }

    if (explodeRef.current > 0.001) {
      separatePresentationDriveRef.current = false;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      button: event.button,
      mode,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      totalMotion: 0,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort.
    }
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (appendPaintStrokePoint(event)) return;
    if (updateArrowBrush(event)) return;

    const drag = dragRef.current;
    const rig = universalRigRef.current;
    const camera = cameraRef.current;
    if (!rig || !camera || drag.pointerId !== event.pointerId || !drag.mode) return;

    const previousX = drag.lastX;
    const previousY = drag.lastY;
    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.totalMotion += Math.abs(dx) + Math.abs(dy);

    if (!drag.moved && drag.totalMotion < ROTATION.dragThreshold) return;
    drag.moved = true;

    if (drag.mode === "rotate") {
      if (event.shiftKey || event.altKey) {
        applyRollRotation(rig, camera, dx, dy);
      } else {
        const mount = mountRef.current;
        if (mount) applyArcballRotation(rig, camera, mount, previousX, previousY, event.clientX, event.clientY);
      }
      return;
    }

    if (drag.mode === "roll") {
      applyRollRotation(rig, camera, dx, dy);
      return;
    }

    camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    const panScale = rig.targetCameraDistance * ROTATION.panSensitivity;
    const clampedDx = clamp(dx, -36, 36); // [کنترل جهش pan] حرکت‌های بزرگ موس را محدود می‌کند تا pan مثل چرخش نرم بماند
    const clampedDy = clamp(dy, -36, 36);
    rig.targetCameraTarget.addScaledVector(right, -clampedDx * panScale);
    rig.targetCameraTarget.addScaledVector(up, clampedDy * panScale);
  };

  const handleCanvasPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (finishPaintStroke(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released.
      }
      return;
    }

    if (finishArrowBrush(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released.
      }
      return;
    }

    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const wasClick = !drag.moved && drag.button === 0;
    const rig = universalRigRef.current;
    if (!wasClick && rig && (drag.mode === "rotate" || drag.mode === "roll") && rig.inertiaSpeed > ROTATION_INERTIA.minSpeed) {
      rig.inertiaEnabled = true;
    }

    dragRef.current = { pointerId: null, button: -1, mode: null, lastX: 0, lastY: 0, moved: false, totalMotion: 0 };

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }

    if (wasClick) selectPartAtClientPoint(event.clientX, event.clientY, { toggle: event.shiftKey || event.ctrlKey || event.metaKey, additive: event.altKey });
  };

  const handleCanvasPointerCancel = () => {
    finishPaintStroke();
    finishArrowBrush();

    const rig = universalRigRef.current;
    if (rig && rig.inertiaSpeed > ROTATION_INERTIA.minSpeed) {
      rig.inertiaEnabled = true;
    }
    dragRef.current = { pointerId: null, button: -1, mode: null, lastX: 0, lastY: 0, moved: false, totalMotion: 0 };
  };

  const handleCanvasWheel = (event: WheelEvent<HTMLDivElement>) => {
    const rig = universalRigRef.current;
    if (!rig) return;
    event.preventDefault();
    if (explodeRef.current > 0.001) {
      separatePresentationDriveRef.current = false;
    }
    rig.targetCameraDistance = clamp(rig.targetCameraDistance + event.deltaY * ROTATION.zoomSpeed, ROTATION.minDistance, ROTATION.maxDistance);
  };

  const deleteAnnotation = (annotationId: string) => {
    recordViewerAction();
    setSelectedAnnotationId((current) => (current === annotationId ? null : current));
    setAnnotations((current) => current.filter((annotation) => annotation.id !== annotationId));
  };

  const resizeSelectedAnnotation = (direction: "bigger" | "smaller") => {
    if (!selectedAnnotationId) return;

    recordViewerAction();
    setAnnotations((current) =>
      current.map((annotation) => {
        if (annotation.id !== selectedAnnotationId) return annotation;

        const currentSize = annotation.size ?? DEFAULT_ANNOTATION_SIZE;
        const nextSize = direction === "bigger"
          ? Math.min(MAX_ANNOTATION_SIZE, currentSize + ANNOTATION_SIZE_STEP)
          : Math.max(MIN_ANNOTATION_SIZE, currentSize - ANNOTATION_SIZE_STEP);

        return { ...annotation, size: nextSize };
      })
    );
  };

  const deleteSelectedAnnotation = () => {
    if (!selectedAnnotationId) return;
    deleteAnnotation(selectedAnnotationId);
  };

  const selectAnnotation = (annotation: Annotation, options?: { keepCurrentTool?: boolean }) => {
    selectedPartIdsRef.current = [];
    setSelectedPartIds([]);
    setSelectedAnnotationId(annotation.id);
    toolColorRef.current = annotation.color;
    setToolColor(annotation.color);
    if (!options?.keepCurrentTool) setCurrentTool(annotation.kind === "screen" ? "note" : "text");
    setAnnotationText(annotation.text);
  };

  const startAnnotationDrag = (annotation: Annotation, event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    selectAnnotation(annotation, { keepCurrentTool: currentToolRef.current === "moveText" });

    if (currentToolRef.current !== "moveText") return;

    recordViewerAction();
    annotationDragRef.current = {
      pointerId: event.pointerId,
      annotationId: annotation.id,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort.
    }
  };

  const moveAnnotationDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = annotationDragRef.current;
    if (drag.pointerId !== event.pointerId || !drag.annotationId) return;

    event.stopPropagation();
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.moved = drag.moved || Math.abs(dx) + Math.abs(dy) > 0;

    if (!dx && !dy) return;

    setAnnotations((current) => {
      const nextAnnotations = current.map((annotation) => {
        if (annotation.id !== drag.annotationId) return annotation;

        if (annotation.kind === "screen") {
          return {
            ...annotation,
            screen: {
              ...annotation.screen,
              x: annotation.screen.x + dx,
              y: annotation.screen.y + dy,
            },
          };
        }

        const offset = annotation.offset ?? { x: 0, y: 0 };
        return {
          ...annotation,
          kind: "model" as const,
          offset: {
            x: offset.x + dx,
            y: offset.y + dy,
          },
        };
      });

      annotationsRef.current = nextAnnotations;
      return nextAnnotations;
    });
  };

  const finishAnnotationDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = annotationDragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    event.stopPropagation();
    annotationDragRef.current = { pointerId: null, annotationId: null, lastX: 0, lastY: 0, moved: false };

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released.
    }
  };

  const handleAnnotationTextChange = (value: string) => {
    setAnnotationText(value);

    if (!selectedAnnotationId) return;
    setAnnotations((current) => current.map((annotation) => (annotation.id === selectedAnnotationId ? { ...annotation, text: value } : annotation)));
  };

  const getSnapshotColor = (color: string, alpha: number) => {
    if (!color.startsWith("#")) return color;
    const rgb = hexToRgb(color);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  const drawSnapshotWhiteImage = (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: { opacity?: number; shadowBlur?: number; shadowOffsetY?: number; shadowColor?: string }
  ) => {
    const sourceWidth = Math.max(1, image.naturalWidth || image.width || Math.ceil(width));
    const sourceHeight = Math.max(1, image.naturalHeight || image.height || Math.ceil(height));
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sourceWidth;
    tempCanvas.height = sourceHeight;
    const tempContext = tempCanvas.getContext("2d");
    if (!tempContext) return;

    tempContext.clearRect(0, 0, sourceWidth, sourceHeight);
    tempContext.drawImage(image, 0, 0, sourceWidth, sourceHeight);
    tempContext.globalCompositeOperation = "source-in";
    tempContext.fillStyle = `rgba(255, 255, 255, ${options?.opacity ?? 0.98})`;
    tempContext.fillRect(0, 0, sourceWidth, sourceHeight);
    tempContext.globalCompositeOperation = "source-over";

    context.save();
    context.shadowColor = options?.shadowColor ?? "rgba(0, 0, 0, 0.58)";
    context.shadowBlur = options?.shadowBlur ?? 18;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = options?.shadowOffsetY ?? 5;
    context.drawImage(tempCanvas, x, y, width, height);
    context.restore();
  };

  const drawSnapshotFallbackBrandText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, align: CanvasTextAlign = "left") => {
    context.save();
    context.shadowColor = "rgba(0,0,0,0.72)";
    context.shadowBlur = 22;
    context.shadowOffsetY = 7;
    context.fillStyle = "rgba(242,240,234,0.96)";
    context.font = `900 ${size}px Gotham, "Gotham SSm", "Gotham A", "Gotham B", Arial, sans-serif`;
    context.textAlign = align;
    context.textBaseline = "top";
    context.fillText(text, x, y);
    context.restore();
  };

  const wrapSnapshotText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const safeText = text.trim() || "Inspection note";
    const lines: string[] = [];

    safeText.replace(/\r\n/g, "\n").split("\n").forEach((paragraph) => {
      const words = paragraph.trim() ? paragraph.trim().split(/\s+/) : [""];
      let line = "";

      words.forEach((word) => {
        const nextLine = line ? `${line} ${word}` : word;
        if (!line || context.measureText(nextLine).width <= maxWidth) {
          line = nextLine;
          return;
        }

        lines.push(line);
        line = word;
      });

      lines.push(line);
    });

    return lines.length ? lines : [safeText];
  };

  const drawSnapshotPaintMarks = (context: CanvasRenderingContext2D, scaleX: number, scaleY: number) => {
    const marks = paintMarksRef.current;
    if (!marks.length) return;

    context.save();
    context.scale(scaleX, scaleY);
    context.lineCap = "round";
    context.lineJoin = "round";

    marks.forEach((mark) => {
      if (mark.kind === "stroke") {
        const firstPoint = mark.points[0];
        if (!firstPoint) return;

        context.fillStyle = mark.color;
        context.strokeStyle = mark.color;
        context.lineWidth = mark.size;

        if (mark.points.length <= 1) {
          context.beginPath();
          context.arc(firstPoint.x, firstPoint.y, Math.max(1, mark.size / 2), 0, Math.PI * 2);
          context.fill();
          return;
        }

        context.beginPath();
        mark.points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.stroke();
        return;
      }

      const shaftDx = mark.tipX - mark.tailX;
      const shaftDy = mark.tipY - mark.tailY;
      const shaftLength = Math.hypot(shaftDx, shaftDy);
      if (shaftLength < 2) return;

      const unitX = shaftDx / shaftLength;
      const unitY = shaftDy / shaftLength;
      const headLength = Math.max(12, mark.size * 2.65);
      const headWidth = Math.max(10, mark.size * 2.28);
      const lineEndX = mark.tipX - unitX * headLength * 0.72;
      const lineEndY = mark.tipY - unitY * headLength * 0.72;
      const perpX = -unitY;
      const perpY = unitX;
      const baseX = mark.tipX - unitX * headLength;
      const baseY = mark.tipY - unitY * headLength;
      const headHalf = headWidth / 2;

      context.strokeStyle = mark.color;
      context.fillStyle = mark.color;
      context.lineWidth = mark.size;
      context.lineCap = "butt";
      context.lineJoin = "miter";
      context.beginPath();
      context.moveTo(mark.tailX, mark.tailY);
      context.lineTo(lineEndX, lineEndY);
      context.stroke();

      context.beginPath();
      context.moveTo(mark.tipX, mark.tipY);
      context.lineTo(baseX + perpX * headHalf, baseY + perpY * headHalf);
      context.lineTo(baseX - perpX * headHalf, baseY - perpY * headHalf);
      context.closePath();
      context.fill();
    });

    context.restore();
  };

  const drawSnapshotAnnotations = (context: CanvasRenderingContext2D, cssWidth: number, cssHeight: number, scaleX: number, scaleY: number) => {
    const visibleAnnotations = annotationsRef.current.filter((annotation) => annotation.screen.visible);
    if (!visibleAnnotations.length) return;

    context.save();
    context.scale(scaleX, scaleY);
    context.textAlign = "left";
    context.textBaseline = "top";

    visibleAnnotations.forEach((annotation) => {
      if (annotation.kind === "screen") return;

      const offset = annotation.offset ?? { x: 0, y: 0 };
      const connectorX = annotation.screen.x + offset.x + 18;
      const connectorY = annotation.screen.y + offset.y;

      context.strokeStyle = annotation.color;
      context.globalAlpha = selectedAnnotationId === annotation.id ? 0.95 : 0.72;
      context.lineWidth = selectedAnnotationId === annotation.id ? 2 : 1.35;
      context.beginPath();
      context.moveTo(annotation.screen.x, annotation.screen.y);
      context.lineTo(connectorX, connectorY);
      context.stroke();
      context.globalAlpha = 1;
    });

    visibleAnnotations.forEach((annotation) => {
      const isScreenNote = annotation.kind === "screen";
      const offset = annotation.offset ?? { x: 0, y: 0 };
      const fontSize = annotation.size ?? DEFAULT_ANNOTATION_SIZE;
      const lineHeight = fontSize * 1.32;
      const paddingX = 12;
      const paddingY = 10;
      const minWidth = isScreenNote ? 170 : 132;
      const maxWidth = Math.min(isScreenNote ? 360 : 430, cssWidth - (isScreenNote ? 72 : 96));
      const textMaxWidth = Math.max(48, maxWidth - paddingX * 2);

      context.font = `650 ${fontSize}px Gotham, "Gotham SSm", "Gotham A", "Gotham B", Arial, sans-serif`;
      const lines = wrapSnapshotText(context, annotation.text, textMaxWidth);
      const measuredWidth = lines.reduce((max, line) => Math.max(max, context.measureText(line || " ").width), 0);
      const boxWidth = clamp(measuredWidth + paddingX * 2, minWidth, Math.max(minWidth, maxWidth));
      const boxHeight = Math.min(Math.max(1, lines.length) * lineHeight + paddingY * 2, Math.min(cssHeight * 0.44, 360));
      const anchorX = annotation.screen.x + (isScreenNote ? 0 : offset.x + 18);
      const anchorY = annotation.screen.y + (isScreenNote ? 0 : offset.y);
      const boxX = clamp(anchorX, 0, Math.max(0, cssWidth - boxWidth));
      const boxY = clamp(isScreenNote ? anchorY : anchorY - boxHeight / 2, 0, Math.max(0, cssHeight - boxHeight));
      const selected = selectedAnnotationId === annotation.id;

      context.save();
      context.fillStyle = "rgba(4,6,7,0.82)";
      context.fillRect(boxX, boxY, boxWidth, boxHeight);

      const accentGradient = context.createLinearGradient(boxX, boxY, boxX + boxWidth, boxY + boxHeight);
      accentGradient.addColorStop(0, getSnapshotColor(annotation.color, selected ? 0.32 : 0.18));
      accentGradient.addColorStop(0.48, "rgba(255,255,255,0.045)");
      accentGradient.addColorStop(1, "rgba(0,0,0,0.08)");
      context.fillStyle = accentGradient;
      context.fillRect(boxX, boxY, boxWidth, boxHeight);

      context.strokeStyle = annotation.color;
      context.lineWidth = selected ? 2 : 1.5;
      context.strokeRect(boxX + context.lineWidth / 2, boxY + context.lineWidth / 2, boxWidth - context.lineWidth, boxHeight - context.lineWidth);

      if (selected) {
        context.strokeStyle = getSnapshotColor(annotation.color, 0.72);
        context.lineWidth = 1;
        context.strokeRect(boxX - 2.5, boxY - 2.5, boxWidth + 5, boxHeight + 5);
      }

      context.fillStyle = "rgba(255,249,235,0.98)";
      const clipBottom = boxY + boxHeight - paddingY;
      lines.forEach((line, index) => {
        const textY = boxY + paddingY + index * lineHeight;
        if (textY + lineHeight > clipBottom + 0.5) return;
        context.fillText(line, boxX + paddingX, textY);
      });
      context.restore();
    });

    context.restore();
  };

  const exportSnapshot = async () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const mount = mountRef.current;
    if (!renderer || !scene || !camera || !mount) return;

    renderer.render(scene, camera);
    const rect = mount.getBoundingClientRect();
    const output = document.createElement("canvas");
    output.width = Math.max(1, Math.floor(rect.width * 2));
    output.height = Math.max(1, Math.floor(rect.height * 2));
    const context = output.getContext("2d");
    if (!context) return;

    drawCleanStudioBackground(context, output.width, output.height, backgroundRef.current);

    const previousRendererSize = new THREE.Vector2();
    renderer.getSize(previousRendererSize);
    const previousPixelRatio = renderer.getPixelRatio();

    try {
      renderer.setPixelRatio(1);
      renderer.setSize(output.width, output.height, false);
      camera.aspect = output.width / output.height;
      camera.updateProjectionMatrix();
      updateUniversalRig(camera, universalRigRef.current);
      renderer.render(scene, camera);
      context.drawImage(renderer.domElement, 0, 0, output.width, output.height);
    } finally {
      renderer.setPixelRatio(previousPixelRatio);
      renderer.setSize(Math.max(1, Math.floor(previousRendererSize.x)), Math.max(1, Math.floor(previousRendererSize.y)), false);
      camera.aspect = previousRendererSize.x / Math.max(1, previousRendererSize.y);
      camera.updateProjectionMatrix();
      updateUniversalRig(camera, universalRigRef.current);
      renderer.render(scene, camera);
    }

    const scaleX = output.width / Math.max(1, rect.width);
    const scaleY = output.height / Math.max(1, rect.height);
    drawSnapshotPaintMarks(context, scaleX, scaleY);
    drawSnapshotAnnotations(context, rect.width, rect.height, scaleX, scaleY);

    const headerLogo = await loadImageSafe(CTS_LOGO_URL);
    const watermark = await loadImageSafe(CTS_WATERMARK_URL);

    if (headerLogo) {
      const headerLogoWidth = clamp(output.width * 0.14, 360, 560);
      const headerLogoHeight = headerLogoWidth * (headerLogo.height / headerLogo.width);
      const headerLogoX = clamp(output.width * 0.09, 108, 190);
      const headerLogoY = clamp(output.height * 0.045, 34, 62);
      drawSnapshotWhiteImage(context, headerLogo, headerLogoX, headerLogoY, headerLogoWidth, headerLogoHeight, {
        opacity: 0.98,
        shadowBlur: 18,
        shadowOffsetY: 5,
        shadowColor: "rgba(0, 0, 0, 0.62)",
      });
    } else {
      drawSnapshotFallbackBrandText(context, "CTS STUDIO", 118, 40, Math.max(26, output.width * 0.016));
    }

    if (watermark) {
      const watermarkWidth = clamp(output.width * 0.22, 420, 760);
      const watermarkHeight = watermarkWidth * (watermark.height / watermark.width);
      const watermarkX = output.width - watermarkWidth - 52;
      const watermarkY = output.height - watermarkHeight - 42;
      drawSnapshotWhiteImage(context, watermark, watermarkX, watermarkY, watermarkWidth, watermarkHeight, {
        opacity: 0.92,
        shadowBlur: 14,
        shadowOffsetY: 4,
        shadowColor: "rgba(0, 0, 0, 0.38)",
      });
    }

    const fileName = `cts-oleocon-viewer-${new Date().toISOString().slice(0, 10)}.png`;
    downloadDataUrl(output.toDataURL("image/png"), fileName);
  };

  const rememberTourDone = () => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      // localStorage can be unavailable in private/restricted browser modes.
    }
  };

  const closeTourPanelsAfterTour = () => {
    setIsLeftPanelOpen(false);
    setIsRightPanelOpen(false);
  };

  const startViewerTour = () => {
    if (!isModelReady || loadError) return;
    setTourStepIndex(0);
    setIsTourOpen(true);
  };

  const toggleViewerTour = () => {
    if (isTourOpen) {
      resetTourCardPlacement();
      closeTourPanelsAfterTour();
      setIsTourOpen(false);
      return;
    }

    startViewerTour();
  };

  const resetAccessRequestFlow = () => {
    accessRequestDragRef.current = { pointerId: null, startX: 0, startProgress: 0 };
    setIsAccessRequestOpen(false);
    setAccessRequestIdentity("");
    setAccessRequestStatus("idle");
    setAccessRequestProgress(0);
  };

  const openImmersiveAccess = (mode: ImmersiveAccessMode) => {
    setImmersiveAccessMode(mode);
    setImmersiveAccessPassword("");
    setImmersiveAccessMessage("");
    resetAccessRequestFlow();
  };

  const closeImmersiveAccess = () => {
    setImmersiveAccessMode(null);
    setImmersiveAccessPassword("");
    setImmersiveAccessMessage("");
    resetAccessRequestFlow();
  };

  const submitImmersiveAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeImmersiveAccessCopy) return;

    setImmersiveAccessMessage(activeImmersiveAccessCopy.lockedMessage);
  };

  const sendAccessRequest = () => {
    if (!activeImmersiveAccessCopy || accessRequestStatus === "loading" || accessRequestStatus === "success") return;

    const identity = normalizeAccessRequestIdentity(accessRequestIdentity);
    const approvedCode = isApprovedAccessCode(identity);
    const validEmail = isValidDotComEmail(identity);

    if (!identity) {
      setAccessRequestStatus("error");
      setAccessRequestProgress(0);
      setImmersiveAccessMessage("Please enter your email or client account ID so CTS can prepare the access request for you.");
      return;
    }

    if (!approvedCode && !validEmail) {
      setAccessRequestStatus("error");
      setAccessRequestProgress(0);
      setImmersiveAccessMessage(
        looksLikeAccessCode(identity)
          ? "This access code has the right format, but it is not approved. Use the code provided by CTS."
          : "Enter an approved access code, or a supported .com email address."
      );
      return;
    }

    setAccessRequestStatus("loading");
    setImmersiveAccessMessage("Checking your access request for CTS.");

    window.setTimeout(() => {
      setAccessRequestStatus("success");
      setAccessRequestProgress(1);
      setImmersiveAccessMessage(
        approvedCode
          ? `Request sent with approved code ${identity.toUpperCase()}. CTS will continue the access process.`
          : `Request sent. CTS will use ${identity} to follow up with access details.`
      );
    }, 900);
  };

  const requestImmersiveAccess = () => {
    if (!activeImmersiveAccessCopy) return;

    setIsAccessRequestOpen(true);
    setAccessRequestStatus("idle");
    setAccessRequestProgress(0);
    setImmersiveAccessMessage("Please enter your email or client account ID. We will automate the access request message for you.");
  };

  const startAccessRequestSlide = (event: PointerEvent<HTMLDivElement>) => {
    if (!isAccessRequestOpen || accessRequestStatus === "loading" || accessRequestStatus === "success") return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    accessRequestDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startProgress: accessRequestProgress };
  };

  const moveAccessRequestSlide = (event: PointerEvent<HTMLDivElement>) => {
    const drag = accessRequestDragRef.current;
    if (drag.pointerId !== event.pointerId || accessRequestStatus === "loading" || accessRequestStatus === "success") return;

    const nextProgress = clamp(drag.startProgress + (event.clientX - drag.startX) / ACCESS_REQUEST_SLIDE_DISTANCE, 0, 1);
    setAccessRequestProgress(nextProgress);
  };

  const finishAccessRequestSlide = (event: PointerEvent<HTMLDivElement>) => {
    const drag = accessRequestDragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    accessRequestDragRef.current = { pointerId: null, startX: 0, startProgress: 0 };
    if (accessRequestProgress >= 0.9) {
      sendAccessRequest();
      return;
    }

    setAccessRequestProgress(0);
  };

  const resetTourCardPlacement = () => {
    setTourCardStyle(undefined);
    setTourCardStyleTarget(null);
    setTourCardStyleStepId(null);
  };

  const prepareTourPanelForTarget = (target?: TourTarget) => {
    if (target === "parts") {
      setIsLeftPanelOpen(true);
      return;
    }

    if (target === "tools" || target === "colors" || target === "quickActions") {
      setIsRightPanelOpen(true);
    }
  };

  const skipViewerTour = () => {
    resetTourCardPlacement();
    rememberTourDone();
    closeTourPanelsAfterTour();
    setIsTourOpen(false);
  };

  const goToPreviousTourStep = () => {
    const nextIndex = Math.max(0, tourStepIndex - 1);
    prepareTourPanelForTarget(VIEWER_TOUR_STEPS[nextIndex]?.target);
    resetTourCardPlacement();
    setTourStepIndex(nextIndex);
  };

  const goToNextTourStep = () => {
    if (tourStepIndex >= VIEWER_TOUR_STEPS.length - 1) {
      resetTourCardPlacement();
      rememberTourDone();
      closeTourPanelsAfterTour();
      setIsTourOpen(false);
      return;
    }

    const nextIndex = tourStepIndex + 1;
    prepareTourPanelForTarget(VIEWER_TOUR_STEPS[nextIndex]?.target);
    resetTourCardPlacement();
    setTourStepIndex(nextIndex);
  };


  useEffect(() => {
    const previousRoute = document.body.dataset.ctsRoute;
    document.body.dataset.ctsRoute = "oleocon-3d-viewer";

    return () => {
      if (previousRoute) {
        document.body.dataset.ctsRoute = previousRoute;
      } else {
        delete document.body.dataset.ctsRoute;
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCatalogPanelOpen(false);
        closeImmersiveAccess();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCatalogPanelOpen) {
      document.body.dataset.ctsCatalogOpen = "true";
    } else {
      delete document.body.dataset.ctsCatalogOpen;
    }

    return () => {
      delete document.body.dataset.ctsCatalogOpen;
    };
  }, [isCatalogPanelOpen]);

  const activeLookModeForControls = useMemo<LookMode | null>(() => {
    if (!selectedPartIds.length) return lookMode;

    const selectedLookModes = selectedPartIds.map((partId) => lookByPartIdRef.current[partId] ?? "originalMaterial");
    const firstLookMode = selectedLookModes[0] ?? "originalMaterial";

    return selectedLookModes.every((partLookMode) => partLookMode === firstLookMode) ? firstLookMode : null;
  }, [lookMode, lookStateVersion, selectedPartIds]);

  const panelStateStyle = {
    "--viewer-bg": background,
    "--viewer-active-tool-color": activeColorValue,
  } as CSSProperties;

  return (
    <>
      <SiteHeader />
      <div className="oleocon-viewer-header-actions" aria-label="Viewer header actions">
        <button
          type="button"
          className={`oleocon-viewer-header-snapshot ${isTourTarget("snapshot") ? "is-tour-target" : ""}`}
          onClick={exportSnapshot}
          aria-label="Export snapshot"
        >
          <img src="/icons/camera_snapshot.svg" alt="" aria-hidden="true" />
          <span>Snapshot</span>
        </button>
        <button
          type="button"
          className="oleocon-viewer-header-immersive-button oleocon-viewer-header-immersive-button-ar"
          onClick={() => openImmersiveAccess("ar")}
          aria-label="Open protected AR preview"
          title="AR"
        >
          <img src="/icons/augmented-reality-ar-stroke-rounded.svg" alt="" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="oleocon-viewer-header-immersive-button oleocon-viewer-header-immersive-button-vr"
          onClick={() => openImmersiveAccess("vr")}
          aria-label="Open protected VR preview"
          title="VR"
        >
          <img src="/icons/vr-glasses-stroke-rounded.svg" alt="" aria-hidden="true" />
        </button>
      </div>
      <main
        className={`oleocon-viewer-page ${isTourOpen ? "is-tour-open" : ""}`}
        data-viewer-version={OLEOCON_VIEWER_VERSION}
        data-tour-step={activeTourStep?.target}
        style={panelStateStyle}
        onContextMenu={(event) => event.preventDefault()}
      >
      <section className="oleocon-viewer-stage" aria-label="Oleocon standalone 3D viewer">
        <div
          className={`oleocon-viewer-canvas-shell ${isTourTarget("canvas") ? "is-tour-target" : ""} ${currentTool === "text" || currentTool === "note" ? "is-text-tool" : ""} ${currentTool === "moveText" ? "is-text-move-tool" : ""} ${currentTool === "brush" ? "is-brush-tool" : ""} ${currentTool === "arrowBrush" ? "is-arrow-brush-tool" : ""}`}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerCancel}
          onPointerLeave={handleCanvasPointerCancel}
          onWheel={handleCanvasWheel}
        >
          <div ref={mountRef} className="oleocon-viewer-canvas" />
          <div ref={overlayRef} className="oleocon-viewer-annotation-layer" aria-hidden="true">
            <svg className="oleocon-viewer-paint-layer" aria-hidden="true">
              {paintMarks.map((mark) => {
                if (mark.kind === "stroke") {
                  if (mark.points.length <= 1) {
                    const point = mark.points[0];
                    if (!point) return null;

                    return (
                      <circle
                        key={mark.id}
                        cx={point.x}
                        cy={point.y}
                        r={Math.max(1, mark.size / 2)}
                        fill={mark.color}
                      />
                    );
                  }

                  const pathData = mark.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
                  return (
                    <path
                      key={mark.id}
                      d={pathData}
                      fill="none"
                      stroke={mark.color}
                      strokeWidth={mark.size}
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                      strokeMiterlimit={2}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                }

                const shaftDx = mark.tipX - mark.tailX;
                const shaftDy = mark.tipY - mark.tailY;
                const shaftLength = Math.hypot(shaftDx, shaftDy);
                if (shaftLength < 2) return null;

                const unitX = shaftDx / shaftLength;
                const unitY = shaftDy / shaftLength;
                const headLength = Math.max(12, mark.size * 2.65);
                const headWidth = Math.max(10, mark.size * 2.28);
                const lineEndX = mark.tipX - unitX * headLength * 0.72;
                const lineEndY = mark.tipY - unitY * headLength * 0.72;
                const perpX = -unitY;
                const perpY = unitX;
                const baseX = mark.tipX - unitX * headLength;
                const baseY = mark.tipY - unitY * headLength;
                const headHalf = headWidth / 2;
                const arrowPoints = [
                  `${mark.tipX},${mark.tipY}`,
                  `${baseX + perpX * headHalf},${baseY + perpY * headHalf}`,
                  `${baseX - perpX * headHalf},${baseY - perpY * headHalf}`,
                ].join(" ");

                return (
                  <g key={mark.id} className="oleocon-viewer-paint-arrow">
                    <line
                      x1={mark.tailX}
                      y1={mark.tailY}
                      x2={lineEndX}
                      y2={lineEndY}
                      stroke={mark.color}
                      strokeWidth={mark.size}
                      strokeLinecap="butt"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polygon
                      points={arrowPoints}
                      fill={mark.color}
                      stroke={mark.color}
                      strokeLinejoin="miter"
                      strokeMiterlimit={2}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>

            <svg className="oleocon-viewer-annotation-connectors" aria-hidden="true">
              {annotations.map((annotation) => {
                if (!annotation.screen.visible || annotation.kind === "screen") return null;

                const offset = annotation.offset ?? { x: 0, y: 0 };
                const connectorX = annotation.screen.x + offset.x + 18;
                const connectorY = annotation.screen.y + offset.y;

                return (
                  <line
                    key={`${annotation.id}-connector`}
                    x1={annotation.screen.x}
                    y1={annotation.screen.y}
                    x2={connectorX}
                    y2={connectorY}
                    stroke={annotation.color}
                    strokeWidth={selectedAnnotationId === annotation.id ? 2 : 1.35}
                    opacity={selectedAnnotationId === annotation.id ? 0.95 : 0.72}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {annotations.map((annotation) => {
              const offset = annotation.offset ?? { x: 0, y: 0 };
              const isScreenNote = annotation.kind === "screen";

              return (
                <button
                  key={annotation.id}
                  type="button"
                  className={`oleocon-viewer-annotation ${selectedAnnotationId === annotation.id ? "is-selected" : ""} ${isScreenNote ? "is-screen-note" : "is-model-note"}`}
                  style={{
                    left: annotation.screen.x + (isScreenNote ? 0 : offset.x),
                    top: annotation.screen.y + (isScreenNote ? 0 : offset.y),
                    opacity: annotation.screen.visible ? 1 : 0,
                    pointerEvents: annotation.screen.visible ? "auto" : "none",
                    fontSize: `${annotation.size ?? DEFAULT_ANNOTATION_SIZE}px`,
                    "--annotation-color": annotation.color,
                  } as CSSProperties}
                  onPointerDown={(event) => startAnnotationDrag(annotation, event)}
                  onPointerMove={moveAnnotationDrag}
                  onPointerUp={finishAnnotationDrag}
                  onPointerCancel={finishAnnotationDrag}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectAnnotation(annotation, { keepCurrentTool: currentToolRef.current === "moveText" });
                  }}
                  title={currentTool === "moveText" ? "Drag to move this note box" : "Click to select this note"}
                >
                  {annotation.text}
                </button>
              );
            })}
          </div>

        </div>

        {isControlsOpen ? (
          <aside className="oleocon-viewer-control-help-card" aria-label="3D controls help">
            <div className="oleocon-viewer-control-help-head">
              <span>Controls</span>
              <button type="button" className="oleocon-viewer-control-help-close" onClick={() => setIsControlsOpen(false)} aria-label="Close controls help">
                ×
              </button>
            </div>
            <dl>
              <div><dt>Left drag</dt><dd>Rotate freely</dd></div>
              <div><dt>Shift / Alt + drag</dt><dd>Roll around Z</dd></div>
              <div><dt>Wheel / pinch</dt><dd>Zoom</dd></div>
              <div><dt>Right / middle drag</dt><dd>Pan</dd></div>
              <div><dt>Select mode</dt><dd>Click a part</dd></div>
              <div><dt>Anchor Note</dt><dd>Click model to place attached note</dd></div>
              <div><dt>Add Note</dt><dd>Click anywhere to place screen note</dd></div>
            </dl>
          </aside>
        ) : null}

        <aside
          ref={leftPanelRef}
          className={`oleocon-viewer-panel oleocon-viewer-panel-left ${isLeftPanelOpen ? "is-open" : "is-closed"} ${mobileExpandedPanel === "left" ? "is-mobile-expanded" : ""} ${isTourTarget("parts") ? "is-tour-target" : ""}`}
        >
          <button
            type="button"
            className="oleocon-viewer-panel-toggle"
            onPointerDown={(event) => handleMobilePanelTitlePointerDown("left", event)}
            onPointerUp={(event) => handleMobilePanelTitlePointerUp("left", event)}
            onPointerCancel={handleMobilePanelTitlePointerCancel}
            onClick={(event) => handleViewerPanelToggleClick("left", event)}
          >
            Parts
          </button>

          <div className="oleocon-viewer-panel-content">
            <div className="oleocon-viewer-panel-head oleocon-viewer-panel-head-product">
              <p>{PRODUCT_NAME_LINE_1}</p>
              <strong>{PRODUCT_NAME_LINE_2}</strong>
            </div>

            <div className="oleocon-viewer-part-actions">
              <button type="button" onClick={showAllParts}>Show all</button>
              <button type="button" onClick={deselectParts} disabled={!selectedPartIds.length}>Deselect</button>
              <button type="button" onClick={isolateSelectedParts} disabled={!selectedPartIds.length}>Isolate Selected</button>
              <button type="button" onClick={hideSelectedParts} disabled={!selectedPartIds.length}>Hide selected</button>
            </div>

            <div ref={partListRef} className="oleocon-viewer-part-list" aria-label="Oleocon model parts">
              {parts.map((part, index) => {
                const isSelected = selectedPartIds.includes(part.id);
                const isIsolated = isolatedPartIdsRef.current.includes(part.id);
                const isHidden = !part.visible;
                const isGroupStart = index === 0 || parts[index - 1]?.groupKind !== part.groupKind;

                return (
                  <article
                    key={part.id}
                    ref={(element) => {
                      if (element) partRowRefs.current.set(part.id, element);
                      else partRowRefs.current.delete(part.id);
                    }}
                    className={`oleocon-viewer-part-row is-${part.groupKind}-group ${isGroupStart ? "is-group-start" : ""} ${isSelected ? "is-selected" : ""} ${isHidden ? "is-hidden" : ""} ${isIsolated ? "is-isolated" : ""}`}
                    data-group-label={part.groupLabel}
                  >
                    <button
                      type="button"
                      className="oleocon-viewer-part-name"
                      onClick={() => selectPart(part.id, "toggle")}
                    >
                      {part.name}
                    </button>
                    <button
                      type="button"
                      className={isHidden ? "is-active" : ""}
                      onClick={() => setPartVisible(part.id, !part.visible)}
                    >
                      {part.visible ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      className={isIsolated ? "is-active" : ""}
                      onClick={() => togglePartIsolation(part.id)}
                    >
                      Solo
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </aside>

        <aside
          ref={rightPanelRef}
          className={`oleocon-viewer-panel oleocon-viewer-panel-right ${isRightPanelOpen ? "is-open" : "is-closed"} ${mobileExpandedPanel === "right" ? "is-mobile-expanded" : ""} ${isTourTarget("tools") ? "is-tour-target" : ""} ${isTourTarget("colors") ? "is-tour-colors-active" : ""} ${isTourTarget("quickActions") ? "is-tour-quick-actions-active" : ""}`}
        >
          <button
            type="button"
            className="oleocon-viewer-panel-toggle"
            onPointerDown={(event) => handleMobilePanelTitlePointerDown("right", event)}
            onPointerUp={(event) => handleMobilePanelTitlePointerUp("right", event)}
            onPointerCancel={handleMobilePanelTitlePointerCancel}
            onClick={(event) => handleViewerPanelToggleClick("right", event)}
          >
            Tools
          </button>

          <div className="oleocon-viewer-panel-content">
            <div className="oleocon-viewer-panel-head">
              <p>Viewer tools</p>
              <strong>{viewerToolSummary}</strong>
            </div>

            <section ref={quickActionsSectionRef} className={`oleocon-viewer-tool-section oleocon-viewer-quick-actions-section ${isTourTarget("quickActions") ? "is-tour-target" : ""}`} aria-label="Quick actions">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Quick Actions</strong>
              </div>
              <div className="oleocon-viewer-quick-actions-row">
                <div className="oleocon-viewer-quick-action-item">
                  <button
                    type="button"
                    className="oleocon-viewer-quick-action-button"
                    onClick={undoViewerAction}
                    disabled={!canUndoAction}
                    aria-label="Undo"
                  >
                    <img src="/icons/backward.svg" alt="" aria-hidden="true" />
                  </button>
                  <span>Undo</span>
                </div>
                <div className="oleocon-viewer-quick-action-item">
                  <button
                    type="button"
                    className="oleocon-viewer-quick-action-button"
                    onClick={redoViewerAction}
                    disabled={!canRedoAction}
                    aria-label="Redo"
                  >
                    <img src="/icons/forward.svg" alt="" aria-hidden="true" />
                  </button>
                  <span>Redo</span>
                </div>
                <div className="oleocon-viewer-quick-action-item">
                  <button
                    type="button"
                    className={`oleocon-viewer-quick-action-button ${isAutoRotateActive ? "is-active" : ""}`}
                    onClick={toggleAutoRotate}
                    aria-label="Rotate"
                  >
                    <img src="/icons/rotate-clockwise-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </button>
                  <span>Rotate</span>
                </div>
                <div className="oleocon-viewer-quick-action-item">
                  <button
                    type="button"
                    className={`oleocon-viewer-quick-action-button ${isCatalogPanelOpen ? "is-active" : ""}`}
                    onClick={() => setIsCatalogPanelOpen((value) => !value)}
                    aria-label="Catalog data"
                  >
                    <img src="/icons/search-list-02-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </button>
                  <span>Catalog</span>
                </div>
                <div className="oleocon-viewer-quick-action-item">
                  <button
                    type="button"
                    className={`oleocon-viewer-quick-action-button ${isControlsOpen ? "is-active" : ""}`}
                    onClick={() => setIsControlsOpen((value) => !value)}
                    aria-label="Controls"
                  >
                    <img src="/icons/mouse-07.svg" alt="" aria-hidden="true" />
                  </button>
                  <span>Controls</span>
                </div>
                <div className="oleocon-viewer-quick-action-item">
                  <button
                    type="button"
                    className={`oleocon-viewer-quick-action-button ${isTourOpen ? "is-active" : ""}`}
                    onClick={toggleViewerTour}
                    disabled={!isModelReady || Boolean(loadError)}
                    aria-label="Tour"
                  >
                    <img src="/icons/book-open-02-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </button>
                  <span>Tour</span>
                </div>
              </div>
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Select tools">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Select / Deselect</strong>
              </div>
              <div className="oleocon-viewer-tool-grid">
                <button type="button" className={currentTool === "select" ? "is-active" : ""} onClick={() => {
                  setSelectedAnnotationId(null);
                  setCurrentTool("select");
                }}>
                  Select
                </button>
                <button type="button" onClick={deselectParts} disabled={!selectedPartIds.length}>
                  Deselect
                </button>
              </div>
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Look tools">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Look</strong>
              </div>
              <div className="oleocon-viewer-tool-grid oleocon-viewer-look-grid">
                <button
                  type="button"
                  className={activeLookModeForControls === "originalMaterial" ? "is-active" : ""}
                  onClick={() => applyLookMode("originalMaterial")}
                >
                  Original Material
                </button>
                <button
                  type="button"
                  className={activeLookModeForControls === "inspectionLine" ? "is-active" : ""}
                  onClick={() => applyLookMode("inspectionLine")}
                >
                  Wireframe
                </button>
                <button
                  type="button"
                  className={activeLookModeForControls === "xray" ? "is-active" : ""}
                  onClick={() => applyLookMode("xray")}
                >
                  Opacity
                </button>
                <button
                  type="button"
                  className={activeLookModeForControls === "technicalEdges" ? "is-active" : ""}
                  onClick={() => applyLookMode("technicalEdges")}
                >
                  X Ray
                </button>
              </div>
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Separate parts">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Separate Parts</strong>
              </div>
              <input
                ref={explodeSliderRef}
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue={explode}
                onPointerDown={recordViewerAction}
                onInput={(event) => {
                  setExplodeImmediate(Number(event.currentTarget.value), false);
                }}
                onChange={(event) => {
                  setExplodeImmediate(Number(event.currentTarget.value), false);
                }}
                onPointerUp={() => setExplodeImmediate(explodeRef.current, true)}
                onBlur={() => setExplodeImmediate(explodeRef.current, true)}
              />
            </section>

            <section ref={colorsSectionRef} className={`oleocon-viewer-tool-section oleocon-viewer-colors-section ${isTourTarget("colors") ? "is-tour-target" : ""}`} aria-label="Color selected parts">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Colors</strong>
              </div>
              <div className="oleocon-viewer-color-row">
                {PAINT_COLORS.map((color) => {
                  const isOriginalReset = color.value === ORIGINAL_PART_COLOR_VALUE;

                  return (
                    <button
                      key={color.value}
                      type="button"
                      className={`${isOriginalReset ? "oleocon-viewer-color-reset" : ""} ${!isOriginalReset && activeColorValue === color.value ? "is-active-color" : ""}`}
                      title={color.label}
                      aria-label={isOriginalReset ? "Reset selected parts to original material" : `Use ${color.label}`}
                      style={isOriginalReset ? undefined : ({ "--swatch": color.value } as CSSProperties)}
                      onClick={() => chooseToolColor(color.value)}
                      disabled={isOriginalReset && !selectedPartIds.length && !selectedAnnotationReceivesColor && toolColor === DEFAULT_TOOL_COLOR}
                    >
                      {isOriginalReset ? <img src="/icons/3d-rotate-stroke-rounded.svg" alt="" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Text tools">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Texts</strong>
              </div>
              <div className="oleocon-viewer-tool-grid oleocon-viewer-text-grid">
                <button type="button" className={`oleocon-viewer-text-main-button ${currentTool === "text" ? "is-active" : ""}`} onClick={() => {
                    setSelectedAnnotationId(null);
                    setCurrentTool("text");
                  }}>
                  Anchor Note
                </button>
                <button type="button" className={`oleocon-viewer-text-main-button ${currentTool === "note" ? "is-active" : ""}`} onClick={() => {
                    setSelectedAnnotationId(null);
                    setCurrentTool("note");
                  }}>
                  Add Note
                </button>
                <div className="oleocon-viewer-text-action-row oleocon-viewer-text-action-row-full" aria-label="Selected note controls">
                  <button
                    type="button"
                    className="oleocon-viewer-text-icon-button"
                    onClick={() => resizeSelectedAnnotation("bigger")}
                    disabled={!selectedAnnotation}
                    aria-label="Make selected note bigger"
                    title="Make selected note bigger"
                  >
                    <img src="/icons/a-arrow-up-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="oleocon-viewer-text-icon-button"
                    onClick={() => resizeSelectedAnnotation("smaller")}
                    disabled={!selectedAnnotation}
                    aria-label="Make selected note smaller"
                    title="Make selected note smaller"
                  >
                    <img src="/icons/a-arrow-down-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`oleocon-viewer-text-icon-button ${currentTool === "moveText" ? "is-active" : ""}`}
                    onClick={() => {
                      setCurrentTool("moveText");
                    }}
                    disabled={!annotations.length}
                    aria-label="Move selected note box"
                    title="Move selected note box"
                  >
                    <img src="/icons/square-mouse-pointer-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="oleocon-viewer-text-icon-button"
                    onClick={deleteSelectedAnnotation}
                    disabled={!selectedAnnotation}
                    aria-label="Delete selected note"
                    title="Delete selected note"
                  >
                    <img src="/icons/trash.svg" alt="" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <textarea
                className="oleocon-viewer-text-input"
                value={selectedAnnotation ? selectedAnnotation.text : annotationText}
                onChange={(event) => handleAnnotationTextChange(event.target.value)}
                placeholder="Type note, then choose Anchor Note or Add Note"
                rows={4}
              />
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Paint drawing tools">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Paints</strong>
              </div>
              <div className="oleocon-viewer-paint-row" aria-label="Paint tools and size">
                <button
                  type="button"
                  className={`oleocon-viewer-paint-icon-button ${currentTool === "brush" ? "is-active" : ""}`}
                  onClick={() => {
                    setCurrentTool("brush");
                  }}
                  aria-label="Pencil"
                  title="Pencil"
                >
                  <img src="/icons/pencil-stroke-rounded.svg" alt="" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`oleocon-viewer-paint-icon-button oleocon-viewer-paint-arrow-button ${currentTool === "arrowBrush" ? "is-active" : ""}`}
                  onClick={() => {
                    setCurrentTool("arrowBrush");
                  }}
                  aria-label="Arrow"
                  title="Arrow"
                >
                  <img src="/icons/arrow-down-05-stroke-rounded.svg" alt="" aria-hidden="true" />
                </button>
                <div className="oleocon-viewer-paint-size-box">
                  <span className="oleocon-viewer-paint-size-icon" aria-label="Size" title="Size">
                    <img src="/icons/edit-01-stroke-rounded.svg" alt="" aria-hidden="true" />
                  </span>
                  <span className="oleocon-viewer-paint-divider" aria-hidden="true" />
                  <input
                    className="oleocon-viewer-paint-size-slider"
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={brushSize}
                    style={{
                      "--brush-size-progress": brushSizeProgress,
                      "--paint-slider-color": activeColorValue,
                    } as CSSProperties}
                    onChange={(event) => setBrushSize(Number(event.target.value))}
                    aria-label="Paint size"
                  />
                  <span className="oleocon-viewer-paint-divider" aria-hidden="true" />
                  <strong className="oleocon-viewer-paint-size-value">{brushSize}</strong>
                </div>
              </div>
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Background options">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Background</strong>
              </div>
              <div className="oleocon-viewer-bg-grid oleocon-viewer-bg-visual-grid">
                {BACKGROUNDS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`oleocon-viewer-bg-card ${background === item.value ? "is-active" : ""}`}
                    style={{ "--bg-swatch": item.value } as CSSProperties}
                    title={item.label}
                    aria-label={`Use ${item.label} background`}
                    onClick={() => {
                      recordViewerAction();
                      setBackground(item.value);
                    }}
                  >
                    <span className="oleocon-viewer-bg-preview" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>

            <section className="oleocon-viewer-tool-section" aria-label="Reset tools">
              <div className="oleocon-viewer-tool-section-head">
                <strong>Reset</strong>
              </div>
              <div className="oleocon-viewer-tool-grid oleocon-viewer-reset-grid">
                <button type="button" onClick={resetView}>
                  Reset View
                </button>
                <button type="button" className="oleocon-viewer-action-button" onClick={resetAll}>
                  Reset All
                </button>
              </div>
              <button
                type="button"
                className="oleocon-viewer-library-button"
                onClick={() => openImmersiveAccess("library")}
                aria-label="Open protected model library"
              >
                <img
                  src="/icons/files-01-stroke-rounded.svg"
                  alt=""
                  aria-hidden="true"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/icons/search-list-02-stroke-rounded.svg";
                  }}
                />
                <span className="oleocon-viewer-library-divider" aria-hidden="true" />
                <span className="oleocon-viewer-library-copy">
                  <strong>Library</strong>
                  <small><span>Browse</span><span>More models</span></small>
                </span>
              </button>
            </section>
          </div>
        </aside>

        {activeImmersiveAccessCopy ? (
          <div className="oleocon-viewer-immersive-access-layer" data-immersive-mode={immersiveAccessMode} role="dialog" aria-modal="true" aria-labelledby="oleocon-viewer-immersive-access-title">
            <button type="button" className="oleocon-viewer-immersive-access-backdrop" onClick={closeImmersiveAccess} aria-label="Close protected immersive access" />
            <form className="oleocon-viewer-immersive-access-panel" data-access-request-open={isAccessRequestOpen ? "true" : "false"} onSubmit={submitImmersiveAccess}>
              <header className="oleocon-viewer-immersive-access-head">
                <p>{activeImmersiveAccessCopy.eyebrow}</p>
                <h2 id="oleocon-viewer-immersive-access-title">{activeImmersiveAccessCopy.title}</h2>
              </header>
              <p className="oleocon-viewer-immersive-access-body">{activeImmersiveAccessCopy.body}</p>
              <label className="oleocon-viewer-immersive-access-field">
                <span>{activeImmersiveAccessCopy.passwordLabel}</span>
                <input
                  type="password"
                  value={immersiveAccessPassword}
                  onChange={(event) => {
                    setImmersiveAccessPassword(event.target.value);
                    setImmersiveAccessMessage("");
                  }}
                  placeholder={activeImmersiveAccessCopy.placeholder}
                  autoComplete="off"
                  autoFocus
                />
              </label>
              {immersiveAccessMessage ? (
                <p className="oleocon-viewer-immersive-access-message">{immersiveAccessMessage}</p>
              ) : null}
              {isAccessRequestOpen ? (
                <div className="oleocon-viewer-access-request-box">
                  <label className="oleocon-viewer-access-request-field">
                    <span>Email or Your Client ID</span>
                    <input
                      type="text"
                      value={accessRequestIdentity}
                      onChange={(event) => {
                        setAccessRequestIdentity(event.target.value);
                        if (accessRequestStatus === "error") setAccessRequestStatus("idle");
                      }}
                      placeholder="Email or client ID"
                      autoComplete="email"
                    />
                  </label>
                </div>
              ) : null}
              <div className="oleocon-viewer-immersive-access-actions">
                <button type="button" className="is-strong" onClick={closeImmersiveAccess}>
                  Cancel
                </button>
                {isAccessRequestOpen ? (
                  <div
                    className={`oleocon-viewer-access-slide is-${accessRequestStatus}`}
                    style={{ "--access-slide-progress": accessRequestProgress } as CSSProperties}
                    onPointerDown={startAccessRequestSlide}
                    onPointerMove={moveAccessRequestSlide}
                    onPointerUp={finishAccessRequestSlide}
                    onPointerCancel={finishAccessRequestSlide}
                    role="button"
                    aria-label="Slide to request access"
                    tabIndex={0}
                  >
                    <span className="oleocon-viewer-access-slide-fill" />
                    <span
                      className="oleocon-viewer-access-slide-handle"
                      aria-hidden="true"
                    >
                      {accessRequestStatus === "loading" ? "…" : accessRequestStatus === "success" ? "✓" : accessRequestStatus === "error" ? "!" : "→"}
                    </span>
                    <span className="oleocon-viewer-access-slide-label">
                      {accessRequestStatus === "success" ? "Sent" : accessRequestStatus === "loading" ? "Checking" : "Slide request"}
                    </span>
                  </div>
                ) : null}
                <button type="button" onClick={requestImmersiveAccess}>
                  {activeImmersiveAccessCopy.requestButton}
                </button>
                <button type="submit" className="is-strong">
                  Continue
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {isCatalogPanelOpen ? (
          <div className="oleocon-viewer-catalog-layer" role="dialog" aria-modal="true" aria-labelledby="oleocon-viewer-catalog-title">
            <button type="button" className="oleocon-viewer-catalog-backdrop" onClick={() => setIsCatalogPanelOpen(false)} aria-label="Close catalog panel" />
            <article className="oleocon-viewer-catalog-panel">
              <header className="oleocon-viewer-catalog-head">
                <div>
                  <p>Oleocon catalog data</p>
                  <h2 id="oleocon-viewer-catalog-title">Hydraulic Quick Couplings QC Series with Poppet</h2>
                </div>
                <div className="oleocon-viewer-catalog-head-actions">
                  <div className="oleocon-viewer-catalog-tabs" role="tablist" aria-label="Catalog sections">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={catalogTab === "overview"}
                      className={catalogTab === "overview" ? "is-active" : ""}
                      onClick={() => setCatalogTab("overview")}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={catalogTab === "tables"}
                      className={catalogTab === "tables" ? "is-active" : ""}
                      onClick={() => setCatalogTab("tables")}
                    >
                      Dimensions & Performance
                    </button>
                  </div>
                  <button type="button" className="oleocon-viewer-catalog-close" onClick={() => setIsCatalogPanelOpen(false)} aria-label="Close catalog panel">
                    ×
                  </button>
                </div>
              </header>

              <div className={`oleocon-viewer-catalog-body ${catalogTab === "tables" ? "is-tables" : "is-overview"}`}>
                {catalogTab === "overview" ? (
                  <div className="oleocon-viewer-catalog-dashboard-grid">
                    <section className="oleocon-viewer-catalog-section oleocon-viewer-catalog-summary-panel">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Quick Summary</strong>
                      </div>
                      <div className="oleocon-viewer-catalog-summary-grid">
                        {CATALOG_SUMMARY_ITEMS.map((item, index) => (
                          <article key={item.label} className="oleocon-viewer-catalog-summary-card">
                            <CatalogDataIcon kind="summary" index={index} />
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="oleocon-viewer-catalog-section oleocon-viewer-catalog-features-panel">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Technical Features & Options</strong>
                        <span>3D Section</span>
                      </div>
                      <div className="oleocon-viewer-catalog-feature-grid">
                        {CATALOG_TECHNICAL_FEATURES.map((feature, index) => (
                          <article key={feature.title} className="oleocon-viewer-catalog-feature-card">
                            <CatalogDataIcon kind="feature" index={index} />
                            <span>{feature.title}</span>
                            <strong>{feature.value}</strong>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="oleocon-viewer-catalog-section oleocon-viewer-catalog-applications-panel">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Main Applications</strong>
                      </div>
                      <div className="oleocon-viewer-catalog-application-grid">
                        {CATALOG_APPLICATIONS.map((application) => (
                          <article key={application.label} className="oleocon-viewer-catalog-application-card">
                            <CatalogApplicationIcon icon={application.icon} />
                            <strong>{application.label}</strong>
                          </article>
                        ))}
                      </div>
                    </section>

                    <article className="oleocon-viewer-catalog-note-card oleocon-viewer-catalog-warning-panel is-warning">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Warning</strong>
                      </div>
                      <ul>
                        {CATALOG_WARNING_ITEMS.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>

                    <article className="oleocon-viewer-catalog-note-card oleocon-viewer-catalog-information-panel is-information">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Information</strong>
                      </div>
                      <ul>
                        {CATALOG_INFORMATION_ITEMS.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  </div>
                ) : (
                  <div className="oleocon-viewer-catalog-tables-layout">
                    <section className="oleocon-viewer-catalog-section oleocon-viewer-catalog-dimensions-panel">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Dimensions</strong>
                        <span>ASME.B1.20.1.NPT</span>
                      </div>
                      <div className="oleocon-viewer-catalog-table-shell">
                        <table className="oleocon-viewer-catalog-table oleocon-viewer-catalog-table-dimensions">
                          <thead>
                            <tr>
                              {CATALOG_DIMENSION_COLUMNS.map((column) => (
                                <th key={column} scope="col">{column}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CATALOG_DIMENSION_ROWS.map((row) => (
                              <tr key={row.join("-")}>
                                {row.map((value, index) => (
                                  <td key={`${row[1]}-${CATALOG_DIMENSION_COLUMNS[index]}`}>{value}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="oleocon-viewer-catalog-section oleocon-viewer-catalog-pressure-panel">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Working & Burst Pressure</strong>
                      </div>
                      <div className="oleocon-viewer-catalog-table-shell">
                        <table className="oleocon-viewer-catalog-table oleocon-viewer-catalog-table-transposed">
                          <thead>
                            <tr>
                              <th scope="col">Measurement</th>
                              {CATALOG_PRESSURE_ROWS.map((row) => (
                                <th key={`pressure-size-${row[0]}`} scope="col">Body {row[0]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CATALOG_PRESSURE_COLUMNS.slice(1).map((column, metricIndex) => (
                              <tr key={column}>
                                <th scope="row">{column}</th>
                                {CATALOG_PRESSURE_ROWS.map((row) => (
                                  <td key={`${column}-${row[0]}`}>{row[metricIndex + 1]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="oleocon-viewer-catalog-section oleocon-viewer-catalog-flow-panel">
                      <div className="oleocon-viewer-catalog-section-head">
                        <strong>Flow, Fluid Loss & Force</strong>
                      </div>
                      <div className="oleocon-viewer-catalog-table-shell">
                        <table className="oleocon-viewer-catalog-table oleocon-viewer-catalog-table-transposed">
                          <thead>
                            <tr>
                              <th scope="col">Measurement</th>
                              {CATALOG_FLOW_ROWS.map((row) => (
                                <th key={`flow-size-${row[0]}`} scope="col">Body {row[0]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CATALOG_FLOW_COLUMNS.slice(1).map((column, metricIndex) => (
                              <tr key={column}>
                                <th scope="row">{column}</th>
                                {CATALOG_FLOW_ROWS.map((row) => (
                                  <td key={`${column}-${row[0]}`}>{row[metricIndex + 1]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </article>
          </div>
        ) : null}

        <footer className="oleocon-viewer-help-strip">
          <span>Left drag: true arcball rotate + smooth stop</span>
          <span>Shift/Alt + drag: roll Z</span>
          <span>Wheel: zoom</span>
          <span>Right/Middle drag: pan</span>
          <span>{currentTool === "text" ? "Anchor Note: click a part" : currentTool === "note" ? "Add Note: click anywhere" : currentTool === "moveText" ? "Move Note: drag the box" : "Select mode: click a part"}</span>
        </footer>

        {activeTourStep ? (
          <div className="oleocon-viewer-tour-layer" data-tour-target={activeTourStep.target} role="dialog" aria-modal="true" aria-labelledby="oleocon-viewer-tour-title">
            <div className="oleocon-viewer-tour-backdrop" aria-hidden="true" />
            <article key={activeTourStep.id} className="oleocon-viewer-tour-card" style={activeTourCardStyle}>
              <div className="oleocon-viewer-tour-progress" aria-hidden="true">
                {VIEWER_TOUR_STEPS.map((step, index) => (
                  <span key={step.id} className={index === tourStepIndex ? "is-active" : ""} />
                ))}
              </div>

              <p>{activeTourStep.eyebrow}</p>
              <h2 id="oleocon-viewer-tour-title">{activeTourStep.title}</h2>
              <strong>{activeTourStep.body}</strong>

              <div className="oleocon-viewer-tour-actions">
                <button type="button" onClick={skipViewerTour}>Skip</button>
                <div>
                  <button type="button" onClick={goToPreviousTourStep} disabled={tourStepIndex === 0}>Back</button>
                  <button type="button" className="is-strong" onClick={goToNextTourStep}>
                    {tourStepIndex >= VIEWER_TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </section>
      </main>
    </>
  );
}
