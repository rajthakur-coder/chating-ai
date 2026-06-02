"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDatabase,
  FiFileText,
  FiLock,
  FiSearch,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";
import ApiJson from "@/components/backend/ApiJson";
import { ToasterUtils } from "@/components/ui/toast";
import { complianceApi } from "@/services/backendModules";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as AnyRecord;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.requests)) return record.requests;
    if (Array.isArray(record.findings)) return record.findings;
  }
  return [];
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

function boolValue(record: AnyRecord, keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === "boolean") return record[key] as boolean;
    if (typeof record[key] === "string") {
      const value = String(record[key]).toLowerCase();
      if (["true", "ready", "ok", "passed", "success"].includes(value)) return true;
      if (["false", "not_ready", "failed", "error"].includes(value)) return false;
    }
  }
  return undefined;
}

function statusFromData(data: unknown, fallbackKeys: string[] = ["status", "ready", "ok"]) {
  const record = asRecord(data);
  const explicit = textValue(record, ["status"], "");
  if (explicit) return explicit;
  const bool = boolValue(record, fallbackKeys);
  if (bool === true) return "ready";
  if (bool === false) return "not_ready";
  return "checking";
}

function isPositiveStatus(status: string) {
  return ["ready", "ok", "passed", "success", "secure", "compliant", "true"].includes(status.toLowerCase());
}

