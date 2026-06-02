"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiBold,
  FiChevronDown,
  FiCode,
  FiInfo,
  FiImage,
  FiItalic,
  FiMapPin,
  FiMenu,
  FiPhone,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { Button, ButtonDropdown, RadioButton, ToggleButton } from "@/components/Common";
import languagesData from "@/data/languages.json";
import {
  WhatsappTemplatePayload,
  getWhatsappTemplateById,
  registerWhatsappTemplate,
  updateWhatsappTemplate,
} from "@/services/templates";
import { runWithToast } from "@/utils/runWithToast";

type Category = "MARKETING" | "UTILITY" | "AUTHENTICATION";
type VariableSource = "header" | "body" | "footer";
type ButtonItem = {
  id: number;
  label: string;
  type: "quick_reply" | "visit_website" | "call";
  url?: string;
  phone?: string;
};
type VariableSample = {
  id: string;
  index: number;
  source: VariableSource;
  value: string;
};

type ApiTemplate = {
  id: number;
  name: string;
  language: string;
  language_name?: string | null;
  category: Category;
  parameter_format?: string | null;
  components: any[];
  message_send_ttl_seconds?: number | null;
};

const languageOptions = languagesData.map(
  (language: { Language: string; Code: string }) => ({
    label: language.Language,
    value: language.Code,
  }),
);

const variableTypeOptions = [
  { label: "Number", value: "number" },
  { label: "Name", value: "name" },
];

const mediaOptions = [
  { label: "None", value: "None" },
  { label: "Image", value: "Image" },
  { label: "Video", value: "Video" },
  { label: "Document", value: "Document" },
  { label: "Location", value: "Location" },
];

function saveTemplate(template: {
  id?: number;
  templateName: string;
  category: Category;
  language: string;
  headerText?: string;
  bodyText?: string;
  footerText?: string;
  mediaSample?: string;
  buttons?: ButtonItem[];
  authMethod?: "zero" | "one" | "copy";
  apps?: { packageName: string; signature: string }[];
  securityRecommendation?: boolean;
  isExpiryEnabled?: boolean;
  expiryTime?: string;
  validityEnabled?: boolean;
  validityPeriod?: string;
}) {
  const raw = window.localStorage.getItem("whatapp_templates");
  const existing = raw ? JSON.parse(raw) : [];
  const payload = {
    id: template.id || Date.now(),
    templateName: template.templateName,
    category: template.category,
    language: template.language,
    status: "PENDING",
    delivered: 0,
    readRate: "0%",
    topBlock: "-",
    lastEdited: new Date().toISOString(),
    headerText: template.headerText || "",
    bodyText: template.bodyText || "",
    footerText: template.footerText || "",
    mediaSample: template.mediaSample || "None",
    buttons: template.buttons || [],
    authMethod: template.authMethod || "zero",
    apps: template.apps || [{ packageName: "", signature: "" }],
    securityRecommendation: Boolean(template.securityRecommendation),
    isExpiryEnabled: Boolean(template.isExpiryEnabled),
    expiryTime: template.expiryTime || "10 minutes",
    validityEnabled: Boolean(template.validityEnabled),
    validityPeriod: template.validityPeriod || "24 hours",
  };
  const next = template.id
    ? existing.map((item: any) =>
        Number(item.id) === Number(template.id) ? { ...item, ...payload } : item,
      )
    : [payload, ...existing];
  window.localStorage.setItem("whatapp_templates", JSON.stringify(next));
}

