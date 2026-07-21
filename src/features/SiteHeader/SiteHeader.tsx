// src/features/SiteHeader/SiteHeader.tsx

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import "./SiteHeader.css";
import {
  getSiteHeaderConfig,
  SITE_HEADER_LINKS,
  type SiteHeaderBehavior,
  type SiteHeaderLinkKey,
} from "./SiteHeaderConfig";

type SiteHeaderScrollState = {
  isAtTop: boolean;
  isHidden: boolean;
  glassProgress: number;
  showBackToTop: boolean;
};

type SiteHeaderStyle = CSSProperties & {
  "--site-header-glass-progress"?: number;
  "--site-header-liquid-progress"?: number;
  "--site-header-liquid-blur"?: string;
  "--site-header-liquid-saturation"?: string;
  "--site-header-liquid-brightness"?: number;
  "--site-header-liquid-highlight-opacity"?: number;
  "--site-header-liquid-rim-opacity"?: number;
  "--site-header-liquid-distortion-opacity"?: number;
};

const HEADER_HIDE_AFTER_PX = 150; // بعد از این مقدار اسکرول، هدر در حالت autoHide اجازه مخفی شدن دارد
const HOME_HEADER_HIDE_AFTER_PX = 70; // در Home هدر فقط در ابتدای صفحه می‌ماند و بعد نرم خارج می‌شود
const HEADER_GLASS_START_PX = 42; // شروع نرم island/glass برای صفحات غیر Home
const HEADER_GLASS_FULL_PX = 190; // پایان نرم island/glass برای صفحات غیر Home
const BACK_TO_TOP_SHOW_AFTER_PX = 520; // نمایش آیکن برگشت به بالا
const SCROLL_DIRECTION_DEADZONE = 7; // جلوگیری از لرزش هنگام اسکرول ریز

const SITE_HEADER_LIQUID_GLASS = {
  strength: 0.99999, // کنترل اصلی: 0 خاموش، 0.55 ملایم، 1 نرمال، 1.25 قوی‌تر
  distortionScale: 1994, // موج شکست نور؛ اگر متن/لوگو کثیف شد کمترش کن: 18 تا 28
  turbulenceFrequencyX: 0.038, // کشیدگی موج افقی؛ عدد کمتر = موج نرم‌تر
  turbulenceFrequencyY: 0.065, // کشیدگی موج عمودی؛ عدد بیشتر = شکست شیشه‌ای‌تر
  turbulenceBlur: 1.8, // نرم‌کردن نویز SVG؛ عدد زیادتر = اعوجاج تمیزتر
  finalBlur: 0.45, // بلور نهایی روی displacement؛ زیادش نکن چون متن را مرده می‌کند
  cssBlurPx: 28, // blur اصلی پشت island؛ 18 تا 34 بازه امن است
  saturationPercent: 172, // قدرت رنگ داخل glass؛ 140 تا 190 خوب است
  brightness: 1.04, // روشنایی شیشه؛ برای صفحات سفید بالاتر از 1.08 نبر
  highlightOpacity: 0.72, // هایلایت روی لبه‌های glass
  rimOpacity: 0.72, // خط داخلی و حس ضخامت لبه
  distortionOpacity: 0.62, // لایه براق روی glass؛ اگر زیادی پلاستیکی شد کمترش کن
} as const;


const SOLUTIONS_HEADER_CTA = {
  pathPrefix: "/solutions",
  label: "Start a Diagnostic",
  href: "/#contact",
} as const;

function isSolutionsHeaderCtaPath(pathname: string) {
  const normalizedPathname = pathname.toLowerCase();
  const normalizedPrefix = SOLUTIONS_HEADER_CTA.pathPrefix.toLowerCase();

  return (
    normalizedPathname === normalizedPrefix ||
    normalizedPathname.startsWith(`${normalizedPrefix}/`)
  );
}


function isActivePath(pathname: string, href: string) {
  const normalizedPath = pathname.toLowerCase();
  const normalizedHref = href.toLowerCase();

  if (normalizedHref === "/") {
    return normalizedPath === "/";
  }

  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  );
}

