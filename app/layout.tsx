import { CookiebotScript } from "@/components/cookiebot/cookiebot-script";
import { Footer } from "@/components/sections/footer";
import Navigation from "@/components/sections/navigation";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-fraunces",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.annum.sk"),

  title: {
    default: "Annum | Personalizované A3 nástenné kalendáre z fotiek",
    template: "%s | Annum",
  },

  description:
    "Personalizovaný A3 nástenný kalendár s kovovou väzbou z vašich fotiek. Jednoduchá konfigurácia, až 52 fotiek, osobný odber v Košiciach a doručenie cez Packetu.",

  keywords: [
    "Annum",
    "A3 kalendár",
    "nástenný kalendár",
    "fotokalendár",
    "personalizovaný kalendár",
    "kalendár z fotiek",
    "rodinný kalendár",
    "kalendár s meninami",
    "kalendár s narodeninami",
    "kalendár s kovovou väzbou",
    "darčekový kalendár",
    "vlastný kalendár",
    "fotokalendár Košice",
    "A3 kalendár Košice",
  ],

  applicationName: "Annum",
  authors: [{ name: "Annum" }],
  creator: "Annum",
  publisher: "Annum",

  alternates: {
    canonical: "/",
    languages: {
      sk: "/",
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  openGraph: {
    type: "website",
    locale: "sk_SK",
    url: "https://www.annum.sk",
    siteName: "Annum",
    title: "Annum | Personalizované A3 nástenné kalendáre z fotiek",
    description:
      "A3 nástenný kalendár s kovovou väzbou z vašich fotiek. Jednoduchá konfigurácia, až 52 fotiek, Premium variant s meninami a narodeninami, osobný odber v Košiciach alebo doručenie cez Packetu.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Annum - personalizovaný A3 nástenný kalendár z fotiek",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Annum | Personalizované A3 nástenné kalendáre z fotiek",
    description:
      "Vytvorte si A3 nástenný kalendár s kovovou väzbou. Bez zdĺhavého editora, až 52 fotiek a možnosť vyznačiť meniny či narodeniny.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "personalizované fotoprodukty",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      className={cn(
        "h-full",
        "antialiased",
        fraunces.variable,
        manrope.variable,
        "font-sans",
      )}
    >
      <head>
        <CookiebotScript />
      </head>
      <body className="min-h-full flex flex-col">
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
