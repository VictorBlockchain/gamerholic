"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  KeyRound,
  Package,
  Plus,
  Save,
  Settings2,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import {
  GhAlert,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhSurface,
  GhSwitch,
  GhTabs,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/session-context";
import {
  deleteProductsAsync,
  getShopSettings,
  listOrders,
  loadAdminCatalog,
  loadShopSettings,
  newProductId,
  saveProductAsync,
  saveShopSettings,
  updateOrderStatus,
} from "@/lib/shop/store";
import { uploadShopImages } from "@/lib/shop/upload";
import {
  clearYoinxAdminSettings,
  getYoinxAdminSettings,
  saveYoinxAdminSettings,
  type YoinxAdminSettings,
} from "@/lib/shop/yoinx-settings";
import {
  ORDER_STATUSES,
  SHOP_CATEGORIES,
  categoryLabel,
  formatUsd,
  orderStatusLabel,
  slugify,
  type ShopCategory,
  type ShopOrder,
  type ShopOrderStatus,
  type ShopProduct,
  type ShopSettings,
} from "@/lib/shop/types";

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: "2.75rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.45)",
  color: "#ffffff",
  padding: "0 0.75rem",
};

function sizesFromProduct(p: ShopProduct): string {
  return (
    p.variants?.find((v) => v.name.toLowerCase() === "size")?.options.join(", ") ||
    ""
  );
}
function colorsFromProduct(p: ShopProduct): string {
  return (
    p.variants?.find((v) => v.name.toLowerCase() === "color")?.options.join(
      ", ",
    ) || ""
  );
}
function parseOpts(s: string): string[] {
  return s
    .split(/[,/|]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}
function buildVariants(sizes: string, colors: string) {
  const out: { name: string; options: string[] }[] = [];
  const sz = parseOpts(sizes);
  const cl = parseOpts(colors);
  if (sz.length) out.push({ name: "Size", options: sz });
  if (cl.length) out.push({ name: "Color", options: cl });
  return out;
}

export function AdminShopPanel({ isAdmin }: { isAdmin: boolean }) {
  const { principal } = useSession();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(getShopSettings());
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [imageDraft, setImageDraft] = useState("");
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [yoinx, setYoinx] = useState<YoinxAdminSettings>(getYoinxAdminSettings());
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await loadAdminCatalog(principal || "");
    setProducts(res.products);
    setLoadErr(res.error || null);
    setOrders(listOrders());
    setSettings(await loadShopSettings());
    setYoinx(getYoinxAdminSettings());
  }, [principal]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const allSelected = useMemo(
    () => products.length > 0 && selected.size === products.length,
    [products, selected],
  );

  if (!isAdmin) {
    return (
      <GhEmptyState
        icon={ShoppingBag}
        title="Admin only"
        description="Shop management requires platform admin (Supabase) or on-chain AdminMod."
      />
    );
  }

  const startNew = () => {
    const now = new Date().toISOString();
    setEditing({
      id: newProductId(),
      name: "",
      slug: "",
      description: "",
      category: "apparel",
      priceUsd: 34,
      images: [],
      stock: 0,
      published: false,
      createdAt: now,
      updatedAt: now,
    });
    setImageDraft("");
    setSizeDraft("S, M, L, XL, 2XL");
    setColorDraft("Black");
    setTab("products");
  };

  const openEdit = (p: ShopProduct) => {
    setEditing({ ...p });
    setImageDraft("");
    setSizeDraft(sizesFromProduct(p));
    setColorDraft(colorsFromProduct(p));
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!principal) {
      ghToast({ title: "Connect wallet", type: "error" });
      return;
    }
    if (!editing.name.trim()) {
      ghToast({ title: "Name required", type: "error" });
      return;
    }
    if (!editing.images.length) {
      ghToast({ title: "Add at least one image", type: "error" });
      return;
    }
    const price = Math.max(0, Number(editing.priceUsd) || 0);
    if (price <= 0) {
      ghToast({ title: "Price USD required", type: "error" });
      return;
    }
    const variants = buildVariants(sizeDraft, colorDraft);
    setSaving(true);
    try {
      const res = await saveProductAsync(
        {
          ...editing,
          name: editing.name.trim(),
          slug: editing.slug?.trim() || slugify(editing.name),
          priceUsd: price,
          stock: Math.max(0, Math.floor(Number(editing.stock) || 0)),
          images: editing.images.filter(Boolean),
          variants: variants.length ? variants : undefined,
        },
        principal,
      );
      if (!res.ok) {
        ghToast({
          title: "Save failed",
          description:
            res.error ||
            "Need platform admin role + gh_shop_product_rpcs migration",
          type: "error",
        });
        return;
      }
      setEditing(null);
      await reload();
      ghToast({ title: "Product saved to database", type: "success" });
    } finally {
      setSaving(false);
    }
  };

  const addImageUrl = () => {
    const url = imageDraft.trim();
    if (!url || !editing) return;
    setEditing({ ...editing, images: [...editing.images, url] });
    setImageDraft("");
  };

  const onUploadFiles = async (files: FileList | null) => {
    if (!files?.length || !editing) return;
    if (!isSupabaseConfigured()) {
      ghToast({
        title: "Supabase required",
        description: "Set NEXT_PUBLIC_SUPABASE_URL + ANON_KEY and create gh-shop bucket.",
        type: "error",
      });
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadShopImages(files, { productId: editing.id });
      setEditing({ ...editing, images: [...editing.images, ...urls] });
      ghToast({
        title: `Uploaded ${urls.length} image${urls.length === 1 ? "" : "s"}`,
        type: "success",
      });
    } catch (e) {
      ghToast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        type: "error",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const batchDelete = async () => {
    if (!selected.size) return;
    if (!principal) {
      ghToast({ title: "Connect wallet", type: "error" });
      return;
    }
    if (
      !window.confirm(
        `Delete ${selected.size} product${selected.size === 1 ? "" : "s"} from database?`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await deleteProductsAsync([...selected], principal);
      if (!res.ok) {
        ghToast({
          title: "Delete failed",
          description: res.error || "Admin RPC required",
          type: "error",
        });
        return;
      }
      setSelected(new Set());
      if (editing && selected.has(editing.id)) setEditing(null);
      await reload();
      ghToast({ title: `Deleted ${res.deleted}`, type: "info" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack align="stretch" gap="phi3">
      <GhAlert tone="brand" title="Shop admin">
        Catalog loads from Supabase <strong>gh_shop_products</strong> only — no
        mock seed. Images upload to bucket <strong>gh-shop</strong>. Apply
        migrations <code>20260802_gh_shop.sql</code>,{" "}
        <code>gh_shop_storage</code>, and <code>gh_shop_product_rpcs</code>.
        Requires platform <strong>admin</strong> role to write.
      </GhAlert>

      {loadErr ? (
        <GhAlert tone="warning" title="Catalog note">
          {loadErr}
        </GhAlert>
      ) : null}

      <GhTabs
        defaultValue={tab}
        onValueChange={(v) => setTab(v)}
        items={[
          {
            value: "products",
            label: `Products (${products.length})`,
            icon: <ShoppingBag size={14} />,
            content: (
              <VStack align="stretch" gap="phi3" pt="phi3">
                <HStack justify="space-between" flexWrap="wrap" gap="2">
                  <HStack gap="2" flexWrap="wrap">
                    <GhButton
                      size="sm"
                      variant="prize"
                      leftIcon={<Plus size={14} />}
                      onClick={startNew}
                      disabled={saving}
                    >
                      New product
                    </GhButton>
                    <GhButton
                      size="sm"
                      variant="outline"
                      onClick={() => void reload()}
                      disabled={saving}
                    >
                      Refresh DB
                    </GhButton>
                    {selected.size > 0 ? (
                      <GhButton
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => void batchDelete()}
                        disabled={saving}
                      >
                        Delete selected ({selected.size})
                      </GhButton>
                    ) : null}
                  </HStack>
                  <Text fontSize="xs" color="fg.subtle">
                    {isSupabaseConfigured()
                      ? "Supabase ready for uploads"
                      : "Supabase not configured — URL paste only"}
                  </Text>
                </HStack>

                {editing ? (
                  <GhSurface variant="elevated" p="phi4">
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      mb="phi3"
                      color="white"
                    >
                      {editing.name || "New product"}
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3" mb="phi3">
                      <GhField label="Name">
                        <GhInput
                          value={editing.name}
                          onChange={(e) =>
                            setEditing({ ...editing, name: e.target.value })
                          }
                        />
                      </GhField>
                      <GhField label="SKU">
                        <GhInput
                          value={editing.sku || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, sku: e.target.value })
                          }
                        />
                      </GhField>
                      <GhField label="Category">
                        <select
                          value={editing.category}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              category: e.target.value as ShopCategory,
                            })
                          }
                          style={selectStyle}
                        >
                          {SHOP_CATEGORIES.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                              style={{ background: "#0d0b1a" }}
                            >
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </GhField>
                      <GhField label="Price (USD)">
                        <GhInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(editing.priceUsd)}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              priceUsd: parseFloat(e.target.value) || 0,
                            })
                          }
                          tone="prize"
                        />
                      </GhField>
                      <GhField label="Compare-at USD">
                        <GhInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(editing.compareAtUsd ?? "")}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              compareAtUsd: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </GhField>
                      <GhField label="Stock">
                        <GhInput
                          type="number"
                          min="0"
                          value={String(editing.stock)}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              stock: parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </GhField>
                      <GhField label="Size options (comma-separated)">
                        <GhInput
                          value={sizeDraft}
                          onChange={(e) => setSizeDraft(e.target.value)}
                          placeholder="S, M, L, XL, 2XL"
                        />
                      </GhField>
                      <GhField label="Color options (comma-separated)">
                        <GhInput
                          value={colorDraft}
                          onChange={(e) => setColorDraft(e.target.value)}
                          placeholder="Black, Volt"
                        />
                      </GhField>
                      <GhField label="Supplier URL">
                        <GhInput
                          value={editing.supplierUrl || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              supplierUrl: e.target.value,
                            })
                          }
                        />
                      </GhField>
                    </SimpleGrid>

                    <GhField label="Description">
                      <GhTextarea
                        value={editing.description}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            description: e.target.value,
                          })
                        }
                      />
                    </GhField>

                    <Text
                      fontSize="2xs"
                      fontFamily="heading"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="fg.subtle"
                      mt="phi3"
                      mb="2"
                    >
                      Images
                    </Text>
                    <HStack gap="2" mb="2" flexWrap="wrap">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => void onUploadFiles(e.target.files)}
                      />
                      <GhButton
                        size="sm"
                        variant="prize"
                        leftIcon={<Upload size={14} />}
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading…" : "Upload to Supabase"}
                      </GhButton>
                      <Box flex="1" minW="10rem">
                        <GhInput
                          value={imageDraft}
                          onChange={(e) => setImageDraft(e.target.value)}
                          placeholder="Or paste image URL / path"
                        />
                      </Box>
                      <GhButton size="sm" variant="outline" onClick={addImageUrl}>
                        Add URL
                      </GhButton>
                    </HStack>
                    <HStack gap="2" flexWrap="wrap" mb="phi3">
                      {editing.images.map((src, i) => (
                        <Box key={src + i} position="relative">
                          <Box
                            w="16"
                            h="16"
                            borderRadius="lg"
                            overflow="hidden"
                            borderWidth="1px"
                            borderColor="border.default"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                          <GhButton
                            size="sm"
                            variant="ghost"
                            position="absolute"
                            top="-1"
                            right="-1"
                            minW="auto"
                            h="6"
                            px="1"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                images: editing.images.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <Trash2 size={12} />
                          </GhButton>
                        </Box>
                      ))}
                    </HStack>

                    <Text
                      fontSize="2xs"
                      fontFamily="heading"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="fg.subtle"
                      mb="2"
                    >
                      Printer pack (admin only)
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi2" mb="phi3">
                      <GhField label="Print asset URL">
                        <GhInput
                          value={editing.printAssetUrl || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              printAssetUrl: e.target.value,
                            })
                          }
                          placeholder="/shop/print/….svg"
                        />
                      </GhField>
                      <GhField label="Print font family">
                        <GhInput
                          value={editing.printFontFamily || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              printFontFamily: e.target.value,
                            })
                          }
                          placeholder="Orbitron"
                        />
                      </GhField>
                      <GhField label="Print text">
                        <GhInput
                          value={editing.printText || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              printText: e.target.value,
                            })
                          }
                        />
                      </GhField>
                      <GhField label="Print font URL">
                        <GhInput
                          value={editing.printFontUrl || ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              printFontUrl: e.target.value,
                            })
                          }
                        />
                      </GhField>
                    </SimpleGrid>
                    <GhField label="Print notes">
                      <GhTextarea
                        value={editing.printNotes || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            printNotes: e.target.value,
                          })
                        }
                      />
                    </GhField>

                    <HStack gap="phi3" mt="phi3" flexWrap="wrap">
                      <GhSwitch
                        label="Published"
                        checked={editing.published}
                        onCheckedChange={(checked) =>
                          setEditing({
                            ...editing,
                            published: Boolean(checked),
                          })
                        }
                      />
                      <GhSwitch
                        label="Featured"
                        checked={Boolean(editing.featured)}
                        onCheckedChange={(checked) =>
                          setEditing({
                            ...editing,
                            featured: Boolean(checked),
                          })
                        }
                      />
                    </HStack>

                    <HStack gap="2" mt="phi4">
                      <GhButton
                        variant="prize"
                        leftIcon={<Save size={14} />}
                        onClick={() => void saveEdit()}
                        disabled={saving}
                      >
                        {saving ? "Saving…" : "Save product"}
                      </GhButton>
                      <GhButton
                        variant="ghost"
                        onClick={() => setEditing(null)}
                        disabled={saving}
                      >
                        Cancel
                      </GhButton>
                    </HStack>
                  </GhSurface>
                ) : null}

                <HStack gap="2" mb="1">
                  <GhButton size="sm" variant="ghost" onClick={toggleSelectAll}>
                    {allSelected ? "Clear selection" : "Select all"}
                  </GhButton>
                </HStack>

                <VStack align="stretch" gap="2">
                  {products.map((p) => (
                    <GhSurface key={p.id} variant="elevated" p="phi3">
                      <Flex
                        justify="space-between"
                        align="center"
                        gap="3"
                        flexWrap="wrap"
                      >
                        <HStack gap="3" minW="0" flex="1">
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            aria-label={`Select ${p.name}`}
                          />
                          <Box
                            w="12"
                            h="12"
                            borderRadius="lg"
                            overflow="hidden"
                            flexShrink={0}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                p.images[0] || "/brand/gamerholic-mark-128.jpg"
                              }
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                          <Box minW="0">
                            <HStack gap="2" flexWrap="wrap">
                              <Text fontWeight="extrabold" fontSize="sm" color="white">
                                {p.name}
                              </Text>
                              <GhBadge tone={p.published ? "success" : "muted"}>
                                {p.published ? "Live" : "Draft"}
                              </GhBadge>
                              <GhBadge tone="live">
                                {categoryLabel(p.category)}
                              </GhBadge>
                            </HStack>
                            <Text fontSize="2xs" color="fg.subtle">
                              {formatUsd(p.priceUsd)} · stock {p.stock} ·{" "}
                              {p.images.length} img
                            </Text>
                          </Box>
                        </HStack>
                        <HStack gap="2">
                          <GhButton
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </GhButton>
                          <GhButton
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => {
                              void (async () => {
                                if (!principal) {
                                  ghToast({
                                    title: "Connect wallet",
                                    type: "error",
                                  });
                                  return;
                                }
                                if (
                                  !window.confirm(
                                    `Delete “${p.name}” from database?`,
                                  )
                                ) {
                                  return;
                                }
                                setSaving(true);
                                try {
                                  const res = await deleteProductsAsync(
                                    [p.id],
                                    principal,
                                  );
                                  if (!res.ok) {
                                    ghToast({
                                      title: "Delete failed",
                                      description: res.error,
                                      type: "error",
                                    });
                                    return;
                                  }
                                  setSelected((s) => {
                                    const n = new Set(s);
                                    n.delete(p.id);
                                    return n;
                                  });
                                  if (editing?.id === p.id) setEditing(null);
                                  await reload();
                                  ghToast({
                                    title: "Deleted",
                                    type: "info",
                                  });
                                } finally {
                                  setSaving(false);
                                }
                              })();
                            }}
                          >
                            <Trash2 size={14} />
                          </GhButton>
                        </HStack>
                      </Flex>
                    </GhSurface>
                  ))}
                </VStack>
              </VStack>
            ),
          },
          {
            value: "orders",
            label: `Orders (${orders.length})`,
            icon: <Package size={14} />,
            content: (
              <VStack align="stretch" gap="2" pt="phi3">
                {orders.length === 0 ? (
                  <GhEmptyState
                    icon={Package}
                    title="No orders"
                    description="Customer checkouts appear here."
                  />
                ) : (
                  orders.map((o) => (
                    <GhSurface key={o.id} variant="elevated" p="phi3">
                      <HStack
                        justify="space-between"
                        flexWrap="wrap"
                        gap="2"
                        mb="2"
                      >
                        <Box>
                          <Text fontWeight="extrabold" fontSize="sm" color="white">
                            {o.id}
                          </Text>
                          <Text fontSize="2xs" color="fg.subtle">
                            {o.shipping.name} · {o.shipping.email}
                            {o.paidFromPlaySub ? " · paid play sub" : ""}
                          </Text>
                        </Box>
                        <HStack gap="2">
                          <Text
                            className="gh-text-prize"
                            fontWeight="extrabold"
                            fontFamily="heading"
                          >
                            {formatUsd(o.totalUsd)}
                          </Text>
                          <select
                            value={o.status}
                            onChange={(e) => {
                              updateOrderStatus(
                                o.id,
                                e.target.value as ShopOrderStatus,
                              );
                              reload();
                            }}
                            style={{
                              ...selectStyle,
                              width: "auto",
                              minWidth: "10rem",
                            }}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option
                                key={s}
                                value={s}
                                style={{ background: "#0d0b1a" }}
                              >
                                {orderStatusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </HStack>
                      </HStack>
                      <Text fontSize="xs" color="fg.muted">
                        {o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}
                      </Text>
                    </GhSurface>
                  ))
                )}
              </VStack>
            ),
          },
          {
            value: "settings",
            label: "Settings",
            icon: <Settings2 size={14} />,
            content: (
              <VStack align="stretch" gap="phi3" pt="phi3" maxW="32rem">
                <GhSwitch
                  label="Shop open"
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enabled: Boolean(checked) })
                  }
                />
                <GhField label="Banner title">
                  <GhInput
                    value={settings.bannerTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, bannerTitle: e.target.value })
                    }
                  />
                </GhField>
                <GhField label="Banner body">
                  <GhTextarea
                    value={settings.bannerBody}
                    onChange={(e) =>
                      setSettings({ ...settings, bannerBody: e.target.value })
                    }
                  />
                </GhField>
                <GhField label="Shipping blurb">
                  <GhTextarea
                    value={settings.shippingBlurb}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shippingBlurb: e.target.value,
                      })
                    }
                  />
                </GhField>
                <GhButton
                  variant="prize"
                  leftIcon={<Save size={14} />}
                  onClick={() => {
                    saveShopSettings(settings);
                    ghToast({ title: "Settings saved", type: "success" });
                  }}
                >
                  Save settings
                </GhButton>
              </VStack>
            ),
          },
          {
            value: "yoinx",
            label: "Yoinx",
            icon: <KeyRound size={14} />,
            content: (
              <VStack align="stretch" gap="phi3" pt="phi3" maxW="36rem">
                <GhAlert tone="attr" title="Any Yoinx business">
                  Get site key + business id from Yoinx Profile → Businesses →
                  Yoinx! button. Overrides env for this browser (localStorage).
                </GhAlert>
                <GhField label="Yoinx API URL">
                  <GhInput
                    value={yoinx.apiUrl}
                    onChange={(e) =>
                      setYoinx({ ...yoinx, apiUrl: e.target.value })
                    }
                    placeholder="http://localhost:3030 or https://yoinx.fun"
                  />
                </GhField>
                <GhField label="Yoinx App URL">
                  <GhInput
                    value={yoinx.appUrl}
                    onChange={(e) =>
                      setYoinx({ ...yoinx, appUrl: e.target.value })
                    }
                    placeholder="Play links base"
                  />
                </GhField>
                <GhField label="Site key (publishable)">
                  <GhInput
                    value={yoinx.siteKey}
                    onChange={(e) =>
                      setYoinx({ ...yoinx, siteKey: e.target.value })
                    }
                    placeholder="yx_pk_…"
                  />
                </GhField>
                <GhField label="Business ID">
                  <GhInput
                    value={yoinx.businessId}
                    onChange={(e) =>
                      setYoinx({ ...yoinx, businessId: e.target.value })
                    }
                    placeholder="UUID from Yoinx businesses"
                  />
                </GhField>
                <HStack gap="2" flexWrap="wrap">
                  <GhButton
                    variant="prize"
                    leftIcon={<Save size={14} />}
                    onClick={() => {
                      saveYoinxAdminSettings(yoinx);
                      ghToast({
                        title: "Yoinx settings saved",
                        description: "Used for product-page Yoinx! button",
                        type: "success",
                      });
                    }}
                  >
                    Save Yoinx settings
                  </GhButton>
                  <GhButton
                    variant="ghost"
                    onClick={() => {
                      clearYoinxAdminSettings();
                      setYoinx(getYoinxAdminSettings());
                      ghToast({ title: "Cleared — using env defaults", type: "info" });
                    }}
                  >
                    Clear overrides
                  </GhButton>
                </HStack>
              </VStack>
            ),
          },
        ]}
      />
    </VStack>
  );
}
