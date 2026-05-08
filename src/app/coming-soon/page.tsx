import type { Metadata } from "next";
import Icon from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Coming Soon",
};

export default function ComingSoonPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-default bg-surface p-8 shadow-xl shadow-default md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-white shadow-lg shadow-accent/20">
            <Icon name="ri:notification-3-line" size={30} color="currentColor" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold text-foreground">
            Coming Soon
          </h1>
          <p className="mt-3 text-base text-muted">
            This module is under development and will be available soon.
          </p>
        </div>
      </section>
    </div>
  );
}


