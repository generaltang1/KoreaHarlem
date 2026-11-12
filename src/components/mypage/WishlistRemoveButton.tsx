"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mp } from "@/lib/mypageTheme";

export function WishlistRemoveButton({ wishlistId }: { wishlistId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("wishlist_items").delete().eq("id", wishlistId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleRemove}
      className={`${mp.pill} text-[#a8a49b] hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50`}
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
