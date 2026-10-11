import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Bis zur Freigabe (Fremdlogos retuschiert, Rechtstexte final): komplett gesperrt
  if (!site.indexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auswahl", "/en/selection", "/anfrage/danke", "/en/inquiry/thanks"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
