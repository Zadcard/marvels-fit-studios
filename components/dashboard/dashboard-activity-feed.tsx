import { cn } from "@/lib/utils";
import type { AdminRecentActivityItem } from "@/lib/mocks/admin-overview";

type DashboardActivityFeedProps = {
  items: AdminRecentActivityItem[];
};

export function DashboardActivityFeed({
  items,
}: DashboardActivityFeedProps) {
  return (
    <ul className="dashboard-activity-feed">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "dashboard-activity-feed__item",
            `dashboard-activity-feed__item--${item.tone}`
          )}
        >
          <span className="dashboard-activity-feed__dot" aria-hidden="true" />
          <div className="dashboard-activity-feed__content">
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
          <span className="dashboard-activity-feed__time">{item.timeLabel}</span>
        </li>
      ))}
    </ul>
  );
}
