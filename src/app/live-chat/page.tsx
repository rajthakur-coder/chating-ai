"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ChatProfile from "@/components/live-chat/ChatProfile";
import ChatScheduleModal from "@/components/live-chat/ChatScheduleModal";
import ChatSidebar from "@/components/live-chat/ChatSidebar";
import ConversationHeader from "@/components/live-chat/ConversationHeader";
import EmptyConversation from "@/components/live-chat/EmptyConversation";
import MessageArea from "@/components/live-chat/MessageArea";
import MessageInput from "@/components/live-chat/MessageInput";
import type { Chat } from "@/components/live-chat/types";
import { formatChatTime } from "@/components/live-chat/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ToasterUtils } from "@/components/ui/toast";
import {
  getLiveChatContacts,
  getLiveChatMessages,
  getLiveChatSocketUrl,
  sendLiveChatMessage,
  type LiveChatContact,
  type LiveChatMessage,
} from "@/services/liveChat";
import { useChatStore } from "@/store/useChatStore";

type MobileView = "sidebar" | "chat" | "profile";
const LIVE_CHAT_LIMIT = 10;

function normalizeSearchForApi(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 3 ? digits : trimmed;
}

function contactMatchesSearch(chat: Chat, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  const digitSearch = normalizedSearch.replace(/\D/g, "");
  const textHaystack = `${chat.name} ${chat.preview} ${chat.id}`.toLowerCase();
  const digitHaystack = chat.id.replace(/\D/g, "");

  return (
    textHaystack.includes(normalizedSearch) ||
    (digitSearch.length >= 3 && digitHaystack.includes(digitSearch))
  );
}

function mapContactToChat(contact: LiveChatContact): Chat {
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
}

function playIncomingMessageSound() {
  if (typeof window === "undefined") return;

  const audio = new Audio("/sounds/recieve_message.mp3");
  audio.volume = 0.8;
  audio.play().catch(() => {
    playFallbackIncomingMessageSound();
  });
}

function playFallbackIncomingMessageSound() {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(780, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      520,
      audioContext.currentTime + 0.14,
    );
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    window.setTimeout(() => audioContext.close(), 300);
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
}

