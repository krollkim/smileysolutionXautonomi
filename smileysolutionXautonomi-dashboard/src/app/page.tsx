import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    redirect("/inbox");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  redirect("/inbox");
}
