"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Packeta?: {
      Widget: {
        pick: (
          apiKey: string,
          callback: (point: PacketaPoint | null) => void,
          options?: Record<string, unknown>,
        ) => void;
      };
    };
  }
}

export type PacketaPoint = {
  id: string;
  name: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  place?: string;
};

type PacketaPickerProps = {
  value?: {
    id: string;
    name: string;
    address: string;
  };
  onChange: (value: { id: string; name: string; address: string }) => void;
  disabled?: boolean;
};

const PACKETA_SCRIPT_ID = "packeta-widget-script";

function getPacketaAddress(point: PacketaPoint) {
  return [point.street, point.city, point.zip, point.country]
    .filter(Boolean)
    .join(", ");
}

export function PacketaPicker({
  value,
  onChange,
  disabled,
}: PacketaPickerProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.Packeta?.Widget) {
      setIsReady(true);
      return;
    }

    const existingScript = document.getElementById(PACKETA_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => setIsReady(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = PACKETA_SCRIPT_ID;
    script.src = "https://widget.packeta.com/v6/library.js";
    script.async = true;
    script.onload = () => setIsReady(true);

    document.body.appendChild(script);
  }, []);

  function handlePick() {
    const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY;

    if (!apiKey || !window.Packeta?.Widget) {
      return;
    }

    window.Packeta.Widget.pick(
      apiKey,
      (point) => {
        if (!point) {
          return;
        }

        onChange({
          id: String(point.id),
          name: point.name,
          address: getPacketaAddress(point) || point.name,
        });
      },
      {
        country: "sk",
        language: "sk",
      },
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        onClick={handlePick}
        disabled={disabled || !isReady}
        className="mt-2"
      >
        {value ? "Zmeniť výdajné miesto" : "Vybrať výdajné miesto"}
      </Button>

      {value && (
        <div className="rounded-md border border-[#EAD6DE] bg-[#FFF7F4] p-3 text-sm">
          <p className="font-bold text-[#3E0F28]">{value.name}</p>
          <p className="mt-1 text-[#3E0F28]/65">{value.address}</p>
          <p className="mt-1 text-xs font-medium text-[#3E0F28]/45">
            ID: {value.id}
          </p>
        </div>
      )}
    </div>
  );
}
