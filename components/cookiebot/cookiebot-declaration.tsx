"use client";

import { useEffect } from "react";

const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_ID?.trim();

export function CookiebotDeclaration() {
  useEffect(() => {
    if (!cookiebotId) {
      return;
    }

    const wrapper = document.getElementById("CookieDeclaration");

    if (!wrapper || wrapper.querySelector("script")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "CookieDeclaration";
    script.src = `https://consent.cookiebot.com/${cookiebotId}/cd.js`;
    script.async = true;
    wrapper.appendChild(script);
  }, []);

  if (!cookiebotId) {
    return (
      <p className="text-sm font-medium text-[#3E0F28]/60">
        Cookie deklarácia bude dostupná po nastavení Cookiebot ID.
      </p>
    );
  }

  return <div id="CookieDeclaration" className="cookiebot-declaration" />;
}
