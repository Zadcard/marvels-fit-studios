import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/providers/session-provider";
import { manrope, spaceGrotesk } from "./fonts";

import "./globals.css";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Marvel's Fit Studios",
    template: "%s | Marvel's Fit Studios",
  },
  description: "Marvel's Fit Studios website and member portals.",
  metadataBase: new URL(appUrl),
};

export const viewport: Viewport = {
  themeColor: "#e3e0dd",
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
      </body>
    </html>
  );
}
