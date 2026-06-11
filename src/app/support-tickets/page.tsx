"use client";

import Icon from "@/components/ui/Icon";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHandoffs,
  HandoffTicket,
  reopenHandoff,
  resolveHandoff,
} from "@/services/handoffs";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/shared/Button";
import CustomInput from "@/components/shared/inputField";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import Tabs from "@/components/shared/Tabs";

type StatusFilter = "open" | "closed" | "";

const statusTabs: Array<{ label: string; value: StatusFilter }> = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "All", value: "" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAgeHours(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 36e5));
}

function formatAge(value?: string | null) {
  const hours = getAgeHours(value);
  if (hours === null) return "No timestamp";
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h open`;
  return `${Math.floor(hours / 24)}d open`;
}

function compactSummary(summary?: string | null) {
  const text = (summary || "").trim();
  if (!text) return "No conversation summary yet.";
  return text.length > 220 ? `${text.slice(0, 220)}...` : text;
}

function cleanReason(reason?: string | null) {
  return (reason || "customer_requested_human").replaceAll("_", " ");
}

function getPriority(ticket: HandoffTicket) {
  if (ticket.status !== "open") return { label: "Closed", className: "bg-slate-100 text-slate-600" };
  const hours = getAgeHours(ticket.updated_at || ticket.created_at) ?? 0;
  if (hours >= 24) return { label: "High", className: "bg-rose-100 text-rose-700" };
  if (hours >= 8) return { label: "Medium", className: "bg-amber-100 text-amber-700" };
  return { label: "Normal", className: "bg-emerald-100 text-emerald-700" };
}

function MetricTile({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-default bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">{detail}</p>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="grid gap-4 border-b border-default px-5 py-5 last:border-b-0 lg:grid-cols-[1.1fr_1.3fr_280px]">
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-3 w-44 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-56 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="h-24 rounded-md bg-slate-100" />
    </div>
  );
}

export default function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{
    ticketId: number;
    action: "resolve" | "reopen";
  } | null>(null);
  const pageSize = 8;

  const ticketsQuery = useQuery({
    queryKey: ["handoff-tickets"],
    queryFn: () => getHandoffs(),
  });

  const invalidateTickets = () =>
    queryClient.invalidateQueries({ queryKey: ["handoff-tickets"] });

  const resolveMutation = useMutation({
    mutationFn: resolveHandoff,
    onSuccess: () => {
      ToasterUtils.success("Ticket resolved. Bot replies are resumed.");
      invalidateTickets();
    },
    onError: () => ToasterUtils.error("Unable to resolve ticket."),
    onSettled: () => setPendingAction(null),
  });

  const reopenMutation = useMutation({
    mutationFn: reopenHandoff,
    onSuccess: () => {
      ToasterUtils.success("Ticket reopened. Bot replies are paused.");
      invalidateTickets();
    },
    onError: () => ToasterUtils.error("Unable to reopen ticket."),
    onSettled: () => setPendingAction(null),
  });

  const allTickets = ticketsQuery.data || [];
  const counts = useMemo(() => {
    const open = allTickets.filter((ticket) => ticket.status === "open");
    const aged = open.filter((ticket) => (getAgeHours(ticket.updated_at || ticket.created_at) ?? 0) >= 8);
    return {
      open: open.length,
      aged: aged.length,
      closed: allTickets.filter((ticket) => ticket.status === "closed").length,
      total: allTickets.length,
    };
  }, [allTickets]);

  const tickets = useMemo(() => {
    if (!status) return allTickets;
    return allTickets.filter((ticket) => ticket.status === status);
  }, [allTickets, status]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [currentPage, tickets]);

  const isMutating = resolveMutation.isPending || reopenMutation.isPending;

  const resolveTicket = (ticket: HandoffTicket) => {
    setPendingAction({ ticketId: ticket.id, action: "resolve" });
    resolveMutation.mutate({
      ticketId: ticket.id,
      note: notes[ticket.id]?.trim(),
    });
  };

  const reopenTicket = (ticket: HandoffTicket) => {
    setPendingAction({ ticketId: ticket.id, action: "reopen" });
    reopenMutation.mutate(ticket.id);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="border-b border-default pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex w-fit items-center gap-2 rounded-md border border-default bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Icon name="fi:shield" size={14} />
              Handoff Operations
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Support Tickets
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Prioritize customer handoffs, capture resolution notes, and resume WhatsApp bot replies from a focused support queue.
            </p>
          </div>
          <Button
            text="Refresh Queue"
            icon="fi:refresh-cw"
            variant="outline"
            color="surface"
            onClick={() => invalidateTickets()}
            loading={ticketsQuery.isFetching}
            loaderType="bounce"
            disabled={ticketsQuery.isFetching}
            fullWidthOnMobile
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Open Queue"
          value={counts.open}
          detail="Customers waiting for a human reply."
          icon="fi:message-square"
          tone="bg-blue-50 text-blue-700"
        />
        <MetricTile
          label="Needs Attention"
          value={counts.aged}
          detail="Open tickets older than 8 hours."
          icon="fi:alert-circle"
          tone="bg-amber-50 text-amber-700"
        />
        <MetricTile
          label="Resolved"
          value={counts.closed}
          detail="Tickets closed with bot replies resumed."
          icon="fi:user-check"
          tone="bg-emerald-50 text-emerald-700"
        />
        <MetricTile
          label="Total Handoffs"
          value={counts.total}
          detail="All customer handoff records."
          icon="fi:clock"
          tone="bg-slate-100 text-slate-700"
        />
      </section>

      <section className="rounded-lg border border-default bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-default px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Agent Queue</h2>
            <p className="mt-1 text-sm text-muted">
              Showing {tickets.length} {status || "total"} tickets.
            </p>
          </div>
          <Tabs
            tabs={statusTabs.map((tab) => ({ key: tab.value || "all", name: tab.label }))}
            selectedTab={status || "all"}
            onTabChange={(value) => {
              setStatus(value === "all" ? "" : (value as StatusFilter));
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="hidden grid-cols-[1.1fr_1.3fr_280px] border-b border-default bg-surface-strong px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted lg:grid">
          <span>Customer</span>
          <span>Conversation Context</span>
          <span>Resolution Action</span>
        </div>

        <div>
          {ticketsQuery.isLoading ? (
            <>
              <TicketSkeleton />
              <TicketSkeleton />
              <TicketSkeleton />
            </>
          ) : null}

          {ticketsQuery.isError ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <Icon name="fi:alert-circle" size={22} />
              </div>
              <p className="mt-4 font-semibold text-foreground">Unable to load support tickets</p>
              <p className="mt-1 text-sm text-muted">Refresh the queue once the backend is reachable.</p>
            </div>
          ) : null}

          {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon name="fi:check-circle" size={22} />
              </div>
              <p className="mt-4 font-semibold text-foreground">No tickets in this view</p>
              <p className="mt-1 text-sm text-muted">The queue is clear for the selected status.</p>
            </div>
          ) : null}

          {paginatedTickets.map((ticket) => {
            const priority = getPriority(ticket);
            const isResolvingTicket =
              pendingAction?.ticketId === ticket.id && pendingAction.action === "resolve";
            const isReopeningTicket =
              pendingAction?.ticketId === ticket.id && pendingAction.action === "reopen";
            return (
              <article
                key={ticket.id}
                className="grid gap-5 border-b border-default px-5 py-5 transition hover:bg-surface-strong/60 last:border-b-0 lg:grid-cols-[1.1fr_1.3fr_280px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">#{ticket.id}</p>
                    <StatusBadge
                      status={ticket.status === "open" ? "Pending" : "Success"}
                      displayText={ticket.status}
                      className="cursor-default"
                    />
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${priority.className}`}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="mt-3 truncate text-base font-semibold text-foreground">
                    {ticket.phone || "Unknown customer"}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-1">
                    <span>Created {formatDateTime(ticket.created_at)}</span>
                    <span>Updated {formatDateTime(ticket.updated_at)}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-700 ring-1 ring-default dark:bg-slate-950 dark:text-slate-200">
                      {cleanReason(ticket.reason)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                      <Icon name="fi:clock" size={13} />
                      {formatAge(ticket.updated_at || ticket.created_at)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                    {compactSummary(ticket.summary)}
                  </p>
                </div>

                <div className="rounded-md border border-default bg-white p-3 dark:bg-slate-950">
                  {ticket.status === "open" ? (
                    <div className="space-y-3">
                      <CustomInput
                        value={notes[ticket.id] || ""}
                        onChange={(value) =>
                          setNotes((current) => ({
                            ...current,
                            [ticket.id]: value,
                          }))
                        }
                        placeholder="Add resolution note"
                        multiline
                        rows={3}
                      />
                      <Button
                        text="Resolve"
                        icon="fi:check-circle"
                        onClick={() => resolveTicket(ticket)}
                        disabled={isMutating}
                        loading={isResolvingTicket}
                        loaderType="bounce"
                        size="sm"
                        className="w-full"
                      />
                      <p className="text-xs leading-5 text-muted">
                        Closing resumes automated replies for this customer.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Ticket is closed</p>
                      <p className="text-xs leading-5 text-muted">
                        Reopen only if the customer needs human handling again.
                      </p>
                      <Button
                        text="Reopen"
                        icon="fi:rotate-ccw"
                        onClick={() => reopenTicket(ticket)}
                        disabled={isMutating}
                        loading={isReopeningTicket}
                        loaderType="bounce"
                        variant="outline"
                        color="surface"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length > pageSize ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalItems={tickets.length}
          />
        ) : null}
      </section>
    </div>
  );
}
