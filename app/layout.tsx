import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";

import { AuthProvider } from "@/components/providers/session-provider";

import { manrope, spaceGrotesk } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Marvel's Studios",
    template: "%s | Marvel's Studios",
  },
  description: "Marvel's Studios website and member portals.",
  metadataBase: new URL("https://marvelsfit.com"),
};

export const viewport: Viewport = {
  themeColor: "#111214",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
