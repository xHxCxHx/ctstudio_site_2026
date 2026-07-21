// src/pages/Services/ServiceChooser/ServiceChooserPage.tsx

import { Link } from "react-router-dom";
import "./ServiceChooserPage.css";
import SolutionsEmbedded from "./SolutionsEmbedded";

const servicePanels = [
  {
    eyebrow: "01",
    title: ["Industrial", "Visualization"],
    path: "/services/industrial-visualization",
    tone: "red",
  },
  {
    eyebrow: "02",
    title: ["Film &", "Production"],
    path: "/services/film-production",
    tone: "blue",
  },
  {
    eyebrow: "03",
    title: ["Medical", "Visualization"],
    path: "/services/medical-visualization",
    tone: "red",
  },
  {
    eyebrow: "04",
    title: ["Advanced Visual", "Production"],
    path: "/services/advanced-visual-production",
    tone: "blue",
  },
];

const capabilities = [
  { title: "3D Modeling", copy: "High-detail product and hard-surface assets." },
  { title: "Rendering", copy: "Photoreal stills, cinematic frames, and catalog imagery." },
  { title: "Animation", copy: "Product motion, process explanation, and technical storytelling." },
  { title: "Simulation", copy: "Physics-based motion, fluids, particles, and system behavior." },
  { title: "Interactive Systems", copy: "Product viewers, training tools, and real-time experiences." },
  { title: "UI / UX", copy: "Interfaces that make complex products usable and clear." },
  { title: "VFX Integration", copy: "CG, live-action, compositing, and post-production support." },
  { title: "Delivery Assets", copy: "Showreel cuts, presentation files, catalogs, and launch material." },
];

const ctsCoreSection01TopImage = "/pages/services/ServiceChooserPage/CTS%20Core%20Section/01/01.webp";

const ctsCoreSection01FlowImage = "/pages/services/ServiceChooserPage/CTS%20Core%20Section/01/04.webp";


const ctsPositioningLayers = [
  {
    id: "01",
    title: "Strategic Layer",
    copy: "Define the business problem, audience, use case, and decision path before choosing the output.",
  },
  {
    id: "02",
    title: "Structural Layer",
    copy: "Organize the product, technical data, story hierarchy, and required assets into one usable system.",
  },
  {
    id: "03",
    title: "Sequencing Layer",
    copy: "Map what the viewer sees first, what they understand next, and what action the experience should drive.",
  },
  {
    id: "04",
    title: "Layer Breakdown",
    copy: "Separate the system into reusable content layers: 3D, UI, motion, documentation, and delivery states.",
  },
  {
    id: "05",
    title: "Delivery & Activation",
    copy: "Turn the same core system into the right output: web, film, catalog, training, app, VR, AR, or sales tool.",
  },
];


export default function ServiceChooserPage() {
  return (
    <main className="service-chooser-page" aria-label="CTS services">
      <section className="services-intro" aria-labelledby="services-intro-title">
        <div className="services-intro__copy">
          <p className="services-label">CTS Services</p>
          <h1 id="services-intro-title">Visual systems for complex products.</h1>
          <p>
            We help companies explain, sell, and train through 3D, motion, and interactive experiences.
          </p>
        </div>

        <div className="services-intro__mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="services-reel-stack" aria-label="Choose a service">
        {servicePanels.map((service) => (
          <Link
            className={`services-reel services-reel--${service.tone}`}
            to={service.path}
            key={service.title.join(" ")}
            aria-label={`Open ${service.title.join(" ")}`}
          >
            <div className="services-reel__media" aria-hidden="true" />
            <div className="services-reel__content">
              <span className="services-reel__number">{service.eyebrow}</span>
              <h2>
                {service.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
            </div>
          </Link>
        ))}
      </section>

      <section className="services-capabilities" aria-labelledby="services-capabilities-title">
        <div className="services-capabilities__head">
          <p className="services-label">Capabilities</p>
          <h2 id="services-capabilities-title">Disciplines behind the work.</h2>
          <p>
            Not separate services. These are the production layers CTS combines to build a film, catalog, interactive tool, training system, or full visual experience.
          </p>
        </div>

        <div className="services-capabilities__matrix">
          {capabilities.map((capability, index) => (
            <article className="services-capability-cell" key={capability.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <SolutionsEmbedded />

      <section className="services-positioning" aria-labelledby="services-positioning-title">
        <div className="services-positioning__logic" aria-label="What CTS is not">
          <div className="services-positioning__logic-copy">
            <p>CTS is not a website studio.</p>
            <p>CTS is not a rendering studio.</p>
            <p>CTS is not an animation studio.</p>
            <p>CTS is not an application studio.</p>
            <strong>Those are outputs.</strong>
          </div>

          <figure className="services-positioning__logic-visual" aria-hidden="true">
            <img src={ctsCoreSection01TopImage} alt="" loading="lazy" />
          </figure>
        </div>

        <div className="services-positioning__blueprint">

          <div className="services-positioning__copy">
            <p className="services-label">CTS Positioning</p>
            <h2 id="services-positioning-title">
              <span>CTS is a Visual</span>
              <span>Systems Studio.</span>
            </h2>
            <p>
              <span>We solve business and communication problems.</span>
              <span>We promise clarity. The format is secondary.</span>
            </p>
          </div>

          <div className="services-positioning__stage-one" aria-label="CTS Core Section 01 strategic layer">
            <div className="services-positioning__map" aria-hidden="true">
              <div className="services-positioning__map-title">Map stages and flow logic</div>
              <div className="services-positioning__map-grid">
                <span className="services-positioning__node node-a">Problem identified</span>
                <span className="services-positioning__node node-b">Analysis</span>
                <span className="services-positioning__node node-c">Strategy map</span>
                <span className="services-positioning__node node-d">Flow logic design</span>
                <span className="services-positioning__node node-e">Asset mapping</span>
                <span className="services-positioning__node node-f">Solution delivery</span>
              </div>
            </div>
          </div>

          <div className="services-positioning__flow" aria-label="CTS visual system layers">
            <figure className="services-positioning__flow-art" aria-hidden="true">
              <img src={ctsCoreSection01FlowImage} alt="" loading="lazy" />
            </figure>

            <div className="services-positioning__flow-cards">
              {ctsPositioningLayers.map((layer) => (
                <article className="services-positioning__layer" key={layer.id}>
                  <span>{layer.id}</span>
                  <h3>{layer.title}</h3>
                  <p>{layer.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="services-cta" aria-label="Start a project">
        <div>
          <p className="services-label">Start with the business problem</p>
          <h2>Need a sales tool, training system, or product experience?</h2>
        </div>
        <Link to="/contact" className="services-cta__button">
          Start a project
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
