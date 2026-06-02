"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import {
  FiArrowLeft,
  FiChevronDown,
  FiEdit2,
  FiFile,
  FiImage,
  FiList,
  FiMapPin,
  FiPaperclip,
  FiPlus,
  FiRepeat,
  FiSearch,
  FiSend,
  FiSmile,
  FiTag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { IoCheckmarkDone, IoMicOutline } from "react-icons/io5";
import { LuPanelTopOpen } from "react-icons/lu";
import { MdPerson, MdPhoto } from "react-icons/md";
import BaseModal from "@/modals/BaseModals/BaseModal";
import CustomInput from "@/components/Common/inputField";
import RadioButton from "@/components/Common/RadioButton";
import { ToasterUtils } from "@/components/ui/toast";
import {
  getLiveChatSocketUrl,
  getLiveChatContacts,
  getLiveChatMessages,
  sendLiveChatMessage,
  type LiveChatContact,
  type LiveChatMessage,
} from "@/services/liveChat";
import {
  getWhatsappTemplates,
  sendWhatsappTemplate,
  type WhatsappTemplate,
} from "@/services/templates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PUBLIC4_PRIMARY = "#00a97a";

function parseApiDate(value?: string | null) {
  if (!value) return null;
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function formatChatTime(value?: string | null) {
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

type Chat = {
  id: string;
  name: string;
  preview: string;
  time: string;
  badge?: string;
  read?: boolean;
  avatar: string;
  tone: string;
  tags: string[];
  remark: string;
  isWindowOpen: boolean;
};

function Avatar({
  label,
  tone,
  size = "h-10 w-10",
}: {
  label: string;
  tone: string;
  size?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
        size,
        tone,
      )}
    >
      {label ? <span>{label}</span> : <MdPerson size={22} />}
    </div>
  );
}

function DatePill({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow">
      {children}
    </div>
  );
}

function ChatTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative mt-1 py-4 text-[12px] transition-colors duration-300 after:absolute after:-bottom-0.5 after:left-0 after:h-1 after:w-full after:origin-left after:bg-white after:transition-transform after:duration-300",
        active
          ? "text-white after:scale-x-100"
          : "text-white/70 after:scale-x-0 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function ChatSidebar({
  selectedChatId,
  search,
  setSearch,
  filteredChats,
  totalCount,
  unreadCount,
  onSelect,
}: {
  selectedChatId: string;
  search: string;
  setSearch: (value: string) => void;
  filteredChats: Chat[];
  totalCount: number;
  unreadCount: number;
  onSelect: (id: string) => void;
}) {
  const { filter, setFilter } = useChatStore();

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white lg:w-[380px]">
      <header
        className="flex h-14 shrink-0 items-center justify-between px-6 text-white"
        style={{ backgroundColor: PUBLIC4_PRIMARY }}
      >
        <div className="flex items-center gap-4">
          <ChatTab active={filter === "all"} onClick={() => setFilter("all")}>
            ALL ({totalCount})
          </ChatTab>
          <ChatTab active={filter === "unread"} onClick={() => setFilter("unread")}>
            UNREAD ({unreadCount})
          </ChatTab>
        </div>
        <button
          type="button"
          aria-label="New chat"
          className="rounded p-1 transition hover:bg-white/10"
        >
          <LuPanelTopOpen size={28} />
        </button>
      </header>

      <div className="sticky top-0 z-10 border-b border-slate-50 bg-white p-2 pl-4">
        <label className="relative flex h-[45px] w-full max-w-[320px] items-center">
          <span className="pointer-events-none absolute left-4 z-10 text-[#64748b]">
            <FiSearch size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-full w-full rounded-[30px] border border-gray-300 bg-white pl-12 pr-3 text-sm text-[#0d0c22] outline-none transition-all duration-300 placeholder:text-[#94a3b8] hover:border-[#818cf8] focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30"
            placeholder="Search or start a new chat"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth [scrollbar-color:#cbd5e7_transparent] [scrollbar-width:thin]">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelect(chat.id)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition-colors hover:bg-gray-50",
              selectedChatId === chat.id ? "bg-gray-100" : "bg-white",
            )}
          >
            <Avatar label={chat.avatar} tone={chat.tone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {chat.name}
                </p>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {chat.time}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-1 truncate pr-2 text-xs text-slate-500">
                  {chat.read ? (
                    <IoCheckmarkDone className="shrink-0 text-blue-500" size={16} />
                  ) : null}
                  {chat.preview.includes("Photo") ? (
                    <MdPhoto className="shrink-0 text-slate-500" size={16} />
                  ) : null}
                  <span className="truncate">{chat.preview}</span>
                </p>
                {chat.badge ? (
                  <span
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: PUBLIC4_PRIMARY }}
                  >
                    {chat.badge}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}

        {filteredChats.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
            No chats found.
          </div>
        ) : null}

        <div className="border-t border-gray-50 bg-gray-50/30 py-6 text-center">
          <p className="text-[11px] font-medium text-gray-400">
            You&apos;ve reached the end of your chats
          </p>
        </div>
      </div>
    </aside>
  );
}

