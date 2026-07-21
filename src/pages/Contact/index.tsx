// src/pages/Contact/index.tsx

import type { CSSProperties } from "react";
import "./contact.css";

type TextSpec = {
  id: string;
  label: string;
  sample: string;
  size: string;
  weight: string;
  line: string;
  tracking: string;
  transform: "uppercase" | "none";
  tone: "dark" | "muted";
  width?: string;
};

type BoxSpec = {
  id: string;
  label: string;
  size: string;
  weight: string;
  line: string;
  tracking: string;
  height: string;
  padX: string;
  padY: string;
};

type ColorSpec = {
  id: string;
  label: string;
  role: string;
  value: string;
  sample: string;
  bg: string;
  text: string;
  border: string;
};

const TEXT_SPECS: TextSpec[] = [
  {
    id: "hero",
    label: "Hero title",
    sample: "Premium visual systems",
    size: "clamp(54px, min(6.4vw, 10.8svh), 128px)",
    weight: "900",
    line: "0.9",
    tracking: "-0.04em",
    transform: "uppercase",
    tone: "dark",
    width: "900px",
  },
  {
    id: "section",
    label: "Section title",
    sample: "Approve these values",
    size: "clamp(32px, 3.8vw, 74px)",
    weight: "900",
    line: "0.98",
    tracking: "-0.04em",
    transform: "uppercase",
    tone: "dark",
    width: "760px",
  },
  {
    id: "card-title",
    label: "Card title",
    sample: "Interactive product system",
    size: "clamp(20px, 2vw, 40px)",
    weight: "700",
    line: "1",
    tracking: "-0.02em",
    transform: "uppercase",
    tone: "dark",
    width: "560px",
  },
  {
    id: "body",
    label: "Body text",
    sample:
      "We turn technical products and industrial processes into clear real-time visual systems for sales, presentation and product explanation.",
    size: "clamp(15px, min(1.12vw, 2.2svh), 25px)",
    weight: "400",
    line: "1.42",
    tracking: "-0.00em",
    transform: "none",
    tone: "muted",
    width: "640px",
  },
  {
    id: "label",
    label: "Label / tag",
    sample: "REAL-TIME • INDUSTRIAL UX",
    size: "clamp(10px, 0.72vw, 17px)",
    weight: "700",
    line: "1",
    tracking: "0.08em",
    transform: "uppercase",
    tone: "dark",
    width: "fit-content",
  },
  {
    id: "button",
    label: "Button text",
    sample: "START A PROJECT",
    size: "clamp(10px, 0.72vw, 15px)",
    weight: "700",
    line: "1",
    tracking: "0.07em",
    transform: "uppercase",
    tone: "dark",
    width: "fit-content",
  },
];

const HOME_ACTION_SPEC: BoxSpec = {
  id: "home-actions",
  label: "Home action boxes",
  size: "clamp(10px, 0.72vw, 12px)",
  weight: "700",
  line: "1",
  tracking: "0.07em",
  height: "clamp(40px, 5.4svh, 48px)",
  padX: "clamp(18px, 1.65vw, 22px)",
  padY: "clamp(10px, 1.5svh, 14px)",
};

const HOME_RAIL_SPEC: BoxSpec = {
  id: "home-rail",
  label: "Home rail",
  size: "clamp(14px, min(1.12vw, 2.2svh), 22px)",
  weight: "400",
  line: "1",
  tracking: "-0.035em",
  height: "auto",
  padX: "clamp(10px, 1vw, 14px)",
  padY: "clamp(6px, 1.1svh, 8px)",
};

