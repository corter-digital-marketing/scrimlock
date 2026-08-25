import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth flows, per-user account/management screens, and mutation-only
      // "new" forms have no SEO value and shouldn't burn crawl budget —
      // the public listing pages they hang off of (/teams, /tournaments,
      // etc.) are what should get indexed instead.
      disallow: [
        "/login",
        "/signup",
        "/auth/",
        "/settings/",
        "/messages",
        "/admin",
        "/admin/",
        "/*/manage",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
