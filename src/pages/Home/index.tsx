// src/pages/Home/index.tsx

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./home.css";

type ServiceItem = {
  title: string;
  body: string;
  accent: "blue" | "red";
};

type WorkItem = {
  index: string;
  title: string;
  type: string;
  media: string;
  mediaType: "image" | "video";
};

type FeaturedSlide = {
  title: string;
  subtitle: string;
  media: string;
  mediaType: "image" | "video";
  body: string;
  points: string[];
  tag: string;
};

type TextControl = {
  size?: string;
  x?: string;
  y?: string;
};

const TEXT_CONTROLS = {
  // راهنمای سریع:
  // size: "0px" یعنی سایز فعلی. "+4px" بزرگ‌تر. "-4px" کوچک‌تر.
  // x: "0px" یعنی جای فعلی. "24px" حرکت به راست. "-24px" حرکت به چپ.
  // y: "0px" یعنی جای فعلی. "18px" حرکت به پایین. "-18px" حرکت به بالا.
  heroTitle: { size: "-10px", x: "0px", y: "0px" },
  heroBody: { size: "0px", x: "0px", y: "0px" },
  heroPills: { size: "0px", x: "0px", y: "0px" },

  featuredLabel: { size: "0px", x: "0px", y: "0px" },
  featuredCounter: { size: "0px", x: "0px", y: "0px" },
  featuredTitle: { size: "0px", x: "0px", y: "0px" },
  featuredBody: { size: "0px", x: "0px", y: "0px" },
  featuredPoint: { size: "0px", x: "0px", y: "0px" },
  featuredTag: { size: "0px", x: "0px", y: "0px" },

  servicesLabel: { size: "0px", x: "0px", y: "0px" },
  servicesTitle: { size: "0px", x: "0px", y: "0px" },
  servicesBody: { size: "0px", x: "0px", y: "0px" },
  serviceCardTitle: { size: "0px", x: "0px", y: "0px" },
  serviceCardBody: { size: "0px", x: "0px", y: "0px" },

  trustLogo: { size: "0px", x: "0px", y: "0px" },
  trustStatNumber: { size: "0px", x: "0px", y: "0px" },
  trustStatLabel: { size: "0px", x: "0px", y: "0px" },

  workLabel: { size: "0px", x: "0px", y: "0px" },
  workTitle: { size: "0px", x: "0px", y: "0px" },
  workCardIndex: { size: "0px", x: "0px", y: "0px" },
  workCardTitle: { size: "0px", x: "0px", y: "0px" },
  workCardType: { size: "0px", x: "0px", y: "0px" },

  finalLabel: { size: "0px", x: "0px", y: "0px" },
  finalTitle: { size: "0px", x: "0px", y: "0px" },
} satisfies Record<string, TextControl>;

const FEATURED_SLIDES: FeaturedSlide[] = [
  {
    title: "CIP Interactive",
    subtitle: "Industrial Process Experience",
    media: "/cts_media/cip_interactive_poster.png",
    mediaType: "image",
    body: "A real-time interactive product experience built for technical sales, industrial presentation and product explanation. The goal is to turn a complex process into something clients can understand fast: flow, function, system logic and value, all presented with a controlled premium visual language.",
    points: [
      "Interactive process visualization for sales meetings, exhibitions and product demos.",
      "Clear technical storytelling for industrial clients and decision-makers.",
      "Built to make complex engineering systems easier to present, explain and sell.",
    ],
    tag: "Real-time • Industrial UX",
  },
  {
    title: "Production",
    subtitle: "Cinematic Production Visual",
    media: "/cts_media/production.mp4",
    mediaType: "video",
    body: "A cinematic production-focused visual piece designed to show how a product, industrial system or branded environment can be presented with stronger motion, lighting, pacing and atmosphere. This kind of work is useful when the client needs a sharper premium impression rather than a flat technical explanation.",
    points: [
      "Cinematic video presentation for product launches, sales decks and brand campaigns.",
      "Useful for showing scale, material, lighting, motion and visual quality in one controlled piece.",
      "Built to support premium perception before the client enters deeper interactive or technical content.",
    ],
    tag: "Production • Cinematic",
  },
  {
    title: "Socor Billboard",
    subtitle: "Field Advertising Visualization",
    media: "/cts_media/socor_billboard.png",
    mediaType: "image",
    body: "A field advertising and outdoor campaign visualization designed to show how a brand message will actually live in the real world. Instead of selling an idea through a flat mockup, this type of visual places the campaign into believable public space, making scale, context and impact easier to judge.",
    points: [
      "Outdoor campaign mockups for billboards, public spaces and location-based advertising.",
      "Useful for pitching brand visibility, market presence and field campaign concepts.",
      "Designed to help clients see the final advertising impact before production.",
    ],
    tag: "Field Advertising • Outdoor",
  },
];

