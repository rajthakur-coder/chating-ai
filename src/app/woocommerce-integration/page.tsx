import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "WooCommerce Integration",
};

const setupSteps = [
  "Log in to your WordPress admin panel.",
  "Go to WooCommerce, then Settings.",
  "Open the Advanced tab and select REST API.",
  "Click Add key.",
  "Give your key a clear description, such as AlignChat Notifications.",
  "Set permissions to Read/Write.",
  "Copy the consumer key and consumer secret, then paste them here.",
];

export default function WooCommerceIntegrationPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-xl border border-default bg-surface p-6 shadow-default md:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Connect WooCommerce Store
            </h1>
            <p className="mt-2 text-sm text-muted">
              Connect your WooCommerce store to sync orders and power WhatsApp
              automation.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-strong text-foreground">
            <Icon name="si:woocommerce" size={28} color="currentColor" />
          </div>
        </div>

        <form className="space-y-5">
          <div>
            <label
              htmlFor="site-url"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Site URL
            </label>
            <input
              id="site-url"
              type="url"
              placeholder="https://your-store.com"
              className="w-full rounded-md border border-default bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary dark:bg-slate-950"
            />
            <p className="mt-2 text-xs text-muted">
              Enter your WooCommerce store URL, for example
              https://your-store.com.
            </p>
          </div>

          <div>
            <label
              htmlFor="consumer-key"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Consumer Key
            </label>
            <input
              id="consumer-key"
              type="text"
              placeholder="Enter your WooCommerce consumer key"
              className="w-full rounded-md border border-default bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary dark:bg-slate-950"
            />
            <p className="mt-2 text-xs text-muted">
              You can generate consumer keys from WooCommerce Settings,
              Advanced, REST API.
            </p>
          </div>

          <div>
            <label
              htmlFor="consumer-secret"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Consumer Secret
            </label>
            <input
              id="consumer-secret"
              type="password"
              placeholder="Enter your WooCommerce consumer secret"
              className="w-full rounded-md border border-default bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary dark:bg-slate-950"
            />
            <p className="mt-2 text-xs text-muted">
              The consumer secret is paired with your consumer key.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-strong"
            >
              <Icon name="si:woocommerce" size={18} color="currentColor" />
              Connect WooCommerce
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-default bg-surface p-6 shadow-default md:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Setup Instructions
        </h2>
        <div className="mt-8 space-y-4">
          <p className="text-sm font-medium text-foreground">
            How to get your WooCommerce API credentials:
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
