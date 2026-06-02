"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getBotSettings, updateBotSettings } from "@/services/botSettings";
import { getRuntimeConfig } from "@/services/runtime";
import { ToasterUtils } from "@/components/ui/toast";
import ToggleButton from "@/components/Common/ToggleButton";

type EcommerceConnection = {
  id: number;
  name?: string | null;
  platform?: string | null;
  store_name?: string | null;
  store_url?: string | null;
  status?: string | null;
  webhook_status?: string | null;
  bot_enabled?: boolean;
};

function StatusPill({
  active,
  activeText = "Running",
  inactiveText = "Paused",
}: {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
}) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

export default function WhatsAppBotPage() {
  const queryClient = useQueryClient();

  const botSettingsQuery = useQuery({
    queryKey: ["bot-settings"],
    queryFn: getBotSettings,
  });
  const connectionsQuery = useQuery({
    queryKey: ["ecommerce-connections"],
    queryFn: async () => {
      const response = await api.get<EcommerceConnection[]>("/ecommerce/connections");
      return response.data || [];
    },
  });
  const runtimeQuery = useQuery({
    queryKey: ["runtime-config"],
    queryFn: getRuntimeConfig,
  });

  const botMutation = useMutation({
    mutationFn: updateBotSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
      ToasterUtils.success("Global bot status updated");
    },
    onError: () => ToasterUtils.error("Unable to update bot status"),
  });

  const storeMutation = useMutation({
    mutationFn: async ({
      connectionId,
      enabled,
    }: {
      connectionId: number;
      enabled: boolean;
    }) => {
      const response = await api.patch(`/ecommerce/connections/${connectionId}`, {
        bot_enabled: enabled,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-connections"] });
      ToasterUtils.success("Store bot status updated");
    },
    onError: () => ToasterUtils.error("Unable to update store bot status"),
  });

  const botSettings = botSettingsQuery.data;
  const connections = connectionsQuery.data || [];

  const runningStores = connections.filter((connection) => connection.bot_enabled !== false).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-4">
        <h1 className="text-2xl font-semibold text-foreground">WhatsApp Bot</h1>
        <p className="mt-2 text-sm text-muted">
          Monitor and pause the bot controls that affect live WhatsApp replies and ecommerce automations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-default bg-surface p-4">
          <p className="text-sm text-muted">Auto Reply</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <StatusPill active={Boolean(botSettings?.bot_enabled)} />
            <ToggleButton
              isOn={Boolean(botSettings?.bot_enabled)}
              size="sm"
              onToggle={() => {
                if (!botSettings) return;
                botMutation.mutate({
                  ...botSettings,
                  bot_enabled: !botSettings.bot_enabled,
                });
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-default bg-surface p-4">
          <p className="text-sm text-muted">Store Bots</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {runningStores}/{connections.length}
          </p>
          <p className="mt-1 text-xs text-muted">stores running</p>
        </div>

      </section>

      <section className="rounded-lg border border-default bg-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SectionHeader
            title="Server Runtime"
            description="These flags are read from backend environment/config and are shown here for visibility."
          />
          <button
            type="button"
            onClick={() => runtimeQuery.refetch()}
            className="w-fit rounded-md border border-default px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-strong"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-default bg-white p-3 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase text-muted">Shopify Webhook Automation</p>
            <div className="mt-2">
              <StatusPill
                active={Boolean(runtimeQuery.data?.shopify_webhook_automation_enabled)}
                inactiveText="Disabled"
              />
            </div>
          </div>
          <div className="rounded-md border border-default bg-white p-3 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase text-muted">Automation Processor</p>
            <div className="mt-2">
              <StatusPill active={Boolean(runtimeQuery.data?.automation_processor_enabled)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-default bg-surface p-5">
        <SectionHeader
          title="Connected Store Bots"
          description="Pause or resume bot replies for each connected ecommerce store."
        />
        <div className="mt-4 divide-y divide-default rounded-md border border-default">
          {connectionsQuery.isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Loading stores...</p>
          ) : null}
          {!connectionsQuery.isLoading && connections.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No ecommerce stores connected.</p>
          ) : null}
          {connections.map((connection) => {
            const enabled = connection.bot_enabled !== false;
            return (
              <div key={connection.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {connection.store_name || connection.name || connection.store_url || `Store #${connection.id}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {connection.platform || "store"} · {connection.status || "unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill active={enabled} />
                  <ToggleButton
                    isOn={enabled}
                    size="sm"
                    onToggle={() =>
                      storeMutation.mutate({
                        connectionId: connection.id,
                        enabled: !enabled,
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
