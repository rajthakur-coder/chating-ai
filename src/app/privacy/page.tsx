import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for WhatsApp Business account connection.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
        We use Facebook and WhatsApp permissions only to connect WhatsApp
        Business accounts and provide messaging automation services. We do not
        sell user data.
      </p>
    </div>
  );
}
