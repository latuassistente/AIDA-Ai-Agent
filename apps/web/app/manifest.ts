import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIDA-Ai-Agent",
    short_name: "AIDA",
    description: "Workspace SaaS per agenti AI, lead B2B e campagne.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f8fa",
    theme_color: "#102a43",
    lang: "it",
    categories: ["business", "productivity"],
  };
}
