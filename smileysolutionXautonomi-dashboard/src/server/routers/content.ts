import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const contentStatusSchema = z.enum([
  "inbox",
  "starred",
  "draft",
  "approved",
  "produced",
  "published",
  "archived",
]);

const clientPersonaSchema = z.enum([
  "analytical_ceo",
  "dreamer_founder",
  "creative_director",
  "growth_hacker",
  "lifestyle_visionary",
]);

export const contentRouter = router({
  // List content by status
  list: protectedProcedure
    .input(
      z.object({
        status: contentStatusSchema.optional(),
        statuses: z.array(contentStatusSchema).optional(),
        persona: clientPersonaSchema.optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("content_pieces")
        .select("*")
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.statuses && input.statuses.length > 0) {
        query = query.in("status", input.statuses);
      } else if (input.status) {
        query = query.eq("status", input.status);
      }
      if (input.persona) {
        query = query.eq("client_persona", input.persona);
      }

      const { data, error, count } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return { items: data ?? [], total: count ?? 0 };
    }),

  // Get single content piece
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("content_pieces")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error || !data) throw new TRPCError({ code: "NOT_FOUND" });
      return data;
    }),

  // Transition status (the core curation action)
  transition: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: contentStatusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("content_pieces")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .select()
        .single();

      if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message });

      // Log the transition
      await ctx.supabase.from("pipeline_logs").insert({
        content_id: input.id,
        event: input.status === "archived" ? "rejected" : input.status,
        payload: { transitioned_by: ctx.user.id },
      });

      return data;
    }),

  // Update copy fields
  updateCopy: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        feedCopyEn: z.string().optional(),
        storiesScriptHe: z.string().optional(),
        visualDirection: z.string().optional(),
        clientPersona: clientPersonaSchema.optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (fields.feedCopyEn !== undefined) updatePayload.feed_copy_en = fields.feedCopyEn;
      if (fields.storiesScriptHe !== undefined) updatePayload.stories_script_he = fields.storiesScriptHe;
      if (fields.visualDirection !== undefined) updatePayload.visual_direction = fields.visualDirection;
      if (fields.clientPersona !== undefined) updatePayload.client_persona = fields.clientPersona;
      if (fields.tags !== undefined) updatePayload.tags = fields.tags;

      const { data, error } = await ctx.supabase
        .from("content_pieces")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message });
      return data;
    }),

  // Inbox counts by filter
  inboxCounts: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("content_pieces")
      .select("status, created_at")
      .in("status", ["inbox", "starred"]);

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const counts = { all: 0, starred: 0, today: 0 };
    const today = new Date().toDateString();

    (data ?? []).forEach((row: { status: string; created_at: string }) => {
      counts.all++;
      if (row.status === "starred") counts.starred++;
      if (new Date(row.created_at).toDateString() === today) counts.today++;
    });

    return counts;
  }),
});
