import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { aiService } from "~/server/services/openai";

export const postRouter = createTRPCRouter({
  // Create post in thread
  create: protectedProcedure
    .input(
      z.object({
        threadId: z.string().optional(),
        guildId: z.string().optional(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify thread or guild exists and user has access
      if (input.threadId) {
        const thread = await ctx.db.thread.findUnique({
          where: { id: input.threadId },
          include: {
            channel: {
              include: {
                guild: true,
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

        if (thread.isLocked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Thread is locked",
          });
        }

        // Verify membership
        const membership = await ctx.db.membership.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.session.user.id,
              guildId: thread.channel.guild.id,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not a member of this guild",
          });
        }
      } else if (input.guildId) {
        // Verify membership
        const membership = await ctx.db.membership.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.session.user.id,
              guildId: input.guildId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not a member of this guild",
          });
        }
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either threadId or guildId must be provided",
        });
      }

      const post = await ctx.db.post.create({
        data: {
          content: input.content,
          authorId: ctx.session.user.id,
          threadId: input.threadId,
          guildId: input.guildId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reactions: true,
        },
      });

      return post;
    }),

  // Update post
  update: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Only author can update
      if (post.authorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own posts",
        });
      }

      return ctx.db.post.update({
        where: { id: input.postId },
        data: {
          content: input.content,
        },
      });
    }),

  // Delete post
  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        include: {
          thread: {
            include: {
              channel: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Can delete if: author OR admin/elder
      const isAuthor = post.authorId === ctx.session.user.id;
      let isAdminOrElder = false;

      if (post.thread) {
        const membership = await ctx.db.membership.findUnique({
          where: {
            userId_guildId: {
              userId: ctx.session.user.id,
              guildId: post.thread.channel.guildId,
            },
          },
        });

        isAdminOrElder =
          membership?.role === "ADMIN" || membership?.role === "ELDER";
      }

      if (!isAuthor && !isAdminOrElder) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts",
        });
      }

      await ctx.db.post.delete({
        where: { id: input.postId },
      });

      return { success: true };
    }),

  // Generate AI summary for thread
  summarizeThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          posts: {
            include: {
              author: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          channel: {
            include: {
              guild: true,
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

      // Verify membership
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: thread.channel.guild.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this guild",
        });
      }

      if (thread.posts.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Thread must have at least 3 posts to summarize",
        });
      }

      const summary = await aiService.summarizeThread(thread.posts);

      return { summary };
    }),

  // Generate weekly highlights for guild
  generateWeeklyHighlights: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin/elder
      const membership = await ctx.db.membership.findUnique({
        where: {
          userId_guildId: {
            userId: ctx.session.user.id,
            guildId: input.guildId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "ADMIN" && membership.role !== "ELDER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and elders can generate highlights",
        });
      }

      // Get posts from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const posts = await ctx.db.post.findMany({
        where: {
          guildId: input.guildId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        include: {
          author: {
            select: {
              name: true,
            },
          },
          reactions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Limit to top 50 posts
      });

      if (posts.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No posts from the last week to generate highlights",
        });
      }

      const highlightsContent = await aiService.generateWeeklyHighlights(posts);

      // Create pinned post with highlights
      const highlightPost = await ctx.db.post.create({
        data: {
          content: highlightsContent,
          authorId: ctx.session.user.id,
          guildId: input.guildId,
          isPinned: true,
          isAiHighlight: true,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return highlightPost;
    }),
});
