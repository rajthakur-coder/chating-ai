"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import {
  getHandoffs,
  HandoffTicket,
  reopenHandoff,
  resolveHandoff,
} from "@/services/handoffs";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/Common/Button";
import CustomInput from "@/components/Common/inputField";
import Pagination from "@/components/Common/Pagination";
import StatusBadge from "@/components/Common/StatusBadge";
import Tabs from "@/components/Common/Tabs";

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

function compactSummary(summary?: string | null) {
  const text = (summary || "").trim();
  if (!text) return "No conversation summary yet.";
  return text.length > 260 ? `${text.slice(0, 260)}...` : text;
}

export default function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
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
  });

  const reopenMutation = useMutation({
    mutationFn: reopenHandoff,
    onSuccess: () => {
      ToasterUtils.success("Ticket reopened. Bot replies are paused.");
      invalidateTickets();
    },
    onError: () => ToasterUtils.error("Unable to reopen ticket."),
  });

  const allTickets = ticketsQuery.data || [];
  const counts = useMemo(() => {
    return {
      open: allTickets.filter((ticket) => ticket.status === "open").length,
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
    resolveMutation.mutate({
      ticketId: ticket.id,
      note: notes[ticket.id]?.trim(),
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <section className="border-b border-default pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Support Tickets
            </h1>
            <p className="mt-2 text-sm text-muted">
              Resolve human handoff tickets to let the WhatsApp AI bot reply to
              that customer again.
            </p>
          </div>
          <Button
            text="Refresh"
            icon={FiRefreshCw}
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

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          tabs={statusTabs.map((tab) => ({ key: tab.value || "all", name: tab.label }))}
          selectedTab={status || "all"}
          onTabChange={(value) => {
            setStatus(value === "all" ? "" : (value as StatusFilter));
            setCurrentPage(1);
          }}
        />
        <span className="ml-auto self-center text-sm text-muted">
          Open {counts.open} · Closed {counts.closed} · Total {counts.total}
        </span>
      </section>

      <section className="flex flex-col rounded-lg border border-default bg-surface">
        <div className="grid grid-cols-[96px_1.1fr_1fr_1.6fr] border-b border-default bg-surface-strong px-4 py-3 text-xs font-semibold uppercase text-muted">
          <span>Ticket</span>
          <span>Customer</span>
          <span>Reason</span>
          <span>Action</span>
        </div>

        <div>
          {ticketsQuery.isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted">
              Loading tickets...
            </div>
          ) : null}

          {ticketsQuery.isError ? (
            <div className="px-4 py-10 text-center text-sm text-rose-600">
              Unable to load support tickets.
            </div>
          ) : null}

          {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted">
              No tickets found.
            </div>
          ) : null}

          {paginatedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="grid grid-cols-1 gap-4 border-b border-default px-4 py-4 last:border-b-0 lg:grid-cols-[96px_1.1fr_1fr_1.6fr]"
            >
              <div>
                <p className="font-semibold text-foreground">#{ticket.id}</p>
                <StatusBadge
                  status={ticket.status === "open" ? "Pending" : "Success"}
                  displayText={ticket.status}
                  className="mt-2 cursor-default"
                />
              </div>

              <div>
                <p className="font-medium text-foreground">{ticket.phone}</p>
                <p className="mt-1 text-xs text-muted">
                  Updated {formatDateTime(ticket.updated_at)}
                </p>
              </div>

              <div>
                <p className="text-sm text-foreground">
                  {ticket.reason || "customer_requested_human"}
                </p>
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted">
                  {compactSummary(ticket.summary)}
                </p>
              </div>

              <div className="space-y-3">
                {ticket.status === "open" ? (
                  <>
                    <CustomInput
                      value={notes[ticket.id] || ""}
                      onChange={(value) =>
                        setNotes((current) => ({
                          ...current,
                          [ticket.id]: value,
                        }))
                      }
                      placeholder="Resolution note"
                      multiline
                      rows={3}
                    />
                    <Button
                      text="Resolve and Resume Bot"
                      icon={FiCheckCircle}
                      onClick={() => resolveTicket(ticket)}
                      disabled={isMutating}
                      loading={resolveMutation.isPending}
                      loaderType="bounce"
                      size="sm"
                      fullWidthOnMobile
                    />
                  </>
                ) : (
                  <Button
                    text="Reopen Ticket"
                    onClick={() => reopenMutation.mutate(ticket.id)}
                    disabled={isMutating}
                    loading={reopenMutation.isPending}
                    loaderType="bounce"
                    variant="outline"
                    color="surface"
                    size="sm"
                    fullWidthOnMobile
                  />
                )}
              </div>
            </div>
          ))}
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
