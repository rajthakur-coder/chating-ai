import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";
import ShopifyIntegrationForm from "./ShopifyIntegrationForm";

export const metadata: Metadata = {
  title: "Shopify Integration",
};

const setupSteps = [
  "Log in to your Shopify admin panel.",
  "Go to Apps, then create or open a custom app.",
  "Create a custom app for WhatsApp automation.",
  "Give the app a clear name, such as AlignChat Notifications.",
  "Enable read access for Products, Inventory, Orders, Customers, Checkouts, Fulfillments, and Locations.",
  "Save the app and copy the Admin API access token.",
  "Paste your shop domain and access token here, then connect Shopify.",
];

export default function ShopifyIntegrationPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-xl border border-default bg-surface p-6 shadow-default md:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Connect Shopify Store
            </h1>
            <p className="mt-2 text-sm text-muted">
              Add your Shopify store details so WhatsApp automation can read
              live Shopify data and receive webhook updates.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-strong text-foreground">
            <Icon name="si:shopify" size={24} color="currentColor" />
          </div>
        </div>

        <ShopifyIntegrationForm />
      </section>

      <section className="rounded-xl border border-default bg-surface p-6 shadow-default md:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Setup Instructions
        </h2>
        <div className="mt-8 space-y-4">
          <p className="text-sm font-medium text-foreground">
            How to get your Shopify access token:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
            {setupSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
