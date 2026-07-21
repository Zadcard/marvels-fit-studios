"use client";
import { useOps } from "@/lib/ops/store";
import { css } from "@/lib/ops/css";
import s from "./Sidebar.module.css";

function NavBtn({ icon, title, sub, onClick, active, badge, badgeColor, pill }: {
  icon: string; title: string; sub: string; onClick: () => void; active: string;
  badge?: React.ReactNode; badgeColor?: string; pill?: boolean;
}) {
  return (
    <button className={s.navBtn} style={css(active)} onClick={onClick}>
      <span className={s.navIcon}>{icon}</span>
      <span className={s.navText}>
        <span className={s.navTitle}>{title}</span>
        <span className={s.navSub}>{sub}</span>
      </span>
      {badge != null && (pill
        ? <span className={s.pillBadge}>{badge}</span>
        : <span className={s.numBadge} style={{ color: badgeColor }}>{badge}</span>)}
    </button>
  );
}

export default function Sidebar() {
  const v = useOps();
  return (
    <aside className={s.aside}>
      <div className={s.brand}>
        <div className={s.logo}>M</div>
        <div className={s.brandName}>
          <strong>Marvel Fit Studios</strong>
          <span>6th of October · Ops</span>
        </div>
      </div>

      <nav className={`mv-scroll ${s.nav}`}>
        {v.isAdmin && (
          <>
            <div className={s.group}>Operations</div>
            <div className={s.items}>
              <NavBtn icon="◎" title="Today" sub="Live studio operations" onClick={v.goToday} active={v.navToday} badge={v.liveCount} badgeColor="var(--red)" />
              <NavBtn icon="✓" title="Attendance" sub="Mark check-ins fast" onClick={v.goAttendance} active={v.navAttendance} />
              <NavBtn icon="▤" title="Schedule" sub="Recurring & changes" onClick={v.goSchedule} active={v.navSchedule} badge={v.hasScheduleChanges ? v.changeCount : undefined} badgeColor="var(--warn)" />
            </div>
            <div className={s.group}>People</div>
            <div className={s.items}>
              <NavBtn icon="⚑" title="Leads & Trials" sub="Follow-up pipeline" onClick={v.goLeads} active={v.navLeads} badge={v.leadCount} badgeColor="var(--muted)" />
              <NavBtn icon="◉" title="Clients" sub="Roster & profiles" onClick={v.goClients} active={v.navClients} />
              <NavBtn icon="⬡" title="Groups" sub="Recurring classes" onClick={v.goGroups} active={v.navGroups} />
              <NavBtn icon="◭" title="Coaches" sub="Qualifications & groups" onClick={v.goCoaches} active={v.navCoaches} />
            </div>
            <div className={s.group}>Money</div>
            <div className={s.items}>
              <NavBtn icon="$" title="Subscriptions" sub="Renewals & cash flow" onClick={v.goSubs} active={v.navSubs} badge={v.expiringCount} badgeColor="var(--warn)" />
            </div>
            <div className={s.group}>Insights &amp; System</div>
            <div className={s.items}>
              <NavBtn icon="◔" title="Reports" sub="Studio performance" onClick={v.goReports} active={v.navReports} />
              <NavBtn icon="◈" title="Notifications" sub="Everything that happened" onClick={v.goNotifs} active={v.navNotifs} badge={v.unreadCount} pill />
              <NavBtn icon="⚙" title="Settings" sub="Studio configuration" onClick={v.goSettings} active={v.navSettings} />
            </div>
          </>
        )}

        {v.isCoach && (
          <>
            <div className={s.group}>Coach · {v.coachSelfName}</div>
            <div className={s.items}>
              <NavBtn icon="◎" title="Today" sub="My sessions & groups" onClick={v.goCoachToday} active={v.navCoachToday} />
              <NavBtn icon="◈" title="Notifications" sub="Injuries & changes" onClick={v.goCoachAlerts} active={v.navCoachAlerts} badge={v.coachAlertCount} pill />
            </div>
          </>
        )}
      </nav>

      <div className={s.userWrap}>
        <div className={s.userCard}>
          <span className={s.userAvatar} style={{ background: v.userGrad }}>{v.userInitials}</span>
          <div className={s.userMeta}>
            <div className={s.userName}>{v.userName}</div>
            <div className={s.userRole}>{v.userRole}</div>
          </div>
          <button className={s.signOut} title="Sign out" onClick={v.signOut}>⎋</button>
        </div>
      </div>
    </aside>
  );
}
