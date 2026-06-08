"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiDatabase,
  FiLayers,
  FiRefreshCw,
  FiServer,
  FiShield,
  FiZap,
} from "react-icons/fi";
import {
  aiAgentApiGroups,
  getCustomTools,
  getDeadLetterEvents,
  getDpdpReadiness,
  getEcommerceConnections,
  getHealth,
  getOmsAdapters,
  getReadiness,
  getRuntimeConfig,
  getTenantConfig,
  getWebhookEvents,
  getWhatsappBusinessIntegration,
  type ReadinessCheck,
} from "@/services/aiAgentApis";

function StatusBadge({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
        ok
          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-200"
          : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200"
      }`}
    >
      {ok ? <FiCheckCircle size={13} /> : <FiAlertTriangle size={13} />}
      {label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: typeof FiActivity;
  tone?: "blue" | "green" | "amber" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200",
    green: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return (
    <div className="rounded-lg border border-default bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function JsonPreview({ data }: { data: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-md border border-default bg-white p-3 text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {JSON.stringify(data ?? {}, null, 2)}
    </pre>
  );
}

function ReadinessItem({
  name,
  check,
}: {
  name: string;
  check: ReadinessCheck;
}) {
  const detail =
    check.error ||
    check.reason ||
    check.warnings?.join(", ") ||
    check.missing?.join(", ") ||
    "OK";

  return (
    <div className="flex flex-col gap-2 rounded-md border border-default bg-white p-3 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold capitalize text-foreground">
          {name.replaceAll("_", " ")}
        </p>
        <p className="mt-1 text-xs text-muted">{detail}</p>
      </div>
      <StatusBadge ok={Boolean(check.ok)} label={check.ok ? "OK" : "Check"} />
    </div>
  );
}

function getDpdpStatus(data: unknown, isError: boolean) {
  if (isError) return "error";
  if (!data || typeof data !== "object") return "checking";
  const record = data as Record<string, unknown>;
  if (typeof record.status === "string") return record.status;
  const requiredChecks = [
    "consent_capture",
    "data_export",
    "data_delete",
    "dsar_workflow",
    "pii_redaction_to_llm",
    "marketing_opt_out",
  ];
  return requiredChecks.every((key) => record[key] === true) ? "ready" : "not_ready";
}

export default function AiAgentApisPage() {
  const [tenantId, setTenantId] = useState("default");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "Not configured";

  const healthQuery = useQuery({ queryKey: ["ai-agent-health"], queryFn: getHealth });
  const readinessQuery = useQuery({
    queryKey: ["ai-agent-readiness", tenantId],
    queryFn: () => getReadiness(tenantId),
  });
  const runtimeQuery = useQuery({ queryKey: ["ai-agent-runtime"], queryFn: getRuntimeConfig });
  const webhookQuery = useQuery({ queryKey: ["ai-agent-webhook-events"], queryFn: () => getWebhookEvents() });
  const deadLetterQuery = useQuery({ queryKey: ["ai-agent-dead-letters"], queryFn: getDeadLetterEvents });
  const connectionsQuery = useQuery({ queryKey: ["ai-agent-connections"], queryFn: getEcommerceConnections });
  const whatsappBusinessQuery = useQuery({
    queryKey: ["ai-agent-whatsapp-business"],
    queryFn: getWhatsappBusinessIntegration,
  });
  const omsAdaptersQuery = useQuery({ queryKey: ["ai-agent-oms-adapters"], queryFn: getOmsAdapters });
  const customToolsQuery = useQuery({ queryKey: ["ai-agent-custom-tools"], queryFn: getCustomTools });
  const tenantConfigQuery = useQuery({ queryKey: ["ai-agent-tenant-config"], queryFn: getTenantConfig });
  const dpdpReadinessQuery = useQuery({ queryKey: ["ai-agent-dpdp-readiness"], queryFn: getDpdpReadiness });

  const allEndpointsCount = aiAgentApiGroups.reduce((sum, group) => sum + group.endpoints.length, 0);
  const readinessChecks = readinessQuery.data?.checks || {};
  const webhookEvents = webhookQuery.data || [];
  const deadLetters = (deadLetterQuery.data || []).map((event) => ({ ...event, status: event.status || "dead_letter" }));
  const connections = connectionsQuery.data || [];
  const customTools = customToolsQuery.data || [];
  const dpdpStatus = getDpdpStatus(dpdpReadinessQuery.data, dpdpReadinessQuery.isError);
  const runtimeOk = Boolean(runtimeQuery.data?.automation_processor_enabled);
  const integrationConnected = Boolean(
    whatsappBusinessQuery.data?.connected ||
      whatsappBusinessQuery.data?.phone_number_id ||
      whatsappBusinessQuery.data?.waba_id,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 border-b border-default pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Agent APIs</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            WhatsApp AI agent backend ke APIs, runtime checks, webhook queue aur ecommerce connections ek jagah.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              healthQuery.refetch();
              readinessQuery.refetch();
              runtimeQuery.refetch();
              webhookQuery.refetch();
              deadLetterQuery.refetch();
              connectionsQuery.refetch();
              whatsappBusinessQuery.refetch();
              omsAdaptersQuery.refetch();
              customToolsQuery.refetch();
              tenantConfigQuery.refetch();
              dpdpReadinessQuery.refetch();
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Documented APIs" value={allEndpointsCount} icon={FiDatabase} tone="blue" />
        <MetricCard
          label="Backend Status"
          value={healthQuery.data?.status || (healthQuery.isError ? "error" : "checking")}
          icon={FiServer}
          tone={healthQuery.isError ? "amber" : "green"}
        />
        <MetricCard label="Webhook Events" value={webhookEvents.length} icon={FiActivity} tone="slate" />
        <MetricCard label="Dead Letters" value={deadLetters.length} icon={FiAlertTriangle} tone={deadLetters.length ? "amber" : "green"} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Store Connections"
          value={connections.length}
          icon={FiLayers}
          tone={connections.length ? "green" : "slate"}
        />
        <MetricCard
          label="OMS Adapters"
          value={omsAdaptersQuery.data?.platforms?.length ?? (omsAdaptersQuery.isError ? "error" : "checking")}
          icon={FiDatabase}
          tone="blue"
        />
        <MetricCard
          label="DPDP"
          value={dpdpStatus}
          icon={FiShield}
          tone={dpdpReadinessQuery.isError ? "amber" : "green"}
        />
        <MetricCard
          label="Custom Tools"
          value={customToolsQuery.isError ? "error" : customTools.length}
          icon={FiZap}
          tone={customTools.length ? "green" : "slate"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-default bg-surface p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Readiness</h2>
              <p className="mt-1 text-sm text-muted">Tenant launch checks from backend readiness API.</p>
            </div>
            <div className="flex gap-2">
              <input
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                className="h-10 w-40 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
                placeholder="tenant id"
              />
              <StatusBadge
                ok={readinessQuery.data?.status === "ready"}
                label={readinessQuery.data?.status || "checking"}
              />
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(readinessChecks).map(([name, check]) => (
              <ReadinessItem key={name} name={name} check={check} />
            ))}
            {!readinessQuery.isLoading && Object.keys(readinessChecks).length === 0 ? (
              <p className="rounded-md border border-default bg-white px-4 py-8 text-center text-sm text-muted dark:bg-slate-950 md:col-span-2">
                No readiness data available.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Live Signals</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-md border border-default bg-white p-3 dark:bg-slate-950">
              <span className="text-sm text-muted">Automation processor</span>
              <StatusBadge ok={runtimeOk} label={runtimeOk ? "Running" : "Stopped"} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-default bg-white p-3 dark:bg-slate-950">
              <span className="text-sm text-muted">WhatsApp integration</span>
              <StatusBadge ok={integrationConnected} label={integrationConnected ? "Connected" : "Pending"} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-default bg-white p-3 dark:bg-slate-950">
              <span className="text-sm text-muted">Store connections</span>
              <span className="text-sm font-semibold text-foreground">{connections.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-default bg-white p-3 dark:bg-slate-950">
              <span className="text-sm text-muted">API base</span>
              <code className="max-w-44 truncate text-xs font-semibold text-foreground">{apiBaseUrl}</code>
            </div>
          </div>
          <div className="mt-4">
            <JsonPreview
              data={{
                runtime: runtimeQuery.data,
                whatsapp_business: whatsappBusinessQuery.data,
                tenant_config: tenantConfigQuery.data,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
