import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const threadRouter = createTRPCRouter({
  // Get thread by slug
  getBySlug: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.findUnique({
        where: {
          channelId_slug: {
            channelId: input.channelId,
            slug: input.slug,
          },
        },
        include: {
          channel: {
            include: {
              guild: true,
            },
          },
          posts: {
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Increment view count
      await ctx.db.thread.update({
        where: { id: thread.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return thread;
    }),

  // Create thread
  create: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: { id: input.channelId },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Verify membership
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: channel.guildId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this guild",
        });
      }

      // Create thread with first post
      const thread = await ctx.db.thread.create({
        data: {
          title: input.title,
          slug: input.slug,
          channelId: input.channelId,
          posts: {
            create: {
              content: input.content,
              authorId: ctx.session.user.id,
            },
          },
        },
        include: {
          posts: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return thread;
    }),

  // Pin/unpin thread (admin/elder only)
  togglePin: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          channel: true,
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Check permission
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: thread.channel.guildId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "ADMIN" && membership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can pin threads",
        });
      }

      return ctx.db.thread.update({
        where: { id: input.threadId },
        data: {
          isPinned: !thread.isPinned,
        },
      });
    }),

  // Lock/unlock thread (admin/elder only)
  toggleLock: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          channel: true,
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      // Check permission
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: thread.channel.guildId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "ADMIN" && membership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can lock threads",
        });
      }

      return ctx.db.thread.update({
        where: { id: input.threadId },
        data: {
          isLocked: !thread.isLocked,
        },
      });
    }),
});
