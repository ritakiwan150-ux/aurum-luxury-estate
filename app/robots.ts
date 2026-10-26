import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/ar/account", "/en/account", "/ar/login", "/en/login", "/ar/favorites", "/en/favorites"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