function formatWhatsAppText(text: string) {
  return text
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/~(.*?)~/g, "<del>$1</del>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

function getVariableIndexes(text: string) {
  const matches = [...text.matchAll(/{{\s*(\d+)\s*}}/g)];
  return Array.from(new Set(matches.map((match) => Number(match[1])))).sort(
    (a, b) => a - b,
  );
}

export default function TemplateDesignPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<number | undefined>();
  const [category, setCategory] = useState<Category>("MARKETING");
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("en");
  const [variableType, setVariableType] = useState("number");
  const [mediaSample, setMediaSample] = useState("None");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [variables, setVariables] = useState<VariableSample[]>([]);
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [buttonMenuOpen, setButtonMenuOpen] = useState(false);
  const [validityEnabled, setValidityEnabled] = useState(false);
  const [validityPeriod, setValidityPeriod] = useState("24 hours");
  const [authMethod, setAuthMethod] = useState<"zero" | "one" | "copy">("zero");
  const [accepted, setAccepted] = useState(false);
  const [apps, setApps] = useState([{ packageName: "", signature: "" }]);
  const [securityRecommendation, setSecurityRecommendation] = useState(false);
  const [isExpiryEnabled, setIsExpiryEnabled] = useState(false);
  const [expiryTime, setExpiryTime] = useState("10 minutes");
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [loadError, setLoadError] = useState("");

  const isSubmitEnabled =
    templateName.trim().length > 0 &&
    (category === "AUTHENTICATION" || bodyText.trim().length > 0) &&
    !(category === "AUTHENTICATION" && authMethod === "zero" && !accepted);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get("templateId");
    if (!rawId) {
      setLoadingTemplate(false);
      return;
    }

    const loadTemplate = async () => {
      try {
      const parsedId = Number(rawId);
      const response = await getWhatsappTemplateById(parsedId);
      const found = response.data as ApiTemplate | undefined;

      if (!found) {
        setLoadError("Template not found. You can still create a new template.");
        setLoadingTemplate(false);
        return;
      }

      setTemplateId(parsedId);
      setCategory(found.category || "MARKETING");
      setTemplateName(found.name || "");
      setLanguage(found.language || "en");
      setVariableType(found.parameter_format === "NAMED" ? "name" : "number");

      const components = found.components || [];
      const header = components.find((item) => item.type === "HEADER");
      const body = components.find((item) => item.type === "BODY");
      const footer = components.find((item) => item.type === "FOOTER");
      const buttonComponent = components.find((item) => item.type === "BUTTONS");
      setHeaderText(header?.text || "");
      setBodyText(body?.text || "");
      setFooterText(footer?.text || "");
      setMediaSample(header?.format && header.format !== "TEXT" ? header.format : "None");
      setButtons(
        (buttonComponent?.buttons || []).map((button: any) => ({
          id: Date.now() + Math.random(),
          label: button.text || "Button",
          type:
            button.type === "URL"
              ? "visit_website"
              : button.type === "PHONE_NUMBER"
                ? "call"
                : "quick_reply",
          url: button.url,
          phone: button.phone_number,
        })),
      );
      setSecurityRecommendation(Boolean(body?.add_security_recommendation));
      setIsExpiryEnabled(Boolean(footer?.code_expiration_minutes));
      setExpiryTime(
        footer?.code_expiration_minutes
          ? `${footer.code_expiration_minutes} minutes`
          : "10 minutes",
      );
      setValidityEnabled(Boolean(found.message_send_ttl_seconds));
      setValidityPeriod(
        found.message_send_ttl_seconds
          ? `${Math.round(found.message_send_ttl_seconds / 3600)} hours`
          : "24 hours",
      );
      ["header", "body", "footer"].forEach((source) => {
        const text =
          source === "header"
            ? header?.text || ""
            : source === "body"
              ? body?.text || ""
              : footer?.text || "";
        const indexes = getVariableIndexes(text);
        setVariables((prev) => [
          ...prev,
          ...indexes.map((index) => ({
            id: `${source}-${index}`,
            index,
            source: source as VariableSource,
            value: "",
          })),
        ]);
      });
      } catch {
      setLoadError("Template data could not be loaded.");
      } finally {
      setLoadingTemplate(false);
      }
    };

    loadTemplate();
  }, []);

  const previewTime = useMemo(
    () =>
      new Date()
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase(),
    [],
  );

  const getPreviewText = (text: string, source: VariableSource) =>
    text.replace(/{{\s*(\d+)\s*}}/g, (match, rawIndex) => {
      const sample = variables.find(
        (item) => item.source === source && item.index === Number(rawIndex),
      );
      return sample?.value?.trim() || match;
    });

  const previewHeaderText = useMemo(
    () => getPreviewText(headerText, "header"),
    [headerText, variables],
  );
  const previewBodyText = useMemo(
    () => getPreviewText(bodyText, "body"),
    [bodyText, variables],
  );
  const previewFooterText = useMemo(
    () => getPreviewText(footerText, "footer"),
    [footerText, variables],
  );

  const syncVariablesForSource = (nextText: string, source: VariableSource) => {
    const indexes = getVariableIndexes(nextText);
    setVariables((prev) =>
      [
        ...prev.filter((item) => item.source !== source),
        ...indexes.map((index) => ({
          id: `${source}-${index}`,
          index,
          source,
          value:
            prev.find((item) => item.source === source && item.index === index)
              ?.value || "",
        })),
      ].sort((a, b) => a.source.localeCompare(b.source) || a.index - b.index),
    );
  };

  const handleTextChange = (source: VariableSource, value: string) => {
    const maxLength = source === "body" ? 1024 : 60;
    const clipped = value.slice(0, maxLength);

    if (source === "header") setHeaderText(clipped);
    if (source === "body") setBodyText(clipped);
    if (source === "footer") setFooterText(clipped);
    syncVariablesForSource(clipped, source);
  };

  const handleAddVariable = (source: VariableSource) => {
    const currentText =
      source === "header" ? headerText : source === "body" ? bodyText : footerText;
    const indexes = getVariableIndexes(currentText);
    const nextIndex = indexes.length ? Math.max(...indexes) + 1 : 1;
    const nextText = `${currentText}${currentText ? " " : ""}{{${nextIndex}}}`;
    handleTextChange(source, nextText);
  };

  const handleVariableTypeChange = (value: string) => {
    setVariableType(value);
    setVariables([]);
    setHeaderText("");
    setBodyText("");
    setFooterText("");
  };

  const applyFormatting = (symbol: string) => {
    handleTextChange("body", `${bodyText}${symbol}${symbol}`);
  };

  const addButton = (type: ButtonItem["type"], label: string) => {
    setButtons((prev) => [...prev, { id: Date.now(), type, label }]);
    setButtonMenuOpen(false);
  };

  const removeButton = (id: number) => {
    setButtons((prev) => prev.filter((button) => button.id !== id));
  };

  const updateButton = (id: number, data: Partial<ButtonItem>) => {
    setButtons((prev) =>
      prev.map((button) => (button.id === id ? { ...button, ...data } : button)),
    );
  };

  const formatVariableName = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const buildTextWithVariables = (text: string, source: VariableSource) => {
    if (variableType === "number") return text;
    return text.replace(/{{\s*(\d+)\s*}}/g, (match, rawIndex) => {
      const sample = variables.find(
        (item) => item.source === source && item.index === Number(rawIndex),
      );
      return sample?.value ? `{{${formatVariableName(sample.value)}}}` : match;
    });
  };

  const buildExamplePayload = (source: VariableSource) => {
    const sourceVariables = variables
      .filter((item) => item.source === source && item.value)
      .sort((a, b) => a.index - b.index);
    if (!sourceVariables.length) return undefined;
    if (variableType === "name") {
      return {
        body_text_named_params: sourceVariables.map((item) => ({
          param_name: formatVariableName(item.value),
          example: "sample",
        })),
      };
    }
    return { body_text: [sourceVariables.map((item) => item.value)] };
  };

  const buildApiButtons = () =>
    buttons
      .map((button) => {
        if (button.type === "visit_website") {
          return { type: "URL", text: button.label, url: button.url };
        }
        if (button.type === "call") {
          return { type: "PHONE_NUMBER", text: button.label, phone_number: button.phone };
        }
        return { type: "QUICK_REPLY", text: button.label };
      })
      .filter((button) => button.text);

  const buildTemplatePayload = (): WhatsappTemplatePayload => {
    const components: any[] = [];
    if (category === "AUTHENTICATION") {
      components.push({
        type: "BODY",
        add_security_recommendation: securityRecommendation,
      });
      if (isExpiryEnabled) {
        const minutes = parseInt(expiryTime, 10);
        if (!Number.isNaN(minutes)) {
          components.push({ type: "FOOTER", code_expiration_minutes: minutes });
        }
      }
      components.push({
        type: "BUTTONS",
        buttons: [
          authMethod === "copy"
            ? { type: "otp", otp_type: "copy_code" }
            : {
                type: "otp",
                otp_type: authMethod === "zero" ? "zero_tap" : "one_tap",
                ...(authMethod === "zero"
                  ? {
                      text: "Open App",
                      autofill_text: "Auto-fill Code",
                      zero_tap_terms_accepted: accepted,
                    }
                  : {}),
                supported_apps: apps.map((app) => ({
                  package_name: app.packageName,
                  signature_hash: app.signature,
                })),
              },
        ],
      });
    } else {
      if (headerText && mediaSample === "None") {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: buildTextWithVariables(headerText, "header"),
        });
      }
      components.push({
        type: "BODY",
        text: buildTextWithVariables(bodyText, "body"),
        ...(buildExamplePayload("body") ? { example: buildExamplePayload("body") } : {}),
      });
      if (footerText) components.push({ type: "FOOTER", text: footerText });
      const apiButtons = buildApiButtons();
      if (apiButtons.length) components.push({ type: "BUTTONS", buttons: apiButtons });
    }
    return {
      name: templateName,
      language,
      language_name:
        languagesData.find((item: { Code: string; Language: string }) => item.Code === language)
          ?.Language || "",
      category,
      parameter_format: variableType === "name" ? "NAMED" : "POSITIONAL",
      components,
      message_send_ttl_seconds: validityEnabled
        ? Math.max(60, (parseInt(validityPeriod, 10) || 24) * 3600)
        : 43200,
    };
  };

  const quickReplyButtons = buttons.filter(
    (button) => button.type === "quick_reply",
  );
  const callToActionButtons = buttons.filter(
    (button) => button.type !== "quick_reply",
  );

  const handleSubmit = async () => {
    if (!isSubmitEnabled) return;
    const payload = buildTemplatePayload();
    await runWithToast({
      action: async () => {
        const response = templateId
          ? await updateWhatsappTemplate(templateId, payload)
          : await registerWhatsappTemplate(payload);
        if (response.success === false) throw new Error(response.message);
        return response;
      },
      getSuccessMessage: (response) =>
        response.message || (templateId ? "Template updated successfully" : "Template created successfully"),
      errorMessage: "Template submit failed",
    });
    router.push("/template-message");
  };

  const renderVariableSamples = (source: VariableSource) => {
    const sourceVariables = variables.filter((item) => item.source === source);
    if (sourceVariables.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {source}
        </p>
        {sourceVariables.map((variable) => (
          <div key={variable.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="flex h-[36px] min-w-[60px] items-center justify-center rounded border bg-white px-2 text-xs font-bold">
                {variableType === "name" ? "{{}}" : `{{${variable.index}}}`}
              </div>
              <input
                value={variable.value}
                placeholder={
                  variableType === "name"
                    ? "Variable name"
                    : `Enter sample for {{${variable.index}}}`
                }
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setVariables((prev) =>
                    prev.map((item) =>
                      item.id === variable.id
                        ? { ...item, value: nextValue }
                        : item,
                    ),
                  );
                }}
                className={`h-[36px] flex-1 rounded-md border bg-white px-4 text-sm outline-none focus:border-slate-500 ${
                  !variable.value ? "border-red-500" : "border-bordercolor"
                }`}
              />
            </div>
            {!variable.value ? (
              <p className="ml-[76px] text-[10px] text-red-500">
                Sample value is required for this variable.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col bg-bodycolor pb-20">
      {loadingTemplate ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="loader" />
        </div>
      ) : (
        <>
      <div className="flex h-16 flex-none items-center justify-between border-b bg-white px-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-foreground hover:bg-hovergreen"
        >
          <FiArrowLeft size={18} />
          Back
        </button>
        <div className="text-sm font-semibold text-slate-600">
          {templateId ? "Edit Template" : "Create Template"}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-3">
        <div className="space-y-6 overflow-y-auto px-5 pb-32 pt-8 lg:col-span-2">
          {loadError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {loadError}
            </div>
          ) : null}
          <div className="mt-4 flex justify-center rounded-xl bg-hovergray">
            <div className="w-full rounded-xl border bg-white p-5 shadow-sm">
              <h1 className="text-2xl font-semibold text-foreground">
                Set up your template
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Choose the category that best describes your message template.
                Then, select the type of message that you want to send.
              </p>

              <div className="mt-4 flex overflow-hidden rounded-lg border">
                {(["MARKETING", "UTILITY", "AUTHENTICATION"] as Category[]).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={`flex-1 border-r py-3 text-sm font-medium last:border-r-0 ${
                        category === item
                          ? "bg-hovergray text-foreground"
                          : "bg-white text-slate-600 hover:bg-hovergray"
                      }`}
                    >
                      {item === "MARKETING"
                        ? "Marketing"
                        : item === "UTILITY"
                          ? "Utility"
                          : "Authentication"}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-3 font-semibold text-foreground">
              Template name and language
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Template Name
                  </label>
                  <span className="text-xs text-slate-500">
                    {templateName.length}/512
                  </span>
                </div>
                <input
                  value={templateName}
                  onChange={(event) =>
                    setTemplateName(
                      event.target.value
                        .toLowerCase()
                        .replace(/\s/g, "_")
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 512),
                    )
                  }
                  placeholder="Enter template name"
                  className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none transition-all hover:border-[#818cf8] focus:border-[#818cf8] focus:ring-[3px] focus:ring-[#818cf8]/30"
                />
              </div>
              <ButtonDropdown
                label="Select language"
                value={language}
                options={languageOptions}
                onChange={(value) => setLanguage(value || "en")}
                minWidth="100%"
                maxWidth="100%"
              />
            </div>
          </div>

          {category === "AUTHENTICATION" ? (
            <>
              <div className="max-w-4xl rounded-xl border bg-white p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Code delivery setup
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Choose how customers send the code from WhatsApp to your app.
                  Edits to this section won't require review or count towards edit limits.
                </p>

                {[
                  {
                    key: "zero",
                    title: "Zero-tap auto-fill",
                    desc:
                      "Recommended for easiest customer experience. Zero-tap will automatically send the code without requiring your customer to tap a button.",
                  },
                  {
                    key: "one",
                    title: "One-tap auto-fill",
                    desc:
                      "Customers tap a button to receive the code. If auto-fill isn't possible, a copy-code message will be sent.",
                  },
                  {
                    key: "copy",
                    title: "Copy code",
                    desc: "Basic authentication. Customers manually copy and paste the code into your app.",
                  },
                ].map((method) => (
                  <div key={method.key} className="mt-4 flex items-start gap-3 p-2">
                    <RadioButton
                      checked={authMethod === method.key}
                      onChange={() => {
                        setAuthMethod(method.key as "zero" | "one" | "copy");
                        if (method.key !== "zero") setAccepted(false);
                      }}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        {method.title}
                        <FiInfo size={14} className="text-gray-400" />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{method.desc}</p>
                      {authMethod === "zero" && method.key === "zero" ? (
                        <div className="mt-4 rounded-lg border bg-bodycolor p-4">
                          <label className="flex items-start gap-3 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={accepted}
                              onChange={() => setAccepted((prev) => !prev)}
                              className="mt-1"
                            />
                            <span>
                              By selecting zero-tap, I understand and accept the WhatsApp
                              Business Terms of Service.
                            </span>
                          </label>
                          {!accepted ? (
                            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                              You must accept the zero-tap terms to submit this template.
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {authMethod !== "copy" ? (
                <div className="max-w-5xl space-y-6 rounded-xl border bg-white p-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">App setup</h2>
                    <p className="mt-1 text-sm text-slate-600">You can add up to 5 apps.</p>
                  </div>
                  <div className="space-y-4">
                    {apps.map((app, index) => (
                      <div key={index} className="grid grid-cols-1 items-end gap-5 md:grid-cols-[1fr_1fr_auto]">
                        <div>
                          {index === 0 ? (
                            <label className="mb-1 block text-sm font-medium text-foreground">
                              Package name
                            </label>
                          ) : null}
                          <input
                            value={app.packageName}
                            onChange={(event) =>
                              setApps((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        packageName: event.target.value
                                          .toLowerCase()
                                          .slice(0, 224),
                                      }
                                    : item,
                                ),
                              )
                            }
                            placeholder="com.example.myapplication"
                            className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#818cf8]"
                          />
                        </div>
                        <div>
                          {index === 0 ? (
                            <label className="mb-1 block text-sm font-medium text-foreground">
                              App signature hash
                            </label>
                          ) : null}
                          <input
                            value={app.signature}
                            maxLength={11}
                            onChange={(event) =>
                              setApps((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, signature: event.target.value.slice(0, 11) }
                                    : item,
                                ),
                              )
                            }
                            placeholder="11 character hash"
                            className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#818cf8]"
                          />
                        </div>
                        {apps.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setApps((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                            }
                            className="rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {apps.some((app) => app.packageName.trim() === "" || app.signature.length !== 11) ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Signature hash must be 11 characters and all app fields are required.
                    </div>
                  ) : null}
                  {apps.length < 5 ? (
                    <Button
                      text="Add another app"
                      variant="solid"
                      onClick={() => setApps((prev) => [...prev, { packageName: "", signature: "" }])}
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="max-w-4xl rounded-xl border bg-white p-6">
                <h2 className="text-xl font-semibold text-foreground">Content</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Content for authentication message templates can't be edited.
                </p>
                <div className="mt-5 space-y-4">
                  <label className="flex items-start gap-3 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={securityRecommendation}
                      onChange={() => setSecurityRecommendation((prev) => !prev)}
                      className="mt-1"
                    />
                    <span>Add security recommendation</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={isExpiryEnabled}
                      onChange={() => setIsExpiryEnabled((prev) => !prev)}
                      className="mt-1"
                    />
                    <span>
                      Add expiry time for the code
                      <span className="block text-slate-500">
                        After the code has expired, the auto-fill button will be disabled.
                      </span>
                    </span>
                  </label>
                  {isExpiryEnabled ? (
                    <div className="rounded-lg border bg-bodycolor p-4">
                      <ButtonDropdown
                        label="Expires in"
                        value={expiryTime}
                        options={[
                          { label: "1 minutes", value: "1 minutes" },
                          { label: "2 minutes", value: "2 minutes" },
                          { label: "3 minutes", value: "3 minutes" },
                          { label: "5 minutes", value: "5 minutes" },
                          { label: "10 minutes", value: "10 minutes" },
                          { label: "15 minutes", value: "15 minutes" },
                        ]}
                        onChange={(value) => setExpiryTime(value || "10 minutes")}
                        minWidth="180px"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-5xl space-y-6 rounded-xl border bg-white p-8 text-foreground shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-bold">Content</h2>
                <p className="text-sm text-slate-600">
                  Add a header, body and footer for your template...
                </p>
              </div>

              <div className="grid max-w-2xl grid-cols-1 gap-8 md:grid-cols-2">
                <ButtonDropdown
                  label="Type of variable"
                  value={variableType}
                  options={variableTypeOptions}
                  onChange={(value) => handleVariableTypeChange(value || "number")}
                  minWidth="100%"
                  maxWidth="100%"
                />
                <ButtonDropdown
                  label="Media sample - Optional"
                  value={mediaSample}
                  options={mediaOptions}
                  onChange={(value) => {
                    setMediaSample(value || "None");
                    if (value && value !== "None") {
                      handleTextChange("header", "");
                    }
                  }}
                  minWidth="100%"
                  maxWidth="100%"
                />
              </div>

              {mediaSample !== "None" && mediaSample !== "Location" ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-bodycolor p-6">
                  <p className="text-[15px] font-medium text-slate-600">
                    Drag and drop to upload {mediaSample}
                  </p>
                  <p className="text-sm text-slate-500">
                    Or{" "}
                    <span className="font-semibold text-blue-500">
                      choose {mediaSample.toLowerCase()} on your device
                    </span>
                  </p>
                </div>
              ) : null}

              <div
                className={mediaSample !== "None" ? "space-y-2 opacity-50" : "space-y-2"}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <label>Header - Optional</label>
                  <span className="text-xs font-normal text-slate-500">
                    {headerText.length}/60
                  </span>
                </div>
                <input
                  disabled={mediaSample !== "None"}
                  value={mediaSample === "None" ? headerText : ""}
                  onChange={(event) => handleTextChange("header", event.target.value)}
                  placeholder={mediaSample !== "None" ? "Header disabled" : "Add header..."}
                  className="w-full rounded-md border border-bordercolor px-4 py-2 text-sm outline-none disabled:bg-gray-100"
                />
                {mediaSample === "None" ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleAddVariable("header")}
                      disabled={getVariableIndexes(headerText).length >= 1}
                      className="text-sm font-medium text-slate-600 hover:text-foreground disabled:text-gray-400"
                    >
                      + Add variable
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <label>Body</label>
                  <span className="text-xs font-normal text-slate-500">
                    {bodyText.length}/1024
                  </span>
                </div>
                <textarea
                  value={bodyText}
                  onChange={(event) => handleTextChange("body", event.target.value)}
                  rows={5}
                  placeholder="Enter the body content here..."
                  className="w-full rounded-t-md border border-bordercolor px-4 py-3 text-sm outline-none"
                />
                <div className="flex items-center justify-between rounded-b-md border border-t-0 border-bordercolor bg-bodycolor px-4 py-2">
                  <div className="flex items-center gap-3 text-slate-500">
                    <button type="button" onClick={() => applyFormatting("*")} title="Bold">
                      <FiBold size={20} />
                    </button>
                    <button type="button" onClick={() => applyFormatting("_")} title="Italic">
                      <FiItalic size={20} />
                    </button>
                    <button type="button" onClick={() => applyFormatting("~")} title="Strikethrough">
                      <span className="text-lg line-through">S</span>
                    </button>
                    <button type="button" onClick={() => applyFormatting("`")} title="Code">
                      <FiCode size={20} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddVariable("body")}
                    className="text-sm font-medium text-slate-600 hover:text-foreground"
                  >
                    + Add variable
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <label>Footer - Optional</label>
                  <span className="text-xs font-normal text-slate-500">
                    {footerText.length}/60
                  </span>
                </div>
                <input
                  value={footerText}
                  onChange={(event) => handleTextChange("footer", event.target.value)}
                  placeholder="Enter text"
                  className="w-full rounded-md border border-bordercolor px-4 py-2 text-sm outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAddVariable("footer")}
                    className="text-sm font-medium text-slate-600 hover:text-foreground"
                  >
                    + Add variable
                  </button>
                </div>
              </div>

              {variables.length > 0 ? (
                <div className="space-y-6 rounded-lg border border-bordercolor bg-bodycolor p-6">
                  <h4 className="border-b pb-2 text-[15px] font-semibold text-foreground">
                    Variable samples
                  </h4>
                  {renderVariableSamples("header")}
                  {renderVariableSamples("body")}
                  {renderVariableSamples("footer")}
                </div>
              ) : null}
            </div>
          )}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  Buttons <span className="text-slate-400">- Optional</span>
                </h3>
                <p className="text-sm text-slate-500">
                  Create buttons that let customers respond or take action.
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setButtonMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-hovergray"
                >
                  <FiPlus size={18} /> Add button <FiChevronDown size={14} />
                </button>
                {buttonMenuOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white py-1 shadow-lg">
                    <button
                      onClick={() => addButton("quick_reply", "Quick reply")}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-hovergray"
                    >
                      <FiPlus size={16} /> Custom
                    </button>
                    <button
                      onClick={() => addButton("visit_website", "Visit website")}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-hovergray"
                    >
                      <FiCode size={16} /> Visit website
                    </button>
                    <button
                      onClick={() => addButton("call", "Call now")}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-hovergray"
                    >
                      <FiPhone size={16} /> Call on WhatsApp
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {quickReplyButtons.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-foreground">
                    Quick reply
                  </h4>
                  {quickReplyButtons.map((button) => (
                    <div
                      key={button.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <FiMenu size={18} className="mt-8 text-slate-400" />
                      <div className="flex-1">
                        <label className="text-xs font-bold uppercase">
                          Button text
                        </label>
                        <input
                          type="text"
                          value={button.label}
                          onChange={(event) =>
                            updateButton(button.id, { label: event.target.value })
                          }
                          className="mt-1 w-full rounded-md border border-bordercolor p-2 text-sm outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeButton(button.id)}
                        className="mt-8 text-slate-400 hover:text-foreground"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {callToActionButtons.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-foreground">
                    Call to action
                  </h4>
                  {callToActionButtons.map((button) => (
                    <div
                      key={button.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <FiMenu size={18} className="mt-8 text-slate-400" />
                      <div className="grid flex-1 grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-3">
                          <label className="text-xs font-bold uppercase">
                            Type
                          </label>
                          <div className="mt-1 rounded-md border border-bordercolor p-2 text-sm">
                            {button.type === "visit_website"
                              ? "Visit website"
                              : "Call on WhatsApp"}
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <label className="text-xs font-bold uppercase">
                            Button text
                          </label>
                          <input
                            type="text"
                            value={button.label}
                            onChange={(event) =>
                              updateButton(button.id, { label: event.target.value })
                            }
                            className="mt-1 w-full rounded-md border border-bordercolor p-2 text-sm outline-none"
                          />
                        </div>
                        {button.type === "visit_website" ? (
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-bold uppercase">
                              Website URL
                            </label>
                            <input
                              type="text"
                              placeholder="https://example.com"
                              value={button.url || ""}
                              onChange={(event) =>
                                updateButton(button.id, { url: event.target.value })
                              }
                              className="mt-1 w-full rounded-md border border-bordercolor p-2 text-sm outline-none"
                            />
                          </div>
                        ) : null}
                        {button.type === "call" ? (
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-bold uppercase">
                              Phone number
                            </label>
                            <input
                              type="text"
                              placeholder="+91XXXXXXXXXX"
                              value={button.phone || ""}
                              onChange={(event) =>
                                updateButton(button.id, { phone: event.target.value })
                              }
                              className="mt-1 w-full rounded-md border border-bordercolor p-2 text-sm outline-none"
                            />
                          </div>
                        ) : null}
                      </div>
                      <button
                        onClick={() => removeButton(button.id)}
                        className="mt-8 text-slate-400 hover:text-foreground"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-[17px] font-bold text-slate-800">
              Message validity period
            </h3>
            <p className="mb-6 text-[14px] leading-relaxed text-slate-600">
              You can set a custom validity period that your marketing message
              must be delivered by before it expires.
            </p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-[15px] font-semibold text-slate-700">
                  Set custom validity period for your message
                </h4>
                <p className="text-[14px] text-slate-500">
                  If you don't set a custom validity period, the standard
                  WhatsApp message validity period will be applied.
                </p>
              </div>
              <ToggleButton
                isOn={validityEnabled}
                onToggle={() => setValidityEnabled((prev) => !prev)}
                size="sm"
                onColor="bg-primary"
                offColor="bg-gray-300"
              />
            </div>
            {validityEnabled ? (
              <ButtonDropdown
                label="Validity period"
                value={validityPeriod}
                options={[
                  { label: "12 hour", value: "12 hour" },
                  { label: "24 hours", value: "24 hours" },
                  { label: "48 hours", value: "48 hours" },
                  { label: "72 hours", value: "72 hours" },
                  { label: "96 hours", value: "96 hours" },
                  { label: "168 hours", value: "168 hours" },
                ]}
                onChange={(value) => setValidityPeriod(value || "24 hours")}
                minWidth="100%"
                maxWidth="100%"
                className="mt-4"
              />
            ) : null}
          </div>
        </div>

        <div className="hidden overflow-y-auto px-4 pb-32 pt-8 lg:block">
          <div className="sticky top-0 rounded-xl border bg-white p-4">
            <h3 className="mb-3 font-bold text-foreground">Template preview</h3>
            <div
              className="flex min-h-[400px] items-start justify-center overflow-y-auto rounded-lg bg-[#efe6d8] bg-repeat p-6"
              style={{
                backgroundImage: "url('/chat-bg-pattern.png')",
                backgroundSize: "contain",
                backgroundPosition: "center",
              }}
            >
              <div className="relative w-[280px] overflow-hidden rounded-lg bg-white text-sm shadow-sm">
                {mediaSample !== "None" ? (
                  <div className="m-1 flex aspect-video items-center justify-center rounded-md border border-bordercolor bg-hovergray">
                    {mediaSample === "Location" ? (
                      <FiMapPin size={64} className="text-gray-300" />
                    ) : (
                      <FiImage size={64} className="text-gray-300" />
                    )}
                  </div>
                ) : null}
                <div className="px-3 pb-1 pt-2">
                  {previewHeaderText ? (
                    <div className="mb-1 text-[16px] font-bold">
                      {previewHeaderText}
                    </div>
                  ) : null}
                  <div
                    className="whitespace-pre-wrap break-words text-[14.2px] leading-normal text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: formatWhatsAppText(
                        previewBodyText || "Template body preview",
                      ),
                    }}
                  />
                  {previewFooterText ? (
                    <div className="mt-1 text-[13px] italic text-gray-400">
                      {previewFooterText}
                    </div>
                  ) : null}
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] font-medium text-gray-400">
                      {previewTime}
                    </span>
                  </div>
                </div>
                {buttons.length > 0 ? (
                  <div className="flex flex-col border-t border-bordercolor">
                    {buttons.map((button) => (
                      <div
                        key={button.id}
                        className="flex items-center justify-center gap-2 border-b border-bordercolor py-2 text-[16px] font-medium text-blue-500 last:border-b-0"
                      >
                        {button.label || "Button"}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-end gap-4 border-t border-bordercolor bg-white p-4">
        <Button
          text="Cancel"
          color="light"
          variant="outline"
          onClick={() => router.push("/template-message")}
        />
        <Button
          text={templateId ? "Update Template" : "Submit Template"}
          color="light"
          variant="ghost"
          disabled={!isSubmitEnabled}
          onClick={handleSubmit}
        />
      </div>
      </>
      )}
    </div>
  );
}
