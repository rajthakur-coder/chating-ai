"use client";

import Icon from "@/components/ui/Icon";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BotSettings,
  CommerceFlowSettings,
  LlmReplySettings,
  getBotSettings,
  getLlmProviders,
  getTenantConfig,
  runAgentPreview,
  updateBotSettings,
  updateHeadlessAgentSettings,
  updateTenantCommerceFlowSettings,
} from "@/services/botSettings";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/shared/Button";
import CustomSelect from "@/components/shared/CustomSelect";
import CustomInput from "@/components/shared/inputField";
import ToggleButton from "@/components/shared/ToggleButton";
import Skeleton from "@/components/shared/Skeleton";

const defaultSettings: BotSettings = {
  bot_enabled: true,
  default_language: "english",
  welcome_message: "Welcome! How can I help you today?",
  fallback_message:
    "I do not have that information right now. I can connect you with our support team.",
  offline_message:
    "Our support team is offline right now. Your request is noted and the team will reply during business hours.",
  ai_personality: "helpful",
  ai_tone: "friendly",
  response_length: "brief",
  custom_instructions: "",
  brand_prompt: "",
  main_menu_buttons: [
    { id: "menu:catalog", title: "View catalog" },
    { id: "menu:order_status", title: "Track order" },
    { id: "menu:human", title: "Talk to human" },
  ],
  handoff_keywords: ["human", "agent", "support", "complaint", "manager"],
  business_hours_enabled: false,
  business_hours_start: "09:00",
  business_hours_end: "18:00",
  timezone: "Asia/Kolkata",
};

const defaultLlmSettings: LlmReplySettings = {
  provider: "openrouter",
  model: "openai/gpt-4o-mini",
  fallback_provider: "openrouter",
  fallback_model: "openai/gpt-4o-mini",
  base_url: "",
  api_key_env: "",
};

const defaultCommerceFlowSettings: CommerceFlowSettings = {
  returning_shopper_message:
    "Welcome back.\n\nLast time: {item_name}.\n\nWant to reorder, see best sellers, or browse the catalog?",
  order_id_prompt: "Sure. Drop your order ID, like #1234, or the phone used for the order.",
  catalog_unavailable_message:
    "I could not load the store categories right now. Try asking for best sellers or all products.",
  return_order_prompt: "Sorry it did not work out. Which order?",
  return_reason_prompt:
    "We're sorry the product wasn't the right fit for you. Please choose the reason for your return / exchange so we can assist you better.",
  return_reason_fallback: "What went wrong: damaged, wrong product, or other?",
  return_cancelled_message: "Okay, I have not started the return. Anything else I can help with?",
  return_confirmation_prompt: "I can check return eligibility first.\n\nShould I continue?",
  return_confirmation_fallback: "{body} Reply Yes or No.",
  return_outcome_prompt:
    "You're within the return window.\n\nWant a refund, exchange, or store credit with a 5% bonus?",
  gifting_occasion_prompt: "Lovely. What is the occasion?",
  gifting_occasion_fallback: "Corporate gifting, wedding/event, hospitality, or personal large order?",
  gifting_quantity_prompt: "Quantity?",
  gifting_quantity_fallback: "Quantity: <25, 25-100, 100+?",
  gifting_timeline_prompt: "Timeline?",
  gifting_timeline_fallback: "Timeline: <2 weeks, 2-4 weeks, or flexible?",
  gifting_email_prompt:
    "Based on this, curated sets can work well.\n\nDrop your name and email, and I will log a proposal request for gifting.",
  bundle_push_message: "Good pick. Want to pair it with {product_title}?",
  first_time_offer_with_code: "First time at {brand_name}. Welcome.\n\nUse code {code} on your first order.",
  first_time_offer_no_code: "First time at {brand_name}. Welcome.\n\nWant to see best sellers or browse the catalog.",
  returning_shopper_buttons: [
    { id: "reorder:{order_number}", title: "Reorder now" },
    { id: "catalog:best_sellers", title: "Best sellers" },
    { id: "menu:catalog", title: "Browse" },
  ],
  return_outcome_buttons: [
    { id: "return:refund", title: "Refund" },
    { id: "return:exchange", title: "Exchange" },
    { id: "return:credit", title: "Store credit" },
  ],
  gifting_quantity_buttons: [
    { id: "gift_qty:<25", title: "<25" },
    { id: "gift_qty:25-100", title: "25-100" },
    { id: "gift_qty:100+", title: "100+" },
  ],
  gifting_timeline_buttons: [
    { id: "gift_time:<2w", title: "<2 weeks" },
    { id: "gift_time:2-4w", title: "2-4 weeks" },
    { id: "gift_time:flex", title: "Flexible" },
  ],
  bundle_push_buttons: [
    { id: "bundle:add", title: "Add bundle" },
    { id: "bundle:skip", title: "Just this" },
  ],
};

