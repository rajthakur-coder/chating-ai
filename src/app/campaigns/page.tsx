"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiUpload,
  FiUsers,
} from "react-icons/fi";
import { Button } from "@/components/Common/Button";
import Checkbox from "@/components/Common/Checkbox";
import Pagination from "@/components/Common/Pagination";
import RadioButton from "@/components/Common/RadioButton";
import SearchInput from "@/components/Common/SearchInput";
import StatusBadge from "@/components/Common/StatusBadge";
import Tabs from "@/components/Common/Tabs";
import CustomInput from "@/components/Common/inputField";
import BaseModal from "@/modals/BaseModals/BaseModal";
import { ToasterUtils } from "@/components/ui/toast";

type CampaignType = "Live" | "Schedule";
type CampaignStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED";
type Campaign = {
  id: number;
  name: string;
  templateName: string;
  sender: string;
  scheduleType: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  recipients: number;
  startDate: string;
  scheduleTime: string;
  createdAt: string;
};

type StoredTemplate = {
  id: number;
  templateName: string;
  category: string;
  language: string;
};

const contacts = [
  { id: 1, name: "Amit Sharma", phone: "+91 98765 43210", tag: "Customer" },
  { id: 2, name: "Priya Patel", phone: "+91 99887 76655", tag: "Lead" },
  { id: 3, name: "Rohit Mehta", phone: "+91 91234 56780", tag: "VIP" },
  { id: 4, name: "Neha Singh", phone: "+91 90123 45678", tag: "Customer" },
];

const seedTemplates: StoredTemplate[] = [
  { id: 1, templateName: "welcome_offer", category: "MARKETING", language: "en" },
  { id: 2, templateName: "order_update", category: "UTILITY", language: "en" },
];

const seedCampaigns: Campaign[] = [
  {
    id: 1001,
    name: "May Welcome Broadcast",
    templateName: "welcome_offer",
    sender: "+91 98765 43210",
    scheduleType: "ONCE",
    campaignType: "Live",
    status: "COMPLETED",
    recipients: 128,
    startDate: "2026-05-18",
    scheduleTime: "04:20 PM",
    createdAt: "2026-05-18",
  },
  {
    id: 1002,
    name: "Order Follow Up",
    templateName: "order_update",
    sender: "+91 98765 43210",
    scheduleType: "DAILY",
    campaignType: "Schedule",
    status: "PROCESSING",
    recipients: 54,
    startDate: "2026-05-20",
    scheduleTime: "10:00 AM",
    createdAt: "2026-05-17",
  },
];

const loadTemplates = () => {
  if (typeof window === "undefined") return seedTemplates;
  const raw = window.localStorage.getItem("whatapp_templates");
  const saved = raw ? (JSON.parse(raw) as StoredTemplate[]) : [];
  return saved.length ? saved : seedTemplates;
};

const loadCampaigns = () => {
  if (typeof window === "undefined") return seedCampaigns;
  const raw = window.localStorage.getItem("whatapp_campaigns");
  return raw ? (JSON.parse(raw) as Campaign[]) : seedCampaigns;
};

const saveCampaigns = (campaigns: Campaign[]) => {
  window.localStorage.setItem("whatapp_campaigns", JSON.stringify(campaigns));
};

const today = new Date().toISOString().slice(0, 10);

