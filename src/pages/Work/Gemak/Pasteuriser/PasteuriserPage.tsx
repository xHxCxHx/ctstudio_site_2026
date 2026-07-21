// src/pages/Work/Gemak/Pasteuriser/PasteuriserPage.tsx

import { Link } from "react-router-dom";
import "./PasteuriserPage.css";

const PASTEURISER_IMAGE = "/pages/Gemak_Page/Pasteuriser_Page/Pasteuriser_Selection.png";

export default function PasteuriserPage() {
  return (
    <main className="gemak-project gemak-pasteuriser-page">
      <section className="gemak-project-hero">
        <div className="gemak-project-bg" aria-hidden="true" />
        <div className="gemak-project-copy">
          <p>WORK / GEMAK / PASTEURISATION</p>
          <h1>Pasteurisation system visualised as engineering clarity.</h1>
          <span>
            A lightweight case-study page starts with the same hero image used in the selection transition. Full
            interactive 3D remains isolated in its own route.
          </span>
          <Link to="/work/gemak/pasteuriser/3d">Experience in 3D</Link>
        </div>
        <img src={PASTEURISER_IMAGE} alt="Gemak Pasteurisation system" />
      </section>
    </main>
  );
}
