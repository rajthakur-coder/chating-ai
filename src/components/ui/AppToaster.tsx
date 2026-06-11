"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useMemo, useState } from "react";
import {
  APP_TOAST_DISMISS_EVENT,
  APP_TOAST_EVENT,
  getToastDuration,
  type ToastPayload,
  type ToastType,
} from "./toast";
import { TOASTER_Z_INDEX } from "../Config/toaster.config";

type ToastItem = Required<Pick<ToastPayload, "id" | "msg" | "type">> & {
  duration: number;
};

const toastStyles: Record<
  ToastType,
  { icon: React.ReactNode; className: string; bar: string }
> = {
  success: {
    icon: <Icon name="fi:check-circle" className="h-5 w-5" />,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    bar: "bg-emerald-500",
  },
  error: {
    icon: <Icon name="fi:alert-circle" className="h-5 w-5" />,
    className: "border-red-200 bg-red-50 text-red-900",
    bar: "bg-red-500",
  },
  info: {
    icon: <Icon name="fi:info" className="h-5 w-5" />,
    className: "border-sky-200 bg-sky-50 text-sky-900",
    bar: "bg-sky-500",
  },
  loading: {
    icon: <Icon name="fi:loader" className="h-5 w-5 animate-spin" />,
    className: "border-slate-200 bg-white text-slate-900",
    bar: "bg-slate-500",
  },
};

const AppToaster = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const addToast = (event: Event) => {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      const id =
        payload.id ?? `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((current) => {
        const nextToast: ToastItem = {
          id,
          msg: payload.msg,
          type: payload.type,
          duration: getToastDuration(payload),
        };
        const existingIndex = current.findIndex((toast) => toast.id === id);
        if (existingIndex >= 0) {
          return current.map((toast, index) =>
            index === existingIndex ? nextToast : toast,
          );
        }
        return [nextToast, ...current].slice(0, 5);
      });
    };

    const dismissToast = (event: Event) => {
      const { id } = (event as CustomEvent<{ id?: string | number }>).detail;
      setToasts((current) =>
        id ? current.filter((toast) => toast.id !== id) : [],
      );
    };

    window.addEventListener(APP_TOAST_EVENT, addToast);
    window.addEventListener(APP_TOAST_DISMISS_EVENT, dismissToast);

    return () => {
      window.removeEventListener(APP_TOAST_EVENT, addToast);
      window.removeEventListener(APP_TOAST_DISMISS_EVENT, dismissToast);
    };
  }, []);

  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.duration > 0)
      .map((toast) =>
        window.setTimeout(() => {
          setToasts((current) =>
            current.filter((item) => item.id !== toast.id),
          );
        }, toast.duration),
      );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts]);

  const renderedToasts = useMemo(
    () =>
      toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`relative flex w-[min(92vw,420px)] items-start gap-3 overflow-hidden rounded-lg border px-4 py-3 text-sm shadow-xl shadow-slate-900/10 ${style.className}`}
          >
            <span className="mt-0.5 shrink-0">{style.icon}</span>
            <p className="min-w-0 flex-1 font-medium leading-5">{toast.msg}</p>
            <button
              type="button"
              aria-label="Dismiss toast"
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                )
              }
              className="rounded-full p-1 text-current opacity-70 transition hover:bg-black/5 hover:opacity-100"
            >
              <Icon name="fi:x" className="h-4 w-4" />
            </button>
            <span className={`absolute inset-x-0 bottom-0 h-1 ${style.bar}`} />
          </div>
        );
      }),
    [toasts],
  );

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 top-4 flex -translate-x-1/2 flex-col items-center gap-3"
      style={{ zIndex: TOASTER_Z_INDEX }}
    >
      {renderedToasts}
    </div>
  );
};

export default AppToaster;
