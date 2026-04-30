import type { MetadataRoute } from "next";

const BASE_URL = "https://axiomvaults.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/vaults`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    {
      url: `${BASE_URL}/transparency`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];
}
