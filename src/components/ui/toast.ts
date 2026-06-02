import { TOASTER_AUTO_CLOSE } from "../Config/toaster.config";

export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastPayload {
  id?: string | number;
  msg: string;
  type: ToastType;
  duration?: number;
}

export interface ToastInterface {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  loading: (msg: string) => string | number;
  dismiss: (id?: string | number) => void;
}

export const APP_TOAST_EVENT = "whatapp:toast";
export const APP_TOAST_DISMISS_EVENT = "whatapp:toast-dismiss";

const emitToast = (payload: ToastPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastPayload>(APP_TOAST_EVENT, { detail: payload }),
  );
};

const emitDismiss = (id?: string | number) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ id?: string | number }>(APP_TOAST_DISMISS_EVENT, {
      detail: { id },
    }),
  );
};

export const ToasterUtils: ToastInterface = {
  success: (msg) => emitToast({ msg, type: "success" }),
  error: (msg) => emitToast({ msg, type: "error" }),
  info: (msg) => emitToast({ msg, type: "info" }),
  loading: (msg) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    emitToast({ id, msg, type: "loading", duration: 0 });
    return id;
  },
  dismiss: (id) => emitDismiss(id),
};

export const toast = ToasterUtils;

export const getToastDuration = (payload: ToastPayload) =>
  payload.duration ?? (payload.type === "loading" ? 0 : TOASTER_AUTO_CLOSE);
