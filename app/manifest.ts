import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fundly — Household spending made clear",
    short_name: "Fundly",
    description:
      "Track money given to funds, record every naira spent, and share a clear summary with your household.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fbf6ec",
    theme_color: "#1e5c44",
    lang: "en-NG",
    dir: "ltr",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Add expense",
        short_name: "Add expense",
        description: "Record a new expense against a fund",
        url: "/expenses/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "New fund",
        short_name: "New fund",
        description: "Start tracking a new fund",
        url: "/funds/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Reports",
        short_name: "Reports",
        description: "Review spending and share a summary",
        url: "/reports",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}