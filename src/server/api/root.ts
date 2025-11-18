import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { guildRouter } from "./routers/guild";
import { membershipRouter } from "./routers/membership";
import { channelRouter } from "./routers/channel";
import { threadRouter } from "./routers/thread";
import { postRouter } from "./routers/post";
import { questRouter } from "./routers/quest";
import { reactionRouter } from "./routers/reaction";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  guild: guildRouter,
  membership: membershipRouter,
  channel: channelRouter,
  thread: threadRouter,
  post: postRouter,
  quest: questRouter,
  reaction: reactionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
