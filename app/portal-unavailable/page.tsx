import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Access unavailable" };

export default function PortalUnavailable() {
  return <main className="ops-empty-state"><Image src="/img/Logo-3.png" alt="Marvel Fitness Studios" width={54} height={54} priority /><p>Marvel Fitness Studios · Operations</p><h1>Client access is not included in this delivery.</h1><Link href="/login" className="mv-btn mv-btn-primary">Back to sign in</Link></main>;
}
