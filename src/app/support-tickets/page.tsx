"use client";

import Icon from "@/components/ui/Icon";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHandoffs,
  reopenHandoff,
  resolveHandoff,
} from "@/services/handoffs";
import type { HandoffMessage, HandoffTicket } from "@/services/handoffs";
import { sendLiveChatMessage } from "@/services/liveChat";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/shared/Button";
import CustomInput from "@/components/shared/inputField";

type StatusFilter = "open" | "pending" | "resolved" | "";

const statusTabs: Array<{ label: string; value: StatusFilter }> = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "" },
];

function asText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function titleCase(value?: string | null) {
  return asText(value || "customer requested human")
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

function formatMessageTime(value?: string | null) {
  if (!value) return "";
  const text = value.trim();
  if (/^\d{1,2}:\d{2}(?:\s?[ap]m)?$/i.test(text)) return text;
  return formatDateTime(value);
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

function customerName(ticket: HandoffTicket) {
  return (
    asText(ticket.customer_name) ||
    asText(ticket.name) ||
    asText(ticket.profile_name) ||
    asText(ticket.phone) ||
    "Unknown customer"
  );
}

function initials(ticket: HandoffTicket) {
  const source = customerName(ticket);
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function statusGroup(ticket: HandoffTicket): StatusFilter {
  const status = asText(ticket.status).toLowerCase();
  if (status === "closed" || status === "resolved") return "resolved";
  if (status === "pending") return "pending";
  if (status === "open") return "open";
  return "";
}

function priority(ticket: HandoffTicket) {
  const fromApi = asText(ticket.priority);
  if (fromApi) return fromApi;
  if (statusGroup(ticket) === "resolved") return "Closed";
  const hours = getAgeHours(ticket.updated_at || ticket.created_at) ?? 0;
  if (hours >= 24) return "High";
  if (hours >= 8) return "Normal";
  return "Normal";
}

function priorityClass(label: string) {
  const value = label.toLowerCase();
  if (value.includes("high")) return "border-rose-200 bg-rose-50 text-rose-700";
  if (value.includes("normal")) return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function ticketTags(ticket: HandoffTicket) {
  const tags = Array.isArray(ticket.tags) ? ticket.tags.map(asText).filter(Boolean) : [];
  if (tags.length) return tags;
  const reason = titleCase(ticket.reason);
  return [reason, statusGroup(ticket) === "resolved" ? "Resolved" : "Bot paused"];
}

function summary(ticket: HandoffTicket) {
  return asText(ticket.summary) || "No conversation summary returned by the API.";
}

function hasTranscriptMarkers(text?: string | null) {
  return /\b(incoming|outgoing|customer|user|client|agent|ai|bot|business|support|you)\s*:/i.test(
    asText(text),
  );
}

function contextSummary(ticket: HandoffTicket) {
  const text = asText(ticket.summary);
  if (!text) return "No conversation summary returned by the API.";
  if (hasTranscriptMarkers(text)) return "Conversation transcript is available below.";
  return text;
}

function shortSummary(ticket: HandoffTicket, length = 120) {
  const text = contextSummary(ticket);
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

function parseTranscriptText(text: string): HandoffMessage[] {
  const markerPattern = /\b(incoming|outgoing|customer|user|client|agent|ai|bot|business|support|you|resolved)\s*:/gi;
  const inlineParts: Array<{ speaker: string; body: string }> = [];
  const matches = [...text.matchAll(markerPattern)];

  if (matches.length) {
    matches.forEach((match, index) => {
      const start = (match.index || 0) + match[0].length;
      const end = matches[index + 1]?.index ?? text.length;
      const body = text.slice(start, end).trim();
      if (body) inlineParts.push({ speaker: match[1], body });
    });
  }

  if (inlineParts.length) {
    return inlineParts.map((part, index) => {
      const speaker = part.speaker.toLowerCase();
      const outbound = ["outgoing", "agent", "ai", "bot", "business", "support", "you"].includes(speaker);
      return {
        id: `transcript-inline-${index}`,
        message_body: part.body,
        direction: outbound ? "outgoing" : "incoming",
        sender: part.speaker,
      };
    });
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const parsed: HandoffMessage[] = [];

  lines.forEach((line, index) => {
    const match = line.match(
      /^(?:(\d{1,2}:\d{2}(?:\s?[ap]m)?)\s*)?(customer|user|client|agent|ai|bot|business|support|you)\s*[:\-]\s*(.+)$/i,
    );

    if (!match) {
      const previous = parsed[parsed.length - 1];
      if (previous) {
        previous.message_body = `${messageText(previous)} ${line}`.trim();
        return;
      }
      parsed.push({ id: `transcript-${index}`, message_body: line, direction: "incoming" });
      return;
    }

    const [, time, speaker, body] = match;
    const normalizedSpeaker = speaker.toLowerCase();
    const outbound = ["agent", "ai", "bot", "business", "support", "you"].includes(normalizedSpeaker);
    parsed.push({
      id: `transcript-${index}`,
      message_body: body,
      direction: outbound ? "outgoing" : "incoming",
      sender: speaker,
      timestamp: time || undefined,
    });
  });

  return parsed;
}

function ticketMessages(ticket: HandoffTicket) {
  const source = ticket.messages || ticket.conversation || ticket.transcript;
  if (!source) {
    const fallbackSummary = asText(ticket.summary);
    return hasTranscriptMarkers(fallbackSummary) ? parseTranscriptText(fallbackSummary) : [];
  }
  if (typeof source === "string") return parseTranscriptText(source);

  return source.flatMap((message, index) => {
    const text = messageText(message);
    if (!text.includes("\n")) return [message];

    const splitMessages = parseTranscriptText(text);
    if (splitMessages.length <= 1) return [message];
    return splitMessages.map((splitMessage) => ({
      ...splitMessage,
      id: `${message.id || index}-${splitMessage.id}`,
      created_at: message.created_at,
    }));
  });
}

function messageText(message: HandoffMessage) {
  return (
    asText(message.message_body) ||
    asText(message.body) ||
    asText(message.text) ||
    asText(message.content) ||
    asText(message.message_type && message.message_type !== "text" ? `[${message.message_type}]` : "")
  );
}

function parsePayload(payload: unknown) {
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return typeof payload === "object" ? (payload as Record<string, unknown>) : null;
}

function messageDisplay(message: HandoffMessage) {
  const rawText = messageText(message);
  const payload = parsePayload(message.payload);
  const typeFromPayload = asText(payload?.type || payload?.message_type);
  const typeFromMessage = asText(message.message_type);
  const prefixMatch = rawText.match(/^\[(buttons?|list|product_list|carousel|image|cta_url)\]\s*(.+)$/i);
  const type = (typeFromPayload || typeFromMessage || prefixMatch?.[1] || "text").toLowerCase();
  const title = asText(payload?.title) || asText(payload?.header) || prefixMatch?.[2] || rawText;
  const body = asText(payload?.body) || asText(payload?.body_text);
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const buttons = Array.isArray(payload?.buttons) ? payload.buttons : [];
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const media = payload?.media && typeof payload.media === "object" ? (payload.media as Record<string, unknown>) : null;
  const image = payload?.image && typeof payload.image === "object" ? (payload.image as Record<string, unknown>) : null;
  const imageUrl =
    asText(payload?.image_url) ||
    asText(payload?.media_url) ||
    asText(payload?.url) ||
    asText(payload?.link) ||
    asText(image?.link) ||
    asText(media?.link) ||
    asText(media?.url);
  const caption = asText(payload?.caption) || asText(media?.caption) || asText(image?.caption);

  return {
    body,
    buttons,
    caption,
    imageUrl,
    products,
    rows,
    text: prefixMatch ? prefixMatch[2] : rawText,
    title,
    type,
  };
}

function mediaUrl(source: string) {
  if (!source) return "";
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (!baseUrl) return source;
  return `${baseUrl.replace(/\/$/, "")}/${source.replace(/^\//, "")}`;
}

function optionLabel(option: unknown) {
  if (!option || typeof option !== "object") return asText(option);
  const record = option as Record<string, unknown>;
  return (
    asText(record.title) ||
    asText(record.text) ||
    asText(record.name) ||
    asText(record.label) ||
    asText(record.id)
  );
}

function optionDescription(option: unknown) {
  if (!option || typeof option !== "object") return "";
  const record = option as Record<string, unknown>;
  return asText(record.description) || asText(record.subtitle);
}

function isOutbound(message: HandoffMessage) {
  const direction = asText(message.direction).toLowerCase();
  const sender = asText(message.sender).toLowerCase();
  return ["out", "outgoing", "agent", "bot", "business"].some(
    (value) => direction === value || sender === value,
  );
}

function profileRows(ticket: HandoffTicket) {
  const profile = ticket.customer_profile || ticket.profile || {};
  return [
    ["Customer ID", profile.customer_id],
    ["Lifetime Value", profile.lifetime_value],
    ["Last Order", profile.last_order],
    ["Plan", profile.plan],
    ["Sentiment", profile.sentiment],
  ].filter(([, value]) => asText(value));
}

function timelineItems(ticket: HandoffTicket) {
  if (Array.isArray(ticket.timeline) && ticket.timeline.length) return ticket.timeline;
  return [
    {
      id: "created",
      title: "Ticket created",
      description: contextSummary(ticket),
      created_at: ticket.created_at,
    },
    ...(ticket.updated_at && ticket.updated_at !== ticket.created_at
      ? [
          {
            id: "updated",
            title: statusGroup(ticket) === "resolved" ? "Ticket resolved" : "Last updated",
            description: asText(ticket.resolution_note) || "Ticket status changed.",
            created_at: ticket.updated_at,
          },
        ]
      : []),
  ];
}

function matchesSearch(ticket: HandoffTicket, search: string) {
  const query = search.toLowerCase().trim();
  if (!query) return true;
  return [
    ticket.id,
    customerName(ticket),
    ticket.phone,
    ticket.reason,
    ticket.summary,
    ticket.status,
  ]
    .map(asText)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function QueueSkeleton() {
  return (
    <div className="grid gap-5 border-b border-default px-6 py-6 lg:grid-cols-[1.1fr_1.7fr_280px]">
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-3 w-44 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-56 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-10 rounded-full bg-slate-200" />
        <div className="h-10 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: string;
  tone: string;
}) {
  return (
    <section className="rounded-2xl border border-default bg-white p-6 shadow-default dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted">{label}</p>
          <p className="mt-5 text-4xl font-light leading-none text-foreground">{value}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tone}`}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="mt-5 text-xs leading-5 text-muted">{detail}</p>
    </section>
  );
}

function InteractiveBubbleContent({ message }: { message: HandoffMessage }) {
  const display = messageDisplay(message);
  const isList = display.type.includes("list");
  const isButtons = display.type.includes("button");
  const isImage = display.type.includes("image") || Boolean(display.imageUrl);
  const options = isList ? display.rows : isButtons ? display.buttons : display.products;

  if (isImage) {
    const src = mediaUrl(display.imageUrl);
    return (
      <div className="max-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm">
        {src ? (
          <img
            src={src}
            alt={display.caption || display.title || "WhatsApp image"}
            className="max-h-[320px] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-36 w-64 items-center justify-center bg-slate-100 text-slate-500">
            <Icon name="fi:image" size={28} />
          </div>
        )}
        {(display.caption || display.text.replace(/^\[image\]\s*/i, "")) ? (
          <div className="px-4 py-3">
            <p className="text-sm leading-5 text-slate-800">
              {display.caption || display.text.replace(/^\[image\]\s*/i, "")}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (!isList && !isButtons && !display.type.includes("carousel") && !display.type.includes("product")) {
    return <>{display.text}</>;
  }

  return (
    <div className="min-w-[210px] overflow-hidden rounded-xl border border-amber-200 bg-white text-left shadow-sm">
      <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Icon name={isList ? "fi:list" : "fi:mouse-pointer"} size={13} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
              {isList ? "List" : isButtons ? "Buttons" : "Interactive"}
            </p>
            <p className="truncate text-sm font-semibold text-slate-950">{display.title}</p>
          </div>
        </div>
        {display.body ? <p className="mt-2 text-xs leading-5 text-slate-600">{display.body}</p> : null}
      </div>

      {options.length ? (
        <div className="grid gap-1 p-2">
          {options.slice(0, 8).map((option, index) => {
            const label = optionLabel(option);
            const description = optionDescription(option);
            if (!label) return null;
            return (
              <div
                key={`${label}-${index}`}
                className={`rounded-lg border border-slate-200 px-3 py-2 ${
                  isButtons ? "text-center" : "text-left"
                }`}
              >
                <p className="text-sm font-semibold text-slate-950">{label}</p>
                {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<number, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [pendingAction, setPendingAction] = useState<{
    ticketId: number;
    action: "resolve" | "reopen" | "reply";
  } | null>(null);

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
      setSelectedTicketId(null);
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

  const replyMutation = useMutation({
    mutationFn: sendLiveChatMessage,
    onSuccess: (_data, variables) => {
      ToasterUtils.success("Reply sent on WhatsApp.");
      const ticket = allTickets.find((item) => item.phone === variables.to_no);
      if (ticket) setReplyDrafts((current) => ({ ...current, [ticket.id]: "" }));
      invalidateTickets();
    },
    onError: () => ToasterUtils.error("Unable to send WhatsApp reply."),
    onSettled: () => setPendingAction(null),
  });

  const allTickets = ticketsQuery.data || [];
  const selectedTicket = selectedTicketId
    ? allTickets.find((ticket) => ticket.id === selectedTicketId) || null
    : null;

  const counts = useMemo(
    () => {
      const openTickets = allTickets.filter((ticket) => statusGroup(ticket) === "open");
      return {
        open: openTickets.length,
        aged: openTickets.filter((ticket) => (getAgeHours(ticket.updated_at || ticket.created_at) ?? 0) >= 8).length,
        pending: allTickets.filter((ticket) => statusGroup(ticket) === "pending").length,
        resolved: allTickets.filter((ticket) => statusGroup(ticket) === "resolved").length,
        all: allTickets.length,
      };
    },
    [allTickets],
  );
  const nextBestTicket = useMemo(() => {
    const openTickets = allTickets.filter((ticket) => statusGroup(ticket) === "open");
    return openTickets.sort((first, second) => {
      const firstAge = getAgeHours(first.updated_at || first.created_at) ?? 0;
      const secondAge = getAgeHours(second.updated_at || second.created_at) ?? 0;
      return secondAge - firstAge;
    })[0] || allTickets[0] || null;
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      const group = statusGroup(ticket);
      const statusMatches = !status || group === status;
      return statusMatches && matchesSearch(ticket, search);
    });
  }, [allTickets, search, status]);
  const selectedStatusLabel = statusTabs.find((tab) => tab.value === status)?.label.toLowerCase() || "total";

  const isMutating = resolveMutation.isPending || reopenMutation.isPending || replyMutation.isPending;

  const resolveTicket = (ticket: HandoffTicket) => {
    setPendingAction({ ticketId: ticket.id, action: "resolve" });
    resolveMutation.mutate({
      ticketId: ticket.id,
      note: resolutionNotes[ticket.id]?.trim(),
    });
  };

  const reopenTicket = (ticket: HandoffTicket) => {
    setPendingAction({ ticketId: ticket.id, action: "reopen" });
    reopenMutation.mutate(ticket.id);
  };

  const sendReply = (ticket: HandoffTicket) => {
    const message = replyDrafts[ticket.id]?.trim();
    if (!message) {
      ToasterUtils.error("Type a reply before sending.");
      return;
    }
    if (!ticket.phone) {
      ToasterUtils.error("Customer phone number is missing.");
      return;
    }
    setPendingAction({ ticketId: ticket.id, action: "reply" });
    replyMutation.mutate({
      to_no: ticket.phone,
      message_body: message,
      temp_msg_id: `handoff-${ticket.id}-${Date.now()}`,
    });
  };

  if (selectedTicket) {
    const messages = ticketMessages(selectedTicket);
    const rows = profileRows(selectedTicket);
    const timeline = timelineItems(selectedTicket);
    const isResolving = pendingAction?.ticketId === selectedTicket.id && pendingAction.action === "resolve";
    const isReplying = pendingAction?.ticketId === selectedTicket.id && pendingAction.action === "reply";

    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <button
          type="button"
          onClick={() => setSelectedTicketId(null)}
          className="flex w-fit items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground"
        >
          <Icon name="fi:arrow-left" size={14} />
          Queue
          <Icon name="fi:chevron-right" size={13} />
          Ticket #{selectedTicket.id}
        </button>

        <section className="rounded-2xl border border-default bg-white p-7 shadow-default dark:bg-slate-950">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {initials(selectedTicket)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>#{selectedTicket.id}</span>
                  <span>-</span>
                  <span>{selectedTicket.channel || "WhatsApp"}</span>
                  <span>-</span>
                  <span>{formatAge(selectedTicket.updated_at || selectedTicket.created_at)}</span>
                </div>
                <h1 className="mt-1 truncate text-3xl font-semibold text-foreground">
                  {customerName(selectedTicket)}
                </h1>
                <p className="mt-1 text-sm font-medium text-primary">{selectedTicket.phone || "No phone"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ticketTags(selectedTicket).map((tag) => (
                    <Pill key={tag} className="border-blue-100 bg-blue-50 text-blue-700">
                      {tag}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button text="Snooze" icon="fi:clock" variant="outline" color="surface" size="sm" disabled />
              <Button text="Call back" icon="fi:phone" variant="outline" color="surface" size="sm" disabled />
              {statusGroup(selectedTicket) === "resolved" ? (
                <Button
                  text="Reopen ticket"
                  icon="fi:rotate-ccw"
                  variant="outline"
                  color="surface"
                  size="sm"
                  disabled={isMutating}
                  loading={pendingAction?.action === "reopen"}
                  loaderType="bounce"
                  onClick={() => reopenTicket(selectedTicket)}
                />
              ) : (
                <Button
                  text="Mark resolved"
                  icon="fi:check-circle"
                  color="surface"
                  size="sm"
                  disabled={isMutating}
                  loading={isResolving}
                  loaderType="bounce"
                  onClick={() => resolveTicket(selectedTicket)}
                />
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-6">
            <section className="overflow-hidden rounded-2xl border border-default bg-white shadow-default dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-default px-6 py-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted">Why this ticket exists</p>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">{titleCase(selectedTicket.reason)}</h2>
                </div>
                <span className="flex items-center gap-2 text-xs font-medium text-muted">
                  <Icon name="fi:activity" size={14} />
                  AI summary
                </span>
              </div>
              <div className="px-6 py-6">
                <div className="border-l border-blue-200 bg-surface px-5 py-5 text-sm leading-6 text-foreground">
                  {contextSummary(selectedTicket)}
                </div>

                <div className="mt-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted">
                    Conversation transcript
                  </p>
                  <div className="mt-4 flex min-h-[260px] flex-col gap-5">
                    {messages.length ? (
                      messages.map((message, index) => {
                        const text = messageText(message);
                        const outbound = isOutbound(message);
                        const display = messageDisplay(message);
                        const isInteractive =
                          display.type.includes("button") ||
                          display.type.includes("list") ||
                          display.type.includes("image") ||
                          display.type.includes("carousel") ||
                          display.type.includes("product") ||
                          Boolean(display.imageUrl);
                        if (!text && !display.imageUrl) return null;
                        return (
                          <div
                            key={message.id || index}
                            className={`flex w-full ${outbound ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex max-w-[86%] items-start gap-3 md:max-w-[70%] ${
                                outbound ? "flex-row-reverse" : ""
                              }`}
                            >
                              <div
                                className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                  outbound
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {outbound ? "A" : initials(selectedTicket).slice(0, 2)}
                              </div>
                              <div className={outbound ? "text-right" : ""}>
                                <div
                                  className={
                                    isInteractive
                                      ? "rounded-2xl bg-transparent p-0 text-sm leading-6"
                                      : `rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                                          outbound
                                            ? "rounded-tr-md bg-amber-100 text-slate-950"
                                            : "rounded-tl-md bg-blue-50 text-slate-950 dark:bg-slate-900 dark:text-slate-100"
                                        }`
                                  }
                                >
                                  <InteractiveBubbleContent message={message} />
                                </div>
                                {formatMessageTime(message.created_at || message.timestamp) ? (
                                  <p className="mt-1 text-[10px] font-medium text-muted">
                                    {formatMessageTime(message.created_at || message.timestamp)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-default px-5 py-8 text-center text-sm text-muted">
                        No transcript returned by the API.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-default bg-white p-6 shadow-default dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground">Reply to customer</h2>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Icon name="fi:activity" size={13} />
                  Tone suggestions enabled
                </span>
              </div>
              <CustomInput
                value={replyDrafts[selectedTicket.id] || ""}
                onChange={(value) =>
                  setReplyDrafts((current) => ({ ...current, [selectedTicket.id]: value }))
                }
                placeholder="Type your reply..."
                multiline
                rows={4}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {["Greet", "Apologise", "Confirm delivery", "Offer refund"].map((macro) => (
                    <button
                      key={macro}
                      type="button"
                      onClick={() =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [selectedTicket.id]: `${current[selectedTicket.id] || ""}${current[selectedTicket.id] ? " " : ""}/${macro.toLowerCase().replaceAll(" ", "-")}`,
                        }))
                      }
                      className="rounded-full border border-default px-3 py-1 text-xs font-medium text-muted transition hover:bg-surface hover:text-foreground"
                    >
                      {macro}
                    </button>
                  ))}
                </div>
                <Button
                  text="Send via WhatsApp"
                  icon="fi:send"
                  color="surface"
                  size="sm"
                  disabled={isMutating}
                  loading={isReplying}
                  loaderType="bounce"
                  onClick={() => sendReply(selectedTicket)}
                />
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-2xl border border-default bg-white p-6 shadow-default dark:bg-slate-950">
              <h2 className="text-base font-semibold text-foreground">Customer profile</h2>
              <div className="mt-5 grid gap-4">
                {rows.length ? (
                  rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</span>
                      <span className="text-right font-semibold text-foreground">{asText(value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted">No customer profile returned by the API.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-default bg-white p-6 shadow-default dark:bg-slate-950">
              <h2 className="text-base font-semibold text-foreground">Timeline</h2>
              <div className="mt-5 space-y-5 border-l border-default pl-5">
                {timeline.map((item, index) => (
                  <div key={item.id || index} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-slate-950 ring-2 ring-slate-200" />
                    <p className="text-[11px] font-semibold text-muted">{formatDateTime(item.created_at || item.timestamp)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.title || item.status || "Timeline event"}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description || "No detail provided."}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-[#17134a] p-6 text-white shadow-default">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Icon name="fi:check-circle" size={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Resolve handoff</h2>
                  <p className="mt-1 text-xs text-white/70">Add what fixed the issue.</p>
                </div>
              </div>
              <CustomInput
                value={resolutionNotes[selectedTicket.id] || ""}
                onChange={(value) =>
                  setResolutionNotes((current) => ({ ...current, [selectedTicket.id]: value }))
                }
                placeholder="Resolution note"
                multiline
                rows={4}
                className="mt-5"
              />
              <Button
                text={statusGroup(selectedTicket) === "resolved" ? "Already resolved" : "Resolve ticket"}
                icon="fi:check-circle"
                color="light"
                className="mt-4 w-full"
                disabled={isMutating || statusGroup(selectedTicket) === "resolved"}
                loading={isResolving}
                loaderType="bounce"
                onClick={() => resolveTicket(selectedTicket)}
              />
              <p className="mt-4 text-center text-xs text-white/70">
                Closing resumes automated replies for this customer.
              </p>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-default bg-white p-8 shadow-default dark:bg-slate-950">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Human handoff desk
          </div>
          <h1 className="mt-6 font-serif text-5xl font-normal leading-none text-foreground">
            Support Tickets
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-muted">
            See exactly why a customer left automation, review the conversation context, and close the loop with a resolution note without leaving the queue.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-default bg-background px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Queue health</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {counts.aged} aging {counts.aged === 1 ? "ticket" : "tickets"}
              </p>
            </div>
            <div className="rounded-xl border border-default bg-background px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Current view</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {filteredTickets.length} {selectedStatusLabel} {filteredTickets.length === 1 ? "ticket" : "tickets"}
              </p>
            </div>
            <div className="rounded-xl border border-default bg-background px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Automation</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Paused while open</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-[#17134a] p-7 text-white shadow-default">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">Next best action</p>
            <button
              type="button"
              disabled={!nextBestTicket}
              onClick={() => nextBestTicket && setSelectedTicketId(nextBestTicket.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
              aria-label="Open next ticket"
            >
              <Icon name="fi:arrow-up-right" size={16} />
            </button>
          </div>
          {nextBestTicket ? (
            <>
              <h2 className="mt-8 font-serif text-3xl font-normal leading-none">Ticket #{nextBestTicket.id}</h2>
              <p className="mt-4 text-sm font-semibold text-white">{customerName(nextBestTicket)}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/80">{shortSummary(nextBestTicket, 130)}</p>
              <Button
                text="Open ticket"
                icon="fi:refresh-cw"
                color="light"
                className="mt-7 w-full rounded-full"
                onClick={() => setSelectedTicketId(nextBestTicket.id)}
              />
            </>
          ) : (
            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-serif text-3xl font-normal leading-none">No ticket</h2>
              <p className="mt-4 text-sm leading-6 text-white/70">There is no handoff ticket returned by the API yet.</p>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open queue"
          value={counts.open}
          detail="Customers waiting for a human reply."
          icon="fi:message-square"
          tone="bg-blue-50 text-blue-700"
        />
        <MetricCard
          label="Needs attention"
          value={counts.aged}
          detail="Open tickets older than 8 hours."
          icon="fi:alert-triangle"
          tone="bg-amber-50 text-amber-700"
        />
        <MetricCard
          label="Resolved"
          value={counts.resolved}
          detail="Tickets closed with bot replies resumed."
          icon="fi:check-circle"
          tone="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          label="Total handoffs"
          value={counts.all}
          detail="All customer handoff records."
          icon="fi:clock"
          tone="bg-slate-100 text-slate-700"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-default bg-white shadow-default dark:bg-slate-950">
        <div className="flex flex-col gap-4 border-b border-default px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Agent queue</h1>
            <p className="mt-1 text-sm text-muted">
              Showing {filteredTickets.length} {selectedStatusLabel} tickets with handoff reason, customer context, and closure controls.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[280px]">
              <Icon name="fi:search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, phone, ticket"
                className="h-10 w-full rounded-full border border-default bg-background pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <Button
              text="Filter"
              icon="fi:filter"
              variant="outline"
              color="surface"
              size="sm"
              onClick={() => invalidateTickets()}
              loading={ticketsQuery.isFetching}
              loaderType="bounce"
            />
          </div>
        </div>

        <div className="flex border-b border-default px-6">
          {statusTabs.map((tab) => {
            const key = tab.value || "all";
            const count = key === "all" ? counts.all : counts[tab.value as "open" | "pending" | "resolved"];
            const active = status === tab.value;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={`relative px-5 py-3 text-sm font-medium transition ${
                  active ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs">{count}</span>
                {active ? <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
              </button>
            );
          })}
        </div>

        <div className="hidden grid-cols-[1.1fr_1.7fr_280px] border-b border-default bg-surface px-6 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-muted lg:grid">
          <span>Customer</span>
          <span>Why this ticket exists</span>
          <span className="text-right">Resolution</span>
        </div>

        {ticketsQuery.isLoading ? (
          <>
            <QueueSkeleton />
            <QueueSkeleton />
          </>
        ) : null}

        {ticketsQuery.isError ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Icon name="fi:alert-circle" size={22} />
            </div>
            <p className="mt-4 font-semibold text-foreground">Unable to load support tickets</p>
            <p className="mt-1 text-sm text-muted">Refresh the queue once the backend is reachable.</p>
          </div>
        ) : null}

        {!ticketsQuery.isLoading && !ticketsQuery.isError && filteredTickets.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Icon name="fi:check-circle" size={22} />
            </div>
            <p className="mt-4 font-semibold text-foreground">No tickets in this view</p>
            <p className="mt-1 text-sm text-muted">The queue is clear for the selected filters.</p>
          </div>
        ) : null}

        {filteredTickets.map((ticket) => {
          const ticketPriority = priority(ticket);
          return (
            <article
              key={ticket.id}
              className="grid gap-5 border-b border-default px-6 py-6 transition last:border-b-0 hover:bg-surface/70 lg:grid-cols-[1.1fr_1.7fr_280px]"
            >
              <div className="flex min-w-0 gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {initials(ticket)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted">#{ticket.id}</span>
                    <Pill className="border-amber-200 bg-amber-50 text-amber-700">{titleCase(ticket.status)}</Pill>
                    <Pill className={priorityClass(ticketPriority)}>{ticketPriority}</Pill>
                  </div>
                  <h2 className="mt-2 truncate text-base font-semibold text-foreground">{customerName(ticket)}</h2>
                  <p className="mt-1 truncate text-sm text-primary">{ticket.phone || "No phone"}</p>
                  <p className="mt-3 text-xs text-muted">Updated {formatDateTime(ticket.updated_at || ticket.created_at)}</p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    {titleCase(ticket.reason)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Icon name="fi:clock" size={13} />
                    {formatAge(ticket.updated_at || ticket.created_at)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground">{contextSummary(ticket)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ticketTags(ticket).slice(0, 3).map((tag) => (
                    <Pill key={tag} className="border-default bg-white text-muted dark:bg-slate-950">
                      {tag}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <Button
                  text="Open ticket"
                  icon="fi:arrow-up-right"
                  iconPosition="right"
                  color="surface"
                  className="w-full rounded-full"
                  onClick={() => setSelectedTicketId(ticket.id)}
                />
                <Button
                  text="Snooze 1h"
                  icon="fi:clock"
                  variant="outline"
                  color="surface"
                  className="w-full rounded-full"
                  disabled
                />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
