import { redirect } from "next/navigation";

/** H-01 대시보드는 /admin/dashboard */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
