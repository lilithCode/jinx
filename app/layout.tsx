import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { themeScript } from "@/components/ThemeToggle";
import "./globals.css";

// Fonts ship inside the project, so nothing is downloaded at build or start-up.
const display = localFont({ src: "./fonts/mochiy-400.woff2", weight: "400", variable: "--f-display", display: "swap" });
const body = localFont({
  src: [
    { path: "./fonts/mplus-400.woff2", weight: "400" },
    { path: "./fonts/mplus-500.woff2", weight: "500" },
    { path: "./fonts/mplus-700.woff2", weight: "700" },
    { path: "./fonts/mplus-800.woff2", weight: "800" },
  ],
  variable: "--f-body",
  display: "swap",
});
const goth = localFont({ src: "./fonts/grenze-700.woff2", weight: "400", variable: "--f-goth", display: "swap" });
const mono = localFont({ src: "./fonts/dmmono-500.woff2", weight: "500", variable: "--f-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Jinx · drop a dare, shake the jar", template: "%s · Jinx" },
  description: "A party game for friends: everyone drops secret dares into a shared jar, then shake the jar to get a random one.",
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0710" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${goth.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
