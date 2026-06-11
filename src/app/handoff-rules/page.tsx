"use client";

import Icon from "@/components/ui/Icon";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BotSettings, getBotSettings, updateBotSettings } from "@/services/botSettings";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/shared/Button";
import CustomInput from "@/components/shared/inputField";
import ToggleButton from "@/components/shared/ToggleButton";
import Skeleton from "@/components/shared/Skeleton";

type RuleGroup = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
};

const ruleGroups: RuleGroup[] = [
  {
    id: "human",
    title: "Human Agent Requests",
    description: "Pause the bot when users directly ask for a person.",
    keywords: ["human", "agent", "support", "representative", "manager", "person"],
  },
  {
    id: "complaints",
    title: "Complaints",
    description: "Escalate negative experiences before the bot keeps replying.",
    keywords: ["complaint", "complain", "angry", "bad service", "not happy", "issue"],
  },
  {
    id: "returns",
    title: "Refunds, Returns, Exchanges",
    description: "Send policy-sensitive ecommerce cases to the team.",
    keywords: ["refund", "return", "exchange", "replace", "replacement", "cancel order"],
  },
  {
    id: "delivery",
    title: "Delivery Problems",
    description: "Escalate missing, delayed, or damaged delivery cases.",
    keywords: ["not delivered", "late delivery", "damaged", "missing item", "wrong item"],
  },
  {
    id: "payment",
    title: "Payment Issues",
    description: "Route failed payments, duplicate charges, and COD problems.",
    keywords: ["payment failed", "paid twice", "double payment", "cod issue", "upi failed"],
  },
];

function uniqueKeywords(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  );
}

function groupEnabled(group: RuleGroup, activeKeywords: Set<string>) {
  return group.keywords.some((keyword) => activeKeywords.has(keyword));
}

function defaultSettings(settings?: BotSettings): BotSettings {
  return (
    settings || {
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
      handoff_keywords: [],
      business_hours_enabled: false,
      business_hours_start: "09:00",
      business_hours_end: "18:00",
      timezone: "Asia/Kolkata",
    }
  );
}

export default function HandoffRulesPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["bot-settings"],
    queryFn: getBotSettings,
  });
  const [enabledGroups, setEnabledGroups] = useState<Record<string, boolean>>({});
  const [customKeywords, setCustomKeywords] = useState("");

  useEffect(() => {
    const settings = settingsQuery.data;
    if (!settings) return;

    const activeKeywords = new Set(settings.handoff_keywords);
    const nextGroups: Record<string, boolean> = {};
    ruleGroups.forEach((group) => {
      nextGroups[group.id] = groupEnabled(group, activeKeywords);
    });
    setEnabledGroups(nextGroups);

    const presetKeywords = new Set(ruleGroups.flatMap((group) => group.keywords));
    const custom = settings.handoff_keywords.filter(
      (keyword) => !presetKeywords.has(keyword),
    );
    setCustomKeywords(custom.join(", "));
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updateBotSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
      ToasterUtils.success("Handoff rules saved");
    },
    onError: () => ToasterUtils.error("Unable to save handoff rules"),
  });

  const selectedKeywordCount = useMemo(() => {
    const presetCount = ruleGroups
      .filter((group) => enabledGroups[group.id])
      .flatMap((group) => group.keywords).length;
    const customCount = customKeywords.split(",").filter((item) => item.trim()).length;
    return presetCount + customCount;
  }, [customKeywords, enabledGroups]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const settings = defaultSettings(settingsQuery.data);
    const presetKeywords = ruleGroups
      .filter((group) => enabledGroups[group.id])
      .flatMap((group) => group.keywords);
    const extraKeywords = customKeywords.split(",");
    saveMutation.mutate({
      ...settings,
      handoff_keywords: uniqueKeywords([...presetKeywords, ...extraKeywords]),
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Handoff Rules
            </h1>
            <p className="mt-2 text-sm text-muted">
              Choose which customer messages should pause the bot and open a
              support ticket.
            </p>
          </div>
          <span className="text-sm font-medium text-muted">
            {selectedKeywordCount} active keywords
          </span>
        </div>
      </section>

      {settingsQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton type="card" rows={2} cardPerRow={2} cardHeight={145} />
          <Skeleton type="card" rows={1} cardPerRow={1} cardHeight={170} />
        </div>
      ) : null}

      {!settingsQuery.isLoading ? (
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-2">
          {ruleGroups.map((group) => (
            <div
              key={group.id}
              className="flex gap-4 rounded-lg border border-default bg-surface p-5 transition hover:bg-surface-strong"
            >
              <div className="mt-0.5 shrink-0">
                <ToggleButton
                  isOn={Boolean(enabledGroups[group.id])}
                  size="sm"
                  onToggle={() =>
                  setEnabledGroups((current) => ({
                    ...current,
                    [group.id]: !current[group.id],
                  }))
                }
                />
              </div>
              <span>
                <span className="block text-base font-semibold text-foreground">
                  {group.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  {group.description}
                </span>
                <span className="mt-3 flex flex-wrap gap-2">
                  {group.keywords.slice(0, 6).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-md border border-default bg-white px-2 py-1 text-xs text-muted dark:bg-slate-950"
                    >
                      {keyword}
                    </span>
                  ))}
                </span>
              </span>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Custom Keywords
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add store-specific words that should create a human handoff ticket.
          </p>
          <CustomInput
            value={customKeywords}
            onChange={setCustomKeywords}
            placeholder="bulk order, warranty, invoice issue"
            multiline
            rows={4}
            className="mt-4"
            helperText="Separate keywords with commas."
          />
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            text={saveMutation.isPending ? "Saving..." : "Save Handoff Rules"}
            icon="fi:save"
            loading={saveMutation.isPending}
            loaderType="bounce"
            disabled={saveMutation.isPending || settingsQuery.isLoading}
            fullWidthOnMobile
          />
        </div>
      </form>
      ) : null}
    </div>
  );
}
