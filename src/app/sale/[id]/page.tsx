import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { ProductDetailClient } from "@/components/commerce/ProductDetailClient";
import { fetchProductDetail } from "@/lib/fetchProductDetail";
import { isCurrentUserAdmin } from "@/lib/auth/session";
import { fetchSizeStockMaps } from "@/lib/productSizeStock";
import type { ProductWithImages } from "@/lib/products";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await fetchProductDetail(supabase, id);

  if (!product) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wishlisted = false;
  if (user) {
    const { data: wish } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle();
    wishlisted = !!wish;
  }

  const isAdmin = user ? await isCurrentUserAdmin() : false;

  const { data: relatedRaw } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_published", true)
    .eq("category", product.category)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const relatedRows = (relatedRaw ?? []) as ProductWithImages[];
  const stockMaps = await fetchSizeStockMaps(
    supabase,
    relatedRows.map((p) => p.id),
  );
  const relatedProducts = relatedRows.map((p) => ({
    ...p,
    sizeStocks: stockMaps.get(p.id) ?? {},
  }));

  return (
    <>
      <Header />
      <CommerceAtmosphere className="px-4 py-10 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <ProductDetailClient
            product={product}
            initialWishlisted={wishlisted}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
            relatedProducts={relatedProducts}
          />
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
