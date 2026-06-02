"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiBarChart2,
  FiCheckCircle,
  FiDollarSign,
  FiExternalLink,
  FiList,
  FiMousePointer,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import Pagination from "@/components/Common/Pagination";
import { getCommerceDashboard } from "@/services/aiAgentApis";
import {
  AnalyticsGroup,
  WhatsappAnalyticsEvent,
  getWhatsappAnalyticsEvents,
  getWhatsappAnalyticsSummary,
} from "@/services/whatsappAnalytics";

const eventLabels: Record<string, string> = {
  button_click: "Button clicks",
  list_click: "List clicks",
  link_click: "Link clicks",
};

const dayOptions = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

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

function shortUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return value;
  }
}

function eventLabel(value?: string | null) {
  return eventLabels[value || ""] || value || "-";
}

function itemLabel(item: AnalyticsGroup) {
  return (
    item.title ||
    item.interaction_id ||
    shortUrl(item.target_url) ||
    item.phone ||
    eventLabel(item.event_type)
  );
}

function eventTone(eventType?: string | null) {
  if (eventType === "link_click") return "border-blue-200 bg-blue-50 text-blue-700";
  if (eventType === "list_click") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatMetric(value: unknown) {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.trim()) return value;
  return "0";
}

function getRecordNumber(data: unknown, keys: string[]) {
  if (!data || typeof data !== "object") return 0;
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function StatCard({
  label,
  value,
  icon,
  detail,
  accent = "text-primary",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  detail: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-default bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-sm dark:bg-slate-950 ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">{detail}</p>
    </div>
  );
}

function HealthStrip({
  total,
  contacts,
  links,
  orders,
}: {
  total: number;
  contacts: number;
  links: number;
  orders: number;
}) {
  const checks = [
    { label: "Tracking events", ok: total > 0 },
    { label: "Active contacts", ok: contacts > 0 },
    { label: "Product clicks", ok: links > 0 },
    { label: "Commerce feed", ok: orders > 0 },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center justify-between rounded-lg border border-default bg-surface px-4 py-3">
          <span className="text-sm font-medium text-muted">{check.label}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
              check.ok
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
            }`}
          >
            <FiCheckCircle size={13} />
            {check.ok ? "Live" : "Waiting"}
          </span>
        </div>
      ))}
    </section>
  );
}

function BarList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: AnalyticsGroup[];
  emptyText: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.count || 0));
  return (
    <section className="rounded-lg border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4 p-5">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{emptyText}</p>
        ) : null}
        {items.slice(0, 8).map((item, index) => {
          const label = itemLabel(item);
          return (
            <div key={`${label}-${index}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                  {item.event_type ? (
                    <p className="mt-1 text-xs text-muted">{eventLabel(item.event_type)}</p>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {(item.count || 0).toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-strong">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(6, ((item.count || 0) / max) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventRow({ event }: { event: WhatsappAnalyticsEvent }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-default px-4 py-4 last:border-b-0 md:grid-cols-[170px_1fr_160px_150px] md:items-center">
      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${eventTone(event.event_type)}`}>
        {eventLabel(event.event_type)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {event.title || event.interaction_id || shortUrl(event.target_url) || "-"}
        </p>
        <p className="mt-1 truncate text-xs text-muted">
          {event.target_url || event.message_id || event.source || "-"}
        </p>
      </div>
      <span className="text-sm text-muted">{event.phone || "-"}</span>
      <span className="text-xs text-muted">{formatDateTime(event.created_at)}</span>
    </div>
  );
}

export default function WhatsappAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [eventType, setEventType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const offset = (currentPage - 1) * pageSize;

  const summaryQuery = useQuery({
    queryKey: ["whatsapp-analytics-summary", days],
    queryFn: () => getWhatsappAnalyticsSummary(days),
  });

  const eventsQuery = useQuery({
    queryKey: ["whatsapp-analytics-events", currentPage, eventType],
    queryFn: () =>
      getWhatsappAnalyticsEvents({
        limit: pageSize,
        offset,
        eventType,
      }),
  });

  const commerceQuery = useQuery({
    queryKey: ["commerce-dashboard", days],
    queryFn: () => getCommerceDashboard(days),
  });

  const eventCounts = useMemo(() => {
    const rows = summaryQuery.data?.by_event_type || [];
    return rows.reduce<Record<string, number>>((acc, row) => {
      if (row.event_type) acc[row.event_type] = row.count || 0;
      return acc;
    }, {});
  }, [summaryQuery.data]);

  const totalItems = eventsQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const totalInteractions = summaryQuery.data?.total || 0;
  const activeContacts = summaryQuery.data?.by_phone?.length || 0;
  const linkClicks = eventCounts.link_click || 0;
  const orders = getRecordNumber(commerceQuery.data, ["orders", "total_orders", "order_count"]);
  const revenue = getRecordNumber(commerceQuery.data, ["revenue", "total_revenue", "sales"]);
  const recovered = getRecordNumber(commerceQuery.data, ["carts_recovered", "recovered_carts", "cart_recoveries"]);
  const engagementRate = activeContacts ? Math.round(totalInteractions / activeContacts) : 0;

  const refreshAll = () => {
    summaryQuery.refetch();
    eventsQuery.refetch();
    commerceQuery.refetch();
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="border-b border-default pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">WhatsApp Analytics</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Real-time interaction and commerce signals from WhatsApp AI conversations, including buttons, lists, product clicks, and store outcomes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-default bg-surface p-1">
              {dayOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDays(option.value)}
                  className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                    days === option.value
                      ? "bg-primary text-background"
                      : "text-muted hover:bg-surface-strong hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={refreshAll}
              disabled={summaryQuery.isFetching || eventsQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-md border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:opacity-60"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total interactions"
          value={totalInteractions}
          icon={<FiBarChart2 size={20} />}
          detail={`Last ${days} days`}
        />
        <StatCard
          label="Button clicks"
          value={eventCounts.button_click || 0}
          icon={<FiMousePointer size={20} />}
          detail="Reply button taps"
          accent="text-emerald-600"
        />
        <StatCard
          label="List selections"
          value={eventCounts.list_click || 0}
          icon={<FiList size={20} />}
          detail="Catalog and menu list picks"
          accent="text-violet-600"
        />
        <StatCard
          label="Link clicks"
          value={linkClicks}
          icon={<FiExternalLink size={20} />}
          detail="Tracked product URL opens"
          accent="text-blue-600"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Commerce revenue"
          value={formatMetric(revenue)}
          icon={<FiDollarSign size={20} />}
          detail={commerceQuery.isLoading ? "Loading store dashboard" : "From commerce dashboard API"}
          accent="text-emerald-600"
        />
        <StatCard
          label="Orders"
          value={formatMetric(orders)}
          icon={<FiShoppingBag size={20} />}
          detail="Orders in selected reporting window"
          accent="text-amber-600"
        />
        <StatCard
          label="Recovered carts"
          value={formatMetric(recovered)}
          icon={<FiRefreshCw size={20} />}
          detail="Recovered or attributed cart activity"
          accent="text-violet-600"
        />
        <StatCard
          label="Avg interactions/contact"
          value={engagementRate}
          icon={<FiTrendingUp size={20} />}
          detail={`${activeContacts.toLocaleString()} active contacts`}
          accent="text-blue-600"
        />
      </section>

      <HealthStrip
        total={totalInteractions}
        contacts={activeContacts}
        links={linkClicks}
        orders={orders}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <BarList
          title="Top Buttons And Links"
          items={summaryQuery.data?.by_button_or_link || []}
          emptyText={summaryQuery.isLoading ? "Loading analytics..." : "No clicks found yet."}
        />
        <BarList
          title="Most Active Contacts"
          items={summaryQuery.data?.by_phone || []}
          emptyText={summaryQuery.isLoading ? "Loading contacts..." : "No contact activity yet."}
        />
      </section>

      <section className="flex flex-col rounded-lg border border-default bg-surface">
        <div className="flex flex-col gap-3 border-b border-default bg-surface-strong px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Events</h2>
          <select
            value={eventType}
            onChange={(event) => {
              setEventType(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-default bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:bg-slate-950"
          >
            <option value="">All events</option>
            <option value="button_click">Button clicks</option>
            <option value="list_click">List clicks</option>
            <option value="link_click">Link clicks</option>
          </select>
        </div>

        <div>
          {eventsQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Loading events...</p>
          ) : null}

          {!eventsQuery.isLoading && (eventsQuery.data?.items || []).length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">No analytics events found.</p>
          ) : null}

          {(eventsQuery.data?.items || []).map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>

        {!eventsQuery.isLoading && totalItems > pageSize ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        ) : null}
      </section>
    </div>
  );
}
