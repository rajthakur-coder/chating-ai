"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ApiJson from "@/components/backend/ApiJson";
import { ToasterUtils } from "@/components/ui/toast";
import { agencyApi } from "@/services/backendModules";

export default function AgencyPage() {
  const [clientTenantId, setClientTenantId] = useState("");
  const [role, setRole] = useState("client");
  const queryClient = useQueryClient();
  const overview = useQuery({ queryKey: ["agency-overview"], queryFn: agencyApi.overview });
  const clients = useQuery({ queryKey: ["agency-clients"], queryFn: agencyApi.clients });
  const whiteLabel = useQuery({ queryKey: ["agency-white-label"], queryFn: agencyApi.whiteLabel });

  const saveClient = useMutation({
    mutationFn: agencyApi.saveClient,
    onSuccess: () => {
      ToasterUtils.success("Client saved");
      queryClient.invalidateQueries({ queryKey: ["agency-clients"] });
      queryClient.invalidateQueries({ queryKey: ["agency-overview"] });
    },
    onError: () => ToasterUtils.error("Unable to save agency client"),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-5">
        <h1 className="text-2xl font-semibold text-foreground">Agency</h1>
        <p className="mt-2 text-sm text-muted">Agency overview, client tenants and white-label profile APIs.</p>
      </section>

      <section className="rounded-lg border border-default bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Add / Update Client</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_140px]">
          <input value={clientTenantId} onChange={(event) => setClientTenantId(event.target.value)} placeholder="Client tenant ID" className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950" />
          <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role" className="h-10 rounded-md border border-default bg-white px-3 text-sm outline-none focus:border-border-primary dark:bg-slate-950" />
          <button disabled={!clientTenantId.trim() || saveClient.isPending} onClick={() => saveClient.mutate({ client_tenant_id: clientTenantId.trim(), role, status: "active" })} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-strong disabled:opacity-60">
            Save Client
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ApiJson data={{ overview: overview.data }} />
        <ApiJson data={{ clients: clients.data }} />
        <ApiJson data={{ white_label: whiteLabel.data, saved_client: saveClient.data }} />
      </section>
    </div>
  );
}

