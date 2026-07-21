// src/pages/Work/Oleocon/OleoconHeader.tsx

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import "./OleoconHeader.css";

type OleoconHeaderStyle = CSSProperties & {
  "--oleocon-header-accent"?: string;
  "--oleocon-header-line"?: string;
  "--oleocon-header-text"?: string;
  "--oleocon-header-muted"?: string;
  "--oleocon-header-glow-a"?: string;
  "--oleocon-header-glow-b"?: string;
};

const OLEOCON_HEADER_SCROLL_THRESHOLD = 34;
const OLEOCON_HEADER_HIDE_AFTER_PX = 120;
const OLEOCON_SCROLL_DIRECTION_DEADZONE = 2;

const OLEOCON_HEADER_THEME = {
  accent: "#76b900",
  line: "rgba(242, 240, 234, 0.92)",
  text: "var(--cts-white, var(--cts-near-white, #f2f0ea))",
  mutedText: "rgba(242, 240, 234, 0.76)",
  glowA: "rgba(118, 185, 0, 0.52)",
  glowB: "rgba(118, 185, 0, 0.14)",
  ctaHref: "/contact",
  ctaLabel: "Start a project",
} as const;

const OLEOCON_HEADER_NAV_ITEMS = [
  { key: "work", label: "Work", href: "/work" },
  { key: "services", label: "Services", href: "/services" },
  { key: "insights", label: "Insights", href: "/lab" },
  { key: "studio", label: "Studio", href: "/studio" },
  { key: "contact", label: "Contact", href: "/contact" },
] as const;

function getScrollY() {
  return Math.max(window.scrollY || window.pageYOffset || 0, 0);
}

function isExactActive(pathname: string, href: string) {
  const cleanPathname = pathname.toLowerCase();
  const cleanHref = href.toLowerCase();

  if (cleanHref === "/") return cleanPathname === "/";

  return cleanPathname === cleanHref;
}

export default function OleoconHeader() {
  const location = useLocation();
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    lastScrollYRef.current = getScrollY();

    const updateScrollState = () => {
      tickingRef.current = false;

      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollYRef.current;
      const isScrollingDown = delta > OLEOCON_SCROLL_DIRECTION_DEADZONE;
      const isScrollingUp = delta < -OLEOCON_SCROLL_DIRECTION_DEADZONE;

      setIsScrolled(currentScrollY > OLEOCON_HEADER_SCROLL_THRESHOLD);

      setIsHidden((previousHidden) => {
        if (isMobileMenuOpen) return false;
        if (currentScrollY <= OLEOCON_HEADER_SCROLL_THRESHOLD) return false;
        if (isScrollingDown && currentScrollY > OLEOCON_HEADER_HIDE_AFTER_PX) return true;
        if (isScrollingUp) return false;
        return previousHidden;
      });

      if (Math.abs(delta) > OLEOCON_SCROLL_DIRECTION_DEADZONE) {
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
  }, [isMobileMenuOpen]);

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

  const style: OleoconHeaderStyle = {
    "--oleocon-header-accent": OLEOCON_HEADER_THEME.accent,
    "--oleocon-header-line": OLEOCON_HEADER_THEME.line,
    "--oleocon-header-text": OLEOCON_HEADER_THEME.text,
    "--oleocon-header-muted": OLEOCON_HEADER_THEME.mutedText,
    "--oleocon-header-glow-a": OLEOCON_HEADER_THEME.glowA,
    "--oleocon-header-glow-b": OLEOCON_HEADER_THEME.glowB,
  };

  const headerClassName = [
    "oleocon-header",
    isScrolled ? "oleocon-header--scrolled" : "",
    isHidden ? "oleocon-header--hidden" : "",
    isMobileMenuOpen ? "oleocon-header--mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header className={headerClassName} style={style}>
        <Link className="oleocon-header__logoLink" to="/" aria-label="CTS Studio Home">
          <img
            className="oleocon-header__logo"
            src="/cts_brand/cts_logo_black.png"
            alt="CTS Studio"
          />
        </Link>

        <nav className="oleocon-header__nav" aria-label="Oleocon navigation">
          {OLEOCON_HEADER_NAV_ITEMS.map((item) => {
            const isActive = isExactActive(location.pathname, item.href);

            return (
              <Link
                key={item.key}
                className={
                  isActive
                    ? "oleocon-header__navLink is-active"
                    : "oleocon-header__navLink"
                }
                to={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link className="oleocon-header__cta" to={OLEOCON_HEADER_THEME.ctaHref}>
          {OLEOCON_HEADER_THEME.ctaLabel}
          <span>↗</span>
        </Link>

        <button
          className="oleocon-header__mobileToggle"
          type="button"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="oleocon-header-mobile-menu"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </header>

      <div
        id="oleocon-header-mobile-menu"
        className={
          isMobileMenuOpen
            ? "oleocon-header__mobileOverlay is-open"
            : "oleocon-header__mobileOverlay"
        }
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="oleocon-header__mobileNav" aria-label="Mobile navigation">
          {OLEOCON_HEADER_NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              className="oleocon-header__mobileNavLink"
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
