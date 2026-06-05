"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiClock, FiRefreshCw, FiSave, FiSend } from "react-icons/fi";
import { Button } from "@/components/Common/Button";
import CustomInput from "@/components/Common/inputField";
import StatusBadge from "@/components/Common/StatusBadge";
import ToggleButton from "@/components/Common/ToggleButton";
import { ToasterUtils } from "@/components/ui/toast";
import {
  AutomationRule,
  getAutomationRules,
  getAutomationTemplates,
  seedAutomationDefaults,
  updateAutomationRule,
} from "@/services/automations";
import { getWhatsappTemplates, syncWhatsappTemplates, type WhatsappTemplate } from "@/services/templates";

const CAMPAIGN_TYPES = [
  {
    key: "cart_abandoned",
    title: "Cart Abandoned",
    description: "Send a checkout reminder when a Shopify checkout is left incomplete.",
    defaultDelayHours: 24,
    ready: true,
  },
  {
    key: "delivered_review",
    title: "Order Delivered",
    description: "Ask for a review after delivery.",
    defaultDelayHours: 24,
    ready: false,
  },
  {
    key: "replenishment",
    title: "Replenishment",
    description: "Bring customers back after the product cycle.",
    defaultDelayHours: 2160,
    ready: false,
  },
  {
    key: "diwali_campaign",
    title: "Diwali Campaign",
    description: "Seasonal reminders 14, 7, and 2 days before the sale.",
    defaultDelayHours: 0,
    ready: false,
  },
  {
    key: "wedding_season",
    title: "Wedding Season",
    description: "Oct, Nov, Dec, and Feb seasonal campaigns.",
    defaultDelayHours: 0,
    ready: false,
  },
];

const FALLBACK_TEMPLATE_BODY =
  "Hi {{customer_name}}, you left items in your cart. Tap the button below to complete your order.";

function formatDelay(seconds?: number) {
  const value = Number(seconds || 0);
  if (!value) return "Immediately";
  if (value < 3600) return `${Math.round(value / 60)} min`;
  if (value < 86400) return `${Math.round(value / 3600)} hr`;
  return `${Math.round(value / 86400)} day`;
}

function getTemplateBody(template: WhatsappTemplate) {
  const body = (template.components || []).find((component) => component?.type === "BODY");
  return String(body?.text || "");
}

