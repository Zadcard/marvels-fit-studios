"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Dialog } from "radix-ui";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  MessageCircle,
  Save,
  Search,
  Target,
  UserRoundSearch,
  X,
} from "lucide-react";

import {
  savePrivateClientNote,
  uploadCoachFile,
} from "@/app/actions/coach-client-assets";
import {
  coachClientPlanFilters,
  coachClientStatusFilters,
  type CoachClientPlan,
  type CoachClientRecord,
  type CoachClientStatus,
} from "@/lib/dashboard/coach-client-record";
import { LAUNCH_TRANSFORMATION_ENABLED } from "@/lib/launch-scope";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import styles from "./coach-clients-workspace.module.css";

type Props = { records: CoachClientRecord[] };
type Sort = "name-asc" | "name-desc" | "status" | "plan";

function nextMove(status: CoachClientStatus) {
  if (status === "Needs check-in")
    return "Make direct contact before the next training block.";
  if (status === "Recovery focus")
    return "Keep the next touchpoint recovery-led and low friction.";
  if (status === "New this week")
    return "Simplify the first progression and reinforce confidence.";
  return "Maintain rhythm and capture the next proof point after training.";
}

export function CoachClientsWorkspace({ records }: Props) {
  const [pending, start] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<"All" | CoachClientStatus>("All");
  const [plan, setPlan] = useState<"All" | CoachClientPlan>("All");
  const [sort, setSort] = useState<Sort>("name-asc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((client) => {
      const matchesSearch =
        !query ||
        [
          client.fullName,
          client.currentFocus,
          client.trainingCategory,
          client.progressNote,
          client.planType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return (
        matchesSearch &&
        (status === "All" || client.status === status) &&
        (plan === "All" || client.planType === plan)
      );
    });
  }, [deferredSearch, plan, records, status]);
  const sorted = useMemo(
    () =>
      [...filtered].sort((left, right) => {
        if (sort === "name-desc")
          return right.fullName.localeCompare(left.fullName);
        if (sort === "status") return left.status.localeCompare(right.status);
        if (sort === "plan") return left.planType.localeCompare(right.planType);
        return left.fullName.localeCompare(right.fullName);
      }),
    [filtered, sort],
  );
  const paginated = paginateDashboardItems(sorted, page);
  const selected =
    filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const detail = records.find((item) => item.id === detailId) ?? null;

  useEffect(() => {
    setPage(1);
  }, [search, status, plan, sort]);
  useEffect(() => {
    if (!filtered.some((item) => item.id === selectedId))
      setSelectedId(filtered[0]?.id ?? "");
  }, [filtered, selectedId]);

  function openDetail(client: CoachClientRecord) {
    setSelectedId(client.id);
    setDetailId(client.id);
    setNote(client.privateNotes[0]?.content ?? "");
    setFileNote("");
    setMessage("");
  }
  function saveNote() {
    if (!detail) return;
    start(async () => {
      try {
        await savePrivateClientNote({
          clientId: detail.id,
          noteId: detail.privateNotes[0]?.id,
          content: note,
        });
        setMessage("Private coaching note saved.");
      } catch (caught) {
        setMessage(
          caught instanceof Error ? caught.message : "Could not save note.",
        );
      }
    });
  }
  function upload(scope: "client" | "group", formData: FormData) {
    if (!detail) return;
    const targetId = scope === "group" ? detail.groupId : detail.id;
    if (!targetId) return;
    formData.set("scope", scope);
    formData.set("targetId", targetId);
    formData.set("note", fileNote);
    start(async () => {
      try {
        await uploadCoachFile(formData);
        setFileNote("");
        setMessage(
          `${scope === "group" ? "Group" : "Client"} file uploaded. It expires in 3 days.`,
        );
      } catch (caught) {
        setMessage(
          caught instanceof Error ? caught.message : "Could not upload file.",
        );
      }
    });
  }

  const attention = records.filter(
    (item) => item.status === "Needs check-in" || item.hasInjuryAlert,
  ).length;

  return (
    <Dialog.Root
      open={!!detail}
      onOpenChange={(open) => !open && setDetailId(null)}
    >
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.kicker}>Coach roster</span>
            <h1>Know the person behind the plan.</h1>
            <p>
              See readiness, risk, timing and private coaching context before
              the next conversation.
            </p>
          </div>
          <UserRoundSearch />
        </header>

        <section className={styles.scoreboard}>
          <article>
            <span>Assigned</span>
            <strong>{String(records.length).padStart(2, "0")}</strong>
            <small>Members in your roster</small>
          </article>
          <article>
            <span>Visible now</span>
            <strong>{String(filtered.length).padStart(2, "0")}</strong>
            <small>After current filters</small>
          </article>
          <article data-alert={attention > 0 || undefined}>
            <span>Needs attention</span>
            <strong>{String(attention).padStart(2, "0")}</strong>
            <small>Check-in or injury flag</small>
          </article>
          <article data-dark>
            <span>Private plans</span>
            <strong>
              {String(
                records.filter((item) => item.planType === "Private").length,
              ).padStart(2, "0")}
            </strong>
            <small>One-to-one members</small>
          </article>
        </section>

        <section className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search member, focus or note"
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "All" | CoachClientStatus)
              }
            >
              {coachClientStatusFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Plan</span>
            <select
              value={plan}
              onChange={(event) =>
                setPlan(event.target.value as "All" | CoachClientPlan)
              }
            >
              {coachClientPlanFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="status">Status</option>
              <option value="plan">Plan</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("All");
              setPlan("All");
            }}
          >
            Reset
          </button>
        </section>

        <section className={styles.rosterLayout}>
          <div className={styles.cards}>
            {paginated.items.length ? (
              paginated.items.map((client) => (
                <article
                  key={client.id}
                  data-selected={selected?.id === client.id || undefined}
                  onClick={() => setSelectedId(client.id)}
                >
                  <header>
                    <div className={styles.avatar}>
                      {client.fullName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <span>{client.trainingCategory}</span>
                      <h2>{client.fullName}</h2>
                    </div>
                    <b data-status={client.status}>{client.status}</b>
                  </header>
                  <p>{client.progressNote}</p>
                  {client.hasInjuryAlert ? (
                    <div className={styles.injury}>
                      <AlertTriangle size={15} />
                      <span>
                        {client.injuryStatus}
                        {client.restrictions
                          ? ` · Avoid: ${client.restrictions}`
                          : ""}
                      </span>
                    </div>
                  ) : null}
                  <dl>
                    <div>
                      <dt>Plan</dt>
                      <dd>{client.planType}</dd>
                    </div>
                    <div>
                      <dt>Next</dt>
                      <dd>{client.nextSession}</dd>
                    </div>
                    <div>
                      <dt>Last touch</dt>
                      <dd>{client.lastTouchpoint}</dd>
                    </div>
                  </dl>
                  <footer>
                    {LAUNCH_TRANSFORMATION_ENABLED ? (
                      <Link
                        href={`/coach/clients/${client.id}/transformation`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Performance lab
                      </Link>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetail(client);
                      }}
                    >
                      Notes & files
                    </button>
                  </footer>
                </article>
              ))
            ) : (
              <div className={styles.empty}>
                <UserRoundSearch size={26} />
                <strong>No members match this view</strong>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatus("All");
                    setPlan("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <aside className={styles.intel}>
            {selected ? (
              <>
                <span className={styles.kicker}>Selected intelligence</span>
                <h2>{selected.fullName}</h2>
                <p>{selected.currentFocus}</p>
                <div className={styles.intelGrid}>
                  <div>
                    <span>Plan</span>
                    <strong>{selected.planType}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{selected.status}</strong>
                  </div>
                  <div>
                    <span>Next session</span>
                    <strong>{selected.nextSession}</strong>
                  </div>
                  <div>
                    <span>Group</span>
                    <strong>{selected.groupName}</strong>
                  </div>
                </div>
                {selected.hasInjuryAlert ||
                selected.injuryNotes ||
                selected.restrictions ? (
                  <div className={styles.alert}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>{selected.injuryStatus}</strong>
                      <p>{selected.injuryNotes || "Active injury flag"}</p>
                      {selected.restrictions ? (
                        <small>Avoid: {selected.restrictions}</small>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className={styles.next}>
                  <Target size={18} />
                  <div>
                    <strong>Suggested next move</strong>
                    <p>{nextMove(selected.status)}</p>
                  </div>
                </div>
                {LAUNCH_TRANSFORMATION_ENABLED ? (
                  <Link
                    className="mv-btn mv-btn-primary"
                    href={`/coach/clients/${selected.id}/transformation`}
                  >
                    Open performance lab
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="mv-btn mv-btn-outline"
                  onClick={() => openDetail(selected)}
                >
                  Open private workspace
                </button>
              </>
            ) : (
              <div className={styles.empty}>Select a member</div>
            )}
          </aside>
        </section>

        <footer className={styles.pagination}>
          <span>
            {paginated.totalItems
              ? `${paginated.startItem}–${paginated.endItem} of ${paginated.totalItems}`
              : "0 members"}
          </span>
          <div>
            <button
              type="button"
              aria-label="Previous page"
              disabled={paginated.page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft />
            </button>
            <strong>
              {paginated.page} / {paginated.pageCount}
            </strong>
            <button
              type="button"
              aria-label="Next page"
              disabled={paginated.page >= paginated.pageCount}
              onClick={() =>
                setPage((value) => Math.min(paginated.pageCount, value + 1))
              }
            >
              <ChevronRight />
            </button>
          </div>
        </footer>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <header>
            <div>
              <span className={styles.kicker}>Private coaching workspace</span>
              <Dialog.Title>{detail?.fullName ?? "Member"}</Dialog.Title>
              <Dialog.Description>{detail?.currentFocus}</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close">
              <X />
            </Dialog.Close>
          </header>
          {detail ? (
            <div className={styles.dialogBody}>
              {message ? (
                <p className={styles.message} role="status">
                  {message}
                </p>
              ) : null}
              <section className={styles.dialogSummary}>
                <div>
                  <span>Plan</span>
                  <strong>{detail.planType}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{detail.status}</strong>
                </div>
                <div>
                  <span>Next</span>
                  <strong>{detail.nextSession}</strong>
                </div>
                <div>
                  <span>Group</span>
                  <strong>{detail.groupName}</strong>
                </div>
              </section>
              {buildWhatsAppHref(detail.phone) ? (
                <a
                  className={styles.whatsapp}
                  href={buildWhatsAppHref(detail.phone) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} /> WhatsApp member
                </a>
              ) : null}
              <section className={styles.privateNote}>
                <h3>Coach-only note</h3>
                <p>Never shown in the member portal.</p>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <button
                  type="button"
                  className="mv-btn mv-btn-primary"
                  disabled={pending}
                  onClick={saveNote}
                >
                  <Save size={16} />
                  {pending ? "Saving…" : "Save private note"}
                </button>
                {detail.privateNotes.map((item) => (
                  <article key={item.id}>
                    <strong>{item.authorName}</strong>
                    <p>{item.content}</p>
                    <small>{item.updatedAtLabel}</small>
                  </article>
                ))}
              </section>
              <form
                className={styles.files}
                action={(formData) => upload("client", formData)}
              >
                <h3>Three-day file drop</h3>
                <p>Client downloads expire automatically.</p>
                <label>
                  <span>File</span>
                  <input type="file" name="file" />
                </label>
                <label>
                  <span>Context note</span>
                  <input
                    value={fileNote}
                    onChange={(event) => setFileNote(event.target.value)}
                  />
                </label>
                <div>
                  <button
                    type="submit"
                    className="mv-btn mv-btn-primary"
                    disabled={pending}
                  >
                    <FileUp size={16} />
                    Upload to member
                  </button>
                  {detail.groupId ? (
                    <button
                      type="submit"
                      className="mv-btn mv-btn-outline"
                      disabled={pending}
                      formAction={(formData) => upload("group", formData)}
                    >
                      <FileUp size={16} />
                      Upload to group
                    </button>
                  ) : null}
                </div>
                {detail.activeFiles.map((file) => (
                  <article key={file.id}>
                    <div>
                      <strong>{file.name}</strong>
                      <p>{file.note}</p>
                      <small>Expires {file.expiresAtLabel}</small>
                    </div>
                    <a href={`/api/files/${file.id}/download`}>
                      <Download size={15} /> Download
                    </a>
                  </article>
                ))}
              </form>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
