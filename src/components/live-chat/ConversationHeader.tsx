"use client";

import Icon from "@/components/ui/Icon";
import { SearchInput } from "@/components/shared";
import Avatar from "./Avatar";
import type { Chat } from "./types";

export default function ConversationHeader({
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
      className="flex h-14 shrink-0 cursor-pointer items-center justify-between border-b border-default bg-white px-4 dark:bg-slate-950"
      onClick={() => setProfileOpen((prev) => !prev)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
          className="rounded-full p-2 hover:bg-surface-hover lg:hidden"
        >
          <Icon name="fi:arrow-left" size={20} />
        </button>
        {searchOpen ? (
          <div onClick={(event) => event.stopPropagation()}>
            <SearchInput
              value={searchMessage}
              autoFocus
              onChange={(event) => setSearchMessage(event.target.value)}
              onBlur={() => {
                setSearchOpen(false);
                setSearchMessage("");
              }}
              placeholder="Search messages"
              width="100%"
              height="36px"
              rounded="rounded-md"
              wrapperClassName="w-[220px] sm:w-64"
            />
          </div>
        ) : (
          <>
            <Avatar label={selectedChat.avatar} tone={selectedChat.tone} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedChat.name}
              </p>
              <p className="text-xs text-muted">+{selectedChat.id}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-muted" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          aria-label="Search messages"
          onClick={() => {
            setSearchOpen(!searchOpen);
            setSearchMessage("");
          }}
          className="rounded-full p-2 transition-colors hover:bg-surface-hover"
        >
          {searchOpen ? <Icon name="fi:x" size={20} /> : <Icon name="fi:search" size={20} />}
        </button>
        <button
          type="button"
          aria-label="Conversation profile"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="rounded-full p-2 transition-colors hover:bg-surface-hover"
        >
          {profileOpen ? <Icon name="fi:arrow-left" className="rotate-180" size={20} /> : <Icon name="fi:arrow-left" size={20} />}
        </button>
      </div>
    </header>
  );
}
