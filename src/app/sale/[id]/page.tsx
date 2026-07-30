import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductDetailClient } from "@/components/commerce/ProductDetailClient";
import { fetchProductDetail } from "@/lib/fetchProductDetail";

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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 pb-24 md:px-6">
        <ProductDetailClient product={product} initialWishlisted={wishlisted} isLoggedIn={!!user} />
      </main>
      <Footer />
    </>
  );
}
