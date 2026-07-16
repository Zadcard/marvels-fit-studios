import {
  ArrowRight,
  CalendarClock,
  Mail,
  MessageSquareMore,
  Phone,
  ShieldUser,
  Target,
} from "lucide-react";

import type { ClientCoachRecord } from "@/lib/dashboard/client-dashboard-data";
import styles from "./client-coach-workspace.module.css";

type ClientCoachWorkspaceProps = { data: ClientCoachRecord };

export function ClientCoachWorkspace({ data }: ClientCoachWorkspaceProps) {
  const nextSession = data.nextSession.replace("Ã‚Â·", "·").replace("Â·", "·");
  const initials = data.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>My coach</span>
          <h1>Your person on the floor.</h1>
          <p>
            Know who is guiding your training, what comes next and how to reach
            them.
          </p>
        </div>
      </header>
      <section className={styles.profile}>
        <div className={styles.identity}>
          <span className={styles.avatar}>{initials}</span>
          <div>
            <span>{data.roleLabel}</span>
            <h2>{data.fullName}</h2>
            <p>{data.specialization}</p>
          </div>
        </div>
        <div className={styles.next}>
          <CalendarClock size={20} />
          <span>Next touchpoint</span>
          <strong>{nextSession}</strong>
        </div>
        <a href={`tel:${data.phone}`}>
          <Phone size={17} />
          Call coach
          <ArrowRight size={16} />
        </a>
      </section>
      <section className={styles.scoreboard}>
        <article>
          <Target size={18} />
          <span>Specialization</span>
          <strong>{data.specialization}</strong>
        </article>
        <article>
          <CalendarClock size={18} />
          <span>Next session</span>
          <strong>{nextSession}</strong>
        </article>
        <article data-dark>
          <ShieldUser size={18} />
          <span>Support channel</span>
          <strong>Direct</strong>
        </article>
      </section>
      <section className={styles.detailGrid}>
        <article className={styles.story}>
          <div>
            <span className={styles.kicker}>Coaching approach</span>
            <h2>How you are supported</h2>
          </div>
          <blockquote>{data.bio}</blockquote>
          <div className={styles.note}>
            <MessageSquareMore size={20} />
            <div>
              <span>Current support note</span>
              <p>{data.coachingNote}</p>
            </div>
          </div>
        </article>
        <aside className={styles.contact}>
          <span className={styles.kicker}>Contact card</span>
          <h2>Reach {data.fullName.split(" ")[0]}</h2>
          <p>
            Use the verified studio contact details below when you need direct
            support.
          </p>
          <a href={`mailto:${data.email}`}>
            <Mail size={18} />
            <div>
              <span>Email</span>
              <strong>{data.email}</strong>
            </div>
            <ArrowRight size={16} />
          </a>
          <a href={`tel:${data.phone}`}>
            <Phone size={18} />
            <div>
              <span>Phone</span>
              <strong>{data.phone}</strong>
            </div>
            <ArrowRight size={16} />
          </a>
        </aside>
      </section>
    </div>
  );
}
