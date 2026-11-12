import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { WishlistRemoveButton } from "@/components/mypage/WishlistRemoveButton";
import { createClient } from "@/lib/supabase/server";
import { mp } from "@/lib/mypageTheme";

type WishRow = {
  id: string;
  created_at: string;
  product_id: string;
  products: {
    id: string;
    title: string;
    title_en: string | null;
    price: number;
    category: string | null;
    is_published: boolean | null;
    product_images: { url: string; sort_order: number | null }[] | null;
  } | null;
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mypage/wishlist");

  const { data: rows } = await supabase
    .from("wishlist_items")
    .select(
      "id, created_at, product_id, products(id, title, title_en, price, category, is_published, product_images(url, sort_order))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = ((rows ?? []) as unknown as WishRow[]).filter(
    (r) => r.products && r.products.is_published !== false,
  );

  return (
    <MypageShell title="위시리스트" subtitle={`찜한 상품 ${items.length}`}>
      {items.length === 0 ? (
        <div className={`${mp.card} px-6 py-16 text-center`}>
          <p className={`text-sm ${mp.muted}`}>위시리스트가 비어 있습니다.</p>
          <Link href="/sale" className={`mt-6 ${mp.creamBtn}`}>
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <ul className={`${mp.card} divide-y divide-[#262626]`}>
          {items.map((row) => {
            const product = row.products!;
            const images = [...(product.product_images ?? [])].sort(
              (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
            );
            const imageUrl = images[0]?.url ?? null;
            return (
              <li key={row.id} className="flex gap-4 px-4 py-4 sm:px-5">
                <Link
                  href={`/sale/${product.id}`}
                  className="relative h-24 w-[72px] shrink-0 overflow-hidden bg-[#0c0c0c]"
                >
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.title} fill className="object-cover" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  {product.category ? (
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                      {product.category}
                    </p>
                  ) : null}
                  <Link href={`/sale/${product.id}`} className="mt-0.5 block truncate text-sm font-semibold hover:underline">
                    {product.title}
                  </Link>
                  {product.title_en ? (
                    <p className="mt-0.5 truncate text-xs text-neutral-500">{product.title_en}</p>
                  ) : null}
                  <p className="mt-2 text-sm">₩{Number(product.price).toLocaleString("ko-KR")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/sale/${product.id}`}
                      className="border border-[#333] px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500"
                    >
                      상품 보기
                    </Link>
                    <WishlistRemoveButton wishlistId={row.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </MypageShell>
  );
}
