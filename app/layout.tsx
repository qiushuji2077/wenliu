import type { Metadata, Viewport } from "next";
import { sitePath } from "@/lib/paths";
import { PwaRegistration } from "./pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "文流｜中文富文本阅读库", template: "%s｜文流" },
  description: "把值得留下的文章转成中文，重新排成一页好读的富文本。",
  manifest: sitePath("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "文流", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: sitePath("/favicon.svg"), type: "image/svg+xml" },
      { url: sitePath("/icon-192.png"), type: "image/png", sizes: "192x192" },
      { url: sitePath("/icon-512.png"), type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: sitePath("/apple-touch-icon.png"), type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#173d34",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hans"><body>{children}<PwaRegistration /></body></html>;
}
