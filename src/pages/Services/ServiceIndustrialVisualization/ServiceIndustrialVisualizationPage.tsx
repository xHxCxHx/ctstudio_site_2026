// src/pages/Services/ServiceIndustrialVisualization/ServiceIndustrialVisualizationPage.tsx

import { Link } from "react-router-dom";
import "../ServiceDetailShared.css";
import "./ServiceIndustrialVisualizationPage.css";

const whatItSolves = [
  {
    title: "Product communication",
    copy: "Explain what a machine does, how it works, and why it matters without relying on long PDFs or static slides.",
  },
  {
    title: "Sales support",
    copy: "Give sales teams stronger material for meetings, trade shows, product launches, and technical presentations.",
  },
  {
    title: "Training clarity",
    copy: "Make operation, maintenance, and process knowledge easier to understand, repeat, and remember.",
  },
  {
    title: "Technical clarity",
    copy: "Turn hidden engineering value into a clear story clients can see, compare, and trust.",
  },
];

const deliverables = [
  {
    title: "Technical Product Animation",
    copy: "Cinematic and explanatory films that show mechanisms, assembly, process flow, and product logic.",
  },
  {
    title: "Interactive Product Experiences",
    copy: "Product viewers, exploded views, annotations, and feature demonstrations.",
  },
  {
    title: "Sales & Training Systems",
    copy: "Structured visual tools for teams who need to present, teach, compare, or explain complex industrial equipment.",
  },
  {
    title: "Interactive Catalogs",
    copy: "Digital catalogs, product libraries, rendered product ranges, and configurable presentation assets.",
  },
  {
    title: "Digital Twin Presentations",
    copy: "Visual representations of systems, workflows, machines, or processes for explanation and decision-making.",
  },
  {
    title: "Product Configurators",
    copy: "Guided visual systems that help users explore variants, options, assemblies, and technical differences.",
  },
];

const structure = [
  {
    number: "01",
    title: "Understand the system",
    copy: "We study the product, process, and audience before deciding what needs to be shown.",
  },
  {
    number: "02",
    title: "Build the visual language",
    copy: "We create the models, materials, motion, cameras, and technical visual logic.",
  },
  {
    number: "03",
    title: "Deliver the experience",
    copy: "The final output can become a film, catalog, viewer, training tool, or interactive presentation.",
  },
];

const relatedWork = [
  {
    title: "Oleocon",
    copy: "Interactive product experience and technical product communication.",
  },
  {
    title: "Gemak CIP",
    copy: "Process-oriented industrial visualization for a complex system.",
  },
  {
    title: "Gemak Pasteurizer",
    copy: "Machine presentation and product storytelling for industrial equipment.",
  },
];


const galleryItems = [
  "Falke – Socks",
  "Woolmark – Wool Performance",
  "HSBC – Alternatives",
  "SCA – Forest Products",
  "Woolmark – Merino Wool Processing",
  "Loewe – Craftsmanship",
  "Holzrausch – J'Gast",
  "Material Study",
  "Process Detail",
  "Technical Product Story",
];


export default function ServiceIndustrialVisualizationPage() {
  return (
    <main className="service-detail-page service-detail-page--mineral" aria-label="Industrial Visualization">
      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div>
          <p className="service-detail-kicker">Industrial Visualization</p>
          <h1 id="service-detail-title">Visual systems for industrial products.</h1>
          <p className="service-detail-lead">We turn complex equipment, technical processes, and product systems into clear visual experiences for sales, training, and product communication.</p>
          <Link className="service-detail-back" to="/services">Back to services</Link>
        </div>

        <div className="service-detail-visualArea" aria-label="Service summary and visual placeholder">
          <img className="service-detail-symbolImage" src="/pages/services/industrial visualisation.png" alt="Industrial visualization service symbol" />
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
          <p>These are not random skills. They are the formats clients actually receive: films, catalogs, product systems, training material, and presentation tools.</p>
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
            <article key={title} className={`service-detail-gallery__item service-detail-gallery__item--${(index % 5) + 1}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="service-detail-cta" aria-label="Discuss this service">
        <h2>Have a product, process, or system that needs to be explained?</h2>
        <Link to="/contact">Start a project <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
