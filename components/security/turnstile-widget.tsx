"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  className?: string;
  responsive?: boolean;
  size?: "normal" | "compact" | "flexible";
};

export type TurnstileWidgetHandle = {
  reset: () => void;
};

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget(
  {
    siteKey,
    onToken,
    onExpired,
    onError,
    className,
    responsive = false,
    size = "normal",
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpiredRef.current = onExpired;
    onErrorRef.current = onError;
  });

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!responsive) {
      setIsMobile(size === "compact" || size === "flexible");
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateSize = () => setIsMobile(mediaQuery.matches);

    updateSize();
    mediaQuery.addEventListener("change", updateSize);

    return () => mediaQuery.removeEventListener("change", updateSize);
  }, [responsive, size]);

  const widgetSize = responsive
    ? isMobile
      ? "flexible"
      : "normal"
    : size;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const removeWidget = () => {
      if (!widgetIdRef.current || !window.turnstile) {
        widgetIdRef.current = null;
        return;
      }

      window.turnstile.remove?.(widgetIdRef.current);
      widgetIdRef.current = null;
      container.replaceChildren();
    };

    const maybeRender = () => {
      if (!window.turnstile) return false;

      removeWidget();

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onExpiredRef.current?.(),
        "error-callback": () => onErrorRef.current?.(),
        theme: "light",
        size: widgetSize,
      });

      return true;
    };

    if (maybeRender()) {
      return removeWidget;
    }

    const interval = window.setInterval(() => {
      if (maybeRender()) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
      removeWidget();
    };
  }, [siteKey, widgetSize]);

  return (
    <div className={cn("w-full", className)}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        ref={containerRef}
        className="w-full [&>div]:w-full [&_iframe]:w-full"
      />
    </div>
  );
});
