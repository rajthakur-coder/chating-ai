"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiRefreshCw, FiSave } from "react-icons/fi";
import {
  getKnowledgeBase,
  KnowledgeBase,
  saveKnowledgeBase,
  scrapeWebsite,
} from "@/services/knowledgeBase";
import { ToasterUtils } from "@/components/ui/toast";
import { Button } from "@/components/Common/Button";
import CustomInput from "@/components/Common/inputField";

const emptyKnowledge: KnowledgeBase = {
  website_link: "",
  company_name: "",
  industry: "",
  about_company: "",
  target_demographics: "",
  logo: "",
  socials: [],
  page_images: [],
  policies: "",
  faqs: "",
};

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [form, setForm] = useState<KnowledgeBase>(emptyKnowledge);
  const [socialsText, setSocialsText] = useState("");

  const knowledgeQuery = useQuery({
    queryKey: ["knowledge-base"],
    queryFn: getKnowledgeBase,
  });

  useEffect(() => {
    if (!knowledgeQuery.data) return;
    const next = { ...emptyKnowledge, ...knowledgeQuery.data };
    setForm(next);
    setWebsiteUrl(next.website_link || "");
    setSocialsText(
      (next.socials || [])
        .map((social) => `${social.type || social.social_type || "social"}: ${social.url}`)
        .join("\n"),
    );
  }, [knowledgeQuery.data]);

  const scrapeMutation = useMutation({
    mutationFn: scrapeWebsite,
    onSuccess: (data) => {
      const next = {
        ...emptyKnowledge,
        ...form,
        ...data,
        policies: form.policies || "",
        faqs: form.faqs || "",
      };
      setForm(next);
      setWebsiteUrl(next.website_link || websiteUrl);
      setSocialsText(
        (next.socials || [])
          .map((social) => `${social.type || social.social_type || "social"}: ${social.url}`)
          .join("\n"),
      );
      ToasterUtils.success("Website knowledge imported");
    },
    onError: () => ToasterUtils.error("Unable to scrape website"),
  });

  const saveMutation = useMutation({
    mutationFn: saveKnowledgeBase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      ToasterUtils.success("Knowledge base saved");
    },
    onError: () => ToasterUtils.error("Unable to save knowledge base"),
  });

  const imagePreview = useMemo(
    () => (form.page_images || []).filter((image) => image && !image.endsWith(".bin")).slice(0, 8),
    [form.page_images],
  );

  const updateField = <K extends keyof KnowledgeBase>(key: K, value: KnowledgeBase[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleScrape = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!websiteUrl.trim()) {
      ToasterUtils.error("Enter a website URL");
      return;
    }
    scrapeMutation.mutate(websiteUrl.trim());
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate({
      ...form,
      website_link: websiteUrl.trim(),
      socials: socialsText
        .split("\n")
        .map((line) => {
          const [type, ...urlParts] = line.split(":");
          return { type: type.trim() || "social", url: urlParts.join(":").trim() };
        })
        .filter((social) => social.url),
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="border-b border-default pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
        <p className="mt-2 text-sm text-muted">
          Import website knowledge, review it, and save the approved version for AI replies.
        </p>
      </section>

      <form onSubmit={handleScrape} className="rounded-lg border border-default bg-surface p-5">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
          <CustomInput
            value={websiteUrl}
            onChange={setWebsiteUrl}
            placeholder="https://yourbrand.com"
            height="48px"
          />
          <Button
            type="submit"
            text={scrapeMutation.isPending ? "Importing..." : "Import from Website"}
            icon={FiRefreshCw}
            loading={scrapeMutation.isPending}
            loaderType="bounce"
            disabled={scrapeMutation.isPending}
            height="48px"
            fullWidthOnMobile
          />
        </div>
      </form>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-default bg-surface p-5">
            <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-default bg-white p-4 dark:bg-slate-950">
              {form.logo ? (
                <img src={form.logo} alt="Brand logo" className="max-h-28 max-w-full object-contain" />
              ) : (
                <span className="text-sm text-muted">Logo will appear here</span>
              )}
            </div>
            <CustomInput
              label="Logo URL"
              value={form.logo || ""}
              onChange={(value) => updateField("logo", value)}
              className="mt-4"
            />
          </div>

          <div className="rounded-lg border border-default bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Business Profile</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <CustomInput
                label="Company name"
                value={form.company_name || ""}
                onChange={(value) => updateField("company_name", value)}
              />
              <CustomInput
                label="Industry"
                value={form.industry || ""}
                onChange={(value) => updateField("industry", value)}
              />
            </div>
            <CustomInput
              label="About company"
              value={form.about_company || ""}
              onChange={(value) => updateField("about_company", value)}
              multiline
              rows={5}
              className="mt-4"
            />
            <CustomInput
              label="Target customers"
              value={form.target_demographics || ""}
              onChange={(value) => updateField("target_demographics", value)}
              multiline
              rows={4}
              className="mt-4"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-default bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Policies</h2>
            <CustomInput
              value={form.policies || ""}
              onChange={(value) => updateField("policies", value)}
              placeholder="Shipping, return, refund, cancellation, warranty, COD rules..."
              multiline
              rows={9}
              className="mt-4"
            />
          </div>
          <div className="rounded-lg border border-default bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">FAQs</h2>
            <CustomInput
              value={form.faqs || ""}
              onChange={(value) => updateField("faqs", value)}
              placeholder="Q: ...&#10;A: ..."
              multiline
              rows={9}
              className="mt-4"
            />
          </div>
        </section>

        <section className="rounded-lg border border-default bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Social Presence</h2>
          <CustomInput
            label="Social links"
            value={socialsText}
            onChange={setSocialsText}
            multiline
            rows={4}
            className="mt-4"
          />
        </section>

        {imagePreview.length ? (
          <section className="rounded-lg border border-default bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Website Images</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {imagePreview.map((image, index) => (
                <div key={`${image}-${index}`} className="aspect-[4/3] overflow-hidden rounded-md border border-default bg-white dark:bg-slate-950">
                  <img src={image} alt={`Website image ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            text={saveMutation.isPending ? "Saving..." : "Save Knowledge Base"}
            icon={FiSave}
            loading={saveMutation.isPending}
            loaderType="bounce"
            disabled={saveMutation.isPending || knowledgeQuery.isLoading}
            fullWidthOnMobile
          />
        </div>
      </form>
    </div>
  );
}
