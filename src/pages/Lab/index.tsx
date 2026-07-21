// src/pages/Lab/index.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import "./Lab.css";
import { LabBookRail } from "./LabBookRail";
import { LabExperimentViewer } from "./LabExperimentViewer";
import { LAB_EXPERIMENT_BOOKS } from "./LabExperimentRegistry";

const VIDEO_SRC = "/cts_brand/OfficeChoase.mp4";
const VIDEO_POSTER = "/cts_brand/ctsEntery.png";
const LAB_HEADER_CTA = "Have a project to test?";

const LAB_EXPERIMENTS = [
  {
    id: "01",
    title: "Visual Systems",
    text: "Turning one asset into a repeatable language for pages, campaigns, films, pitch decks, and product launches.",
  },
  {
    id: "02",
    title: "Camera Logic",
    text: "Testing reveals, transitions, pace, and movement so the viewer understands before they lose attention.",
  },
  {
    id: "03",
    title: "Interactive Studies",
    text: "Prototypes for scroll, selection, comparison, isolation, and product exploration when passive media is not enough.",
  },
  {
    id: "04",
    title: "Motion Experiments",
    text: "Controlled tests for timing, frozen moments, loops, simulated behavior, and image sequences that need direction.",
  },
  {
    id: "05",
    title: "Technical Storytelling",
    text: "Finding clearer ways to show mechanisms, invisible processes, industrial ideas, and things that usually stay abstract.",
  },
  {
    id: "06",
    title: "Production Methods",
    text: "Internal tests for performance, asset handling, rendering decisions, and workflows that reduce risk later.",
  },
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getExperimentByVirtualIndex(virtualIndex: number) {
  const total = LAB_EXPERIMENT_BOOKS.length;
  const realIndex = ((virtualIndex % total) + total) % total;
  return LAB_EXPERIMENT_BOOKS[realIndex] ?? LAB_EXPERIMENT_BOOKS[0];
}

function ScrollScrubVideo({
  endRef,
  onProgress,
}: {
  endRef: RefObject<HTMLDivElement | null>;
  onProgress?: (value: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  const syncVideo = useCallback(() => {
    rafRef.current = null;

    const video = videoRef.current;
    const end = endRef.current;

    if (!video || !end) return;
    if (!video.duration || !Number.isFinite(video.duration)) return;
    if (video.seeking) return;

    const endRect = end.getBoundingClientRect();
    const endTop = window.scrollY + endRect.top;
    const scrollEnd = Math.max(1, endTop - window.innerHeight * 0.2);
    const progress = clamp01(window.scrollY / scrollEnd);
    const nextTime = progress * video.duration;

    if (Math.abs(video.currentTime - nextTime) > 0.025) {
      video.currentTime = nextTime;
    }

    onProgress?.(progress);
  }, [endRef, onProgress]);

  const requestSync = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(syncVideo);
  }, [syncVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleReady = () => {
      video.pause();
      setReady(true);
      requestSync();
    };

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("canplaythrough", handleReady);
    video.addEventListener("seeked", requestSync);

    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("canplaythrough", handleReady);
      video.removeEventListener("seeked", requestSync);
    };
  }, [requestSync]);

  useEffect(() => {
    if (!ready) return;

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    requestSync();

    return () => {
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [ready, requestSync]);

  return (
    <>
      <div className="ctsLabVideoLayer" aria-hidden="true">
        <video
          ref={videoRef}
          className="ctsLabVideo"
          src={VIDEO_SRC}
          poster={VIDEO_POSTER}
          muted
          playsInline
          preload="auto"
        />
      </div>

      {!ready && (
        <div className="ctsLabLoader">
          <div>
            <span>LOADING CTSTUDIO LAB</span>
            <i />
          </div>
        </div>
      )}
    </>
  );
}

function LabGallerySection() {
  // خانه‌ی فعال در شروع روی آیتم دوم است تا حس layering نمونه‌ای که خواستی حفظ شود.
  const [activeVirtualIndex, setActiveVirtualIndex] = useState(1);
  const [openedExperimentId, setOpenedExperimentId] = useState<string | null>(null);

  const activeExperiment = getExperimentByVirtualIndex(activeVirtualIndex);
  const openedExperiment = openedExperimentId
    ? LAB_EXPERIMENT_BOOKS.find((item) => item.id === openedExperimentId) ?? null
    : null;

  const openActiveExperiment = () => {
    setOpenedExperimentId(activeExperiment.id);
  };

  const goBackToStart = () => {
    setActiveVirtualIndex(0);
    setOpenedExperimentId(null);
  };

  return (
    <section className="ctsLabGallery" aria-label="CTSTUDIO Lab gallery">
      <div className="ctsLabGalleryLayout">
        <div className="ctsLabGalleryCopy">
          <p>LAB CONTENT / PLAYGROUND</p>
          <h2>
            Play With What We
            <br />
            Made
          </h2>
          <span>
            Go ahead and play with some of the things we made for testing, exploring, and breaking ideas open.
            <br />
            Maybe one of them is exactly what your project needs.
          </span>
          <div className="ctsLabGalleryActions" aria-label="Lab gallery controls">
            <button type="button" onClick={openActiveExperiment}>
              Experiment
            </button>
            <button type="button" onClick={goBackToStart}>
              Start Again
            </button>
          </div>
        </div>

        <LabBookRail
          items={LAB_EXPERIMENT_BOOKS}
          activeVirtualIndex={activeVirtualIndex}
          onActiveVirtualIndexChange={setActiveVirtualIndex}
          onOpenExperiment={openActiveExperiment}
        />
      </div>

      <LabExperimentViewer
        experiment={openedExperiment}
        onClose={() => setOpenedExperimentId(null)}
      />
    </section>
  );
}

export default function Lab() {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.classList.add("ctsLabPageActive");
    document.body.setAttribute("data-cts-page", "lab");
    document.body.setAttribute("data-cts-header-cta", LAB_HEADER_CTA);

    return () => {
      document.body.classList.remove("ctsLabPageActive");
      document.body.removeAttribute("data-cts-page");
      document.body.removeAttribute("data-cts-header-cta");
    };
  }, []);

  return (
    <main className="ctsLabPage">
      <ScrollScrubVideo endRef={endRef} />

      <section className="ctsLabSection ctsLabHero">
        <div className="ctsLabHeroLayout">
          <div className="ctsLabHeroTitle">
            <p>CTSTUDIO / LAB</p>
            <h1>
              Ahead
              <br />
              of the
              <br />
              brief.
            </h1>
          </div>

          <div className="ctsLabHeroCopy">
            <p>
              Lab is where we practice the next version of our work before a client
              needs it. We build proof systems for shots, pages, product stories,
              motion, environments, and interaction — not to show the process, but to
              turn uncertain possibilities into useful methods.
            </p>
            <a href="#lab-output">See what we test</a>
          </div>
        </div>
      </section>

      <section className="ctsLabSection ctsLabStatement">
        <div>
          <p>WHY THIS EXISTS</p>
          <h2>We test what a project could become before the market asks for it.</h2>
        </div>
      </section>

      <section className="ctsLabSection ctsLabCopy ctsLabCopyLeft">
        <article>
          <span>01 / BEYOND DELIVERY</span>
          <h2>A brief tells us what is needed. Lab asks what else could become possible.</h2>
          <p>
            Some projects start as a film, a page, an explainer, or a launch asset. In Lab
            we study the camera, timing, interface, environment, and story as one connected
            system. The goal is not more decoration. The goal is a smarter way to make the
            idea understood, remembered, and sold.
          </p>
        </article>
      </section>

      <section className="ctsLabSection ctsLabCopy ctsLabCopyRight">
        <article>
          <span>02 / TEST BEFORE TRUST</span>
          <h2>Good ideas are not protected by enthusiasm. They are protected by testing.</h2>
          <p>
            The shot, the scroll, the camera, and the interface get tested first. Before a
            concept becomes a case study, a campaign, a product page, or a sales tool, we test
            its timing, motion, technical pressure, readability, and visual hierarchy here.
            Weak ideas get simplified or killed early. Useful ones earn their place.
          </p>
        </article>
      </section>

      <section className="ctsLabSection ctsLabCopy ctsLabCopyLeft">
        <article>
          <span>03 / FUTURE PROBLEMS</span>
          <h2>We build solutions for problems that are not obvious yet.</h2>
          <p>
            We create challenges on purpose: a product that must explain itself, a story that
            needs to move through space, a technical process that cannot be understood from
            one image, or a campaign that needs a tool instead of another asset. This is not
            extra work for its own sake. It is how we learn what will matter next.
          </p>
        </article>
      </section>

      <section id="lab-output" className="ctsLabSection ctsLabOutput">
        <div className="ctsLabOutputHeading">
          <p>LAB PRACTICE AREAS</p>
          <h2>Questions we keep pressure-testing before they turn into client systems.</h2>
        </div>

        <div className="ctsLabOutputGrid">
          {LAB_EXPERIMENTS.map((item) => (
            <article className="ctsLabOutputCard" key={item.id}>
              <span>{item.id}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div ref={endRef} className="ctsLabEnd">
        <div className="ctsLabEndCard">
          <p>CTSTUDIO / OPEN PRACTICE</p>
          <h2>Bring the problem before it becomes urgent.</h2>
          <span>
            Come with something that is hard to show, hard to explain, or still half-formed.
            Lab is where that uncertainty becomes a visual route: a prototype, a camera system,
            an interaction plan, a motion study, or a production method. Not every test becomes
            a project. The useful ones become the reason the project feels ahead of its brief.
          </span>
        </div>
      </div>

      <LabGallerySection />
    </main>
  );
}
