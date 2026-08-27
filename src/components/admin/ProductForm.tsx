"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_PRODUCT_IMAGES, uploadProductImage } from "@/lib/productImages";
import { fetchSizeStockMap, saveProductSizeStocks, syncSizeStockKeys } from "@/lib/productSizeStock";
import { parseSizeGuide, type SizeGuideData } from "@/lib/sizeGuide";
import { SizeGuideEditor } from "@/components/admin/SizeGuideEditor";
import { ProductAddonSelect } from "@/components/admin/ProductAddonSelect";
import {
  MERCH_SUBCATEGORIES,
  PRODUCT_CATEGORIES,
  productCategoryLabel,
  type ProductMerchSubcategory,
  type ProductStoreCategory,
} from "@/lib/productCategories";

interface ExistingImage {
  id: string;
  url: string;
  sort_order: number;
}

interface AddonOption {
  id: string;
  title: string;
  price_krw: number;
  image_url: string | null;
  sizes: string[];
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

async function saveProductAddons(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  addonIds: string[],
) {
  await supabase.from("product_addons").delete().eq("product_id", productId);
  if (addonIds.length === 0) return;
  const { error } = await supabase.from("product_addons").insert(
    addonIds.map((addonId, i) => ({
      product_id: productId,
      addon_product_id: addonId,
      sort_order: i,
    })),
  );
  if (error) throw error;
}

export function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceKrw, setPriceKrw] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [sizeStocks, setSizeStocks] = useState<Record<string, string>>({ "": "10" });
  const [sizes, setSizes] = useState("S,M,L");
  const [shippingFee, setShippingFee] = useState("4000");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("50000");
  const [overseasShipping, setOverseasShipping] = useState(false);
  const [sizeGuideEnabled, setSizeGuideEnabled] = useState(false);
  const [sizeGuide, setSizeGuide] = useState<SizeGuideData | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<AddonOption[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isSale, setIsSale] = useState(true);
  const [showStock, setShowStock] = useState(true);
  const [category, setCategory] = useState<ProductStoreCategory | "">("");
  const [subcategory, setSubcategory] = useState<ProductMerchSubcategory | "">("");
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sizeList = useMemo(
    () =>
      sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [sizes],
  );

  const stockSizeKeys = useMemo(() => (sizeList.length > 0 ? sizeList : [""]), [sizeList]);

  useEffect(() => {
    setSizeStocks((prev) => {
      const next: Record<string, string> = {};
      for (const key of stockSizeKeys) {
        next[key] = prev[key] ?? "0";
      }
      return next;
    });
  }, [stockSizeKeys]);

  const keptExisting = useMemo(
    () => existingImages.filter((img) => !removedImageIds.includes(img.id)),
    [existingImages, removedImageIds],
  );
  const totalImages = keptExisting.length + newFiles.length;
  const canAddMore = totalImages < MAX_PRODUCT_IMAGES;

  useEffect(() => {
    const loadCatalog = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, price_krw, sizes, product_images(url, sort_order)")
        .order("title");
      setAllProducts(
        (data ?? []).map((p) => {
          const imgs = [...(p.product_images ?? [])].sort(
            (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
          );
          return {
            id: p.id,
            title: p.title,
            price_krw: p.price_krw,
            sizes: p.sizes ?? [],
            image_url: imgs[0]?.url ?? null,
          };
        }),
      );
    };
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;

    const load = async () => {
      setLoading(true);
      setError("");

      const [{ data, error: fetchError }, { data: addonRows }] = await Promise.all([
        supabase.from("products").select("*, product_images(*)").eq("id", productId).single(),
        supabase.from("product_addons").select("addon_product_id").eq("product_id", productId),
      ]);

      if (fetchError || !data) {
        setError("상품 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setDescription(data.description ?? "");
      setPriceKrw(String(data.price_krw));
      setCompareAt(data.compare_at_price_krw != null ? String(data.compare_at_price_krw) : "");
      const loadedStocks = await fetchSizeStockMap(supabase, productId);
      const keys = (data.sizes ?? []).length > 0 ? (data.sizes as string[]) : [""];
      const stockMap: Record<string, string> = {};
      for (const key of keys) {
        stockMap[key] = String(loadedStocks[key] ?? 0);
      }
      setSizeStocks(stockMap);
      setSizes((data.sizes ?? []).join(","));
      setShippingFee(String(data.shipping_fee_krw ?? 4000));
      setFreeShippingThreshold(
        data.free_shipping_threshold_krw != null ? String(data.free_shipping_threshold_krw) : "",
      );
      setOverseasShipping(data.overseas_shipping ?? false);
      const sg = parseSizeGuide(data.size_guide);
      setSizeGuideEnabled(!!sg);
      setSizeGuide(sg);
      setSelectedAddonIds((addonRows ?? []).map((r) => r.addon_product_id));
      setIsPublished(data.is_published);
      setIsSale(data.is_sale);
      setShowStock(data.show_stock ?? true);
      setCategory((data.category as ProductStoreCategory) ?? "merch");
      setSubcategory((data.subcategory as ProductMerchSubcategory) ?? "");
      setExistingImages(
        [...(data.product_images ?? [])].sort(
          (a: ExistingImage, b: ExistingImage) => a.sort_order - b.sort_order,
        ),
      );
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const slots = MAX_PRODUCT_IMAGES - totalImages;
    const toAdd = picked.slice(0, slots);
    if (toAdd.length < picked.length) {
      setError(`이미지는 최대 ${MAX_PRODUCT_IMAGES}개까지 등록할 수 있습니다.`);
    } else {
      setError("");
    }

    setNewFiles((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removeExisting = (id: string) => {
    setRemovedImageIds((prev) => [...prev, id]);
  };

  const removeNew = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (totalImages === 0) {
      setError("이미지를 1개 이상 등록해주세요.");
      return;
    }

    const price = Number.parseInt(priceKrw, 10);
    if (!Number.isFinite(price) || price < 0) {
      setError("가격(KRW)을 확인해주세요.");
      return;
    }

    if (!category) {
      setError("In Store 카테고리를 선택해주세요.");
      return;
    }
    if (category === "merch" && !subcategory) {
      setError("Merch 서브카테고리(Tops/Bottoms/Accessory)를 선택해주세요.");
      return;
    }

    setSaving(true);
    try {
      const stockValues: Record<string, number> = {};
      for (const key of stockSizeKeys) {
        stockValues[key] = Math.max(0, Number.parseInt(sizeStocks[key] ?? "0", 10) || 0);
      }
      const totalStockValue = Object.values(stockValues).reduce((sum, n) => sum + n, 0);

      // Cafe24형: 신규 등록만 절대값 초기 재고를 저장. 수정 시에는 재고 컬럼을 건드리지 않고
      // 아래 StockAdjustPanel의 수기 조정(±·이력)만으로 재고를 변경한다.
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        price_krw: price,
        compare_at_price_krw: compareAt ? Number.parseInt(compareAt, 10) : null,
        sizes: sizeList,
        shipping_fee_krw: Number.parseInt(shippingFee, 10) || 0,
        free_shipping_threshold_krw: freeShippingThreshold
          ? Number.parseInt(freeShippingThreshold, 10)
          : null,
        overseas_shipping: overseasShipping,
        size_guide: sizeGuideEnabled && sizeGuide ? sizeGuide : null,
        is_sale: isSale,
        is_published: isPublished,
        show_stock: showStock,
        category,
        subcategory: category === "merch" ? subcategory : null,
      };
      if (mode === "create") {
        payload.stock = totalStockValue;
      }

      let id = productId;

      if (mode === "create") {
        const { data: product, error: insertError } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (insertError || !product) throw insertError ?? new Error("상품 생성 실패");
        id = product.id;

        for (let i = 0; i < newFiles.length; i++) {
          await uploadProductImage(supabase, product.id, newFiles[i], i);
        }
      } else if (id) {
        const { error: updateError } = await supabase.from("products").update(payload).eq("id", id);
        if (updateError) throw updateError;

        if (removedImageIds.length > 0) {
          const { error: delError } = await supabase
            .from("product_images")
            .delete()
            .in("id", removedImageIds);
          if (delError) throw delError;
        }

        let nextOrder = keptExisting.length;
        for (const file of newFiles) {
          await uploadProductImage(supabase, id, file, nextOrder);
          nextOrder += 1;
        }
      }

      if (id) {
        try {
          if (mode === "create") {
            await saveProductSizeStocks(supabase, id, sizeList, stockValues);
          } else {
            // 수정 시에는 재고 절대값을 덮어쓰지 않고 사이즈 키만 동기화(신규 사이즈는 0, 재고 있는 사이즈는 삭제 불가)
            await syncSizeStockKeys(supabase, id, sizeList);
          }
        } catch (stockKeyError) {
          if (mode === "edit") {
            throw stockKeyError;
          }
          /* product_size_stock table may not exist yet (create mode) */
        }
        try {
          await saveProductAddons(supabase, id, selectedAddonIds);
        } catch {
          /* product_addons table may not exist yet */
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">불러오는 중...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">상품명 *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full resize-none border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div className="grid gap-4 border border-border p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
            In Store 카테고리 *
          </label>
          <select
            value={category}
            onChange={(e) => {
              const next = e.target.value as ProductStoreCategory | "";
              setCategory(next);
              if (next !== "merch") setSubcategory("");
            }}
            required
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          >
            <option value="">선택</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {category === "merch" && (
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
              Merch 서브카테고리 *
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value as ProductMerchSubcategory | "")}
              required
              className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
            >
              <option value="">선택</option>
              {MERCH_SUBCATEGORIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {category && category !== "merch" && (
          <p className="self-end text-xs text-muted sm:col-span-2">
            {productCategoryLabel(category)} 상품은 서브카테고리가 없습니다.
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">판매가 (KRW) *</label>
          <input
            value={priceKrw}
            onChange={(e) => setPriceKrw(e.target.value)}
            required
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">정가 (KRW, 할인 표시용)</label>
          <input
            value={compareAt}
            onChange={(e) => setCompareAt(e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">
          사이즈 (콤마 구분)
        </label>
        <input
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          placeholder="S (95),M (105),L (110)"
        />
        <p className="mt-1 text-[10px] text-muted">사이즈를 비우면 단일 재고로 관리됩니다.</p>
      </div>

      <div className="border border-border p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted">
          사이즈별 재고 {mode === "edit" && "(읽기 전용)"}
        </p>
        {mode === "create" ? (
          <>
            <p className="mt-1 text-[10px] text-muted">
              최초 등록 시에만 절대값으로 초기 재고를 입력합니다. 등록 후 재고 변경은 상품 수정 화면
              하단의 수기 조정을 사용하세요 (Cafe24 방식).
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {stockSizeKeys.map((key) => (
                <div key={key || "__default"}>
                  <label className="mb-1.5 block text-xs text-muted">
                    {key || "단일 (사이즈 없음)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sizeStocks[key] ?? "0"}
                    onChange={(e) =>
                      setSizeStocks((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-[10px] text-muted">
              현재 재고는 참고용으로만 표시됩니다. 이 화면 저장으로는 재고가 바뀌지 않으며, 변경은
              하단의 「재고 수기 조정」(±수량·사유·이력)에서만 처리됩니다.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {stockSizeKeys.map((key) => (
                <div
                  key={key || "__default"}
                  className="border border-border bg-neutral-50 px-4 py-3 text-sm"
                >
                  <span className="text-xs text-muted">{key || "단일 (사이즈 없음)"}</span>
                  <span className="ml-2 font-medium">{sizeStocks[key] ?? "0"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 border border-border p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">배송비 (KRW)</label>
          <input
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted">무료배송 기준 (KRW)</label>
          <input
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            placeholder="비우면 항상 배송비 부과"
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={overseasShipping}
            onChange={(e) => setOverseasShipping(e.target.checked)}
          />
          <span>해외배송 가능 상품</span>
        </label>
      </div>

      <SizeGuideEditor
        enabled={sizeGuideEnabled}
        onEnabledChange={setSizeGuideEnabled}
        sizes={sizeList}
        guide={sizeGuide}
        onChange={setSizeGuide}
      />

      <ProductAddonSelect
        allProducts={allProducts}
        selectedIds={selectedAddonIds}
        onChange={setSelectedAddonIds}
        excludeId={productId}
      />

      <div className="border border-border p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted">표시 설정</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-xs font-medium">진열상태</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isPublished"
                  checked={isPublished}
                  onChange={() => setIsPublished(true)}
                />
                진열함
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isPublished"
                  checked={!isPublished}
                  onChange={() => setIsPublished(false)}
                />
                진열안함
              </label>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              진열안함이면 In Store에 노출되지 않습니다.
            </p>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-medium">판매상태</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isSale"
                  checked={isSale}
                  onChange={() => setIsSale(true)}
                />
                판매함
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isSale"
                  checked={!isSale}
                  onChange={() => setIsSale(false)}
                />
                판매안함
              </label>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              판매안함이면 상품은 보이지만 구매할 수 없습니다 (티켓·프리오더 등).
            </p>
          </fieldset>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-medium">재고표시상태</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="showStock"
                  checked={showStock}
                  onChange={() => setShowStock(true)}
                />
                표시함
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="showStock"
                  checked={!showStock}
                  onChange={() => setShowStock(false)}
                />
                표시안함
              </label>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              표시안함이면 구매자 상품 상세에 남은 재고 수량이 보이지 않습니다. (품절은 그대로
              표시)
            </p>
          </fieldset>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-widest text-muted">
            이미지 * (최대 {MAX_PRODUCT_IMAGES}개, 첫 번째가 대표)
          </label>
          <span className="text-[10px] text-muted">
            {totalImages}/{MAX_PRODUCT_IMAGES}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {keptExisting.map((img) => (
            <div key={img.id} className="relative aspect-square border border-border bg-neutral-50">
              <Image src={img.url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(img.id)}
                className="absolute right-1 top-1 bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
              >
                삭제
              </button>
            </div>
          ))}
          {newPreviews.map((preview, index) => (
            <div key={preview} className="relative aspect-square border border-border bg-neutral-50">
              <Image src={preview} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeNew(index)}
                className="absolute right-1 top-1 bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        {canAddMore && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddFiles}
            className="mt-3 w-full border border-border px-4 py-3 text-sm"
          />
        )}
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-foreground py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
        >
          {saving ? "저장 중..." : mode === "create" ? "상품 등록" : "변경 저장"}
        </button>
        <Link
          href="/admin/products"
          className="flex items-center justify-center border border-border px-6 py-3 text-xs uppercase tracking-widest text-muted"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
