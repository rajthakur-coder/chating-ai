"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCheckCircle,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiZap,
} from "react-icons/fi";
import { Button } from "@/components/Common/Button";

type TemplateCategory = "MARKETING" | "UTILITY";
type TemplateBlueprint = {
  key: string;
  name: string;
  category: TemplateCategory;
  trigger: string;
  useCase: string;
  body: string;
  variables: string[];
  button?: string;
  performanceNote: string;
};

const BLUEPRINTS: TemplateBlueprint[] = [
  {
    key: "abandoned_cart_recovery",
    name: "Abandoned Cart Recovery",
    category: "MARKETING",
    trigger: "cart_abandoned",
    useCase: "Recover incomplete Shopify checkouts.",
    body: "Hi {{1}}, your cart is still saved. Tap below to complete your order.",
    variables: ["customer_name", "cart_token"],
    button: "Checkout URL",
    performanceNote: "Best sent after 12-24 hours.",
  },
  {
    key: "cod_verification",
    name: "COD Verification",
    category: "UTILITY",
    trigger: "cod_verification",
    useCase: "Confirm cash-on-delivery orders before fulfillment.",
    body: "Hi {{1}}, please reply YES to confirm your COD order {{2}} worth {{3}} {{4}}.",
    variables: ["customer_name", "order_number", "total", "currency"],
    performanceNote: "Use immediately after COD order creation.",
  },
  {
    key: "order_confirmation",
    name: "Order Confirmation",
    category: "UTILITY",
    trigger: "order_created",
    useCase: "Send a clean confirmation after a new order.",
    body: "Hi {{1}}, your order {{2}} is confirmed. Total amount is {{3}} {{4}}.",
    variables: ["customer_name", "order_number", "total", "currency"],
    performanceNote: "Use instantly after order creation.",
  },
  {
    key: "shipping_update",
    name: "Shipping Update",
    category: "UTILITY",
    trigger: "order_shipped",
    useCase: "Notify customers when fulfillment starts.",
    body: "Good news {{1}}, your order {{2}} has shipped. Tap below to track it.",
    variables: ["customer_name", "order_number", "tracking_number"],
    button: "Tracking URL",
    performanceNote: "Use when tracking data is available.",
  },
  {
    key: "delivered_review",
    name: "Delivered Review",
    category: "MARKETING",
    trigger: "delivered_review",
    useCase: "Collect simple ratings after delivery.",
    body: "Hope you are loving order {{2}}, {{1}}. Reply with a rating from 1 to 5.",
    variables: ["customer_name", "order_number"],
    performanceNote: "Best sent 1 day after delivery.",
  },
  {
    key: "replenishment",
    name: "Replenishment",
    category: "MARKETING",
    trigger: "replenishment",
    useCase: "Bring repeat buyers back after product usage cycle.",
    body: "Running low on {{2}}, {{1}}? Reply YES to reorder or see refills.",
    variables: ["customer_name", "product_name"],
    performanceNote: "Best for consumables and repeat-use products.",
  },
  {
    key: "browse_no_buy",
    name: "Browse No Buy",
    category: "MARKETING",
    trigger: "browse_no_buy",
    useCase: "Follow up when a shopper browses but does not buy.",
    body: "Still thinking it over, {{1}}? Reply YES and I will bring back the items you viewed.",
    variables: ["customer_name"],
    performanceNote: "Use after product browse intent.",
  },
  {
    key: "post_dispatch_cross_sell",
    name: "Post-dispatch Cross-sell",
    category: "MARKETING",
    trigger: "post_dispatch_cross_sell",
    useCase: "Recommend matching products after shipment.",
    body: "Your {{2}} is on the way, {{1}}. Reply YES to see matching picks.",
    variables: ["customer_name", "product_name"],
    performanceNote: "Works well for accessories and bundles.",
  },
];

const categoryOptions = ["All", "MARKETING", "UTILITY"] as const;

function toTemplateName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function TemplateLibraryPage() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("All");
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return BLUEPRINTS.filter((template) => {
      const categoryMatch = category === "All" || template.category === category;
      const searchMatch =
        !term ||
        [template.name, template.trigger, template.useCase, template.body]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return categoryMatch && searchMatch;
    });
  }, [category, search]);

  const openTemplateDesigner = (template: TemplateBlueprint) => {
    const params = new URLSearchParams({
      draftName: toTemplateName(template.name),
      draftCategory: template.category,
      draftBody: template.body,
    });
    router.push(`/template-message/template-design?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Template assets</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Template Library</h1>
            <p className="mt-2 text-sm text-muted">
              Agency-ready WhatsApp drafts for approval workflows and campaign setup.
            </p>
          </div>
          <Button
            text="View Approved Templates"
            icon={FiCheckCircle}
            variant="outline"
            color="surface"
            onClick={() => router.push("/template-message")}
            fullWidthOnMobile
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricTile icon={FiZap} label="Draft packs" value={String(BLUEPRINTS.length)} />
        <MetricTile icon={FiShoppingBag} label="Marketing" value={String(BLUEPRINTS.filter((item) => item.category === "MARKETING").length)} />
        <MetricTile icon={FiTruck} label="Utility" value={String(BLUEPRINTS.filter((item) => item.category === "UTILITY").length)} />
        <MetricTile icon={FiRefreshCw} label="Approval path" value="Meta" />
      </section>

      <section className="flex flex-col gap-3 border-b border-default pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-default bg-white px-3 py-2">
          <FiSearch className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by use case, trigger, or copy"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-muted" />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as (typeof categoryOptions)[number])}
            className="h-10 rounded-md border border-default bg-white px-3 text-sm text-foreground outline-none"
          >
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All categories" : item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {filteredTemplates.map((template) => (
          <article key={template.key} className="rounded-md border border-default bg-surface p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{template.name}</h2>
                  <span className="rounded border border-default bg-white px-2 py-1 text-[11px] font-semibold text-muted">
                    {template.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{template.useCase}</p>
              </div>
              <span className="w-fit rounded border border-default bg-white px-2 py-1 text-xs font-medium text-foreground">
                {template.trigger}
              </span>
            </div>

            <div className="mt-4 rounded-md border border-default bg-white p-3 text-sm leading-6 text-foreground">
              {template.body}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoBlock label="Variables" value={template.variables.join(", ")} />
              <InfoBlock label="Button" value={template.button || "None"} />
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">{template.performanceNote}</p>
              <Button
                text="Customize"
                icon={FiArrowRight}
                iconPosition="right"
                size="sm"
                onClick={() => openTemplateDesigner(template)}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MetricTile({ icon: Icon, label, value }: { icon: typeof FiZap; label: string; value: string }) {
  return (
    <div className="rounded-md border border-default bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-muted">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-default bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