const languageOptions = [
  { value: "english", label: "English" },
  { value: "auto", label: "Auto detect" },
  { value: "hindi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish" },
];

const personalityOptions = [
  { value: "helpful", label: "Helpful assistant" },
  { value: "sales", label: "Sales consultant" },
  { value: "support", label: "Support agent" },
  { value: "luxury", label: "Premium brand voice" },
  { value: "playful", label: "Playful expert" },
];

const toneOptions = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "empathetic", label: "Empathetic" },
  { value: "direct", label: "Direct" },
];

const replyLengthOptions = [
  { value: "short", label: "Short" },
  { value: "brief", label: "Brief" },
  { value: "detailed", label: "Detailed" },
];

const commerceTextFields: Array<{
  key: keyof CommerceFlowSettings;
  label: string;
  rows?: number;
  helperText?: string;
}> = [
  { key: "returning_shopper_message", label: "Returning shopper", rows: 4, helperText: "Use {item_name} for the last product." },
  { key: "first_time_offer_with_code", label: "First-time offer with code", rows: 3, helperText: "Use {brand_name} and {code}." },
  { key: "first_time_offer_no_code", label: "First-time offer without code", rows: 3, helperText: "Use {brand_name}." },
  { key: "order_id_prompt", label: "Order ID prompt", rows: 3 },
  { key: "catalog_unavailable_message", label: "Catalog unavailable", rows: 3 },
  { key: "return_order_prompt", label: "Return order prompt", rows: 2 },
  { key: "return_reason_prompt", label: "Return reason prompt", rows: 2 },
  { key: "return_confirmation_prompt", label: "Return confirmation", rows: 3 },
  { key: "return_outcome_prompt", label: "Return outcome prompt", rows: 3 },
  { key: "return_cancelled_message", label: "Return cancelled", rows: 2 },
  { key: "gifting_occasion_prompt", label: "Gifting occasion", rows: 2 },
  { key: "gifting_quantity_prompt", label: "Gifting quantity", rows: 2 },
  { key: "gifting_timeline_prompt", label: "Gifting timeline", rows: 2 },
  { key: "gifting_email_prompt", label: "Gifting lead capture", rows: 4 },
  { key: "bundle_push_message", label: "Bundle push", rows: 2, helperText: "Use {product_title}." },
];

type SettingsTab = "reply" | "handoff" | "commerce" | "advanced";

const settingsTabs: Array<{ key: SettingsTab; label: string; description: string; icon: string }> = [
  {
    key: "reply",
    label: "AI Reply",
    description: "Voice, model, prompt and preview.",
    icon: "fi:message-circle",
  },
  {
    key: "handoff",
    label: "Handoff",
    description: "Human routing and business hours.",
    icon: "fi:user-check",
  },
  {
    key: "commerce",
    label: "Commerce",
    description: "Store flows customers actually use.",
    icon: "fi:shopping-bag",
  },
  {
    key: "advanced",
    label: "Advanced",
    description: "Provider fallback and system prompt.",
    icon: "fi:settings",
  },
];

