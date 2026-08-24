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
          options?: PacketaWidgetOptions,
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
  group?: string;
  error?: string | null;
};

type PacketaWidgetVendor = {
  country: string;
  group?: "zbox";
  selected?: boolean;
};

type PacketaWidgetOptions = {
  country?: string;
  language?: string;
  vendors?: PacketaWidgetVendor[];
  weight?: number;
};

type PacketaPickerProps = {
  value?: {
    id: string;
    name: string;
    address: string;
  };
  onChange: (value: { id: string; name: string; address: string }) => void;
  disabled?: boolean;
  layout?: "default" | "embedded";
};

const PACKETA_SCRIPT_ID = "packeta-widget-script";
const PACKETA_SCRIPT_URL = "https://widget.packeta.com/v6/www/js/library.js";

const packetaWidgetOptions: PacketaWidgetOptions = {
  country: "sk",
  language: "sk",
  weight: 2,
  vendors: [
    { country: "sk", group: "zbox", selected: true },
    { country: "sk" },
  ],
};

function getPacketaAddress(point: PacketaPoint) {
  return [point.street, point.city, point.zip, point.country]
    .filter(Boolean)
    .join(", ");
}

function markWidgetReady(setIsReady: (value: boolean) => void) {
  if (window.Packeta?.Widget) {
    setIsReady(true);
    return true;
  }

  return false;
}

export function PacketaPicker({
  value,
  onChange,
  disabled,
  layout = "default",
}: PacketaPickerProps) {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY;
  const isConfigured = Boolean(apiKey);

  useEffect(() => {
    if (markWidgetReady(setIsReady)) {
      return;
    }

    const existingScript = document.getElementById(
      PACKETA_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        markWidgetReady(setIsReady);
        return;
      }

      existingScript.addEventListener(
        "load",
        () => {
          existingScript.dataset.loaded = "true";
          markWidgetReady(setIsReady);
        },
        { once: true },
      );
      existingScript.addEventListener(
        "error",
        () => {
          setLoadError("Packeta widget sa nepodarilo načítať.");
          setIsReady(false);
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = PACKETA_SCRIPT_ID;
    script.src = PACKETA_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      markWidgetReady(setIsReady);
    };
    script.onerror = () => {
      setLoadError("Packeta widget sa nepodarilo načítať.");
      setIsReady(false);
    };

    document.body.appendChild(script);
  }, []);

  function handlePick() {
    if (!apiKey || !window.Packeta?.Widget) {
      return;
    }

    window.Packeta.Widget.pick(
      apiKey,
      (point) => {
        if (!point) {
          return;
        }

        if (point.error) {
          window.alert(
            "Toto výdajné miesto momentálne nie je dostupné. Vyberte prosím iné.",
          );
          return;
        }

        onChange({
          id: String(point.id),
          name: point.name,
          address: getPacketaAddress(point) || point.name,
        });
      },
      packetaWidgetOptions,
    );
  }

  if (layout === "embedded") {
    return (
      <div className="space-y-2">
        {!isConfigured ? (
          <p className="text-sm text-[#FC5A61]">
            Výber výdajného miesta nie je dostupný. Skúste to prosím neskôr.
          </p>
        ) : null}

        {loadError ? (
          <p className="text-sm text-[#FC5A61]">{loadError}</p>
        ) : null}

        {value ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 text-sm leading-snug">
              <p className="font-bold text-[#3E0F28]">{value.name}</p>
              <p className="mt-0.5 text-[#3E0F28]/65">{value.address}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePick}
              disabled={disabled || !isReady || !isConfigured}
              className="h-auto shrink-0 self-start px-2 py-1 text-xs font-bold text-[#FC5A61] hover:bg-[#FFF7F4] hover:text-[#E94D54]"
            >
              Zmeniť
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={handlePick}
            disabled={disabled || !isReady || !isConfigured}
            className="w-full"
          >
            Vybrať Z-BOX alebo výdajné miesto
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!isConfigured && (
        <p className="text-sm text-[#FC5A61]">
          Výber výdajného miesta nie je dostupný. Skúste to prosím neskôr.
        </p>
      )}

      {loadError && (
        <p className="text-sm text-[#FC5A61]">{loadError}</p>
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={handlePick}
        disabled={disabled || !isReady || !isConfigured}
        className="mt-2"
      >
        {value ? "Zmeniť výdajné miesto" : "Vybrať Z-BOX alebo výdajné miesto"}
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
