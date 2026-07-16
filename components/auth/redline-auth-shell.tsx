import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type RedlineAuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  note?: string;
};

export function RedlineAuthShell({
  children,
  eyebrow = "Marvel's Fit Studios",
  title = "Your work starts before the first rep.",
  note = "One secure doorway for members, coaches, and the studio team.",
}: RedlineAuthShellProps) {
  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Marvel Fitness member portal">
        <Link className="login-brand-mark" href="/" aria-label="Back to Marvel's Fit Studios">
          <Image src="/img/Logo-3.png" alt="" width={88} height={44} />
        </Link>
        <div className="login-brand-copy">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{note}</p>
        </div>
        <div className="login-brand-stats" aria-label="Studio highlights">
          <div><strong>3K+</strong><span>sessions delivered</span></div>
          <div><strong>12</strong><span>focused sessions / month</span></div>
        </div>
        <small className="login-brand-location">Giza, Egypt · Performance training</small>
      </section>
      <section className="login-action-panel">
        <div className="login-container">{children}</div>
      </section>
    </main>
  );
}
