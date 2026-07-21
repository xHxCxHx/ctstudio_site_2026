// src/pages/Services/ServiceAdvancedVisualProduction/ServiceAdvancedVisualProductionPage.tsx

import { Link } from "react-router-dom";
import "../ServiceDetailShared.css";
import "./ServiceAdvancedVisualProductionPage.css";

const whatItSolves = [
  {
    title: "Impossible visuals",
    copy: "Create shots, scenes, or concepts that are too difficult, risky, or expensive to film normally.",
  },
  {
    title: "Hybrid workflows",
    copy: "Combine generated material, CGI, live action, and post-production into one controlled visual pipeline.",
  },
  {
    title: "Concept speed",
    copy: "Explore directions quickly before committing to a final production or campaign approach.",
  },
  {
    title: "Visual enhancement",
    copy: "Improve, extend, or rebuild footage when the original material cannot carry the message alone.",
  },
];

const deliverables = [
  {
    title: "Hybrid CGI / Live Action",
    copy: "Integrated digital elements, environments, objects, and visual layers for filmed or synthetic material.",
  },
  {
    title: "AI-Assisted Video Workflows",
    copy: "Generated footage, concept exploration, shot development, and production support with human art direction.",
  },
  {
    title: "Visual Effects Enhancement",
    copy: "Cleanup, extension, replacement, reconstruction, and enhancement for footage-based projects.",
  },
  {
    title: "Synthetic Product Shots",
    copy: "Controlled product moments, abstract visuals, and scenes that support campaigns or presentations.",
  },
  {
    title: "Concept Development",
    copy: "Fast visual routes for testing mood, material, motion, scale, and campaign direction.",
  },
  {
    title: "Post-Production Systems",
    copy: "Compositing, grading support, motion graphics, format adaptation, and final delivery assets.",
  },
];

const structure = [
  {
    number: "01",
    title: "Define the limitation",
    copy: "We identify what cannot be filmed, what is too costly, or what needs visual invention.",
  },
  {
    number: "02",
    title: "Design the hybrid method",
    copy: "We choose the balance between CGI, generated footage, live action, and post-production.",
  },
  {
    number: "03",
    title: "Finish as a usable asset",
    copy: "The result becomes a campaign visual, product shot, VFX sequence, presentation asset, or concept film.",
  },
];

const galleryItems = [
  "Synthetic Product Shot",
  "Hybrid CGI Shot",
  "AI-Assisted Concept",
  "Visual Effects Pass",
  "Abstract Product Film",
  "Generated Environment",
  "Footage Reconstruction",
  "Motion Experiment",
  "Campaign Visual",
  "Impossible Shot",
];


export default function ServiceAdvancedVisualProductionPage() {
  return (
    <main className="service-detail-page service-detail-page--cyan" aria-label="Advanced Visual Production">
      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div>
          <p className="service-detail-kicker">Advanced Visual Production</p>
          <h1 id="service-detail-title">Hybrid visual production for difficult ideas and impossible shots.</h1>
          <p className="service-detail-lead">We combine CGI, generated footage, compositing, motion design, and post-production to create visuals that would be difficult, expensive, or impossible to capture traditionally.</p>
          <Link className="service-detail-back" to="/services">Back to services</Link>
        </div>

        <div className="service-detail-visualArea" aria-label="Service summary and visual placeholder">
          <img className="service-detail-symbolImage" src="/pages/services/advanced visualisation production.png" alt="Advanced visual production service symbol" />
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
        <h2>Need a hybrid visual workflow for an idea that cannot be captured the normal way?</h2>
        <Link to="/contact">Start a project <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
