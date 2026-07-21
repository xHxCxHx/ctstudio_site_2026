// src/pages/Lab/LabBookRail.tsx

import { useState } from "react";
import type { LabExperimentMeta } from "./LabExperimentRegistry";

type LabBookRailProps = {
  items: LabExperimentMeta[];
  activeVirtualIndex: number;
  onActiveVirtualIndexChange: (value: number) => void;
  onOpenExperiment: () => void;
};

function positiveModulo(value: number, length: number) {
  return ((value % length) + length) % length;
}

export function LabBookRail({
  items,
  activeVirtualIndex,
  onActiveVirtualIndexChange,
}: LabBookRailProps) {
  const [lockedRealIndex, setLockedRealIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const activeRealIndex = positiveModulo(activeVirtualIndex, items.length);

  const previewBook = (index: number) => {
    // اگر book با کلیک قفل شده باشد، hover دیگر active را تغییر نمی‌دهد.
    if (lockedRealIndex !== null) return;
    onActiveVirtualIndexChange(index);
  };

  const clickBook = (index: number) => {
    // کلیک اول: انتخاب و قفل.
    // کلیک دوباره روی همان book: آزادسازی hover preview.
    if (lockedRealIndex === index) {
      setLockedRealIndex(null);
      return;
    }

    setLockedRealIndex(index);
    onActiveVirtualIndexChange(index);
  };

  return (
    <div className="ctsLabAccordionFrame" aria-label="Looping lab experiment categories">
      <div className="ctsLabBookRail" role="list">
        {items.map((item, index) => {
          const isActive = index === activeRealIndex;
          const isLocked = index === lockedRealIndex;

          return (
            <article
              key={item.id}
              className={`ctsLabAccordionItem${isActive ? " isActive" : ""}${isLocked ? " isLocked" : ""}`}
              role="listitem"
              tabIndex={0}
              onMouseEnter={() => previewBook(index)}
              onFocus={() => previewBook(index)}
              onClick={() => clickBook(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  clickBook(index);
                }
              }}
              aria-label={`${item.title} experiment`}
              aria-pressed={isLocked}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                draggable="false"
                className="ctsLabAccordionImage"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "https://placehold.co/760x940/111111/ffffff?text=CTSTUDIO+LAB";
                }}
              />
              <div className="ctsLabAccordionShade" aria-hidden="true" />
              <span className="ctsLabAccordionTitle">{item.title}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
