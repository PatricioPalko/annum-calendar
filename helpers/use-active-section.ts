"use client";

import { useEffect, useState } from "react";

const HEADER_OFFSET_PX = 112;

export function useActiveSection(sectionIds: string[], enabled: boolean) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const isTracking = enabled && sectionIds.length > 0;

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    function updateActiveSection() {
      let nextActive: string | null = null;

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);

        if (!element) {
          continue;
        }

        const { top } = element.getBoundingClientRect();

        if (top <= HEADER_OFFSET_PX) {
          nextActive = sectionId;
        }
      }

      setActiveSection(nextActive);
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [isTracking, sectionIds]);

  // Derived during render instead of resetting state inside the effect.
  return isTracking ? activeSection : null;
}
