import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";

import { AuthProvider } from "@/components/providers/session-provider";

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
      style={
        {
          "--font-body":
            '"Aptos", "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
          "--font-display":
            '"Bahnschrift", "Trebuchet MS", "Arial Narrow", ui-sans-serif, system-ui, sans-serif',
        } as CSSProperties
      }
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
