import type { Metadata } from "next";
import { manrope, spaceGrotesk } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Marvel's Studios | Member Portal",
    template: "%s | Marvel's Studios",
  },
  description:
    "Access your Marvel's Studios dashboard — manage sessions, track progress, and stay connected with your coaches.",
  metadataBase: new URL("https://marvelsfit.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
