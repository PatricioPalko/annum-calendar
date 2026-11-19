import type { MetadataRoute } from "next";

/**
 * Crawling stays allowed on purpose: the site is hidden from search results
 * with `X-Robots-Tag: noindex` (next.config.ts) and the robots meta tag, which
 * crawlers only see on pages they are allowed to fetch.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  };
}