function EmptyConversation() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 px-6 text-center">
      <div>
        <p className="text-base font-semibold text-slate-900">No conversation selected</p>
        <p className="mt-2 text-sm text-slate-500">
          Chats from the API will appear here when messages are available.
        </p>
      </div>
    </div>
  );
}

function ConversationHeader({
  selectedChat,
  profileOpen,
  searchOpen,
  searchMessage,
  onBack,
  setSearchOpen,
  setSearchMessage,
  setProfileOpen,
}: {
  selectedChat: Chat;
  profileOpen: boolean;
  searchOpen: boolean;
  searchMessage: string;
  onBack: () => void;
  setSearchOpen: (value: boolean) => void;
  setSearchMessage: (value: string) => void;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <header
      className="flex h-14 shrink-0 cursor-pointer items-center justify-between border-b border-slate-200 bg-white px-4"
      onClick={() => setProfileOpen((prev) => !prev)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
          className="rounded-full p-2 hover:bg-gray-100 lg:hidden"
        >
          <FiArrowLeft size={20} />
        </button>
        {searchOpen ? (
          <div onClick={(event) => event.stopPropagation()}>
            <label className="relative flex h-9 w-[220px] items-center sm:w-64">
              <FiSearch className="absolute left-3 text-slate-500" size={16} />
              <input
                value={searchMessage}
                autoFocus
                onChange={(event) => setSearchMessage(event.target.value)}
                onBlur={() => {
                  setSearchOpen(false);
                  setSearchMessage("");
                }}
                placeholder="Search messages"
                className="h-full w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none focus:ring-1"
              />
            </label>
          </div>
        ) : (
          <>
            <Avatar label={selectedChat.avatar} tone={selectedChat.tone} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {selectedChat.name}
              </p>
              <p className="text-xs text-slate-500">+{selectedChat.id}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-slate-600" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          aria-label="Search messages"
          onClick={() => {
            setSearchOpen((!searchOpen));
            setSearchMessage("");
          }}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          {searchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
        </button>
        <button
          type="button"
          aria-label="Conversation profile"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          {profileOpen ? <FiArrowLeft className="rotate-180" size={20} /> : <FiArrowLeft size={20} />}
        </button>
      </div>
    </header>
  );
}

type ProductPreview = {
  title?: string;
  price?: string;
  image_url?: string;
  product_url?: string;
  caption?: string;
};

type RichMessagePayload = {
  raw_text?: string;
  reply_context?: {
    title?: string;
    body?: string;
  };
  body?: string;
  header?: string;
  title?: string;
  caption?: string;
  image_url?: string;
  product_url?: string;
  button_text?: string;
  products?: ProductPreview[];
  buttons?: { title?: string }[];
};

function richPayload(value: unknown): RichMessagePayload {
  return value && typeof value === "object" ? (value as RichMessagePayload) : {};
}

function isWideRichMessage(message: LiveChatMessage) {
  const type = String(message.message_type || "text");
  return type === "carousel" || type === "product_list";
}

function placeholderLabel(text: string, prefix: string) {
  const pattern = new RegExp(`^\\[${prefix}\\]\\s*`, "i");
  return text.replace(pattern, "").trim();
}

function buttonMessageTitle(message: LiveChatMessage, payload: RichMessagePayload) {
  return payload.title || placeholderLabel(message.message_body || "", "buttons");
}

function buttonMessageBody(message: LiveChatMessage, payload: RichMessagePayload) {
  const title = buttonMessageTitle(message, payload).toLowerCase();
  const body = payload.body || message.message_body || "";
  if (title === "main menu" && body.trim().toLowerCase() === "how can i help you?") {
    return "Welcome! How can I help you todays?";
  }
  if (body) return body;
  if (title === "main menu") return "Welcome! How can I help you todays?";
  return message.message_body || "";
}

function displayMessageText(message: LiveChatMessage) {
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

  return text;
}

function interactiveReplyPreview(
  message: LiveChatMessage,
  previousInteractiveMessage?: LiveChatMessage,
) {
  const payload = richPayload(message.payload);
  const previousPayload = previousInteractiveMessage
    ? richPayload(previousInteractiveMessage.payload)
    : {};
  const context = payload.reply_context || {
    title: previousPayload.title,
    body: previousPayload.body,
  };
  const reply = displayMessageText(message);

  if (context?.title || context?.body) {
    return {
      title: context.title || "",
      body: context.body || "",
      reply,
    };
  }

  return null;
}

function RichMessageContent({
  message,
  previousInteractiveMessage,
}: {
  message: LiveChatMessage;
  previousInteractiveMessage?: LiveChatMessage;
}) {
  const payload = richPayload(message.payload);
  const type = String(message.message_type || "text");

  if (type === "carousel" || type === "product_list") {
    const products = Array.isArray(payload.products) ? payload.products : [];
    if (!products.length) return <span className="whitespace-pre-wrap">{message.message_body}</span>;

    return (
      <div className="w-[min(900px,82vw)] max-w-full">
        <p className="mb-2 whitespace-pre-wrap text-sm text-slate-800">
          {payload.body || payload.header || message.message_body.replace(/^\[[^\]]+\]\s*/, "")}
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
          {products.map((product, index) => (
            <a
              key={`${product.title || "product"}-${index}`}
              href={product.product_url || undefined}
              target="_blank"
              rel="noreferrer"
              className="block w-56 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-sm"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title || "Product"}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-400">
                  <FiImage size={22} />
                </div>
              )}
              <div className="space-y-1 px-2.5 py-2">
                <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                  {product.title || "Product"}
                </p>
                {product.price ? (
                  <p className="text-sm text-slate-900">Price: {product.price}</p>
                ) : null}
                {product.caption ? (
                  <p className="line-clamp-2 text-xs leading-5 text-slate-700">
                    {product.caption}
                  </p>
                ) : null}
              </div>
              <div className="border-t border-slate-100 px-2.5 py-2 text-center text-xs font-semibold text-emerald-700">
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
      <div className="w-[260px] max-w-[72vw] overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
        {payload.image_url ? (
          <img
            src={payload.image_url}
            alt={title || "Image"}
            className="max-h-56 w-full object-cover"
          />
        ) : null}
        <div className="space-y-1 p-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {payload.caption ? (
            <p className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-600">
              {payload.caption}
            </p>
          ) : null}
          {payload.product_url ? (
            <p className="text-xs font-semibold text-emerald-700">
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
        {title ? (
          <p className="mb-1 font-semibold text-slate-950">{title}</p>
        ) : null}
        <p className="pb-2 whitespace-pre-wrap leading-5">
          {body}
        </p>
        <div className="-mx-3 -mb-2 space-y-1 bg-transparent pt-1">
          {buttons.map((button, index) => (
            <div
              key={`${button.title || "button"}-${index}`}
              className="flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-center text-sm font-medium text-emerald-700 shadow-sm"
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
          <p className="mb-1 font-semibold text-slate-900">
            {payload.title || "Catalog"}
          </p>
          <p className="whitespace-pre-wrap leading-5">
            {payload.body || message.message_body}
          </p>
        </div>
        <div className="-mx-3 -mb-2 flex items-center justify-center gap-2 border-t border-slate-200 px-3 py-2.5 text-sm font-semibold text-emerald-700">
          <FiList size={16} />
          <span>{payload.button_text || "Categories"}</span>
        </div>
      </div>
    );
  }

  const replyPreview = interactiveReplyPreview(message, previousInteractiveMessage);
  if (replyPreview) {
    return (
      <div className="min-w-[220px] max-w-[320px]">
        <div className="mb-1 rounded-md border-l-4 border-sky-500 bg-white/35 px-2 py-1.5">
          <p className="text-sm font-semibold text-sky-700">
            Replied to
          </p>
          {replyPreview.title ? (
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {replyPreview.title}
            </p>
          ) : null}
          {replyPreview.body ? (
            <p className="line-clamp-2 text-sm text-slate-600">
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

function MessageArea({
  searchMessage,
  messages,
  isLoading,
}: {
  searchMessage: string;
  messages: LiveChatMessage[];
  isLoading: boolean;
}) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  return (
    <div
      className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f7eed9]"
      style={{
        backgroundImage: "url('/chat-bg-pattern.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative flex min-h-full flex-col gap-2 overflow-x-hidden px-4 py-4 md:px-12">
        <DatePill>Today</DatePill>
        <div className="mx-auto max-w-[600px] rounded-md bg-cyan-100 px-5 py-2 text-center text-sm leading-6 text-slate-600 shadow-sm">
          This business uses a secure service from Meta to manage this chat.
          Click to learn more.
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-500">
            Loading messages...
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-500">
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
              const previousInteractiveMessage = !isOutgoing
                ? [...safeMessages]
                    .slice(0, safeMessages.indexOf(message))
                    .reverse()
                    .find((row) => {
                      const rowIsOutgoing =
                        row.direction === "out" || row.direction === "outgoing";
                      return (
                        rowIsOutgoing &&
                        ["buttons", "list"].includes(String(row.message_type || "text"))
                      );
                    })
                : undefined;

              return (
                <div
                  key={`${message.id}-${message.created_at}`}
                  className={cn(
                    "group relative w-fit rounded-md px-3 py-2 text-[14px] shadow-sm",
                    isWideRich ? "max-w-[92%]" : "max-w-[75%]",
                    isOutgoing
                      ? "ml-auto bg-[#d6f3cf]"
                      : "mr-auto bg-white",
                    searchMessage &&
                      text.toLowerCase().includes(searchMessage.toLowerCase()) &&
                      "ring-2 ring-yellow-300",
                  )}
                >
                  <RichMessageContent
                    message={message}
                    previousInteractiveMessage={previousInteractiveMessage}
                  />
                  <div className="mt-1 flex items-center justify-end gap-1 text-[11px] leading-none text-slate-500">
                    <span>{time}</span>
                    {isOutgoing && (
                      <IoCheckmarkDone
                        className="text-slate-500"
                        size={15}
                      />
                    )}
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

function ChatProfile({
  chat,
  onSchedule,
}: {
  chat: Chat;
  onSchedule: () => void;
}) {
  const [optedIn, setOptedIn] = useState(true);
  const [remark, setRemark] = useState(chat.remark);
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState(chat.tags);
  const [tagAdding, setTagAdding] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) return;
    if (!tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setTags((prev) => [...prev, nextTag]);
    }
    setTagInput("");
    setTagAdding(false);
  };

  return (
    <aside className="flex h-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="flex h-14 items-center justify-center bg-primary px-6 text-white">
          <div className="text-sm font-semibold tracking-wide opacity-90">
            Chat Profile
          </div>
        </header>

        <div className="flex items-center gap-3 px-6 py-4">
          <Avatar label={chat.avatar} tone={chat.tone} size="h-14 w-14 text-xl" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{chat.name}</p>
            <p className="text-sm text-gray-500">+{chat.id}</p>
          </div>
        </div>

        <div className="mx-6 mt-4 space-y-3 rounded-xl bg-[#e9f7f3] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-gray-900">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Active</span>
            <span className="font-medium text-gray-900">Recently</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Source</span>
            <span className="font-medium text-gray-900">Website</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Opted In</span>
            <button
              type="button"
              onClick={() => setOptedIn((prev) => !prev)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300",
                optedIn ? "bg-green-500" : "bg-gray-300",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300",
                  optedIn ? "translate-x-4" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FiTag /> Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-slate-700">
                  {tag}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setTagAdding(true)}
                className="rounded-md border border-dashed border-gray-300 px-2.5 py-1 text-xs text-slate-500 hover:bg-gray-50"
              >
                + Add
              </button>
            </div>
            {tagAdding && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <input
                  value={tagInput}
                  autoFocus
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAddTag();
                    if (event.key === "Escape") {
                      setTagInput("");
                      setTagAdding(false);
                    }
                  }}
                  placeholder="Search or create tag"
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-emerald-500"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Lead", "Customer", "Support", "VIP"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setTagInput(tag);
                        if (!tags.includes(tag)) setTags((prev) => [...prev, tag]);
                        setTagAdding(false);
                      }}
                      className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTagInput("");
                      setTagAdding(false);
                    }}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Remark</p>
              <button type="button" onClick={() => setEditing(true)} className="text-slate-500">
                <FiEdit2 size={15} />
              </button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  className="min-h-[86px] w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="Add remark"
                />
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-slate-600">
                {remark || "No remark added"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t bg-white px-6 py-4">
        <button
          type="button"
          onClick={onSchedule}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:opacity-90"
        >
          Schedule
        </button>
      </div>
    </aside>
  );
}

const scheduleTemplates = [
  {
    id: "welcome_offer",
    name: "welcome_offer",
    category: "MARKETING",
    body: "Hi {{1}}, welcome to our WhatsApp automation updates.",
  },
  {
    id: "order_update",
    name: "order_update",
    category: "UTILITY",
    body: "Hello {{1}}, your order update is ready.",
  },
];

function ChatScheduleModal({
  isOpen,
  onClose,
  phoneNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ALL");
  const [templateId, setTemplateId] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [variableType, setVariableType] = useState("FIXED");
  const [variableValue, setVariableValue] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const filteredTemplates =
    category === "ALL"
      ? scheduleTemplates
      : scheduleTemplates.filter((template) => template.category === category);
  const selectedTemplate = scheduleTemplates.find((template) => template.id === templateId);
  const previewBody = (selectedTemplate?.body || "Select a template to see preview").replace(
    "{{1}}",
    variableValue || "{{1}}",
  );

  const handleSubmit = () => {
    const nextErrors = {
      name: !name.trim(),
      template: !templateId,
      date: frequency === "once" && !date,
      time: !time,
      variable: !variableValue.trim(),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    ToasterUtils.success("Schedule message created successfully!");
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      toggle={onClose}
      headerText="Schedule Message"
      onConfirm={handleSubmit}
      onCancel={onClose}
      confirmText="Schedule Message"
      cancelText="Cancel"
      widthClass="max-w-[95%] md:w-[950px]"
      maxHeight="max-h-[78vh]"
    >
      <div className="grid h-[70vh] grid-cols-1 gap-6 p-1 md:grid-cols-2">
        <div className="space-y-6 overflow-y-auto pr-3">
          <CustomInput
            label="Schedule Name"
            placeholder="Enter schedule name..."
            value={name}
            error={errors.name}
            helperText={errors.name ? "Schedule name is required" : ""}
            onChange={(value) => {
              setName(value);
              setErrors((prev) => ({ ...prev, name: false }));
            }}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Template Category
            </label>
            <div className="flex w-full gap-2 rounded-md bg-gray-100 p-1">
              {["ALL", "MARKETING", "UTILITY"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`flex-1 rounded-md px-4 py-1.5 text-center text-xs font-semibold transition-all ${
                    category === item
                      ? "bg-green-300 text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-900">
              Select Template
            </label>
            <select
              value={templateId}
              onChange={(event) => {
                setTemplateId(event.target.value);
                setErrors((prev) => ({ ...prev, template: false }));
              }}
              className={`h-[45px] w-full rounded-[5px] border bg-white px-3 text-sm outline-none focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30 ${
                errors.template ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Search and select template...</option>
              {filteredTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {errors.template && (
              <span className="ml-1 text-[12px] text-red-500">
                Template selection is required
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Variable Type
            </label>
            <div className="flex gap-6">
              {["FIXED", "AUTO_FILL"].map((type) => (
                <RadioButton
                  key={type}
                  label={type === "AUTO_FILL" ? "Auto Fill" : "Fixed"}
                  checked={variableType === type}
                  onChange={() => setVariableType(type)}
                  size="sm"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-center font-mono text-[12px] text-slate-900">
              {"{{1}}"}
            </div>
            <CustomInput
              placeholder={variableType === "AUTO_FILL" ? "Contact Name" : "Enter value"}
              value={variableValue}
              error={errors.variable}
              helperText={errors.variable ? "Field is required" : ""}
              onChange={(value) => {
                setVariableValue(value);
                setErrors((prev) => ({ ...prev, variable: false }));
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Frequency</label>
            <div className="flex gap-6">
              {["once", "daily"].map((item) => (
                <RadioButton
                  key={item}
                  label={item.charAt(0).toUpperCase() + item.slice(1)}
                  checked={frequency === item}
                  onChange={() => setFrequency(item)}
                  size="sm"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            {frequency === "once" && (
              <CustomInput
                label="Date"
                value={date}
                error={errors.date}
                helperText={errors.date ? "Date required" : ""}
                onChange={(value) => {
                  setDate(value);
                  setErrors((prev) => ({ ...prev, date: false }));
                }}
              />
            )}
            <CustomInput
              label="Time"
              value={time}
              error={errors.time}
              helperText={errors.time ? "Time required" : ""}
              onChange={(value) => {
                setTime(value);
                setErrors((prev) => ({ ...prev, time: false }));
              }}
            />
          </div>
        </div>

        <div className="flex flex-col overflow-y-auto pr-1">
          <p className="sticky top-0 z-10 -mb-[48px] bg-white pb-4 text-sm font-medium text-slate-600">
            Message Preview
          </p>
          <div
            className="flex min-h-[400px] flex-1 items-start justify-center rounded-xl border border-gray-200 bg-[#efe7dd] p-6"
            style={{ backgroundImage: "url('/chat-bg-pattern.png')" }}
          >
            <div className="mt-16 max-w-[320px] rounded-lg bg-white px-4 py-3 text-sm shadow">
              <p className="font-semibold text-slate-900">
                {selectedTemplate?.name || "Template Preview"}
              </p>
              <p className="mt-2 leading-6 text-slate-700">{previewBody}</p>
              <p className="mt-2 text-xs text-slate-500">Recipient: +{phoneNumber}</p>
              <p className="mt-3 text-right text-[10px] text-gray-400">{time}</p>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

function getTemplateBody(template: WhatsappTemplate) {
  const components = Array.isArray(template.components)
    ? template.components
    : [];
  const body = components.find((component) => {
    const type = String(component?.type || "").toUpperCase();
    return type === "BODY";
  });
  return String(body?.text || "");
}

function getTemplateVariableKeys(text: string) {
  const keys = new Set<string>();
  const matcher = /\{\{\s*([^{}\s]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

function MessageInput({
  selectedChat,
  draftMessage,
  setDraftMessage,
  onSend,
  isSending,
  onTemplateSent,
}: {
  selectedChat: Chat;
  draftMessage: string;
  setDraftMessage: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  onTemplateSent: () => void;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsappTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const isWindowOpenLive = selectedChat.isWindowOpen;

  const templatesQuery = useQuery({
    queryKey: ["live-chat-templates", templateSearch],
    queryFn: () =>
      getWhatsappTemplates({
        status: "APPROVED",
        limit: 100,
        name: templateSearch,
      }),
    enabled: templatePickerOpen && !isWindowOpenLive,
  });

  const templateList = useMemo(
    () =>
      (templatesQuery.data?.data || []).filter(
        (template) =>
          template.category === "MARKETING" || template.category === "UTILITY",
      ),
    [templatesQuery.data?.data],
  );

  const templateBody = selectedTemplate ? getTemplateBody(selectedTemplate) : "";
  const templateVariableKeys = useMemo(
    () => getTemplateVariableKeys(templateBody),
    [templateBody],
  );
  const previewBody = templateVariableKeys.reduce(
    (text, key) =>
      text.replaceAll(`{{${key}}}`, templateVariables[key] || `{{${key}}}`),
    templateBody || "Select a template to see preview.",
  );

  const sendTemplateMutation = useMutation({
    mutationFn: () => {
      if (!selectedTemplate) {
        throw new Error("Please select a template");
      }
      return sendWhatsappTemplate({
        to_no: selectedChat.id,
        template_id: selectedTemplate.id,
        variables: templateVariables,
      });
    },
    onSuccess: () => {
      ToasterUtils.success("Template sent successfully");
      setTemplatePickerOpen(false);
      setSelectedTemplate(null);
      setTemplateVariables({});
      setTemplateSearch("");
      onTemplateSent();
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { detail?: string; message?: string } };
        message?: string;
      };
      ToasterUtils.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Template send failed",
      );
    },
  });

  const handleTemplateSelect = (template: WhatsappTemplate) => {
    setSelectedTemplate(template);
    const keys = getTemplateVariableKeys(getTemplateBody(template));
    setTemplateVariables(
      keys.reduce<Record<string, string>>((values, key) => {
        values[key] = "";
        return values;
      }, {}),
    );
  };

  return (
    <footer className="sticky bottom-0 w-full border-t border-slate-200 bg-white">
      {templatePickerOpen && !isWindowOpenLive && (
        <div className="absolute inset-x-2 bottom-full z-50 flex max-h-[550px] flex-col rounded-t-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-3 text-teal-700">
            <div className="flex items-center gap-3 font-semibold">
              {selectedTemplate ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateVariables({});
                  }}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                >
                  <FiArrowLeft size={18} />
                </button>
              ) : null}
              <span className="border-b-2 border-teal-700 pb-1">
                {selectedTemplate ? "Fill Parameters" : "Select Template"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTemplatePickerOpen(false);
                setSelectedTemplate(null);
                setTemplateVariables({});
              }}
            >
              <FiX />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedTemplate ? (
              <div className="grid gap-4 bg-gray-50/30 p-5 md:grid-cols-2">
                <div className="space-y-3">
                  {templateVariableKeys.length ? (
                    templateVariableKeys.map((key) => (
                      <CustomInput
                        key={key}
                        label={`Variable ${key}`}
                        placeholder={`Enter value for {{${key}}}`}
                        value={templateVariables[key] || ""}
                        onChange={(value) =>
                          setTemplateVariables((prev) => ({
                            ...prev,
                            [key]: value,
                          }))
                        }
                      />
                    ))
                  ) : (
                    <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                      This template has no variables.
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-700">
                    Preview
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-[#efe7dd] p-4">
                    <div className="rounded-lg bg-white px-4 py-3 text-sm shadow">
                      <p className="font-semibold text-slate-900">
                        {selectedTemplate.name}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
                        {previewBody}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Recipient: +{selectedChat.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : templatesQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading templates...
              </div>
            ) : templateList.length ? (
              templateList.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="flex w-full gap-4 border-b p-3 text-left transition hover:bg-gray-50"
                >
                  <div className="mt-1 rounded-full bg-gray-200 p-2 text-slate-600">
                    <FiFile size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {template.name}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {getTemplateBody(template) || "No preview"}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No templates found.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t bg-white p-3">
            {!selectedTemplate ? (
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Search templates"
                  className="h-10 w-full rounded-full border border-gray-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => sendTemplateMutation.mutate()}
              disabled={!selectedTemplate || sendTemplateMutation.isPending}
              className={cn(
                "ml-auto flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition",
                selectedTemplate && !sendTemplateMutation.isPending
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "cursor-not-allowed bg-gray-200 text-gray-400",
              )}
            >
              Send <FiSend size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="relative flex items-center gap-2 px-2 py-2">
        {!isWindowOpenLive ? (
          <div className="flex w-full justify-center py-2">
            <button
              onClick={() => setTemplatePickerOpen(true)}
              className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <FiSend className="text-primary" size={20} />
              Send Template
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => setPopupOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-gray-200"
            >
              <FiPlus size={28} />
            </button>
            <button
              type="button"
              aria-label="Emoji"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-gray-200"
            >
              <FiSmile size={28} />
            </button>
            <input
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              className="min-w-0 flex-1 resize-none rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-teal-600"
              placeholder={`Message ${selectedChat.name}`}
            />
            <button
              type="button"
              aria-label="Voice message"
              onClick={draftMessage ? onSend : undefined}
              disabled={isSending}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-80"
              style={{ backgroundColor: PUBLIC4_PRIMARY }}
            >
              {draftMessage ? <FiSend size={18} /> : <IoMicOutline size={20} />}
            </button>
            <button
              type="button"
              aria-label="More options"
              onClick={() => setTemplatePickerOpen(true)}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 sm:flex"
            >
              <FiChevronDown size={20} />
            </button>
          </>
        )}

        {popupOpen && (
          <div className="absolute bottom-[58px] left-3 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {[
              { label: "Document", icon: FiFile },
              { label: "Photos", icon: FiImage },
              { label: "Location", icon: FiMapPin },
              { label: "Contact", icon: FiUser },
              { label: "Template", icon: FiPaperclip, action: () => setTemplatePickerOpen(true) },
            ].map((item) => {
              const IconItem = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action?.();
                    setPopupOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-gray-50"
                >
                  <IconItem />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </footer>
  );
}

export default function LiveChatPage() {
  const {
    selectedChatId,
    filter,
    draftMessage,
    setSelectedChatId,
    setDraftMessage,
  } = useChatStore();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat" | "profile">("sidebar");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ["live-chat-contacts", search],
    queryFn: () =>
      getLiveChatContacts({
        offset: 0,
        limit: 50,
        searchValue: search,
      }),
  });

  const apiChats = useMemo<Chat[]>(() => {
    const rows = contactsQuery.data?.data || [];
    return rows.map((contact) => {
      const name =
        contact.custom_name ||
        contact.profile_name ||
        contact.customer_phone_number;
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
      return {
        id: contact.customer_phone_number,
        name,
        preview: contact.last_message || "",
        time: formatChatTime(contact.last_message_time),
        badge: contact.unread_count ? String(contact.unread_count) : undefined,
        read: !contact.unread_count,
        avatar: initials || contact.customer_phone_number.slice(-2),
        tone: "bg-green-100 text-green-800",
        tags: [],
        remark: "",
        isWindowOpen: contact.isWindowOpen !== false,
      };
    });
  }, [contactsQuery.data?.data]);

  const chatSource = apiChats;

  const unreadCount = chatSource.reduce((count, chat) => count + (chat.badge ? 1 : 0), 0);
  const filteredChats = useMemo(
    () =>
      chatSource.filter((chat) => {
        const filterMatch = filter === "unread" ? Boolean(chat.badge) : true;
        const searchMatch =
          !search ||
          chat.name.toLowerCase().includes(search.toLowerCase()) ||
          chat.preview.toLowerCase().includes(search.toLowerCase()) ||
          chat.id.includes(search);
        return filterMatch && searchMatch;
      }),
    [chatSource, filter, search],
  );

  const selectedChat = chatSource.find((chat) => chat.id === selectedChatId) ?? chatSource[0];

  const messagesQuery = useQuery({
    queryKey: ["live-chat-messages", selectedChat?.id],
    queryFn: () => getLiveChatMessages(selectedChat?.id || ""),
    enabled: Boolean(selectedChat?.id),
  });

  const sendMutation = useMutation({
    mutationFn: sendLiveChatMessage,
    onSuccess: () => {
      setDraftMessage("");
      queryClient.invalidateQueries({ queryKey: ["live-chat-contacts"] });
      queryClient.invalidateQueries({
        queryKey: ["live-chat-messages", selectedChat?.id],
      });
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      ToasterUtils.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Message send failed",
      );
    },
  });

  const handleSendMessage = () => {
    const text = draftMessage.trim();
    if (!selectedChat?.id || !text || sendMutation.isPending) return;
    sendMutation.mutate({
      to_no: selectedChat.id,
      message_body: text,
      temp_msg_id: `client-${Date.now()}`,
    });
  };

  useEffect(() => {
    const socketUrl = getLiveChatSocketUrl();
    if (!socketUrl) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let shouldReconnect = true;

    const connect = () => {
      console.log("[live-chat ws] connecting", socketUrl);
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        console.log("[live-chat ws] connected", socketUrl);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("[live-chat ws] message", payload);
          if (payload?.type !== "live_chat_message") return;

          const contact = String(payload.contact || "");
          const message = payload.message as LiveChatMessage | undefined;
          if (!contact || !message) return;

          queryClient.setQueryData<LiveChatMessage[]>(
            ["live-chat-messages", contact],
            (current) => {
              const rows = Array.isArray(current) ? current : [];
              const exists = rows.some(
                (row) =>
                  String(row.id) === String(message.id) ||
                  String(row.id) === String(message.msg_id),
              );
              return exists
                ? rows.map((row) =>
                    String(row.id) === String(message.id) ||
                    String(row.id) === String(message.msg_id)
                      ? { ...row, ...message }
                      : row,
                  )
                : [...rows, message];
            },
          );

          queryClient.setQueriesData<{ data: LiveChatContact[] }>(
            { queryKey: ["live-chat-contacts"] },
            (current) => {
              if (!current?.data) return current;
              const index = current.data.findIndex(
                (row) => String(row.customer_phone_number) === contact,
              );
              if (index === -1) {
                return current;
              }

              const next = [...current.data];
              const existing = next[index];
              next[index] = {
                ...existing,
                last_message: message.message_body || existing.last_message,
                last_message_time:
                  message.created_at || existing.last_message_time,
                unread_count:
                  message.direction === "in" && contact !== selectedChatId
                    ? (existing.unread_count || 0) + 1
                    : existing.unread_count,
              };

              const [updated] = next.splice(index, 1);
              next.unshift(updated);
              return { ...current, data: next };
            },
          );
        } catch {
          // Ignore non-JSON socket payloads.
        }
      };

      socket.onerror = (event) => {
        console.error("[live-chat ws] error", event);
      };

      socket.onclose = () => {
        console.warn("[live-chat ws] closed");
        if (!shouldReconnect) return;
        console.log("[live-chat ws] reconnecting in 3000ms");
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [queryClient, selectedChatId]);

  const handleSelect = (id: string) => {
    setSelectedChatId(id);
    setProfileOpen(false);
    setMobileView("chat");
  };

  return (
    <section className="relative h-[calc(100vh-96px)] min-h-0 overflow-hidden bg-white text-slate-950">
      <div className="hidden h-full min-h-0 overflow-hidden lg:flex">
        <ChatSidebar
          selectedChatId={selectedChatId}
          search={search}
          setSearch={setSearch}
          filteredChats={filteredChats}
          totalCount={chatSource.length}
          unreadCount={unreadCount}
          onSelect={handleSelect}
        />

        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white transition-[margin] duration-300"
          style={{ marginRight: profileOpen ? 320 : 0 }}
        >
          {selectedChat ? (
            <>
              <ConversationHeader
                selectedChat={selectedChat}
                profileOpen={profileOpen}
                searchOpen={searchOpen}
                searchMessage={searchMessage}
                setSearchOpen={setSearchOpen}
                setSearchMessage={setSearchMessage}
                setProfileOpen={setProfileOpen}
                onBack={() => setMobileView("sidebar")}
              />
              <MessageArea
                searchMessage={searchMessage}
                messages={messagesQuery.data || []}
                isLoading={messagesQuery.isLoading}
              />
              <MessageInput
                selectedChat={selectedChat}
                draftMessage={draftMessage}
                setDraftMessage={setDraftMessage}
                onSend={handleSendMessage}
                isSending={sendMutation.isPending}
                onTemplateSent={() => {
                  queryClient.invalidateQueries({ queryKey: ["live-chat-contacts"] });
                  queryClient.invalidateQueries({
                    queryKey: ["live-chat-messages", selectedChat.id],
                  });
                }}
              />
            </>
          ) : (
            <EmptyConversation />
          )}
        </div>

        {profileOpen && selectedChat && (
          <div className="absolute right-0 top-0 h-full w-[320px] bg-white shadow-[-8px_0_20px_rgba(0,0,0,0.08)]">
            <ChatProfile chat={selectedChat} onSchedule={() => setScheduleOpen(true)} />
          </div>
        )}
      </div>

      <div className="h-full min-h-0 overflow-hidden lg:hidden">
        {mobileView === "sidebar" && (
          <ChatSidebar
            selectedChatId={selectedChatId}
            search={search}
            setSearch={setSearch}
            filteredChats={filteredChats}
            totalCount={chatSource.length}
            unreadCount={unreadCount}
            onSelect={handleSelect}
          />
        )}

        {mobileView === "chat" && selectedChat && (
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
            <ConversationHeader
              selectedChat={selectedChat}
              profileOpen={false}
              searchOpen={searchOpen}
              searchMessage={searchMessage}
              setSearchOpen={setSearchOpen}
              setSearchMessage={setSearchMessage}
              setProfileOpen={() => setMobileView("profile")}
              onBack={() => setMobileView("sidebar")}
            />
            <MessageArea
              searchMessage={searchMessage}
              messages={messagesQuery.data || []}
              isLoading={messagesQuery.isLoading}
            />
              <MessageInput
                selectedChat={selectedChat}
                draftMessage={draftMessage}
                setDraftMessage={setDraftMessage}
                onSend={handleSendMessage}
                isSending={sendMutation.isPending}
                onTemplateSent={() => {
                  queryClient.invalidateQueries({ queryKey: ["live-chat-contacts"] });
                  queryClient.invalidateQueries({
                    queryKey: ["live-chat-messages", selectedChat.id],
                  });
                }}
              />
          </div>
        )}

        {mobileView === "profile" && selectedChat && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
            <div className="flex h-14 items-center gap-3 border-b px-4">
              <button onClick={() => setMobileView("chat")} className="rounded-full p-2 hover:bg-gray-100">
                <FiArrowLeft />
              </button>
              <p className="font-semibold">Chat Profile</p>
            </div>
            <ChatProfile chat={selectedChat} onSchedule={() => setScheduleOpen(true)} />
          </div>
        )}
      </div>

      <ChatScheduleModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        phoneNumber={selectedChat?.id || ""}
      />
    </section>
  );
}
