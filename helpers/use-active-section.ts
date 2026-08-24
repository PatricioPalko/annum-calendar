"use client";

import { useEffect, useState } from "react";

const HEADER_OFFSET_PX = 80;

export function useActiveSection(sectionIds: string[], enabled: boolean) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      setActiveSection(null);
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
  }, [enabled, sectionIds]);

  return activeSection;
}
