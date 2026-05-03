import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const clientPersonaSchema = z.enum([
  "analytical_ceo",
  "dreamer_founder",
  "creative_director",
  "growth_hacker",
  "lifestyle_visionary",
]);

export const personasRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("personas")
      .select("*")
      .order("key");

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data ?? [];
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        key: clientPersonaSchema,
        name: z.string().min(1),
        toneProfile: z.string().min(1),
        targetPain: z.string().min(1),
        exampleHook: z.string().min(1),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("personas")
        .upsert(
          {
            key: input.key,
            name: input.name,
            tone_profile: input.toneProfile,
            target_pain: input.targetPain,
            example_hook: input.exampleHook,
            color: input.color,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )
        .select()
        .single();

      if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message });
      return data;
    }),
});