const primaryCommerceFields: Array<(typeof commerceTextFields)[number]["key"]> = [
  "returning_shopper_message",
  "first_time_offer_with_code",
  "order_id_prompt",
  "return_reason_prompt",
  "bundle_push_message",
];

export default function BotSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["bot-settings"],
    queryFn: getBotSettings,
  });
  const llmProvidersQuery = useQuery({
    queryKey: ["llm-providers"],
    queryFn: getLlmProviders,
  });
  const tenantConfigQuery = useQuery({
    queryKey: ["tenant-config"],
    queryFn: getTenantConfig,
    retry: false,
  });
  const [form, setForm] = useState<BotSettings>(defaultSettings);
  const [llmForm, setLlmForm] = useState<LlmReplySettings>(defaultLlmSettings);
  const [commerceFlowForm, setCommerceFlowForm] =
    useState<CommerceFlowSettings>(defaultCommerceFlowSettings);
  const [activeTab, setActiveTab] = useState<SettingsTab>("reply");
  const [previewPhone, setPreviewPhone] = useState("");
  const [previewMessage, setPreviewMessage] = useState("Hi, suggest me something");
  const [previewResult, setPreviewResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) return;
    const nextForm = {
      ...defaultSettings,
      ...settingsQuery.data,
      main_menu_buttons: settingsQuery.data.main_menu_buttons?.length
        ? settingsQuery.data.main_menu_buttons
        : defaultSettings.main_menu_buttons,
    };
    queueMicrotask(() => setForm(nextForm));
  }, [settingsQuery.data]);

  useEffect(() => {
    const llm = tenantConfigQuery.data?.metadata?.llm;
    const commerceFlow = tenantConfigQuery.data?.metadata?.flow_settings?.commerce;
    if (commerceFlow) {
      queueMicrotask(() =>
        setCommerceFlowForm({
          ...defaultCommerceFlowSettings,
          ...commerceFlow,
          returning_shopper_buttons: commerceFlow.returning_shopper_buttons?.length
            ? commerceFlow.returning_shopper_buttons
            : defaultCommerceFlowSettings.returning_shopper_buttons,
          return_outcome_buttons: commerceFlow.return_outcome_buttons?.length
            ? commerceFlow.return_outcome_buttons
            : defaultCommerceFlowSettings.return_outcome_buttons,
          gifting_quantity_buttons: commerceFlow.gifting_quantity_buttons?.length
            ? commerceFlow.gifting_quantity_buttons
            : defaultCommerceFlowSettings.gifting_quantity_buttons,
          gifting_timeline_buttons: commerceFlow.gifting_timeline_buttons?.length
            ? commerceFlow.gifting_timeline_buttons
            : defaultCommerceFlowSettings.gifting_timeline_buttons,
          bundle_push_buttons: commerceFlow.bundle_push_buttons?.length
            ? commerceFlow.bundle_push_buttons
            : defaultCommerceFlowSettings.bundle_push_buttons,
        }),
      );
    }
    if (!llm) return;
    const reply = llm.reply || llm;
    const fallback = reply.fallbacks?.[0] || llm.fallbacks?.[0] || {};
    queueMicrotask(() =>
      setLlmForm({
        ...defaultLlmSettings,
        provider: String(reply.provider || defaultLlmSettings.provider),
        model: String(reply.model || defaultLlmSettings.model),
        fallback_provider: String(fallback.provider || defaultLlmSettings.fallback_provider),
        fallback_model: String(fallback.model || defaultLlmSettings.fallback_model),
        base_url: String(reply.base_url || ""),
        api_key_env: String(reply.api_key_env || ""),
      }),
    );
  }, [tenantConfigQuery.data]);

  const providerMap = llmProvidersQuery.data || {};
  const providerOptions = Object.keys(providerMap).map((provider) => ({
    value: provider,
    label: provider.charAt(0).toUpperCase() + provider.slice(1),
  }));
  const modelOptions = (providerMap[llmForm.provider] || []).map((model) => ({
    value: model,
    label: model,
  }));
  const fallbackModelOptions = (providerMap[llmForm.fallback_provider] || []).map((model) => ({
    value: model,
    label: model,
  }));

  const saveMutation = useMutation({
    mutationFn: async (payload: BotSettings) => {
      const [settings] = await Promise.all([
        updateBotSettings(payload),
        updateHeadlessAgentSettings(llmForm, commerceFlowForm),
        updateTenantCommerceFlowSettings(tenantConfigQuery.data, commerceFlowForm),
      ]);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-config"] });
      ToasterUtils.success("AI agent settings saved");
    },
    onError: () => ToasterUtils.error("Unable to save AI agent settings"),
  });

  const previewMutation = useMutation({
    mutationFn: runAgentPreview,
    onSuccess: (data) => {
      setPreviewResult(data);
      ToasterUtils.success("Preview response generated");
    },
    onError: () => ToasterUtils.error("Unable to run agent preview"),
  });

  const updateField = <K extends keyof BotSettings>(key: K, value: BotSettings[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateLlmField = <K extends keyof LlmReplySettings>(key: K, value: LlmReplySettings[K]) => {
    setLlmForm((current) => ({ ...current, [key]: value }));
  };

  const updateCommerceField = <K extends keyof CommerceFlowSettings>(
    key: K,
    value: CommerceFlowSettings[K],
  ) => {
    setCommerceFlowForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">AI agent control</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Bot Settings</h1>
            <p className="mt-2 text-sm text-muted">
              Keep the WhatsApp bot live, on-brand, and easy to hand over when a customer needs a person.
            </p>
          </div>
          <Button
            type="submit"
            form="bot-settings-form"
            text={saveMutation.isPending ? "Saving..." : "Save Changes"}
            icon="fi:save"
            loading={saveMutation.isPending}
            loaderType="bounce"
            disabled={saveMutation.isPending || settingsQuery.isLoading}
            fullWidthOnMobile
          />
        </div>
      </section>

      {settingsQuery.isLoading || tenantConfigQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton type="tabs" columns={4} />
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <Skeleton type="card" rows={1} cardPerRow={1} cardHeight={360} />
            <Skeleton type="card" rows={1} cardPerRow={1} cardHeight={360} />
          </section>
          <Skeleton type="card" rows={1} cardPerRow={1} cardHeight={220} />
        </div>
      ) : null}

      {!settingsQuery.isLoading && !tenantConfigQuery.isLoading ? (
      <form id="bot-settings-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="rounded-lg border border-default bg-surface p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">WhatsApp AI Agent</h2>
                  <StatusPill active={form.bot_enabled} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  This is the master switch for automated WhatsApp replies. Campaign automations stay on their own page.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-default bg-white px-3 py-2">
                <span className="text-sm font-semibold text-foreground">
                  {form.bot_enabled ? "Running" : "Paused"}
                </span>
                <ToggleButton
                  isOn={form.bot_enabled}
                  onToggle={() => updateField("bot_enabled", !form.bot_enabled)}
                  size="sm"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <ControlStat icon="fi:message-circle" label="Reply mode" value={form.ai_tone || "friendly"} />
              <ControlStat icon="fi:cpu" label="Model" value={llmForm.model || "Not set"} />
              <ControlStat icon="fi:shield" label="Handoff" value={`${form.handoff_keywords.length} keywords`} />
            </div>
          </div>

          <div className="rounded-lg border border-default bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon name="fi:zap" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Production Checklist</h2>
                <p className="text-xs text-muted">Only the controls that affect live replies.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <ChecklistItem done={form.bot_enabled} label="Bot is allowed to reply" />
              <ChecklistItem done={Boolean(form.fallback_message.trim())} label="Fallback reply is set" />
              <ChecklistItem done={Boolean(form.offline_message.trim())} label="Offline handoff message is set" />
              <ChecklistItem done={Boolean(llmForm.provider && llmForm.model)} label="Reply model is configured" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-3">
            {settingsTabs.map((tab) => (
              <SettingsTabButton
                key={tab.key}
                active={activeTab === tab.key}
                description={tab.description}
                icon={tab.icon}
                label={tab.label}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>

          <div className="min-w-0 rounded-lg border border-default bg-surface p-5 shadow-sm">
            {activeTab === "reply" ? (
              <div className="space-y-6">
                <SectionIntro
                  icon="fi:message-circle"
                  title="AI Reply"
                  description="Set the bot voice, everyday replies, and test how it answers before saving."
                />
                <div className="grid gap-4 md:grid-cols-4">
                  <CustomSelect
                    label="Language"
                    value={form.default_language}
                    options={languageOptions}
                    onChange={(value) => updateField("default_language", value)}
                  />
                  <CustomSelect
                    label="Personality"
                    value={form.ai_personality}
                    options={personalityOptions}
                    onChange={(value) => updateField("ai_personality", value)}
                  />
                  <CustomSelect
                    label="Tone"
                    value={form.ai_tone}
                    options={toneOptions}
                    onChange={(value) => updateField("ai_tone", value)}
                  />
                  <CustomSelect
                    label="Reply length"
                    value={form.response_length}
                    options={replyLengthOptions}
                    onChange={(value) => updateField("response_length", value)}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <CustomInput
                    label="Welcome message"
                    value={form.welcome_message}
                    onChange={(value) => updateField("welcome_message", value)}
                    multiline
                    rows={3}
                  />
                  <CustomInput
                    label="Fallback message"
                    value={form.fallback_message}
                    onChange={(value) => updateField("fallback_message", value)}
                    multiline
                    rows={3}
                  />
                </div>
                <CustomInput
                  label="Brand rules"
                  value={form.custom_instructions}
                  maxLength={2000}
                  onChange={(value) => updateField("custom_instructions", value)}
                  placeholder="Example: Mention COD only when available. Do not promise discounts without approval."
                  helperText="Short operating rules added to every AI reply."
                  multiline
                  rows={4}
                />
                <div className="rounded-md border border-default bg-white p-4">
                  <h3 className="text-sm font-semibold text-foreground">Quick Menu Buttons</h3>
                  <p className="mt-1 text-xs text-muted">Shown when the bot offers customers the main menu.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {form.main_menu_buttons.map((button, index) => (
                      <CustomInput
                        key={`${button.id}-${index}`}
                        label={`Button ${index + 1}`}
                        value={button.title}
                        maxLength={20}
                        onChange={(value) =>
                          updateField(
                            "main_menu_buttons",
                            form.main_menu_buttons.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, title: value } : row,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                <PreviewPanel
                  previewMessage={previewMessage}
                  previewMutationPending={previewMutation.isPending}
                  previewPhone={previewPhone}
                  previewResult={previewResult}
                  runPreview={() =>
                    previewMutation.mutate({
                      phone: previewPhone.trim(),
                      message: previewMessage.trim(),
                    })
                  }
                  setPreviewMessage={setPreviewMessage}
                  setPreviewPhone={setPreviewPhone}
                />
              </div>
            ) : null}

            {activeTab === "handoff" ? (
              <div className="space-y-6">
                <SectionIntro
                  icon="fi:user-check"
                  title="Handoff"
                  description="Control when the AI pauses and how customers are routed to the team."
                />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <CustomInput
                    label="Handoff keywords"
                    value={form.handoff_keywords.join(", ")}
                    onChange={(value) =>
                      updateField(
                        "handoff_keywords",
                        value
                          .split(",")
                          .map((item) => item.trim().toLowerCase())
                          .filter(Boolean),
                      )
                    }
                    helperText="Comma separated words that open a human handoff ticket."
                    placeholder="human, agent, support, complaint"
                  />
                  <div className="rounded-md border border-default bg-white p-3">
                    <p className="text-xs font-semibold uppercase text-muted">Current routing</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {form.handoff_keywords.length} keywords
                    </p>
                    <p className="mt-1 text-xs text-muted">Matched messages pause the bot for that customer.</p>
                  </div>
                </div>
                <CustomInput
                  label="Offline handoff message"
                  value={form.offline_message}
                  onChange={(value) => updateField("offline_message", value)}
                  multiline
                  rows={4}
                />
                <div className="rounded-md border border-default bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon name="fi:clock" className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Business Hours</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted">Used for routing and offline replies.</p>
                    </div>
                    <ToggleButton
                      isOn={form.business_hours_enabled}
                      onToggle={() => updateField("business_hours_enabled", !form.business_hours_enabled)}
                      size="sm"
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <CustomInput
                      label="Start"
                      value={form.business_hours_start}
                      onChange={(value) => updateField("business_hours_start", value)}
                      placeholder="09:00"
                    />
                    <CustomInput
                      label="End"
                      value={form.business_hours_end}
                      onChange={(value) => updateField("business_hours_end", value)}
                      placeholder="18:00"
                    />
                    <CustomInput
                      label="Timezone"
                      value={form.timezone}
                      onChange={(value) => updateField("timezone", value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "commerce" ? (
              <div className="space-y-6">
                <SectionIntro
                  icon="fi:shopping-bag"
                  title="Commerce"
                  description="Edit the high-impact store replies customers see during shopping, returns, and checkout."
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  {commerceTextFields
                    .filter((field) => primaryCommerceFields.includes(field.key))
                    .map((field) => (
                      <CustomInput
                        key={field.key}
                        label={field.label}
                        value={String(commerceFlowForm[field.key] || "")}
                        onChange={(value) =>
                          updateCommerceField(field.key, value as CommerceFlowSettings[typeof field.key])
                        }
                        helperText={field.helperText}
                        multiline={(field.rows || 1) > 1}
                        rows={field.rows || 1}
                      />
                    ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    { key: "returning_shopper_buttons", label: "Returning shopper buttons" },
                    { key: "return_outcome_buttons", label: "Return outcome buttons" },
                    { key: "bundle_push_buttons", label: "Bundle push buttons" },
                  ].map((group) => {
                    const key = group.key as
                      | "returning_shopper_buttons"
                      | "return_outcome_buttons"
                      | "bundle_push_buttons";
                    return (
                      <div key={key} className="rounded-md border border-default bg-white p-4">
                        <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          {commerceFlowForm[key].map((button, index) => (
                            <CustomInput
                              key={`${key}-${button.id}-${index}`}
                              label={`Button ${index + 1}`}
                              value={button.title}
                              maxLength={20}
                              onChange={(value) =>
                                updateCommerceField(
                                  key,
                                  commerceFlowForm[key].map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, title: value } : row,
                                  ),
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTab === "advanced" ? (
              <div className="space-y-6">
                <SectionIntro
                  icon="fi:settings"
                  title="Advanced"
                  description="Provider routing and full system prompt overrides for technical operators."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <CustomSelect
                    label="Provider"
                    value={llmForm.provider}
                    options={providerOptions}
                    disabled={llmProvidersQuery.isLoading}
                    onChange={(value) =>
                      setLlmForm((current) => ({
                        ...current,
                        provider: value,
                        model: providerMap[value]?.[0] || current.model,
                      }))
                    }
                  />
                  <CustomSelect
                    label="Model"
                    value={llmForm.model}
                    options={modelOptions}
                    disabled={llmProvidersQuery.isLoading || llmForm.provider === "custom"}
                    onChange={(value) => updateLlmField("model", value)}
                  />
                  {llmForm.provider === "custom" ? (
                    <>
                      <CustomInput
                        label="Custom model"
                        value={llmForm.model}
                        onChange={(value) => updateLlmField("model", value)}
                        placeholder="my-model-name"
                      />
                      <CustomInput
                        label="Base URL"
                        value={llmForm.base_url}
                        onChange={(value) => updateLlmField("base_url", value)}
                        placeholder="https://api.example.com/v1/chat/completions"
                      />
                    </>
                  ) : null}
                  <CustomSelect
                    label="Fallback provider"
                    value={llmForm.fallback_provider}
                    options={providerOptions}
                    disabled={llmProvidersQuery.isLoading}
                    onChange={(value) =>
                      setLlmForm((current) => ({
                        ...current,
                        fallback_provider: value,
                        fallback_model: providerMap[value]?.[0] || current.fallback_model,
                      }))
                    }
                  />
                  <CustomSelect
                    label="Fallback model"
                    value={llmForm.fallback_model}
                    options={fallbackModelOptions}
                    disabled={llmProvidersQuery.isLoading || llmForm.fallback_provider === "custom"}
                    onChange={(value) => updateLlmField("fallback_model", value)}
                  />
                  <CustomInput
                    label="API key env"
                    value={llmForm.api_key_env}
                    onChange={(value) => updateLlmField("api_key_env", value)}
                    placeholder="OPENROUTER_API_KEY"
                    optional
                    helperText="Blank uses backend default env key."
                    className="md:col-span-2"
                  />
                </div>
                <CustomInput
                  label="System prompt override"
                  value={form.brand_prompt}
                  onChange={(value) => updateField("brand_prompt", value)}
                  placeholder="You are a helpful assistant for My Brand. You reply in {reply_language}..."
                  helperText="Use only when you want to replace tone/personality/custom instructions completely."
                  multiline
                  rows={8}
                />
              </div>
            ) : null}
          </div>
        </section>
      </form>
      ) : null}
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {active ? "Live" : "Paused"}
    </span>
  );
}

function ControlStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-default bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted">
        <Icon name={icon} className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-default bg-white px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          done ? "bg-green-500" : "bg-amber-400"
        }`}
      />
    </div>
  );
}

function SettingsTabButton({
  active,
  description,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border px-4 py-3 text-left transition ${
        active ? "border-primary bg-primary/5 shadow-sm" : "border-default bg-surface hover:bg-surface-hover"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-md p-2 ${active ? "bg-primary text-white" : "bg-white text-primary"}`}>
          <Icon name={icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
    </button>
  );
}

function SectionIntro({
  description,
  icon,
  title,
}: {
  description: string;
  icon: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-default pb-4">
      <div className="rounded-md bg-primary/10 p-2 text-primary">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

function PreviewPanel({
  previewMessage,
  previewMutationPending,
  previewPhone,
  previewResult,
  runPreview,
  setPreviewMessage,
  setPreviewPhone,
}: {
  previewMessage: string;
  previewMutationPending: boolean;
  previewPhone: string;
  previewResult: Record<string, unknown> | null;
  runPreview: () => void;
  setPreviewMessage: (value: string) => void;
  setPreviewPhone: (value: string) => void;
}) {
  return (
    <div className="rounded-md border border-default bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Preview Reply</h3>
          <p className="mt-1 text-xs text-muted">Run a quick reply test before saving prompt changes.</p>
        </div>
        <Button
          type="button"
          text={previewMutationPending ? "Running..." : "Run Preview"}
          icon="fi:play"
          loading={previewMutationPending}
          loaderType="bounce"
          disabled={previewMutationPending || !previewMessage.trim()}
          onClick={runPreview}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <CustomInput
            label="Customer phone"
            value={previewPhone}
            onChange={setPreviewPhone}
            placeholder="+919999999999"
            optional
          />
          <CustomInput
            label="Customer message"
            value={previewMessage}
            onChange={setPreviewMessage}
            multiline
            rows={4}
          />
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border border-default bg-surface p-3 text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
          {JSON.stringify(previewResult || { status: "not_run" }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
