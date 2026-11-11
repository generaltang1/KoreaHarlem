"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function AppError({
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
    <>
      <Header />
      <main>
        <ErrorScreen
          variant="500"
          errorCode={error.digest || error.name || "ERROR"}
          onRetry={reset}
        />
      </main>
      <Footer />
    </>
  );
}