const CampaignMessageModal = ({
  open,
  onClose,
  templates,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  templates: StoredTemplate[];
  onNext: (data: { name: string; template: StoredTemplate; variableType: string }) => void;
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ALL");
  const [templateId, setTemplateId] = useState("");
  const [variableType, setVariableType] = useState("FIXED");
  const [variableValue, setVariableValue] = useState("");
  const [error, setError] = useState(false);

  const filteredTemplates =
    category === "ALL"
      ? templates
      : templates.filter((template) => template.category === category);
  const selectedTemplate = templates.find((template) => String(template.id) === templateId);

  const handleConfirm = () => {
    if (!name.trim() || !selectedTemplate) {
      setError(true);
      return;
    }
    onNext({ name, template: selectedTemplate, variableType });
  };

  return (
    <BaseModal
      isOpen={open}
      toggle={onClose}
      headerText="Campaigns WhatsApp Message"
      widthClass="max-w-[95%] md:w-[980px]"
      maxHeight="max-h-[78vh]"
      onCancel={onClose}
      onConfirm={handleConfirm}
      confirmText="Campaigns Message"
      cancelText="Cancel"
    >
      <div className="grid h-[68vh] grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6 overflow-y-auto p-1">
          <CustomInput
            label="Campaigns Name"
            placeholder="Enter Campaigns name..."
            value={name}
            error={error && !name.trim()}
            helperText={error && !name.trim() ? "Campaigns name is required" : ""}
            onChange={setName}
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
                  className={`flex-1 rounded-md px-4 py-1.5 text-center text-xs font-semibold transition ${
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-900">
              Select Template
            </label>
            <select
              value={templateId}
              onChange={(event) => {
                setTemplateId(event.target.value);
                setError(false);
              }}
              className={`h-[45px] rounded-[5px] border bg-white px-3 text-sm outline-none focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30 ${
                error && !selectedTemplate ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Search and select template...</option>
              {filteredTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.templateName}
                </option>
              ))}
            </select>
            {error && !selectedTemplate && (
              <span className="ml-1 text-[12px] text-red-500">
                Template selection is required
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Variable Type</label>
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
              onChange={setVariableValue}
            />
          </div>
        </div>

        <div className="flex flex-col overflow-y-auto pr-1">
          <p className="sticky top-0 z-10 bg-white pb-4 text-sm font-medium text-slate-600">
            Message Preview
          </p>
          <div
            className="flex min-h-[440px] flex-1 items-start justify-center rounded-xl border border-gray-200 bg-[#efe7dd] p-6"
            style={{ backgroundImage: "url('/chat-bg-pattern.png')" }}
          >
            <div className="mt-12 max-w-[320px] rounded-lg bg-white px-4 py-3 text-sm shadow">
              <p className="font-semibold text-slate-900">
                {selectedTemplate?.templateName || "Select a template"}
              </p>
              <p className="mt-2 leading-6 text-slate-700">
                Hi {variableValue || "{{1}}"}, this is a campaign message preview.
              </p>
              <p className="mt-3 text-right text-[10px] text-gray-400">now</p>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

const RecipientsModal = ({
  open,
  onClose,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  onNext: (data: { mode: "all" | "selected" | "csv"; recipientCount: number }) => void;
}) => {
  const [mode, setMode] = useState<"all" | "selected" | "csv">("all");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [csvName, setCsvName] = useState("");

  const recipientCount =
    mode === "all"
      ? contacts.length
      : mode === "csv"
        ? csvName
          ? 250
          : 0
        : selectedContacts.length;

  const toggleContact = (id: number) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <BaseModal
      isOpen={open}
      toggle={onClose}
      headerText="Select Campaign Contacts"
      widthClass="max-w-[95%] md:w-[760px]"
      onCancel={onClose}
      onConfirm={() => {
        if (!recipientCount) {
          ToasterUtils.error("Please select contacts");
          return;
        }
        onNext({ mode, recipientCount });
      }}
      confirmText="Next"
      cancelText="Back"
      extraButton={{
        text: "Download CSV",
        onClick: () => ToasterUtils.success("CSV downloaded successfully!"),
        colorClass: "bg-gray-100 hover:bg-gray-200 text-black border-gray-200",
      }}
    >
      <div className="space-y-5 py-2">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { key: "all", title: "Broadcasting to All", icon: FiUsers },
            { key: "selected", title: "Selected Contacts", icon: FiSend },
            { key: "csv", title: "CSV Broadcast", icon: FiUpload },
          ].map((item) => {
            const Icon = item.icon;
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key as typeof mode)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <Icon className="mb-3 h-5 w-5 text-emerald-600" />
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
              </button>
            );
          })}
        </div>

        {mode === "all" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-900">
              Broadcasting to All
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Campaign will be sent to all available contacts.
            </p>
          </div>
        )}

        {mode === "selected" && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-slate-900">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Mobile Number</th>
                  <th className="px-4 py-3">Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{contact.name}</td>
                    <td className="px-4 py-3">{contact.phone}</td>
                    <td className="px-4 py-3">{contact.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mode === "csv" && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
            <FiUpload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="font-semibold text-slate-900">Drag & Drop your CSV file here</p>
            <p className="mt-1 text-sm text-gray-500">or browse file from your computer</p>
            <label className="mt-4 inline-flex cursor-pointer rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!file.name.endsWith(".csv")) {
                    ToasterUtils.error("Only CSV files are allowed");
                    return;
                  }
                  setCsvName(file.name);
                  ToasterUtils.success("CSV uploaded successfully");
                }}
              />
            </label>
            {csvName && <p className="mt-3 text-sm text-emerald-700">{csvName}</p>}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

