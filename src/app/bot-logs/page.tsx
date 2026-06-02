"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiRefreshCw } from "react-icons/fi";
import { AgentActionLog, getBotLogs } from "@/services/botLogs";
import Pagination from "@/components/Common/Pagination";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyJson(value?: string | null) {
  if (!value) return "-";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function logMatches(log: AgentActionLog, search: string) {
  if (!search.trim()) return true;
  const text = [
    log.phone,
    log.action_type,
    log.status,
    log.payload,
    log.result,
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(search.trim().toLowerCase());
}

export default function BotLogsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const offset = (currentPage - 1) * pageSize;

  const logsQuery = useQuery({
    queryKey: ["bot-logs", currentPage],
    queryFn: () => getBotLogs({ limit: pageSize, offset }),
  });

  const logs = useMemo(
    () => (logsQuery.data?.items || []).filter((log) => logMatches(log, search)),
    [logsQuery.data, search],
  );
  const totalItems = logsQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="border-b border-default pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Bot Logs</h1>
            <p className="mt-2 text-sm text-muted">
              Inspect what the bot understood, which tools ran, and where errors happened.
            </p>
          </div>
          <button
            type="button"
            onClick={() => logsQuery.refetch()}
            disabled={logsQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-md border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:opacity-60"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search phone, action, payload, error..."
        className="w-full rounded-md border border-default bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary dark:bg-slate-950"
      />

      <section className="flex flex-col rounded-lg border border-default bg-surface">
        <div className="grid grid-cols-[92px_1fr_150px_160px] border-b border-default bg-surface-strong px-4 py-3 text-xs font-semibold uppercase text-muted">
          <span>S.No</span>
          <span>Action</span>
          <span>Status</span>
          <span>Time</span>
        </div>

        <div>
          {logsQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Loading logs...</p>
          ) : null}

          {!logsQuery.isLoading && logs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">No logs found.</p>
          ) : null}

          {logs.map((log, index) => (
            <div key={log.id} className="border-b border-default last:border-b-0">
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === log.id ? null : log.id))}
                className="grid w-full grid-cols-1 gap-2 px-4 py-4 text-left transition hover:bg-surface-strong md:grid-cols-[92px_1fr_150px_160px] md:items-center"
              >
                <span className="text-sm font-semibold text-foreground">
                  {log.sr_no || offset + index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {log.action_type}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{log.phone || "-"}</span>
                </span>
                <span
                  className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${
                    log.status === "failed"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : log.status === "skipped"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {log.status}
                </span>
                <span className="text-xs text-muted">{formatDateTime(log.created_at)}</span>
              </button>
              {expandedId === log.id ? (
                <div className="grid gap-4 border-t border-default bg-surface-strong px-4 py-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted">Payload</p>
                    <pre className="max-h-80 overflow-auto rounded-md bg-white p-3 text-xs text-foreground dark:bg-slate-950">
                      {prettyJson(log.payload)}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted">Result</p>
                    <pre className="max-h-80 overflow-auto rounded-md bg-white p-3 text-xs text-foreground dark:bg-slate-950">
                      {prettyJson(log.result)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {!logsQuery.isLoading && totalItems > pageSize ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              setExpandedId(null);
            }}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        ) : null}
      </section>
    </div>
  );
}
