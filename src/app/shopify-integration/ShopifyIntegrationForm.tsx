"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { ToasterUtils } from "@/components/ui/toast";
import { Button, Checkbox, CustomSelect } from "@/components/Common";
import CustomInput from "@/components/Common/inputField";
import { FiArrowDown, FiArrowUp, FiSave } from "react-icons/fi";
import { SiShopify } from "react-icons/si";

type ConnectResponse = {
  status?: string;
  connection?: {
    id?: number;
    store_name?: string | null;
    store_url?: string | null;
    status?: string | null;
  };
};

type EcommerceConnection = NonNullable<ConnectResponse["connection"]>;

type ShopifyCollection = {
  shopify_collection_id: string;
  title: string;
  handle?: string | null;
  product_count: number;
  visible: boolean;
  sort_order: number;
};

type DefaultCatalogCategory = {
  category_key: string;
  title: string;
  description?: string | null;
  visible: boolean;
  sort_order: number;
};

type CatalogItem =
  | (ShopifyCollection & { item_type: "collection"; item_key: string })
  | (DefaultCatalogCategory & { item_type: "default"; item_key: string });

function shopDomainWithSuffix(value: string) {
  const normalized = value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (!normalized) return "";
  if (normalized.endsWith(".myshopify.com")) return normalized;
  return `${normalized}.myshopify.com`;
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    return error.message;
  }

  return "Unable to connect Shopify store.";
}

function moveCatalogItem(
  rows: CatalogItem[],
  itemKey: string,
  direction: -1 | 1,
) {
  const index = rows.findIndex((row) => row.item_key === itemKey);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= rows.length) return rows;
  const next = [...rows];
  const [row] = next.splice(index, 1);
  next.splice(nextIndex, 0, row);
  return next.map((item, order) => ({ ...item, sort_order: order }));
}

