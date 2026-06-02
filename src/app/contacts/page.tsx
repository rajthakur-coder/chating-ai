"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit2, FiMoreVertical, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  Button,
  ButtonDropdown,
  Checkbox,
  Pagination,
  SearchInput,
  Skeleton,
  Tabs,
} from "@/components/Common";
import { cn } from "@/lib/utils";
import AddContact from "@/modals/ApiModal/AddContact";
import {
  Contact,
  ContactStatus,
  assignTags,
  createTag,
  deleteContact,
  getContacts,
  saveContact,
  updateContactStatus,
} from "@/services/contacts";
import { runWithToast } from "@/utils/runWithToast";

type RowContact = {
  id: string;
  serial: number;
  name: string;
  mobile: string;
  status: ContactStatus;
  tags: Array<{ id: string | number; name: string; color?: string | null }>;
  date: string;
  time: string;
  raw: Contact;
};

const PAGE_SIZE = 10;
const CONTACT_STATUSES: ContactStatus[] = ["Active", "Inactive", "Blocked", "Banned", "Archived"];

const statusStyles: Record<ContactStatus, { light: string; dot: string }> = {
  Active: {
    light: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  Inactive: {
    light: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  Blocked: {
    light: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  Banned: {
    light: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  Archived: {
    light: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
};

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
    }),
  };
}

function assertSuccess<T extends { success?: boolean; message?: string }>(result: T) {
  if (result.success === false) {
    throw new Error(result.message || "Request failed");
  }
  return result;
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"All" | ContactStatus>("All");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<RowContact | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, selectedTag]);

  const contactsQuery = useQuery({
    queryKey: ["contacts", currentPage, search, activeTab, selectedTag],
    queryFn: () =>
      getContacts({
        offset: currentPage - 1,
        limit: PAGE_SIZE,
        searchValue: search || undefined,
        status: activeTab === "All" ? undefined : activeTab,
        tags: selectedTag || undefined,
      }),
  });

  const invalidateContacts = () =>
    queryClient.invalidateQueries({ queryKey: ["contacts"] });

  const saveMutation = useMutation({
    mutationFn: saveContact,
    onSuccess: invalidateContacts,
  });

  const statusMutation = useMutation({
    mutationFn: updateContactStatus,
    onSuccess: invalidateContacts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: invalidateContacts,
  });

  const tagMutation = useMutation({
    mutationFn: async ({ contact, tagName }: { contact: RowContact; tagName: string }) => {
      const created = assertSuccess(
        await createTag({ name: tagName.trim(), color: "#60a5fa" }),
      );
      const tagId = Number(created.data?.id);
      return assignTags({ contact_id: Number(contact.id), tag_ids: [tagId] });
    },
    onSuccess: invalidateContacts,
  });

  const apiData = contactsQuery.data;
  const rows = useMemo<RowContact[]>(() => {
    return (apiData?.data || []).map((contact, index) => {
      const formatted = formatDateTime(contact.created_at);
      return {
        id: String(contact.id),
        serial: contact.sr_no || (currentPage - 1) * PAGE_SIZE + index + 1,
        name: contact.custom_name || contact.profile_name || "-",
        mobile: contact.customer_phone_number || "-",
        status: contact.status || "Active",
        tags: contact.contact_tags || [],
        date: formatted.date,
        time: formatted.time,
        raw: contact,
      };
    });
  }, [apiData?.data, currentPage]);

  const tagOptions = useMemo(() => {
    const unique = new Map<string, { label: string; value: string }>();
    rows.forEach((contact) => {
      contact.tags.forEach((tag) => {
        if (!unique.has(tag.name)) {
          unique.set(tag.name, { label: tag.name, value: tag.name });
        }
      });
    });
    return [{ label: "All Tags", value: "" }, ...Array.from(unique.values())];
  }, [rows]);

  const tabs = [
    { name: "All", key: "All", count: apiData?.recordsTotal || 0 },
    { name: "Active", key: "Active", count: apiData?.total_active || 0 },
    { name: "Inactive", key: "Inactive", count: apiData?.total_inactive || 0 },
    { name: "Blocked", key: "Blocked", count: apiData?.total_blocked || 0 },
  ];

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const totalItems = apiData?.recordsFiltered || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const handleSaveContact = async (payload: {
    customer_phone_number: string;
    custom_name: string;
  }) => {
    await runWithToast({
      action: () => saveMutation.mutateAsync(payload).then(assertSuccess),
      getSuccessMessage: (result) => result.message || "Contact saved successfully",
      errorMessage: "Contact save failed",
    });
    setEditingContact(null);
  };

  const handleDelete = async (contact: RowContact) => {
    await runWithToast({
      action: () => deleteMutation.mutateAsync(contact.mobile).then(assertSuccess),
      getSuccessMessage: (result) => result.message || "Contact deleted",
      errorMessage: "Delete failed",
    });
  };

  const handleStatusChange = async (contact: RowContact, status: ContactStatus) => {
    if (status === contact.status) return;
    await runWithToast({
      action: () =>
        statusMutation
          .mutateAsync({ customer_phone_number: contact.mobile, status })
          .then(assertSuccess),
      getSuccessMessage: (result) => result.message || "Status updated successfully",
      errorMessage: "Status update failed",
    });
  };

  const handleAddTag = async (contact: RowContact) => {
    const tagName = window.prompt("Tag name");
    if (!tagName?.trim()) return;
    await runWithToast({
      action: () => tagMutation.mutateAsync({ contact, tagName }).then(assertSuccess),
      getSuccessMessage: (result) => result.message || "Tag assigned successfully",
      errorMessage: "Tag assign failed",
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bodycolor">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-4 pt-5">
        {(addOpen || editingContact) && (
          <AddContact
            isOpen={addOpen || Boolean(editingContact)}
            toggle={() => {
              setAddOpen(false);
              setEditingContact(null);
            }}
            contact={
              editingContact
                ? {
                    mobile: editingContact.mobile,
                    name: editingContact.name,
                    custom_name: editingContact.raw.custom_name || undefined,
                    profile_name: editingContact.raw.profile_name || undefined,
                  }
                : undefined
            }
            onSave={handleSaveContact}
          />
        )}

        <h1 className="mb-4 text-2xl font-semibold text-foreground">Contacts</h1>

        <Tabs
          tabs={tabs}
          selectedTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as "All" | ContactStatus)}
        />

        <div className="mt-2 border-t border-slate-200 pb-2 pt-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
              <div className="w-full sm:w-[280px]">
                <SearchInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, mobile..."
                  width="100%"
                  rounded="rounded-md"
                />
              </div>

              <ButtonDropdown
                buttonLabel={
                  tagOptions.find((option) => option.value === selectedTag)?.label ||
                  "Filter by Tag"
                }
                options={tagOptions}
                value={selectedTag}
                onChange={(value) => setSelectedTag(value || "")}
                minWidth="220px"
                maxWidth="220px"
              />
            </div>

            <div className="flex w-full justify-end md:w-auto">
              <Button
                text="Add Contact"
                color="light"
                variant="ghost"
                icon={FiPlus}
                width="100%"
                className="md:w-[160px]"
                iconPosition="left"
                onClick={() => setAddOpen(true)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          {contactsQuery.isLoading ? (
            <Skeleton type="table" rows={5} columns={6} />
          ) : rows.length ? (
            <div className="relative h-full overflow-auto rounded-t-xl border border-bordercolor bg-white shadow-sm">
              <table className="w-full min-w-[1000px] table-fixed text-sm">
                <thead className="sticky top-0 z-20 border-b border-bordercolor bg-gray-200 text-foreground">
                  <tr>
                    <th className="w-12 px-4 py-5 text-center">
                      <Checkbox
                        checked={allSelected}
                        onChange={() =>
                          setSelectedIds(allSelected ? [] : rows.map((contact) => contact.id))
                        }
                        size="xs"
                      />
                    </th>
                    <th className="w-32 px-4 py-5 text-left">ID</th>
                    <th className="px-4 py-5 text-left">NAME</th>
                    <th className="px-4 py-5 text-left">MOBILE NUMBER</th>
                    <th className="w-48 px-4 py-5 text-left">TAGS</th>
                    <th className="w-40 px-4 py-5 text-left">STATUS</th>
                    <th className="px-12 py-5 text-left">CREATED AT</th>
                    <th className="w-28 px-4 py-5 text-right">ACTIONS</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {rows.map((contact) => {
                    const status = statusStyles[contact.status] || statusStyles.Active;

                    return (
                      <tr
                        key={contact.id}
                        className="group border-b bg-white transition-all hover:bg-bodycolor"
                      >
                        <td className="px-4 py-4 text-center">
                          <Checkbox
                            checked={selectedIds.includes(contact.id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(contact.id)
                                  ? prev.filter((item) => item !== contact.id)
                                  : [...prev, contact.id],
                              )
                            }
                            size="xs"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-foreground">
                          {contact.serial}
                        </td>
                        <td className="px-4 py-4">
                          <span className="block font-semibold text-foreground">
                            {contact.name}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-slate-600">
                            {contact.mobile}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {contact.tags.length ? (
                              contact.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                                  style={{ backgroundColor: tag.color || "#6b7280" }}
                                >
                                  {tag.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-foreground">-</span>
                            )}
                            <button
                              type="button"
                              aria-label="Add custom tag"
                              onClick={() => handleAddTag(contact)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-foreground shadow-sm transition-all duration-300 hover:bg-white active:scale-95"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <label
                            className={cn(
                              "flex min-w-[135px] items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm",
                              status.light,
                            )}
                          >
                            <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                            <select
                              value={contact.status}
                              onChange={(event) =>
                                handleStatusChange(contact, event.target.value as ContactStatus)
                              }
                              className="w-full bg-transparent outline-none"
                            >
                              {CONTACT_STATUSES.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                        </td>
                        <td className="px-12 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {contact.date}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {contact.time}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              aria-label="Edit contact"
                              onClick={() => setEditingContact(contact)}
                              className="rounded-full p-2 transition-colors hover:bg-bodycolor"
                            >
                              <FiEdit2 className="text-slate-500" size={18} />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete contact"
                              onClick={() => handleDelete(contact)}
                              className="rounded-full p-2 transition-colors hover:bg-red-50"
                            >
                              <FiTrash2 className="text-red-500" size={18} />
                            </button>
                            <FiMoreVertical className="mt-2 text-slate-300" size={18} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-b-xl border border-t-0 border-bordercolor bg-white py-20 shadow-sm">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-4xl text-slate-400">
                0
              </div>
              <p className="text-md font-medium text-gray-500">
                {contactsQuery.isError ? "Unable to load contacts." : "No records found."}
              </p>
            </div>
          )}
        </div>
      </div>

      {totalItems > 0 ? (
        <div className="flex-none border-t border-bordercolor bg-white px-8 py-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
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
