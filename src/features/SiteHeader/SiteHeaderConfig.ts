// src/features/SiteHeader/SiteHeaderConfig.ts

export type SiteHeaderLinkKey =
  | "work"
  | "services"
  | "lab"
  | "studio"
  | "contact";

export type SiteHeaderVariant =
  | "home"
  | "light"
  | "dark"
  | "work"
  | "lab"
  | "minimal";

export type SiteHeaderBehavior = "autoHide" | "topOnly" | "static";

export type SiteHeaderPageConfig = {
  variant: SiteHeaderVariant;
  order: SiteHeaderLinkKey[];
  behavior?: SiteHeaderBehavior;
  ctaLabel?: string;
  ctaHref?: string;
  hideHeader?: boolean;
  showBackToTop?: boolean;
};

export const SITE_HEADER_DEFAULT_ORDER: SiteHeaderLinkKey[] = [
  "work",
  "services",
  "lab",
  "studio",
  "contact",
];

export const SITE_HEADER_LINKS: Record<
  SiteHeaderLinkKey,
  {
    label: string;
    href: string;
  }
> = {
  work: {
    label: "Work",
    href: "/work",
  },
  services: {
    label: "Services",
    href: "/services",
  },
  lab: {
    label: "Insights",
    href: "/lab",
  },
  studio: {
    label: "Studio",
    href: "/studio",
  },
  contact: {
    label: "Contact",
    href: "/contact",
  },
};

export const DEFAULT_SITE_HEADER_CONFIG: SiteHeaderPageConfig = {
  variant: "home",
  order: SITE_HEADER_DEFAULT_ORDER,
  behavior: "autoHide",
  ctaLabel: "Start a project",
  ctaHref: "/contact",
  showBackToTop: false,
};

export const SITE_HEADER_PAGE_CONFIG: Record<string, SiteHeaderPageConfig> = {
  "/": {
    variant: "home",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "topOnly",
    ctaLabel: "Start a project",
    ctaHref: "/contact",
    showBackToTop: true,
  },

  "/work": {
    variant: "work",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "autoHide",
    ctaLabel: "Start a project",
    ctaHref: "/contact",
    showBackToTop: false,
  },

  "/work/oleocon/3d": {
    variant: "home",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "static",
    hideHeader: false,
    showBackToTop: false,
  },

  "/work/oleocon": {
    variant: "dark",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "static",
    ctaLabel: "Start a project",
    ctaHref: "/contact",
    hideHeader: true, // این صفحه Header مستقل خودش را دارد؛ SiteHeader عمومی نباید render شود.
    showBackToTop: false,
  },

  "/solutions": {
    variant: "light",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "autoHide",
    ctaLabel: "Start a project",
    ctaHref: "/contact",
    showBackToTop: false,
  },

  "/services": {
    variant: "light",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "autoHide",
    ctaLabel: "Start a project",
    ctaHref: "/contact",
    showBackToTop: false,
  },

  "/lab": {
    variant: "dark",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "autoHide",
    ctaLabel: "Open insights",
    ctaHref: "/lab",
    showBackToTop: false,
  },

  "/studio": {
    variant: "light",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "autoHide",
    ctaLabel: "Start a project",
    ctaHref: "/contact",
    showBackToTop: false,
  },

  "/contact": {
    variant: "dark",
    order: SITE_HEADER_DEFAULT_ORDER,
    behavior: "autoHide",
    ctaLabel: "Contact",
    ctaHref: "/contact",
    showBackToTop: false,
  },
};

export function getSiteHeaderConfig(pathname: string): SiteHeaderPageConfig {
  const normalizedPath = pathname.toLowerCase();

  if (normalizedPath === "/work/oleocon/3d" || normalizedPath.startsWith("/work/oleocon/3d/")) {
    return SITE_HEADER_PAGE_CONFIG["/work/oleocon/3d"];
  }

  const matchingPath = Object.keys(SITE_HEADER_PAGE_CONFIG)
    .sort((a, b) => b.length - a.length)
    .find((path) => {
      if (path === "/") {
        return normalizedPath === "/";
      }

      return normalizedPath === path || normalizedPath.startsWith(`${path}/`);
    });

  if (!matchingPath) {
    return DEFAULT_SITE_HEADER_CONFIG;
  }

  return SITE_HEADER_PAGE_CONFIG[matchingPath];
}
