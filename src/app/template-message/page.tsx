"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiRefreshCw, FiTrash2, FiZap } from "react-icons/fi";
import {
  Button,
  ButtonDropdown,
  Checkbox,
  Pagination,
  SearchInput,
  Skeleton,
  StatusBadge,
} from "@/components/Common";
import {
  TemplateStatus,
  deleteWhatsappTemplate,
  getWhatsappTemplateLanguages,
  getWhatsappTemplateStatus,
  getWhatsappTemplates,
  syncWhatsappTemplates,
} from "@/services/templates";
import { runWithToast } from "@/utils/runWithToast";

const categoryOptions = [
  { label: "All", value: "" },
  { label: "Marketing", value: "MARKETING" },
  { label: "Utility", value: "UTILITY" },
  { label: "Authentication", value: "AUTHENTICATION" },
];

const statusOptions = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Approved", value: "APPROVED" },
];

const PAGE_SIZE = 10;

function normalizeBadgeStatus(status?: TemplateStatus) {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (status === "IN_REVIEW") return "Pending";
  return "Pending";
}

function formatDateTime(value?: string | null) {
  if (!value) return { date: "-", time: "-" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "-" };
  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function assertSuccess<T extends { success?: boolean; message?: string }>(result: T) {
  if (result.success === false) throw new Error(result.message || "Request failed");
  return result;
}

export default function TemplateMessagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, status, category, language]);

  const templatesQuery = useQuery({
    queryKey: ["whatsapp-templates", currentPage, search, status, category, language],
    queryFn: () =>
      getWhatsappTemplates({
        name: search,
        status,
        category,
        language,
        offset: currentPage - 1,
        limit: PAGE_SIZE,
        authentication: true,
      }),
  });

  const languagesQuery = useQuery({
    queryKey: ["whatsapp-template-languages"],
    queryFn: getWhatsappTemplateLanguages,
  });

  const syncMutation = useMutation({
    mutationFn: syncWhatsappTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-template-languages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhatsappTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] }),
  });

  const statusMutation = useMutation({
    mutationFn: getWhatsappTemplateStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] }),
  });

  const templates = templatesQuery.data?.data || [];
  const totalItems = templatesQuery.data?.recordsFiltered || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const allSelected = templates.length > 0 && selectedIds.length === templates.length;

  const languageOptions = useMemo(() => {
    const rows = languagesQuery.data?.data || [];
    return [
      { label: "All", value: "" },
      ...rows.map((item) => ({
        label: item.language_name || item.language,
        value: item.language,
      })),
    ];
  }, [languagesQuery.data?.data]);

  const handleDelete = async () => {
    if (!selectedIds.length) return;
    await runWithToast({
      action: async () => {
        for (const id of selectedIds) {
          assertSuccess(await deleteMutation.mutateAsync(id));
        }
        setSelectedIds([]);
        return { message: "Template deleted successfully" };
      },
      getSuccessMessage: (result) => result.message,
      errorMessage: "Delete failed",
    });
  };

  const handleRefresh = async () => {
    await runWithToast({
      action: () => syncMutation.mutateAsync().then(assertSuccess),
      getSuccessMessage: (result) => result.message || "Templates synced",
      errorMessage: "Template sync failed",
    });
  };

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col overflow-hidden bg-bodycolor text-foreground">
      <div className="flex h-16 flex-none items-center justify-between border-b bg-white px-4 sm:px-6">
        <h1 className="text-base font-semibold text-foreground sm:text-lg">
          Template Messages
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={syncMutation.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-200 transition hover:bg-gray-100"
          >
            <FiRefreshCw
              className={syncMutation.isPending ? "animate-spin text-primary" : "text-foreground"}
              size={18}
            />
          </button>
          <Button
            text="Create Template"
            color="light"
            variant="ghost"
            size="md"
            icon={() => <span className="text-lg leading-none">+</span>}
            onClick={() => router.push("/template-message/template-design")}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-8">
        <div
          className="mb-6 mt-4 flex flex-col gap-4 rounded-lg px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between"
          style={{
            background:
              "linear-gradient(89.59deg, #DBFFD8 -5.41%, #FEFFD8 31.98%, #DEFFD8 100.13%)",
          }}
        >
          <div className="flex items-start gap-4 sm:items-center">
            <FiZap className="mt-1 h-7 w-7 text-primary sm:mt-0" />
            <div>
              <h3 className="text-base font-semibold text-foreground sm:text-lg">
                Introducing AI-powered Magic: Generate Powerful WhatsApp Templates in seconds!
              </h3>
              <p className="mt-1 text-sm text-slate-600">Smarter. Faster. Zero guesswork.</p>
            </div>
          </div>
          <Button
            text="Generate Now"
            icon={FiZap}
            iconPosition="left"
            color="light"
            variant="ghost"
            className="w-full sm:w-auto"
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-lg border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Search</label>
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                width="340px"
                rounded="rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Category</label>
              <ButtonDropdown
                defaultLabel="Select category"
                value={category}
                options={categoryOptions}
                onChange={(value) => setCategory(value || "")}
                minWidth="180px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Language</label>
              <ButtonDropdown
                defaultLabel="Select language"
                value={language}
                options={languageOptions}
                onChange={(value) => setLanguage(value || "")}
                minWidth="180px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Status</label>
              <ButtonDropdown
                defaultLabel="Select status"
                value={status}
                options={statusOptions}
                onChange={(value) => setStatus(value || "")}
                minWidth="180px"
              />
            </div>
          </div>

          <div
            className={`flex w-fit items-center justify-start gap-4 rounded-xl border border-dashed border-bordercolor p-2 transition-all duration-300 ${
              selectedIds.length > 0
                ? "h-auto px-4 py-3 opacity-100"
                : "h-0 overflow-hidden border-none py-0 opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {selectedIds.length}
              </div>
              <span className="text-sm font-semibold text-gray-600">Selected</span>
            </div>
            <Button
              text="Delete"
              color="danger"
              variant="solid"
              size="sm"
              onClick={handleDelete}
              icon={FiTrash2}
              className="font-bold shadow-sm active:scale-95"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          {templatesQuery.isLoading ? (
            <Skeleton type="table" rows={5} columns={8} />
          ) : (
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-200">
                <tr>
                  <th className="w-12 px-4 py-6 text-center">
                    <Checkbox
                      checked={allSelected}
                      onChange={() =>
                        setSelectedIds(allSelected ? [] : templates.map((template) => template.id))
                      }
                      size="xs"
                    />
                  </th>
                  {[
                    "Template name",
                    "Category",
                    "Language",
                    "Status",
                    "Delivered",
                    "Read rate",
                    "Top block",
                    "Last edited",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-[14px] font-bold uppercase text-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-400">
                        0
                      </div>
                      <p className="font-medium text-foreground">No templates found</p>
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => {
                    const dateTime = formatDateTime(template.updated_at || template.created_at);
                    return (
                      <tr
                        key={template.id}
                        onClick={() =>
                          router.push(`/template-message/template-design?templateId=${template.id}`)
                        }
                        className="cursor-pointer border-b bg-white hover:bg-gray-50"
                      >
                        <td className="px-4 py-6" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(template.id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(template.id)
                                  ? prev.filter((item) => item !== template.id)
                                  : [...prev, template.id],
                              )
                            }
                            size="xs"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{template.name}</td>
                        <td className="px-4 py-3">{template.category}</td>
                        <td className="px-4 py-3">{template.language}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={normalizeBadgeStatus(template.status)}
                              displayText={template.status}
                              textSize="xs"
                            />
                            {template.status === "PENDING" ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  statusMutation.mutate(template.id);
                                }}
                                className="rounded-full p-1 hover:bg-gray-100"
                              >
                                <FiRefreshCw size={14} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3">0%</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-foreground">{dateTime.date}</span>
                            <span className="text-foreground">{dateTime.time}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalItems > 0 ? (
        <div className="flex-none border-t border-gray-200 bg-white px-8 py-1 shadow-md">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
          />
        </div>
      ) : null}
    </div>
  );
}
