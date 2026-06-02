"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiLock,
  FiPlay,
  FiRefreshCw,
  FiTarget,
  FiZap,
} from "react-icons/fi";
import { ToasterUtils } from "@/components/ui/toast";
import { onboardingApi } from "@/services/backendModules";

type OnboardingStep = {
  key: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  status: "completed" | "pending" | "blocked" | string;
  blocked_by?: string[];
};

type OnboardingWizard = {
  status?: string;
  completion_percent?: number;
  required_completion_percent?: number;
  estimated_remaining_minutes?: number;
  next_step?: OnboardingStep | null;
  next_required_step?: OnboardingStep | null;
  steps?: OnboardingStep[];
};

type Readiness = {
  ready?: boolean;
  blockers?: { step: string; title: string }[];
};

const stepRoutes: Record<string, string> = {
  connect_whatsapp: "/dashboard",
  connect_oms: "/shopify-integration",
  import_catalog: "/ecommerce",
  brand_voice: "/knowledge-base",
  faq: "/knowledge-base",
  policies: "/knowledge-base",
  discounts: "/bot-settings",
  bundle_pairs: "/ecommerce",
  preview_test: "/onboarding",
  go_live: "/onboarding",
};

const actionLabels: Record<string, string> = {
  connect_whatsapp: "Connect WhatsApp",
  connect_oms: "Connect Store",
  import_catalog: "View Catalog Status",
  brand_voice: "Setup Brand Voice",
  faq: "Open Knowledge Base",
  policies: "Add Policies",
  discounts: "Configure Discounts",
  bundle_pairs: "Review Bundles",
  preview_test: "Run Preview",
  go_live: "Go Live",
};

