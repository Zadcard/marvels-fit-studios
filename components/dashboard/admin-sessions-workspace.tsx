"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Layers3, Pencil } from "lucide-react";

import {
  cancelAdminSession,
  deleteAdminSession,
  saveAdminSession,
} from "@/app/actions/admin-sessions";
import {
  assignClientToSession,
  removeClientFromSession,
} from "@/app/actions/admin-session-bookings";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { CoachOptionPicker } from "@/components/dashboard/coach-option-picker";
import { SessionTypePicker } from "@/components/dashboard/session-type-picker";
import {
  type AdminSessionCoachOption,
  type AdminSessionClientOption,
  type AdminSessionEditorRecord,
} from "@/lib/repositories/admin-session-repository";
import {
  adminSessionStatusFilters,
  type AdminGroupSessionRecord,
  type AdminPrivateSessionRecord,
  type AdminSessionStatus,
} from "@/lib/mocks/admin-sessions";

type SessionView = "group" | "private";
type SessionType = "GROUP" | "PRIVATE";
type SessionLifecycleStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELED";

type SessionFormState = {
  title: string;
  coachId: string;
  type: SessionType;
  status: SessionLifecycleStatus;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: string;
  description: string;
};

const emptySessionForm: SessionFormState = {
  title: "",
  coachId: "",
  type: "GROUP",
  status: "SCHEDULED",
  startsAt: "",
  endsAt: "",
  location: "",
  capacity: "12",
  description: "",
};

const sessionDayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const sessionTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function createDefaultSessionDateValues() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  const end = new Date(nextHour);
  end.setHours(end.getHours() + 1);

  return {
    startsAt: toDateTimeLocalValue(nextHour.toISOString()),
    endsAt: toDateTimeLocalValue(end.toISOString()),
  };
}

function getDashboardDayLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return sessionDayFormatter.format(date);
}

