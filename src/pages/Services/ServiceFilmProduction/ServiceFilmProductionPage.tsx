// src/pages/Services/ServiceFilmProduction/ServiceFilmProductionPage.tsx

import { Link } from "react-router-dom";
import "../ServiceDetailShared.css";
import "./ServiceFilmProductionPage.css";

const whatItSolves = [
  {
    title: "Launch clarity",
    copy: "Shape the film around the message, audience, and business moment instead of collecting disconnected shots.",
  },
  {
    title: "Production control",
    copy: "Plan direction, camera language, CGI needs, live-action material, and post-production as one pipeline.",
  },
  {
    title: "Product presence",
    copy: "Make objects, materials, environments, and brand details feel intentional and premium on screen.",
  },
  {
    title: "Campaign delivery",
    copy: "Prepare the right versions for presentations, events, social, ads, and sales material.",
  },
];

const deliverables = [
  {
    title: "Commercial Production",
    copy: "Directed films for products, services, campaigns, events, and brand communication.",
  },
  {
    title: "Product Cinematics",
    copy: "Hero shots, launch sequences, macro details, and controlled product-focused films.",
  },
  {
    title: "Virtual Production",
    copy: "Previsualization, digital environments, LED-ready planning, and production design support.",
  },
  {
    title: "VFX Integration",
    copy: "CGI, cleanup, enhancement, compositing, and invisible post-production support for filmed material.",
  },
  {
    title: "Cinematic Previsualization",
    copy: "Shot planning, camera blocking, timing tests, and visual proof before production starts.",
  },
  {
    title: "Campaign Cutdowns",
    copy: "Short edits, alternate ratios, teaser cuts, and presentation versions derived from one production.",
  },
];

const structure = [
  {
    number: "01",
    title: "Define the film",
    copy: "We clarify the message, tone, audience, and delivery needs before choosing the production approach.",
  },
  {
    number: "02",
    title: "Build the visual plan",
    copy: "We plan the shots, assets, CGI, set needs, camera language, and post-production pipeline.",
  },
  {
    number: "03",
    title: "Deliver usable cuts",
    copy: "The final material is finished as launch films, campaign assets, presentation edits, or social versions.",
  },
];

const galleryItems = [
  "Launch Film",
  "Product Hero Film",
  "Commercial Story",
  "Virtual Set Test",
  "Studio Production",
  "CGI Integration",
  "Macro Product Detail",
  "Campaign Cutdown",
  "Brand Motion Piece",
  "Presentation Film",
];


export default function ServiceFilmProductionPage() {
  return (
    <main className="service-detail-page service-detail-page--violet" aria-label="Premium Production">
      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div>
          <p className="service-detail-kicker">Premium Production</p>
          <h1 id="service-detail-title">Production systems for films, launches, and campaigns.</h1>
          <p className="service-detail-lead">We combine direction, shooting, CGI, visual effects, and controlled production workflows to create polished films that make products, brands, and ideas easier to present.</p>
          <Link className="service-detail-back" to="/services">Back to services</Link>
        </div>

        <div className="service-detail-visualArea" aria-label="Service summary and visual placeholder">
          <img className="service-detail-symbolImage" src="/pages/services/films & procedures.png" alt="Premium production service symbol" />
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
        <h2>Need a film, launch piece, or production workflow that looks controlled from the first frame?</h2>
        <Link to="/contact">Start a project <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