function statusClasses(status: string, completed: boolean) {
  if (completed || status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (status === "blocked") {
    return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof FiTarget;
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

function StepIcon({ step }: { step: OnboardingStep }) {
  if (step.completed) return <FiCheckCircle size={18} />;
  if (step.status === "blocked") return <FiLock size={18} />;
  return <FiAlertTriangle size={18} />;
}

function StepCard({ step }: { step: OnboardingStep }) {
  const route = stepRoutes[step.key] || "/onboarding";
  const label = actionLabels[step.key] || "Open";

  return (
    <div className="rounded-lg border border-default bg-surface p-4 transition hover:border-border-primary">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${statusClasses(
            step.status,
            step.completed,
          )}`}
        >
          <StepIcon step={step} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <span
              className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold capitalize ${statusClasses(
                step.status,
                step.completed,
              )}`}
            >
              {step.completed ? "completed" : step.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">{step.description}</p>
          {step.blocked_by?.length ? (
            <p className="mt-2 text-xs text-muted">
              Waiting for: {step.blocked_by.map((item) => item.replaceAll("_", " ")).join(", ")}
            </p>
          ) : null}
          <div className="mt-4">
            {step.key === "preview_test" ? (
              <span className="text-xs font-semibold text-muted">Use preview panel below</span>
            ) : step.key === "go_live" ? (
              <span className="text-xs font-semibold text-muted">Enabled when all required steps are ready</span>
            ) : (
              <Link
                href={route}
                className="inline-flex items-center gap-2 rounded-md border border-default px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
              >
                {label}
                <FiArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Hi");
  const queryClient = useQueryClient();

  const wizardQuery = useQuery({
    queryKey: ["onboarding-wizard"],
    queryFn: onboardingApi.wizard,
  });
  const readinessQuery = useQuery({
    queryKey: ["onboarding-readiness"],
    queryFn: onboardingApi.readiness,
  });

  const wizard = (wizardQuery.data || {}) as OnboardingWizard;
  const readiness = (readinessQuery.data || {}) as Readiness;
  const steps = wizard.steps || [];
  const percent = wizard.completion_percent ?? 0;
  const nextStep = wizard.next_required_step || wizard.next_step;
  const completedCount = steps.filter((step) => step.completed).length;
  const requiredSteps = steps.filter((step) => step.required);
  const completedRequired = requiredSteps.filter((step) => step.completed).length;
  const blockers = readiness.blockers || [];
  const pendingRequired = requiredSteps.filter((step) => !step.completed);
  const estimatedMinutes = wizard.estimated_remaining_minutes ?? pendingRequired.length * 4;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["onboarding-wizard"] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-readiness"] });
  };

  const websiteAssist = useMutation({
    mutationFn: onboardingApi.websiteAssist,
    onSuccess: () => {
      ToasterUtils.success("Brand setup updated");
      refresh();
    },
    onError: () => ToasterUtils.error("Unable to update brand setup"),
  });

  const preview = useMutation({
    mutationFn: () => onboardingApi.previewTest(phone, message),
    onSuccess: () => {
      ToasterUtils.success("Preview test completed");
      refresh();
    },
    onError: () => ToasterUtils.error("Unable to run preview test"),
  });

  const goLive = useMutation({
    mutationFn: onboardingApi.goLive,
    onSuccess: () => {
      ToasterUtils.success("Store is live");
      refresh();
    },
    onError: () => ToasterUtils.error("Complete required steps before going live"),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 border-b border-default pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Launch Onboarding</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Connect WhatsApp, import store data, prepare AI knowledge, test replies, and go live from one operational checklist.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-default px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => goLive.mutate()}
            disabled={goLive.isPending || !readiness.ready}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiPlay size={16} />
            {goLive.isPending ? "Going live..." : "Go Live"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Launch progress"
          value={`${percent}%`}
          detail={`${completedCount}/${steps.length || 0} total steps complete`}
          icon={FiTarget}
          tone="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
        />
        <StatCard
          label="Required steps"
          value={`${completedRequired}/${requiredSteps.length || 0}`}
          detail={pendingRequired.length ? `${pendingRequired.length} required checks pending` : "Required checks are complete"}
          icon={FiCheckCircle}
          tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
        />
        <StatCard
          label="Blockers"
          value={String(blockers.length)}
          detail={blockers.length ? "Resolve before go-live" : "No readiness blockers found"}
          icon={FiAlertTriangle}
          tone={blockers.length ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"}
        />
        <StatCard
          label="Time estimate"
          value={`${estimatedMinutes} min`}
          detail="Based on remaining onboarding work"
          icon={FiClock}
          tone="bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-default bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Launch Plan</h2>
              <p className="mt-1 text-sm text-muted">
                {completedCount}/{steps.length || 0} steps completed, {completedRequired}/{requiredSteps.length || 0} required checks done.
              </p>
            </div>
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                readiness.ready
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
              }`}
            >
              {readiness.ready ? "Ready" : "Not ready"}
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-strong">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, percent)}%` }} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-default bg-white p-4 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase text-muted">Next required step</p>
              <p className="mt-2 font-semibold text-foreground">{nextStep?.title || "Ready to go live"}</p>
              <p className="mt-1 text-sm text-muted">
                {nextStep?.description || "All required setup checks are complete."}
              </p>
            </div>
            <div className="rounded-md border border-default bg-white p-4 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase text-muted">Priority queue</p>
              <div className="mt-2 space-y-2">
                {pendingRequired.slice(0, 3).map((step) => (
                  <Link key={step.key} href={stepRoutes[step.key] || "/onboarding"} className="flex items-center justify-between rounded-md bg-surface-strong px-3 py-2 text-sm font-semibold text-foreground">
                    <span className="truncate">{step.title}</span>
                    <FiArrowRight size={14} />
                  </Link>
                ))}
                {!pendingRequired.length ? (
                  <p className="rounded-md bg-surface-strong px-3 py-2 text-sm text-muted">Everything required is done.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Readiness</h2>
          <div className="mt-4 flex items-center justify-between rounded-md border border-default bg-white p-3 dark:bg-slate-950">
            <span className="text-sm text-muted">Go-live status</span>
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                readiness.ready
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
              }`}
            >
              {readiness.ready ? "Ready" : "Not ready"}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {blockers.slice(0, 5).map((blocker) => (
              <div key={blocker.step} className="rounded-md bg-surface-strong px-3 py-2 text-sm text-muted">
                {blocker.title}
              </div>
            ))}
            {!blockers.length ? (
              <p className="rounded-md bg-surface-strong px-3 py-2 text-sm text-muted">No blockers found.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => (
          <StepCard key={step.key} step={step} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FiZap size={18} />
            AI Brand Setup
          </h2>
          <p className="mt-1 text-sm text-muted">Import brand voice, policies, and FAQ context from your website.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://yourstore.com"
              className="h-10 min-w-0 flex-1 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
            />
            <button
              disabled={!websiteUrl.trim() || websiteAssist.isPending}
              onClick={() => websiteAssist.mutate(websiteUrl.trim())}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-default px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiGlobe size={15} />
              Apply
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Preview Test</h2>
          <p className="mt-1 text-sm text-muted">Run the backend agent before opening real customer traffic.</p>
          <div className="mt-4 grid gap-3">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone"
              className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              className="rounded-md border border-default bg-white px-3 py-2 text-sm outline-none focus:border-border-primary dark:bg-slate-950"
            />
            <button
              disabled={preview.isPending}
              onClick={() => preview.mutate()}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-default px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw size={15} />
              Run Preview
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
