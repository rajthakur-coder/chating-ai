"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiRefreshCw } from "react-icons/fi";
import {
  AutomationRule,
  getAutomationRules,
  seedAutomationDefaults,
  updateAutomationRule,
} from "@/services/automations";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/Common/Button";
import CustomInput from "@/components/Common/inputField";
import StatusBadge from "@/components/Common/StatusBadge";
import ToggleButton from "@/components/Common/ToggleButton";

const triggerLabels: Record<string, string> = {
  order_created: "Order Confirmation",
  order_paid: "Paid Order",
  order_shipped: "Shipping Update",
  order_delivered: "Delivered Follow-up",
  cart_abandoned: "Abandoned Cart",
  cod_verification: "COD Verification",
  feedback_request: "Feedback Request",
};

function formatDelay(seconds: number) {
  if (!seconds) return "Immediately";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
  return `${Math.round(seconds / 86400)} day`;
}

export default function AutomationSettingsPage() {
  const queryClient = useQueryClient();
  const [draftDelays, setDraftDelays] = useState<Record<number, string>>({});
  const [updatingRuleId, setUpdatingRuleId] = useState<number | null>(null);

  const rulesQuery = useQuery({
    queryKey: ["automation-rules"],
    queryFn: getAutomationRules,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] });

  const seedMutation = useMutation({
    mutationFn: seedAutomationDefaults,
    onSuccess: () => {
      ToasterUtils.success("Default automations are ready");
      invalidate();
    },
    onError: () => ToasterUtils.error("Unable to seed automation defaults"),
  });

  const updateMutation = useMutation({
    mutationFn: updateAutomationRule,
    onSuccess: () => {
      ToasterUtils.success("Automation updated");
      invalidate();
    },
    onError: () => ToasterUtils.error("Unable to update automation"),
    onSettled: () => setUpdatingRuleId(null),
  });

  const ecommerceRules = useMemo(() => {
    const rules = rulesQuery.data || [];
    const preferred = Object.keys(triggerLabels);
    return [...rules].sort((a, b) => {
      const ai = preferred.indexOf(a.trigger);
      const bi = preferred.indexOf(b.trigger);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [rulesQuery.data]);

  const saveDelay = (rule: AutomationRule) => {
    const rawValue = draftDelays[rule.id];
    if (rawValue === undefined) return;
    setUpdatingRuleId(rule.id);
    updateMutation.mutate({
      ruleId: rule.id,
      delay_seconds: Math.max(0, Number(rawValue) || 0),
    });
  };

  const toggleRule = (rule: AutomationRule) => {
    setUpdatingRuleId(rule.id);
    updateMutation.mutate({
      ruleId: rule.id,
      enabled: !rule.enabled,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Automation Settings
            </h1>
            <p className="mt-2 text-sm text-muted">
              Enable, pause, and delay ecommerce WhatsApp automations.
            </p>
          </div>
          <Button
            text="Seed Defaults"
            icon={FiRefreshCw}
            variant="outline"
            color="surface"
            onClick={() => seedMutation.mutate()}
            loading={seedMutation.isPending}
            loaderType="bounce"
            disabled={seedMutation.isPending}
            fullWidthOnMobile
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-default bg-surface">
        <div className="grid grid-cols-[80px_1.4fr_1fr_160px_180px] border-b border-default bg-surface-strong px-4 py-3 text-xs font-semibold uppercase text-muted">
          <span>S.No</span>
          <span>Automation</span>
          <span>Trigger</span>
          <span>Delay</span>
          <span>Status</span>
        </div>

        {rulesQuery.isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Loading automations...</p>
        ) : null}

        {!rulesQuery.isLoading && ecommerceRules.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No automation rules found. Seed defaults to create ecommerce rules.
          </p>
        ) : null}

        {ecommerceRules.map((rule, index) => (
          <div
            key={rule.id}
            className="grid grid-cols-1 gap-4 border-b border-default px-4 py-4 last:border-b-0 lg:grid-cols-[80px_1.4fr_1fr_160px_180px] lg:items-center"
          >
            <p className="text-sm font-semibold text-foreground">{rule.sr_no || index + 1}</p>
            <div>
              <p className="font-semibold text-foreground">
                {triggerLabels[rule.trigger] || rule.name}
              </p>
              <p className="mt-1 text-xs text-muted">{rule.name}</p>
            </div>
            <p className="text-sm text-muted">{rule.trigger}</p>
            <div className="flex items-center gap-2">
              <CustomInput
                type="number"
                min="0"
                value={String(draftDelays[rule.id] ?? rule.delay_seconds)}
                onChange={(value) =>
                  setDraftDelays((current) => ({
                    ...current,
                    [rule.id]: value,
                  }))
                }
                onBlur={() => saveDelay(rule)}
                className="max-w-24"
              />
              <span className="text-xs text-muted">
                {formatDelay(Number(draftDelays[rule.id] ?? rule.delay_seconds))}
              </span>
            </div>
            <div className="inline-flex w-fit items-center gap-3">
              <ToggleButton
                isOn={rule.enabled}
                size="sm"
                onToggle={() => toggleRule(rule)}
              />
              <StatusBadge
                status={rule.enabled ? "Active" : "Inactive"}
                displayText={rule.enabled ? "Enabled" : "Paused"}
                loading={updatingRuleId === rule.id}
                className="cursor-default"
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
