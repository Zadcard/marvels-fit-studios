"use client";

import { useDeferredValue, useState } from "react";
import { CalendarPlus, Layers3 } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminSessionStatusFilters,
  type AdminGroupSessionRecord,
  type AdminPrivateSessionRecord,
  type AdminSessionStatus,
} from "@/lib/mocks/admin-sessions";

type SessionView = "group" | "private";
type SessionFormState = {
  title: string;
  coachName: string;
  sessionType: SessionView;
  status: AdminSessionStatus;
  dayLabel: string;
  timeLabel: string;
};

const emptySessionForm: SessionFormState = {
  title: "",
  coachName: "",
  sessionType: "group",
  status: "Draft",
  dayLabel: "",
  timeLabel: "",
};

type AdminSessionsWorkspaceProps = {
  groupRecords: AdminGroupSessionRecord[];
  privateRecords: AdminPrivateSessionRecord[];
};

function getSessionTone(status: AdminSessionStatus) {
  switch (status) {
    case "Scheduled":
      return "success";
    case "Waitlist":
      return "warning";
    case "Draft":
      return "neutral";
    default:
      return "accent";
  }
}

export function AdminSessionsWorkspace({
  groupRecords,
  privateRecords,
}: AdminSessionsWorkspaceProps) {
  const [view, setView] = useState<SessionView>("group");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | AdminSessionStatus>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<SessionFormState>(emptySessionForm);

  const filteredGroupRecords = groupRecords.filter((session) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [session.title, session.coachName, session.location]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus =
      statusFilter === "All" || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredPrivateRecords = privateRecords.filter((session) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [session.title, session.coachName, session.clientName, session.focus]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus =
      statusFilter === "All" || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeSummary =
    view === "group"
      ? `${filteredGroupRecords.length} group sessions in view`
      : `${filteredPrivateRecords.length} private sessions in view`;

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin sessions"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => {
              setFormState(emptySessionForm);
              setIsModalOpen(true);
            }}
          >
            <CalendarPlus size={16} />
            Create Session
          </button>
        }
      />

      <section className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-segmented">
          <button
            type="button"
            className={view === "group" ? "dashboard-segmented__button dashboard-segmented__button--active" : "dashboard-segmented__button"}
            onClick={() => setView("group")}
          >
            Group sessions
          </button>
          <button
            type="button"
            className={view === "private" ? "dashboard-segmented__button dashboard-segmented__button--active" : "dashboard-segmented__button"}
            onClick={() => setView("private")}
          >
            Private sessions
          </button>
        </div>

        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={
            view === "group"
              ? "Search by session, coach, or location"
              : "Search by client, coach, or focus"
          }
          summary={activeSummary}
          filters={
            <label className="dashboard-filter-field">
              <span>Status</span>
              <select
                className="dashboard-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "All" | AdminSessionStatus)
                }
              >
                {adminSessionStatusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          }
          actions={
            <button type="button" className="mv-btn mv-btn-outline">
              <Layers3 size={16} />
              View load
            </button>
          }
        />

        {view === "group" ? (
          <SessionGroupTable records={filteredGroupRecords} />
        ) : (
          <SessionPrivateTable records={filteredPrivateRecords} />
        )}
      </section>

      <DashboardModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create session"
        description="Session details"
        footer={
          <>
            <button type="button" className="mv-btn mv-btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={() => setIsModalOpen(false)}>
              Save session
            </button>
          </>
        }
      >
        <div className="dashboard-form-grid">
          <label className="dashboard-form-field">
            <span>Session title</span>
            <input
              className="dashboard-input"
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Coach</span>
            <input
              className="dashboard-input"
              value={formState.coachName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  coachName: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Session type</span>
            <select
              className="dashboard-select"
              value={formState.sessionType}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  sessionType: event.target.value as SessionView,
                }))
              }
            >
              <option value="group">Group</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Status</span>
            <select
              className="dashboard-select"
              value={formState.status}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  status: event.target.value as AdminSessionStatus,
                }))
              }
            >
              {adminSessionStatusFilters
                .filter((status) => status !== "All")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Day label</span>
            <input
              className="dashboard-input"
              value={formState.dayLabel}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  dayLabel: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Time label</span>
            <input
              className="dashboard-input"
              value={formState.timeLabel}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  timeLabel: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}

function SessionGroupTable({ records }: { records: AdminGroupSessionRecord[] }) {
  return (
    <div className="dashboard-data-region">
      {records.length === 0 ? (
        <DashboardEmptyState
          title="No group sessions match this view"
          description="Try a different search or reset the filters."
        />
      ) : (
        <>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Coach</th>
              <th>Status</th>
              <th>Capacity</th>
              <th>Timing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((session) => (
              <tr key={session.id}>
                <td>
                  <div className="dashboard-table__identity">
                    <strong>{session.title}</strong>
                    <span>{session.location}</span>
                  </div>
                </td>
                <td>{session.coachName}</td>
                <td>
                  <DashboardStatusBadge
                    label={session.status}
                    tone={getSessionTone(session.status)}
                  />
                </td>
                <td>
                  {session.enrolled}/{session.capacity}
                </td>
                <td>
                  {session.dayLabel}, {session.timeLabel}
                </td>
                <td>
                  <div className="dashboard-row-actions">
                    <button type="button" className="dashboard-inline-button">
                      Edit
                    </button>
                    <button type="button" className="dashboard-inline-button">
                      Open
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-mobile-list">
        {records.map((session) => (
          <article key={session.id} className="dashboard-record-card">
            <div className="dashboard-record-card__header">
              <div>
                <h3>{session.title}</h3>
                <p>{session.coachName}</p>
              </div>
              <DashboardStatusBadge
                label={session.status}
                tone={getSessionTone(session.status)}
              />
            </div>
            <div className="dashboard-record-card__meta">
              <span>{session.location}</span>
              <span>
                {session.enrolled}/{session.capacity} enrolled
              </span>
              <span>
                {session.dayLabel}, {session.timeLabel}
              </span>
            </div>
          </article>
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function SessionPrivateTable({
  records,
}: {
  records: AdminPrivateSessionRecord[];
}) {
  return (
    <div className="dashboard-data-region">
      {records.length === 0 ? (
        <DashboardEmptyState
          title="No private sessions match this view"
          description="Try a different search or reset the filters."
        />
      ) : (
        <>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Client</th>
              <th>Coach</th>
              <th>Status</th>
              <th>Focus</th>
              <th>Timing</th>
            </tr>
          </thead>
          <tbody>
            {records.map((session) => (
              <tr key={session.id}>
                <td>
                  <div className="dashboard-table__identity">
                    <strong>{session.title}</strong>
                    <span>{session.location}</span>
                  </div>
                </td>
                <td>{session.clientName}</td>
                <td>{session.coachName}</td>
                <td>
                  <DashboardStatusBadge
                    label={session.status}
                    tone={getSessionTone(session.status)}
                  />
                </td>
                <td>{session.focus}</td>
                <td>
                  {session.dayLabel}, {session.timeLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-mobile-list">
        {records.map((session) => (
          <article key={session.id} className="dashboard-record-card">
            <div className="dashboard-record-card__header">
              <div>
                <h3>{session.title}</h3>
                <p>{session.clientName}</p>
              </div>
              <DashboardStatusBadge
                label={session.status}
                tone={getSessionTone(session.status)}
              />
            </div>
            <div className="dashboard-record-card__meta">
              <span>{session.coachName}</span>
              <span>{session.focus}</span>
              <span>
                {session.dayLabel}, {session.timeLabel}
              </span>
            </div>
          </article>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
