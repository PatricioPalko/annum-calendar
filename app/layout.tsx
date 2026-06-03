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
    default: "Annum | Personalizované A3 nástenné kalendáre z vašich fotiek",
    template: "%s | Annum",
  },

  description:
    "Personalizovaný A3 nástenný kalendár s kovovou väzbou z vašich fotiek. Jednoduchá konfigurácia, až 52 fotiek a možnosť vyznačiť meniny či narodeniny.",
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
  ],

  applicationName: "Annum",
  authors: [{ name: "Annum" }],
  creator: "Annum",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "sk_SK",
    url: "https://www.annum.sk",
    siteName: "Annum",
    title: "Annum | Personalizované A3 nástenné kalendáre z vašich fotiek",
    description:
      "A3 nástenný kalendár s kovovou väzbou z vašich fotiek. Jednoducho nahráte fotky a my pripravíme čistý osobný kalendár aj s vyznačenými meninami alebo narodeninami pri Premium variante.",
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
    title: "Annum | Personalizované A3 nástenné kalendáre z vašich fotiek",
    description:
      "Vytvorte si A3 nástenný kalendár s kovovou väzbou. Bez zdĺhavého editora, až 52 fotiek a možnosť vyznačiť meniny či narodeniny.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        fraunces.variable,
        manrope.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
