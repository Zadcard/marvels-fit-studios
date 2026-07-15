"use client";
import {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Check,
  Download,
  FileSpreadsheet,
  Search,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  importClientCSV,
  previewClientImportCSV,
} from "@/app/actions/admin-bulk-import";
import type {
  BulkClientImportReport,
  BulkClientPreviewRow,
} from "@/lib/services/bulk-client-import";
import styles from "./admin-bulk-import-workspace.module.css";

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminBulkImportWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BulkClientPreviewRow[]>([]);
  const [report, setReport] = useState<BulkClientImportReport | null>(null);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [status, setStatus] = useState<"all" | "valid" | "invalid">("all");
  const [message, setMessage] = useState("Upload a CSV to begin validation.");
  const [dragging, setDragging] = useState(false);
  const [previewing, startPreview] = useTransition();
  const [importing, startImport] = useTransition();
  const busy = previewing || importing;
  const valid = rows.filter((row) => row.valid);
  const invalid = rows.length - valid.length;
  const visible = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (status === "all" || (status === "valid" ? row.valid : !row.valid)) &&
        (!q ||
          [row.fullName, row.groupName, row.phone, row.reason ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [deferred, rows, status]);
  function read(file: File) {
    setReport(null);
    setFileName(file.name);
    setMessage("Reading and validating CSV…");
    file
      .text()
      .then((content) => {
        setCsv(content);
        startPreview(async () => {
          try {
            const preview = await previewClientImportCSV(content);
            setRows(preview);
            setMessage(
              preview.length
                ? `${preview.length} rows parsed from ${file.name}.`
                : "No client rows found.",
            );
          } catch (caught) {
            setRows([]);
            setMessage(
              caught instanceof Error
                ? caught.message
                : "Could not preview CSV.",
            );
          }
        });
      })
      .catch(() => {
        setCsv("");
        setRows([]);
        setMessage("Could not read this file.");
      });
  }
  function runImport() {
    if (!csv || !valid.length) return;
    setMessage("Creating clients and credentials…");
    startImport(async () => {
      try {
        const next = await importClientCSV(csv);
        setReport(next);
        setMessage(next.summary);
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Import failed.");
      }
    });
  }
  return (
    <div className={styles.page} aria-busy={busy}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Roster migration</span>
          <h1>Move the roster in.</h1>
          <p>
            Upload, validate and create member accounts without losing
            visibility into a single row.
          </p>
        </div>
        <button
          className="mv-btn mv-btn-primary"
          type="button"
          onClick={runImport}
          disabled={busy || !valid.length}
        >
          <UploadCloud size={17} />
          {importing ? "Importing…" : `Import All · ${valid.length} ready`}
        </button>
      </header>
      <section className={styles.steps} aria-label="Import workflow">
        <article data-active={!rows.length || undefined}>
          <span>01</span>
          <div>
            <strong>Upload</strong>
            <small>Select a structured CSV.</small>
          </div>
        </article>
        <article data-active={(rows.length > 0 && !report) || undefined}>
          <span>02</span>
          <div>
            <strong>Validate</strong>
            <small>Review every parsed row.</small>
          </div>
        </article>
        <article data-active={!!report || undefined}>
          <span>03</span>
          <div>
            <strong>Import</strong>
            <small>Generate client access.</small>
          </div>
        </article>
      </section>
      <section className={styles.scoreboard}>
        <article>
          <span>Parsed rows</span>
          <strong>{rows.length}</strong>
          <small>{fileName || "No file selected"}</small>
        </article>
        <article>
          <span>Ready</span>
          <strong>{valid.length}</strong>
          <small>Valid member records</small>
        </article>
        <article data-alert={invalid > 0 || undefined}>
          <span>Needs review</span>
          <strong>{invalid}</strong>
          <small>Rows blocked from import</small>
        </article>
        <article className={styles.blackCard}>
          <span>Success rate</span>
          <strong>{report ? `${report.successRate}%` : "—"}</strong>
          <small>{report ? report.summary : "Calculated after import"}</small>
        </article>
      </section>
      <section className={styles.upload}>
        <div>
          <span className={styles.kicker}>CSV source</span>
          <h2>Bring a clean roster file</h2>
          <p>{message}</p>
        </div>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) read(file);
            e.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          data-dragging={dragging || undefined}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) read(file);
          }}
        >
          <UploadCloud size={28} />
          <strong>{fileName || "Drop CSV here or click to upload"}</strong>
          <span>Expected columns: fullName,groupName,phone</span>
        </button>
        <div className={styles.uploadActions}>
          <button
            type="button"
            className="mv-btn mv-btn-secondary"
            onClick={() =>
              downloadText(
                "marvel-client-import-template.csv",
                "fullName,groupName,phone\nSample Member,Strength Lab,+201000000000\n",
              )
            }
          >
            <Download size={16} />
            Download template
          </button>
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet size={16} />
            Choose CSV
          </button>
        </div>
      </section>
      <section className={styles.preview}>
        <div className={styles.previewHead}>
          <div>
            <span className={styles.kicker}>Validation table</span>
            <h2>
              {rows.length
                ? `${visible.length} rows in view`
                : "Waiting for a file"}
            </h2>
          </div>
          {rows.length ? (
            <div className={styles.filters}>
              <label>
                <Search size={16} />
                <span className="sr-only">Search preview</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search rows"
                />
              </label>
              <div>
                {(["all", "valid", "invalid"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    data-active={status === item || undefined}
                    onClick={() => setStatus(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {rows.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Member</th>
                  <th>Group</th>
                  <th>Phone</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={`${row.rowNumber}-${row.phone}`}
                    data-invalid={!row.valid || undefined}
                  >
                    <td>{row.rowNumber}</td>
                    <td>
                      <strong>{row.fullName || "Missing name"}</strong>
                    </td>
                    <td>{row.groupName || "No group"}</td>
                    <td>{row.phone || "Missing phone"}</td>
                    <td>
                      <span
                        className={row.valid ? styles.ready : styles.blocked}
                      >
                        {row.valid ? (
                          <>
                            <Check size={14} />
                            Ready
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            {row.reason}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>
            <FileSpreadsheet size={28} />
            <strong>No preview yet</strong>
            <span>Upload the template or your own CSV to validate rows.</span>
          </div>
        )}
      </section>
      {report ? (
        <section className={styles.report}>
          <div className={styles.reportHead}>
            <div>
              <span className={styles.kicker}>Import report</span>
              <h2>Credentials generated</h2>
              <p>{report.summary}</p>
            </div>
            <button
              className="mv-btn mv-btn-primary"
              type="button"
              disabled={!report.successfulImports.length}
              onClick={() =>
                downloadText(
                  `marvel-client-credentials-${new Date().toISOString().slice(0, 10)}.csv`,
                  report.credentialsCsv,
                )
              }
            >
              <Download size={16} />
              Download credentials
            </button>
          </div>
          <div className={styles.reportGrid}>
            <article>
              <span>Imported</span>
              <strong>{report.successfulImports.length}</strong>
            </article>
            <article>
              <span>Failed</span>
              <strong>{report.failedImports.length}</strong>
            </article>
            <article>
              <span>Duplicates</span>
              <strong>{report.duplicatePhones}</strong>
            </article>
          </div>
          {report.failedImports.length ? (
            <ul>
              {report.failedImports.map((item) => (
                <li key={`${item.rowNumber}-${item.phone}`}>
                  <b>Row {item.rowNumber}</b>
                  <span>{item.fullName || item.phone}</span>
                  <em>{item.reason}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.allGood}>
              <Check size={17} />
              Every imported row completed successfully.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
