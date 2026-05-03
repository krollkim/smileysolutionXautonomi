import { router } from "@/server/trpc";
import { contentRouter } from "@/server/routers/content";
import { personasRouter } from "@/server/routers/personas";
import { analyticsRouter } from "@/server/routers/analytics";

export const appRouter = router({
  content: contentRouter,
  personas: personasRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