function readinessChecks(data: unknown) {
  const record = asRecord(data);
  const checks = asRecord(record.checks);
  const source = Object.keys(checks).length ? checks : record;
  return Object.entries(source)
    .filter(([, value]) => typeof value === "boolean" || (value && typeof value === "object"))
    .map(([key, value]) => {
      const item = asRecord(value);
      const ok = typeof value === "boolean" ? value : boolValue(item, ["ok", "ready", "passed", "enabled"]) === true;
      const detail =
        textValue(item, ["reason", "detail", "message", "error"], "") ||
        (Array.isArray(item.missing) ? item.missing.join(", ") : "") ||
        (Array.isArray(item.warnings) ? item.warnings.join(", ") : "") ||
        (ok ? "Ready" : "Needs review");
      return { key, ok, detail };
    });
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  ok,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof FiShield;
  ok?: boolean;
}) {
  return (
    <div className="rounded-lg border border-default bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-md ${
            ok === false
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{detail}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = isPositiveStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
      }`}
    >
      {ok ? <FiCheckCircle size={13} /> : <FiAlertTriangle size={13} />}
      {status.replaceAll("_", " ")}
    </span>
  );
}

function CheckList({ title, checks, emptyText }: { title: string; checks: Array<{ key: string; ok: boolean; detail: string }>; emptyText: string }) {
  return (
    <section className="rounded-lg border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-default">
        {checks.slice(0, 8).map((check) => (
          <div key={check.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold capitalize text-foreground">{check.key.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm text-muted">{check.detail}</p>
            </div>
            <span className={check.ok ? "text-emerald-600" : "text-amber-600"}>
              {check.ok ? <FiCheckCircle size={19} /> : <FiAlertTriangle size={19} />}
            </span>
          </div>
        ))}
        {!checks.length ? <p className="px-5 py-10 text-center text-sm text-muted">{emptyText}</p> : null}
      </div>
    </section>
  );
}

function RequestList({ rows }: { rows: unknown[] }) {
  return (
    <section className="rounded-lg border border-default bg-surface">
      <div className="flex items-center justify-between border-b border-default px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Data Requests</h2>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-muted dark:bg-slate-950">{rows.length}</span>
      </div>
      <div className="divide-y divide-default">
        {rows.slice(0, 6).map((row, index) => {
          const record = asRecord(row);
          return (
            <div key={String(record.id || index)} className="px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-foreground">{textValue(record, ["phone", "customer_phone", "email"], `Request ${index + 1}`)}</p>
                <StatusPill status={textValue(record, ["status"], "pending")} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {textValue(record, ["request_type", "type", "action"], "data request")} · {textValue(record, ["created_at", "updated_at"], "no timestamp")}
              </p>
            </div>
          );
        })}
        {!rows.length ? <p className="px-5 py-10 text-center text-sm text-muted">No data-principal requests found.</p> : null}
      </div>
    </section>
  );
}

export default function CompliancePage() {
  const [phone, setPhone] = useState("");
  const [templatePayload, setTemplatePayload] = useState('{"name":"order_update","body":"Your order is shipped"}');
  const dpdp = useQuery({ queryKey: ["compliance-dpdp"], queryFn: complianceApi.dpdp });
  const security = useQuery({ queryKey: ["compliance-security"], queryFn: complianceApi.securityAudit });
  const isolation = useQuery({ queryKey: ["compliance-isolation"], queryFn: complianceApi.tenantIsolation });
  const requests = useQuery({ queryKey: ["compliance-requests"], queryFn: complianceApi.dataRequests });

  const consent = useMutation({
    mutationFn: complianceApi.consentStatus,
    onError: () => ToasterUtils.error("Unable to check consent"),
  });

  const templateCheck = useMutation({
    mutationFn: complianceApi.templateCheck,
    onSuccess: () => ToasterUtils.success("Template checked"),
    onError: () => ToasterUtils.error("Template payload is invalid or check failed"),
  });

  const runTemplateCheck = () => {
    try {
      templateCheck.mutate(JSON.parse(templatePayload));
    } catch {
      ToasterUtils.error("Template JSON is invalid");
    }
  };

  const dpdpStatus = statusFromData(dpdp.data);
  const securityStatus = statusFromData(security.data, ["ok", "passed", "secure"]);
  const isolationStatus = statusFromData(isolation.data, ["ok", "passed", "isolated"]);
  const dpdpChecks = useMemo(() => readinessChecks(dpdp.data), [dpdp.data]);
  const securityChecks = useMemo(() => readinessChecks(security.data), [security.data]);
  const isolationChecks = useMemo(() => readinessChecks(isolation.data), [isolation.data]);
  const requestRows = asArray(requests.data);
  const openRequests = requestRows.filter((row) => !isPositiveStatus(textValue(asRecord(row), ["status"], "pending"))).length;
  const consentStatus = consent.data ? statusFromData(consent.data, ["consent", "consented", "ok"]) : "not run";
  const templateStatus = templateCheck.data ? statusFromData(templateCheck.data, ["ok", "passed", "compliant"]) : "not run";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-5">
        <h1 className="text-2xl font-semibold text-foreground">Compliance Center</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          DPDP readiness, consent checks, template review, security audit, tenant isolation, and data-principal workflows for the AI WhatsApp agent.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="DPDP readiness" value={dpdpStatus.replaceAll("_", " ")} detail={`${dpdpChecks.length || 0} checks reported`} icon={FiShield} ok={isPositiveStatus(dpdpStatus)} />
        <MetricCard label="Security audit" value={securityStatus.replaceAll("_", " ")} detail={`${securityChecks.length || 0} controls reviewed`} icon={FiLock} ok={isPositiveStatus(securityStatus)} />
        <MetricCard label="Tenant isolation" value={isolationStatus.replaceAll("_", " ")} detail={`${isolationChecks.length || 0} isolation checks`} icon={FiDatabase} ok={isPositiveStatus(isolationStatus)} />
        <MetricCard label="Open requests" value={openRequests} detail={`${requestRows.length} total data requests`} icon={FiFileText} ok={openRequests === 0} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FiUserCheck size={18} />
            Consent Status
          </h2>
          <p className="mt-1 text-sm text-muted">Check whether a customer has consent and marketing eligibility recorded.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Customer phone"
              className="h-10 min-w-0 flex-1 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
            />
            <button
              disabled={!phone.trim() || consent.isPending}
              onClick={() => consent.mutate(phone.trim())}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-default px-4 text-sm font-semibold text-foreground hover:bg-surface-strong disabled:opacity-60"
            >
              <FiSearch size={15} />
              Check
            </button>
          </div>
          <div className="mt-4 rounded-md border border-default bg-white p-4 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Result</p>
              <StatusPill status={consentStatus} />
            </div>
            <div className="mt-3">
              <ApiJson data={consent.data || { endpoint: "/compliance/consent/status", status: "not_run" }} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Template Compliance</h2>
          <p className="mt-1 text-sm text-muted">Validate outbound copy before it goes to customers or Meta template review.</p>
          <textarea
            value={templatePayload}
            onChange={(event) => setTemplatePayload(event.target.value)}
            rows={6}
            className="mt-4 w-full rounded-md border border-default bg-white px-3 py-2 font-mono text-xs outline-none focus:border-border-primary dark:bg-slate-950"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <StatusPill status={templateStatus} />
            <button
              disabled={templateCheck.isPending}
              onClick={runTemplateCheck}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
            >
              {templateCheck.isPending ? "Checking..." : "Check Template"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <CheckList title="DPDP Controls" checks={dpdpChecks} emptyText={dpdp.isLoading ? "Loading DPDP checks..." : "No DPDP checks returned."} />
        <CheckList title="Security Audit" checks={securityChecks} emptyText={security.isLoading ? "Loading security audit..." : "No security findings returned."} />
        <CheckList title="Tenant Isolation" checks={isolationChecks} emptyText={isolation.isLoading ? "Loading tenant isolation audit..." : "No tenant isolation checks returned."} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <RequestList rows={requestRows} />
        <section className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Audit Payloads</h2>
          <p className="mt-1 text-sm text-muted">Raw backend responses are kept here for support and debugging.</p>
          <div className="mt-4 grid gap-3">
            <ApiJson data={{ dpdp: dpdp.data, security_audit: security.data }} />
            <ApiJson data={{ tenant_isolation: isolation.data, template_check: templateCheck.data }} />
          </div>
        </section>
      </section>
    </div>
  );
}
