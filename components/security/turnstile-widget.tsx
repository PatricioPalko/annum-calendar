"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from "react";

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
          size?: "normal" | "compact";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  className?: string;
};

export type TurnstileWidgetHandle = {
  reset: () => void;
};

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget(
  { siteKey, onToken, onExpired, onError, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderId = useId();

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const maybeRender = () => {
      if (!window.turnstile) return false;
      if (widgetIdRef.current) return true;

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onExpired?.(),
        "error-callback": () => onError?.(),
        theme: "light",
      });

      return true;
    };

    if (maybeRender()) return;

    const interval = window.setInterval(() => {
      if (maybeRender()) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [onError, onExpired, onToken, siteKey, renderId]);

  return (
    <div className={className}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
    </div>
  );
});
