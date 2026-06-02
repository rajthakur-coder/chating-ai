"use client";

export default function ApiJson({ data }: { data: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md border border-default bg-white p-3 text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {JSON.stringify(data ?? {}, null, 2)}
    </pre>
  );
}

