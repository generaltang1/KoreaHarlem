"use client";

import { Suspense } from "react";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { SearchBox } from "@/components/ui/SearchBox";

interface ListToolbarProps {
  searchPlaceholder?: string;
  preserveParams?: string[];
}

function ListToolbarInner({
  searchPlaceholder,
  preserveParams = ["size", "category", "sub"],
}: ListToolbarProps) {
  const sizePreserve = preserveParams.filter((p) => p !== "size");
  const searchPreserve = preserveParams.filter((p) => p !== "q");

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <PageSizeSelect preserveParams={sizePreserve} />
      <SearchBox placeholder={searchPlaceholder} preserveParams={searchPreserve} />
    </div>
  );
}

export function ListToolbar(props: ListToolbarProps) {
  return (
    <Suspense fallback={<div className="mb-6 h-10" />}>
      <ListToolbarInner {...props} />
    </Suspense>
  );
}
