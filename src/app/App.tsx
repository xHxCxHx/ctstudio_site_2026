// src/app/App.tsx

import { lazy, Suspense, useLayoutEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import SiteHeader from "../features/SiteHeader/SiteHeader";
import Home from "../pages/Home";
import Contact from "../pages/Contact";
import Lab from "../pages/Lab";
import ServiceChooserPage from "../pages/Services/ServiceChooser/ServiceChooserPage";
import ServiceIndustrialVisualizationPage from "../pages/Services/ServiceIndustrialVisualization/ServiceIndustrialVisualizationPage";
import ServiceMedicalVisualizationPage from "../pages/Services/ServiceMedicalVisualization/ServiceMedicalVisualizationPage";
import ServiceFilmProductionPage from "../pages/Services/ServiceFilmProduction/ServiceFilmProductionPage";
import ServiceAdvancedVisualProductionPage from "../pages/Services/ServiceAdvancedVisualProduction/ServiceAdvancedVisualProductionPage";
import Solutions from "../pages/Solutions";
import Studio from "../pages/Studio";
import WorkPage from "../pages/Work/WorkPage";
import OleoconPage from "../pages/Work/Oleocon/OleoconPage";
import GemakSelectionPage from "../pages/Work/Gemak/Selection/GemakSelectionPage";
import PasteuriserPage from "../pages/Work/Gemak/Pasteuriser/PasteuriserPage";
import CIPPage from "../pages/Work/Gemak/CIP/CIPPage";

const Oleocon3DViewerPage = lazy(() => import("../pages/Work/Oleocon/Oleocon3DViewer/Oleocon3DViewerPage"));
const Pasteuriser3DPage = lazy(() => import("../pages/Work/Gemak/Pasteuriser/Pasteuriser3DPage"));
const CIP3DPage = lazy(() => import("../pages/Work/Gemak/CIP/CIP3DPage"));

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const isProjectHeaderPage = pathname.toLowerCase().startsWith("/work/oleocon");

  return (
    <>
      <ScrollToTopOnRouteChange />

      {!isProjectHeaderPage && <SiteHeader />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/work" element={<WorkPage />} />

        <Route path="/work/gemak" element={<GemakSelectionPage />} />
        <Route path="/work/gemak/pasteuriser" element={<PasteuriserPage />} />
        <Route path="/work/gemak/cip" element={<CIPPage />} />
        <Route
          path="/work/gemak/pasteuriser/3d"
          element={
            <Suspense
              fallback={
                <div
                  style={{
                    minHeight: "100svh",
                    display: "grid",
                    placeItems: "center",
                    background: "#07111e",
                    color: "#edf3f8",
                    fontFamily: "var(--cts-font-family, Gotham, Arial, sans-serif)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Loading Pasteuriser viewer
                </div>
              }
            >
              <Pasteuriser3DPage />
            </Suspense>
          }
        />
        <Route
          path="/work/gemak/cip/3d"
          element={
            <Suspense
              fallback={
                <div
                  style={{
                    minHeight: "100svh",
                    display: "grid",
                    placeItems: "center",
                    background: "#07111e",
                    color: "#edf3f8",
                    fontFamily: "var(--cts-font-family, Gotham, Arial, sans-serif)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Loading CIP viewer
                </div>
              }
            >
              <CIP3DPage />
            </Suspense>
          }
        />
        <Route path="/work/oleocon" element={<OleoconPage />} />
        <Route
          path="/work/oleocon/3d"
          element={
            <Suspense
              fallback={
                <div
                  style={{
                    minHeight: "100svh",
                    display: "grid",
                    placeItems: "center",
                    background: "#172e45",
                    color: "#f2f0ea",
                    fontFamily: "var(--cts-font-family, Gotham, Arial, sans-serif)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Loading Oleocon viewer
                </div>
              }
            >
              <Oleocon3DViewerPage />
            </Suspense>
          }
        />

        <Route path="/solutions" element={<Solutions />} />
        <Route path="/services" element={<ServiceChooserPage />} />
        <Route path="/services/industrial-visualization" element={<ServiceIndustrialVisualizationPage />} />
        <Route path="/services/medical-visualization" element={<ServiceMedicalVisualizationPage />} />
        <Route path="/services/film-production" element={<ServiceFilmProductionPage />} />
        <Route path="/services/advanced-visual-production" element={<ServiceAdvancedVisualProductionPage />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </>
  );
}