export default function LiveChatPage() {
  const {
    selectedChatId,
    filter,
    setSelectedChatId,
  } = useChatStore();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("sidebar");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [loadedContacts, setLoadedContacts] = useState<LiveChatContact[]>([]);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const selectedChatIdRef = useRef(selectedChatId);
  const queryClient = useQueryClient();

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  const contactsQuery = useQuery({
    queryKey: ["live-chat-contacts", debouncedSearch, offset],
    queryFn: () =>
      getLiveChatContacts({
        offset,
        limit: LIVE_CHAT_LIMIT,
        searchValue: normalizeSearchForApi(debouncedSearch) || undefined,
      }),
  });

  useEffect(() => {
    setOffset(0);
    setHasMoreChats(true);
    setLoadedContacts([]);
  }, [debouncedSearch]);

  useEffect(() => {
    const data = contactsQuery.data;
    if (!data) return;

    setLoadedContacts((current) => {
      if (offset === 0) return data.data || [];

      const combined = new Map<string, LiveChatContact>();
      current.forEach((contact) => {
        combined.set(String(contact.customer_phone_number), contact);
      });
      (data.data || []).forEach((contact) => {
        combined.set(String(contact.customer_phone_number), contact);
      });
      return Array.from(combined.values());
    });

    const totalItems = data.recordsFiltered || 0;
    setHasMoreChats((offset + 1) * LIVE_CHAT_LIMIT < totalItems);
  }, [contactsQuery.data, offset]);

  const chatSource = useMemo<Chat[]>(
    () => loadedContacts.map(mapContactToChat),
    [loadedContacts],
  );

  const unreadCount = chatSource.reduce((count, chat) => count + (chat.badge ? 1 : 0), 0);
  const filteredChats = useMemo(
    () =>
      chatSource.filter((chat) => {
        const filterMatch = filter === "unread" ? Boolean(chat.badge) : true;
        return filterMatch && contactMatchesSearch(chat, search);
      }),
    [chatSource, filter, search],
  );

  const selectedChat =
    chatSource.find((chat) => chat.id === selectedChatId) ?? chatSource[0];

  const messagesQuery = useQuery({
    queryKey: ["live-chat-messages", selectedChat?.id],
    queryFn: () => getLiveChatMessages(selectedChat?.id || ""),
    enabled: Boolean(selectedChat?.id),
  });

  const sendMutation = useMutation({
    mutationFn: sendLiveChatMessage,
    onSuccess: () => {
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

  const refreshSelectedChat = () => {
    queryClient.invalidateQueries({ queryKey: ["live-chat-contacts"] });
    queryClient.invalidateQueries({
      queryKey: ["live-chat-messages", selectedChat?.id],
    });
  };

  const handleSendMessage = (message: string) => {
    const text = message.trim();
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

    const getChatIdFromMessage = (message: LiveChatMessage) => {
      const record = message as LiveChatMessage & {
        from_no?: string;
        to_no?: string;
        contact?: string;
        customer_phone_number?: string;
      };
      const isIncoming =
        message.direction === "in" || message.direction === "incoming";
      return String(
        record.contact ||
          record.customer_phone_number ||
          (isIncoming ? record.from_no : record.to_no) ||
          "",
      );
    };

    const upsertContactFromMessage = (chatId: string, message: LiveChatMessage) => {
      const record = message as LiveChatMessage & {
        chat_id?: string | number;
        profile_name?: string;
        custom_name?: string;
        contact_update?: { isWindowOpen?: boolean };
      };
      const isIncoming =
        message.direction === "in" || message.direction === "incoming";
      const activeChatId = selectedChatIdRef.current;

      setLoadedContacts((current) => {
        const index = current.findIndex(
          (row) => String(row.customer_phone_number) === chatId,
        );
        const updatedContact: LiveChatContact =
          index === -1
            ? {
                id: String(record.chat_id || `temp_${chatId}`),
                customer_phone_number: chatId,
                profile_name: record.profile_name || "Unknown",
                custom_name: record.custom_name || null,
                last_message: message.message_body || "",
                last_message_time: message.created_at || null,
                unread_count: isIncoming && chatId !== activeChatId ? 1 : 0,
                isWindowOpen: record.contact_update?.isWindowOpen ?? isIncoming,
              }
            : {
                ...current[index],
                last_message: message.message_body || current[index].last_message,
                last_message_time:
                  message.created_at || current[index].last_message_time,
                unread_count:
                  isIncoming && chatId !== activeChatId
                    ? (current[index].unread_count || 0) + 1
                    : current[index].unread_count,
                isWindowOpen:
                  record.contact_update?.isWindowOpen ??
                  (isIncoming ? true : current[index].isWindowOpen),
              };

        const next = index === -1 ? [...current] : [...current.slice(0, index), ...current.slice(index + 1)];
        next.unshift(updatedContact);
        return next;
      });
    };

    const handleNewMessage = (payload: unknown) => {
      const wrapper = payload as {
        type?: string;
        contact?: string;
        message?: LiveChatMessage;
      };
      if (wrapper?.type && wrapper.type !== "live_chat_message") return;

      const message = (wrapper?.message || payload) as LiveChatMessage | undefined;
      if (!message) return;

      const chatId = String(wrapper?.contact || getChatIdFromMessage(message));
      if (!chatId) return;

      upsertContactFromMessage(chatId, message);
      const isIncoming =
        message.direction === "in" || message.direction === "incoming";
      if (isIncoming) {
        playIncomingMessageSound();
        if (chatId !== selectedChatIdRef.current) {
          ToasterUtils.info(message.message_body || "New WhatsApp message");
        }
      }

      queryClient.setQueryData<LiveChatMessage[]>(
        ["live-chat-messages", chatId],
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
    };

    const socket = new WebSocket(socketUrl);
    const keepAliveId = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 25000);

    socket.onopen = () => console.log("[live-chat socket] connected", socketUrl);
    socket.onerror = (error) => console.error("[live-chat socket] error", error);
    socket.onclose = (event) => {
      console.warn("[live-chat socket] closed", {
        code: event.code,
        reason: event.reason,
      });
    };
    socket.onmessage = (event) => {
      try {
        handleNewMessage(JSON.parse(event.data));
      } catch (error) {
        console.error("[live-chat socket] invalid message", error);
      }
    };

    return () => {
      window.clearInterval(keepAliveId);
      socket.close();
    };
  }, [queryClient]);

  const handleSelect = (id: string) => {
    setSelectedChatId(id);
    setProfileOpen(false);
    setMobileView("chat");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (offset !== 0) {
      setOffset(0);
      setHasMoreChats(true);
    }
  };

  const handleLoadMoreChats = () => {
    if (!hasMoreChats || contactsQuery.isFetching || contactsQuery.isError) return;
    setOffset((current) => current + 1);
  };

  return (
    <section className="relative h-[calc(100vh-96px)] min-h-0 overflow-hidden bg-white text-foreground dark:bg-slate-950">
      <div className="hidden h-full min-h-0 overflow-hidden lg:flex">
        <ChatSidebar
          selectedChatId={selectedChatId}
          search={search}
          setSearch={handleSearchChange}
          filteredChats={filteredChats}
          totalCount={chatSource.length}
          unreadCount={unreadCount}
          isLoading={contactsQuery.isLoading}
          isFetching={contactsQuery.isFetching}
          hasMore={hasMoreChats}
          isError={contactsQuery.isError}
          onLoadMore={handleLoadMoreChats}
          onRetry={() => contactsQuery.refetch()}
          onSelect={handleSelect}
        />

        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white transition-[margin] duration-300 dark:bg-slate-950"
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
                onSend={handleSendMessage}
                isSending={sendMutation.isPending}
                onTemplateSent={refreshSelectedChat}
              />
            </>
          ) : (
            <EmptyConversation />
          )}
        </div>

        {profileOpen && selectedChat && (
          <div className="absolute right-0 top-0 h-full w-[320px] bg-white shadow-[-8px_0_20px_rgba(0,0,0,0.08)] dark:bg-slate-950">
            <ChatProfile chat={selectedChat} onSchedule={() => setScheduleOpen(true)} />
          </div>
        )}
      </div>

      <div className="h-full min-h-0 overflow-hidden lg:hidden">
        {mobileView === "sidebar" && (
          <ChatSidebar
            selectedChatId={selectedChatId}
            search={search}
            setSearch={handleSearchChange}
            filteredChats={filteredChats}
            totalCount={chatSource.length}
            unreadCount={unreadCount}
            isLoading={contactsQuery.isLoading}
            isFetching={contactsQuery.isFetching}
            hasMore={hasMoreChats}
            isError={contactsQuery.isError}
            onLoadMore={handleLoadMoreChats}
            onRetry={() => contactsQuery.refetch()}
            onSelect={handleSelect}
          />
        )}

        {mobileView === "chat" && selectedChat && (
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white dark:bg-slate-950">
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
              onSend={handleSendMessage}
              isSending={sendMutation.isPending}
              onTemplateSent={refreshSelectedChat}
            />
          </div>
        )}

        {mobileView === "profile" && selectedChat && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-950">
            <div className="flex h-14 items-center gap-3 border-b border-default px-4">
              <button onClick={() => setMobileView("chat")} className="rounded-full p-2 hover:bg-surface-hover">
                <Icon name="fi:arrow-left" />
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
