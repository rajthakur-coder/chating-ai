"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared";
import { useChatStore } from "@/store/useChatStore";
import Avatar from "./Avatar";
import { LIVE_CHAT_PRIMARY } from "./constants";
import type { Chat } from "./types";

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

export default function ChatSidebar({
  selectedChatId,
  search,
  setSearch,
  filteredChats,
  totalCount,
  unreadCount,
  isLoading,
  isFetching,
  hasMore,
  isError,
  onLoadMore,
  onRetry,
  onSelect,
}: {
  selectedChatId: string;
  search: string;
  setSearch: (value: string) => void;
  filteredChats: Chat[];
  totalCount: number;
  unreadCount: number;
  isLoading?: boolean;
  isFetching?: boolean;
  hasMore?: boolean;
  isError?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
  onSelect: (id: string) => void;
}) {
  const { filter, setFilter } = useChatStore();
  const showInitialLoading = isLoading && filteredChats.length === 0;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isFetching || isError || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1,
        rootMargin: "0px 0px 80px 0px",
      },
    );

    const loader = loaderRef.current;
    if (loader) observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, isFetching, isError, onLoadMore]);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-default bg-white dark:bg-slate-950 lg:w-[380px]">
      <header
        className="flex h-14 shrink-0 items-center justify-between px-6 text-white"
        style={{ backgroundColor: LIVE_CHAT_PRIMARY }}
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
          <Icon name="lu:panel-top-open" size={28} />
        </button>
      </header>

      <div className="sticky top-0 z-10 border-b border-default bg-white p-2 pl-4 dark:bg-slate-950">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search or start a new chat"
          width="320px"
          height="45px"
        />
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth [scrollbar-color:#cbd5e7_transparent] [scrollbar-width:thin]"
      >
        {showInitialLoading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex w-full animate-pulse items-center gap-3 border-b border-default px-4 py-3"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-surface-strong" />
                <div className="h-2 w-3/4 rounded bg-surface-strong" />
              </div>
            </div>
          ))
        ) : (
          filteredChats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelect(chat.id)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-default px-4 py-3 text-left transition-colors hover:bg-surface-hover",
              selectedChatId === chat.id ? "bg-surface-strong" : "bg-white dark:bg-slate-950",
            )}
          >
            <Avatar label={chat.avatar} tone={chat.tone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-foreground">
                  {chat.name}
                </p>
                <span className="shrink-0 text-[10px] text-muted">
                  {chat.time}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-1 truncate pr-2 text-xs text-muted">
                  {chat.read ? (
                    <Icon name="io:checkmark-done" className="shrink-0 text-blue-500" size={16} />
                  ) : null}
                  {chat.preview.includes("Photo") ? (
                    <Icon name="md:photo" className="shrink-0 text-muted" size={16} />
                  ) : null}
                  <span className="truncate">{chat.preview}</span>
                </p>
                {chat.badge ? (
                  <span
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: LIVE_CHAT_PRIMARY }}
                  >
                    {chat.badge}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
          ))
        )}

        {!showInitialLoading && filteredChats.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm font-medium text-muted">
            No chats found.
          </div>
        ) : null}

        <div ref={loaderRef}>
          {isError ? (
            <div className="border-t border-default bg-surface py-4 text-center">
              <p className="text-[11px] font-medium text-red-500">Error loading chats</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-md bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
              >
                RETRY
              </button>
            </div>
          ) : hasMore ? (
            <div className="border-t border-default bg-surface py-4 text-center text-[11px] font-medium text-muted">
              {isFetching ? "Loading more chats..." : "Scroll for more"}
            </div>
          ) : null}
        </div>

        {isFetching && !showInitialLoading && !hasMore ? (
          <div className="border-t border-default bg-surface py-4 text-center text-[11px] font-medium text-muted">
            Loading chats...
          </div>
        ) : null}

        {!showInitialLoading && filteredChats.length > 0 && !isFetching && !hasMore ? (
          <div className="border-t border-default bg-surface py-6 text-center">
          <p className="text-[11px] font-medium text-muted">
            You&apos;ve reached the end of your chats
          </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
