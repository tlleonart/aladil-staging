import { contactRouter } from "@/modules/contact/server/router";
import { executiveRouter } from "@/modules/executive/server/router";
import { labsRouter } from "@/modules/labs/server/router";
import { meetingsRouter } from "@/modules/meetings/server/router";
import { newsRouter } from "@/modules/news/server/router";
import { usersRouter } from "@/modules/users/server/router";
import { publicProcedure } from "./server";

// Placeholder health check
const health = publicProcedure.handler(async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// App router - combines all feature routers
export const appRouter = {
  health,
  news: newsRouter,
  meetings: meetingsRouter,
  labs: labsRouter,
  executive: executiveRouter,
  users: usersRouter,
  contact: contactRouter,
};

export type AppRouter = typeof appRouter;
