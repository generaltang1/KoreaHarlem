"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProductAvailability,
  type ProductAvailability,
} from "@/lib/cartAvailability";

export function useCartProductAvailability(productIds: string[], enabled = true) {
  const idsKey = useMemo(() => [...new Set(productIds.filter(Boolean))].sort().join(","), [productIds]);
  const [availability, setAvailability] = useState<Map<string, ProductAvailability>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !idsKey) {
      setAvailability(new Map());
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    setLoading(true);

    fetchProductAvailability(supabase, idsKey.split(",")).then((map) => {
      if (!cancelled) {
        setAvailability(map);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [idsKey, enabled]);

  return { availability, loading };
}
