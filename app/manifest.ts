import type { MetadataRoute } from "next";
import { sitePath } from "@/lib/paths";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "文流｜中文富文本阅读库",
    short_name: "文流",
    description: "把值得留下的文章，重新排成一页好读的中文。",
    id: sitePath("/"),
    start_url: sitePath("/"),
    scope: sitePath("/"),
    display: "standalone",
    background_color: "#173d34",
    theme_color: "#173d34",
    icons: [
      { src: sitePath("/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: sitePath("/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
