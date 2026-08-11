import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const ogImage = `${protocol}://${host}/og.png`;

  return {
    title: "Jerry × 辦公室碰面排程",
    description: "2026 年 8 月 12 日到年底的辦公室行程規劃表。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Jerry × 辦公室碰面排程",
      description: "一目瞭然地確認到公司日期、工作安排與所在縣市。",
      type: "website",
      images: [{ url: ogImage, width: 1731, height: 909, alt: "Jerry × 辦公室碰面排程" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Jerry × 辦公室碰面排程",
      description: "一目瞭然地確認到公司日期、工作安排與所在縣市。",
      images: [ogImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
