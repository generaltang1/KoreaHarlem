import { Suspense } from "react";
import { ThinkShell } from "@/components/think/ThinkShell";
import { ThinkBoard } from "@/components/think/ThinkBoard";
import { mp } from "@/lib/mypageTheme";

export default function ThinkPage() {
  return (
    <ThinkShell>
      <Suspense fallback={<p className={`text-center text-sm ${mp.muted}`}>불러오는 중…</p>}>
        <ThinkBoard />
      </Suspense>
    </ThinkShell>
  );
}
