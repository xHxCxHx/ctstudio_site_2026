// src/pages/Services/ServiceChooser/SolutionsEmbedded.tsx

import { useMemo, useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleGauge,
  Component,
  Eye,
  FileCode2,
  GraduationCap,
  Layers3,
  MessageSquare,
  Network,
  PenTool,
  PlayCircle,
  Rocket,
  Route,
  ShieldCheck,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import "./SolutionsEmbedded.css";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

type ChallengeId =
  | "complex-machine"
  | "technical-process"
  | "training-system"
  | "product-launch"
  | "interactive-sales-tool"
  | "brand-story";

type Challenge = {
  id: ChallengeId;
  number: string;
  title: string;
  short: string;
  problem: string;
  result: string;
  pain: string[];
  method: string[];
  outputs: string[];
  outcomes: string[];
  signal: string;
  accent: string;
  softAccent: string;
  icon: LucideIcon;
};

type MethodStep = {
  title: string;
  text: string;
  icon: LucideIcon;
};

type ProofPoint = {
  title: string;
  text: string;
  icon: LucideIcon;
};

type OutputIcon = {
  icon: LucideIcon;
};

const CHALLENGES: Challenge[] = [
  {
    id: "complex-machine",
    number: "01",
    title: "Complex Machine",
    short:
      "For products whose real value is hidden inside parts, motion, structure, or technical logic.",
    problem:
      "The product is valuable, but buyers, operators, distributors, or stakeholders cannot understand it quickly enough.",
    result:
      "One approved product foundation becomes an interactive experience, explanatory animation, render package, training walkthrough, and sales media.",
    pain: [
      "Too many parts to explain",
      "Hidden function",
      "Long sales conversations",
      "Training takes too long",
    ],
    method: [
      "Discover the communication blockage",
      "Structure the product into visible modules",
      "Visualize hidden motion and function",
      "Activate the right outputs for sales and training",
    ],
    outputs: [
      "Interactive 3D Viewer",
      "Explanatory Machine Animation",
      "Catalog Render Package",
      "Technical Visualization Set",
      "Training Walkthrough",
      "Sales Presentation Media",
    ],
    outcomes: [
      "Faster understanding",
      "Stronger sales conversations",
      "Clearer technical communication",
      "Reusable product asset system",
    ],
    signal: "PARTS / MOTION / FUNCTION",
    accent: "#174fd6",
    softAccent: "#edf3ff",
    icon: Component,
  },
  {
    id: "technical-process",
    number: "02",
    title: "Technical Process",
    short:
      "For flows, transformations, sequences, operations, and cause-effect logic that static images cannot explain.",
    problem:
      "The value happens through timing, flow, state change, or invisible behavior that people cannot easily see.",
    result:
      "The process becomes staged, readable, guided, and reusable across animation, training, documentation, sales, and approval.",
    pain: [
      "Invisible sequence",
      "Unclear timing",
      "Expert explanation required",
      "Scattered diagrams",
    ],
    method: [
      "Find the unclear part of the process",
      "Break it into stages and states",
      "Make hidden cause-effect visible",
      "Package the explanation for the correct audience",
    ],
    outputs: [
      "Process Animation",
      "Technical Motion Visualization",
      "Guided Walkthrough",
      "Process Diagram Set",
      "Training Media Package",
      "Approval Presentation",
    ],
    outcomes: [
      "Visible process logic",
      "Cleaner explanation",
      "Better training consistency",
      "Stronger approval confidence",
    ],
    signal: "FLOW / STATES / SEQUENCE",
    accent: "#0b6b78",
    softAccent: "#edf9fb",
    icon: Workflow,
  },
  {
    id: "training-system",
    number: "03",
    title: "Training System",
    short:
      "For procedures, maintenance tasks, safety sequences, or product knowledge that must be taught repeatedly.",
    problem:
      "Knowledge exists, but it is trapped inside experts, long manuals, scattered documents, or inconsistent explanation.",
    result:
      "The product or procedure becomes a structured visual learning system that helps people understand, repeat, and perform.",
    pain: [
      "Slow onboarding",
      "Repeated mistakes",
      "Manuals nobody uses",
      "No guided practice",
    ],
    method: [
      "Define who must learn and what must be done correctly",
      "Structure the learning path",
      "Visualize the procedure and risk points",
      "Deliver guided media for operators, sales, or service",
    ],
    outputs: [
      "Guided Training Experience",
      "Training Animation",
      "Step-by-Step Workflow",
      "Operator / Service Guide",
      "Assessment Layer",
      "Training Media Package",
    ],
    outcomes: [
      "Clearer onboarding",
      "Repeatable training",
      "Less explanation burden",
      "Better operational confidence",
    ],
    signal: "STEPS / CHECKS / PRACTICE",
    accent: "#4e7a3b",
    softAccent: "#f1f8ee",
    icon: GraduationCap,
  },
  {
    id: "product-launch",
    number: "04",
    title: "Product Launch",
    short:
      "For products that need a premium, consistent, multi-format visual system before entering the market.",
    problem:
      "The product may be strong, but the launch visuals are weak, inconsistent, missing, or not ready for real channels.",
    result:
      "One visual foundation becomes hero CGI, launch film, catalog visuals, social assets, billboard adaptations, and sales media.",
    pain: [
      "No hero visual system",
      "Weak launch story",
      "Inconsistent campaign assets",
      "Sales team underprepared",
    ],
    method: [
      "Clarify the launch goal and audience",
      "Map the product message and asset needs",
      "Build the product visual world",
      "Deliver channel-ready files and reusable rules",
    ],
    outputs: [
      "Product Hero CGI",
      "Launch Film",
      "Campaign Key Visuals",
      "Catalog Render Package",
      "Billboard Adaptations",
      "Sales Launch Deck",
    ],
    outcomes: [
      "Launch readiness",
      "Stronger first impression",
      "Consistent rollout",
      "Better sales preparation",
    ],
    signal: "HERO / CAMPAIGN / ROLLOUT",
    accent: "#c13f32",
    softAccent: "#fff0ee",
    icon: Rocket,
  },
  {
    id: "interactive-sales-tool",
    number: "05",
    title: "Interactive Sales Tool",
    short:
      "For sales teams that need a stronger way to explain, compare, present, and guide buyers through complexity.",
    problem:
      "The sales process depends on static decks, repeated explanation, disconnected PDFs, and buyers who cannot compare fast enough.",
    result:
      "The product becomes an explorable sales experience with comparison views, feature logic, proposal visuals, and follow-up assets.",
    pain: [
      "Static decks",
      "Repeated buyer questions",
      "Variant confusion",
      "Distributor inconsistency",
    ],
    method: [
      "Find where the sales conversation slows down",
      "Structure the product logic and buyer path",
      "Build the visual foundation for explanation",
      "Design the guided sales experience",
    ],
    outputs: [
      "Interactive Product Experience",
      "Guided Sales Flow",
      "Product Comparison System",
      "Proposal Visuals",
      "Sales Training Media",
      "Follow-Up Content Package",
    ],
    outcomes: [
      "Clearer buyer understanding",
      "Stronger presentations",
      "Consistent distributor messaging",
      "Better follow-up",
    ],
    signal: "EXPLORE / COMPARE / PRESENT",
    accent: "#5c55b8",
    softAccent: "#f1f0ff",
    icon: Network,
  },
  {
    id: "brand-story",
    number: "06",
    title: "Brand Story",
    short:
      "For companies whose product or technology is strong but needs clearer meaning and higher perceived value.",
    problem:
      "People may understand the product, but they do not remember it, feel it, trust it enough, or connect it to a stronger story.",
    result:
      "The product, company, or idea gains a visual world that can become film, campaign visuals, social assets, OOH, and presentation media.",
    pain: [
      "Flat perception",
      "Generic visuals",
      "No emotional hook",
      "Weak market presence",
    ],
    method: [
      "Find what the audience should remember",
      "Structure the story around meaning and value",
      "Build the visual world and campaign language",
      "Deliver the story system in usable formats",
    ],
    outputs: [
      "Cinematic CGI",
      "Brand Film",
      "Campaign Key Visuals",
      "Product Hero Imagery",
      "Social Motion Package",
      "Billboard Adaptations",
    ],
    outcomes: [
      "Stronger memorability",
      "Higher perceived value",
      "Campaign consistency",
      "Emotional clarity",
    ],
    signal: "MEMORY / VALUE / STORY",
    accent: "#8a3f69",
    softAccent: "#fff0f7",
    icon: Eye,
  },
];

const METHOD_STEPS: MethodStep[] = [
  {
    title: "Discover",
    text: "Find what blocks understanding.",
    icon: Eye,
  },
  {
    title: "Structure",
    text: "Separate message, audience, and logic.",
    icon: Route,
  },
  {
    title: "Visualize",
    text: "Make hidden value visible.",
    icon: PenTool,
  },
  {
    title: "Activate",
    text: "Turn one foundation into usable outputs.",
    icon: Zap,
  },
];

const OUTPUT_ICONS: OutputIcon[] = [
  { icon: Component },
  { icon: PlayCircle },
  { icon: Boxes },
  { icon: FileCode2 },
  { icon: GraduationCap },
  { icon: MessageSquare },
];

const PROOF_POINTS: ProofPoint[] = [
  {
    title: "Not just pretty",
    text: "Every output connects to a real communication blockage.",
    icon: Target,
  },
  {
    title: "One foundation",
    text: "Assets come from one controlled visual logic, not random deliverables.",
    icon: Layers3,
  },
  {
    title: "Built for use",
    text: "Sales, web, training, approval, launch, and presentation get different outputs from the same system.",
    icon: ShieldCheck,
  },
];

const METRICS = [
  { label: "Understanding speed", value: 85 },
  { label: "Sales clarity", value: 67 },
  { label: "Training efficiency", value: 70 },
  { label: "Communication confidence", value: 90 },
];

function MachineSketch({ active }: { active: Challenge }) {
  const ActiveIcon = active.icon;

  return (
    <div className="solutions-machine-sketch" aria-hidden="true">
      <svg className="solutions-machine-svg" viewBox="0 0 430 300">
        <defs>
          <linearGradient id={`machineBody-${active.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={active.softAccent} />
          </linearGradient>
        </defs>

        <path className="machine-shadow" d="M90 230 C140 270 300 270 350 226 C304 206 144 204 90 230Z" />
        <circle className="machine-ring is-red" cx="180" cy="146" r="74" />
        <circle className="machine-ring" cx="180" cy="146" r="50" />
        <circle className="machine-ring is-heavy" cx="180" cy="146" r="27" />
        <path
          className="machine-body"
          d="M180 76 L278 106 L334 166 L292 218 L178 229 L84 189 L74 119 Z"
          fill={`url(#machineBody-${active.id})`}
        />
        <path className="machine-line" d="M98 127 L179 94 L272 120 L315 168 L283 201 L177 212 L102 180 Z" />
        <path className="machine-line is-blue" d="M180 94 L180 212" />
        <path className="machine-line" d="M98 127 L177 212" />
        <path className="machine-line" d="M272 120 L177 212" />
        <path className="machine-line is-red" d="M118 113 L250 214" />
        <path className="machine-line is-red" d="M78 166 L318 154" />
        <circle className="machine-point" cx="98" cy="127" r="4" />
        <circle className="machine-point" cx="180" cy="94" r="4" />
        <circle className="machine-point" cx="272" cy="120" r="4" />
        <circle className="machine-point is-red" cx="318" cy="154" r="4" />
        <circle className="machine-point" cx="177" cy="212" r="4" />
        <path className="machine-dash" d="M36 66 H128 V116" />
        <path className="machine-dash" d="M392 84 H286 V126" />
        <path className="machine-dash" d="M44 246 H138 V198" />
        <path className="machine-dash" d="M390 245 H288 V204" />
      </svg>

      <div className="solutions-callout callout-a">{active.pain[0]}</div>
      <div className="solutions-callout callout-b">{active.pain[1]}</div>
      <div className="solutions-callout callout-c">{active.pain[2]}</div>
      <div className="solutions-callout callout-d">{active.pain[3]}</div>

      <div className="solutions-question-mark">
        <ActiveIcon size={18} strokeWidth={2.4} />
      </div>
    </div>
  );
}

function SystemOrbit({ active }: { active: Challenge }) {
  const ActiveIcon = active.icon;
  const orbitItems = [
    { label: "Visualize", icon: Eye },
    { label: "Interact", icon: Component },
    { label: "Simulate", icon: Activity },
    { label: "Measure", icon: CircleGauge },
    { label: "Teach", icon: GraduationCap },
    { label: "Deploy", icon: ShieldCheck },
  ];

  return (
    <div className="solutions-system-orbit" aria-label="Recommended visual system">
      <svg className="solutions-orbit-svg" viewBox="0 0 420 420" aria-hidden="true">
        <circle cx="210" cy="210" r="165" />
        <circle cx="210" cy="210" r="118" />
        <path d="M210 42 V378" />
        <path d="M42 210 H378" />
        <path className="orbit-active" d="M96 96 C170 35 284 52 337 132 C382 202 354 304 281 350 C199 401 89 360 55 267 C31 199 46 137 96 96Z" />
      </svg>

      <div className="solutions-orbit-core">
        <div className="solutions-isometric-base">
          <span className="iso-tile tile-a" />
          <span className="iso-tile tile-b" />
          <span className="iso-tile tile-c" />
          <span className="iso-column column-a" />
          <span className="iso-column column-b" />
          <span className="iso-column column-c" />
          <span className="iso-column column-d" />
          <span className="iso-platform" />
        </div>
        <div className="solutions-core-icon">
          <ActiveIcon size={27} strokeWidth={2.2} />
        </div>
      </div>

      {orbitItems.map((item, index) => {
        const ItemIcon = item.icon;
        return (
          <div key={item.label} className={`solutions-orbit-node orbit-node-${index + 1}`}>
            <ItemIcon size={16} strokeWidth={2.3} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DiagnosticBoard({ active }: { active: Challenge }) {
  return (
    <section className="solutions-board" aria-label="Diagnostic and solution map">
      <div className="solutions-board-header">
        <p className="solutions-eyebrow">02 / Diagnostic & solution map</p>
        <div className="solutions-board-route">
          <span>Problem</span>
          <ArrowRight size={14} strokeWidth={2.6} />
          <span>CTS Method</span>
          <ArrowRight size={14} strokeWidth={2.6} />
          <span>Recommended System</span>
          <ArrowRight size={14} strokeWidth={2.6} />
          <span>Business Result</span>
        </div>
      </div>

      <div className="solutions-board-grid">
        <div className="solutions-before-column">
          <div className="solutions-column-title is-problem">Before: complex & unclear</div>
          <MachineSketch active={active} />
          <div className="solutions-before-result">
            Confusion, slow decisions, long explanation time, weak internal alignment.
          </div>
        </div>

        <div className="solutions-method-column">
          <div className="solutions-column-title">CTS Method</div>
          <div className="solutions-method-rail">
            {METHOD_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <article key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <StepIcon size={18} strokeWidth={2.4} />
                  <div>
                    <strong>{step.title}</strong>
                    <p>{active.method[index] ?? step.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="solutions-system-column">
          <div className="solutions-column-title">Recommended solution system</div>
          <SystemOrbit active={active} />
          <div className="solutions-after-result">
            After: clear, interactive, understood, reusable, actionable.
          </div>
        </div>

        <div className="solutions-result-column">
          <div className="solutions-column-title is-result">Business result</div>
          <div className="solutions-result-list">
            {active.outcomes.map((item) => (
              <article key={item}>
                <CheckCircle2 size={18} strokeWidth={2.4} />
                <span>{item}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OutputPanel({ active }: { active: Challenge }) {
  return (
    <aside className="solutions-output-panel" aria-label="Recommended outputs and results">
      <div className="solutions-panel-status">
        <span>Diagnostic engine</span>
        <strong>Online</strong>
      </div>

      <section className="solutions-panel-card">
        <p className="solutions-panel-kicker">Your recommended outputs</p>
        <div className="solutions-output-list">
          {active.outputs.map((output, index) => {
            const OutputIcon = OUTPUT_ICONS[index % OUTPUT_ICONS.length].icon;
            return (
              <article key={output}>
                <span className="solutions-output-icon">
                  <OutputIcon size={18} strokeWidth={2.3} />
                </span>
                <div>
                  <strong>{output}</strong>
                  <p>{index < 2 ? "Primary clarity asset" : "Support asset"}</p>
                </div>
                <span className="solutions-plus">+</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="solutions-panel-card">
        <p className="solutions-panel-kicker">Business results</p>
        <div className="solutions-metrics">
          {METRICS.map((metric, index) => (
            <article key={metric.label}>
              <div>
                <span>{metric.label}</span>
                <strong>+{metric.value}%</strong>
              </div>
              <em style={{ "--metric-value": `${metric.value}%` } as CSSVars} />
            </article>
          ))}
        </div>
      </section>

      <p className="solutions-panel-note">
        Results vary by project scope and implementation. The point is to build the
        right visual system for the problem, not decorate the problem.
      </p>
    </aside>
  );
}

export default function SolutionsEmbedded() {
  const [activeId, setActiveId] = useState<ChallengeId>("complex-machine");

  const active = useMemo(
    () => CHALLENGES.find((item) => item.id === activeId) ?? CHALLENGES[0],
    [activeId],
  );

  return (
    <main
      className="solutions-page"
      style={
        {
          "--solution-accent": active.accent,
          "--solution-soft": active.softAccent,
        } as CSSVars
      }
    >
      <section className="solutions-hero" aria-labelledby="solutions-title">
        <div className="solutions-hero-copy">
          <p className="solutions-eyebrow">01 / Select the core challenge</p>
          <h1 id="solutions-title">
            What are you
            <br />
            trying to make clear?</h1>
          <p>
            CTS turns complex products, technical ideas, training needs, launch
            stories, and sales problems into visual systems people understand and act on.
          </p>
        </div>

        <div className="solutions-hero-signal" aria-hidden="true">
          <span />
          <span />
          <span />
          <strong>{active.signal}</strong>
        </div>
      </section>

      <section className="solutions-diagnostic-shell">
        <aside className="solutions-selector" aria-label="Solution challenge selector">
          <div className="solutions-selector-title">
            <p className="solutions-eyebrow">Select the core challenge</p>
            <h2>Choose the problem, not the service.</h2>
          </div>

          <div className="solutions-tabs">
            {CHALLENGES.map((item) => {
              const ItemIcon = item.icon;
              const isActive = item.id === active.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={isActive ? "solutions-tab is-active" : "solutions-tab"}
                  style={
                    {
                      "--tab-accent": item.accent,
                      "--tab-soft": item.softAccent,
                    } as CSSVars
                  }
                  onClick={() => setActiveId(item.id)}
                  aria-pressed={isActive}
                >
                  <span className="solutions-tab-icon">
                    <ItemIcon size={24} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <strong>{item.title}</strong>
                  <ArrowRight className="solutions-tab-arrow" size={16} strokeWidth={2.6} />
                </button>
              );
            })}
          </div>

          <div className="solutions-current-selection">
            <span>Current selection</span>
            <strong>{active.title}</strong>
          </div>
        </aside>

        <DiagnosticBoard active={active} />
        <OutputPanel active={active} />
      </section>

      <section className="solutions-proof-strip" aria-label="Proof points">
        <p>
          <strong>Proof points</strong>
          <span>Not just pretty</span>
        </p>
        {PROOF_POINTS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <article key={item.title}>
              <ItemIcon size={22} strokeWidth={2.1} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="solutions-final-cta">
        <div>
          <p className="solutions-eyebrow">03 / Build the right visual language</p>
          <h2>Ready to turn complexity into clarity?</h2>
          <p>
            Bring the product, process, training problem, launch challenge, or sales
            conversation that is hard to explain. CTS maps the problem first, then
            builds the visual system that makes it clear.
          </p>
        </div>

        <a href="/contact">
          Build your solution
          <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}
