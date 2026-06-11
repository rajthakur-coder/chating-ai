"use client";

import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { LiveChatMessage } from "@/services/liveChat";
import {
  buttonMessageBody,
  buttonMessageTitle,
  displayMessageText,
  formatChatTime,
  formatMessageDateLabel,
  interactiveReplyPreview,
  isWideRichMessage,
  messageDateKey,
  richPayload,
} from "./utils";

function DatePill({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-xs text-muted shadow dark:bg-slate-900">
      {children}
    </div>
  );
}

function RichMessageContent({
  message,
}: {
  message: LiveChatMessage;
}) {
  const payload = richPayload(message.payload);
  const type = String(message.message_type || "text");

  if (type === "carousel" || type === "product_list") {
    const products = Array.isArray(payload.products) ? payload.products : [];
    if (!products.length) return <span className="whitespace-pre-wrap">{message.message_body}</span>;

    return (
      <div className="w-[min(900px,82vw)] max-w-full">
        <p className="mb-2 whitespace-pre-wrap text-sm text-foreground">
          {payload.body || payload.header || message.message_body.replace(/^\[[^\]]+\]\s*/, "")}
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
          {products.map((product, index) => (
            <a
              key={`${product.title || "product"}-${index}`}
              href={product.product_url || undefined}
              target="_blank"
              rel="noreferrer"
              className="block w-56 shrink-0 overflow-hidden rounded-md border border-default bg-white text-left shadow-sm dark:bg-slate-900"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title || "Product"}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-surface-strong text-muted">
                  <Icon name="fi:image" size={22} />
                </div>
              )}
              <div className="space-y-1 px-2.5 py-2">
                <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                  {product.title || "Product"}
                </p>
                {product.price ? (
                  <p className="text-sm text-foreground">Price: {product.price}</p>
                ) : null}
                {product.caption ? (
                  <p className="line-clamp-2 text-xs leading-5 text-muted">
                    {product.caption}
                  </p>
                ) : null}
              </div>
              <div className="border-t border-default px-2.5 py-2 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Buy now
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (type === "image" || type === "cta_url") {
    const title = payload.title || message.message_body.replace(/^\[[^\]]+\]\s*/, "");
    const content = (
      <div className="w-[260px] max-w-[72vw] overflow-hidden rounded-lg border border-default bg-white shadow-sm dark:bg-slate-900">
        {payload.image_url ? (
          <img
            src={payload.image_url}
            alt={title || "Image"}
            className="max-h-56 w-full object-cover"
          />
        ) : null}
        <div className="space-y-1 p-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {payload.caption ? (
            <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted">
              {payload.caption}
            </p>
          ) : null}
          {payload.product_url ? (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {payload.button_text || "Open"}
            </p>
          ) : null}
        </div>
      </div>
    );
    return payload.product_url ? (
      <a href={payload.product_url} target="_blank" rel="noreferrer">
        {content}
      </a>
    ) : (
      content
    );
  }

  if (type === "buttons") {
    const buttons = Array.isArray(payload.buttons) ? payload.buttons : [];
    const title = buttonMessageTitle(message, payload);
    const body = buttonMessageBody(message, payload);
    return (
      <div className="w-[420px] max-w-[72vw] overflow-hidden rounded-md">
        {title ? <p className="mb-1 font-semibold text-foreground">{title}</p> : null}
        <p className="pb-2 whitespace-pre-wrap leading-5">{body}</p>
        <div className="-mx-3 -mb-2 space-y-1 bg-transparent pt-1">
          {buttons.map((button, index) => (
            <div
              key={`${button.title || "button"}-${index}`}
              className="flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-center text-sm font-medium text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300"
            >
              {button.title || "Option"}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="w-[420px] max-w-[72vw] overflow-hidden rounded-md">
        <div className="pb-3">
          <p className="mb-1 font-semibold text-foreground">
            {payload.title || "Catalog"}
          </p>
          <p className="whitespace-pre-wrap leading-5">
            {payload.body || message.message_body}
          </p>
        </div>
        <div className="-mx-3 -mb-2 flex items-center justify-center gap-2 border-t border-default px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <Icon name="fi:list" size={16} />
          <span>{payload.button_text || "Categories"}</span>
        </div>
      </div>
    );
  }

  const replyPreview = interactiveReplyPreview(message);
  if (replyPreview) {
    return (
      <div className="min-w-[220px] max-w-[320px]">
        <div className="mb-1 rounded-md border-l-4 border-sky-500 bg-white/35 px-2 py-1.5 dark:bg-slate-950/45">
          <p className="text-sm font-semibold text-sky-700">Replied to</p>
          {replyPreview.title ? (
            <p className="mt-1 text-sm font-semibold text-foreground">
              {replyPreview.title}
            </p>
          ) : null}
          {replyPreview.body ? (
            <p className="line-clamp-2 text-sm text-muted">
              {replyPreview.body}
            </p>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap text-base">{replyPreview.reply}</p>
      </div>
    );
  }

  return <span className="whitespace-pre-wrap">{displayMessageText(message)}</span>;
}

export default function MessageArea({
  searchMessage,
  messages,
  isLoading,
}: {
  searchMessage: string;
  messages: LiveChatMessage[];
  isLoading: boolean;
}) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  let previousDateKey = "";

  return (
    <div
      className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f7eed9] dark:bg-slate-900"
      style={{
        backgroundImage: "url('/chat-bg-pattern.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative flex min-h-full flex-col gap-2 overflow-x-hidden px-4 py-4 md:px-12">
        <div className="mx-auto max-w-[600px] rounded-md bg-cyan-100 px-5 py-2 text-center text-sm leading-6 text-slate-600 shadow-sm dark:bg-cyan-950/70 dark:text-cyan-100">
          This business uses a secure service from Meta to manage this chat.
          Click to learn more.
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm font-medium text-muted">
            Loading messages...
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm font-medium text-muted">
            No messages yet.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {safeMessages.map((message) => {
              const isOutgoing =
                message.direction === "out" || message.direction === "outgoing";
              const text = displayMessageText(message);
              const isWideRich = isWideRichMessage(message);
              const time = formatChatTime(message.created_at);
              const currentDateKey = messageDateKey(message.created_at);
              const showDatePill =
                Boolean(currentDateKey) && currentDateKey !== previousDateKey;
              previousDateKey = currentDateKey || previousDateKey;

              return (
                <div key={`${message.id}-${message.created_at}`} className="contents">
                  {showDatePill ? (
                    <DatePill>
                      {formatMessageDateLabel(message.created_at)}
                    </DatePill>
                  ) : null}
                  <div
                    className={cn(
                      "group relative w-fit rounded-md px-3 py-2 text-[14px] shadow-sm",
                      isWideRich ? "max-w-[92%]" : "max-w-[75%]",
                      isOutgoing
                        ? "ml-auto bg-[#d6f3cf] text-slate-950 dark:bg-emerald-950 dark:text-emerald-50"
                        : "mr-auto bg-white text-slate-950 dark:bg-slate-800 dark:text-slate-50",
                      searchMessage &&
                        text.toLowerCase().includes(searchMessage.toLowerCase()) &&
                        "ring-2 ring-yellow-300",
                    )}
                  >
                    <RichMessageContent message={message} />
                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] leading-none text-muted">
                      <span>{time}</span>
                      {isOutgoing && <Icon name="io:checkmark-done" className="text-muted" size={15} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
