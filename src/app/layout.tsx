import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "@fontsource/vazirmatn/900.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";
import { PRODUCT } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${PRODUCT.faName} | پنل مدیریت تانل امن چند‌سروره`,
  description: PRODUCT.tagline,
};

export const viewport: Viewport = {
  themeColor: "#05070f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
