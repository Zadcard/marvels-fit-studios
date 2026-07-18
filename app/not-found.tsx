import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <main className="ops-empty-state"><Image src="/img/Logo-3.png" alt="Marvel Fitness Studios" width={54} height={54} priority /><p>Operations system · 404</p><h1>This route is not part of the studio workspace.</h1><Link href="/login" className="mv-btn mv-btn-primary">Open sign in</Link></main>;
}
