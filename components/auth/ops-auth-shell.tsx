import Image from "next/image";
import type { ReactNode } from "react";

type OpsAuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  note?: string;
};

export function OpsAuthShell({
  children,
  eyebrow = "Marvel Fitness Studios · Operations",
  title = "Run the day with clarity.",
  note = "Secure access for studio admins and coaches.",
}: OpsAuthShellProps) {
  return <main className="ops-auth-page">
    <section className="ops-auth-brand" aria-label="Marvel Fitness Studios Operations System">
      <Image className="ops-auth-logo" src="/img/Logo-3.png" alt="Marvel Fitness Studios" width={58} height={58} priority />
      <div className="ops-auth-copy"><span>{eyebrow}</span><h1>{title}</h1><p>{note}</p></div>
      <div className="ops-auth-meta"><span>6th of October · Egypt</span><span>Admin & coach workspace</span></div>
    </section>
    <section className="ops-auth-action"><div className="ops-auth-card">{children}</div></section>
  </main>;
}