const ScheduleDateModal = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    campaignType: CampaignType;
    scheduleType: string;
    startDate: string;
    scheduleTime: string;
  }) => void;
}) => {
  const [sendType, setSendType] = useState<"instant" | "schedule">("instant");
  const [frequency, setFrequency] = useState("once");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");

  return (
    <BaseModal
      isOpen={open}
      toggle={onClose}
      headerText="Date & Time Campaign Settings"
      widthClass="max-w-[95%] md:w-[480px]"
      onCancel={onClose}
      onConfirm={() => {
        onConfirm({
          campaignType: sendType === "instant" ? "Live" : "Schedule",
          scheduleType: sendType === "instant" ? "ONCE" : frequency.toUpperCase(),
          startDate: sendType === "instant" ? today : date,
          scheduleTime: sendType === "instant" ? "Now" : time,
        });
      }}
      confirmText={sendType === "schedule" ? "Schedule" : "Confirm & Launch"}
      cancelText="Back"
    >
      <div className="space-y-6 p-2">
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700">
            Campaign Execution
          </label>
          <div className="flex flex-wrap gap-8">
            <RadioButton
              label="Send Instantly (Live)"
              checked={sendType === "instant"}
              onChange={() => setSendType("instant")}
              size="sm"
            />
            <RadioButton
              label="Schedule for Later"
              checked={sendType === "schedule"}
              onChange={() => setSendType("schedule")}
              size="sm"
            />
          </div>
        </div>

        {sendType === "schedule" && (
          <div className="space-y-5 border-t pt-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-600">Frequency</label>
              <div className="flex gap-8">
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
            {frequency === "once" && (
              <CustomInput
                label="Launch Date"
                type="text"
                value={date}
                onChange={setDate}
              />
            )}
            <CustomInput
              label="Launch Time"
              type="text"
              value={time}
              onChange={setTime}
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);
  const [templates, setTemplates] = useState<StoredTemplate[]>(seedTemplates);
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [messageOpen, setMessageOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    template: StoredTemplate;
    variableType: string;
    recipientCount?: number;
  } | null>(null);

  useEffect(() => {
    setCampaigns(loadCampaigns());
    setTemplates(loadTemplates());
  }, []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const tabMatch = activeTab === "All" || campaign.campaignType === activeTab;
      const statusMatch =
        statusFilter === "ALL" || campaign.status.toUpperCase() === statusFilter;
      const searchMatch =
        !search ||
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.templateName.toLowerCase().includes(search.toLowerCase());
      return tabMatch && statusMatch && searchMatch;
    });
  }, [campaigns, activeTab, statusFilter, search]);

  const pagedCampaigns = filteredCampaigns.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / 10));

  const createCampaign = (dateData: {
    campaignType: CampaignType;
    scheduleType: string;
    startDate: string;
    scheduleTime: string;
  }) => {
    if (!draft) return;

    const nextCampaign: Campaign = {
      id: Date.now(),
      name: draft.name,
      templateName: draft.template.templateName,
      sender: "+91 98765 43210",
      scheduleType: dateData.scheduleType,
      campaignType: dateData.campaignType,
      status: dateData.campaignType === "Live" ? "PROCESSING" : "DRAFT",
      recipients: draft.recipientCount || contacts.length,
      startDate: dateData.startDate,
      scheduleTime: dateData.scheduleTime,
      createdAt: today,
    };

    const nextCampaigns = [nextCampaign, ...campaigns];
    setCampaigns(nextCampaigns);
    saveCampaigns(nextCampaigns);
    setDateOpen(false);
    setDraft(null);
    ToasterUtils.success(
      dateData.campaignType === "Live"
        ? "Campaign started instantly!"
        : "Campaign scheduled successfully!",
    );
  };

  const deleteCampaign = (id: number) => {
    const nextCampaigns = campaigns.filter((campaign) => campaign.id !== id);
    setCampaigns(nextCampaigns);
    saveCampaigns(nextCampaigns);
    ToasterUtils.success("Schedule deleted successfully");
  };

  const cancelCampaign = (id: number) => {
    const nextCampaigns = campaigns.map((campaign) =>
      campaign.id === id ? { ...campaign, status: "CANCELLED" as CampaignStatus } : campaign,
    );
    setCampaigns(nextCampaigns);
    saveCampaigns(nextCampaigns);
    ToasterUtils.success("Schedule cancelled successfully");
  };

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <Button
            text="Refresh"
            icon={FiRefreshCw}
            iconPosition="left"
            variant="ghost"
            color="light"
            size="sm"
            onClick={() => {
              setCampaigns(loadCampaigns());
              ToasterUtils.info("Campaigns refreshed");
            }}
          />
        </div>

        <Tabs
          tabs={[
            { name: "All", key: "All" },
            { name: "Live Campaigns", key: "Live" },
            { name: "Scheduled", key: "Schedule" },
          ]}
          selectedTab={activeTab}
          onTabChange={(key) => {
            setActiveTab(key);
            setCurrentPage(1);
            setStatusFilter("ALL");
          }}
        />

        <div className="mt-4 flex flex-col gap-4 rounded-t-lg border-x border-t bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-[420px]">
            <SearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Name, mobile number, tag"
              width="100%"
            />
          </div>

          <Button
            text="Campaigns Message"
            color="secondary"
            variant="solid"
            icon={FiPlus}
            iconPosition="left"
            onClick={() => setMessageOpen(true)}
            className="w-full sm:w-auto"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 border-x bg-white p-8 pt-0 pb-6">
          <div className="flex flex-wrap gap-2">
            {["DRAFT", "PROCESSING", "COMPLETED", "CANCELLED"].map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`rounded-xl border px-4 py-1.5 text-xs font-medium transition ${
                  statusFilter === status
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-gray-50 text-slate-700 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="rounded-xl border border-gray-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="relative overflow-auto border-x border-b bg-white">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-100 text-slate-900">
              <tr>
                {[
                  "S.No",
                  "Campaign Name",
                  "Template",
                  "Sender",
                  "Type",
                  "Recipients",
                  "Date",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th key={header} className="px-4 py-4 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedCampaigns.map((campaign, index) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">{(currentPage - 1) * 10 + index + 1}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-4">{campaign.templateName}</td>
                  <td className="px-4 py-4">{campaign.sender}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2">
                      {campaign.campaignType === "Schedule" ? <FiCalendar /> : <FiSend />}
                      {campaign.campaignType}
                    </span>
                  </td>
                  <td className="px-4 py-4">{campaign.recipients}</td>
                  <td className="px-4 py-4">
                    <div>{campaign.startDate}</div>
                    <div className="text-xs text-gray-500">{campaign.scheduleTime}</div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={campaign.status === "DRAFT" ? "Pending" : campaign.status}
                      displayText={campaign.status}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => ToasterUtils.info("Edit flow ready")}
                        className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelCampaign(campaign.id)}
                        className="rounded-md p-2 text-amber-600 hover:bg-amber-50"
                      >
                        <FiDownload />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pagedCampaigns.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-20 text-center text-gray-500">
                    No records found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCampaigns.length > 0 && (
        <div className="border-t bg-white px-8 py-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={10}
            totalItems={filteredCampaigns.length}
          />
        </div>
      )}

      <CampaignMessageModal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        templates={templates}
        onNext={(data) => {
          setDraft(data);
          setMessageOpen(false);
          setRecipientsOpen(true);
        }}
      />

      <RecipientsModal
        open={recipientsOpen}
        onClose={() => {
          setRecipientsOpen(false);
          setMessageOpen(true);
        }}
        onNext={(data) => {
          setDraft((prev) => (prev ? { ...prev, recipientCount: data.recipientCount } : prev));
          setRecipientsOpen(false);
          setDateOpen(true);
        }}
      />

      <ScheduleDateModal
        open={dateOpen}
        onClose={() => {
          setDateOpen(false);
          setRecipientsOpen(true);
        }}
        onConfirm={createCampaign}
      />
    </div>
  );
}
