"use client";

import { useEffect } from "react";

export function MagazineViewTracker({ slugOrId }: { slugOrId: string }) {
  useEffect(() => {
    const key = `mag_view_${slugOrId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void fetch(`/api/magazine/${encodeURIComponent(slugOrId)}/view`, {
      method: "POST",
    });
  }, [slugOrId]);
  return null;
}