const COLOR_SPECS: ColorSpec[] = [
  {
    id: "page-bg",
    label: "Page background",
    role: "--cts-bg / --cts-alabaster",
    value: "#F2F0EA",
    sample: "Near-white background",
    bg: "#F2F0EA",
    text: "#172e45",
    border: "rgba(33, 36, 39, 0.14)",
  },
  {
    id: "page-bg-end",
    label: "Background depth",
    role: "Contact background end",
    value: "#E8E7E3",
    sample: "Soft warm depth",
    bg: "#E8E7E3",
    text: "#172e45",
    border: "rgba(33, 36, 39, 0.14)",
  },
  {
    id: "main-text",
    label: "Main text",
    role: "--cts-black / --cts-text",
    value: "#172E45",
    sample: "Main readable text",
    bg: "#F2F0EA",
    text: "#172e45",
    border: "rgba(33, 36, 39, 0.14)",
  },
  {
    id: "muted-text",
    label: "Muted text",
    role: "--cts-muted",
    value: "rgba(11, 15, 19, 0.66)",
    sample: "Secondary paragraph text",
    bg: "#F2F0EA",
    text: "rgba(11, 15, 19, 0.66)",
    border: "rgba(33, 36, 39, 0.14)",
  },
  {
    id: "line",
    label: "Line / border",
    role: "--cts-line",
    value: "rgba(33, 36, 39, 0.14)",
    sample: "Subtle industrial border",
    bg: "#F2F0EA",
    text: "#172e45",
    border: "rgba(33, 36, 39, 0.14)",
  },
  {
    id: "line-strong",
    label: "Strong line",
    role: "--cts-line-strong",
    value: "rgba(33, 36, 39, 0.28)",
    sample: "Action box border",
    bg: "#F2F0EA",
    text: "#172e45",
    border: "rgba(33, 36, 39, 0.28)",
  },
  {
    id: "dark-action",
    label: "Dark action",
    role: "Dark box background",
    value: "#172E45 / #F2F0EA",
    sample: "EMAIL THE STUDIO",
    bg: "#172e45",
    text: "#F2F0EA",
    border: "#172e45",
  },
  {
    id: "light-action",
    label: "Light action",
    role: "Light box background",
    value: "rgba(242, 240, 234, 0.34)",
    sample: "VIEW OUR WORK",
    bg: "rgba(242, 240, 234, 0.34)",
    text: "#172e45",
    border: "rgba(33, 36, 39, 0.28)",
  },
  {
    id: "accent-blue",
    label: "Accent blue",
    role: "--cts-blue",
    value: "#0d1d5f",
    sample: "Blue system accent",
    bg: "#0d1d5f",
    text: "#F2F0EA",
    border: "#0d1d5f",
  },
  {
    id: "accent-red",
    label: "Accent red",
    role: "--cts-red",
    value: "#cd2028",
    sample: "Red system accent",
    bg: "#cd2028",
    text: "#F2F0EA",
    border: "#cd2028",
  },
];

function RollText({ children }: { children: string }) {
  return (
    <span className="contact-rollText" data-roll-text={children}>
      <span>{children}</span>
    </span>
  );
}

function TextMeta({ spec }: { spec: TextSpec }) {
  return (
    <aside className="contact-meta">
      <strong>{spec.label}</strong>
      <span>size: {spec.size}</span>
      <span>weight: {spec.weight}</span>
      <span>line: {spec.line}</span>
      <span>tracking: {spec.tracking}</span>
    </aside>
  );
}

function BoxMeta({ spec }: { spec: BoxSpec }) {
  return (
    <aside className="contact-meta">
      <strong>{spec.label}</strong>
      <span>text size: {spec.size}</span>
      <span>weight: {spec.weight}</span>
      <span>line: {spec.line}</span>
      <span>tracking: {spec.tracking}</span>
      <span>height: {spec.height}</span>
      <span>
        padding: {spec.padY} / {spec.padX}
      </span>
    </aside>
  );
}

function ColorMeta({ spec }: { spec: ColorSpec }) {
  return (
    <aside className="contact-meta">
      <strong>{spec.label}</strong>
      <span>role: {spec.role}</span>
      <span>value: {spec.value}</span>
    </aside>
  );
}

