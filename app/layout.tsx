import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const ogImage = `${protocol}://${host}/og.png`;

  return {
    title: "瓜瓜的工作行程",
    description: "2026 年 8 月 12 日到 2027 年 8 月 31 日的工作行程與到公司日期。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "瓜瓜的工作行程",
      description: "讓 Jerry 一目瞭然地確認瓜瓜到公司的日期、工作安排與所在縣市。",
      type: "website",
      images: [{ url: ogImage, width: 1733, height: 908, alt: "瓜瓜的工作行程" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "瓜瓜的工作行程",
      description: "讓 Jerry 一目瞭然地確認瓜瓜到公司的日期、工作安排與所在縣市。",
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
