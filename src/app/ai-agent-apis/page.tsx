"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiCopy,
  FiDatabase,
  FiLayers,
  FiMessageSquare,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiServer,
  FiShield,
  FiZap,
} from "react-icons/fi";
import { ToasterUtils } from "@/components/ui/toast";
import {
  aiAgentApiGroups,
  executeAgentTool,
  getCommerceDashboard,
  getCustomTools,
  getDeadLetterEvents,
  getDpdpReadiness,
  getEcommerceConnections,
  getHeadlessOnboarding,
  getHealth,
  getLlmProviders,
  getOmsAdapters,
  getReadiness,
  getRuntimeConfig,
  getTenantConfig,
  getWebhookEvents,
  getWhatsappBusinessIntegration,
  lookupOmsOrder,
  replayWebhookEvent,
  retryFailedWebhookEvents,
  runLlmRespond,
  searchInternalCatalog,
  type ReadinessCheck,
  type WebhookEvent,
} from "@/services/aiAgentApis";

type Endpoint = (typeof aiAgentApiGroups)[number]["endpoints"][number];

const methodClass: Record<string, string> = {
  GET: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-800",
  POST: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
  PUT: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800",
  PATCH: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800",
  DELETE: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-800",
};

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

function EndpointRow({ endpoint }: { endpoint: Endpoint }) {
  const copyEndpoint = async () => {
    await navigator.clipboard.writeText(`${endpoint.method} ${endpoint.path}`);
    ToasterUtils.success("Endpoint copied");
  };

  return (
    <div className="grid gap-3 border-t border-default px-4 py-3 first:border-t-0 md:grid-cols-[92px_1fr_180px_40px] md:items-center">
      <span
        className={`inline-flex w-fit items-center justify-center rounded px-2 py-1 text-xs font-bold ring-1 ${
          methodClass[endpoint.method] || methodClass.GET
        }`}
      >
        {endpoint.method}
      </span>
      <code className="min-w-0 break-all rounded-md bg-white px-2 py-1 text-xs text-foreground dark:bg-slate-950">
        {endpoint.path}
      </code>
      <p className="text-sm text-muted">{endpoint.label}</p>
      <button
        type="button"
        onClick={copyEndpoint}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-default text-muted transition hover:bg-surface-strong hover:text-foreground"
        aria-label="Copy endpoint"
      >
        <FiCopy size={15} />
      </button>
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

function WebhookTable({
  events,
  replaying,
  onReplay,
}: {
  events: WebhookEvent[];
  replaying: boolean;
  onReplay: (eventId: number) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-default bg-white px-4 py-8 text-center text-sm text-muted dark:bg-slate-950">
        No webhook events found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-default">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-default text-left text-sm">
          <thead className="bg-surface-strong text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default bg-white dark:bg-slate-950">
            {events.slice(0, 8).map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-semibold text-foreground">#{event.id}</td>
                <td className="px-4 py-3 text-muted">{event.phone || "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {event.status || "unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{event.attempts ?? 0}</td>
                <td className="max-w-xs truncate px-4 py-3 text-muted">
                  {event.message_text || event.last_error || event.error || "-"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={replaying || !["failed", "dead_letter"].includes(String(event.status))}
                    onClick={() => onReplay(event.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-default px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiPlay size={13} />
                    Replay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [search, setSearch] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentMessage, setAgentMessage] = useState("Show me recommended products");
  const [toolName, setToolName] = useState("catalog_search");
  const [toolEntities, setToolEntities] = useState('{"query":"shoes"}');
  const [catalogQuery, setCatalogQuery] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [agentResult, setAgentResult] = useState<unknown>(null);
  const [toolResult, setToolResult] = useState<unknown>(null);
  const queryClient = useQueryClient();
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
  const llmProvidersQuery = useQuery({ queryKey: ["ai-agent-llm-providers"], queryFn: getLlmProviders });
  const customToolsQuery = useQuery({ queryKey: ["ai-agent-custom-tools"], queryFn: getCustomTools });
  const onboardingQuery = useQuery({ queryKey: ["ai-agent-onboarding"], queryFn: getHeadlessOnboarding });
  const tenantConfigQuery = useQuery({ queryKey: ["ai-agent-tenant-config"], queryFn: getTenantConfig });
  const dpdpReadinessQuery = useQuery({ queryKey: ["ai-agent-dpdp-readiness"], queryFn: getDpdpReadiness });
  const commerceDashboardQuery = useQuery({ queryKey: ["ai-agent-commerce-dashboard"], queryFn: () => getCommerceDashboard(30) });
  const catalogQueryState = useQuery({
    queryKey: ["ai-agent-catalog-search", catalogQuery],
    queryFn: () => searchInternalCatalog(catalogQuery, 5),
    enabled: false,
  });
  const orderQuery = useQuery({
    queryKey: ["ai-agent-order-lookup", orderId, orderPhone],
    queryFn: () => lookupOmsOrder(orderId, orderPhone),
    enabled: false,
    retry: false,
  });

  const replayMutation = useMutation({
    mutationFn: replayWebhookEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-webhook-events"] });
      queryClient.invalidateQueries({ queryKey: ["ai-agent-dead-letters"] });
      ToasterUtils.success("Webhook event queued for replay");
    },
    onError: () => ToasterUtils.error("Unable to replay webhook event"),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryFailedWebhookEvents(25),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-webhook-events"] });
      ToasterUtils.success(`${data.queued || 0} failed events queued`);
    },
    onError: () => ToasterUtils.error("Unable to retry failed events"),
  });

  const agentMutation = useMutation({
    mutationFn: runLlmRespond,
    onSuccess: (data) => {
      setAgentResult(data);
      ToasterUtils.success("Agent response received");
    },
    onError: () => ToasterUtils.error("Unable to run agent response"),
  });

  const toolMutation = useMutation({
    mutationFn: executeAgentTool,
    onSuccess: (data) => {
      setToolResult(data);
      ToasterUtils.success("Tool executed");
    },
    onError: () => ToasterUtils.error("Unable to execute tool"),
  });

  const filteredGroups = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return aiAgentApiGroups;
    return aiAgentApiGroups
      .map((group) => ({
        ...group,
        endpoints: group.endpoints.filter(
          (endpoint) =>
            endpoint.path.toLowerCase().includes(value) ||
            endpoint.label.toLowerCase().includes(value) ||
            endpoint.method.toLowerCase().includes(value) ||
            group.title.toLowerCase().includes(value),
        ),
      }))
      .filter((group) => group.endpoints.length > 0);
  }, [search]);

  const allEndpointsCount = aiAgentApiGroups.reduce((sum, group) => sum + group.endpoints.length, 0);
  const readinessChecks = readinessQuery.data?.checks || {};
  const webhookEvents = webhookQuery.data || [];
  const deadLetters = (deadLetterQuery.data || []).map((event) => ({ ...event, status: event.status || "dead_letter" }));
  const connections = connectionsQuery.data || [];
  const customTools = customToolsQuery.data || [];
  const onboardingSteps = Object.values(onboardingQuery.data || {}).filter(Boolean).length;
  const dpdpStatus = getDpdpStatus(dpdpReadinessQuery.data, dpdpReadinessQuery.isError);
  const runtimeOk = Boolean(runtimeQuery.data?.automation_processor_enabled);
  const integrationConnected = Boolean(
    whatsappBusinessQuery.data?.connected ||
      whatsappBusinessQuery.data?.phone_number_id ||
      whatsappBusinessQuery.data?.waba_id,
  );

  const runTool = () => {
    let entities: Record<string, unknown> = {};
    if (toolEntities.trim()) {
      try {
        const parsed = JSON.parse(toolEntities);
        entities = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        ToasterUtils.error("Entities must be valid JSON");
        return;
      }
    }
    toolMutation.mutate({
      tool_name: toolName.trim(),
      phone: agentPhone.trim(),
      message: agentMessage.trim(),
      entities,
    });
  };

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
          <label className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search endpoint"
              className="h-10 w-full rounded-md border border-default bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-border-primary sm:w-72"
            />
          </label>
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
              llmProvidersQuery.refetch();
              customToolsQuery.refetch();
              onboardingQuery.refetch();
              tenantConfigQuery.refetch();
              dpdpReadinessQuery.refetch();
              commerceDashboardQuery.refetch();
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-default bg-surface p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Agent Console</h2>
              <p className="mt-1 text-sm text-muted">Internal LLM orchestrator and tool execution APIs.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-2 py-1 text-xs font-semibold text-muted dark:bg-slate-950">
              <FiMessageSquare size={14} />
              /internal
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={agentPhone}
              onChange={(event) => setAgentPhone(event.target.value)}
              placeholder="Customer phone"
              className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
            />
            <input
              value={toolName}
              onChange={(event) => setToolName(event.target.value)}
              placeholder="Tool name"
              className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
            />
            <textarea
              value={agentMessage}
              onChange={(event) => setAgentMessage(event.target.value)}
              placeholder="Customer message"
              rows={4}
              className="rounded-md border border-default bg-white px-3 py-2 text-sm outline-none focus:border-border-primary dark:bg-slate-950 md:col-span-2"
            />
            <textarea
              value={toolEntities}
              onChange={(event) => setToolEntities(event.target.value)}
              placeholder='{"query":"shoes"}'
              rows={3}
              className="rounded-md border border-default bg-white px-3 py-2 font-mono text-xs outline-none focus:border-border-primary dark:bg-slate-950 md:col-span-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={agentMutation.isPending || !agentMessage.trim()}
              onClick={() => agentMutation.mutate({ phone: agentPhone.trim(), message: agentMessage.trim() })}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiPlay size={15} />
              Run Agent
            </button>
            <button
              type="button"
              disabled={toolMutation.isPending || !toolName.trim()}
              onClick={runTool}
              className="inline-flex items-center gap-2 rounded-md border border-default px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiZap size={15} />
              Execute Tool
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <JsonPreview data={agentResult || { endpoint: "/internal/llm/respond", status: "not_run" }} />
            <JsonPreview data={toolResult || { endpoint: "/internal/tool/execute", status: "not_run" }} />
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Lookup Tools</h2>
          <p className="mt-1 text-sm text-muted">Catalog search and OMS order lookup from agent backend.</p>

          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="Catalog query"
                className="h-10 min-w-0 flex-1 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
              />
              <button
                type="button"
                disabled={catalogQueryState.isFetching || !catalogQuery.trim()}
                onClick={() => catalogQueryState.refetch()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-default px-3 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSearch size={15} />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_40px]">
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Order ID"
                className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
              />
              <input
                value={orderPhone}
                onChange={(event) => setOrderPhone(event.target.value)}
                placeholder="Phone"
                className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
              />
              <button
                type="button"
                disabled={orderQuery.isFetching || !orderId.trim()}
                onClick={() => orderQuery.refetch()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-default text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSearch size={15} />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <JsonPreview data={catalogQueryState.data || { endpoint: "/internal/catalog/search", status: catalogQueryState.isFetching ? "loading" : "not_run" }} />
            <JsonPreview data={orderQuery.data || { endpoint: "/internal/oms/order", status: orderQuery.isError ? "not_found" : orderQuery.isFetching ? "loading" : "not_run" }} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Headless Runtime</h2>
          <p className="mt-1 text-sm text-muted">OMS adapters and LLM providers from the agent backend.</p>
          <div className="mt-4">
            <JsonPreview
              data={{
                oms_adapters: omsAdaptersQuery.data,
                llm_providers: llmProvidersQuery.data,
                custom_tools: customTools,
                onboarding_done: onboardingSteps,
              }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Commerce Dashboard</h2>
          <p className="mt-1 text-sm text-muted">30-day commerce analytics API response.</p>
          <div className="mt-4">
            <JsonPreview data={commerceDashboardQuery.data || { status: commerceDashboardQuery.isError ? "unavailable" : "loading" }} />
          </div>
        </div>
        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Compliance</h2>
          <p className="mt-1 text-sm text-muted">DPDP readiness and tenant isolation surface.</p>
          <div className="mt-4">
            <JsonPreview data={dpdpReadinessQuery.data || { status: dpdpReadinessQuery.isError ? "unavailable" : "loading" }} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-default bg-surface p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Webhook Queue</h2>
            <p className="mt-1 text-sm text-muted">Failed and dead-letter events can be replayed safely from here.</p>
          </div>
          <button
            type="button"
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate()}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-default px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiZap size={16} />
            Retry Failed
          </button>
        </div>
        <div className="mt-4">
          <WebhookTable
            events={[...deadLetters, ...webhookEvents]}
            replaying={replayMutation.isPending}
            onReplay={(eventId) => replayMutation.mutate(eventId)}
          />
        </div>
      </section>

      <section className="space-y-4">
        {filteredGroups.map((group) => (
          <div key={group.title} className="overflow-hidden rounded-lg border border-default bg-surface">
            <div className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
                <p className="mt-1 text-sm text-muted">{group.description}</p>
              </div>
              <span className="w-fit rounded-md bg-white px-2 py-1 text-xs font-semibold text-muted dark:bg-slate-950">
                {group.endpoints.length} APIs
              </span>
            </div>
            <div>
              {group.endpoints.map((endpoint) => (
                <EndpointRow key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
