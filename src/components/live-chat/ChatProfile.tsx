"use client";

import Icon from "@/components/ui/Icon";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared";
import Avatar from "./Avatar";
import type { Chat } from "./types";

export default function ChatProfile({
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
    <aside className="flex h-full flex-col bg-white text-foreground dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="flex h-14 items-center justify-center bg-primary px-6 text-white">
          <div className="text-sm font-semibold tracking-wide opacity-90">
            Chat Profile
          </div>
        </header>

        <div className="flex items-center gap-3 px-6 py-4">
          <Avatar label={chat.avatar} tone={chat.tone} size="h-14 w-14 text-xl" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{chat.name}</p>
            <p className="text-sm text-muted">+{chat.id}</p>
          </div>
        </div>

        <div className="mx-6 mt-4 space-y-3 rounded-xl bg-[#e9f7f3] p-4 text-sm dark:bg-emerald-950/35">
          <div className="flex justify-between">
            <span className="text-muted">Status</span>
            <span className="font-medium text-foreground">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Last Active</span>
            <span className="font-medium text-foreground">Recently</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Source</span>
            <span className="font-medium text-foreground">Website</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Opted In</span>
            <button
              type="button"
              onClick={() => setOptedIn((prev) => !prev)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300",
                optedIn ? "bg-green-500" : "bg-surface-strong",
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
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon name="fi:tag" /> Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-md bg-surface-strong px-2.5 py-1 text-xs text-foreground">
                  {tag}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setTagAdding(true)}
                className="rounded-md border border-dashed border-default px-2.5 py-1 text-xs text-muted hover:bg-surface-hover"
              >
                + Add
              </button>
            </div>
            {tagAdding && (
              <div className="mt-3 rounded-lg border border-default bg-white p-3 shadow-sm dark:bg-slate-900">
                <SearchInput
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
                  width="100%"
                  height="36px"
                  rounded="rounded-md"
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
                      className="rounded-md bg-surface-strong px-2.5 py-1 text-xs text-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
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
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-md bg-dark px-3 py-1.5 text-xs font-medium text-background"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Remark</p>
              <button type="button" onClick={() => setEditing(true)} className="text-muted">
                <Icon name="fi:edit-2" size={15} />
              </button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  className="min-h-[86px] w-full resize-none rounded-lg border border-default bg-white p-3 text-sm text-foreground outline-none focus:border-emerald-500 dark:bg-slate-900"
                  placeholder="Add remark"
                />
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md bg-dark px-4 py-2 text-sm font-medium text-background"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="rounded-lg bg-surface p-3 text-sm text-muted">
                {remark || "No remark added"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-default bg-white px-6 py-4 dark:bg-slate-950">
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