function sortCatalogItemsBySavedOrder(rows: CatalogItem[]) {
  return [...rows]
    .sort((first, second) => {
      const orderDiff = (first.sort_order ?? 0) - (second.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return first.title.localeCompare(second.title);
    })
    .map((item, order) => ({ ...item, sort_order: order }));
}

function buildCatalogItems(
  defaultCategories: DefaultCatalogCategory[] = [],
  collections: ShopifyCollection[] = [],
) {
  return sortCatalogItemsBySavedOrder([
    ...defaultCategories.map((category) => ({
      ...category,
      item_type: "default" as const,
      item_key: `default:${category.category_key}`,
    })),
    ...collections.map((collection) => ({
      ...collection,
      item_type: "collection" as const,
      item_key: `collection:${collection.shopify_collection_id}`,
    })),
  ]);
}

export default function ShopifyIntegrationForm() {
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [syncConnection, setSyncConnection] = useState<EcommerceConnection | null>(
    null,
  );
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [connections, setConnections] = useState<EcommerceConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isSavingCollections, setIsSavingCollections] = useState(false);

  async function loadConnections() {
    try {
      const response = await api.get<EcommerceConnection[]>("/ecommerce/connections");
      const shopifyConnections = response.data.filter(
        (connection) => connection.id && connection.store_url,
      );
      setConnections(shopifyConnections);
      setSelectedConnectionId((current) => current || shopifyConnections[0]?.id || null);
    } catch {
      setConnections([]);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadConnections);
  }, []);

  useEffect(() => {
    if (!selectedConnectionId) return;

    async function loadCollections() {
      setIsLoadingCollections(true);
      try {
        const response = await api.get<{
          default_categories?: DefaultCatalogCategory[];
          collections: ShopifyCollection[];
        }>(
          `/ecommerce/connections/${selectedConnectionId}/shopify-collections`,
        );
        setCatalogItems(
          buildCatalogItems(
            response.data.default_categories || [],
            response.data.collections || [],
          ),
        );
      } catch (error) {
        const message = `Unable to load Shopify collections: ${errorMessage(error)}`;
        setCatalogItems([]);
        setMessage(message);
        setMessageType("error");
        ToasterUtils.error(message);
      } finally {
        setIsLoadingCollections(false);
      }
    }

    void loadCollections();
  }, [selectedConnectionId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsConnecting(true);
    setMessage("");
    setMessageType("");

    const storeUrl = shopDomainWithSuffix(shopDomain);
    const token = accessToken.trim();

    if (!storeUrl || !token) {
      setIsConnecting(false);
      const message = "Shop domain and access token are required.";
      setMessage(message);
      setMessageType("error");
      ToasterUtils.error(message);
      return;
    }

    try {
      const response = await api.post<ConnectResponse>("/ecommerce/connections", {
        name: storeUrl,
        platform: "shopify",
        store_url: storeUrl,
        access_token: token,
      });

      const storeName =
        response.data.connection?.store_name ||
        response.data.connection?.store_url ||
        storeUrl;

      setSyncConnection(response.data.connection || null);
      await loadConnections();
      if (response.data.connection?.id) {
      setSelectedConnectionId(response.data.connection.id);
      }
      setIsSyncModalOpen(true);
      const message = `Shopify connected: ${storeName}`;
      setMessage(message);
      setMessageType("success");
      ToasterUtils.success(message);
    } catch (error) {
      const message = errorMessage(error);
      setMessage(message);
      setMessageType("error");
      ToasterUtils.error(message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <CustomInput
            label="Shop Domain"
            type="text"
            value={shopDomain}
            onChange={setShopDomain}
            placeholder="your-store"
            helperText="Enter your Shopify store domain without .myshopify.com."
          />
        </div>

        <div>
          <CustomInput
            label="Access Token"
            type="password"
            value={accessToken}
            onChange={setAccessToken}
            placeholder="Enter your Shopify access token"
            helperText="You can generate an access token from your Shopify admin panel under Apps and private app settings."
          />
        </div>

        {message ? (
          <p
            className={`rounded-md border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            type="submit"
            disabled={isConnecting}
            loading={isConnecting}
            text={isConnecting ? "Connecting..." : "Connect Shopify"}
            icon={SiShopify}
            color="primary"
            size="md"
          />
        </div>
      </form>
      <section className="mt-8 border-t border-default pt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            WhatsApp Catalog Collections
          </h2>
          <p className="mt-1 text-sm text-muted">
            Choose which catalog categories should appear in WhatsApp and in what
            order.
          </p>
        </div>
        {connections.length ? (
          <CustomSelect
            value={selectedConnectionId ? String(selectedConnectionId) : ""}
            onChange={(value) => setSelectedConnectionId(Number(value))}
            options={connections.map((connection) => ({
              label: connection.store_name || connection.store_url || "Shopify store",
              value: String(connection.id),
            }))}
            className="w-full md:w-72"
          />
        ) : null}
      </div>

      {!connections.length ? (
        <p className="mt-4 rounded-md border border-default bg-surface-strong px-4 py-3 text-sm text-muted">
          Connect Shopify first to choose catalog collections.
        </p>
      ) : null}

      {connections.length ? (
        <div className="mt-4 rounded-lg border border-default bg-surface">
          {isLoadingCollections ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Loading collections...
            </p>
          ) : null}

          {!isLoadingCollections && catalogItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No catalog categories found.
            </p>
          ) : null}

          {!isLoadingCollections &&
            catalogItems.map((item, index) => (
              <div
                key={item.item_key}
                className="flex items-center justify-between gap-4 border-b border-default px-4 py-3 last:border-b-0"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {item.item_type === "collection"
                      ? `${item.product_count} products`
                      : item.description || "Default catalog category"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(event) => {
                      event.preventDefault();
                      setCatalogItems((current) =>
                        moveCatalogItem(current, item.item_key, -1),
                      );
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-default bg-white text-foreground transition hover:bg-surface-strong disabled:opacity-40 dark:bg-slate-950"
                    aria-label={`Move ${item.title} up`}
                  >
                    <FiArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={index === catalogItems.length - 1}
                    onClick={(event) => {
                      event.preventDefault();
                      setCatalogItems((current) =>
                        moveCatalogItem(current, item.item_key, 1),
                      );
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-default bg-white text-foreground transition hover:bg-surface-strong disabled:opacity-40 dark:bg-slate-950"
                    aria-label={`Move ${item.title} down`}
                  >
                    <FiArrowDown size={15} />
                  </button>
                  <Checkbox
                    checked={item.visible}
                    onChange={() =>
                      setCatalogItems((current) =>
                        current.map((row) =>
                          row.item_key === item.item_key
                            ? { ...row, visible: !row.visible }
                            : row,
                        ),
                      )
                    }
                    size="xs"
                    checkedColor="bg-primary"
                  />
                </span>
              </div>
            ))}

          {!isLoadingCollections && catalogItems.length ? (
            <div className="flex justify-end border-t border-default px-4 py-3">
              <Button
                type="button"
                disabled={isSavingCollections || !selectedConnectionId}
                loading={isSavingCollections}
                text={isSavingCollections ? "Saving..." : "Save Categories"}
                icon={FiSave}
                color="primary"
                size="md"
                onClick={async () => {
                  if (!selectedConnectionId) return;
                  setIsSavingCollections(true);
                  try {
                    await api.put(
                      `/ecommerce/connections/${selectedConnectionId}/shopify-collections`,
                      {
                        default_categories: catalogItems
                          .filter((item) => item.item_type === "default")
                          .map((item) => ({
                            category_key: item.category_key,
                            visible: item.visible,
                            sort_order: catalogItems.findIndex(
                              (row) => row.item_key === item.item_key,
                            ),
                          })),
                        collections: catalogItems
                          .filter((item) => item.item_type === "collection")
                          .map((item) => ({
                          shopify_collection_id: item.shopify_collection_id,
                          visible: item.visible,
                          sort_order: catalogItems.findIndex(
                            (row) => row.item_key === item.item_key,
                          ),
                        })),
                      },
                    );
                    setCatalogItems((current) =>
                      current.map((item, index) => ({
                        ...item,
                        sort_order: index,
                      })),
                    );
                    const message = "WhatsApp catalog categories saved.";
                    setMessage(message);
                    setMessageType("success");
                    ToasterUtils.success(message);
                  } catch (error) {
                    const message = errorMessage(error);
                    setMessage(message);
                    setMessageType("error");
                    ToasterUtils.error(message);
                  } finally {
                    setIsSavingCollections(false);
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
    {isSyncModalOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
        <div className="w-full max-w-md rounded-lg border border-default bg-surface p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-strong text-foreground">
                <Icon name="si:shopify" size={22} color="currentColor" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Shopify Connected
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {syncConnection?.store_name ||
                    syncConnection?.store_url ||
                    "Your store"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-default bg-surface-strong text-foreground transition hover:bg-surface"
              aria-label="Close sync status"
            >
              <Icon name="fi:x" size={18} color="currentColor" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">
            Your store details are saved. The backend reads Shopify products and
            orders live, caches them when needed, and receives future Shopify
            updates through webhooks.
          </p>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={() => setIsSyncModalOpen(false)}
              text="Done"
              color="primary"
              size="md"
            />
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
