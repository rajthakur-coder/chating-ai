import type { LiveChatMessage } from "@/services/liveChat";
import type { WhatsappTemplate } from "@/services/templates";
import type { RichMessagePayload } from "./types";

export function parseApiDate(value?: string | null) {
  if (!value) return null;
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

export function formatChatTime(value?: string | null) {
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function istDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

export function messageDateKey(value?: string | null) {
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return istDateKey(date);
}

export function formatMessageDateLabel(value?: string | null) {
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const key = istDateKey(date);

  if (key === istDateKey(today)) return "Today";
  if (key === istDateKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function richPayload(value: unknown): RichMessagePayload {
  return value && typeof value === "object" ? (value as RichMessagePayload) : {};
}

export function isWideRichMessage(message: LiveChatMessage) {
  const type = String(message.message_type || "text");
  return ["carousel", "product_list", "image", "video", "audio", "document", "sticker"].includes(type);
}

function placeholderLabel(text: string, prefix: string) {
  const pattern = new RegExp(`^\\[${prefix}\\]\\s*`, "i");
  return text.replace(pattern, "").trim();
}

export function buttonMessageTitle(message: LiveChatMessage, payload: RichMessagePayload) {
  return payload.title || placeholderLabel(message.message_body || "", "buttons");
}

export function buttonMessageBody(message: LiveChatMessage, payload: RichMessagePayload) {
  const title = buttonMessageTitle(message, payload).toLowerCase();
  const body = payload.body || message.message_body || "";
  if (title === "main menu" && body.trim().toLowerCase() === "how can i help you?") {
    return "Welcome! How can I help you todays?";
  }
  if (body) return body;
  if (title === "main menu") return "Welcome! How can I help you todays?";
  return message.message_body || "";
}

export function displayMessageText(message: LiveChatMessage) {
  const text = message.message_body || "";
  const payload = richPayload(message.payload);
  const rawText = typeof payload.raw_text === "string" ? payload.raw_text : text;
  const normalized = rawText.trim().toLowerCase();

  if (normalized === "show catalog") return "View catalog";
  if (normalized === "track order") return "Track order";
  if (normalized === "talk to human") return "Talk to human";

  const dynamicCategory = rawText.match(/^catalog dynamic category\s+\S+\s+(.+?)(?:\s+page\s+\d+)?$/i);
  if (dynamicCategory?.[1]) return dynamicCategory[1].trim();

  const staticCategory = rawText.match(/^catalog category\s+\S+\s+(.+?)(?:\s+page\s+\d+)?$/i);
  if (staticCategory?.[1]) return staticCategory[1].trim();

  const pageMatch = rawText.match(/^catalog page\s+\d+$/i);
  if (pageMatch) return "Next categories";

  const mediaPlaceholder = rawText.match(/^\[(image|video|audio|voice|document|sticker)\]$/i);
  if (mediaPlaceholder?.[1]) {
    const label = mediaPlaceholder[1].toLowerCase() === "voice" ? "Voice message" : mediaPlaceholder[1];
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  return text;
}

export function interactiveReplyPreview(
  message: LiveChatMessage,
) {
  const payload = richPayload(message.payload);
  const context = payload.reply_context;
  const explicitReply = (message as LiveChatMessage & {
    reply_to?: { user?: string; reply_user?: string; reply_message_body?: unknown };
  }).reply_to;
  const reply = displayMessageText(message);
  const rawText =
    typeof payload.raw_text === "string" ? payload.raw_text : message.message_body || "";
  const normalizedReply = rawText.trim().toLowerCase();
  const isInteractiveReply = [
    "show catalog",
    "view catalog",
    "track order",
    "talk to human",
  ].includes(normalizedReply) || /^catalog (dynamic )?category\s+/i.test(rawText) || /^catalog page\s+\d+$/i.test(rawText);

  if (explicitReply?.reply_message_body) {
    return {
      title: explicitReply.user || explicitReply.reply_user || "Message",
      body: formatReplyPreviewText(explicitReply.reply_message_body),
      reply,
    };
  }

  if (isInteractiveReply && (context?.title || context?.body)) {
    return {
      title: context.title || "",
      body: context.body || "",
      reply,
    };
  }

  return null;
}

export function formatReplyPreviewText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const obj = value as Record<string, any>;
  if (typeof obj.title === "string" && obj.title.trim()) return obj.title;
  if (typeof obj.text === "string" && obj.text.trim()) return obj.text;

  const bodyText = typeof obj.body?.text === "string" ? obj.body.text.trim() : "";
  const headerText = typeof obj.header?.text === "string" ? obj.header.text.trim() : "";
  const footerText = typeof obj.footer?.text === "string" ? obj.footer.text.trim() : "";
  const sections = [headerText, bodyText, footerText].filter(Boolean);
  if (sections.length > 0) return sections.join("\n");

  if (typeof obj.id === "string" && obj.id.trim()) return obj.id;

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function getTemplateBody(template: WhatsappTemplate) {
  const components = Array.isArray(template.components) ? template.components : [];
  const body = components.find((component) => {
    const type = String(component?.type || "").toUpperCase();
    return type === "BODY";
  });
  return String(body?.text || "");
}

export function getTemplateVariableKeys(text: string) {
  const keys = new Set<string>();
  const matcher = /\{\{\s*([^{}\s]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}