function ruleTemplateLabel(rule: AutomationRule | undefined, automationTemplates: { id: number; name: string }[]) {
  if (!rule?.message_template_id) return "No template selected";
  return automationTemplates.find((template) => template.id === rule.message_template_id)?.name || "Selected template";
}

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("cart_abandoned");
  const [templateSource, setTemplateSource] = useState<"whatsapp" | "automation">("whatsapp");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [campaignName, setCampaignName] = useState("Abandoned Cart Recovery");
  const [delayHours, setDelayHours] = useState("24");
  const [enabled, setEnabled] = useState(true);

  const rulesQuery = useQuery({
    queryKey: ["campaign-automation-rules"],
    queryFn: getAutomationRules,
  });

  const automationTemplatesQuery = useQuery({
    queryKey: ["campaign-automation-templates"],
    queryFn: getAutomationTemplates,
  });

  const whatsappTemplatesQuery = useQuery({
    queryKey: ["campaign-whatsapp-templates"],
    queryFn: () =>
      getWhatsappTemplates({
        status: "APPROVED",
        category: "MARKETING",
        limit: 100,
      }),
  });

  const seedMutation = useMutation({
    mutationFn: seedAutomationDefaults,
    onSuccess: () => {
      ToasterUtils.success("Default automations are ready");
      queryClient.invalidateQueries({ queryKey: ["campaign-automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-automation-templates"] });
    },
    onError: () => ToasterUtils.error("Unable to seed automation defaults"),
  });

  const syncTemplatesMutation = useMutation({
    mutationFn: syncWhatsappTemplates,
    onSuccess: () => {
      ToasterUtils.success("Templates synced");
      queryClient.invalidateQueries({ queryKey: ["campaign-whatsapp-templates"] });
    },
    onError: () => ToasterUtils.error("Template sync failed"),
  });

  const saveMutation = useMutation({
    mutationFn: updateAutomationRule,
    onSuccess: () => {
      ToasterUtils.success("Campaign saved");
      queryClient.invalidateQueries({ queryKey: ["campaign-automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-automation-templates"] });
    },
    onError: () => ToasterUtils.error("Unable to save campaign"),
  });

  const rules = rulesQuery.data || [];
  const automationTemplates = automationTemplatesQuery.data || [];
  const whatsappTemplates = whatsappTemplatesQuery.data?.data || [];
  const selectedCampaign = CAMPAIGN_TYPES.find((campaign) => campaign.key === selectedType) || CAMPAIGN_TYPES[0];
  const abandonedRule = rules.find((rule) => rule.trigger === "cart_abandoned");
  const activeRule = selectedType === "cart_abandoned" ? abandonedRule : undefined;

  const selectedWhatsappTemplate = useMemo(
    () => whatsappTemplates.find((template) => String(template.id) === selectedTemplateId),
    [selectedTemplateId, whatsappTemplates],
  );
  const selectedAutomationTemplate = useMemo(
    () => automationTemplates.find((template) => String(template.id) === selectedTemplateId),
    [selectedTemplateId, automationTemplates],
  );

  useEffect(() => {
    if (!activeRule) return;
    setCampaignName(activeRule.name || "Abandoned Cart Recovery");
    setDelayHours(String(Math.round((activeRule.delay_seconds || 0) / 3600)));
    setEnabled(Boolean(activeRule.enabled));
    if (activeRule.message_template_id) {
      setTemplateSource("automation");
      setSelectedTemplateId(String(activeRule.message_template_id));
    }
  }, [activeRule?.id, activeRule?.message_template_id, activeRule?.delay_seconds, activeRule?.enabled, activeRule?.name]);

  const previewBody =
    templateSource === "whatsapp"
      ? getTemplateBody(selectedWhatsappTemplate as WhatsappTemplate) || FALLBACK_TEMPLATE_BODY
      : selectedAutomationTemplate?.body || FALLBACK_TEMPLATE_BODY;

  const saveCampaign = () => {
    if (!activeRule) {
      ToasterUtils.error("Seed defaults first to create the abandoned cart rule");
      return;
    }
    const parsedHours = Math.max(0, Number(delayHours) || 0);
    const payload =
      templateSource === "whatsapp"
        ? {
            ruleId: activeRule.id,
            name: campaignName.trim() || "Abandoned Cart Recovery",
            whatsapp_template_id: selectedTemplateId ? Number(selectedTemplateId) : null,
            delay_seconds: Math.round(parsedHours * 3600),
            enabled,
          }
        : {
            ruleId: activeRule.id,
            name: campaignName.trim() || "Abandoned Cart Recovery",
            message_template_id: selectedTemplateId ? Number(selectedTemplateId) : null,
            delay_seconds: Math.round(parsedHours * 3600),
            enabled,
          };
    saveMutation.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">WhatsApp Automation Campaigns</h1>
            <p className="mt-2 text-sm text-muted">
              Connect Shopify events to approved WhatsApp templates and control when each campaign sends.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              text="Sync Templates"
              icon={FiRefreshCw}
              variant="outline"
              color="surface"
              onClick={() => syncTemplatesMutation.mutate()}
              loading={syncTemplatesMutation.isPending}
              disabled={syncTemplatesMutation.isPending}
              fullWidthOnMobile
            />
            <Button
              text="Seed Defaults"
              icon={FiCheckCircle}
              variant="outline"
              color="surface"
              onClick={() => seedMutation.mutate()}
              loading={seedMutation.isPending}
              disabled={seedMutation.isPending}
              fullWidthOnMobile
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          {CAMPAIGN_TYPES.map((campaign) => {
            const selected = campaign.key === selectedType;
            return (
              <button
                key={campaign.key}
                type="button"
                onClick={() => setSelectedType(campaign.key)}
                className={`w-full rounded-md border px-4 py-3 text-left transition ${
                  selected ? "border-primary bg-primary/5" : "border-default bg-surface hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{campaign.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{campaign.description}</p>
                  </div>
                  <StatusBadge
                    status={campaign.ready ? "Active" : "Pending"}
                    displayText={campaign.ready ? "Ready" : "Soon"}
                    className="cursor-default"
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-default bg-surface p-5">
            <div className="flex flex-col gap-4 border-b border-default pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedCampaign.title}</h2>
                <p className="mt-1 text-sm text-muted">{selectedCampaign.description}</p>
              </div>
              {activeRule ? (
                <div className="inline-flex items-center gap-3">
                  <ToggleButton isOn={enabled} size="sm" onToggle={() => setEnabled((value) => !value)} />
                  <StatusBadge
                    status={enabled ? "Active" : "Inactive"}
                    displayText={enabled ? "Enabled" : "Paused"}
                    className="cursor-default"
                  />
                </div>
              ) : null}
            </div>

            {!selectedCampaign.ready ? (
              <div className="py-12 text-center">
                <FiClock className="mx-auto h-8 w-8 text-muted" />
                <p className="mt-3 text-sm font-semibold text-foreground">This campaign type is not connected yet.</p>
                <p className="mt-1 text-sm text-muted">Start with Cart Abandoned, then add seasonal scheduling.</p>
              </div>
            ) : activeRule ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                  <CustomInput
                    label="Campaign name"
                    value={campaignName}
                    onChange={setCampaignName}
                    placeholder="Abandoned Cart Recovery"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <CustomInput
                      label="Send after"
                      type="number"
                      min="0"
                      value={delayHours}
                      onChange={setDelayHours}
                      helperText={`Current delay: ${formatDelay(Number(delayHours || 0) * 3600)}`}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="mb-0.5 text-sm font-medium text-gray-800">Template source</label>
                      <select
                        value={templateSource}
                        onChange={(event) => {
                          setTemplateSource(event.target.value as "whatsapp" | "automation");
                          setSelectedTemplateId("");
                        }}
                        className="h-[45px] rounded-[5px] border border-gray-300 bg-white px-3 text-sm text-[#0d0c22] outline-none focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30"
                      >
                        <option value="whatsapp">Approved WhatsApp templates</option>
                        <option value="automation">Automation templates</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="mb-0.5 text-sm font-medium text-gray-800">Template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(event) => setSelectedTemplateId(event.target.value)}
                      className="h-[45px] rounded-[5px] border border-gray-300 bg-white px-3 text-sm text-[#0d0c22] outline-none focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30"
                    >
                      <option value="">
                        {templateSource === "whatsapp" ? "Select approved WhatsApp template" : "Select automation template"}
                      </option>
                      {templateSource === "whatsapp"
                        ? whatsappTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} - {template.language}
                            </option>
                          ))
                        : automationTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} - {template.language}
                            </option>
                          ))}
                    </select>
                    <p className="text-xs text-muted">
                      Current rule template: {ruleTemplateLabel(activeRule, automationTemplates)}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      text="Save Campaign"
                      icon={FiSave}
                      onClick={saveCampaign}
                      loading={saveMutation.isPending}
                      disabled={saveMutation.isPending || !selectedTemplateId}
                      fullWidthOnMobile
                    />
                  </div>
                </div>

                <aside className="rounded-md border border-default bg-surface-strong p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FiSend className="h-4 w-4" />
                    Message preview
                  </div>
                  <div className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-foreground shadow-sm">
                    {previewBody
                      .replaceAll("{{1}}", "Riya")
                      .replaceAll("{{2}}", "https://store/cart/abc123")
                      .replaceAll("{{3}}", "1099")
                      .replaceAll("{{4}}", "INR")
                      .replaceAll("{{customer_name}}", "Riya")
                      .replaceAll("{{cart_url}}", "https://store/cart/abc123")
                      .replaceAll("{{total}}", "1099")
                      .replaceAll("{{currency}}", "INR")}
                  </div>
                  <dl className="mt-4 space-y-2 text-xs text-muted">
                    <div className="flex justify-between gap-3">
                      <dt>Trigger</dt>
                      <dd className="font-medium text-foreground">Shopify abandoned checkout</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Delay</dt>
                      <dd className="font-medium text-foreground">{formatDelay(Number(delayHours || 0) * 3600)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Status</dt>
                      <dd className="font-medium text-foreground">{enabled ? "Enabled" : "Paused"}</dd>
                    </div>
                  </dl>
                </aside>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No abandoned cart rule found.</p>
                <p className="mt-1 text-sm text-muted">Seed defaults to create the rule, then attach a template.</p>
                <Button
                  text="Seed Defaults"
                  icon={FiCheckCircle}
                  className="mt-4"
                  onClick={() => seedMutation.mutate()}
                  loading={seedMutation.isPending}
                  disabled={seedMutation.isPending}
                />
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
