// src/labExperiments/Demo/LabDemoExperiment.tsx

import { useMemo, useState } from "react";
import type { LabExperimentComponentProps } from "../../pages/Lab/LabExperimentRegistry";
import "./LabDemoExperiment.css";

export default function LabDemoExperiment({ experiment }: LabExperimentComponentProps) {
  const [intensity, setIntensity] = useState(58);
  const [motion, setMotion] = useState(34);

  const points = useMemo(() => {
    return Array.from({ length: 18 }, (_, index) => {
      const x = 8 + ((index * 17 + intensity) % 84);
      const y = 12 + ((index * 23 + motion) % 76);
      const size = 4 + ((index + intensity) % 7);
      return { x, y, size };
    });
  }, [intensity, motion]);

  return (
    <div className="labDemoExperiment">
      <div className="labDemoExperimentScene" aria-hidden="true">
        <div className="labDemoExperimentGrid" />
        <div
          className="labDemoExperimentCore"
          style={{
            transform: `translate(-50%, -50%) scale(${0.75 + intensity / 180}) rotate(${motion * 1.8}deg)`,
          }}
        />
        {points.map((point, index) => (
          <i
            key={index}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${point.size}px`,
              height: `${point.size}px`,
              transform: `translate(-50%, -50%) scale(${0.8 + motion / 120})`,
            }}
          />
        ))}
      </div>

      <div className="labDemoExperimentPanel">
        <p>{experiment.eyebrow}</p>
        <h4>{experiment.title}</h4>
        <span>{experiment.text}</span>

        <label>
          <b>Intensity</b>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
          />
        </label>

        <label>
          <b>Motion</b>
          <input
            type="range"
            min="0"
            max="100"
            value={motion}
            onChange={(event) => setMotion(Number(event.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
