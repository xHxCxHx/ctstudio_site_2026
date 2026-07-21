// src/pages/Work/Gemak/CIP/CIPPage.tsx

import { Link } from "react-router-dom";
import "../Pasteuriser/PasteuriserPage.css";
import "./CIPPage.css";

const CIP_IMAGE = "/pages/Gemak_Page/CIP_Page/CIP_Selection.png";

export default function CIPPage() {
  return (
    <main className="gemak-project gemak-cip-page">
      <section className="gemak-project-hero">
        <div className="gemak-project-bg" aria-hidden="true" />
        <div className="gemak-project-copy">
          <p>WORK / GEMAK / CIP</p>
          <h1>CIP system prepared for a dedicated technical story.</h1>
          <span>
            This placeholder keeps routing and transition continuity working. The full CIP case-study content comes
            after the selection page is locked.
          </span>
          <Link to="/work/gemak/cip/3d">Experience in 3D</Link>
        </div>
        <img src={CIP_IMAGE} alt="Gemak CIP system" />
      </section>
    </main>
  );
}
