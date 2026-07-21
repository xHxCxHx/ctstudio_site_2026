// src/pages/Lab/LabExperimentViewer.tsx

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { LabExperimentMeta } from "./LabExperimentRegistry";

type LabExperimentViewerProps = {
  experiment: LabExperimentMeta | null;
  onClose: () => void;
};

const CLOSE_REVEAL_DISTANCE_PX = 150;
const CLOSE_FADE_DELAY_MS = 1500;

export function LabExperimentViewer({ experiment, onClose }: LabExperimentViewerProps) {
  const [isCloseVisible, setIsCloseVisible] = useState(false);
  const closeFadeTimerRef = useRef<number | null>(null);

  const LazyExperiment = useMemo(() => {
    if (!experiment) return null;
    return lazy(experiment.loader);
  }, [experiment]);

  useEffect(() => {
    if (!experiment) return;

    const showCloseTemporarily = () => {
      setIsCloseVisible(true);

      if (closeFadeTimerRef.current !== null) {
        window.clearTimeout(closeFadeTimerRef.current);
      }

      closeFadeTimerRef.current = window.setTimeout(() => {
        setIsCloseVisible(false);
        closeFadeTimerRef.current = null;
      }, CLOSE_FADE_DELAY_MS);
    };

    const handlePointerMove = (event: PointerEvent) => {
      // دکمه خروج عمداً بالا چپ است و فقط وقتی موس نزدیک همان گوشه شود ظاهر می‌شود.
      if (event.clientX <= CLOSE_REVEAL_DISTANCE_PX && event.clientY <= CLOSE_REVEAL_DISTANCE_PX) {
        showCloseTemporarily();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (closeFadeTimerRef.current !== null) {
        window.clearTimeout(closeFadeTimerRef.current);
        closeFadeTimerRef.current = null;
      }
      setIsCloseVisible(false);
    };
  }, [experiment]);

  useEffect(() => {
    if (!experiment) return;

    const scrollY = window.scrollY;
    const root = document.getElementById("root");
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousRootOverflow = root?.style.overflow ?? "";

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (root) root.style.overflow = "hidden";

    body.classList.add("ctsExperimentOpen");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const blockPageScroll = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", blockPageScroll, { passive: false });
    window.addEventListener("touchmove", blockPageScroll, { passive: false });

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      if (root) root.style.overflow = previousRootOverflow;
      body.classList.remove("ctsExperimentOpen");

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", blockPageScroll);
      window.removeEventListener("touchmove", blockPageScroll);
      window.scrollTo(0, scrollY);
    };
  }, [experiment, onClose]);

  if (!experiment || !LazyExperiment) return null;

  return (
    <section
      className="ctsLabExperimentViewer ctsLabExperimentViewerFullscreen"
      aria-label="Experiment viewer"
      role="dialog"
      aria-modal="true"
    >
      <button
        className={`ctsLabExperimentViewerClose${isCloseVisible ? " isVisible" : ""}`}
        type="button"
        onClick={onClose}
        onPointerEnter={() => setIsCloseVisible(true)}
        aria-label="Close experiment"
        title="Close"
      >
        ×
      </button>

      <div className="ctsLabExperimentViewerStage">
        <Suspense
          fallback={
            <div className="ctsLabExperimentLoading">
              <span>Loading experiment</span>
            </div>
          }
        >
          <LazyExperiment experiment={experiment} />
        </Suspense>
      </div>
    </section>
  );
}
