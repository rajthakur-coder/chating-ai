"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiDatabase,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { ToasterUtils } from "@/components/ui/toast";
import { ecommerceApi } from "@/services/backendModules";

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
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof FiShoppingBag;
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
          <Icon size={18} />
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
        {ok ? <FiCheckCircle size={13} /> : <FiAlertTriangle size={13} />}
        {ok ? "Ready" : "Needs work"}
      </span>
    </div>
  );
}

function DataPreview({
  title,
  rows,
  emptyText,
  fields,
}: {
  title: string;
  rows: unknown[];
  emptyText: string;
  fields: Array<{ label: string; keys: string[] }>;
}) {
  return (
    <section className="rounded-lg border border-default bg-surface">
      <div className="flex items-center justify-between border-b border-default px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-muted dark:bg-slate-950">
          {rows.length}
        </span>
      </div>
      <div className="divide-y divide-default">
        {rows.slice(0, 5).map((row, index) => {
          const record = asRecord(row);
          const primary = textValue(record, fields[0]?.keys || ["title", "name", "id"], `Item ${index + 1}`);
          return (
            <div key={`${primary}-${index}`} className="px-5 py-4">
              <p className="truncate text-sm font-semibold text-foreground">{primary}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {fields.slice(1, 5).map((field) => (
                  <p key={field.label} className="truncate text-xs text-muted">
                    <span className="font-semibold text-foreground">{field.label}:</span>{" "}
                    {textValue(record, field.keys)}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
        {!rows.length ? (
          <p className="px-5 py-10 text-center text-sm text-muted">{emptyText}</p>
        ) : null}
      </div>
    </section>
  );
}

export default function EcommercePage() {
  const queryClient = useQueryClient();
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);
  const connections = useQuery({ queryKey: ["ecommerce-connections"], queryFn: ecommerceApi.connections });
  const products = useQuery({ queryKey: ["ecommerce-products"], queryFn: ecommerceApi.products });
  const orders = useQuery({ queryKey: ["ecommerce-orders"], queryFn: ecommerceApi.orders });
  const customers = useQuery({ queryKey: ["ecommerce-customers"], queryFn: ecommerceApi.customers });
  const bundles = useQuery({ queryKey: ["ecommerce-bundles"], queryFn: ecommerceApi.bundles });

  const connectionList = getListData(connections.data);
  const productList = getListData(products.data);
  const orderList = getListData(orders.data);
  const customerList = getListData(customers.data);
  const bundleList = getListData(bundles.data);
  const activeConnections = connectionList.filter((item) => isActiveConnection(asRecord(item))).length;

  const invalidateCommerce = () => {
    queryClient.invalidateQueries({ queryKey: ["ecommerce-connections"] });
    queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
    queryClient.invalidateQueries({ queryKey: ["ecommerce-orders"] });
    queryClient.invalidateQueries({ queryKey: ["ecommerce-customers"] });
    queryClient.invalidateQueries({ queryKey: ["ecommerce-bundles"] });
  };

  const syncProducts = useMutation({
    mutationFn: ecommerceApi.syncProducts,
    onSuccess: () => {
      ToasterUtils.success("Product sync started");
      invalidateCommerce();
    },
    onError: () => ToasterUtils.error("Unable to sync products"),
    onSettled: () => setSyncingConnectionId(null),
  });

  const syncOrders = useMutation({
    mutationFn: ecommerceApi.syncOrders,
    onSuccess: () => {
      ToasterUtils.success("Order sync started");
      invalidateCommerce();
    },
    onError: () => ToasterUtils.error("Unable to sync orders"),
    onSettled: () => setSyncingConnectionId(null),
  });

  const healthChecks = useMemo(
    () => [
      {
        label: "Store connected",
        ok: activeConnections > 0,
        detail: activeConnections ? `${activeConnections} active connection${activeConnections === 1 ? "" : "s"}` : "Connect Shopify or WooCommerce",
      },
      {
        label: "Catalog available",
        ok: productList.length > 0 || getListStatus(products.data) === "Live Shopify",
        detail: productList.length ? `${productList.length} cached products` : "Live API mode or sync pending",
      },
      {
        label: "Orders visible",
        ok: orderList.length > 0 || getListStatus(orders.data) === "Live Shopify",
        detail: orderList.length ? `${orderList.length} recent orders loaded` : "Live API mode or no orders yet",
      },
      {
        label: "Cross-sell ready",
        ok: bundleList.length > 0,
        detail: bundleList.length ? `${bundleList.length} bundle pairings` : "Add pairings for better recommendations",
      },
    ],
    [activeConnections, bundleList.length, orderList.length, orders.data, productList.length, products.data],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 border-b border-default pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ecommerce Operations</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Store connection health, catalog sync, order visibility, customer data, and bundle readiness for the WhatsApp AI commerce agent.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/shopify-integration" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-default px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong">
            Shopify
            <FiArrowRight size={15} />
          </Link>
          <Link href="/woocommerce-integration" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong">
            WooCommerce
            <FiArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Connections" value={getListStatus(connections.data)} detail={`${activeConnections} active`} icon={FiTruck} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200" />
        <MetricCard label="Products" value={getListStatus(products.data)} detail="Catalog cache or live API" icon={FiShoppingBag} tone="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200" />
        <MetricCard label="Orders" value={getListStatus(orders.data)} detail="Used for tracking and returns" icon={FiRefreshCw} tone="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200" />
        <MetricCard label="Customers" value={getListStatus(customers.data)} detail="CRM and personalization input" icon={FiUsers} tone="bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200" />
        <MetricCard label="Bundles" value={getListStatus(bundles.data)} detail="Cross-sell pairings" icon={FiZap} tone="bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-200" />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {healthChecks.map((check) => (
          <HealthItem key={check.label} {...check} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-default bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Connected Stores</h2>
              <p className="mt-1 text-sm text-muted">Sync catalog and orders directly from active store connections.</p>
            </div>
            <FiDatabase className="text-muted" size={20} />
          </div>
          <div className="mt-4 space-y-3">
            {connectionList.length ? (
              connectionList.map((item, index) => {
                const connection = asRecord(item);
                const id = textValue(connection, ["id", "connection_id"], String(index));
                const active = isActiveConnection(connection);
                const isBusy = syncingConnectionId === id;
                return (
                  <div key={id} className="rounded-md border border-default bg-white p-4 dark:bg-slate-950">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isBusy || !active}
                          onClick={() => {
                            setSyncingConnectionId(id);
                            syncProducts.mutate(id);
                          }}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-default px-3 text-xs font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FiRefreshCw size={13} />
                          Sync products
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || !active}
                          onClick={() => {
                            setSyncingConnectionId(id);
                            syncOrders.mutate(id);
                          }}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FiRefreshCw size={13} />
                          Sync orders
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-default bg-white px-4 py-10 text-center dark:bg-slate-950">
                <p className="font-semibold text-foreground">No ecommerce store connected</p>
                <p className="mt-2 text-sm text-muted">Connect a store so the AI can answer product, checkout, tracking, and return questions.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">AI Commerce Readiness</h2>
          <div className="mt-4 space-y-3">
            {healthChecks.map((check) => (
              <div key={check.label} className="rounded-md border border-default bg-white p-3 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{check.label}</p>
                  <span className={check.ok ? "text-emerald-600" : "text-amber-600"}>
                    {check.ok ? <FiCheckCircle /> : <FiAlertTriangle />}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DataPreview
          title="Catalog Preview"
          rows={productList}
          emptyText="No cached products yet. Sync products or connect a live store."
          fields={[
            { label: "Product", keys: ["title", "name", "product_title"] },
            { label: "SKU", keys: ["sku", "variant_sku"] },
            { label: "Price", keys: ["price_min", "price", "total"] },
            { label: "Inventory", keys: ["inventory", "stock", "available"] },
            { label: "Status", keys: ["status"] },
          ]}
        />
        <DataPreview
          title="Recent Orders"
          rows={orderList}
          emptyText="No orders returned yet. Sync orders or verify live API access."
          fields={[
            { label: "Order", keys: ["order_number", "name", "id", "external_id"] },
            { label: "Status", keys: ["delivery_status", "shipment_status", "fulfillment_status", "status"] },
            { label: "Total", keys: ["total", "total_price", "amount"] },
            { label: "Phone", keys: ["phone", "customer_phone"] },
            { label: "Tracking", keys: ["tracking_number", "awb"] },
          ]}
        />
        <DataPreview
          title="Customer Feed"
          rows={customerList}
          emptyText="No customer data returned yet."
          fields={[
            { label: "Customer", keys: ["name", "customer_name", "first_name", "phone"] },
            { label: "Phone", keys: ["phone", "customer_phone", "mobile"] },
            { label: "Email", keys: ["email"] },
            { label: "Orders", keys: ["orders_count", "order_count"] },
            { label: "Source", keys: ["source", "platform"] },
          ]}
        />
      </section>
    </div>
  );
}
