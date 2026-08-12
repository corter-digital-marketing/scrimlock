import type { Metadata } from "next";
import { Cinzel, Special_Elite, EB_Garamond } from "next/font/google";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GrainOverlay } from "@/components/site/grain-overlay";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/supabase/auth";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Deadlock Esports — Tournaments, Scrims & LFT",
    template: "%s — Deadlock Esports",
  },
  description:
    "The competitive hub for Valve's Deadlock: run and enter tournaments, arrange scrims, and find your crew.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`dark ${cinzel.variable} ${specialElite.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-void text-parchment font-sans">
        <GrainOverlay />
        <SiteHeader user={user} />
        <main className="relative z-0 flex-1">{children}</main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
