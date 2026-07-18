import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/providers/session-provider";
import {
  opsBody,
  opsDisplay,
  opsImpact,
  opsMono,
} from "./fonts";

import "./globals.css";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Marvel Fitness Studios · Operations",
    template: "%s | Marvel Fitness Studios",
  },
  description: "Internal operations workspace for Marvel Fitness Studios admins and coaches.",
  metadataBase: new URL(appUrl),
};

export const viewport: Viewport = {
  themeColor: "#050505",
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
      className={`${opsBody.variable} ${opsDisplay.variable} ${opsMono.variable} ${opsImpact.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
