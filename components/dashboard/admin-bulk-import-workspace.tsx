"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Download, FileUp, UploadCloud } from "lucide-react";

import {
  importClientCSV,
  previewClientImportCSV,
} from "@/app/actions/admin-bulk-import";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import type {
  BulkClientImportReport,
  BulkClientPreviewRow,
} from "@/lib/services/bulk-client-import";

type DropState = "idle" | "over";

export function AdminBulkImportWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [dropState, setDropState] = useState<DropState>("idle");
  const [previewRows, setPreviewRows] = useState<BulkClientPreviewRow[]>([]);
  const [report, setReport] = useState<BulkClientImportReport | null>(null);
  const [message, setMessage] = useState(
    "Upload a CSV with fullName, groupName, and phone columns."
  );
  const [isPreviewing, startPreviewTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();

  const validRows = useMemo(
    () => previewRows.filter((row) => row.valid),
    [previewRows]
  );
  const invalidRows = previewRows.length - validRows.length;
  const isBusy = isPreviewing || isImporting;

  const readFile = (file: File) => {
    setReport(null);
    setMessage("Reading CSV...");
    setFileName(file.name);

    file
      .text()
      .then((content) => {
        setCsvContent(content);
        startPreviewTransition(async () => {
          try {
            const rows = await previewClientImportCSV(content);
            setPreviewRows(rows);
            setMessage(
              rows.length > 0
                ? `${rows.length} records parsed from ${file.name}.`
                : "No client records found in this CSV."
            );
          } catch (error) {
            setPreviewRows([]);
            setMessage(
              error instanceof Error ? error.message : "Could not preview CSV."
            );
          }
        });
      })
      .catch(() => {
        setCsvContent("");
        setPreviewRows([]);
        setMessage("Could not read this file.");
      });
  };

  const handleImport = () => {
    if (!csvContent || validRows.length === 0) {
      setMessage("Upload a CSV with at least one valid client before importing.");
      return;
    }

    setReport(null);
    setMessage("Importing clients and generating credentials...");
    startImportTransition(async () => {
      try {
        const nextReport = await importClientCSV(csvContent);
        setReport(nextReport);
        setMessage(nextReport.summary);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Import failed.");
      }
    });
  };

  const downloadCredentials = () => {
    if (!report?.credentialsCsv) {
      return;
    }

    const blob = new Blob([report.credentialsCsv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marvel-client-credentials-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Bulk import"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={handleImport}
            disabled={isBusy || validRows.length === 0}
          >
            <UploadCloud size={16} />
            {isImporting ? "Importing..." : "Import All"}
          </button>
        }
      />

      <section className="dashboard-mini-grid dashboard-admin-priority-grid">
        <DashboardMiniStat
          tone={previewRows.length > 0 ? "accent" : "neutral"}
          label="Total records"
          value={previewRows.length}
          description={fileName || "No CSV selected."}
        />
        <DashboardMiniStat
          tone={validRows.length > 0 ? "success" : "neutral"}
          label="Ready"
          value={validRows.length}
          description="Valid rows for import."
        />
        <DashboardMiniStat
          tone={invalidRows > 0 ? "warning" : "success"}
          label="Needs review"
          value={invalidRows}
          description="Rows that will not import."
        />
        <DashboardMiniStat
          tone={report ? "success" : "neutral"}
          label="Success rate"
          value={report ? `${report.successRate}%` : "Pending"}
          description="Calculated after import."
        />
      </section>

      <section className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <div className="dashboard-panel__header dashboard-panel__header--tight">
          <div>
            <div className="mv-eyebrow">CSV Upload</div>
            <h2>Import clients by full name, group, and phone</h2>
            <p>{message}</p>
          </div>
          <button
            type="button"
            className="mv-btn mv-btn-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
          >
            <FileUp size={16} />
            Choose CSV
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              readFile(file);
            }
            event.currentTarget.value = "";
          }}
        />

        <button
          type="button"
          className={`dashboard-import-dropzone ${
            dropState === "over" ? "dashboard-import-dropzone--over" : ""
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDropState("over");
          }}
          onDragLeave={() => setDropState("idle")}
          onDrop={(event) => {
            event.preventDefault();
            setDropState("idle");
            const file = event.dataTransfer.files?.[0];
            if (file) {
              readFile(file);
            }
          }}
          disabled={isBusy}
        >
          <UploadCloud size={28} />
          <strong>Drop CSV here or click to upload</strong>
          <span>Expected columns: fullName,groupName,phone</span>
        </button>

        {isBusy ? (
          <div className="dashboard-info-strip" role="status">
            <strong>{isImporting ? "Import in progress" : "Parsing CSV"}</strong>
            <p>Keep this page open until the current operation finishes.</p>
          </div>
        ) : null}
      </section>

      <section className="dashboard-panel dashboard-panel--dense">
        <div className="dashboard-panel__header dashboard-panel__header--tight">
          <div>
            <div className="mv-eyebrow">Preview</div>
            <h2>Parsed rows before import</h2>
            <p>Only valid rows are sent to account creation.</p>
          </div>
        </div>

        {previewRows.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Client</th>
                  <th>Group</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.phone}`}>
                    <td>{row.rowNumber}</td>
                    <td>
                      <div className="dashboard-table__identity">
                        <strong>{row.fullName || "Missing name"}</strong>
                      </div>
                    </td>
                    <td>{row.groupName || "No group"}</td>
                    <td>{row.phone || "Missing phone"}</td>
                    <td>{row.valid ? "Ready" : row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DashboardEmptyState
            title="No CSV preview yet"
            description="Upload a CSV to review rows before importing clients."
          />
        )}
      </section>

      {report ? (
        <section className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Import report</div>
              <h2>Generated credentials</h2>
              <p>{report.summary}</p>
            </div>
            <button
              type="button"
              className="mv-btn mv-btn-secondary"
              onClick={downloadCredentials}
              disabled={report.successfulImports.length === 0}
            >
              <Download size={16} />
              Download credentials CSV
            </button>
          </div>

          <div className="dashboard-panel__meta-strip">
            <span>Total: {report.totalRecords}</span>
            <span>Imported: {report.successfulImports.length}</span>
            <span>Failed: {report.failedImports.length}</span>
            <span>Success rate: {report.successRate}%</span>
          </div>

          {report.successfulImports.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Group</th>
                    <th>Client ID</th>
                    <th>Phone</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {report.successfulImports.map((client) => (
                    <tr key={client.clientId}>
                      <td>{client.fullName}</td>
                      <td>{client.groupName || "No group"}</td>
                      <td>{client.clientId}</td>
                      <td>{client.phone}</td>
                      <td>{client.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {report.failedImports.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Client</th>
                    <th>Group</th>
                    <th>Phone</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.failedImports.map((client) => (
                    <tr key={`${client.rowNumber}-${client.phone}`}>
                      <td>{client.rowNumber}</td>
                      <td>{client.fullName}</td>
                      <td>{client.groupName || "No group"}</td>
                      <td>{client.phone}</td>
                      <td>{client.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
