import type { Metadata } from "next";

import "./ops.css";

export const metadata: Metadata = {
  title: "Operations",
  description: "Internal operations system for Marvel Fitness Studios.",
};

export default function OpsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="ops-root">{children}</div>;
}
