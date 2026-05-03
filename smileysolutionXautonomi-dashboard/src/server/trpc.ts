import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import superjson from "superjson";
import type { User } from "@supabase/supabase-js";

export async function createTRPCContext() {
  // Dev bypass — skips email auth so you can develop without a Supabase session.
  // Enable with NEXT_PUBLIC_DEV_BYPASS_AUTH=true in .env.local
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const devUser = { id: "dev-bypass", email: "dev@local.dev" } as unknown as User;
    return { supabase, user: devUser };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