function getScrollY() {
  return Math.max(window.scrollY || window.pageYOffset || 0, 0);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getGlassProgress(scrollY: number) {
  return clamp01(
    (scrollY - HEADER_GLASS_START_PX) /
      (HEADER_GLASS_FULL_PX - HEADER_GLASS_START_PX)
  );
}

function getHeaderHiddenState({
  behavior,
  currentScrollY,
  isAtTop,
  isScrollingDown,
  isScrollingUp,
  previousHidden,
}: {
  behavior: SiteHeaderBehavior;
  currentScrollY: number;
  isAtTop: boolean;
  isScrollingDown: boolean;
  isScrollingUp: boolean;
  previousHidden: boolean;
}) {
  if (behavior === "static") {
    return false;
  }

  if (behavior === "topOnly") {
    return currentScrollY > HOME_HEADER_HIDE_AFTER_PX;
  }

  if (isAtTop) {
    return false;
  }

  if (isScrollingDown && currentScrollY > HEADER_HIDE_AFTER_PX) {
    return true;
  }

  if (isScrollingUp) {
    return false;
  }

  return previousHidden;
}

function SiteHeaderLiquidGlassFilter() {
  const liquidStrength = SITE_HEADER_LIQUID_GLASS.strength;

  return (
    <svg
      className="site-header__liquidSvg"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id="site-header-liquid-glass"
          x="-8%"
          y="-32%"
          width="116%"
          height="164%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${SITE_HEADER_LIQUID_GLASS.turbulenceFrequencyX} ${SITE_HEADER_LIQUID_GLASS.turbulenceFrequencyY}`}
            numOctaves="1"
            seed="7"
            result="siteHeaderLiquidTurbulence"
          />

          <feGaussianBlur
            in="siteHeaderLiquidTurbulence"
            stdDeviation={SITE_HEADER_LIQUID_GLASS.turbulenceBlur}
            result="siteHeaderLiquidNoise"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="siteHeaderLiquidNoise"
            scale={SITE_HEADER_LIQUID_GLASS.distortionScale * liquidStrength}
            xChannelSelector="R"
            yChannelSelector="B"
            result="siteHeaderLiquidDisplaced"
          />

          <feGaussianBlur
            in="siteHeaderLiquidDisplaced"
            stdDeviation={SITE_HEADER_LIQUID_GLASS.finalBlur}
            result="siteHeaderLiquidFinal"
          />

          <feComposite
            in="siteHeaderLiquidFinal"
            in2="siteHeaderLiquidFinal"
            operator="over"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default function SiteHeader() {
  const location = useLocation();
  const config = getSiteHeaderConfig(location.pathname);
  const behavior = config.behavior ?? "autoHide";

  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  const [scrollState, setScrollState] = useState<SiteHeaderScrollState>({
    isAtTop: true,
    isHidden: false,
    glassProgress: 0,
    showBackToTop: false,
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    lastScrollYRef.current = getScrollY();

    const updateScrollState = () => {
      tickingRef.current = false;

      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollYRef.current;

      const isScrollingDown = delta > SCROLL_DIRECTION_DEADZONE;
      const isScrollingUp = delta < -SCROLL_DIRECTION_DEADZONE;
      const isAtTop = currentScrollY <= HEADER_GLASS_START_PX;
      const glassProgress = getGlassProgress(currentScrollY);
      const showBackToTop = currentScrollY > BACK_TO_TOP_SHOW_AFTER_PX;

      setScrollState((previousState) => ({
        isAtTop,
        glassProgress,
        showBackToTop,
        isHidden: getHeaderHiddenState({
          behavior,
          currentScrollY,
          isAtTop,
          isScrollingDown,
          isScrollingUp,
          previousHidden: previousState.isHidden,
        }),
      }));

      if (Math.abs(delta) > SCROLL_DIRECTION_DEADZONE) {
        lastScrollYRef.current = currentScrollY;
      }
    };

    const requestScrollUpdate = () => {
      if (tickingRef.current) return;

      tickingRef.current = true;
      window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);

    return () => {
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestScrollUpdate);
    };
  }, [behavior, location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  if (config.hideHeader) {
    return null;
  }

  const links = config.order
    .map((key: SiteHeaderLinkKey) => SITE_HEADER_LINKS[key])
    .filter(Boolean);

  const useSolutionsHeaderCta = isSolutionsHeaderCtaPath(location.pathname);
  const headerCtaLabel = useSolutionsHeaderCta
    ? SOLUTIONS_HEADER_CTA.label
    : config.ctaLabel;
  const headerCtaHref = useSolutionsHeaderCta
    ? SOLUTIONS_HEADER_CTA.href
    : config.ctaHref;

  const rawGlassProgress =
    config.variant === "home" ? 0 : scrollState.glassProgress;

  const liquidProgress = clamp01(
    rawGlassProgress * SITE_HEADER_LIQUID_GLASS.strength
  );

  const headerStyle: SiteHeaderStyle = {
    "--site-header-glass-progress": rawGlassProgress,
    "--site-header-liquid-progress": liquidProgress,
    "--site-header-liquid-blur": `${SITE_HEADER_LIQUID_GLASS.cssBlurPx}px`,
    "--site-header-liquid-saturation": `${SITE_HEADER_LIQUID_GLASS.saturationPercent}%`,
    "--site-header-liquid-brightness": SITE_HEADER_LIQUID_GLASS.brightness,
    "--site-header-liquid-highlight-opacity":
      SITE_HEADER_LIQUID_GLASS.highlightOpacity,
    "--site-header-liquid-rim-opacity": SITE_HEADER_LIQUID_GLASS.rimOpacity,
    "--site-header-liquid-distortion-opacity":
      SITE_HEADER_LIQUID_GLASS.distortionOpacity,
  };

  const headerClassName = [
    "site-header",
    `site-header--${config.variant}`,
    `site-header--behavior-${behavior}`,
    scrollState.isAtTop ? "site-header--at-top" : "site-header--not-top",
    scrollState.isHidden ? "site-header--hidden" : "",
    isMobileMenuOpen ? "site-header--mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const backToTopClassName = [
    "site-back-to-top",
    `site-back-to-top--${config.variant}`,
    config.showBackToTop && scrollState.showBackToTop ? "is-visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const scrollBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <header className={headerClassName} style={headerStyle}>
        <span className="site-header__liquidIsland" aria-hidden="true">
          <span className="site-header__liquidDistortion" aria-hidden="true" />
        </span>

        <Link
          className="site-header__logoLink"
          to="/"
          aria-label="CTS Studio Home"
        >
          <img
            className="site-header__logo"
            src="/cts_brand/cts_logo_black.png"
            alt="CTS Studio"
          />
        </Link>

        <nav className="site-header__nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              className={
                isActivePath(location.pathname, link.href)
                  ? "site-header__navLink is-active"
                  : "site-header__navLink"
              }
              to={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {headerCtaLabel && headerCtaHref ? (
          <Link className="site-header__cta" to={headerCtaHref}>
            {headerCtaLabel}
            <span>↗</span>
          </Link>
        ) : (
          <span className="site-header__ctaPlaceholder" aria-hidden="true" />
        )}

        <button
          className="site-header__mobileToggle"
          type="button"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-header-mobile-menu"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </header>

      <div
        id="site-header-mobile-menu"
        className={
          isMobileMenuOpen
            ? "site-header__mobileOverlay is-open"
            : "site-header__mobileOverlay"
        }
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="site-header__mobileNav" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              className="site-header__mobileNavLink"
              to={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <SiteHeaderLiquidGlassFilter />

      <button
        className={backToTopClassName}
        type="button"
        onClick={scrollBackToTop}
        aria-label="Back to top"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 5.25 5.2 12.05l1.42 1.42 4.38-4.38V20h2V9.09l4.38 4.38 1.42-1.42L12 5.25Z" />
        </svg>
      </button>
    </>
  );
}