"use client";

import Icon from "@/components/ui/Icon";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared";
import CustomInput from "@/components/shared/inputField";
import { ToasterUtils } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  getWhatsappTemplates,
  sendWhatsappTemplate,
  type WhatsappTemplate,
} from "@/services/templates";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LIVE_CHAT_PRIMARY } from "./constants";
import type { Chat } from "./types";
import { getTemplateBody, getTemplateVariableKeys } from "./utils";

export default function MessageInput({
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
  const debouncedTemplateSearch = useDebouncedValue(templateSearch.trim(), 300);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsappTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const isWindowOpenLive = selectedChat.isWindowOpen;

  const templatesQuery = useQuery({
    queryKey: ["live-chat-templates", debouncedTemplateSearch],
    queryFn: () =>
      getWhatsappTemplates({
        status: "APPROVED",
        limit: 100,
        name: debouncedTemplateSearch,
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
    <footer className="sticky bottom-0 w-full border-t border-default bg-white dark:bg-slate-950">
      {templatePickerOpen && !isWindowOpenLive && (
        <div className="absolute inset-x-2 bottom-full z-50 flex max-h-[550px] flex-col rounded-t-xl border border-default bg-white shadow-sm dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-default p-3 text-teal-700 dark:text-teal-300">
            <div className="flex items-center gap-3 font-semibold">
              {selectedTemplate ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateVariables({});
                  }}
                  className="rounded-full p-1 text-muted hover:bg-surface-hover"
                >
                  <Icon name="fi:arrow-left" size={18} />
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
              <Icon name="fi:x" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedTemplate ? (
              <div className="grid gap-4 bg-surface p-5 md:grid-cols-2">
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
                    <p className="rounded-lg bg-white p-3 text-sm text-muted dark:bg-slate-900">
                      This template has no variables.
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                    Preview
                  </div>
                  <div className="rounded-lg border border-default bg-[#efe7dd] p-4 dark:bg-slate-900">
                    <div className="rounded-lg bg-white px-4 py-3 text-sm shadow dark:bg-slate-800">
                      <p className="font-semibold text-foreground">
                        {selectedTemplate.name}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-foreground">
                        {previewBody}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Recipient: +{selectedChat.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : templatesQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-muted">
                Loading templates...
              </div>
            ) : templateList.length ? (
              templateList.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="flex w-full gap-4 border-b border-default p-3 text-left transition hover:bg-surface-hover"
                >
                  <div className="mt-1 rounded-full bg-surface-strong p-2 text-muted">
                    <Icon name="fi:file" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {template.name}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted">
                      {getTemplateBody(template) || "No preview"}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted">
                No templates found.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-default bg-white p-3 dark:bg-slate-950">
            {!selectedTemplate ? (
              <SearchInput
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
                placeholder="Search templates"
                width="100%"
                height="40px"
                wrapperClassName="flex-1"
              />
            ) : null}
            <button
              type="button"
              onClick={() => sendTemplateMutation.mutate()}
              disabled={!selectedTemplate || sendTemplateMutation.isPending}
              className={cn(
                "ml-auto flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition",
                selectedTemplate && !sendTemplateMutation.isPending
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "cursor-not-allowed bg-surface-strong text-muted",
              )}
            >
              Send <Icon name="fi:send" size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="relative flex items-center gap-2 px-2 py-2">
        {!isWindowOpenLive ? (
          <div className="flex w-full justify-center py-2">
            <button
              onClick={() => setTemplatePickerOpen(true)}
              className="flex items-center gap-1 rounded-full border border-default bg-white px-4 py-2 font-medium text-foreground shadow-sm transition hover:bg-surface-hover dark:bg-slate-900"
            >
              <Icon name="fi:send" className="text-primary" size={20} />
              Send Template
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => setPopupOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-surface-hover"
            >
              <Icon name="fi:plus" size={28} />
            </button>
            <button
              type="button"
              aria-label="Emoji"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-surface-hover"
            >
              <Icon name="fi:smile" size={28} />
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
              className="min-w-0 flex-1 resize-none rounded-2xl border border-default bg-white px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-teal-600 dark:bg-slate-900"
              placeholder={`Message ${selectedChat.name}`}
            />
            <button
              type="button"
              aria-label="Voice message"
              onClick={draftMessage ? onSend : undefined}
              disabled={isSending}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-80"
              style={{ backgroundColor: LIVE_CHAT_PRIMARY }}
            >
              {draftMessage ? <Icon name="fi:send" size={18} /> : <Icon name="io:mic-outline" size={20} />}
            </button>
            <button
              type="button"
              aria-label="More options"
              onClick={() => setTemplatePickerOpen(true)}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-surface-hover sm:flex"
            >
              <Icon name="fi:chevron-down" size={20} />
            </button>
          </>
        )}

        {popupOpen && (
          <div className="absolute bottom-[58px] left-3 z-20 w-44 overflow-hidden rounded-xl border border-default bg-white shadow-xl dark:bg-slate-900">
            {[
              { label: "Document", icon: "fi:file" },
              { label: "Photos", icon: "fi:image" },
              { label: "Location", icon: "fi:map-pin" },
              { label: "Contact", icon: "fi:user" },
              { label: "Template", icon: "fi:paperclip", action: () => setTemplatePickerOpen(true) },
            ].map((item) => {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action?.();
                    setPopupOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-hover"
                >
                  <Icon name={item.icon} />
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
