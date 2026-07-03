import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://www.annum.sk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/admin/login",
          "/objednavka/dakujeme",
          "/objednavka/platba-zrusena",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
