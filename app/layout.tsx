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
    description: "瓜瓜的顧問工作行程，依公司需求機動安排，原則上每週到辦公室 1 至 2 天。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "瓜瓜的工作行程",
      description: "顧問工作採機動安排，讓 Jerry 一目瞭然地確認到公司日期、工作內容與所在縣市。",
      type: "website",
      images: [{ url: ogImage, width: 1733, height: 908, alt: "瓜瓜的工作行程" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "瓜瓜的工作行程",
      description: "顧問工作採機動安排，讓 Jerry 一目瞭然地確認到公司日期、工作內容與所在縣市。",
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
