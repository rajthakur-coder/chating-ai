"use client";

import { useEffect } from "react";
import { FiRefreshCw, FiAlertTriangle, FiHome } from "react-icons/fi";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an analytics or error tracking service
    console.error("NextJS Global Application Crash:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f8fafc] px-6 py-12 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
        {/* Glow effect */}
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-red-400/20 blur-3xl dark:bg-red-500/10"></div>
        <div className="absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"></div>

        {/* Warning Icon Container */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-sm dark:bg-red-500/10">
          <FiAlertTriangle size={32} className="animate-pulse" />
        </div>

        {/* Header */}
        <h2 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Application Render Error
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A runtime exception occurred while rendering this view. This can happen due to transient connection failures or unexpected server data formats.
        </p>

        {/* Error Details Accordion */}
        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left dark:border-slate-800/80 dark:bg-slate-950/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Error Signature
          </p>
          <p className="mt-1.5 font-mono text-xs font-semibold leading-relaxed text-red-600 line-clamp-3 dark:text-red-400">
            {error.message || "Unknown runtime crash"}
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] text-slate-400">
              Digest ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30 focus:ring-2 focus:ring-emerald-500/50"
          >
            <FiRefreshCw className="animate-spin-slow" size={16} />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = "/dashboard")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FiHome size={16} />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </main>
  );
}
