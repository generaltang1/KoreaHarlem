"use client";

import { useRouter } from "next/navigation";
import { ThinkPostEditor, type ThinkPostEditorInitial } from "@/components/think/ThinkPostEditor";

export function ThinkEditClient({
  isAdmin,
  memberNickname,
  initial,
}: {
  isAdmin: boolean;
  memberNickname: string;
  initial: ThinkPostEditorInitial;
}) {
  const router = useRouter();

  return (
    <ThinkPostEditor
      mode="edit"
      isLoggedIn
      isAdmin={isAdmin}
      memberNickname={memberNickname}
      initial={initial}
      onSuccess={(postId) => {
        router.push(`/think/${postId}`);
        router.refresh();
      }}
    />
  );
}