function mapEditorStatusToDisplay(
  status: SessionLifecycleStatus,
  type: SessionType,
  capacity: number | null,
  bookedClientCount: number
): AdminSessionStatus {
  if (status === "CANCELED") {
    return "Canceled";
  }

  if (status === "DRAFT") {
    return "Draft";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  const normalizedCapacity = type === "PRIVATE" ? 1 : capacity;

  if (
    normalizedCapacity !== null &&
    normalizedCapacity > 0 &&
    bookedClientCount >= normalizedCapacity
  ) {
    return "Waitlist";
  }

  return "Scheduled";
}

type AdminSessionsWorkspaceProps = {
  groupRecords: AdminGroupSessionRecord[];
  privateRecords: AdminPrivateSessionRecord[];
  editorRecords: AdminSessionEditorRecord[];
  coachOptions: AdminSessionCoachOption[];
  clientOptions: AdminSessionClientOption[];
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

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  const normalized = new Date(value);
  return normalized.toISOString();
}

function toFormState(
  record: AdminSessionEditorRecord | undefined,
  defaultCoachId: string
): SessionFormState {
  if (!record) {
    return {
      ...emptySessionForm,
      coachId: defaultCoachId,
      ...createDefaultSessionDateValues(),
    };
  }

  return {
    title: record.title,
    coachId: record.coachId,
    type: record.type,
    status: record.status,
    startsAt: toDateTimeLocalValue(record.startsAt),
    endsAt: toDateTimeLocalValue(record.endsAt),
    location: record.location,
    capacity:
      record.capacity === null || Number.isNaN(record.capacity)
        ? ""
        : String(record.capacity),
    description: record.description,
  };
}

export function AdminSessionsWorkspace({
  groupRecords,
  privateRecords,
  editorRecords,
  coachOptions,
  clientOptions,
}: AdminSessionsWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isCanceling, startCancelTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isAssigningClient, startAssignClientTransition] = useTransition();
  const [view, setView] = useState<SessionView>("group");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | AdminSessionStatus>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [currentGroupRecords, setCurrentGroupRecords] = useState(groupRecords);
  const [currentPrivateRecords, setCurrentPrivateRecords] = useState(privateRecords);
  const [currentEditorRecords, setCurrentEditorRecords] = useState(editorRecords);
  const [formState, setFormState] = useState<SessionFormState>(() =>
    toFormState(undefined, coachOptions[0]?.id ?? "")
  );
  const [selectedClientId, setSelectedClientId] = useState(clientOptions[0]?.id ?? "");
  const [selectedAssignedClientId, setSelectedAssignedClientId] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const sessionRecordMap = useMemo(
    () => new Map(currentEditorRecords.map((record) => [record.id, record])),
    [currentEditorRecords]
  );

  useEffect(() => {
    setCurrentGroupRecords(groupRecords);
    setCurrentPrivateRecords(privateRecords);
    setCurrentEditorRecords(editorRecords);
  }, [editorRecords, groupRecords, privateRecords]);

  const syncSessionViews = (
    sessionId: string,
    updater: (record: AdminSessionEditorRecord) => AdminSessionEditorRecord
  ) => {
    const currentRecord = sessionRecordMap.get(sessionId);

    if (!currentRecord) {
      return;
    }

    const nextRecord = updater(currentRecord);

    setCurrentEditorRecords((current) =>
      current.map((record) => (record.id === sessionId ? nextRecord : record))
    );

    const coachName =
      coachOptions.find((coach) => coach.id === nextRecord.coachId)?.fullName ??
      "Unassigned coach";
    const bookedClientCount = nextRecord.bookedClients.length;
    const displayStatus = mapEditorStatusToDisplay(
      nextRecord.status,
      nextRecord.type,
      nextRecord.capacity,
      bookedClientCount
    );
    const baseRecord = {
      id: nextRecord.id,
      title: nextRecord.title,
      coachName,
      dayLabel: getDashboardDayLabel(nextRecord.startsAt),
      timeLabel: sessionTimeFormatter.format(new Date(nextRecord.startsAt)),
      location: nextRecord.location || "Studio floor",
      status: displayStatus,
    };

    if (nextRecord.type === "PRIVATE") {
      setCurrentPrivateRecords((current) =>
        current.some((record) => record.id === sessionId)
          ? current.map((record) =>
              record.id === sessionId
                ? {
                    ...record,
                    ...baseRecord,
                    clientName: nextRecord.bookedClients[0]?.fullName ?? "Unassigned",
                    focus: nextRecord.description || "Private coaching block",
                  }
                : record
            )
          : current
      );

      setCurrentGroupRecords((current) =>
        current.filter((record) => record.id !== sessionId)
      );
      return;
    }

    setCurrentGroupRecords((current) =>
      current.some((record) => record.id === sessionId)
        ? current.map((record) =>
            record.id === sessionId
              ? {
                  ...record,
                  ...baseRecord,
                  capacity: nextRecord.capacity ?? Math.max(bookedClientCount, 1),
                  enrolled: bookedClientCount,
                }
              : record
          )
        : current
    );

    setCurrentPrivateRecords((current) =>
      current.filter((record) => record.id !== sessionId)
    );
  };

  const filteredGroupRecords = currentGroupRecords.filter((session) => {
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

  const filteredPrivateRecords = currentPrivateRecords.filter((session) => {
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

  const openCreateModal = () => {
    setEditingSessionId(null);
    setErrorMessage("");
    setFormState(toFormState(undefined, coachOptions[0]?.id ?? ""));
    setSelectedClientId(clientOptions[0]?.id ?? "");
    setSelectedAssignedClientId("");
    setClientSearchTerm("");
    setRosterSearchTerm("");
    setIsModalOpen(true);
  };

  const openEditModal = (sessionId: string) => {
    const record = sessionRecordMap.get(sessionId);
    setEditingSessionId(sessionId);
    setErrorMessage("");
    setFormState(toFormState(record, coachOptions[0]?.id ?? ""));
    setClientSearchTerm("");
    setRosterSearchTerm("");
    setSelectedAssignedClientId(record?.bookedClients[0]?.id ?? "");
    setSelectedClientId(
      clientOptions.find(
        (client) => !record?.bookedClients.some((booked) => booked.id === client.id)
      )?.id ?? clientOptions[0]?.id ?? ""
    );
    setIsModalOpen(true);
  };

  const handleSaveSession = () => {
    setErrorMessage("");

    startSaveTransition(async () => {
      try {
        await saveAdminSession({
          sessionId: editingSessionId,
          title: formState.title,
          description: formState.description,
          type: formState.type,
          status: formState.status,
          coachId: formState.coachId,
          location: formState.location,
          startsAt: toIsoDateTime(formState.startsAt),
          endsAt: toIsoDateTime(formState.endsAt),
          capacity:
            formState.type === "PRIVATE"
              ? 1
              : formState.capacity.trim() === ""
                ? null
                : Number(formState.capacity),
        });
        if (editingSessionId) {
          syncSessionViews(editingSessionId, (record) => ({
            ...record,
            title: formState.title,
            description: formState.description,
            type: formState.type,
            status: formState.status,
            coachId: formState.coachId,
            location: formState.location,
            startsAt: toIsoDateTime(formState.startsAt),
            endsAt: toIsoDateTime(formState.endsAt),
            capacity:
              formState.type === "PRIVATE"
                ? 1
                : formState.capacity.trim() === ""
                  ? null
                  : Number(formState.capacity),
          }));
        }
        setIsModalOpen(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save session."
        );
      }
    });
  };

  const handleCancelSession = (sessionId: string) => {
    setErrorMessage("");

    startCancelTransition(async () => {
      try {
        await cancelAdminSession(sessionId);
        syncSessionViews(sessionId, (record) => ({
          ...record,
          status: "CANCELED",
        }));
        if (editingSessionId === sessionId) {
          setIsModalOpen(false);
        }
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not cancel session."
        );
      }
    });
  };

  const handleAssignClient = () => {
    if (!editingSessionId || !resolvedSelectedClientId) {
      return;
    }

    setErrorMessage("");

    startAssignClientTransition(async () => {
      try {
        const selectedClient = clientOptions.find(
          (client) => client.id === resolvedSelectedClientId
        );
        await assignClientToSession(editingSessionId, resolvedSelectedClientId);
        syncSessionViews(editingSessionId, (record) => ({
          ...record,
          bookedClients:
            record.type === "PRIVATE"
              ? selectedClient
                ? [
                    {
                      id: selectedClient.id,
                      fullName: selectedClient.fullName,
                    },
                  ]
                : []
              : selectedClient
                ? [
                    ...record.bookedClients.filter(
                      (client) => client.id !== selectedClient.id
                    ),
                    {
                      id: selectedClient.id,
                      fullName: selectedClient.fullName,
                    },
                  ]
                : record.bookedClients,
        }));
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not assign client."
        );
      }
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    setErrorMessage("");

    startDeleteTransition(async () => {
      try {
        await deleteAdminSession(sessionId);
        setCurrentEditorRecords((current) =>
          current.filter((record) => record.id !== sessionId)
        );
        setCurrentGroupRecords((current) =>
          current.filter((record) => record.id !== sessionId)
        );
        setCurrentPrivateRecords((current) =>
          current.filter((record) => record.id !== sessionId)
        );
        if (editingSessionId === sessionId) {
          setIsModalOpen(false);
          setEditingSessionId(null);
        }
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not delete session."
        );
      }
    });
  };

  const handleRemoveClient = (clientId: string) => {
    if (!editingSessionId) {
      return;
    }

    setErrorMessage("");

    startAssignClientTransition(async () => {
      try {
        await removeClientFromSession(editingSessionId, clientId);
        syncSessionViews(editingSessionId, (record) => ({
          ...record,
          bookedClients: record.bookedClients.filter((client) => client.id !== clientId),
        }));
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not remove client."
        );
      }
    });
  };

  const editingRecord = editingSessionId
    ? sessionRecordMap.get(editingSessionId)
    : undefined;
  const availableClientOptions = clientOptions.filter(
    (client) =>
      !editingRecord?.bookedClients.some((bookedClient) => bookedClient.id === client.id)
  );
  const normalizedClientSearchTerm = clientSearchTerm.trim().toLowerCase();
  const filteredAvailableClientOptions = availableClientOptions.filter((client) =>
    normalizedClientSearchTerm.length === 0
      ? true
      : client.fullName.toLowerCase().includes(normalizedClientSearchTerm)
  );
  const normalizedRosterSearchTerm = rosterSearchTerm.trim().toLowerCase();
  const filteredBookedClients =
    editingRecord?.bookedClients.filter((client) =>
      normalizedRosterSearchTerm.length === 0
        ? true
        : client.fullName.toLowerCase().includes(normalizedRosterSearchTerm)
    ) ?? [];
  const resolvedSelectedClientId = filteredAvailableClientOptions.some(
    (client) => client.id === selectedClientId
  )
    ? selectedClientId
    : filteredAvailableClientOptions[0]?.id ?? "";
  const resolvedSelectedAssignedClientId = filteredBookedClients.some(
    (client) => client.id === selectedAssignedClientId
  )
    ? selectedAssignedClientId
    : filteredBookedClients[0]?.id ?? "";

  useEffect(() => {
    if (filteredAvailableClientOptions.length === 0) {
      if (selectedClientId !== "") {
        setSelectedClientId("");
      }
      return;
    }

    const isCurrentSelectionValid = filteredAvailableClientOptions.some(
      (client) => client.id === selectedClientId
    );

    if (!isCurrentSelectionValid) {
      setSelectedClientId(filteredAvailableClientOptions[0]?.id ?? "");
    }
  }, [filteredAvailableClientOptions, selectedClientId]);

  useEffect(() => {
    if (filteredBookedClients.length === 0) {
      if (selectedAssignedClientId !== "") {
        setSelectedAssignedClientId("");
      }
      return;
    }

    const isCurrentSelectionValid = filteredBookedClients.some(
      (client) => client.id === selectedAssignedClientId
    );

    if (!isCurrentSelectionValid) {
      setSelectedAssignedClientId(filteredBookedClients[0]?.id ?? "");
    }
  }, [filteredBookedClients, selectedAssignedClientId]);

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin sessions"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={openCreateModal}
          >
            <CalendarPlus size={16} />
            Create Session
          </button>
        }
      />

      {errorMessage ? (
        <div className="dashboard-empty-state" role="alert">
          <strong>Session update needs attention</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <section className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-segmented">
          <button
            type="button"
            className={
              view === "group"
                ? "dashboard-segmented__button dashboard-segmented__button--active"
                : "dashboard-segmented__button"
            }
            onClick={() => setView("group")}
          >
            Group sessions
          </button>
          <button
            type="button"
            className={
              view === "private"
                ? "dashboard-segmented__button dashboard-segmented__button--active"
                : "dashboard-segmented__button"
            }
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
              Live load
            </button>
          }
        />

        {view === "group" ? (
          <SessionGroupTable
            records={filteredGroupRecords}
            onEdit={openEditModal}
            onCancel={handleCancelSession}
            isCanceling={isCanceling}
          />
        ) : (
          <SessionPrivateTable
            records={filteredPrivateRecords}
            onEdit={openEditModal}
            onCancel={handleCancelSession}
            isCanceling={isCanceling}
          />
        )}
      </section>

      <DashboardModal
        open={isModalOpen}
        onClose={() => {
          setErrorMessage("");
          setIsModalOpen(false);
        }}
        title={editingSessionId ? "Edit session" : "Create session"}
        description="Session details"
        footer={
          <>
            {editingSessionId ? (
              <button
                type="button"
                className="mv-btn mv-btn-outline"
                onClick={() => handleCancelSession(editingSessionId)}
                disabled={
                  isCanceling ||
                  isSaving ||
                  isDeleting ||
                  editingRecord?.status === "CANCELED"
                }
              >
                {isCanceling ? "Canceling..." : "Cancel session"}
              </button>
            ) : null}
            {editingSessionId ? (
              <button
                type="button"
                className="mv-btn mv-btn-outline"
                onClick={() => handleDeleteSession(editingSessionId)}
                disabled={isDeleting || isSaving || isCanceling || isAssigningClient}
              >
                {isDeleting ? "Deleting..." : "Delete session"}
              </button>
            ) : null}
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => {
                setErrorMessage("");
                setIsModalOpen(false);
              }}
              disabled={isSaving || isCanceling || isDeleting || isAssigningClient}
            >
              Close
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={handleSaveSession}
              disabled={isSaving || isCanceling || isDeleting || isAssigningClient}
            >
              {isSaving
                ? "Saving..."
                : editingSessionId
                  ? "Save session"
                  : "Create session"}
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
          <div className="dashboard-form-field dashboard-form-field--wide">
            <span>Coach</span>
            <CoachOptionPicker
              value={formState.coachId}
              onChange={(coachId) =>
                setFormState((current) => ({ ...current, coachId }))
              }
              options={coachOptions}
            />
          </div>
          <label className="dashboard-form-field">
            <span>Session type</span>
            <SessionTypePicker
              value={formState.type}
              onChange={(nextType) =>
                setFormState((current) => ({
                  ...current,
                  type: nextType,
                  capacity: nextType === "PRIVATE" ? "1" : current.capacity || "12",
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Status</span>
            <select
              className="dashboard-select"
              value={formState.status}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  status: event.target.value as SessionLifecycleStatus,
                }))
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Starts at</span>
            <input
              type="datetime-local"
              className="dashboard-input"
              value={formState.startsAt}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  startsAt: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Ends at</span>
            <input
              type="datetime-local"
              className="dashboard-input"
              value={formState.endsAt}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  endsAt: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Location</span>
            <input
              className="dashboard-input"
              value={formState.location}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Capacity</span>
            <input
              type="number"
              min={formState.type === "PRIVATE" ? 1 : 1}
              max={formState.type === "PRIVATE" ? 1 : 100}
              disabled={formState.type === "PRIVATE"}
              className="dashboard-input"
              value={formState.type === "PRIVATE" ? "1" : formState.capacity}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  capacity: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Description</span>
            <input
              className="dashboard-input"
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
        {editingSessionId ? (
          <div className="dashboard-session-roster-grid">
            <div className="dashboard-panel dashboard-panel--nested">
              <div className="dashboard-panel__header">
                <div>
                  <div className="mv-eyebrow">Client assignment</div>
                  <h2>
                    {formState.type === "PRIVATE"
                      ? "Assign the client for this private session"
                      : "Add clients to this session"}
                  </h2>
                  <p>Bookings save directly to the database.</p>
                </div>
              </div>

              <div className="dashboard-form-grid">
                <label className="dashboard-form-field">
                  <span>Search clients</span>
                  <input
                    className="dashboard-input"
                    placeholder="Search by client name"
                    value={clientSearchTerm}
                    onChange={(event) => setClientSearchTerm(event.target.value)}
                  />
                </label>
                <label className="dashboard-form-field">
                  <span>Client</span>
                  <select
                    className="dashboard-select"
                    value={resolvedSelectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                    disabled={
                      filteredAvailableClientOptions.length === 0 || isAssigningClient
                    }
                  >
                    {filteredAvailableClientOptions.length > 0 ? (
                      filteredAvailableClientOptions.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {availableClientOptions.length === 0
                          ? formState.type === "PRIVATE"
                            ? "No client slots available"
                            : "No unassigned clients available"
                          : "No clients match this search"}
                      </option>
                    )}
                  </select>
                </label>
              </div>

              <div className="dashboard-row-actions">
                <button
                  type="button"
                  className="mv-btn mv-btn-primary"
                  onClick={handleAssignClient}
                  disabled={
                    isAssigningClient ||
                    filteredAvailableClientOptions.length === 0 ||
                    !resolvedSelectedClientId
                  }
                >
                  {isAssigningClient ? "Saving assignment..." : "Assign client"}
                </button>
              </div>
            </div>

            <div className="dashboard-panel dashboard-panel--nested">
              <div className="dashboard-panel__header">
                <div>
                  <div className="mv-eyebrow">Current roster</div>
                  <h2>
                    {editingRecord?.bookedClients.length ?? 0} client
                    {(editingRecord?.bookedClients.length ?? 0) === 1 ? "" : "s"} assigned
                  </h2>
                  <p>Unassign clients here whenever the roster changes.</p>
                </div>
              </div>

              <div className="dashboard-form-grid">
                <label className="dashboard-form-field">
                  <span>Search assigned clients</span>
                  <input
                    className="dashboard-input"
                    placeholder="Filter current roster"
                    value={rosterSearchTerm}
                    onChange={(event) => setRosterSearchTerm(event.target.value)}
                  />
                </label>
                <label className="dashboard-form-field">
                  <span>Assigned client</span>
                  <select
                    className="dashboard-select"
                    value={resolvedSelectedAssignedClientId}
                    onChange={(event) => setSelectedAssignedClientId(event.target.value)}
                    disabled={filteredBookedClients.length === 0 || isAssigningClient}
                  >
                    {filteredBookedClients.length > 0 ? (
                      filteredBookedClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {editingRecord?.bookedClients.length
                          ? "No assigned clients match this search"
                          : "No clients assigned yet"}
                      </option>
                    )}
                  </select>
                </label>
              </div>

              {filteredBookedClients.length > 0 ? (
                <div className="dashboard-selection-summary">
                  <strong>
                    {
                      filteredBookedClients.find(
                        (client) => client.id === resolvedSelectedAssignedClientId
                      )?.fullName
                    }
                  </strong>
                  <p>Selected booking ready to be removed from this session.</p>
                </div>
              ) : null}

              <div className="dashboard-row-actions">
                <button
                  type="button"
                  className="mv-btn mv-btn-outline"
                  onClick={() => {
                    if (resolvedSelectedAssignedClientId) {
                      handleRemoveClient(resolvedSelectedAssignedClientId);
                    }
                  }}
                  disabled={isAssigningClient || !resolvedSelectedAssignedClientId}
                >
                  {isAssigningClient ? "Saving..." : "Unassign client"}
                </button>
              </div>

              {editingRecord?.bookedClients.length && filteredBookedClients.length === 0 ? (
                <DashboardEmptyState
                  title="No assigned clients match this search"
                  description="Adjust the roster search to find the client you want to unassign."
                />
              ) : (
                !editingRecord?.bookedClients.length ? (
                  <DashboardEmptyState
                    title="No clients assigned yet"
                    description="Use the selector above to add the first booking."
                  />
                ) : null
              )}
            </div>
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}

function SessionGroupTable({
  records,
  onEdit,
  onCancel,
  isCanceling,
}: {
  records: AdminGroupSessionRecord[];
  onEdit: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
  isCanceling: boolean;
}) {
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
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => onEdit(session.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => onCancel(session.id)}
                          disabled={isCanceling}
                        >
                          Cancel
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
                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={() => onEdit(session.id)}
                  >
                    <Pencil size={14} />
                    Edit session
                  </button>
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={() => onCancel(session.id)}
                    disabled={isCanceling}
                  >
                    Cancel
                  </button>
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
  onEdit,
  onCancel,
  isCanceling,
}: {
  records: AdminPrivateSessionRecord[];
  onEdit: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
  isCanceling: boolean;
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
                    <td>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => onEdit(session.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => onCancel(session.id)}
                          disabled={isCanceling}
                        >
                          Cancel
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
                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={() => onEdit(session.id)}
                  >
                    Edit session
                  </button>
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={() => onCancel(session.id)}
                    disabled={isCanceling}
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
