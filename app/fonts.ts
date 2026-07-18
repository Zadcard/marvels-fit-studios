import {
  Archivo_Black,
  JetBrains_Mono,
  Manrope,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
} from "next/font/google";

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const opsBody = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ops-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const opsDisplay = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ops-display",
  weight: ["500", "600", "700"],
});

export const opsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ops-mono",
  weight: ["400", "500", "700"],
});

export const opsImpact = Archivo_Black({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ops-impact",
  weight: "400",
});
