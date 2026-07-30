import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { HomeSections } from "@/components/home/HomeSections";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithImages } from "@/lib/products";

async function getHomeProducts(): Promise<ProductWithImages[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error("getHomeProducts:", error.message);
      return [];
    }

    return (data ?? []) as ProductWithImages[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getHomeProducts();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeSections products={products} />
      </main>
      <Footer />
    </>
  );
}
