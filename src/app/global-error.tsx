"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="bg-[#0a0a0a] text-[#F4F1EA] antialiased">
        <ErrorScreen
          variant="500"
          errorCode={error.digest || error.name || "GLOBAL"}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
