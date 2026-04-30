import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://axiomvaults.com/sitemap.xml",
    host: "https://axiomvaults.com",
  };
}
