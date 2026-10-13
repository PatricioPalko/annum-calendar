import type { Metadata } from "next";

export const SITE_URL = "https://www.annum.sk";
export const SITE_NAME = "Annum";
export const SITE_LOCALE = "sk_SK";

export const HOME_TITLE = "Fotokalendár z vlastných fotiek | Annum";

export const HOME_DESCRIPTION =
  "Personalizovaný A3 fotokalendár z vašich fotiek. Nahrajte snímky a my pripravíme kalendár spomienok — s meninami, narodeninami a darčekovým zabalením.";

export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Annum — personalizovaný A3 fotokalendár z vlastných fotiek",
} as const;

type PageMetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  /** Title is already final and must not receive the layout template. */
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
