import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/providers/session-provider";
import { hankenGrotesk } from "./fonts";

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
  themeColor: "#0A0A0B",
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
      className={hankenGrotesk.variable}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
