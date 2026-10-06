"use client";

import {
  getGaMeasurementId,
  isAnalyticsConsentRequired,
  pageview,
} from "@/lib/analytics";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useState } from "react";

const measurementId = getGaMeasurementId();

function hasStatisticsConsent() {
  return window.Cookiebot?.consent?.statistics === true;
}

function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const requireConsent = isAnalyticsConsentRequired();
  const [allowed, setAllowed] = useState(!requireConsent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!requireConsent) {
      return;
    }

    const syncConsent = () => {
      setAllowed(hasStatisticsConsent());
    };

    syncConsent();
    window.addEventListener("CookiebotOnConsentReady", syncConsent);
    window.addEventListener("CookiebotOnAccept", syncConsent);
    window.addEventListener("CookiebotOnDecline", syncConsent);

    return () => {
      window.removeEventListener("CookiebotOnConsentReady", syncConsent);
      window.removeEventListener("CookiebotOnAccept", syncConsent);
      window.removeEventListener("CookiebotOnDecline", syncConsent);
    };
  }, [requireConsent]);

  useEffect(() => {
    if (!allowed || !ready || !measurementId) {
      return;
    }

    pageview(query ? `${pathname}?${query}` : pathname);
  }, [allowed, ready, pathname, query]);

  if (!measurementId || !allowed) {
    return null;
  }

  return (
    <>
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        data-cookieconsent="statistics"
      />
    </>
  );
}

export function GoogleAnalytics() {
  if (!measurementId) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsTracker />
    </Suspense>
  );
}
