import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";

export { createServiceClient } from "@/lib/supabase/service";

/** Admin layout guard — redirects non-admins to home. */
export async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");
}
