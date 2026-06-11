"use client";

import { useState } from "react";
import BaseModal from "@/modals/BaseModals/BaseModal";
import CustomInput from "@/components/shared/inputField";
import RadioButton from "@/components/shared/RadioButton";
import { ToasterUtils } from "@/components/ui/toast";

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

export default function ChatScheduleModal({
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
            <label className="text-sm font-medium text-foreground">
              Template Category
            </label>
            <div className="flex w-full gap-2 rounded-md bg-surface-strong p-1">
              {["ALL", "MARKETING", "UTILITY"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`flex-1 rounded-md px-4 py-1.5 text-center text-xs font-semibold transition-all ${
                    category === item
                      ? "bg-green-300 text-green-700 shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Select Template
            </label>
            <select
              value={templateId}
              onChange={(event) => {
                setTemplateId(event.target.value);
                setErrors((prev) => ({ ...prev, template: false }));
              }}
              className={`h-[45px] w-full rounded-[5px] border bg-white px-3 text-sm text-foreground outline-none focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30 dark:bg-slate-950 ${
                errors.template ? "border-red-500" : "border-default"
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
            <label className="text-sm font-medium text-foreground">
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
            <div className="mt-1 rounded-md border border-default bg-surface px-2 py-2 text-center font-mono text-[12px] text-foreground">
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
            <label className="text-sm font-medium text-foreground">Frequency</label>
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
          <p className="sticky top-0 z-10 -mb-[48px] bg-white pb-4 text-sm font-medium text-muted dark:bg-slate-950">
            Message Preview
          </p>
          <div
            className="flex min-h-[400px] flex-1 items-start justify-center rounded-xl border border-default bg-[#efe7dd] p-6 dark:bg-slate-900"
            style={{ backgroundImage: "url('/chat-bg-pattern.png')" }}
          >
            <div className="mt-16 max-w-[320px] rounded-lg bg-white px-4 py-3 text-sm shadow dark:bg-slate-800">
              <p className="font-semibold text-foreground">
                {selectedTemplate?.name || "Template Preview"}
              </p>
              <p className="mt-2 leading-6 text-foreground">{previewBody}</p>
              <p className="mt-2 text-xs text-muted">Recipient: +{phoneNumber}</p>
              <p className="mt-3 text-right text-[10px] text-muted">{time}</p>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