const SERVICES: ServiceItem[] = [
  {
    title: "Interactive Product Systems",
    body: "Real-time product experiences that let clients explore machines, products and technical systems instead of just watching a static render.",
    accent: "blue",
  },
  {
    title: "Industrial Visualization",
    body: "Premium visuals for factories, machines, pipelines and process-heavy products where clarity and credibility matter.",
    accent: "red",
  },
  {
    title: "3D Motion & Explainers",
    body: "Cinematic product animation, simulation-style shots and visual explanations built to sell complex ideas faster.",
    accent: "blue",
  },
  {
    title: "Field Advertising Visuals",
    body: "Campaign mockups, billboard visuals and real-world advertising previews that show how the brand message looks in context.",
    accent: "red",
  },
];

const WORKS: WorkItem[] = [
  {
    index: "01 / 04",
    title: "Oleocon",
    type: "Interactive Product Experience",
    media: "/cts_media/oleocon_interactiv_poster.png",
    mediaType: "image",
  },
  {
    index: "02 / 04",
    title: "Cayirova",
    type: "Interactive Industrial System",
    media: "/cts_media/cayirova_interactiv_poster.png",
    mediaType: "image",
  },
  {
    index: "03 / 04",
    title: "Mugen Pro",
    type: "Real-Time Motion Experience",
    media: "/cts_media/mugen_pro_loop.mp4",
    mediaType: "video",
  },
];

function delayStyle(ms: number): CSSProperties {
  return {
    "--delay": `${ms}ms`,
  } as CSSProperties;
}

function textControlStyle(control: TextControl): CSSProperties {
  return {
    "--text-size-add": control.size ?? "0px",
    "--text-x": control.x ?? "0px",
    "--text-y": control.y ?? "0px",
  } as CSSProperties;
}

