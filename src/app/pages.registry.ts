// src/app/pages.registry.ts

import React, { lazy } from "react";

export type PageMode = "story" | "heavy";

export type PageEntry = {
  key: string;          // کلید یکتا
  title: string;        // عنوان برای منو
  path: string;         // مسیر
  mode: PageMode;       // سبک/سنگین
  enabled: boolean;     // خاموش/روشن بدون حذف
  Component: React.LazyExoticComponent<React.ComponentType<any>>;
};

const Home = lazy(() => import("../pages/Home"));
const Services = lazy(() => import("../pages/Services"));
const Lab = lazy(() => import("../pages/Lab"));

/**
 * ✅ فقط همین آرایه را دستکاری کن:
 * - reorder = جابه‌جایی سطرها
 * - add = یک entry جدید
 * - remove = حذف entry
 * - disable = enabled:false
 */
export const PAGES: PageEntry[] = [
  { key: "home", title: "Home", path: "/", mode: "story", enabled: true, Component: Home },
  { key: "services", title: "Services", path: "/services", mode: "story", enabled: true, Component: Services },
  { key: "lab", title: "3D Lab", path: "/lab", mode: "heavy", enabled: true, Component: Lab },
];
