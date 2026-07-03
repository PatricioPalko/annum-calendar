import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Annum - personalizované fotokalendáre",
    short_name: "Annum",
    description:
      "Personalizované A3 nástenné kalendáre s kovovou väzbou z vašich fotiek.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFF7F4",
    theme_color: "#3E0F28",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