function TextSample({ spec }: { spec: TextSpec }) {
  return (
    <p
      className={`contact-liveText contact-liveText--${spec.tone}`}
      style={
        {
          "--live-size": spec.size,
          "--live-weight": spec.weight,
          "--live-line": spec.line,
          "--live-tracking": spec.tracking,
          "--live-transform": spec.transform,
          "--live-width": spec.width ?? "900px",
        } as CSSProperties
      }
    >
      {spec.sample}
    </p>
  );
}

function HomeActions() {
  return (
    <div
      className="contact-homeActions"
      style={
        {
          "--box-text-size": HOME_ACTION_SPEC.size,
          "--box-weight": HOME_ACTION_SPEC.weight,
          "--box-line": HOME_ACTION_SPEC.line,
          "--box-tracking": HOME_ACTION_SPEC.tracking,
          "--box-height": HOME_ACTION_SPEC.height,
          "--box-pad-x": HOME_ACTION_SPEC.padX,
          "--box-pad-y": HOME_ACTION_SPEC.padY,
        } as CSSProperties
      }
    >
      <a className="contact-action contact-actionDark" href="mailto:hello@thectstudio.com">
        <RollText>EMAIL THE STUDIO</RollText>
        <span className="contact-actionArrow" aria-hidden="true">
          ↗
        </span>
      </a>

      <a className="contact-action contact-actionLight" href="/work">
        <RollText>VIEW OUR WORK</RollText>
        <span className="contact-actionArrow" aria-hidden="true">
          ↗
        </span>
      </a>
    </div>
  );
}

function HomeRail() {
  return (
    <div
      className="contact-homeRail"
      style={
        {
          "--rail-text-size": HOME_RAIL_SPEC.size,
          "--rail-weight": HOME_RAIL_SPEC.weight,
          "--rail-line": HOME_RAIL_SPEC.line,
          "--rail-tracking": HOME_RAIL_SPEC.tracking,
          "--rail-pad-x": HOME_RAIL_SPEC.padX,
          "--rail-pad-y": HOME_RAIL_SPEC.padY,
        } as CSSProperties
      }
    >
      <span>
        <i className="contact-dot contact-dotBlue" /> Cinematic
      </span>
      <span>
        <i className="contact-dot contact-dotBlue" /> Interactive
      </span>
      <span>
        <i className="contact-dot contact-dotRed" /> Real-time
      </span>
    </div>
  );
}

function ColorSample({ spec }: { spec: ColorSpec }) {
  return (
    <div
      className="contact-colorSample"
      style={
        {
          "--color-bg": spec.bg,
          "--color-text": spec.text,
          "--color-border": spec.border,
        } as CSSProperties
      }
    >
      <span>{spec.sample}</span>
      <code>{spec.value}</code>
    </div>
  );
}

export default function Contact() {
  return (
    <main className="contact-page">
      <section className="contact-pageHead">
        <p className="contact-kicker">CTS CONTACT / SYSTEM TEST</p>
        <p>
          Change the numbers in this file.
          {"\n"}Manual line breaks work with \n inside text strings.
          {"\n"}Each row below shows the real result from the exact same values.
        </p>
      </section>

      <section className="contact-approvalList" aria-label="CTS system approval list">
        {TEXT_SPECS.map((spec) => (
          <article className="contact-row" key={spec.id}>
            <TextMeta spec={spec} />
            <div className="contact-liveArea">
              <TextSample spec={spec} />
            </div>
          </article>
        ))}

        <article className="contact-row">
          <BoxMeta spec={HOME_ACTION_SPEC} />
          <div className="contact-liveArea contact-liveArea--box">
            <HomeActions />
          </div>
        </article>

        <article className="contact-row">
          <BoxMeta spec={HOME_RAIL_SPEC} />
          <div className="contact-liveArea contact-liveArea--box">
            <HomeRail />
          </div>
        </article>

        {COLOR_SPECS.map((spec) => (
          <article className="contact-row" key={spec.id}>
            <ColorMeta spec={spec} />
            <div className="contact-liveArea contact-liveArea--color">
              <ColorSample spec={spec} />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
