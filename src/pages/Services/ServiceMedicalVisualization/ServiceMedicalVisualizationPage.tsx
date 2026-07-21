// src/pages/Services/ServiceMedicalVisualization/ServiceMedicalVisualizationPage.tsx

import { Link } from "react-router-dom";
import "../ServiceDetailShared.css";
import "./ServiceMedicalVisualizationPage.css";

const whatItSolves = [
  {
    title: "Device explanation",
    copy: "Show how a medical device works, what makes it different, and how it is used in context.",
  },
  {
    title: "Procedure clarity",
    copy: "Turn procedural steps and treatment logic into visual sequences that are easier to follow.",
  },
  {
    title: "Training support",
    copy: "Help teams, practitioners, or patients understand technical information without unnecessary complexity.",
  },
  {
    title: "Scientific trust",
    copy: "Create visuals that feel careful, precise, and appropriate for healthcare communication.",
  },
];

const deliverables = [
  {
    title: "Medical Device Visualization",
    copy: "Product visuals, mechanism explanations, usage scenarios, and technical presentation material.",
  },
  {
    title: "Procedure Animation",
    copy: "Step-by-step visual sequences for treatment logic, operation flow, and educational use.",
  },
  {
    title: "Anatomical Visualization",
    copy: "Clear anatomical views, simplified structures, tissue layers, and context-specific visual explanations.",
  },
  {
    title: "Healthcare Training Content",
    copy: "Training visuals for teams, patients, operators, or sales representatives.",
  },
  {
    title: "Patient Education Visuals",
    copy: "Calm and understandable visuals that explain treatment, device use, or medical concepts.",
  },
  {
    title: "Presentation Assets",
    copy: "Rendered visuals, diagrams, short films, and support material for meetings or launches.",
  },
];

const structure = [
  {
    number: "01",
    title: "Understand the subject",
    copy: "We define the device, procedure, audience, and level of medical detail that should be shown.",
  },
  {
    number: "02",
    title: "Simplify without damaging",
    copy: "We remove visual noise while keeping the information accurate, clear, and trustworthy.",
  },
  {
    number: "03",
    title: "Deliver for context",
    copy: "The output becomes training content, product presentation, education material, or campaign support.",
  },
];

const galleryItems = [
  "Device Mechanism",
  "Procedure Sequence",
  "Anatomy Detail",
  "Patient Education",
  "Treatment Flow",
  "Healthcare Training",
  "Product Presentation",
  "Clinical Explainer",
  "Medical Diagram",
  "Scientific Motion",
];


export default function ServiceMedicalVisualizationPage() {
  return (
    <main className="service-detail-page service-detail-page--orange" aria-label="Medical Visualization">
      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div>
          <p className="service-detail-kicker">Medical Visualization</p>
          <h1 id="service-detail-title">Medical visualization for devices, procedures, and education.</h1>
          <p className="service-detail-lead">We turn medical products, anatomy, treatment logic, and healthcare processes into clear visuals for training, sales, education, and patient communication.</p>
          <Link className="service-detail-back" to="/services">Back to services</Link>
        </div>

        <div className="service-detail-visualArea" aria-label="Service summary and visual placeholder">
          <img className="service-detail-symbolImage" src="/pages/services/medical visualisation.png" alt="Medical visualization service symbol" />
          <aside className="service-detail-side">
            {whatItSolves.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="service-detail-section" aria-labelledby="deliverables-title">
        <div className="service-detail-section__head">
          <p className="service-detail-kicker">What we build</p>
          <h2 id="deliverables-title">Output types inside this service.</h2>
          <p>These are the usable formats clients receive from this service. The work is planned around the audience, the message, and the final place where the visuals will be used.</p>
        </div>

        <div className="service-detail-table">
          {deliverables.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="service-detail-section" aria-labelledby="structure-title">
        <div className="service-detail-section__head">
          <p className="service-detail-kicker">How it is organized</p>
          <h2 id="structure-title">From problem to usable visual system.</h2>
          <p>The work starts with the communication problem, not with a software list. The goal is to choose the right visual format for the client’s product, audience, and use case.</p>
        </div>

        <div className="service-detail-related">
          {structure.map((item) => (
            <article key={item.title}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="service-detail-gallerySection" aria-labelledby="gallery-title">
        <div className="service-detail-galleryHead">
          <p className="service-detail-kicker">Gallery</p>
          <h2 id="gallery-title">Relevant visual references</h2>
        </div>

        <div className="service-detail-gallery">
          {galleryItems.map((title, index) => (
            <article key={title} className={`service-detail-gallery__item service-detail-gallery__item--${(index % 10) + 1}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="service-detail-cta" aria-label="Discuss this service">
        <h2>Have a device, procedure, or treatment concept that needs to be understood clearly?</h2>
        <Link to="/contact">Start a project <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