function formatCounter(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} — ${String(total).padStart(
    2,
    "0"
  )}`;
}

function RollText({ children }: { children: string }) {
  return (
    <span className="cts-rollText" data-roll-text={children}>
      <span>{children}</span>
    </span>
  );
}

export default function Home() {
  const pageRef = useRef<HTMLElement | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const activeFeatured = FEATURED_SLIDES[featuredIndex];

  const showPreviousFeatured = () => {
    setFeaturedIndex((current) =>
      current === 0 ? FEATURED_SLIDES.length - 1 : current - 1
    );
  };

  const showNextFeatured = () => {
    setFeaturedIndex((current) =>
      current === FEATURED_SLIDES.length - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const handlePointerMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;

      const mx = (x - 0.5) * 2;
      const my = (y - 0.5) * 2;

      page.style.setProperty("--mx", mx.toFixed(4));
      page.style.setProperty("--my", my.toFixed(4));
      page.style.setProperty("--mxp", `${(x * 100).toFixed(2)}%`);
      page.style.setProperty("--myp", `${(y * 100).toFixed(2)}%`);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );

    let lastScrollY = Math.max(window.scrollY, 0);
    let scrollDirection: "down" | "up" = "down";
    let ticking = false;

    const setHiddenDirection = (item: HTMLElement, y: string) => {
      item.style.setProperty("--reveal-y", y);
    };

    const showItem = (item: HTMLElement, fromY: string) => {
      setHiddenDirection(item, fromY);
      item.style.setProperty("--reveal-delay", "var(--delay, 0ms)");

      requestAnimationFrame(() => {
        item.classList.add("is-visible");
      });
    };

    const hideItem = (item: HTMLElement, toY: string) => {
      item.style.setProperty("--reveal-delay", "0ms");
      setHiddenDirection(item, toY);

      requestAnimationFrame(() => {
        item.classList.remove("is-visible");
      });
    };

    const updateReveal = () => {
      ticking = false;

      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) > 1) {
        scrollDirection = delta > 0 ? "down" : "up";
        lastScrollY = currentScrollY;
      }

      const viewportHeight = window.innerHeight || 1;

      const downEnterLine = viewportHeight * 0.86;
      const downExitLine = viewportHeight * 0.08;

      const upEnterLine = viewportHeight * 0.18;
      const upExitStartLine = viewportHeight * 0.62;

      revealItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const isVisible = item.classList.contains("is-visible");

        if (scrollDirection === "down") {
          const shouldShow =
            rect.top < downEnterLine && rect.bottom > downExitLine;

          const shouldHide = rect.bottom < downExitLine;

          if (!isVisible && shouldShow) {
            showItem(item, "58px");
            return;
          }

          if (isVisible && shouldHide) {
            hideItem(item, "-58px");
            return;
          }
        }

        if (scrollDirection === "up") {
          const shouldShow =
            rect.bottom > upEnterLine && rect.top < upExitStartLine;

          const shouldHide = rect.top > upExitStartLine;

          if (!isVisible && shouldShow) {
            showItem(item, "-58px");
            return;
          }

          if (isVisible && shouldHide) {
            hideItem(item, "58px");
          }
        }
      });
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(updateReveal);
    };

    revealItems.forEach((item) => {
      item.style.setProperty("--reveal-y", "58px");
      item.style.setProperty("--reveal-delay", "var(--delay, 0ms)");
    });

    updateReveal();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <main ref={pageRef} className="cts-home">
      <div className="cts-pageNoise" aria-hidden="true" />

      <section className="cts-hero">
        <video
          className="cts-heroVideoBlurLeft"
          src="/cts_media/hero_loop.mp4"
          poster="/cts_media/hero_poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />

        <video
          className="cts-heroVideo"
          src="/cts_media/hero_loop.mp4"
          poster="/cts_media/hero_poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="CTS cinematic visual systems showreel loop"
        />

        <div className="cts-heroVideoShade" aria-hidden="true" />
        <div className="cts-heroMouseReflection" aria-hidden="true" />

        <div className="cts-heroContent">
          <div className="cts-heroGlassPanel">
            <div className="cts-heroGlassInner" data-reveal style={delayStyle(100)}>
              <h1
                className="cts-textControl"
                style={textControlStyle(TEXT_CONTROLS.heroTitle)}
              >
                <span className="cts-heroTitleWhite">Premium</span> <br />
                <strong>Visual Systems</strong> <br />
                <span className="cts-heroTitleWhite">for bold</span> <em>Brands</em>
              </h1>

              <p
                className="cts-heroText cts-textControl"
                style={textControlStyle(TEXT_CONTROLS.heroBody)}
              >
                We design and build cinematic, interactive, real-time experiences
                that move brands forward.
              </p>

              <div className="cts-heroUiBlock">
                <div className="cts-heroActions">
                  <a className="cts-button cts-buttonDark" href="/work">
                    <RollText>View our work</RollText>
                    <span className="cts-arrow cts-arrowOnDark" aria-hidden="true">↗</span>
                  </a>

                  <a className="cts-button cts-buttonGhost" href="/contact">
                    <RollText>Start a project</RollText>
                    <span className="cts-arrow cts-arrowOnLight" aria-hidden="true">↗</span>
                  </a>
                </div>

                <div
                  className="cts-pillRow cts-textControl"
                  style={textControlStyle(TEXT_CONTROLS.heroPills)}
                >
                  <span>
                    <i className="dot blue" />
                    Cinematic
                  </span>
                  <span>
                    <i className="dot white" />
                    Interactive
                  </span>
                  <span>
                    <i className="dot red" />
                    Real-time
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cts-featured" data-reveal>
        <div className="cts-featuredLeft">
          <div className="cts-featuredHeader">
            <p
              className="cts-smallLabel cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.featuredLabel)}
            >
              Featured work
            </p>

            <div className="cts-featuredMiniControls" aria-label="Featured slider controls">
              <button
                type="button"
                className="cts-sliderButton cts-arrowButton"
                onClick={showPreviousFeatured}
                aria-label="Previous featured project"
              >
                ←
              </button>

              <button
                type="button"
                className="cts-sliderButton cts-arrowButton"
                onClick={showNextFeatured}
                aria-label="Next featured project"
              >
                →
              </button>
            </div>
          </div>

          <article className="cts-featuredCard" key={activeFeatured.title}>
            <div className="cts-featuredMedia">
              {activeFeatured.mediaType === "video" ? (
                <video
                  className="cts-featuredVisual"
                  src={activeFeatured.media}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${activeFeatured.title} featured preview`}
                />
              ) : (
                <img
                  className="cts-featuredVisual"
                  src={activeFeatured.media}
                  alt={`${activeFeatured.title} featured project preview`}
                  draggable={false}
                />
              )}
            </div>
          </article>
        </div>

        <aside className="cts-featuredNote">
          <p
            className="cts-featuredCounter cts-textControl"
            style={textControlStyle(TEXT_CONTROLS.featuredCounter)}
          >
            {formatCounter(featuredIndex, FEATURED_SLIDES.length)}
          </p>

          <div className="cts-featuredTextBlock" key={`${activeFeatured.title}-text`}>
            <h3
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.featuredTitle)}
            >
              {activeFeatured.subtitle}
            </h3>
            <p
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.featuredBody)}
            >
              {activeFeatured.body}
            </p>

            <ul>
              {activeFeatured.points.map((point) => (
                <li
                  className="cts-textControl"
                  key={point}
                  style={textControlStyle(TEXT_CONTROLS.featuredPoint)}
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="cts-featuredBottom">
            <span
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.featuredTag)}
            >
              {activeFeatured.tag}
            </span>

            <div className="cts-featuredDots" aria-label="Featured slide dots">
              {FEATURED_SLIDES.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={
                    index === featuredIndex
                      ? "cts-featuredDot is-active"
                      : "cts-featuredDot"
                  }
                  onClick={() => setFeaturedIndex(index)}
                  aria-label={`Go to ${slide.title}`}
                />
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="cts-services" id="services">
        <div className="cts-sectionIntro" data-reveal>
          <p
            className="cts-smallLabel cts-textControl"
            style={textControlStyle(TEXT_CONTROLS.servicesLabel)}
          >
            Services
          </p>
          <h2
            className="cts-textControl"
            style={textControlStyle(TEXT_CONTROLS.servicesTitle)}
          >
            Systems that make complex products easy to sell.
          </h2>

          <p
            className="cts-sectionText cts-textControl"
            style={textControlStyle(TEXT_CONTROLS.servicesBody)}
          >
            We build the kind of visual systems that help technical companies
            explain products, prove value and sell faster: interactive demos,
            industrial visuals, product films, campaign mockups and digital
            presentation tools.
          </p>
        </div>

        <div className="cts-serviceGrid">
          {SERVICES.map((item, index) => (
            <article
              className="cts-serviceCard"
              key={item.title}
              data-reveal
              style={delayStyle(index * 110)}
            >
              <div className={`cts-serviceIcon ${item.accent}`} />
              <h3
                className="cts-textControl"
                style={textControlStyle(TEXT_CONTROLS.serviceCardTitle)}
              >
                {item.title}
              </h3>
              <p
                className="cts-textControl"
                style={textControlStyle(TEXT_CONTROLS.serviceCardBody)}
              >
                {item.body}
              </p>
              <a href="/services">
                Explore <span className="cts-arrow cts-arrowOnLight">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="cts-trust" data-reveal>
        <div className="cts-logoStrip">
          {["Obsidian", "Nexora", "Lumen", "Pivot", "Veridian", "Strata"].map(
            (logoName) => (
              <span
                className="cts-textControl"
                key={logoName}
                style={textControlStyle(TEXT_CONTROLS.trustLogo)}
              >
                {logoName}
              </span>
            )
          )}
        </div>

        <div className="cts-stats">
          <span>
            <strong
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.trustStatNumber)}
            >
              120+
            </strong>
            <em
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.trustStatLabel)}
            >
              Projects delivered
            </em>
          </span>
          <span>
            <strong
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.trustStatNumber)}
            >
              85+
            </strong>
            <em
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.trustStatLabel)}
            >
              Global clients
            </em>
          </span>
          <span>
            <strong
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.trustStatNumber)}
            >
              12+
            </strong>
            <em
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.trustStatLabel)}
            >
              Years of experience
            </em>
          </span>
        </div>
      </section>

      <section className="cts-work">
        <div className="cts-workTop" data-reveal>
          <div>
            <p
              className="cts-smallLabel cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.workLabel)}
            >
              Precision in motion
            </p>
            <h2
              className="cts-textControl"
              style={textControlStyle(TEXT_CONTROLS.workTitle)}
            >
              Systems that sell the idea.
            </h2>
          </div>

          <a href="/work">
            View all work <span className="cts-arrow cts-arrowOnLight">→</span>
          </a>
        </div>

        <div className="cts-workGrid">
          {WORKS.map((work, index) => (
            <article
              className="cts-workCard"
              key={work.title}
              data-reveal
              style={delayStyle(index * 140)}
            >
              <div className="cts-workImage">
                {work.mediaType === "video" ? (
                  <video
                    className="cts-workVisual"
                    src={work.media}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={`${work.title} preview loop`}
                  />
                ) : (
                  <img
                    className="cts-workVisual"
                    src={work.media}
                    alt={`${work.title} project preview`}
                    loading="lazy"
                    draggable={false}
                  />
                )}
              </div>

              <div className="cts-workContent">
                <span
                  className="cts-textControl"
                  style={textControlStyle(TEXT_CONTROLS.workCardIndex)}
                >
                  {work.index}
                </span>
                <h3
                  className="cts-textControl"
                  style={textControlStyle(TEXT_CONTROLS.workCardTitle)}
                >
                  {work.title}
                </h3>
                <p
                  className="cts-textControl"
                  style={textControlStyle(TEXT_CONTROLS.workCardType)}
                >
                  {work.type}
                </p>
                <a href="/work">
                  View project <span className="cts-arrow cts-arrowOnLight">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cts-finalCta" data-reveal>
        <div>
          <p
            className="cts-smallLabel cts-textControl"
            style={textControlStyle(TEXT_CONTROLS.finalLabel)}
          >
            Let’s create something bold
          </p>
          <h2
            className="cts-textControl"
            style={textControlStyle(TEXT_CONTROLS.finalTitle)}
          >
            Have a vision that needs to look exceptional?
          </h2>
        </div>

        <a className="cts-button cts-buttonDark" href="/contact">
          Start a project
          <span className="cts-arrow cts-arrowOnDark">↗</span>
        </a>
      </section>
    </main>
  );
}