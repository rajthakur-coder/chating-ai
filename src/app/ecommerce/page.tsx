"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ecommerceApi } from "@/services/backendModules";
import Skeleton from "@/components/shared/Skeleton";

type AnyRecord = Record<string, unknown>;

function getListData(data: unknown) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const nested = (data as { data?: unknown; items?: unknown; results?: unknown }).data;
    if (Array.isArray(nested)) return nested;
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items;
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results;
  }
  return [];
}

function getListStatus(data: unknown) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") {
    const record = data as AnyRecord;
    if (record.reason === "live_api_mode") return "Live Shopify";
    if (record.source === "catalog_cache" && getListData(data).length === 0) return "Live Shopify";
    if (typeof record.status === "string") return record.status;
    const rows = getListData(data);
    if (rows.length) return rows.length;
  }
  return "loading";
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function textValue(record: AnyRecord, keys: string[], fallback = "-") {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return fallback;
}

function isActiveConnection(connection: AnyRecord) {
  const status = String(connection.status || "").toLowerCase();
  return status === "active" || status === "connected" || connection.bot_enabled === true;
}

function MetricCard({
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
    <div className="rounded-lg border border-default bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{detail}</p>
    </div>
  );
}

function HealthItem({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-default bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 truncate text-xs text-muted">{detail}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
          ok
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
        }`}
      >
        {ok ? <Icon name="fi:check-circle" size={13} /> : <Icon name="fi:alert-triangle" size={13} />}
        {ok ? "Ready" : "Needs work"}
      </span>
    </div>
  );
}

export default function EcommercePage() {
  const connections = useQuery({ queryKey: ["ecommerce-connections"], queryFn: ecommerceApi.connections });
  const bundles = useQuery({ queryKey: ["ecommerce-bundles"], queryFn: ecommerceApi.bundles });
  const isInitialLoading = connections.isLoading || bundles.isLoading;

  const connectionList = getListData(connections.data);
  const bundleList = getListData(bundles.data);
  const activeConnections = connectionList.filter((item) => isActiveConnection(asRecord(item))).length;

  const healthChecks = useMemo(
    () => [
      {
        label: "Store connected",
        ok: activeConnections > 0,
        detail: activeConnections ? `${activeConnections} active connection${activeConnections === 1 ? "" : "s"}` : "Connect Shopify or WooCommerce",
      },
      {
        label: "Cross-sell ready",
        ok: bundleList.length > 0,
        detail: bundleList.length ? `${bundleList.length} bundle pairings` : "Add pairings for better recommendations",
      },
    ],
    [activeConnections, bundleList.length],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 border-b border-default pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ecommerce Operations</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Store connection health and bundle readiness for the WhatsApp AI commerce agent.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/shopify-integration" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-default px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong">
            Shopify
            <Icon name="fi:arrow-right" size={15} />
          </Link>
          
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {isInitialLoading ? (
          <div className="md:col-span-2">
            <Skeleton type="card" rows={1} cardPerRow={2} cardHeight={76} />
          </div>
        ) : (
          <>
            <MetricCard label="Connections" value={getListStatus(connections.data)} detail={`${activeConnections} active`} icon="fi:truck" tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200" />
            <MetricCard label="Bundles" value={getListStatus(bundles.data)} detail="Cross-sell pairings" icon="fi:zap" tone="bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-200" />
          </>
        )}
      </section>

      {isInitialLoading ? (
        <Skeleton type="card" rows={1} cardPerRow={2} cardHeight={58} />
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {healthChecks.map((check) => (
            <HealthItem key={check.label} {...check} />
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-default bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Connected Stores</h2>
              <p className="mt-1 text-sm text-muted">Manage active store connections for commerce automation.</p>
            </div>
            <Icon name="fi:database" className="text-muted" size={20} />
          </div>
          <div className="mt-4 space-y-3">
            {connections.isLoading ? (
              <Skeleton type="text" rows={5} height={22} />
            ) : connectionList.length ? (
              connectionList.map((item, index) => {
                const connection = asRecord(item);
                const id = textValue(connection, ["id", "connection_id"], String(index));
                const active = isActiveConnection(connection);
                return (
                  <div key={id} className="rounded-md border border-default bg-white p-4 dark:bg-slate-950">
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{textValue(connection, ["store_name", "name", "shop", "myshopify_domain"], "Connected store")}</p>
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"}`}>
                            {textValue(connection, ["status"], active ? "active" : "pending")}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted">{textValue(connection, ["store_url", "myshopify_domain", "url"])}</p>
                        <p className="mt-1 text-xs text-muted">Platform: {textValue(connection, ["platform"], "shopify")}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-default bg-white px-4 py-10 text-center dark:bg-slate-950">
                <p className="font-semibold text-foreground">No ecommerce store connected</p>
                <p className="mt-2 text-sm text-muted">Connect a store to enable commerce automation.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">AI Commerce Readiness</h2>
          <div className="mt-4 space-y-3">
            {bundles.isLoading ? (
              <Skeleton type="text" rows={4} height={22} />
            ) : healthChecks.map((check) => (
              <div key={check.label} className="rounded-md border border-default bg-white p-3 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{check.label}</p>
                  <span className={check.ok ? "text-emerald-600" : "text-amber-600"}>
                    {check.ok ? <Icon name="fi:check-circle" /> : <Icon name="fi:alert-triangle" />}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
