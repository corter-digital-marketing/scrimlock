import type { Metadata } from "next";
import { Cinzel, Special_Elite, EB_Garamond } from "next/font/google";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GrainOverlay } from "@/components/site/grain-overlay";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/supabase/auth";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { safeJsonLd } from "@/lib/json-ld";
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

const TITLE_DEFAULT = "ScrimLock — Deadlock Scrims, PUGs, LFT & Tournaments";
const TITLE_TEMPLATE = "%s — ScrimLock";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Deadlock scrims",
    "Deadlock PUGs",
    "Deadlock LFT",
    "Deadlock tournaments",
    "Deadlock matchmaking",
    "Deadlock looking for team",
    "Deadlock competitive",
  ],
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
  // Deliberately no `robots` field here: a page with no robots meta tag at
  // all is indexable by default, so this is equivalent to explicit
  // index:true/follow:true — but setting it explicitly here caused a real
  // rendering bug where a descendant page's own explicit `robots` override
  // (see tournaments/[id]/page.tsx's draft noindex) rendered *alongside*
  // this one instead of replacing it, contrary to Next's documented
  // shallow-merge-overwrite semantics for metadata. Leaving it unset here
  // means a page-level override is the only robots tag that ever renders.
};

// Organization + WebSite structured data — tells search engines what
// ScrimLock *is* (not just what its pages say) and is a prerequisite for
// the sitelinks search box / knowledge panel treatment Google sometimes
// grants branded queries. Static, so it costs nothing to render on every
// page.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(JSON_LD) }}
        />
        <GrainOverlay />
        <SiteHeader user={user} />
        <main className="relative z-0 flex-1">{children}</main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
