// src/pages/Lab/LabExperimentRegistry.ts

import type { ComponentType } from "react";

export type LabExperimentComponentProps = {
  experiment: LabExperimentMeta;
};

export type LabExperimentMeta = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  text: string;
  category: string;
  imageUrl: string;
  mode: "inline" | "route";
  loader: () => Promise<{ default: ComponentType<LabExperimentComponentProps> }>;
};

const loadDemoExperiment = () =>
  import("../../labExperiments/Demo/LabDemoExperiment");

const loadSolarSystem = () =>
  import("../../labExperiments/Solar_System").then((module) => ({
    default: module.default as ComponentType<LabExperimentComponentProps>,
  }));

const loadLearningSolar = () =>
  import("../../labExperiments/Learning_Solar").then((module) => ({
    default: module.default as ComponentType<LabExperimentComponentProps>,
  }));

const loadPlanets = () =>
  import("../../labExperiments/Planets").then((module) => ({
    default: module.default as ComponentType<LabExperimentComponentProps>,
  }));

const loadDayAndNight = () =>
  import("../../labExperiments/Day_and_Night").then((module) => ({
    default: module.default as ComponentType<LabExperimentComponentProps>,
  }));

const loadEarthPages = () =>
  import("../../labExperiments/Earth_Pages").then((module) => ({
    default: module.default as ComponentType<LabExperimentComponentProps>,
  }));

export const LAB_EXPERIMENT_BOOKS: LabExperimentMeta[] = [
  {
    id: "solar-system",
    slug: "solar-system",
    title: "Solar System",
    eyebrow: "Force Experiment",
    text: "Interactive solar system gravity experiment.",
    category: "Force Project",
    imageUrl:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop",
    mode: "inline",
    loader: loadSolarSystem,
  },
  {
    id: "learning-solar",
    slug: "learning-solar",
    title: "Learning Solar",
    eyebrow: "Force Experiment",
    text: "Interactive learning mode for planets, orbit labels, visibility toggles, and solar system facts.",
    category: "Force Project",
    imageUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop",
    mode: "inline",
    loader: loadLearningSolar,
  },
  {
    id: "planets",
    slug: "planets",
    title: "Planets",
    eyebrow: "Force Experiment",
    text: "Interactive planet viewer with 3D planets, selectable facts, rotation pause, and planet pictures.",
    category: "Force Project",
    imageUrl:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=2070&auto=format&fit=crop",
    mode: "inline",
    loader: loadPlanets,
  },
  {
    id: "day-and-night",
    slug: "day-and-night",
    title: "Day and Night",
    eyebrow: "Force Experiment",
    text: "Interactive daylight-cycle experiment showing Earth's tilt, seasons, day length, and orbit motion.",
    category: "Force Project",
    imageUrl: "/lab/covers/day-and-night-earth.webp",
    mode: "inline",
    loader: loadDayAndNight,
  },
  {
    id: "earth-pages",
    slug: "earth-pages",
    title: "Earth Pages",
    eyebrow: "Force Experiment",
    text: "Three connected Earth experiments: Earth cut, gravity on planets, and poles/equator explanation.",
    category: "Force Project",
    imageUrl: "/lab/covers/earth-pages.webp",
    mode: "inline",
    loader: loadEarthPages,
  },
  {
    id: "camera-systems",
    slug: "camera-systems",
    title: "Camera Systems",
    eyebrow: "Motion Test",
    text: "Reveal paths, frozen moments, and shot logic before production starts.",
    category: "Lab Prototype",
    imageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1974&auto=format&fit=crop",
    mode: "inline",
    loader: loadDemoExperiment,
  },
  {
    id: "motion-sketches",
    slug: "motion-sketches",
    title: "Motion Sketches",
    eyebrow: "Sequence Study",
    text: "Fast studies for pace, rhythm, transition logic, and visual direction.",
    category: "Lab Prototype",
    imageUrl:
      "https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2070&auto=format&fit=crop",
    mode: "inline",
    loader: loadDemoExperiment,
  },
  {
    id: "interactive-pages",
    slug: "interactive-pages",
    title: "Interactive Pages",
    eyebrow: "Web Prototype",
    text: "Selectors, scroll narratives, product viewers, and usable case systems.",
    category: "Interactive Study",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1974&auto=format&fit=crop",
    mode: "inline",
    loader: loadDemoExperiment,
  },
  {
    id: "realtime-worlds",
    slug: "realtime-worlds",
    title: "Realtime Worlds",
    eyebrow: "Scene Test",
    text: "Spaces where product, story, light, camera, and interface can meet.",
    category: "Realtime Study",
    imageUrl:
      "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2090&auto=format&fit=crop",
    mode: "inline",
    loader: loadDemoExperiment,
  },
  {
    id: "visual-explainers",
    slug: "visual-explainers",
    title: "Visual Explainers",
    eyebrow: "Complex Ideas",
    text: "Mechanisms, invisible systems, and technical stories made readable.",
    category: "Force Project",
    imageUrl:
      "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=2070&auto=format&fit=crop",
    mode: "inline",
    loader: loadDemoExperiment,
  },
];